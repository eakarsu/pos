import { randomUUID } from 'crypto';
import { Prisma, PrismaClient } from '@prisma/client';
import { config } from '../../config/environment';
import { appendOperationalAudit } from './audit';
import { OperationsError } from './errors';
import { hashGiftCardCode, stableHash } from './security';
import { calculateTaxLine, sumExact } from './tax';
import { terminalGateway, TerminalResult } from './terminalGateway';

export type OperationsActor = { id: string; role: string };

export type CheckoutInput = {
  locationId: string;
  shiftId: string;
  workstationDeviceId: string;
  idempotencyKey: string;
  customerId?: string;
  exemptionCode?: string;
  source?: 'ONLINE' | 'OFFLINE';
  offlineSequence?: number;
  capturedAt?: string;
  expectedTotalCents?: number;
  expectedTaxProfileVersion?: number;
  simulationOutcome?: 'CAPTURED' | 'FAILED' | 'DISCONNECTED';
  items: Array<{ productId: string; variantId?: string; quantityMilliunits: number; discountCents?: number }>;
  tenders: Array<{ method: 'CASH' | 'CARD_PRESENT' | 'GIFT_CARD'; amountCents: number; readerDeviceId?: string; giftCardCode?: string }>;
};

type CheckoutWithDetails = Prisma.OperationalCheckoutGetPayload<{ include: { lines: true; tenders: true; receipt: true; jobs: true } }>;

function assertRole(actor: OperationsActor, allowed: string[]) {
  if (!allowed.includes(actor.role)) throw new OperationsError('Role is not permitted for store operations', 403, 'ROLE_FORBIDDEN');
}

function validateCheckoutShape(input: CheckoutInput) {
  if (!input.locationId || !input.shiftId || !input.workstationDeviceId || !/^[A-Za-z0-9._:-]{8,128}$/.test(input.idempotencyKey ?? '')) {
    throw new OperationsError('Location, shift, device, and a valid idempotency key are required', 422, 'CHECKOUT_IDENTITY_INVALID');
  }
  if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 100 || !Array.isArray(input.tenders) || input.tenders.length < 1 || input.tenders.length > 4) {
    throw new OperationsError('Checkout requires 1-100 items and 1-4 tenders', 422, 'CHECKOUT_SIZE_INVALID');
  }
  if (input.tenders.filter((tender) => tender.method === 'CARD_PRESENT').length > 1) {
    throw new OperationsError('This bounded workflow supports at most one card-present tender', 422, 'CARD_SPLIT_LIMIT');
  }
}

export class CheckoutService {
  constructor(private readonly prisma: PrismaClient) {}

