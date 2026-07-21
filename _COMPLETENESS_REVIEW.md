# Completeness Review: pos

**Review date:** 2026-07-20

## Assessment basis

The original 2026-07-18 review was a static inspection. This update additionally covers project-owned source/configuration, the PostgreSQL migration, direct service and HTTP acceptance tests, both production builds, dependency/security checks, a schema-drift check, and a real dump/restore drill against newly created disposable local PostgreSQL databases. No live payment account, physical reader, receipt printer, cash drawer, fiscal device, external accounting system, or retained/shared database was used.

## Classification

**Complete bounded store-operations workflow; external production acceptance pending**

The application now has a durable, fail-closed workflow for a configured store location: server-priced checkout, integer tax, online cash/gift/card-present split tender, cash-only encrypted offline capture, stock movement, receipts/hardware jobs, refunds, shifts/reconciliation, gift-card and loyalty liability, accounting outbox, and immutable operational evidence. It is not certified or approved for a particular merchant, jurisdiction, reader model, fiscal device, or PCI environment.

## Why it is not production-ready

- The Stripe Terminal adapter compiles against the server-driven smart-reader API, but no merchant live-mode account, acquirer settlement, webhook/outage behavior, or certified physical reader/firmware was exercised here.
- Receipt, drawer, and barcode contracts have simulated durable acceptance coverage, not selected-model driver, paper/cutter/sensor, USB/network, firmware, or safety acceptance.
- Tax behavior is versioned and auditable, but only integer-cent half-up line rounding is implemented. No named target jurisdiction, tax opinion, fiscal receipt approval, or fiscal-device certification was supplied.
- Avoiding PAN/SAD storage reduces exposure; it does not determine PCI DSS scope. The final merchant network, workstation agent, access, logging, incident response, scans, and assessment remain external obligations.
- Accounting synchronization is a durable retryable outbox with acknowledgement evidence; no named accounting platform mapping or retained-environment connector was available for acceptance.

## Needed features

1. Integrate certified payment readers with tokenized card-present flows, device enrollment, disconnect recovery, reversals, refunds, split tender, and end-of-day reconciliation.
2. Add reliable receipt printer/cash-drawer/barcode hardware adapters with capability detection, queued retries, duplicate-print controls, and operator-visible failures.
3. Implement jurisdiction-aware tax/fiscal rules, exemptions, rounding, returns, audit exports, and required receipt/fiscal-device certification for target markets.
4. Add offline-first sale capture with encrypted local state, conflict rules, stock reconciliation, idempotent sync, and explicit limits on offline payment acceptance.
5. Complete shifts, cash counts, variances, gift cards, loyalty liability, multi-location inventory, and accounting synchronization as durable workflows—not gap records.
6. Establish PCI scope, role/manager approvals, immutable sales audit, backup/restore, CI, device simulators, observability, and release runbooks.

## Risks or launch blockers

- Live card-present and physical hardware failure behavior can differ from simulators; selected devices and network topology require witnessed acceptance.
- Tax/fiscal correctness and receipt content remain launch blockers until the target markets and certification evidence are recorded.
- PCI scope and production security testing cannot be self-certified by repository code.
- Backup retention, encryption keys, monitoring, restore RPO/RTO, accounting mappings, and processor settlement must be owned and exercised in the deployment environment.

## Evidence inspected

- `src/services/operations/checkoutService.ts`
- `src/services/operations/refundService.ts`
- `src/services/operations/terminalGateway.ts`
- `src/routes/operations.ts`
- `prisma/schema.prisma`
- `prisma/migrations/20260720110000_initial_controlled_operations/migration.sql`
- `frontend/src/pages/POS.tsx`
- `frontend/src/services/offlineCheckoutQueue.ts`
- `tests/operations/workflow.test.ts`
- `tests/operations/tax.test.ts`
- `.github/workflows/ci.yml`
- `docs/STORE_OPERATIONS_RUNBOOK.md`
- `docs/BACKUP_RESTORE_RUNBOOK.md`

## Recommended next action

Select the launch jurisdiction, certified smart-reader and peripheral models, acquiring account, fiscal requirements, and accounting target. Run the checked-in acceptance workflow in an isolated staging environment with those real integrations, then obtain tax/fiscal and PCI approval evidence before enabling production.

## Implementation progress (2026-07-20)

All six numbered code/workflow items are implemented within one explicit boundary. External certification and retained-environment gates are intentionally not represented as completed.

