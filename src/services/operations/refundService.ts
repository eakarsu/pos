import { Prisma, PrismaClient } from '@prisma/client';
import { appendOperationalAudit } from './audit';
import { OperationsError } from './errors';
import { terminalGateway } from './terminalGateway';

type Actor = { id: string; role: string };

export class RefundService {
  constructor(private readonly prisma: PrismaClient) {}

  async request(actor: Actor, input: { checkoutId: string; idempotencyKey: string; reason: string; lines: Array<{ checkoutLineId: string; quantityMilliunits: number }> }) {
    if (!['ADMIN', 'MANAGER', 'CASHIER'].includes(actor.role)) throw new OperationsError('Role cannot request returns', 403, 'ROLE_FORBIDDEN');
    if (!/^[A-Za-z0-9._:-]{8,128}$/.test(input.idempotencyKey ?? '') || input.reason?.trim().length < 10 || !input.lines?.length) throw new OperationsError('Refund key, reason, and lines are required', 422, 'REFUND_INVALID');
    const existing = await this.prisma.refundCase.findUnique({ where: { checkoutId_idempotencyKey: { checkoutId: input.checkoutId, idempotencyKey: input.idempotencyKey } }, include: { lines: true } });
    if (existing) return existing;
    return this.prisma.$transaction(async (tx) => {
      const checkout = await tx.operationalCheckout.findUnique({ where: { id: input.checkoutId }, include: { lines: true, refunds: { where: { state: { in: ['PENDING_APPROVAL', 'COMPLETED'] } }, include: { lines: true } } } });
      if (!checkout || !['COMPLETED', 'PARTIALLY_REFUNDED'].includes(checkout.status)) throw new OperationsError('Completed checkout not found', 404, 'CHECKOUT_NOT_REFUNDABLE');
      const requested = new Map(input.lines.map((line) => [line.checkoutLineId, line.quantityMilliunits]));
      if (requested.size !== input.lines.length) throw new OperationsError('Duplicate refund lines are not allowed', 422, 'REFUND_LINE_DUPLICATE');
      let amountCents = 0;
      const rows = checkout.lines.filter((line) => requested.has(line.id)).map((line) => {
        const quantity = requested.get(line.id)!;
        const prior = checkout.refunds.flatMap((refund) => refund.lines).filter((refunded) => refunded.checkoutLineId === line.id).reduce((sum, refunded) => sum + refunded.quantityMilliunits, 0);
        if (!Number.isInteger(quantity) || quantity <= 0 || prior + quantity > line.quantityMilliunits) throw new OperationsError('Refund quantity exceeds the unreturned amount', 409, 'REFUND_QUANTITY_INVALID');
        const lineAmount = Math.floor((line.totalCents * quantity + Math.floor(line.quantityMilliunits / 2)) / line.quantityMilliunits);
        amountCents += lineAmount;
        return { checkoutLineId: line.id, quantityMilliunits: quantity, amountCents: lineAmount };
      });
      if (rows.length !== input.lines.length || amountCents <= 0) throw new OperationsError('Refund lines do not belong to checkout', 422, 'REFUND_LINE_INVALID');
      const refund = await tx.refundCase.create({ data: { checkoutId: checkout.id, idempotencyKey: input.idempotencyKey, amountCents, reason: input.reason.trim(), state: 'PENDING_APPROVAL', requestedBy: actor.id, lines: { create: rows } }, include: { lines: true } });
      await appendOperationalAudit(tx, { locationId: checkout.locationId, actorId: actor.id, action: 'REFUND_REQUESTED', resourceType: 'RefundCase', resourceId: refund.id, outcome: 'PENDING_APPROVAL', metadata: { checkoutId: checkout.id, amountCents } });
      return refund;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 20_000, timeout: 60_000 });
  }

