# PostgreSQL backup and restore runbook

Use a restricted operator shell. Keep database URLs and archives out of source control and application logs.

## Backup

```bash
pg_dump --format=custom --no-owner --no-acl --file=skillforge-YYYYMMDD.dump "$DATABASE_URL"
pg_restore --list skillforge-YYYYMMDD.dump > skillforge-YYYYMMDD.contents.txt
```

Encrypt the archive with the organization's approved backup system, store it separately from the application host, and record its checksum and retention date.

## Restore rehearsal

Create an empty, isolated PostgreSQL database. Never rehearse against production.

```bash
createdb skillforge_restore_test
pg_restore --exit-on-error --no-owner --no-acl --dbname=skillforge_restore_test skillforge-YYYYMMDD.dump
DATABASE_URL=postgresql://.../skillforge_restore_test npm run db:verify
```

Confirm migration state, the skill count, authentication tables, recent orders, certificate verification and representative user-owned records. Destroy the isolated restore database through the database provider after recording the result.

## Schedule

Choose backup frequency, retention, encryption, geographic storage and recovery objectives with the production owner and hosting provider. These operational values cannot be inferred from the codebase.
