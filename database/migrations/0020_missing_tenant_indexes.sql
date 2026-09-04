-- 0020_missing_tenant_indexes.sql
--
-- Purpose:
--   Backfill missing tenant/organization-column indexes discovered during the
--   Enterprise-Readiness audit. Every one of these tables is actively queried by
--   organization_id (directly or via Drizzle's `eq(table.organizationId, tenantId)`)
--   but previously had no index leading with that column, forcing a full table scan
--   under Postgres RLS on every request.
--
-- Tables fixed:
--   - technical_audits:      no index existed at all besides the RLS policy.
--   - competitive_analyses:  no index existed at all besides the RLS policy.
--   - crawl_snapshots:       only had a composite index led by monitoring_config_id.
--   - monitoring_alerts:     only had composites led by monitoring_config_id / fingerprint;
--                            RecommendationEngineService.runDiagnosisForTenant queries this
--                            table directly by organization_id + status = 'open'.
--
-- Safety: all statements are additive (CREATE INDEX IF NOT EXISTS) and safe to run
-- against a live database without downtime.

BEGIN;

CREATE INDEX IF NOT EXISTS "idx_technical_audits_org"
  ON "technical_audits" ("organization_id");

CREATE INDEX IF NOT EXISTS "idx_competitive_analyses_org"
  ON "competitive_analyses" ("organization_id");

CREATE INDEX IF NOT EXISTS "idx_crawl_snapshots_org"
  ON "crawl_snapshots" ("organization_id");

CREATE INDEX IF NOT EXISTS "idx_monitoring_alerts_org_status"
  ON "monitoring_alerts" ("organization_id", "status");

COMMIT;
