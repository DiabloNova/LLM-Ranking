-- 0019_user_credentials_and_webhook_idempotency.sql
--
-- Purpose:
--   1. Add the credential column required by the email/password login path.
--      Before this migration the `users` table had no credential column at all, which is
--      why loginAction could not verify a password even in principle.
--   2. Add a webhook event ledger so payment webhooks become idempotent.
--
-- Safety:
--   - Both statements are additive and idempotent (IF NOT EXISTS).
--   - `password_hash` is NULLABLE on purpose. Existing rows have no credential; they must
--     go through the password-reset flow. Application code MUST treat NULL as
--     "cannot authenticate with a password", never as "any password accepted".
--   - Run only via the dedicated migration script using MIGRATION_DATABASE_URL.

BEGIN;

-- 1. User credentials -------------------------------------------------------
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "password_hash" text;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "password_updated_at" timestamp with time zone;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "failed_login_attempts" integer NOT NULL DEFAULT 0;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "locked_until" timestamp with time zone;

COMMENT ON COLUMN "users"."password_hash" IS
  'scrypt hash in the format scrypt$N$r$p$keylen$saltB64$hashB64. NULL means the account has no password credential and cannot authenticate via email/password.';

-- Case-insensitive uniqueness for login lookups (application normalises to lower case).
CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_email_lower"
  ON "users" (lower("email"))
  WHERE "deleted_at" IS NULL;

-- 2. Webhook idempotency ledger --------------------------------------------
CREATE TABLE IF NOT EXISTS "processed_webhook_events" (
  "event_id"     text PRIMARY KEY,
  "provider"     text NOT NULL,
  "event_type"   text NOT NULL,
  "payload_hash" text NOT NULL,
  "processed_at" timestamp with time zone NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_processed_webhook_events_processed_at"
  ON "processed_webhook_events" ("processed_at");

COMMENT ON TABLE "processed_webhook_events" IS
  'Insert-before-process ledger. A payment webhook handler must INSERT the event id first; a unique-violation means the event was already processed and must be acknowledged without re-crediting.';

COMMIT;
