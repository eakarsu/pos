# PostgreSQL backup and restore runbook

The retired `/system/backup` and `/system/export` endpoints return HTTP 410 because they wrote operational archives inside the application repository and incorrectly treated PostgreSQL as a SQLite file. Backups are an operator/infrastructure responsibility.

## Backup

Use a least-privileged PostgreSQL backup identity and encrypted storage outside the source tree:

```bash
DATABASE_URL='postgresql://...' BACKUP_OUTPUT_DIR='/absolute/operator/backup/path' ./scripts/backup-postgres.sh
```

The script creates a PostgreSQL custom-format dump with mode restricted by `umask 077`, then writes a SHA-256 manifest. Encrypt and replicate that directory according to the organization's retention, key-management, data-residency, legal-hold, and deletion policies. Monitor backup age and failed jobs outside the application.

## Quarterly disposable restore drill

1. Create a new, isolated database whose name starts with `pos_restore_verify_`. Do not point at development, staging, production, or a shared test database.
2. Verify the manifest (`sha256sum -c` on Linux or `shasum -a 256 -c` on macOS).
3. Run:

```bash
ALLOW_DISPOSABLE_RESTORE=YES \
RESTORE_DATABASE_URL='postgresql://.../pos_restore_verify_2026q3' \
BACKUP_FILE='/absolute/operator/backup/path/elitepos-....dump' \
./scripts/verify-restore.sh
```

4. Run `prisma migrate status`, the controlled operations acceptance suite, and business-level sample checks against the isolated restore.
5. Record dump timestamp, restore duration, row-count/sample evidence, migration status, RPO/RTO comparison, reviewer, and deletion of the disposable restore. The script never creates or drops a database; database lifecycle remains an explicit operator action.
