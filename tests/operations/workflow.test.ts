import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, test } from 'node:test';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { CheckoutService } from '../../src/services/operations/checkoutService';
import { RefundService } from '../../src/services/operations/refundService';
import { config } from '../../src/config/environment';
import { hashDeviceCredential } from '../../src/services/operations/security';

const prisma = new PrismaClient();
const checkoutService = new CheckoutService(prisma);
const refundService = new RefundService(prisma);
const run = randomUUID().replaceAll('-', '').slice(0, 12);
const ids: Record<string, string> = {};
let cashCheckout: any;
let app: any;

function key(label: string) { return `${label}:${run}:12345678`; }
function token(userId: string) { return jwt.sign({ userId }, config.jwtSecret, { expiresIn: '5m' }); }

before(async () => {
  await prisma.$connect();
  const [cashier, manager, category, customer] = await Promise.all([
    prisma.user.create({ data: { email: `cashier-${run}@example.test`, username: `cashier-${run}`, firstName: 'Test', lastName: 'Cashier', password: 'not-used', role: 'CASHIER' } }),
    prisma.user.create({ data: { email: `manager-${run}@example.test`, username: `manager-${run}`, firstName: 'Test', lastName: 'Manager', password: 'not-used', role: 'MANAGER' } }),
    prisma.category.create({ data: { name: `Controlled-${run}` } }),
    prisma.customer.create({ data: { email: `customer-${run}@example.test`, firstName: 'Test', lastName: 'Customer' } }),
  ]);
  Object.assign(ids, { cashier: cashier.id, manager: manager.id, category: category.id, customer: customer.id });
  const [product, secondProduct] = await Promise.all([
    prisma.product.create({ data: { name: 'Taxed item', sku: `TAX-${run}`, barcode: `100${run}`, price: 10, categoryId: category.id } }),
    prisma.product.create({ data: { name: 'Split item', sku: `SPLIT-${run}`, barcode: `200${run}`, price: 5, categoryId: category.id } }),
  ]);
  Object.assign(ids, { product: product.id, secondProduct: secondProduct.id });
  const location = await prisma.storeLocation.create({ data: { code: `L${run.toUpperCase()}`, name: 'Disposable test location', timezone: 'UTC', currency: 'USD', taxProfiles: { create: { jurisdictionCode: 'TEST-ONLY', version: 1, effectiveFrom: new Date('2020-01-01T00:00:00Z'), rules: { create: { name: 'Test tax', rateBps: 825, appliesTo: 'ALL' } } } } } });
  ids.location = location.id;
  const [workstation, reader] = await Promise.all([
    prisma.deviceEnrollment.create({ data: { locationId: location.id, deviceId: `ws-${run}`, displayName: 'Test workstation', kind: 'WORKSTATION', provider: 'simulator', mode: 'SIMULATOR', capabilities: ['OFFLINE_QUEUE', 'BARCODE_SCANNER', 'RECEIPT_PRINTER', 'CASH_DRAWER'], credentialHash: hashDeviceCredential('workstation-test-credential') , status: 'ONLINE', lastSeenAt: new Date() } }),
    prisma.deviceEnrollment.create({ data: { locationId: location.id, deviceId: `reader-${run}`, displayName: 'Test reader', kind: 'PAYMENT_READER', provider: 'simulator', mode: 'SIMULATOR', capabilities: ['CARD_PRESENT'], credentialHash: hashDeviceCredential('reader-test-credential'), status: 'ONLINE', lastSeenAt: new Date() } }),
  ]);
  Object.assign(ids, { workstation: workstation.deviceId, reader: reader.deviceId });
  const shift = await prisma.registerShift.create({ data: { locationId: location.id, userId: cashier.id, openingCashCents: 5000, expectedCashCents: 5000 } });
  ids.shift = shift.id;
  await prisma.locationStock.createMany({ data: [
    { locationId: location.id, productId: product.id, onHandMilliunits: 10_000 },
    { locationId: location.id, productId: secondProduct.id, onHandMilliunits: 10_000 },
  ] });
  app = (await import('../../src/app')).default;
});

after(async () => { await prisma.$disconnect(); });

