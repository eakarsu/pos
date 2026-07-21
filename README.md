# ElitePOS controlled store operations

ElitePOS implements a PostgreSQL-backed, role-controlled POS workflow for locations,
server-priced checkout, integer tax, cash/gift/card-present split tender, encrypted
cash-only offline capture, stock, receipts and hardware jobs, refunds, shifts,
reconciliation, gift-card/loyalty liability, accounting outbox, and immutable evidence.
It is not self-certified for a merchant's live card environment, selected physical
devices, or target-market tax/fiscal rules. See `SECURITY.md`,
`_COMPLETENESS_REVIEW.md`, and `docs/STORE_OPERATIONS_RUNBOOK.md` for the boundary.

## Verified runtime

Requirements: Node.js 20+, PostgreSQL, backend and frontend dependencies, prepared
database schema, and distinct random JWT secrets of at least 32 characters.

```sh
npm ci
npm ci --prefix frontend
npm run db:generate
npm run db:migrate:deploy
npm run db:migrate:status
npm run build
npm run build --prefix frontend
cp .env.example .env
# edit .env with real local values, prepare the database, then:
./start.sh
```

`start.sh` launches only existing builds, binds the frontend to loopback, verifies both
services become ready, refuses occupied ports, and stops only its own children. It never
installs dependencies, kills unrelated processes, changes the schema, or seeds data.

Fixture seeding is allowed only against an explicitly disposable database:

```sh
ALLOW_DISPOSABLE_SEED=YES SEED_USER_PASSWORD='choose-at-least-16-characters' npm run db:seed
```

Never use fixture identities or data in a real environment. Staff accounts and roles
must be provisioned by a trusted operator; public registration creates customer accounts.

## Quality gates

```sh
npm run test:safety
npm run test:operations # requires an isolated migrated PostgreSQL database
npm run build
npm run build --prefix frontend
npm audit --audit-level=high
npm audit --prefix frontend --audit-level=high
```

Use `PAYMENT_PROVIDER=simulator` only for test/development. Production fails fast if
the simulator is selected. The Stripe Terminal adapter uses the server-driven smart
reader flow and deliberately prohibits offline card acceptance. Hardware-agent,
PCI/fiscal, and PostgreSQL backup/restore contracts are documented in `docs/`.
