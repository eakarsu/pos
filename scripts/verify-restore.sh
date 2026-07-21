#!/usr/bin/env bash
set -euo pipefail

if [[ "${ALLOW_DISPOSABLE_RESTORE:-}" != "YES" || -z "${RESTORE_DATABASE_URL:-}" || -z "${BACKUP_FILE:-}" ]]; then
  echo "ALLOW_DISPOSABLE_RESTORE=YES, RESTORE_DATABASE_URL, and BACKUP_FILE are required." >&2
  exit 2
fi
if [[ ! -f "${BACKUP_FILE}" ]]; then
  echo "BACKUP_FILE does not exist." >&2
  exit 2
fi

libpq_restore_url="$(printf '%s' "${RESTORE_DATABASE_URL}" | sed -E 's/([?&])schema=[^&]*&/\1/; s/[?&]schema=[^&]*$//')"
database_name="$(psql "${libpq_restore_url}" -Atqc 'select current_database()')"
if [[ ! "${database_name}" =~ ^pos_restore_verify_[a-zA-Z0-9_]+$ ]]; then
  echo "Refusing restore: target database name must start with pos_restore_verify_." >&2
  exit 2
fi

pg_restore --dbname="${libpq_restore_url}" --clean --if-exists --no-owner --no-privileges "${BACKUP_FILE}"
psql "${libpq_restore_url}" -v ON_ERROR_STOP=1 -Atqc 'select count(*) >= 1 from _prisma_migrations' | grep -qx t
psql "${libpq_restore_url}" -v ON_ERROR_STOP=1 -Atqc 'select to_regclass('\''public.operational_checkouts'\'') is not null' | grep -qx t
psql "${libpq_restore_url}" -v ON_ERROR_STOP=1 -Atqc 'select to_regclass('\''public.operational_audits'\'') is not null' | grep -qx t

echo "Disposable restore verification passed."
