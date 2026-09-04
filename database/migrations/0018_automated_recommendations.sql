CREATE TABLE "automated_recommendations" (
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
ALTER TABLE "automated_recommendations" ADD CONSTRAINT "automated_recommendations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automated_recommendations" ADD CONSTRAINT "automated_recommendations_website_id_websites_id_fk" FOREIGN KEY ("website_id") REFERENCES "public"."websites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_automated_recs_org" ON "automated_recommendations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_automated_recs_status" ON "automated_recommendations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_automated_recs_score" ON "automated_recommendations" USING btree ("priority_score");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_automated_recs_dedup" ON "automated_recommendations" USING btree ("organization_id","dedup_key") WHERE status = 'pending';--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "automated_recommendations" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "automated_recommendations" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "automated_recommendations" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "automated_recommendations" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);