test('cash checkout is server-priced, atomic, receipted, hardware-queued, and idempotent', async () => {
  const input = { locationId: ids.location, shiftId: ids.shift, workstationDeviceId: ids.workstation, idempotencyKey: key('cash'), customerId: ids.customer, items: [{ productId: ids.product, quantityMilliunits: 1000 }], tenders: [{ method: 'CASH' as const, amountCents: 1083 }] };
  const result = await checkoutService.create({ id: ids.cashier, role: 'CASHIER' }, input);
  cashCheckout = result.checkout;
  assert.equal(result.checkout.status, 'COMPLETED');
  assert.equal(result.checkout.totalCents, 1083);
  assert.equal(result.checkout.taxCents, 83);
  assert.ok(result.checkout.receipt?.contentHash.match(/^[a-f0-9]{64}$/));
  assert.deepEqual(result.checkout.jobs.map((job) => job.jobType).sort(), ['OPEN_DRAWER', 'PRINT_RECEIPT']);
  const stock = await prisma.locationStock.findUniqueOrThrow({ where: { locationId_productId_variantKey: { locationId: ids.location, productId: ids.product, variantKey: '' } } });
  assert.equal(stock.onHandMilliunits, 9000);
  const replay = await checkoutService.create({ id: ids.cashier, role: 'CASHIER' }, input);
  assert.equal(replay.checkout.id, result.checkout.id);
  assert.equal(await prisma.stockLedgerEvent.count({ where: { referenceId: result.checkout.id } }), 1);
  const customer = await prisma.customer.findUniqueOrThrow({ where: { id: ids.customer } });
  assert.equal(customer.loyaltyPoints, 10);
  assert.equal(customer.totalSpent, 10.83);
});

test('split cash/card-present tender captures token references without PAN data', async () => {
  const result = await checkoutService.create({ id: ids.cashier, role: 'CASHIER' }, { locationId: ids.location, shiftId: ids.shift, workstationDeviceId: ids.workstation, idempotencyKey: key('split'), items: [{ productId: ids.secondProduct, quantityMilliunits: 1000 }], tenders: [{ method: 'CASH', amountCents: 100 }, { method: 'CARD_PRESENT', amountCents: 441, readerDeviceId: ids.reader }] });
  assert.equal(result.checkout.status, 'COMPLETED');
  const card = result.checkout.tenders.find((tender) => tender.method === 'CARD_PRESENT')!;
  assert.equal(card.state, 'CAPTURED');
  assert.equal(card.cardLast4, '4242');
  assert.ok(card.tokenReference?.startsWith('sim_tok_'));
  assert.equal(JSON.stringify(card).match(/"(pan|cvv|track)"/i), null);
});

test('disconnect recovery exposes a controlled reversal when stock changes after capture', async () => {
  const input = { locationId: ids.location, shiftId: ids.shift, workstationDeviceId: ids.workstation, idempotencyKey: key('disconnect'), simulationOutcome: 'DISCONNECTED' as const, items: [{ productId: ids.secondProduct, quantityMilliunits: 1000 }], tenders: [{ method: 'CARD_PRESENT' as const, amountCents: 541, readerDeviceId: ids.reader }] };
  const pending = await checkoutService.create({ id: ids.cashier, role: 'CASHIER' }, input);
  assert.equal(pending.checkout.status, 'PAYMENT_PENDING');
  await prisma.locationStock.update({ where: { locationId_productId_variantKey: { locationId: ids.location, productId: ids.secondProduct, variantKey: '' } }, data: { onHandMilliunits: 0 } });
  await assert.rejects(() => checkoutService.retryPayment({ id: ids.cashier, role: 'CASHIER' }, pending.checkout.id, 'CAPTURED'), (error: any) => error.code === 'STOCK_CONFLICT');
  const reversed = await checkoutService.reversePayment({ id: ids.cashier, role: 'CASHIER' }, pending.checkout.id);
  assert.equal(reversed.checkout.status, 'CANCELLED');
  assert.equal(reversed.checkout.tenders[0].state, 'REVERSED');
  const replay = await checkoutService.reversePayment({ id: ids.cashier, role: 'CASHIER' }, pending.checkout.id);
  assert.equal(replay.duplicateReversal, true);
  await prisma.locationStock.update({ where: { locationId_productId_variantKey: { locationId: ids.location, productId: ids.secondProduct, variantKey: '' } }, data: { onHandMilliunits: 9000 } });
});

