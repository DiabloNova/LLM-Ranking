CREATE TABLE "credit_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"transaction_type" text NOT NULL,
	"description" text,
	"reference_id" text,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "credit_transactions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tenant_quotas" ADD COLUMN "credits_balance" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_credit_transactions_tenant" ON "credit_transactions" USING btree ("tenant_id");--> statement-breakpoint
CREATE POLICY "select_tenant_id_isolation_policy" ON "credit_transactions" AS PERMISSIVE FOR SELECT TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "insert_tenant_id_isolation_policy" ON "credit_transactions" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "update_tenant_id_isolation_policy" ON "credit_transactions" AS PERMISSIVE FOR UPDATE TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "delete_tenant_id_isolation_policy" ON "credit_transactions" AS PERMISSIVE FOR DELETE TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);