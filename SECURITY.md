# Security and operating boundary

ElitePOS has a locally verified controlled operations workflow, but it is not approved
for a merchant's live card environment, real customer/employee data, selected physical
devices, or target-market fiscal reporting. Live reader/acquirer acceptance, physical
hardware validation, tax/fiscal certification, deployment security testing, accounting
mapping, and PCI assessment remain release gates.

Runtime secrets and a prepared PostgreSQL database are mandatory. Public registration
creates only a customer account; staff roles must be provisioned by a trusted operator.
Disposable fixtures require `ALLOW_DISPOSABLE_SEED=YES` and an operator-supplied password.

The controlled card path stores provider/token references, brand, and last four only;
PAN, track data, PIN, CVC/CVV, and Terminal client secrets must never enter requests,
storage, logs, exports, support tools, or AI routes. Offline card and gift-card acceptance
is prohibited. `PAYMENT_PROVIDER=simulator` is prohibited in production.

Do not commit backups, exports, uploads, `.env` files, tokens, or credentials. Report
security issues privately to the repository owner.

See `docs/PCI_AND_FISCAL_BOUNDARY.md`, `docs/STORE_OPERATIONS_RUNBOOK.md`, and
`docs/BACKUP_RESTORE_RUNBOOK.md` before staging or production use.
