# `database/migrations/` — FROZEN HISTORICAL RECORD

**Nothing in this directory is executed by any script, runner, or CI job.** Do not add
files here.

The canonical migration chain is **`database/drizzle/`**. It is the only directory with a
journal (`database/drizzle/meta/_journal.json`) and the only one read by the migration
runner (`src/core/database/migrator.ts`, invoked by `pnpm db:migrate`) and by
`drizzle-kit` (`out` in `drizzle.config.ts`).

## Why two directories ever existed

The project began with hand-written SQL here (`0001`–`0014`), then adopted `drizzle-kit`,
whose baseline `database/drizzle/0000_reflective_loa.sql` was regenerated from
`database/schema/**`. After that switch, four more migrations were filed here out of
habit instead of into the canonical chain, so they never entered the journal and
`pnpm db:migrate` never applied them:

| File | Origin | Effect now reproduced by |
|---|---|---|
| `0015_api_keys.sql` | `drizzle-kit` output, misfiled | `database/drizzle/0005_canonical_drift_alignment.sql` |
| `0017_website_monitoring_v2.sql` | `drizzle-kit` output, misfiled | same |
| `0018_automated_recommendations.sql` | `drizzle-kit` output, misfiled | same |
| `0019_user_credentials_and_webhook_idempotency.sql` | hand-written | same |

That is why the canonical chain had drifted from the schema: it was missing the `audits`,
`api_keys`, `automated_recommendations` and `processed_webhook_events` tables, the four
password/lockout columns on `users`, and the v2 shape of the three monitoring tables.
`0005_canonical_drift_alignment.sql` closes that gap with idempotent DDL, so the canonical
chain alone now reproduces `database/schema/**`.

## Adding a schema change

1. Edit `database/schema/**` (the source of truth).
2. Run `pnpm db:generate` — output lands in `database/drizzle/` and is journalled.
3. Never hand-place SQL in this directory again. A migration that genuinely cannot be
   expressed by `drizzle-kit` (for example the RLS policy work in
   `database/drizzle/0004_rls_isolation.sql`) belongs in `database/drizzle/` with a
   matching journal entry.

## Retained, not deleted

These files are the only record of the pre-`drizzle-kit` schema history and of what was
applied to databases provisioned before the canonical chain was corrected. They are kept
for auditability. They are inert: no code path reads them.