test('offline sync is cash-only, snapshot-checked, stock-aware, and replay-idempotent', async () => {
  const input = { locationId: ids.location, shiftId: ids.shift, workstationDeviceId: ids.workstation, idempotencyKey: key('offline'), source: 'OFFLINE' as const, offlineSequence: 1, capturedAt: new Date().toISOString(), expectedTotalCents: 541, expectedTaxProfileVersion: 1, items: [{ productId: ids.secondProduct, quantityMilliunits: 1000 }], tenders: [{ method: 'CASH' as const, amountCents: 541 }] };
  const completed = await checkoutService.create({ id: ids.cashier, role: 'CASHIER' }, input);
  assert.equal(completed.checkout.status, 'COMPLETED');
  assert.equal((await checkoutService.create({ id: ids.cashier, role: 'CASHIER' }, input)).checkout.id, completed.checkout.id);
  await assert.rejects(() => checkoutService.create({ id: ids.cashier, role: 'CASHIER' }, { ...input, idempotencyKey: key('offline-conflict'), offlineSequence: 2, expectedTaxProfileVersion: 99 }), (error: any) => error.code === 'OFFLINE_PRICE_TAX_CONFLICT');
  await assert.rejects(() => checkoutService.create({ id: ids.cashier, role: 'CASHIER' }, { ...input, idempotencyKey: key('offline-card'), offlineSequence: 3, tenders: [{ method: 'CARD_PRESENT', amountCents: 541, readerDeviceId: ids.reader }] }), (error: any) => error.code === 'OFFLINE_TENDER_FORBIDDEN');
});

test('refund requires separate manager approval, returns stock, cash, loyalty, and accounting liability', async () => {
  const requested = await refundService.request({ id: ids.cashier, role: 'CASHIER' }, { checkoutId: cashCheckout.id, idempotencyKey: key('refund'), reason: 'Customer returned unopened item', lines: [{ checkoutLineId: cashCheckout.lines[0].id, quantityMilliunits: 1000 }] });
  await assert.rejects(() => refundService.approve({ id: ids.cashier, role: 'MANAGER' }, requested.id), (error: any) => error.code === 'SELF_APPROVAL_FORBIDDEN');
  const completed = await refundService.approve({ id: ids.manager, role: 'MANAGER' }, requested.id);
  assert.equal(completed?.state, 'COMPLETED');
  assert.equal((await checkoutService.get(cashCheckout.id)).status, 'REFUNDED');
  const stock = await prisma.locationStock.findUniqueOrThrow({ where: { locationId_productId_variantKey: { locationId: ids.location, productId: ids.product, variantKey: '' } } });
  assert.equal(stock.onHandMilliunits, 10_000);
  assert.equal(await prisma.accountingOutbox.count({ where: { aggregateId: requested.id, eventType: 'REFUND_COMPLETED' } }), 1);
  const customer = await prisma.customer.findUniqueOrThrow({ where: { id: ids.customer } });
  assert.equal(customer.loyaltyPoints, 0);
  assert.ok(Math.abs(customer.totalSpent) < 0.000001);
});

test('attributable tax exemption is applied and revocation fails closed', async () => {
  const exemption = await request(app).post(`/api/v1/operations/admin/locations/${ids.location}/exemptions`).set('Authorization', `Bearer ${token(ids.manager)}`).send({ customerId: ids.customer, code: `EX-${run}`, certificateHash: 'a'.repeat(64) }).expect(201);
  const sale = await checkoutService.create({ id: ids.cashier, role: 'CASHIER' }, { locationId: ids.location, shiftId: ids.shift, workstationDeviceId: ids.workstation, idempotencyKey: key('exempt-sale'), customerId: ids.customer, exemptionCode: `EX-${run}`, items: [{ productId: ids.product, quantityMilliunits: 1000 }], tenders: [{ method: 'CASH', amountCents: 1000 }] });
  assert.equal(sale.checkout.taxCents, 0);
  await request(app).post(`/api/v1/operations/admin/exemptions/${exemption.body.data.exemption.id}/revoke`).set('Authorization', `Bearer ${token(ids.manager)}`).send({ reason: 'Certificate withdrawn by test authority' }).expect(200);
  await assert.rejects(() => checkoutService.create({ id: ids.cashier, role: 'CASHIER' }, { locationId: ids.location, shiftId: ids.shift, workstationDeviceId: ids.workstation, idempotencyKey: key('revoked-exempt'), customerId: ids.customer, exemptionCode: `EX-${run}`, items: [{ productId: ids.product, quantityMilliunits: 1000 }], tenders: [{ method: 'CASH', amountCents: 1000 }] }), (error: any) => error.code === 'EXEMPTION_INVALID');
});

