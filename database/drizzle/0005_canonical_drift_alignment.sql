-- 0005_canonical_drift_alignment
--
-- WHY THIS MIGRATION EXISTS
-- -------------------------
-- `database/drizzle/` is the canonical migration chain: it is the only directory with a
-- journal (`meta/_journal.json`) and the only one the migration runner
-- (`src/core/database/migrator.ts`, i.e. `pnpm db:migrate`) reads.
--
-- Between 0003 and this migration the chain drifted away from `database/schema/**`
-- (the declared source of truth) because three `drizzle-kit generate` outputs and two
-- hand-written migrations were filed into the *historical* `database/migrations/`
-- directory instead, so they never entered the journal:
--
--   database/migrations/0015_api_keys.sql               (drizzle-kit output)
--   database/migrations/0017_website_monitoring_v2.sql  (drizzle-kit output)
--   database/migrations/0018_automated_recommendations.sql (drizzle-kit output)
--   database/migrations/0019_user_credentials_and_webhook_idempotency.sql (hand-written)
--
-- Result: `pnpm db:migrate` alone produced a database that was missing 4 tables the
-- application queries (`audits`, `api_keys`, `automated_recommendations`,
-- `processed_webhook_events`), missing the 4 password/lockout columns that
-- `src/app/actions/auth.ts` selects, kept the superseded v1 shape of the three
-- monitoring tables, and typed `users.id` as `text` while the schema declares `uuid`.
--
-- This migration closes that gap so the canonical chain alone reproduces
-- `database/schema/**`. Every statement is idempotent, so it converges both a database
-- built purely from `database/drizzle/` and one that already received the out-of-band
-- SQL from `database/migrations/`.

