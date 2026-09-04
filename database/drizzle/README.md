# `database/drizzle/` — CANONICAL MIGRATION CHAIN

This is the **only** migration directory that is executed. It is referenced by:

- `drizzle.config.ts` → `out: "./database/drizzle"` (where `pnpm db:generate` writes)
- `src/core/database/migrator.ts` → `migrationsFolder` (what `pnpm db:migrate` applies)
- `meta/_journal.json` → the ordered ledger; a `.sql` file without a journal entry is
  never applied.

`database/migrations/` is a frozen historical record and is executed by nothing. See
`database/migrations/README.md`.

## Applying

```bash
pnpm db:migrate   # uses MIGRATION_DATABASE_URL, falling back to DATABASE_URL
```

Drizzle records applied migrations in the `public.__drizzle_migrations` table.

## Authoring

```bash
pnpm db:generate  # diffs database/schema/** against meta/<latest>_snapshot.json
```

## Snapshot coverage (read before running `db:generate`)

`drizzle-kit` diffs the schema against the newest `meta/*_snapshot.json`. Snapshots exist
for `0000`–`0003` only:

| Migration | Origin | Snapshot |
|---|---|---|
| `0000_reflective_loa` | `drizzle-kit` | ✅ `0000_snapshot.json` |
| `0001_illegal_grey_gargoyle` | `drizzle-kit` | ✅ `0001_snapshot.json` |
| `0002_soft_jimmy_woo` | `drizzle-kit` | ✅ `0002_snapshot.json` |
| `0003_yellow_winter_soldier` | `drizzle-kit` | ✅ `0003_snapshot.json` |
| `0004_rls_isolation` | hand-authored (RLS policies) | ❌ none |
| `0005_canonical_drift_alignment` | hand-authored (drift closure) | ❌ none |

Because `0004` and `0005` are hand-authored, `meta/0003_snapshot.json` is the newest
machine state and it is **behind** the SQL. The next `pnpm db:generate` will therefore
try to re-emit what `0005` already does.

**Required one-time step:** on a database that has `0005` applied, re-baseline the
snapshot (`drizzle-kit generate` against the up-to-date database, or
`drizzle-kit introspect`) and commit the resulting snapshot before authoring the next
migration. Until that is done, treat `db:generate` output as needing review rather than
committing it blindly.

> `meta/0003_snapshot.json` also had 288 identifier names corrupted (underscores stripped,
> e.g. `ai_provider_configs` → `aiproviderconfigs`, `idx_admin_users_email` →
> `idxadminusers_email`) while snapshots `0000`–`0002` were clean. Those names were
> repaired against the SQL and schema; table, column, index, foreign-key and policy counts
> were unchanged by the repair.