1. **Card-present lifecycle and reconciliation:** added per-location workstation/reader enrollment, one-time HMAC device credentials, heartbeat/disconnect/revocation, production simulator prohibition, and a Stripe Terminal server-driven adapter that creates one `card_present` PaymentIntent, sends it to the enrolled smart reader, recovers the same intent, re-presents after a decline, cancels reader action, reverses/cancels, or refunds with stable idempotency. Checkout supports exact cash/card/gift split tender with at most one card portion. Payment attempts and provider-safe evidence are durable and bounded; completed sales use a separate-manager refund, while captured/unfinalized sales use reversal. Shift close records captured/refunded card totals and provider settlement reference. Stripe documents that its server-driven shape does not support offline card payments, matching this workflow's explicit cash-only offline rule: [Stripe Terminal server-driven card payments](https://docs.stripe.com/terminal/payments/collect-card-payment).
2. **Peripheral contract:** receipt and cash-drawer commands are durable, device-scoped jobs with unique dedupe keys, expiring claims, exponential retry, a five-attempt cap, idempotent acknowledgement, capability checks, reprint approval/reason evidence, and operator-safe failure fields/health counts. Barcode resolution is enrolled-device and location scoped. Physical-agent semantics are documented in `docs/HARDWARE_AGENT_CONTRACT.md`; selected-device validation remains external.
3. **Tax/fiscal and returns:** location provisioning creates an effective tax profile; subsequent profiles are ordered versions with product/category/all rules, integer basis points, half-up line rounding, immutable checkout snapshots, certification reference gating, and explicit `NON_FISCAL_SIMULATION`. Exemptions require customer/location/effective dates and a SHA-256 certificate hash, are audited, and can be revoked fail-closed. Refund lines use original server-priced/taxed values, restock inventory, restore original tender liability, and create durable return/accounting/audit evidence. Receipt and hash-chain audit exports are available. Jurisdictional approval and fiscal-device certification remain external.
4. **Offline-first cash boundary:** the browser stores only AES-256-GCM ciphertext in IndexedDB using a non-extractable local `CryptoKey` and workstation-bound additional authenticated data. Offline envelopes carry monotonic device sequence, capture time, idempotency key, tax version, and expected total. The server rejects old/future envelopes, changed price/tax, closed/wrong shifts, duplicate sequence, insufficient stock, card/gift tender, and amounts over the configured limit; accepted sync reuses the normal atomic finalizer. Conflicts remain queued for manager handling.
5. **Durable store operations:** PostgreSQL models now cover locations, location stock/version and append-only stock ledger, shifts/cash expectations/counts/variances, manager variance approval, gift-card hashed codes/balance/liability/append-only transactions, loyalty earn/refund adjustment, refunds, reconciliation, receipts, and retryable accounting outbox acknowledgement/failure. Legacy in-memory payment/multi-location gap routers are no longer mounted, and client-priced legacy sale/status writes return HTTP 410.
6. **Controls, evidence, and release operations:** staff roles are required; discounts, refund completion, reprints, configuration, reconciliation variance, and sensitive operational actions have manager/admin controls, with refund self-approval prohibited. PostgreSQL triggers enforce cross-location checkout/tender scope, financial immutability after completion, receipt immutability, and append-only audit/stock/gift/refund evidence. Audits form a per-location SHA-256 chain. CI provisions PostgreSQL 16, applies/status-checks migrations, runs 20 tests, both builds, dependency audits, and secret scanning. `/operations/health` surfaces failed hardware, pending payments/accounting/reconciliation, and disconnected devices. Incorrect in-repository SQLite backup/export endpoints now return HTTP 410; guarded PostgreSQL dump/manifest and isolated restore-verification scripts plus PCI/fiscal, hardware, release, and backup runbooks are checked in. PCI SSC publishes PCI DSS v4.0.1 and makes scope dependent on the actual environment, so no compliance claim is made here: [PCI SSC document library](https://www.pcisecuritystandards.org/document_library/?class=pcidss&doc=pci_dss).

Verification completed locally:

- Prisma generation, backend TypeScript build, and frontend TypeScript/Vite production build passed; 451 frontend modules transformed. The only frontend build warning is the existing bundle-size advisory.
- Both checked-in migrations deployed cleanly from empty to a newly created disposable PostgreSQL 14 database; `prisma migrate status` was current and schema diff reported no difference.
- Controlled operations acceptance tests: **15/15 passed**. They cover tax/rounding/rule applicability; exact split tender; server pricing; receipt/jobs; stock/idempotency; card token references; disconnect/capture conflict/reversal; offline limits/conflicts/replay; separate-manager refund; loyalty; exemption/revocation; gift issue/replay/redemption/refund liability; device barcode/job claim/deduplication; reconciliation; audit chain; and database mutation rejection.
- Runtime safety tests: **5/5 passed**.
- A PostgreSQL custom-format dump and SHA-256 manifest were created from the disposable database, restored into a separately created `pos_restore_verify_*` database, and verified for migration/controlled tables; migration status was current and restored schema diff reported no difference.
- Independent restore verification also exercised the exact Prisma-style `DATABASE_URL`/`RESTORE_DATABASE_URL` contract from `.env.example`; the scripts now safely remove Prisma's client-only `schema` query parameter before invoking libpq tools, while Prisma status and schema-drift verification continue to use the original URL.
- Backend and frontend low-threshold npm audit gates, shell syntax checks, migration drift, full-history secret scanning in CI, and `git diff --check` are release gates. CI database and JWT values are unique per run. Production startup rejects example database/secret placeholders and requires all JWT/device/gift HMAC values to be independently generated; the production frontend no longer emits source maps. Current-tree scanning is clean. Full 183-commit history has one narrowly fingerprinted historical finding: a removed fictional documentation line containing the literal `YOUR_API_KEY`, not a credential; it is isolated in `.gitleaksignore` so all new findings still fail. No live Stripe charge/refund, physical device, browser UI, target-market fiscal certification, PCI assessment, external accounting acknowledgement, shared database, deployment, publish, or push is claimed.

The supported result is therefore a complete, locally verified bounded workflow with explicit external launch gates—not a claim that the merchant's final production environment is certified.

### Runtime acceptance refresh (2026-07-20)

- `start.sh` now requires separate explicit backend and frontend ports and refuses occupied ports without terminating their owners. Normal production startup requires four distinct JWT/refresh/device/gift secrets; only the disposable validator path supplies isolated acceptance HMAC values.
- With PostgreSQL on `55681`, the backend on `6166`, and the built frontend on `6167`, the shared validator proved database credential login, database user revalidation at `/api/auth/me`, and an authenticated request: `API_VERIFIED|pos|startup_login_session_api`.
- The refresh passed both production builds, 5/5 runtime-safety tests, and 15/15 database-backed controlled-operations tests against both checked-in migrations. All three assigned ports were released afterward.
