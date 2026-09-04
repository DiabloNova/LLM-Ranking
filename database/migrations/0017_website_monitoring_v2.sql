DROP TABLE IF EXISTS "monitoring_alerts" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "crawl_snapshots" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "monitoring_configs" CASCADE;
--> statement-breakpoint
CREATE TABLE "crawl_snapshots" (
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
ALTER TABLE "crawl_snapshots" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "monitoring_alerts" (
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
ALTER TABLE "monitoring_alerts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "monitoring_configs" (
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
ALTER TABLE "monitoring_configs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "crawl_snapshots" ADD CONSTRAINT "crawl_snapshots_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crawl_snapshots" ADD CONSTRAINT "crawl_snapshots_monitoring_config_id_monitoring_configs_id_fk" FOREIGN KEY ("monitoring_config_id") REFERENCES "public"."monitoring_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crawl_snapshots" ADD CONSTRAINT "crawl_snapshots_website_id_websites_id_fk" FOREIGN KEY ("website_id") REFERENCES "public"."websites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitoring_alerts" ADD CONSTRAINT "monitoring_alerts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitoring_alerts" ADD CONSTRAINT "monitoring_alerts_monitoring_config_id_monitoring_configs_id_fk" FOREIGN KEY ("monitoring_config_id") REFERENCES "public"."monitoring_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitoring_alerts" ADD CONSTRAINT "monitoring_alerts_snapshot_id_crawl_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."crawl_snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitoring_configs" ADD CONSTRAINT "monitoring_configs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitoring_configs" ADD CONSTRAINT "monitoring_configs_website_id_websites_id_fk" FOREIGN KEY ("website_id") REFERENCES "public"."websites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_crawl_snapshots_config_captured" ON "crawl_snapshots" USING btree ("monitoring_config_id","captured_at");--> statement-breakpoint
CREATE INDEX "idx_monitoring_alerts_config_status" ON "monitoring_alerts" USING btree ("monitoring_config_id","status");--> statement-breakpoint
CREATE INDEX "idx_monitoring_alerts_fingerprint_status" ON "monitoring_alerts" USING btree ("fingerprint","status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_monitoring_alerts_open_fingerprint" ON "monitoring_alerts" USING btree ("fingerprint") WHERE status = 'open';--> statement-breakpoint
CREATE INDEX "idx_monitoring_configs_org_enabled" ON "monitoring_configs" USING btree ("organization_id","enabled");--> statement-breakpoint
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