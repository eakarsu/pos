import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('launcher is non-mutating and never kills unrelated processes', () => {
  const launcher = read('start.sh');
  const backup = read('scripts/backup-postgres.sh');
  const restore = read('scripts/verify-restore.sh');
  assert.doesNotMatch(launcher, /npm (install|ci)|prisma (db push|migrate dev)|kill -9|pkill|accept-data-loss|force-reset/);
  assert.match(launcher, /127\.0\.0\.1/);
  assert.match(backup, /schema=\[\^&\]\*/);
  assert.match(restore, /schema=\[\^&\]\*/);
});

test('runtime has no fallback token secrets or published demo password', () => {
  const environment = read('src/config/environment.ts');
  const login = read('frontend/src/pages/Login.tsx');
  const seed = read('prisma/seed.ts');
  assert.doesNotMatch(environment, /pos-system-super-secret/);
  assert.doesNotMatch(login, /admin123|Default login/);
  assert.doesNotMatch(seed, /admin123|cashier123|manager123/);
  assert.match(seed, /ALLOW_DISPOSABLE_SEED/);
  assert.match(environment, /Runtime secrets must be generated values, not example placeholders/);
  assert.match(environment, /new Set\(operationalSecrets\)\.size/);
  assert.match(environment, /DATABASE_URL contains an example placeholder/);
});

test('public registration cannot self-assign a privileged role', () => {
  const auth = read('src/routes/auth.ts');
  assert.match(auth, /role: 'CUSTOMER'/);
  assert.doesNotMatch(auth, /role = 'CASHIER'/);
});

test('legacy financial stubs are not mounted and unsafe sale mutation is retired', () => {
  const routes = read('src/routes/extras.ts');
  const server = read('src/server.ts');
  const sales = read('src/routes/sales.ts');
  assert.doesNotMatch(routes, /payments|multi-location/i);
  assert.doesNotMatch(server, /gap-features/);
  assert.match(sales, /LEGACY_SALE_WRITE_RETIRED/);
});

test('controlled checkout has production simulator, offline encryption, and immutable-ledger gates', () => {
  const environment = read('src/config/environment.ts');
  const offline = read('frontend/src/services/offlineCheckoutQueue.ts');
  const pos = read('frontend/src/pages/POS.tsx');
  const terminal = read('src/services/operations/terminalGateway.ts');
  const migration = read('prisma/migrations/20260720110000_initial_controlled_operations/migration.sql');
  assert.match(environment, /PAYMENT_PROVIDER=simulator is prohibited in production/);
  assert.match(offline, /AES-GCM/);
  assert.match(offline, /false, \['encrypt', 'decrypt'\]/);
  assert.match(migration, /operational_audits_immutable/);
  assert.match(migration, /operational_checkouts_scope/);
  assert.match(pos, /SPLIT_CASH_CARD/);
  assert.match(pos, /retry-payment/);
  assert.match(terminal, /processPaymentIntent/);
  assert.match(terminal, /cancelAction/);
});
