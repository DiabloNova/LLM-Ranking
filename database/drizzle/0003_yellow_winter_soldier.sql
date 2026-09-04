CREATE TABLE "competitor_mentions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"observation_id" uuid NOT NULL,
	"competitor_id" uuid NOT NULL,
	"mention_context" text NOT NULL,
	"is_recommended" boolean DEFAULT false NOT NULL,
	"sentiment_score" double precision DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"created_by" text DEFAULT 'system' NOT NULL,
	"updated_by" text DEFAULT 'system' NOT NULL,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "competitor_mentions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "crawl_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"monitoring_config_id" uuid NOT NULL,
	"crawl_job_id" uuid NOT NULL,
	"captured_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"content_hash" text,
	"extracted_content" text,
	"snapshot_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "crawl_snapshots" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "monitoring_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"monitoring_config_id" uuid NOT NULL,
	"crawl_snapshot_id" uuid,
	"alert_type" text NOT NULL,
	"severity" text NOT NULL,
	"message" text NOT NULL,
	"event_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"dedup_key" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "monitoring_alerts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "monitoring_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"website_id" uuid NOT NULL,
	"target_url" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"crawl_policy" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "monitoring_configs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "competitor_mentions" ADD CONSTRAINT "competitor_mentions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitor_mentions" ADD CONSTRAINT "competitor_mentions_observation_id_ai_observations_id_fk" FOREIGN KEY ("observation_id") REFERENCES "public"."ai_observations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitor_mentions" ADD CONSTRAINT "competitor_mentions_competitor_id_competitors_id_fk" FOREIGN KEY ("competitor_id") REFERENCES "public"."competitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crawl_snapshots" ADD CONSTRAINT "crawl_snapshots_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crawl_snapshots" ADD CONSTRAINT "crawl_snapshots_monitoring_config_id_monitoring_configs_id_fk" FOREIGN KEY ("monitoring_config_id") REFERENCES "public"."monitoring_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crawl_snapshots" ADD CONSTRAINT "crawl_snapshots_crawl_job_id_crawl_jobs_id_fk" FOREIGN KEY ("crawl_job_id") REFERENCES "public"."crawl_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitoring_alerts" ADD CONSTRAINT "monitoring_alerts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitoring_alerts" ADD CONSTRAINT "monitoring_alerts_monitoring_config_id_monitoring_configs_id_fk" FOREIGN KEY ("monitoring_config_id") REFERENCES "public"."monitoring_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitoring_alerts" ADD CONSTRAINT "monitoring_alerts_crawl_snapshot_id_crawl_snapshots_id_fk" FOREIGN KEY ("crawl_snapshot_id") REFERENCES "public"."crawl_snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitoring_configs" ADD CONSTRAINT "monitoring_configs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitoring_configs" ADD CONSTRAINT "monitoring_configs_website_id_websites_id_fk" FOREIGN KEY ("website_id") REFERENCES "public"."websites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_competitor_mentions_organization" ON "competitor_mentions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_competitor_mentions_observation" ON "competitor_mentions" USING btree ("observation_id");--> statement-breakpoint
CREATE INDEX "idx_competitor_mentions_competitor" ON "competitor_mentions" USING btree ("competitor_id");--> statement-breakpoint
CREATE INDEX "idx_crawl_snapshots_org" ON "crawl_snapshots" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_crawl_snapshots_config" ON "crawl_snapshots" USING btree ("monitoring_config_id");--> statement-breakpoint
CREATE INDEX "idx_crawl_snapshots_captured" ON "crawl_snapshots" USING btree ("captured_at");--> statement-breakpoint
CREATE INDEX "idx_monitoring_alerts_org" ON "monitoring_alerts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_monitoring_alerts_config" ON "monitoring_alerts" USING btree ("monitoring_config_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_monitoring_alerts_dedup" ON "monitoring_alerts" USING btree ("organization_id","dedup_key");--> statement-breakpoint
CREATE INDEX "idx_monitoring_configs_org" ON "monitoring_configs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_monitoring_configs_website" ON "monitoring_configs" USING btree ("website_id");--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "competitor_mentions" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "competitor_mentions" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "competitor_mentions" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "competitor_mentions" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "crawl_snapshots" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "crawl_snapshots" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "crawl_snapshots" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "crawl_snapshots" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "monitoring_alerts" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "monitoring_alerts" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "monitoring_alerts" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "monitoring_alerts" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "monitoring_configs" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "monitoring_configs" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "monitoring_configs" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "monitoring_configs" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);