  async create(actor: OperationsActor, input: CheckoutInput): Promise<{ checkout: CheckoutWithDetails }> {
    assertRole(actor, ['ADMIN', 'MANAGER', 'CASHIER']);
    validateCheckoutShape(input);
    const existing = await this.prisma.operationalCheckout.findUnique({
      where: { locationId_idempotencyKey: { locationId: input.locationId, idempotencyKey: input.idempotencyKey } },
      include: { lines: true, tenders: true, receipt: true, jobs: true },
    });
    if (existing) return { checkout: existing };

    const checkout = await this.prisma.$transaction(async (tx) => {
      const location = await tx.storeLocation.findFirst({ where: { id: input.locationId, isActive: true } });
      if (!location) throw new OperationsError('Active location not found', 404, 'LOCATION_NOT_FOUND');
      const shift = await tx.registerShift.findFirst({ where: { id: input.shiftId, locationId: location.id, userId: actor.id, state: 'OPEN' } });
      if (!shift) throw new OperationsError('An open shift owned by the cashier is required', 409, 'SHIFT_NOT_OPEN');
      const workstation = await tx.deviceEnrollment.findFirst({ where: { locationId: location.id, deviceId: input.workstationDeviceId, status: { in: ['ENROLLED', 'ONLINE'] } } });
      if (!workstation || !workstation.capabilities.includes('OFFLINE_QUEUE')) throw new OperationsError('Enrolled workstation with offline queue capability is required', 409, 'WORKSTATION_NOT_READY');
      const capturedAt = input.capturedAt ? new Date(input.capturedAt) : new Date();
      if (Number.isNaN(capturedAt.getTime()) || capturedAt > new Date(Date.now() + 60_000)) throw new OperationsError('Capture time is invalid', 422, 'CAPTURE_TIME_INVALID');

      const taxProfile = await tx.taxProfile.findFirst({
        where: { locationId: location.id, effectiveFrom: { lte: capturedAt }, OR: [{ effectiveUntil: null }, { effectiveUntil: { gt: capturedAt } }] },
        include: { rules: true }, orderBy: { version: 'desc' },
      });
      if (!taxProfile) throw new OperationsError('No effective tax profile exists for this location', 409, 'TAX_PROFILE_REQUIRED');
      const productIds = [...new Set(input.items.map((item) => item.productId))];
      const products = await tx.product.findMany({ where: { id: { in: productIds }, isActive: true }, select: { id: true, price: true, categoryId: true, name: true } });
      if (products.length !== productIds.length) throw new OperationsError('One or more products are unavailable', 422, 'PRODUCT_UNAVAILABLE');
      const productMap = new Map(products.map((product) => [product.id, product]));
      const stocks = await tx.locationStock.findMany({ where: { locationId: location.id, productId: { in: productIds } } });
      const stockMap = new Map(stocks.map((stock) => [`${stock.productId}:${stock.variantKey}`, stock]));

      let exempt = false;
      let exemptionId: string | null = null;
      if (input.exemptionCode) {
        if (!input.customerId) throw new OperationsError('Tax exemption requires a customer', 422, 'EXEMPTION_CUSTOMER_REQUIRED');
        const record = await tx.taxExemption.findFirst({ where: { locationId: location.id, customerId: input.customerId, code: input.exemptionCode, validFrom: { lte: capturedAt }, revokedAt: null, OR: [{ validUntil: null }, { validUntil: { gt: capturedAt } }] } });
        if (!record) throw new OperationsError('Tax exemption is invalid or expired', 403, 'EXEMPTION_INVALID');
        exempt = true;
        exemptionId = record.id;
      }

      let subtotalCents = 0;
      let discountCents = 0;
      let taxCents = 0;
      const lines = input.items.map((item) => {
        const product = productMap.get(item.productId)!;
        const variantKey = item.variantId ?? '';
        const stock = stockMap.get(`${item.productId}:${variantKey}`);
        if (!stock || stock.onHandMilliunits - stock.reservedMilliunits < item.quantityMilliunits) throw new OperationsError('Insufficient location stock', 409, 'STOCK_INSUFFICIENT');
        if ((item.discountCents ?? 0) > 0 && !['ADMIN', 'MANAGER'].includes(actor.role)) throw new OperationsError('Manager approval is required for line discounts', 403, 'DISCOUNT_APPROVAL_REQUIRED');
        const calculated = calculateTaxLine({ productId: item.productId, categoryId: product.categoryId, quantityMilliunits: item.quantityMilliunits, unitPriceCents: Math.round(product.price * 100), discountCents: item.discountCents }, taxProfile.rules, exempt);
        subtotalCents += calculated.grossCents;
        discountCents += calculated.discountCents;
        taxCents += calculated.taxCents;
        return { productId: item.productId, variantId: item.variantId, quantityMilliunits: item.quantityMilliunits, unitPriceCents: Math.round(product.price * 100), discountCents: calculated.discountCents, taxCents: calculated.taxCents, totalCents: calculated.totalCents, taxRuleIds: calculated.taxRuleIds };
      });
      const totalCents = subtotalCents - discountCents + taxCents;
      sumExact(input.tenders.map((tender) => tender.amountCents), totalCents, 'TENDER_TOTAL_MISMATCH');

      const source = input.source ?? 'ONLINE';
      if (source === 'OFFLINE') {
        const ageMinutes = (Date.now() - capturedAt.getTime()) / 60_000;
        if (!Number.isInteger(input.offlineSequence) || input.offlineSequence! < 1 || ageMinutes < 0 || ageMinutes > config.operations.offlineMaxAgeMinutes) throw new OperationsError('Offline sequence or capture age is invalid', 422, 'OFFLINE_ENVELOPE_INVALID');
        if (input.tenders.some((tender) => tender.method !== 'CASH') || totalCents > config.operations.offlineCashLimitCents) throw new OperationsError('Offline checkout is cash-only and exceeds configured limits', 422, 'OFFLINE_TENDER_FORBIDDEN');
        if (input.expectedTotalCents !== totalCents || input.expectedTaxProfileVersion !== taxProfile.version) throw new OperationsError('Offline price or tax snapshot conflicts with the server; manager review is required', 409, 'OFFLINE_PRICE_TAX_CONFLICT');
      }

      const tenderRows: Array<{ method: string; amountCents: number; state: string; provider?: string; readerDeviceId?: string; giftCardId?: string }> = [];
      for (const tender of input.tenders) {
        if (tender.method === 'CARD_PRESENT') {
          if (source === 'OFFLINE') throw new OperationsError('Card-present tender is prohibited offline', 422, 'OFFLINE_CARD_FORBIDDEN');
          if (!tender.readerDeviceId) throw new OperationsError('Card-present tender requires a reader', 422, 'READER_REQUIRED');
          const reader = await tx.deviceEnrollment.findFirst({ where: { locationId: location.id, deviceId: tender.readerDeviceId, kind: 'PAYMENT_READER', status: { in: ['ENROLLED', 'ONLINE'] } } });
          if (!reader || !reader.capabilities.includes('CARD_PRESENT')) throw new OperationsError('Enrolled card-present reader is required', 409, 'READER_NOT_READY');
          tenderRows.push({ method: tender.method, amountCents: tender.amountCents, state: 'PENDING', provider: config.operations.paymentProvider, readerDeviceId: tender.readerDeviceId });
        } else if (tender.method === 'GIFT_CARD') {
          if (!tender.giftCardCode) throw new OperationsError('Gift-card code is required', 422, 'GIFT_CARD_REQUIRED');
          const giftCard = await tx.giftCardAccount.findFirst({ where: { locationId: location.id, codeHash: hashGiftCardCode(tender.giftCardCode), status: 'ACTIVE', OR: [{ expiresAt: null }, { expiresAt: { gt: capturedAt } }] } });
          if (!giftCard || giftCard.balanceCents < tender.amountCents) throw new OperationsError('Gift-card balance is unavailable', 409, 'GIFT_CARD_BALANCE');
          tenderRows.push({ method: tender.method, amountCents: tender.amountCents, state: 'PENDING', giftCardId: giftCard.id });
        } else {
          tenderRows.push({ method: 'CASH', amountCents: tender.amountCents, state: 'PENDING' });
        }
      }

      const receiptNumber = `R-${location.code}-${capturedAt.toISOString().slice(0, 10).replace(/-/g, '')}-${randomUUID().slice(0, 8).toUpperCase()}`;
      const created = await tx.operationalCheckout.create({
        data: {
          locationId: location.id, shiftId: shift.id, userId: actor.id, customerId: input.customerId,
          idempotencyKey: input.idempotencyKey, source, deviceId: input.workstationDeviceId,
          offlineSequence: source === 'OFFLINE' ? input.offlineSequence : null, capturedAt, status: 'PAYMENT_PENDING',
          currency: location.currency, subtotalCents, discountCents, taxCents, totalCents, taxProfileVersion: taxProfile.version,
          taxSnapshot: { jurisdictionCode: taxProfile.jurisdictionCode, profileVersion: taxProfile.version, exemptionId, certified: taxProfile.isCertified, rules: taxProfile.rules.map((rule) => ({ id: rule.id, rateBps: rule.rateBps, appliesTo: rule.appliesTo, referenceId: rule.referenceId })) },
          receiptNumber, fiscalStatus: taxProfile.isCertified ? 'CERTIFIED_PROFILE' : 'NON_FISCAL_SIMULATION',
          lines: { create: lines }, tenders: { create: tenderRows },
        }, include: { lines: true, tenders: true, receipt: true, jobs: true },
      });
      for (const tender of created.tenders.filter((row) => row.method === 'CARD_PRESENT')) {
        await tx.paymentOperation.create({ data: { tenderId: tender.id, operation: 'CAPTURE', amountCents: tender.amountCents, state: 'PENDING', idempotencyKey: `${input.idempotencyKey}:capture`, requestMeta: { amountCents: tender.amountCents, currency: location.currency, readerDeviceId: tender.readerDeviceId }, responseMeta: {} } });
      }
      await appendOperationalAudit(tx, { locationId: location.id, actorId: actor.id, action: source === 'OFFLINE' ? 'OFFLINE_CHECKOUT_ACCEPTED' : 'CHECKOUT_CREATED', resourceType: 'OperationalCheckout', resourceId: created.id, outcome: 'SUCCESS', metadata: { source, totalCents, taxProfileVersion: taxProfile.version, idempotencyKey: input.idempotencyKey } });
      return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    const card = checkout.tenders.find((tender) => tender.method === 'CARD_PRESENT');
    if (card) {
      let result: TerminalResult;
      try {
        result = await terminalGateway().begin(card.amountCents, checkout.currency, card.readerDeviceId!, `${input.idempotencyKey}:capture`, input.simulationOutcome);
      } catch (error) {
        await this.recordTerminalFailure(checkout, card.id, 'PROVIDER_UNAVAILABLE');
        throw error;
      }
      await this.applyTerminalResult(checkout, card.id, result, actor.id);
      if (result.outcome === 'CAPTURED') return { checkout: await this.finalize(checkout.id, actor.id) };
      const current = await this.get(checkout.id);
      return { checkout: current };
    }
    return { checkout: await this.finalize(checkout.id, actor.id) };
  }

  async retryPayment(actor: OperationsActor, checkoutId: string, simulationOutcome?: string) {
    assertRole(actor, ['ADMIN', 'MANAGER', 'CASHIER']);
    const checkout = await this.prisma.operationalCheckout.findUnique({ where: { id: checkoutId }, include: { tenders: { include: { operations: true } } } });
    if (!checkout || checkout.userId !== actor.id && !['ADMIN', 'MANAGER'].includes(actor.role)) throw new OperationsError('Checkout not found', 404, 'CHECKOUT_NOT_FOUND');
    if (checkout.status === 'COMPLETED') return { checkout: await this.get(checkout.id) };
    if (checkout.status === 'CANCELLED') throw new OperationsError('Cancelled checkout cannot be retried', 409, 'CHECKOUT_CANCELLED');
    const card = checkout.tenders.find((tender) => tender.method === 'CARD_PRESENT');
    if (!card) throw new OperationsError('Checkout has no card-present tender', 409, 'CARD_TENDER_NOT_FOUND');
    const capture = card.operations.find((operation) => operation.operation === 'CAPTURE');
    if (!capture || capture.attempts >= 5) throw new OperationsError('Card payment retry limit reached; manager reversal/reconciliation is required', 409, 'PAYMENT_RETRY_LIMIT');
    await this.prisma.paymentOperation.update({ where: { id: capture.id }, data: { attempts: { increment: 1 }, state: 'PENDING', lastErrorCode: null } });
    const result = card.providerRef
      ? await terminalGateway().recover(card.providerRef, card.readerDeviceId!)
      : await terminalGateway().begin(card.amountCents, checkout.currency, card.readerDeviceId!, `${checkout.idempotencyKey}:capture`, simulationOutcome);
    await this.applyTerminalResult(checkout as any, card.id, result, actor.id);
    if (result.outcome === 'CAPTURED') return { checkout: await this.finalize(checkout.id, actor.id) };
    return { checkout: await this.get(checkout.id) };
  }

  async reversePayment(actor: OperationsActor, checkoutId: string) {
    assertRole(actor, ['ADMIN', 'MANAGER', 'CASHIER']);
    const checkout = await this.prisma.operationalCheckout.findUnique({ where: { id: checkoutId }, include: { tenders: { include: { operations: true } } } });
    if (!checkout || checkout.userId !== actor.id && !['ADMIN', 'MANAGER'].includes(actor.role)) throw new OperationsError('Checkout not found', 404, 'CHECKOUT_NOT_FOUND');
    if (checkout.status === 'COMPLETED' || checkout.status === 'PARTIALLY_REFUNDED' || checkout.status === 'REFUNDED') throw new OperationsError('Completed checkout must use the approved refund workflow', 409, 'REFUND_WORKFLOW_REQUIRED');
    if (checkout.status === 'CANCELLED') return { checkout: await this.get(checkout.id), duplicateReversal: true };
    const card = checkout.tenders.find((tender) => tender.method === 'CARD_PRESENT');
    if (!card?.providerRef) throw new OperationsError('No provider payment exists to reverse', 409, 'REVERSAL_NOT_AVAILABLE');
    const idempotencyKey = `${checkout.idempotencyKey}:reversal`;
    const existing = card.operations.find((operation) => operation.idempotencyKey === idempotencyKey);
    if (existing?.state === 'CAPTURED' || existing?.state === 'CANCELLED') return { checkout: await this.get(checkout.id), duplicateReversal: true };
    if (existing && existing.attempts >= 5) throw new OperationsError('Payment reversal retry limit reached; provider reconciliation is required', 409, 'REVERSAL_RETRY_LIMIT');

    await this.prisma.paymentOperation.upsert({
      where: { tenderId_idempotencyKey: { tenderId: card.id, idempotencyKey } },
      create: { tenderId: card.id, operation: 'REVERSAL', amountCents: card.amountCents, state: 'PENDING', idempotencyKey, requestMeta: { originalProviderRef: card.providerRef }, responseMeta: {} },
      update: { attempts: { increment: 1 }, state: 'PENDING', lastErrorCode: null },
    });

    let result: TerminalResult;
    try {
      const providerState = await terminalGateway().recover(card.providerRef);
      result = providerState.outcome === 'CAPTURED'
        ? await terminalGateway().refund(card.providerRef, card.amountCents, idempotencyKey)
        : await terminalGateway().reverse(card.providerRef, idempotencyKey);
    } catch (error) {
      await this.prisma.paymentOperation.update({ where: { tenderId_idempotencyKey: { tenderId: card.id, idempotencyKey } }, data: { state: 'FAILED', lastErrorCode: 'PROVIDER_UNAVAILABLE' } });
      throw error;
    }
    if (!['CAPTURED', 'CANCELLED'].includes(result.outcome)) {
      await this.prisma.paymentOperation.update({ where: { tenderId_idempotencyKey: { tenderId: card.id, idempotencyKey } }, data: { state: result.outcome, providerRef: result.providerRef, responseMeta: result.metadata as Prisma.InputJsonValue, lastErrorCode: result.errorCode } });
      throw new OperationsError('Provider reversal is not complete; retry is required', 409, 'REVERSAL_PENDING');
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.paymentOperation.update({ where: { tenderId_idempotencyKey: { tenderId: card.id, idempotencyKey } }, data: { state: result.outcome, providerRef: result.providerRef, responseMeta: result.metadata as Prisma.InputJsonValue, lastErrorCode: null } });
      await tx.operationalTender.update({ where: { id: card.id }, data: { state: 'REVERSED' } });
      await tx.operationalCheckout.update({ where: { id: checkout.id }, data: { status: 'CANCELLED' } });
      await appendOperationalAudit(tx, { locationId: checkout.locationId, actorId: actor.id, action: 'PAYMENT_REVERSED', resourceType: 'OperationalCheckout', resourceId: checkout.id, outcome: 'SUCCESS', metadata: { amountCents: card.amountCents, provider: result.provider } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return { checkout: await this.get(checkout.id), duplicateReversal: false };
  }

  async get(checkoutId: string): Promise<CheckoutWithDetails> {
    const checkout = await this.prisma.operationalCheckout.findUnique({ where: { id: checkoutId }, include: { lines: true, tenders: true, receipt: true, jobs: true } });
    if (!checkout) throw new OperationsError('Checkout not found', 404, 'CHECKOUT_NOT_FOUND');
    return checkout;
  }

  private async recordTerminalFailure(checkout: { id: string; locationId: string }, tenderId: string, code: string) {
    await this.prisma.$transaction(async (tx) => {
      await tx.operationalTender.update({ where: { id: tenderId }, data: { state: 'RETRY_REQUIRED' } });
      await tx.paymentOperation.updateMany({ where: { tenderId, state: 'PENDING' }, data: { state: 'FAILED', lastErrorCode: code } });
      await appendOperationalAudit(tx, { locationId: checkout.locationId, actorId: 'SYSTEM', action: 'TERMINAL_FAILURE', resourceType: 'OperationalCheckout', resourceId: checkout.id, outcome: 'FAILED', metadata: { code } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  private async applyTerminalResult(checkout: { id: string; locationId: string }, tenderId: string, result: TerminalResult, actorId: string) {
    await this.prisma.$transaction(async (tx) => {
      const state = result.outcome === 'CAPTURED' ? 'CAPTURED' : result.outcome === 'ACTION_REQUIRED' ? 'AWAITING_READER' : result.outcome === 'CANCELLED' ? 'REVERSED' : 'RETRY_REQUIRED';
      await tx.operationalTender.update({ where: { id: tenderId }, data: { state, provider: result.provider, providerRef: result.providerRef, tokenReference: result.tokenReference, cardBrand: result.cardBrand, cardLast4: result.cardLast4 } });
      await tx.paymentOperation.updateMany({ where: { tenderId, operation: 'CAPTURE' }, data: { state: result.outcome, providerRef: result.providerRef, responseMeta: result.metadata as Prisma.InputJsonValue, lastErrorCode: result.errorCode } });
      await appendOperationalAudit(tx, { locationId: checkout.locationId, actorId, action: `TERMINAL_${result.outcome}`, resourceType: 'OperationalCheckout', resourceId: checkout.id, outcome: result.outcome === 'CAPTURED' ? 'SUCCESS' : 'PENDING', metadata: { provider: result.provider, errorCode: result.errorCode ?? null } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  private async finalize(checkoutId: string, actorId: string): Promise<CheckoutWithDetails> {
    return this.prisma.$transaction(async (tx) => {
      const checkout = await tx.operationalCheckout.findUnique({ where: { id: checkoutId }, include: { lines: true, tenders: true, receipt: true, jobs: true, location: true } });
      if (!checkout) throw new OperationsError('Checkout not found', 404, 'CHECKOUT_NOT_FOUND');
      if (checkout.status === 'COMPLETED') return checkout;
      if (checkout.tenders.some((tender) => tender.method === 'CARD_PRESENT' && tender.state !== 'CAPTURED')) throw new OperationsError('Card-present tender is not captured', 409, 'PAYMENT_NOT_CAPTURED');

      for (const line of checkout.lines) {
        const updated = await tx.locationStock.updateMany({ where: { locationId: checkout.locationId, productId: line.productId, variantKey: line.variantId ?? '', onHandMilliunits: { gte: line.quantityMilliunits } }, data: { onHandMilliunits: { decrement: line.quantityMilliunits }, version: { increment: 1 } } });
        if (updated.count !== 1) throw new OperationsError('Stock changed before finalization; manager reconciliation required', 409, 'STOCK_CONFLICT');
        const stock = await tx.locationStock.findUnique({ where: { locationId_productId_variantKey: { locationId: checkout.locationId, productId: line.productId, variantKey: line.variantId ?? '' } } });
        await tx.stockLedgerEvent.create({ data: { stockId: stock!.id, deltaMilliunits: -line.quantityMilliunits, resultingMilliunits: stock!.onHandMilliunits, reason: 'SALE', referenceId: checkout.id, idempotencyKey: `${checkout.id}:stock:${line.id}` } });
        if (line.quantityMilliunits % 1000 === 0) {
          const legacy = await tx.inventoryItem.findFirst({ where: { productId: line.productId, variantId: line.variantId, location: checkout.location.code } });
          if (legacy) await tx.inventoryItem.update({ where: { id: legacy.id }, data: { quantity: { decrement: line.quantityMilliunits / 1000 }, lastUpdated: new Date() } });
        }
      }

      for (const tender of checkout.tenders) {
        if (tender.method === 'GIFT_CARD') {
          const updated = await tx.giftCardAccount.updateMany({ where: { id: tender.giftCardId!, status: 'ACTIVE', balanceCents: { gte: tender.amountCents } }, data: { balanceCents: { decrement: tender.amountCents }, liabilityCents: { decrement: tender.amountCents } } });
          if (updated.count !== 1) throw new OperationsError('Gift-card balance changed before capture', 409, 'GIFT_CARD_CONFLICT');
          const card = await tx.giftCardAccount.findUnique({ where: { id: tender.giftCardId! } });
          await tx.giftCardTransaction.create({ data: { giftCardId: tender.giftCardId!, checkoutId: checkout.id, type: 'REDEEM', amountCents: -tender.amountCents, balanceAfterCents: card!.balanceCents, idempotencyKey: `${checkout.id}:gift:${tender.id}` } });
        }
        if (tender.state !== 'CAPTURED') await tx.operationalTender.update({ where: { id: tender.id }, data: { state: 'CAPTURED' } });
      }

      const sale = await tx.sale.create({
        data: {
          saleNumber: `OPS-${checkout.receiptNumber}`, customerId: checkout.customerId, userId: checkout.userId,
          subtotal: checkout.subtotalCents / 100, taxAmount: checkout.taxCents / 100, discountAmount: checkout.discountCents / 100,
          totalAmount: checkout.totalCents / 100, status: 'COMPLETED', paymentStatus: 'PAID', notes: `Controlled checkout ${checkout.id}`,
          items: { create: checkout.lines.map((line) => ({ productId: line.productId, variantId: line.variantId, quantity: line.quantityMilliunits / 1000, unitPrice: line.unitPriceCents / 100, discount: line.discountCents / 100, taxRate: 0, totalPrice: line.totalCents / 100 })) },
          payments: { create: checkout.tenders.map((tender) => ({ amount: tender.amountCents / 100, method: tender.method, status: 'PAID', reference: tender.providerRef ?? tender.giftCardId ?? undefined, stripePaymentId: tender.provider === 'stripe-terminal' ? tender.providerRef : undefined, notes: 'Tokenized controlled tender' })) },
        },
      });
      const cashCents = checkout.tenders.filter((tender) => tender.method === 'CASH').reduce((sum, tender) => sum + tender.amountCents, 0);
      if (cashCents) await tx.registerShift.update({ where: { id: checkout.shiftId }, data: { expectedCashCents: { increment: cashCents } } });
      if (checkout.customerId) {
        const points = Math.floor(checkout.totalCents / 100);
        await tx.customer.update({ where: { id: checkout.customerId }, data: { totalSpent: { increment: checkout.totalCents / 100 }, loyaltyPoints: { increment: points } } });
        await tx.loyaltyTransaction.create({ data: { customerId: checkout.customerId, points, type: 'EARNED', description: 'Controlled checkout reward', referenceId: checkout.id } });
      }
      const receiptContent = { receiptNumber: checkout.receiptNumber, locationCode: checkout.location.code, capturedAt: checkout.capturedAt.toISOString(), currency: checkout.currency, lines: checkout.lines.map((line) => ({ productId: line.productId, quantityMilliunits: line.quantityMilliunits, unitPriceCents: line.unitPriceCents, discountCents: line.discountCents, taxCents: line.taxCents, totalCents: line.totalCents })), subtotalCents: checkout.subtotalCents, discountCents: checkout.discountCents, taxCents: checkout.taxCents, totalCents: checkout.totalCents, fiscalStatus: checkout.fiscalStatus };
      await tx.operationalReceipt.create({ data: { checkoutId: checkout.id, receiptNumber: checkout.receiptNumber, content: receiptContent, contentHash: stableHash(receiptContent), fiscalStatus: checkout.fiscalStatus } });
      const workstation = await tx.deviceEnrollment.findUnique({ where: { deviceId: checkout.deviceId! } });
      const printReady = workstation?.capabilities.includes('RECEIPT_PRINTER') ?? false;
      await tx.hardwareJob.create({ data: { checkoutId: checkout.id, deviceId: checkout.deviceId!, jobType: 'PRINT_RECEIPT', dedupeKey: `${checkout.id}:receipt:v1`, payload: { receiptNumber: checkout.receiptNumber }, state: printReady ? 'QUEUED' : 'FAILED', lastErrorCode: printReady ? null : 'CAPABILITY_MISSING', operatorMessage: printReady ? null : 'No receipt-printer capability reported for this workstation' } });
      if (cashCents) {
        const drawerReady = workstation?.capabilities.includes('CASH_DRAWER') ?? false;
        await tx.hardwareJob.create({ data: { checkoutId: checkout.id, deviceId: checkout.deviceId!, jobType: 'OPEN_DRAWER', dedupeKey: `${checkout.id}:drawer:v1`, payload: { reason: 'CASH_SALE' }, state: drawerReady ? 'QUEUED' : 'FAILED', lastErrorCode: drawerReady ? null : 'CAPABILITY_MISSING', operatorMessage: drawerReady ? null : 'No cash-drawer capability reported for this workstation' } });
      }
      await tx.accountingOutbox.create({ data: { locationId: checkout.locationId, eventType: 'SALE_COMPLETED', aggregateType: 'OperationalCheckout', aggregateId: checkout.id, idempotencyKey: `${checkout.id}:accounting:sale`, payload: { receiptNumber: checkout.receiptNumber, subtotalCents: checkout.subtotalCents, discountCents: checkout.discountCents, taxCents: checkout.taxCents, totalCents: checkout.totalCents, tenderTotals: checkout.tenders.map((tender) => ({ method: tender.method, amountCents: tender.amountCents })) } } });
      await tx.operationalCheckout.update({ where: { id: checkout.id }, data: { status: 'COMPLETED', saleId: sale.id, completedAt: new Date() } });
      await appendOperationalAudit(tx, { locationId: checkout.locationId, actorId, action: 'CHECKOUT_COMPLETED', resourceType: 'OperationalCheckout', resourceId: checkout.id, outcome: 'SUCCESS', metadata: { saleId: sale.id, receiptNumber: checkout.receiptNumber, totalCents: checkout.totalCents } });
      return (await tx.operationalCheckout.findUnique({ where: { id: checkout.id }, include: { lines: true, tenders: true, receipt: true, jobs: true } }))!;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
}