  async approve(actor: Actor, refundId: string) {
    if (!['ADMIN', 'MANAGER'].includes(actor.role)) throw new OperationsError('Manager approval is required', 403, 'MANAGER_APPROVAL_REQUIRED');
    const pending = await this.prisma.refundCase.findUnique({ where: { id: refundId }, include: { lines: true, checkout: { include: { lines: true, tenders: { include: { operations: true } } } } } });
    if (!pending) throw new OperationsError('Refund not found', 404, 'REFUND_NOT_FOUND');
    if (pending.state === 'COMPLETED') return pending;
    if (pending.state !== 'PENDING_APPROVAL') throw new OperationsError('Refund is not pending approval', 409, 'REFUND_NOT_PENDING');
    if (pending.requestedBy === actor.id) throw new OperationsError('Refund requester cannot approve the same refund', 403, 'SELF_APPROVAL_FORBIDDEN');

    let remaining = pending.amountCents;
    const allocations = pending.checkout.tenders.map((tender) => {
      const previouslyRefunded = tender.operations.filter((operation) => operation.operation === 'REFUND' && operation.state === 'CAPTURED').reduce((sum, operation) => sum + operation.amountCents, 0);
      const amountCents = Math.min(remaining, Math.max(0, tender.amountCents - previouslyRefunded));
      remaining -= amountCents;
      return { tender, amountCents };
    }).filter((allocation) => allocation.amountCents > 0);
    if (remaining !== 0) throw new OperationsError('Original tenders cannot cover refund', 409, 'REFUND_ALLOCATION_FAILED');
    const providerResults = new Map<string, { providerRef?: string; responseMeta: Prisma.InputJsonValue }>();
    for (const allocation of allocations.filter(({ tender }) => tender.method === 'CARD_PRESENT')) {
      if (!allocation.tender.providerRef) throw new OperationsError('Card provider reference is missing', 409, 'CARD_REFERENCE_MISSING');
      const idempotencyKey = `${pending.id}:refund:${allocation.tender.id}`;
      const prior = allocation.tender.operations.find((operation) => operation.idempotencyKey === idempotencyKey);
      if (prior && prior.attempts >= 5) throw new OperationsError('Card refund retry limit reached; provider reconciliation is required', 409, 'REFUND_RETRY_LIMIT');
      await this.prisma.paymentOperation.upsert({ where: { tenderId_idempotencyKey: { tenderId: allocation.tender.id, idempotencyKey } }, create: { tenderId: allocation.tender.id, operation: 'REFUND', amountCents: allocation.amountCents, state: 'PENDING', idempotencyKey, requestMeta: { amountCents: allocation.amountCents, originalProviderRef: allocation.tender.providerRef }, responseMeta: {} }, update: { state: 'PENDING', attempts: { increment: 1 }, lastErrorCode: null } });
      try {
        const result = await terminalGateway().refund(allocation.tender.providerRef, allocation.amountCents, `${pending.id}:card-refund:${allocation.tender.id}`);
        if (result.outcome !== 'CAPTURED') {
          await this.prisma.paymentOperation.update({ where: { tenderId_idempotencyKey: { tenderId: allocation.tender.id, idempotencyKey } }, data: { state: result.outcome, providerRef: result.providerRef, responseMeta: result.metadata as Prisma.InputJsonValue, lastErrorCode: result.errorCode } });
          throw new OperationsError('Card refund is not complete', 503, 'CARD_REFUND_PENDING');
        }
        providerResults.set(allocation.tender.id, { providerRef: result.providerRef, responseMeta: result.metadata as Prisma.InputJsonValue });
      } catch (error) {
        if (!(error instanceof OperationsError && error.code === 'CARD_REFUND_PENDING')) await this.prisma.paymentOperation.update({ where: { tenderId_idempotencyKey: { tenderId: allocation.tender.id, idempotencyKey } }, data: { state: 'FAILED', lastErrorCode: 'PROVIDER_UNAVAILABLE' } });
        throw error;
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const fresh = await tx.refundCase.findUnique({ where: { id: pending.id } });
      if (fresh?.state === 'COMPLETED') return tx.refundCase.findUnique({ where: { id: pending.id }, include: { lines: true } });
      const returned = await tx.return.create({ data: { saleId: pending.checkout.saleId!, reason: pending.reason, totalAmount: pending.amountCents / 100, status: 'COMPLETED', processedBy: actor.id, items: { create: pending.lines.map((refundLine) => {
        const checkoutLine = pending.checkout.lines.find((line) => line.id === refundLine.checkoutLineId)!;
        return { productId: checkoutLine.productId, variantId: checkoutLine.variantId, quantity: refundLine.quantityMilliunits / 1000, unitPrice: checkoutLine.unitPriceCents / 100, totalPrice: refundLine.amountCents / 100 };
      }) } } });
      for (const refundLine of pending.lines) {
        const checkoutLine = pending.checkout.lines.find((line) => line.id === refundLine.checkoutLineId)!;
        const stock = await tx.locationStock.update({ where: { locationId_productId_variantKey: { locationId: pending.checkout.locationId, productId: checkoutLine.productId, variantKey: checkoutLine.variantId ?? '' } }, data: { onHandMilliunits: { increment: refundLine.quantityMilliunits }, version: { increment: 1 } } });
        await tx.stockLedgerEvent.create({ data: { stockId: stock.id, deltaMilliunits: refundLine.quantityMilliunits, resultingMilliunits: stock.onHandMilliunits, reason: 'RETURN', referenceId: pending.id, idempotencyKey: `${pending.id}:stock:${refundLine.id}` } });
      }
      for (const allocation of allocations) {
        if (allocation.tender.method === 'CASH') await tx.registerShift.update({ where: { id: pending.checkout.shiftId }, data: { expectedCashCents: { decrement: allocation.amountCents } } });
        if (allocation.tender.method === 'GIFT_CARD' && allocation.tender.giftCardId) {
          const card = await tx.giftCardAccount.update({ where: { id: allocation.tender.giftCardId }, data: { balanceCents: { increment: allocation.amountCents }, liabilityCents: { increment: allocation.amountCents } } });
          await tx.giftCardTransaction.create({ data: { giftCardId: card.id, checkoutId: pending.checkout.id, type: 'REFUND', amountCents: allocation.amountCents, balanceAfterCents: card.balanceCents, idempotencyKey: `${pending.id}:gift:${allocation.tender.id}` } });
        }
        const providerResult = providerResults.get(allocation.tender.id);
        if (allocation.tender.method === 'CARD_PRESENT') {
          await tx.paymentOperation.update({ where: { tenderId_idempotencyKey: { tenderId: allocation.tender.id, idempotencyKey: `${pending.id}:refund:${allocation.tender.id}` } }, data: { state: 'CAPTURED', providerRef: providerResult?.providerRef, responseMeta: providerResult?.responseMeta ?? {}, lastErrorCode: null } });
        } else {
          await tx.paymentOperation.create({ data: { tenderId: allocation.tender.id, operation: 'REFUND', amountCents: allocation.amountCents, state: 'CAPTURED', idempotencyKey: `${pending.id}:refund:${allocation.tender.id}`, requestMeta: { amountCents: allocation.amountCents }, responseMeta: {} } });
        }
      }
      const priorCompleted = await tx.refundCase.aggregate({ where: { checkoutId: pending.checkout.id, state: 'COMPLETED' }, _sum: { amountCents: true } });
      const totalRefunded = (priorCompleted._sum.amountCents ?? 0) + pending.amountCents;
      if (pending.checkout.customerId) {
        const priorPoints = Math.floor((priorCompleted._sum.amountCents ?? 0) / 100);
        const totalPoints = Math.floor(totalRefunded / 100);
        const pointsToReverse = totalPoints - priorPoints;
        await tx.customer.update({ where: { id: pending.checkout.customerId }, data: { totalSpent: { decrement: pending.amountCents / 100 }, ...(pointsToReverse ? { loyaltyPoints: { decrement: pointsToReverse } } : {}) } });
        if (pointsToReverse) await tx.loyaltyTransaction.create({ data: { customerId: pending.checkout.customerId, points: -pointsToReverse, type: 'ADJUSTMENT', description: 'Controlled refund reward reversal', referenceId: pending.id } });
      }
      await tx.operationalCheckout.update({ where: { id: pending.checkout.id }, data: { status: totalRefunded >= pending.checkout.totalCents ? 'REFUNDED' : 'PARTIALLY_REFUNDED' } });
      await tx.refundCase.update({ where: { id: pending.id }, data: { state: 'COMPLETED', approvedBy: actor.id, completedAt: new Date() } });
      await tx.accountingOutbox.create({ data: { locationId: pending.checkout.locationId, eventType: 'REFUND_COMPLETED', aggregateType: 'RefundCase', aggregateId: pending.id, idempotencyKey: `${pending.id}:accounting:refund`, payload: { checkoutId: pending.checkout.id, returnId: returned.id, amountCents: pending.amountCents, allocations: allocations.map(({ tender, amountCents }) => ({ method: tender.method, amountCents })) } } });
      await appendOperationalAudit(tx, { locationId: pending.checkout.locationId, actorId: actor.id, action: 'REFUND_COMPLETED', resourceType: 'RefundCase', resourceId: pending.id, outcome: 'SUCCESS', metadata: { checkoutId: pending.checkout.id, amountCents: pending.amountCents, returnId: returned.id } });
      return tx.refundCase.findUnique({ where: { id: pending.id }, include: { lines: true } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 20_000, timeout: 60_000 });
  }
}
