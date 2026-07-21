import { Router, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { config } from '../config/environment';
import { appendOperationalAudit } from '../services/operations/audit';
import { CheckoutInput, CheckoutService } from '../services/operations/checkoutService';
import { OperationsError } from '../services/operations/errors';
import { RefundService } from '../services/operations/refundService';
import { hashDeviceCredential, hashGiftCardCode, issueOpaqueCredential, verifyDeviceCredential } from '../services/operations/security';
import { terminalGateway } from '../services/operations/terminalGateway';

const router = Router();
const checkouts = new CheckoutService(prisma);
const refunds = new RefundService(prisma);

function asyncRoute(handler: (req: AuthRequest, res: Response) => Promise<unknown>) {
  return (req: AuthRequest, res: Response, next: NextFunction) => Promise.resolve(handler(req, res)).catch(next);
}

function actor(req: AuthRequest) {
  if (!req.user) throw new OperationsError('Authentication required', 401, 'AUTH_REQUIRED');
  return { id: req.user.id, role: req.user.role };
}

function bodyObject(req: AuthRequest): Record<string, any> {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) throw new OperationsError('JSON object body is required', 400, 'BODY_INVALID');
  return req.body;
}

async function authenticateDevice(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const deviceId = req.header('X-Device-ID');
    const credential = req.header('X-Device-Credential');
    if (!deviceId || !credential) throw new OperationsError('Device credentials are required', 401, 'DEVICE_AUTH_REQUIRED');
    const device = await prisma.deviceEnrollment.findUnique({ where: { deviceId } });
    if (!device || !verifyDeviceCredential(credential, device.credentialHash) || device.status === 'REVOKED') throw new OperationsError('Device credentials are invalid', 401, 'DEVICE_AUTH_INVALID');
    (req as any).device = device;
    next();
  } catch (error) { next(error); }
}

