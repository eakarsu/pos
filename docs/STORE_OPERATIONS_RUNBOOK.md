# Store operations release runbook

## Supported boundary

The controlled workflow supports one PostgreSQL-backed location at a time, integer-cent server pricing, versioned tax profiles with half-up line rounding, validated exemptions, cash, gift card, and one card-present tender per checkout. Offline capture is cash-only, encrypted in the browser with a non-extractable AES-GCM key, age/amount limited, and revalidated against current price, tax, shift, device, and stock state during sync.

`PAYMENT_PROVIDER=simulator` is test/development only. A production release must use the server-driven `stripe-terminal` adapter, a supported enrolled smart-reader ID, TLS, and the operator-managed device/gift-card HMAC secrets. No PAN, track data, PIN, CVC, or client secret may be persisted or logged. This server-driven boundary intentionally prohibits offline card acceptance.

## Provision and release

1. Set distinct JWT secrets and device/gift-card HMAC keys of at least 32 random characters. Set PostgreSQL `DATABASE_URL`; never use `db push` or seed on a retained environment.
2. Run `npm ci`, `npm ci --prefix frontend`, `npm run db:generate`, and `npm run db:migrate:deploy`. Confirm `npm run db:migrate:status` reports current.
3. Run `npm run test:safety`, `npm run test:operations` against an isolated PostgreSQL database, both builds, both high-severity audits, and secret scanning.
4. Provision the location and its effective tax profile. `isCertified` may be true only with attributable target-market certification evidence; otherwise receipts remain `NON_FISCAL_SIMULATION`.
5. Enroll the workstation and certified reader. Store the one-time workstation credential in the local OS secret store. Verify heartbeat, barcode lookup, printer, drawer, and reader status.
6. Open a cashier-owned shift, perform a low-value cash checkout and card-present checkout, claim/ack the hardware jobs, retrieve the immutable receipt, refund the test checkout with a different manager, and reconcile the shift.
7. Confirm `/api/v1/operations/health?locationId=...` has no failed hardware jobs, pending payments, or manager-pending reconciliation. Drain and acknowledge accounting outbox events with the external system's reference.

## Operator failure handling

- Reader disconnect or provider uncertainty: do not create another checkout. Retry the same checkout/idempotency key. If capture succeeded but finalization cannot complete, use `reverse-payment`; completed sales use the manager-approved refund workflow.
- Printer/drawer failure: the sale remains durable. The agent retries with an expiring claim and a maximum of five attempts. A manager may approve an idempotent receipt reprint with a reason. Never replay an `OPEN_DRAWER` job manually without reconciling physical cash.
- Offline sync conflict: leave the encrypted envelope queued. A manager must resolve stale price/tax, closed shift, duplicate sequence, or stock conflict; never edit ciphertext or force card/gift tender offline.
- Cash variance: a variance beyond `CASH_VARIANCE_APPROVAL_CENTS` leaves the shift `CLOSING` until a different privileged operator records an explanatory approval note.

## External release gates

The repository cannot certify hardware, fiscal receipts, tax determinations, PCI scope, or processor settlement. Before production, record the selected countries/states, qualified tax/fiscal review, certified printer/fiscal-device evidence where required, provider-approved reader models/firmware, acquiring-bank settlement acceptance, accessibility/browser/device acceptance, penetration testing, and a PCI assessment appropriate to the final card-data environment.