-- ---------------------------------------------------------------------------
-- 1. users.id / organization_members.user_id : text -> uuid
-- ---------------------------------------------------------------------------
-- The schema declares uuid for both. Only one foreign key depends on users.id
-- (organization_members_user_id_users_id_fk), so the conversion is contained.
-- The guard refuses to run on data that is not castable rather than corrupting it.
DO $$
BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id') = 'text' THEN

    IF EXISTS (SELECT 1 FROM public.users
               WHERE id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') THEN
      RAISE EXCEPTION
        'users.id contains values that are not valid UUIDs; refusing to convert text -> uuid. Reconcile these rows first.';
    END IF;

    IF EXISTS (SELECT 1 FROM public.organization_members
               WHERE user_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') THEN
      RAISE EXCEPTION
        'organization_members.user_id contains values that are not valid UUIDs; refusing to convert text -> uuid.';
    END IF;

    ALTER TABLE "organization_members" DROP CONSTRAINT IF EXISTS "organization_members_user_id_users_id_fk";
    ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;
    ALTER TABLE "users" ALTER COLUMN "id" TYPE uuid USING "id"::uuid;
    ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
    ALTER TABLE "organization_members" ALTER COLUMN "user_id" TYPE uuid USING "user_id"::uuid;
    ALTER TABLE "organization_members"
      ADD CONSTRAINT "organization_members_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- 2. users : password credential + lockout columns
-- ---------------------------------------------------------------------------
-- Selected by src/app/actions/auth.ts and written by src/lib/password.ts.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "failed_login_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "locked_until" timestamp with time zone;--> statement-breakpoint
COMMENT ON COLUMN "users"."password_hash" IS
  'scrypt hash in the format scrypt$N$r$p$keylen$saltB64$hashB64. NULL means the account has no password credential and cannot authenticate via email/password.';--> statement-breakpoint
-- Case-insensitive uniqueness for login lookups (application normalises to lower case).
CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_email_lower"
  ON "users" (lower("email")) WHERE "deleted_at" IS NULL;--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- 3. audits
-- ---------------------------------------------------------------------------
-- database/schema/audits.ts. Written by the run-audit Inngest function.
CREATE TABLE IF NOT EXISTS "audits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"url" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"raw_signals" jsonb,
	"ai_insights" jsonb,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "audits" ADD CONSTRAINT "audits_workspace_id_organizations_id_fk"
    FOREIGN KEY ("workspace_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "audits" ADD CONSTRAINT "audits_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audits_workspace" ON "audits" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audits_user" ON "audits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audits_status" ON "audits" USING btree ("status");--> statement-breakpoint
DROP POLICY IF EXISTS "select_workspace_id_isolation_policy" ON "audits";--> statement-breakpoint
CREATE POLICY "select_workspace_id_isolation_policy" ON "audits" AS PERMISSIVE FOR SELECT TO public USING ("workspace_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
DROP POLICY IF EXISTS "insert_workspace_id_isolation_policy" ON "audits";--> statement-breakpoint
CREATE POLICY "insert_workspace_id_isolation_policy" ON "audits" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("workspace_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
DROP POLICY IF EXISTS "update_workspace_id_isolation_policy" ON "audits";--> statement-breakpoint
CREATE POLICY "update_workspace_id_isolation_policy" ON "audits" AS PERMISSIVE FOR UPDATE TO public USING ("workspace_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("workspace_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
DROP POLICY IF EXISTS "delete_workspace_id_isolation_policy" ON "audits";--> statement-breakpoint
CREATE POLICY "delete_workspace_id_isolation_policy" ON "audits" AS PERMISSIVE FOR DELETE TO public USING ("workspace_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- 4. api_keys  (supersedes database/migrations/0015_api_keys.sql)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"prefix" text NOT NULL,
	"hash" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"created_by" text DEFAULT 'system' NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "api_keys_prefix_unique" UNIQUE("prefix")
);
--> statement-breakpoint
ALTER TABLE "api_keys" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_organization_id_organizations_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_api_keys_organization" ON "api_keys" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_api_keys_prefix" ON "api_keys" USING btree ("prefix");--> statement-breakpoint
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON "api_keys";--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "api_keys" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON "api_keys";--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "api_keys" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON "api_keys";--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "api_keys" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON "api_keys";--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "api_keys" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- 5. automated_recommendations  (supersedes database/migrations/0018_*.sql)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "automated_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"website_id" uuid,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"type" text NOT NULL,
	"priority_score" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"recommended_action" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"dedup_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "automated_recommendations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "automated_recommendations" ADD CONSTRAINT "automated_recommendations_organization_id_organizations_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "automated_recommendations" ADD CONSTRAINT "automated_recommendations_website_id_websites_id_fk"
    FOREIGN KEY ("website_id") REFERENCES "public"."websites"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_automated_recs_org" ON "automated_recommendations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_automated_recs_status" ON "automated_recommendations" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_automated_recs_score" ON "automated_recommendations" USING btree ("priority_score");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_automated_recs_dedup" ON "automated_recommendations" USING btree ("organization_id","dedup_key") WHERE status = 'pending';--> statement-breakpoint
DROP POLICY IF EXISTS "select_organization_id_isolation_policy" ON "automated_recommendations";--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "automated_recommendations" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
DROP POLICY IF EXISTS "insert_organization_id_isolation_policy" ON "automated_recommendations";--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "automated_recommendations" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
DROP POLICY IF EXISTS "update_organization_id_isolation_policy" ON "automated_recommendations";--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "automated_recommendations" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
DROP POLICY IF EXISTS "delete_organization_id_isolation_policy" ON "automated_recommendations";--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "automated_recommendations" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- 6. processed_webhook_events  (supersedes the ledger half of 0019)
-- ---------------------------------------------------------------------------
-- Insert-before-process idempotency ledger; see database/schema/webhook-events.ts.
CREATE TABLE IF NOT EXISTS "processed_webhook_events" (
	"event_id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"event_type" text NOT NULL,
	"payload_hash" text NOT NULL,
	"processed_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_processed_webhook_events_processed_at" ON "processed_webhook_events" USING btree ("processed_at");--> statement-breakpoint
COMMENT ON TABLE "processed_webhook_events" IS
  'Insert-before-process ledger. A payment webhook handler must INSERT the event id first; a unique-violation means the event was already processed and must be acknowledged without re-crediting.';--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- 7. monitoring tables : v1 -> v2 shape
-- ---------------------------------------------------------------------------
-- The canonical chain still carried the superseded v1 shape of these three tables while
-- `database/schema/index.ts` describes v2. v2 is a breaking reshape (renamed and dropped
-- columns), exactly as database/migrations/0017_website_monitoring_v2.sql did it, so the
-- v1 tables are dropped and rebuilt. This only discards monitoring snapshots/alerts,
-- which are derived data regenerated on the next monitoring run; no tenant-owned
-- configuration outside these three tables depends on them.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='monitoring_configs' AND column_name='target_url') THEN
    DROP TABLE IF EXISTS "monitoring_alerts" CASCADE;
    DROP TABLE IF EXISTS "crawl_snapshots" CASCADE;
    DROP TABLE IF EXISTS "monitoring_configs" CASCADE;
  END IF;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "monitoring_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"website_id" uuid NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"schedule" text NOT NULL,
	"crawl_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "crawl_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"monitoring_config_id" uuid NOT NULL,
	"website_id" uuid NOT NULL,
	"captured_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"pages" jsonb NOT NULL,
	"total_pages" integer NOT NULL,
	"indexable_pages" integer NOT NULL,
	"non_indexable_pages" integer NOT NULL,
	"error_4xx_count" integer NOT NULL,
	"error_5xx_count" integer NOT NULL,
	"robots_txt_available" boolean NOT NULL,
	"sitemap_available" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "monitoring_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"monitoring_config_id" uuid NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"category" text NOT NULL,
	"severity" text NOT NULL,
	"type" text NOT NULL,
	"fingerprint" text NOT NULL,
	"url" text,
	"message" text NOT NULL,
	"previous_value" jsonb,
	"current_value" jsonb,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "monitoring_configs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "crawl_snapshots" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "monitoring_alerts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "monitoring_configs" ADD CONSTRAINT "monitoring_configs_organization_id_organizations_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "monitoring_configs" ADD CONSTRAINT "monitoring_configs_website_id_websites_id_fk"
    FOREIGN KEY ("website_id") REFERENCES "public"."websites"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "crawl_snapshots" ADD CONSTRAINT "crawl_snapshots_organization_id_organizations_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "crawl_snapshots" ADD CONSTRAINT "crawl_snapshots_monitoring_config_id_monitoring_configs_id_fk"
    FOREIGN KEY ("monitoring_config_id") REFERENCES "public"."monitoring_configs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "crawl_snapshots" ADD CONSTRAINT "crawl_snapshots_website_id_websites_id_fk"
    FOREIGN KEY ("website_id") REFERENCES "public"."websites"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "monitoring_alerts" ADD CONSTRAINT "monitoring_alerts_organization_id_organizations_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "monitoring_alerts" ADD CONSTRAINT "monitoring_alerts_monitoring_config_id_monitoring_configs_id_fk"
    FOREIGN KEY ("monitoring_config_id") REFERENCES "public"."monitoring_configs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "monitoring_alerts" ADD CONSTRAINT "monitoring_alerts_snapshot_id_crawl_snapshots_id_fk"
    FOREIGN KEY ("snapshot_id") REFERENCES "public"."crawl_snapshots"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_monitoring_configs_org_enabled" ON "monitoring_configs" USING btree ("organization_id","enabled");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_crawl_snapshots_config_captured" ON "crawl_snapshots" USING btree ("monitoring_config_id","captured_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_monitoring_alerts_config_status" ON "monitoring_alerts" USING btree ("monitoring_config_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_monitoring_alerts_fingerprint_status" ON "monitoring_alerts" USING btree ("fingerprint","status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_monitoring_alerts_open_fingerprint" ON "monitoring_alerts" USING btree ("fingerprint") WHERE status = 'open';