// A clean deployment first records the bounded location, tax profile, and stock.
router.post('/admin/locations', authenticate, authorize('ADMIN'), asyncRoute(async (req, res) => {
  const input = bodyObject(req);
  if (!/^[A-Z0-9_-]{2,20}$/.test(input.code ?? '') || !input.name || !input.timezone || !/^[A-Z]{3}$/.test(input.currency ?? '') || !input.jurisdictionCode || !Number.isInteger(input.rateBps) || input.rateBps < 0) throw new OperationsError('Location and versioned tax profile are invalid', 422, 'LOCATION_CONFIG_INVALID');
  if (input.isCertified && String(input.certificationRef ?? '').length < 10) throw new OperationsError('Certified tax profiles require attributable certification evidence', 422, 'TAX_CERTIFICATION_EVIDENCE_REQUIRED');
  const user = actor(req);
  const location = await prisma.$transaction(async (tx) => {
    const record = await tx.storeLocation.create({ data: { code: input.code, name: input.name, timezone: input.timezone, currency: input.currency, fiscalMode: input.isCertified ? 'CERTIFIED_PROFILE' : 'NON_FISCAL_SIMULATION', taxProfiles: { create: { jurisdictionCode: input.jurisdictionCode, version: 1, effectiveFrom: new Date(), isCertified: Boolean(input.isCertified), certificationRef: input.certificationRef ?? null, rules: { create: { name: input.taxName ?? 'General sales tax', rateBps: input.rateBps, appliesTo: 'ALL', priority: 100 } } } } } });
    await appendOperationalAudit(tx, { locationId: record.id, actorId: user.id, action: 'LOCATION_PROVISIONED', resourceType: 'StoreLocation', resourceId: record.id, outcome: 'SUCCESS', metadata: { jurisdictionCode: input.jurisdictionCode, certified: Boolean(input.isCertified) } });
    return record;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  res.status(201).json({ success: true, data: { location }, boundary: location.fiscalMode === 'NON_FISCAL_SIMULATION' ? 'NOT_FISCALLY_CERTIFIED' : undefined });
}));

router.put('/admin/locations/:locationId/stock', authenticate, authorize('ADMIN', 'MANAGER'), asyncRoute(async (req, res) => {
  const input = bodyObject(req);
  if (!input.productId || !Number.isInteger(input.onHandMilliunits) || input.onHandMilliunits < 0 || !/^[A-Za-z0-9._:-]{8,128}$/.test(input.idempotencyKey ?? '')) throw new OperationsError('Product, non-negative milliunit stock, and an idempotency key are required', 422, 'STOCK_CONFIG_INVALID');
  const user = actor(req);
  const stock = await prisma.$transaction(async (tx) => {
    const location = await tx.storeLocation.findFirst({ where: { id: req.params.locationId, isActive: true } });
    const product = await tx.product.findFirst({ where: { id: input.productId, isActive: true } });
    if (!location || !product) throw new OperationsError('Location or product not found', 404, 'STOCK_SCOPE_INVALID');
    const replay = await tx.stockLedgerEvent.findUnique({ where: { idempotencyKey: input.idempotencyKey }, include: { stock: true } });
    if (replay) {
      if (replay.stock.locationId !== location.id || replay.stock.productId !== product.id || replay.resultingMilliunits !== input.onHandMilliunits) throw new OperationsError('Idempotency key was already used for a different stock count', 409, 'IDEMPOTENCY_CONFLICT');
      return replay.stock;
    }
    const before = await tx.locationStock.findUnique({ where: { locationId_productId_variantKey: { locationId: location.id, productId: product.id, variantKey: input.variantId ?? '' } } });
    const record = await tx.locationStock.upsert({ where: { locationId_productId_variantKey: { locationId: location.id, productId: product.id, variantKey: input.variantId ?? '' } }, create: { locationId: location.id, productId: product.id, variantKey: input.variantId ?? '', onHandMilliunits: input.onHandMilliunits }, update: { onHandMilliunits: input.onHandMilliunits, version: { increment: 1 } } });
    await tx.stockLedgerEvent.create({ data: { stockId: record.id, deltaMilliunits: input.onHandMilliunits - (before?.onHandMilliunits ?? 0), resultingMilliunits: record.onHandMilliunits, reason: 'COUNT_SET', referenceId: String(input.countReference ?? 'INITIAL_COUNT').slice(0, 160), idempotencyKey: input.idempotencyKey } });
    await appendOperationalAudit(tx, { locationId: location.id, actorId: user.id, action: 'STOCK_COUNT_SET', resourceType: 'LocationStock', resourceId: record.id, outcome: 'SUCCESS', metadata: { productId: product.id, resultingMilliunits: record.onHandMilliunits } });
    return record;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  res.json({ success: true, data: { stock } });
}));

router.post('/admin/locations/:locationId/exemptions', authenticate, authorize('ADMIN', 'MANAGER'), asyncRoute(async (req, res) => {
  const input = bodyObject(req);
  if (!input.customerId || !input.code || !/^[a-f0-9]{64}$/i.test(input.certificateHash ?? '')) throw new OperationsError('Customer, exemption code, and SHA-256 certificate hash are required', 422, 'EXEMPTION_INVALID');
  const user = actor(req);
  const validFrom = input.validFrom ? new Date(input.validFrom) : new Date();
  const validUntil = input.validUntil ? new Date(input.validUntil) : null;
  if (Number.isNaN(validFrom.getTime()) || validUntil && (Number.isNaN(validUntil.getTime()) || validUntil <= validFrom)) throw new OperationsError('Exemption validity period is invalid', 422, 'EXEMPTION_PERIOD_INVALID');
  const record = await prisma.$transaction(async (tx) => {
    const exemption = await tx.taxExemption.create({ data: { locationId: req.params.locationId, customerId: input.customerId, code: String(input.code).slice(0, 80), certificateHash: input.certificateHash.toLowerCase(), validFrom, validUntil, approvedBy: user.id } });
    await appendOperationalAudit(tx, { locationId: req.params.locationId, actorId: user.id, action: 'TAX_EXEMPTION_APPROVED', resourceType: 'TaxExemption', resourceId: exemption.id, outcome: 'SUCCESS', metadata: { customerId: input.customerId, code: exemption.code, validUntil: exemption.validUntil?.toISOString() ?? null } });
    return exemption;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  res.status(201).json({ success: true, data: { exemption: { id: record.id, code: record.code, validUntil: record.validUntil } } });
}));

router.post('/admin/exemptions/:id/revoke', authenticate, authorize('ADMIN', 'MANAGER'), asyncRoute(async (req, res) => {
  const user = actor(req); const reason = String(bodyObject(req).reason ?? '').trim();
  if (reason.length < 10) throw new OperationsError('Exemption revocation reason is required', 422, 'EXEMPTION_REVOCATION_REASON_REQUIRED');
  const record = await prisma.$transaction(async (tx) => {
    const existing = await tx.taxExemption.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new OperationsError('Tax exemption not found', 404, 'EXEMPTION_NOT_FOUND');
    if (existing.revokedAt) return existing;
    const revoked = await tx.taxExemption.update({ where: { id: existing.id }, data: { revokedAt: new Date() } });
    await appendOperationalAudit(tx, { locationId: existing.locationId, actorId: user.id, action: 'TAX_EXEMPTION_REVOKED', resourceType: 'TaxExemption', resourceId: existing.id, outcome: 'SUCCESS', metadata: { reason: reason.slice(0, 200) } });
    return revoked;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  res.json({ success: true, data: { exemption: { id: record.id, revokedAt: record.revokedAt } } });
}));

router.post('/admin/locations/:locationId/tax-profiles', authenticate, authorize('ADMIN'), asyncRoute(async (req, res) => {
  const user = actor(req); const input = bodyObject(req);
  if (!input.jurisdictionCode || !Array.isArray(input.rules) || input.rules.length < 1 || input.rules.length > 20 || input.rules.some((rule: any) => !rule.name || !Number.isInteger(rule.rateBps) || rule.rateBps < 0 || rule.rateBps > 100_000 || !['ALL', 'PRODUCT', 'CATEGORY'].includes(rule.appliesTo) || rule.appliesTo !== 'ALL' && !rule.referenceId)) throw new OperationsError('Versioned tax rules are invalid', 422, 'TAX_PROFILE_INVALID');
  if (input.isCertified && String(input.certificationRef ?? '').length < 10) throw new OperationsError('Certified tax profiles require attributable certification evidence', 422, 'TAX_CERTIFICATION_EVIDENCE_REQUIRED');
  const effectiveFrom = new Date(input.effectiveFrom);
  if (Number.isNaN(effectiveFrom.getTime())) throw new OperationsError('Tax effective date is invalid', 422, 'TAX_EFFECTIVE_DATE_INVALID');
  const profile = await prisma.$transaction(async (tx) => {
    const latest = await tx.taxProfile.findFirst({ where: { locationId: req.params.locationId }, orderBy: { version: 'desc' } });
    if (!latest) throw new OperationsError('Location tax configuration not found', 404, 'LOCATION_NOT_FOUND');
    if (effectiveFrom <= latest.effectiveFrom) throw new OperationsError('New tax profile must take effect after the current profile', 409, 'TAX_PROFILE_ORDER_INVALID');
    if (!latest.effectiveUntil || latest.effectiveUntil > effectiveFrom) await tx.taxProfile.update({ where: { id: latest.id }, data: { effectiveUntil: effectiveFrom } });
    const created = await tx.taxProfile.create({ data: { locationId: req.params.locationId, jurisdictionCode: String(input.jurisdictionCode).slice(0, 80), version: latest.version + 1, roundingMode: 'HALF_UP', effectiveFrom, isCertified: Boolean(input.isCertified), certificationRef: input.certificationRef ?? null, rules: { create: input.rules.map((rule: any, index: number) => ({ name: String(rule.name).slice(0, 120), rateBps: rule.rateBps, appliesTo: rule.appliesTo, referenceId: rule.referenceId ?? null, priority: Number.isInteger(rule.priority) ? rule.priority : index + 1, compound: false })) } }, include: { rules: true } });
    await appendOperationalAudit(tx, { locationId: req.params.locationId, actorId: user.id, action: 'TAX_PROFILE_VERSIONED', resourceType: 'TaxProfile', resourceId: created.id, outcome: 'SUCCESS', metadata: { version: created.version, jurisdictionCode: created.jurisdictionCode, certified: created.isCertified } });
    return created;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  res.status(201).json({ success: true, data: { profile }, boundary: profile.isCertified ? undefined : 'NOT_FISCALLY_CERTIFIED' });
}));

router.get('/locations/:locationId/catalog', authenticate, authorize('ADMIN', 'MANAGER', 'CASHIER'), asyncRoute(async (req, res) => {
  const now = new Date();
  const [location, profile, stocks] = await Promise.all([
    prisma.storeLocation.findFirst({ where: { id: req.params.locationId, isActive: true } }),
    prisma.taxProfile.findFirst({ where: { locationId: req.params.locationId, effectiveFrom: { lte: now }, OR: [{ effectiveUntil: null }, { effectiveUntil: { gt: now } }] }, include: { rules: true }, orderBy: { version: 'desc' } }),
    prisma.locationStock.findMany({ where: { locationId: req.params.locationId, product: { isActive: true } }, include: { product: { select: { id: true, name: true, sku: true, barcode: true, price: true, categoryId: true, isWeighed: true } } }, orderBy: { product: { name: 'asc' } } }),
  ]);
  if (!location || !profile) throw new OperationsError('Location catalog or tax profile is unavailable', 404, 'CATALOG_NOT_READY');
  res.set('Cache-Control', 'no-store').json({ success: true, data: { location: { id: location.id, code: location.code, currency: location.currency, fiscalMode: location.fiscalMode }, taxProfile: { version: profile.version, jurisdictionCode: profile.jurisdictionCode, isCertified: profile.isCertified, rules: profile.rules.map((rule) => ({ id: rule.id, rateBps: rule.rateBps, appliesTo: rule.appliesTo, referenceId: rule.referenceId, priority: rule.priority, compound: rule.compound })) }, products: stocks.map((stock) => ({ ...stock.product, unitPriceCents: Math.round(stock.product.price * 100), variantKey: stock.variantKey, availableMilliunits: stock.onHandMilliunits - stock.reservedMilliunits, version: stock.version })) } });
}));

// Device enrollment returns a one-time credential. Physical driver certification is external.
router.post('/devices/enroll', authenticate, authorize('ADMIN', 'MANAGER'), asyncRoute(async (req, res) => {
  const input = bodyObject(req);
  const allowedCapabilities = ['OFFLINE_QUEUE', 'BARCODE_SCANNER', 'RECEIPT_PRINTER', 'CASH_DRAWER', 'CARD_PRESENT'];
  if (!input.locationId || !/^[A-Za-z0-9._:-]{4,80}$/.test(input.deviceId ?? '') || !input.displayName || !['WORKSTATION', 'PAYMENT_READER'].includes(input.kind) || !Array.isArray(input.capabilities) || input.capabilities.some((item: string) => !allowedCapabilities.includes(item))) throw new OperationsError('Device enrollment is invalid', 422, 'DEVICE_ENROLLMENT_INVALID');
  if (input.mode === 'SIMULATOR' && config.nodeEnv === 'production') throw new OperationsError('Simulator devices are prohibited in production', 422, 'SIMULATOR_PRODUCTION_FORBIDDEN');
  if (input.kind === 'PAYMENT_READER' && !input.capabilities.includes('CARD_PRESENT')) throw new OperationsError('Payment reader must declare card-present capability', 422, 'READER_CAPABILITY_REQUIRED');
  if (input.kind === 'PAYMENT_READER' && input.mode !== 'SIMULATOR') {
    const verified = await terminalGateway().verifyReader(input.deviceId);
    if (!verified.connected) throw new OperationsError('Certified reader is not online', 409, 'READER_DISCONNECTED');
  }
  const credential = issueOpaqueCredential();
  const record = await prisma.deviceEnrollment.create({ data: { locationId: input.locationId, deviceId: input.deviceId, displayName: input.displayName, kind: input.kind, provider: input.provider ?? (input.mode === 'SIMULATOR' ? 'simulator' : config.operations.paymentProvider), mode: input.mode ?? 'AGENT', capabilities: input.capabilities, credentialHash: hashDeviceCredential(credential) } });
  res.status(201).json({ success: true, data: { device: { id: record.id, deviceId: record.deviceId, capabilities: record.capabilities }, credential }, warning: 'The device credential is returned once; store it in the local agent secret store.' });
}));

router.post('/devices/heartbeat', authenticateDevice, asyncRoute(async (req, res) => {
  const device = (req as any).device;
  const input = bodyObject(req);
  const reported = Array.isArray(input.capabilities) ? input.capabilities.filter((capability: string) => device.capabilities.includes(capability)) : device.capabilities;
  const updated = await prisma.deviceEnrollment.update({ where: { id: device.id }, data: { status: 'ONLINE', lastSeenAt: new Date(), disconnectedAt: null, disconnectReason: null, capabilities: reported } });
  res.json({ success: true, data: { device: { deviceId: updated.deviceId, status: updated.status, capabilities: updated.capabilities } } });
}));

router.post('/devices/disconnect', authenticateDevice, asyncRoute(async (req, res) => {
  const device = (req as any).device;
  const reason = String(bodyObject(req).reason ?? 'AGENT_DISCONNECTED').slice(0, 120);
  await prisma.deviceEnrollment.update({ where: { id: device.id }, data: { status: 'DISCONNECTED', disconnectedAt: new Date(), disconnectReason: reason } });
  res.json({ success: true });
}));

router.post('/devices/:deviceId/revoke', authenticate, authorize('ADMIN', 'MANAGER'), asyncRoute(async (req, res) => {
  const user = actor(req); const reason = String(bodyObject(req).reason ?? '').trim();
  if (reason.length < 10) throw new OperationsError('Device revocation reason is required', 422, 'DEVICE_REVOCATION_REASON_REQUIRED');
  const record = await prisma.$transaction(async (tx) => {
    const existing = await tx.deviceEnrollment.findUnique({ where: { deviceId: req.params.deviceId } });
    if (!existing) throw new OperationsError('Device not found', 404, 'DEVICE_NOT_FOUND');
    const revoked = await tx.deviceEnrollment.update({ where: { id: existing.id }, data: { status: 'REVOKED', disconnectedAt: new Date(), disconnectReason: reason.slice(0, 120) } });
    await appendOperationalAudit(tx, { locationId: existing.locationId, actorId: user.id, action: 'DEVICE_REVOKED', resourceType: 'DeviceEnrollment', resourceId: existing.id, outcome: 'SUCCESS', metadata: { deviceId: existing.deviceId, reason: reason.slice(0, 120) } });
    return revoked;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  res.json({ success: true, data: { device: { deviceId: record.deviceId, status: record.status } } });
}));

router.post('/hardware/jobs/claim', authenticateDevice, asyncRoute(async (req, res) => {
  const device = (req as any).device;
  const job = await prisma.$transaction(async (tx) => {
    const candidate = await tx.hardwareJob.findFirst({ where: { deviceId: device.deviceId, attempts: { lt: 5 }, OR: [{ state: 'QUEUED', nextAttemptAt: { lte: new Date() } }, { state: 'CLAIMED', claimedAt: { lte: new Date(Date.now() - 60_000) } }] }, orderBy: { createdAt: 'asc' } });
    if (!candidate) return null;
    return tx.hardwareJob.update({ where: { id: candidate.id }, data: { state: 'CLAIMED', claimedAt: new Date(), attempts: { increment: 1 } } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  res.json({ success: true, data: { job } });
}));

router.get('/devices/barcode/:value', authenticateDevice, asyncRoute(async (req, res) => {
  const device = (req as any).device;
  if (!device.capabilities.includes('BARCODE_SCANNER')) throw new OperationsError('Device has no barcode-scanner capability', 403, 'BARCODE_CAPABILITY_REQUIRED');
  const stock = await prisma.locationStock.findFirst({ where: { locationId: device.locationId, product: { barcode: req.params.value, isActive: true } }, include: { product: { select: { id: true, name: true, sku: true, barcode: true, price: true } } } });
  if (!stock) throw new OperationsError('Barcode is not in the location catalog', 404, 'BARCODE_NOT_FOUND');
  res.set('Cache-Control', 'no-store').json({ success: true, data: { product: { ...stock.product, unitPriceCents: Math.round(stock.product.price * 100), availableMilliunits: stock.onHandMilliunits - stock.reservedMilliunits, stockVersion: stock.version } } });
}));

router.post('/hardware/jobs/:id/complete', authenticateDevice, asyncRoute(async (req, res) => {
  const device = (req as any).device;
  const input = bodyObject(req);
  if (!['SUCCEEDED', 'RETRYABLE_FAILURE', 'PERMANENT_FAILURE'].includes(input.outcome)) throw new OperationsError('Hardware outcome is invalid', 422, 'HARDWARE_OUTCOME_INVALID');
  const current = await prisma.hardwareJob.findFirst({ where: { id: req.params.id, deviceId: device.deviceId } });
  if (!current) throw new OperationsError('Hardware job not found', 404, 'HARDWARE_JOB_NOT_FOUND');
  if (current.state === 'SUCCEEDED') return res.json({ success: true, data: { job: current }, duplicateAcknowledgement: true });
  const retry = input.outcome === 'RETRYABLE_FAILURE' && current.attempts < 5;
  const updated = await prisma.hardwareJob.update({ where: { id: current.id }, data: { state: input.outcome === 'SUCCEEDED' ? 'SUCCEEDED' : retry ? 'QUEUED' : 'FAILED', completedAt: input.outcome === 'SUCCEEDED' ? new Date() : null, nextAttemptAt: retry ? new Date(Date.now() + Math.min(60_000, 1000 * 2 ** current.attempts)) : current.nextAttemptAt, lastErrorCode: input.errorCode ? String(input.errorCode).slice(0, 80) : null, operatorMessage: input.operatorMessage ? String(input.operatorMessage).slice(0, 300) : null } });
  if (updated.jobType === 'PRINT_RECEIPT' && updated.state === 'SUCCEEDED' && updated.checkoutId) await prisma.operationalReceipt.update({ where: { checkoutId: updated.checkoutId }, data: { printedAt: new Date() } });
  res.json({ success: true, data: { job: updated } });
}));

router.get('/hardware/failures', authenticate, authorize('ADMIN', 'MANAGER', 'CASHIER'), asyncRoute(async (req, res) => {
  const locationId = String(req.query.locationId ?? '');
  const jobs = await prisma.hardwareJob.findMany({ where: { state: 'FAILED', device: { locationId } }, select: { id: true, checkoutId: true, deviceId: true, jobType: true, attempts: true, lastErrorCode: true, operatorMessage: true, updatedAt: true }, orderBy: { updatedAt: 'desc' }, take: 100 });
  res.json({ success: true, data: { jobs } });
}));

// Shift and cash-control workflow.
router.post('/locations/:locationId/shifts/open', authenticate, authorize('ADMIN', 'MANAGER', 'CASHIER'), asyncRoute(async (req, res) => {
  const user = actor(req); const input = bodyObject(req);
  if (!Number.isInteger(input.openingCashCents) || input.openingCashCents < 0) throw new OperationsError('Opening cash must be non-negative integer cents', 422, 'OPENING_CASH_INVALID');
  const shift = await prisma.$transaction(async (tx) => {
    const existing = await tx.registerShift.findFirst({ where: { locationId: req.params.locationId, userId: user.id, state: { in: ['OPEN', 'CLOSING'] } } });
    if (existing) throw new OperationsError('User already has an open shift at this location', 409, 'SHIFT_ALREADY_OPEN');
    const record = await tx.registerShift.create({ data: { locationId: req.params.locationId, userId: user.id, openingCashCents: input.openingCashCents, expectedCashCents: input.openingCashCents } });
    await appendOperationalAudit(tx, { locationId: req.params.locationId, actorId: user.id, action: 'SHIFT_OPENED', resourceType: 'RegisterShift', resourceId: record.id, outcome: 'SUCCESS', metadata: { openingCashCents: input.openingCashCents } });
    return record;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  res.status(201).json({ success: true, data: { shift } });
}));

router.post('/shifts/:id/close', authenticate, authorize('ADMIN', 'MANAGER', 'CASHIER'), asyncRoute(async (req, res) => {
  const user = actor(req); const input = bodyObject(req);
  if (!Number.isInteger(input.countedCashCents) || input.countedCashCents < 0) throw new OperationsError('Counted cash must be non-negative integer cents', 422, 'CASH_COUNT_INVALID');
  const reconciliation = await prisma.$transaction(async (tx) => {
    const shift = await tx.registerShift.findFirst({ where: { id: req.params.id, state: 'OPEN', ...(user.role === 'CASHIER' ? { userId: user.id } : {}) } });
    if (!shift) throw new OperationsError('Open shift not found', 404, 'SHIFT_NOT_FOUND');
    const card = await tx.operationalTender.aggregate({ where: { method: 'CARD_PRESENT', state: 'CAPTURED', checkout: { shiftId: shift.id } }, _sum: { amountCents: true } });
    const refunded = await tx.paymentOperation.aggregate({ where: { operation: 'REFUND', state: 'CAPTURED', tender: { method: 'CARD_PRESENT', checkout: { shiftId: shift.id } } }, _sum: { amountCents: true } });
    const variance = input.countedCashCents - shift.expectedCashCents;
    const needsManager = Math.abs(variance) > config.operations.cashVarianceApprovalCents;
    const run = await tx.reconciliationRun.create({ data: { locationId: shift.locationId, shiftId: shift.id, expectedCashCents: shift.expectedCashCents, countedCashCents: input.countedCashCents, cashVarianceCents: variance, capturedCardCents: card._sum.amountCents ?? 0, refundedCardCents: refunded._sum.amountCents ?? 0, providerSettlementRef: input.providerSettlementRef ?? null, state: needsManager ? 'PENDING_MANAGER' : 'COMPLETED', completedAt: needsManager ? null : new Date() } });
    await tx.registerShift.update({ where: { id: shift.id }, data: { state: needsManager ? 'CLOSING' : 'CLOSED', countedCashCents: input.countedCashCents, varianceCents: variance, closedAt: needsManager ? null : new Date() } });
    await appendOperationalAudit(tx, { locationId: shift.locationId, actorId: user.id, action: 'SHIFT_COUNTED', resourceType: 'RegisterShift', resourceId: shift.id, outcome: needsManager ? 'PENDING_MANAGER' : 'SUCCESS', metadata: { expectedCashCents: shift.expectedCashCents, countedCashCents: input.countedCashCents, varianceCents: variance } });
    return run;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  res.json({ success: true, data: { reconciliation } });
}));

router.post('/reconciliations/:id/approve', authenticate, authorize('ADMIN', 'MANAGER'), asyncRoute(async (req, res) => {
  const user = actor(req); const note = String(bodyObject(req).note ?? '');
  if (note.trim().length < 10) throw new OperationsError('Manager variance note is required', 422, 'MANAGER_NOTE_REQUIRED');
  const result = await prisma.$transaction(async (tx) => {
    const run = await tx.reconciliationRun.findFirst({ where: { id: req.params.id, state: 'PENDING_MANAGER' } });
    if (!run) throw new OperationsError('Pending reconciliation not found', 404, 'RECONCILIATION_NOT_FOUND');
    const updated = await tx.reconciliationRun.update({ where: { id: run.id }, data: { state: 'COMPLETED', managerApprovedBy: user.id, managerNote: note.trim(), completedAt: new Date() } });
    await tx.registerShift.update({ where: { id: run.shiftId }, data: { state: 'CLOSED', managerApprovedBy: user.id, managerApprovalNote: note.trim(), closedAt: new Date() } });
    await tx.accountingOutbox.create({ data: { locationId: run.locationId, eventType: 'SHIFT_RECONCILED', aggregateType: 'ReconciliationRun', aggregateId: run.id, idempotencyKey: `${run.id}:accounting:reconciliation`, payload: { expectedCashCents: run.expectedCashCents, countedCashCents: run.countedCashCents, varianceCents: run.cashVarianceCents, capturedCardCents: run.capturedCardCents, providerSettlementRef: run.providerSettlementRef } } });
    await appendOperationalAudit(tx, { locationId: run.locationId, actorId: user.id, action: 'RECONCILIATION_APPROVED', resourceType: 'ReconciliationRun', resourceId: run.id, outcome: 'SUCCESS', metadata: { varianceCents: run.cashVarianceCents } });
    return updated;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  res.json({ success: true, data: { reconciliation: result } });
}));

// Checkout, recovery, returns, receipts.
router.post('/checkouts', authenticate, asyncRoute(async (req, res) => {
  const result = await checkouts.create(actor(req), bodyObject(req) as CheckoutInput);
  res.status(result.checkout.status === 'COMPLETED' ? 201 : 202).json({ success: true, data: result });
}));
router.get('/checkouts/:id', authenticate, asyncRoute(async (req, res) => {
  const checkout = await checkouts.get(req.params.id);
  const user = actor(req);
  if (checkout.userId !== user.id && !['ADMIN', 'MANAGER'].includes(user.role)) throw new OperationsError('Checkout not found', 404, 'CHECKOUT_NOT_FOUND');
  res.set('Cache-Control', 'no-store').json({ success: true, data: { checkout } });
}));
router.post('/checkouts/:id/retry-payment', authenticate, asyncRoute(async (req, res) => {
  const result = await checkouts.retryPayment(actor(req), req.params.id, bodyObject(req).simulationOutcome);
  res.status(result.checkout.status === 'COMPLETED' ? 200 : 202).json({ success: true, data: result });
}));
router.post('/checkouts/:id/reverse-payment', authenticate, asyncRoute(async (req, res) => {
  const result = await checkouts.reversePayment(actor(req), req.params.id);
  res.json({ success: true, data: result });
}));
router.post('/refunds', authenticate, asyncRoute(async (req, res) => {
  const refund = await refunds.request(actor(req), bodyObject(req) as any);
  res.status(202).json({ success: true, data: { refund } });
}));
router.post('/refunds/:id/approve', authenticate, authorize('ADMIN', 'MANAGER'), asyncRoute(async (req, res) => {
  const refund = await refunds.approve(actor(req), req.params.id);
  res.json({ success: true, data: { refund } });
}));

router.get('/receipts/:receiptNumber', authenticate, asyncRoute(async (req, res) => {
  const receipt = await prisma.operationalReceipt.findUnique({ where: { receiptNumber: req.params.receiptNumber }, include: { checkout: { select: { userId: true, locationId: true } } } });
  const user = actor(req);
  if (!receipt || receipt.checkout.userId !== user.id && !['ADMIN', 'MANAGER'].includes(user.role)) throw new OperationsError('Receipt not found', 404, 'RECEIPT_NOT_FOUND');
  res.set('Cache-Control', 'no-store').json({ success: true, data: { receipt } });
}));

router.post('/receipts/:receiptNumber/reprint', authenticate, authorize('ADMIN', 'MANAGER'), asyncRoute(async (req, res) => {
  const user = actor(req); const input = bodyObject(req);
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(input.idempotencyKey ?? '') || String(input.reason ?? '').trim().length < 5) throw new OperationsError('Reprint idempotency key and reason are required', 422, 'REPRINT_APPROVAL_INVALID');
  const job = await prisma.$transaction(async (tx) => {
    const receipt = await tx.operationalReceipt.findUnique({ where: { receiptNumber: req.params.receiptNumber }, include: { checkout: true } });
    if (!receipt?.checkout.deviceId) throw new OperationsError('Receipt workstation is unavailable', 404, 'RECEIPT_NOT_FOUND');
    const device = await tx.deviceEnrollment.findUnique({ where: { deviceId: receipt.checkout.deviceId } });
    if (!device || !device.capabilities.includes('RECEIPT_PRINTER') || device.status === 'REVOKED') throw new OperationsError('Receipt printer capability is unavailable', 409, 'PRINTER_NOT_READY');
    const queued = await tx.hardwareJob.upsert({ where: { dedupeKey: `reprint:${receipt.id}:${input.idempotencyKey}` }, create: { checkoutId: receipt.checkoutId, deviceId: receipt.checkout.deviceId, jobType: 'PRINT_RECEIPT', dedupeKey: `reprint:${receipt.id}:${input.idempotencyKey}`, payload: { receiptNumber: receipt.receiptNumber, reprint: true, approvedBy: user.id, reason: String(input.reason).trim().slice(0, 200) } }, update: {} });
    await appendOperationalAudit(tx, { locationId: receipt.checkout.locationId, actorId: user.id, action: 'RECEIPT_REPRINT_APPROVED', resourceType: 'OperationalReceipt', resourceId: receipt.id, outcome: 'SUCCESS', metadata: { jobId: queued.id, reason: String(input.reason).trim().slice(0, 200) } });
    return queued;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  res.status(202).json({ success: true, data: { job } });
}));

router.post('/gift-cards/issue', authenticate, authorize('ADMIN', 'MANAGER'), asyncRoute(async (req, res) => {
  const user = actor(req); const input = bodyObject(req);
  if (!input.locationId || !Number.isInteger(input.amountCents) || input.amountCents < 100 || input.amountCents > 1_000_000 || !/^[A-Za-z0-9._:-]{8,128}$/.test(input.idempotencyKey ?? '')) throw new OperationsError('Gift-card amount and idempotency key are invalid', 422, 'GIFT_CARD_ISSUE_INVALID');
  const replay = await prisma.giftCardTransaction.findUnique({ where: { idempotencyKey: input.idempotencyKey }, include: { giftCard: true } });
  if (replay) {
    if (replay.type !== 'ISSUE' || replay.amountCents !== input.amountCents || replay.giftCard.locationId !== input.locationId) throw new OperationsError('Idempotency key was already used for a different gift-card issue', 409, 'IDEMPOTENCY_CONFLICT');
    return res.json({ success: true, data: { giftCard: { id: replay.giftCard.id, lastFour: replay.giftCard.lastFour, balanceCents: replay.giftCard.balanceCents } }, duplicateIssuance: true, warning: 'The gift-card code cannot be returned again.' });
  }
  const code = `GC-${issueOpaqueCredential(18).toUpperCase()}`;
  const card = await prisma.$transaction(async (tx) => {
    const record = await tx.giftCardAccount.create({ data: { locationId: input.locationId, codeHash: hashGiftCardCode(code), lastFour: code.slice(-4), balanceCents: input.amountCents, liabilityCents: input.amountCents, transactions: { create: { type: 'ISSUE', amountCents: input.amountCents, balanceAfterCents: input.amountCents, idempotencyKey: input.idempotencyKey } } } });
    await tx.accountingOutbox.create({ data: { locationId: input.locationId, eventType: 'GIFT_CARD_ISSUED', aggregateType: 'GiftCardAccount', aggregateId: record.id, idempotencyKey: `${input.idempotencyKey}:accounting`, payload: { amountCents: input.amountCents, liabilityCents: input.amountCents } } });
    await appendOperationalAudit(tx, { locationId: input.locationId, actorId: user.id, action: 'GIFT_CARD_ISSUED', resourceType: 'GiftCardAccount', resourceId: record.id, outcome: 'SUCCESS', metadata: { amountCents: input.amountCents, lastFour: record.lastFour } });
    return record;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  res.status(201).json({ success: true, data: { giftCard: { id: card.id, code, lastFour: card.lastFour, balanceCents: card.balanceCents } }, warning: 'The gift-card code is returned once.' });
}));

router.get('/accounting/outbox', authenticate, authorize('ADMIN', 'MANAGER'), asyncRoute(async (req, res) => {
  const locationId = String(req.query.locationId ?? '');
  const events = await prisma.accountingOutbox.findMany({ where: { locationId, state: { in: ['PENDING', 'FAILED'] } }, orderBy: { createdAt: 'asc' }, take: 100 });
  res.json({ success: true, data: { events } });
}));
router.post('/accounting/outbox/:id/acknowledge', authenticate, authorize('ADMIN', 'MANAGER'), asyncRoute(async (req, res) => {
  const user = actor(req); const input = bodyObject(req);
  if (!input.externalRef || String(input.externalRef).length > 160) throw new OperationsError('Accounting external reference is required', 422, 'ACCOUNTING_ACK_INVALID');
  const event = await prisma.$transaction(async (tx) => {
    const updated = await tx.accountingOutbox.update({ where: { id: req.params.id }, data: { state: 'ACKNOWLEDGED', externalRef: String(input.externalRef).slice(0, 160), acknowledgedAt: new Date(), attempts: { increment: 1 } } });
    await appendOperationalAudit(tx, { locationId: updated.locationId, actorId: user.id, action: 'ACCOUNTING_EVENT_ACKNOWLEDGED', resourceType: 'AccountingOutbox', resourceId: updated.id, outcome: 'SUCCESS', metadata: { externalRef: updated.externalRef } });
    return updated;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  res.json({ success: true, data: { event } });
}));

router.post('/accounting/outbox/:id/fail', authenticate, authorize('ADMIN', 'MANAGER'), asyncRoute(async (req, res) => {
  const user = actor(req); const input = bodyObject(req);
  if (!/^[A-Z0-9_.:-]{3,80}$/.test(input.errorCode ?? '')) throw new OperationsError('Bounded accounting error code is required', 422, 'ACCOUNTING_FAILURE_INVALID');
  const event = await prisma.$transaction(async (tx) => {
    const updated = await tx.accountingOutbox.update({ where: { id: req.params.id }, data: { state: 'FAILED', lastErrorCode: input.errorCode, attempts: { increment: 1 } } });
    await appendOperationalAudit(tx, { locationId: updated.locationId, actorId: user.id, action: 'ACCOUNTING_EVENT_FAILED', resourceType: 'AccountingOutbox', resourceId: updated.id, outcome: 'FAILED', metadata: { errorCode: input.errorCode } });
    return updated;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  res.status(202).json({ success: true, data: { event } });
}));

router.get('/audit/export', authenticate, authorize('ADMIN', 'MANAGER'), asyncRoute(async (req, res) => {
  const locationId = String(req.query.locationId ?? '');
  const events = await prisma.operationalAudit.findMany({ where: { locationId }, orderBy: { sequence: 'asc' }, take: 10_000 });
  res.set('Cache-Control', 'no-store').json({ success: true, data: { locationId, exportedAt: new Date().toISOString(), events: events.map((event) => ({ ...event, sequence: event.sequence.toString() })) } });
}));

router.get('/health', authenticate, authorize('ADMIN', 'MANAGER'), asyncRoute(async (req, res) => {
  const locationId = String(req.query.locationId ?? '');
  if (!locationId) throw new OperationsError('Location is required', 422, 'LOCATION_REQUIRED');
  const stale = new Date(Date.now() - 2 * 60_000);
  const [failedJobs, pendingPayments, pendingAccounting, openReconciliations, disconnectedDevices] = await Promise.all([
    prisma.hardwareJob.count({ where: { device: { locationId }, state: 'FAILED' } }),
    prisma.paymentOperation.count({ where: { state: { in: ['PENDING', 'ACTION_REQUIRED', 'DISCONNECTED', 'FAILED'] }, tender: { checkout: { locationId } } } }),
    prisma.accountingOutbox.count({ where: { locationId, state: { in: ['PENDING', 'FAILED'] } } }),
    prisma.reconciliationRun.count({ where: { locationId, state: 'PENDING_MANAGER' } }),
    prisma.deviceEnrollment.count({ where: { locationId, OR: [{ status: 'DISCONNECTED' }, { status: 'ONLINE', lastSeenAt: { lt: stale } }] } }),
  ]);
  const healthy = failedJobs === 0 && pendingPayments === 0 && openReconciliations === 0;
  res.status(healthy ? 200 : 503).set('Cache-Control', 'no-store').json({ success: healthy, data: { locationId, failedJobs, pendingPayments, pendingAccounting, openReconciliations, disconnectedDevices, checkedAt: new Date().toISOString() } });
}));

export default router;