test('gift-card issue, idempotent replay, redemption, refund, and liability are durable', async () => {
  const managerToken = token(ids.manager);
  const issueKey = key('gift-issue');
  const issued = await request(app).post('/api/v1/operations/gift-cards/issue').set('Authorization', `Bearer ${managerToken}`).send({ locationId: ids.location, amountCents: 1000, idempotencyKey: issueKey }).expect(201);
  const code = issued.body.data.giftCard.code;
  assert.ok(code.startsWith('GC-'));
  const replay = await request(app).post('/api/v1/operations/gift-cards/issue').set('Authorization', `Bearer ${managerToken}`).send({ locationId: ids.location, amountCents: 1000, idempotencyKey: issueKey }).expect(200);
  assert.equal(replay.body.data.giftCard.code, undefined);
  assert.equal(replay.body.duplicateIssuance, true);
  const sale = await checkoutService.create({ id: ids.cashier, role: 'CASHIER' }, { locationId: ids.location, shiftId: ids.shift, workstationDeviceId: ids.workstation, idempotencyKey: key('gift-sale'), items: [{ productId: ids.secondProduct, quantityMilliunits: 1000 }], tenders: [{ method: 'GIFT_CARD', amountCents: 541, giftCardCode: code }] });
  let card = await prisma.giftCardAccount.findUniqueOrThrow({ where: { id: issued.body.data.giftCard.id } });
  assert.equal(card.balanceCents, 459);
  assert.equal(card.liabilityCents, 459);
  const refund = await refundService.request({ id: ids.cashier, role: 'CASHIER' }, { checkoutId: sale.checkout.id, idempotencyKey: key('gift-refund'), reason: 'Customer returned gift-card purchase', lines: [{ checkoutLineId: sale.checkout.lines[0].id, quantityMilliunits: 1000 }] });
  await refundService.approve({ id: ids.manager, role: 'MANAGER' }, refund.id);
  card = await prisma.giftCardAccount.findUniqueOrThrow({ where: { id: card.id } });
  assert.equal(card.balanceCents, 1000);
  assert.equal(card.liabilityCents, 1000);
  assert.equal(await prisma.giftCardTransaction.count({ where: { giftCardId: card.id } }), 3);
});

test('device agent endpoints resolve barcodes and claim/ack jobs idempotently', async () => {
  const deviceId = `agent-${run}`;
  const enrollment = await request(app).post('/api/v1/operations/devices/enroll').set('Authorization', `Bearer ${token(ids.manager)}`).send({ locationId: ids.location, deviceId, displayName: 'Hardware test agent', kind: 'WORKSTATION', mode: 'SIMULATOR', capabilities: ['OFFLINE_QUEUE', 'BARCODE_SCANNER', 'RECEIPT_PRINTER', 'CASH_DRAWER'] }).expect(201);
  const credential = enrollment.body.data.credential;
  const headers = { 'X-Device-ID': deviceId, 'X-Device-Credential': credential };
  await request(app).post('/api/v1/operations/devices/heartbeat').set(headers).send({ capabilities: ['BARCODE_SCANNER', 'RECEIPT_PRINTER'] }).expect(200);
  await request(app).get(`/api/v1/operations/devices/barcode/${encodeURIComponent(`100${run}`)}`).set(headers).expect(200).expect((response) => assert.equal(response.body.data.product.id, ids.product));
  const job = await prisma.hardwareJob.create({ data: { deviceId, jobType: 'PRINT_RECEIPT', dedupeKey: key('agent-job'), payload: { test: true } } });
  const claimed = await request(app).post('/api/v1/operations/hardware/jobs/claim').set(headers).send({}).expect(200);
  assert.equal(claimed.body.data.job.id, job.id);
  await request(app).post(`/api/v1/operations/hardware/jobs/${job.id}/complete`).set(headers).send({ outcome: 'SUCCEEDED' }).expect(200);
  const duplicate = await request(app).post(`/api/v1/operations/hardware/jobs/${job.id}/complete`).set(headers).send({ outcome: 'SUCCEEDED' }).expect(200);
  assert.equal(duplicate.body.duplicateAcknowledgement, true);
});

test('reconciliation closes the shift and immutable audit evidence rejects mutation', async () => {
  const shift = await prisma.registerShift.findUniqueOrThrow({ where: { id: ids.shift } });
  const response = await request(app).post(`/api/v1/operations/shifts/${ids.shift}/close`).set('Authorization', `Bearer ${token(ids.cashier)}`).send({ countedCashCents: shift.expectedCashCents }).expect(200);
  assert.equal(response.body.data.reconciliation.state, 'COMPLETED');
  const events = await prisma.operationalAudit.findMany({ where: { locationId: ids.location }, orderBy: { sequence: 'asc' } });
  assert.ok(events.length >= 8);
  for (let index = 1; index < events.length; index += 1) assert.equal(events[index].previousHash, events[index - 1].eventHash);
  await assert.rejects(() => prisma.operationalAudit.update({ where: { id: events[0].id }, data: { outcome: 'TAMPERED' } }), /immutable operational evidence/);
});
