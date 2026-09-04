CREATE TABLE "organization_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organization_invitations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "organization_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organization_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_org_invitations_email" ON "organization_invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_org_invitations_token" ON "organization_invitations" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_org_members_user_org" ON "organization_members" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_org_members_user_id" ON "organization_members" USING btree ("user_id");--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "organization_invitations" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "organization_invitations" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "organization_invitations" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "organization_invitations" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "organization_members" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "organization_members" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "organization_members" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "organization_members" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);