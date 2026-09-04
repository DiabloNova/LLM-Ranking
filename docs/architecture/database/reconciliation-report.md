# Database Reconciliation Report & Implementation Plan

**Date:** August 2024
**Scope:** Reconstruct Database Source of Truth, Drizzle ORM Canonical Schema, and Migration Pipeline

---

## 1. Inventory & Reconciliation Summary

A comprehensive reconciliation was performed across:
1. Legacy hand-written SQL migrations (`0001-0014`)
2. TypeScript schema metadata (`database/schema/*.ts`)
3. Codebase repository/service usage patterns (`src/`, `tests/`)

### Table Count & Verification
- **Total Unique Tables across Codebase:** 57 tables.
- **Tables previously missing from SQL migrations (21 tables):** `organizations`, `admin_users`, `roles`, `permissions`, `audit_records`, `feature_flags`, `system_configurations`, `tenant_quotas`, `tenant_subscriptions`, `ai_provider_configs`, `brands`, `entities`, `entity_relationships`, `citations`, `ai_observations`, `brand_mentions`, `visibility_scores`, `recommendations`, `premium_audits`, `ai_engines`, `prompts`.
- **Tables present in SQL migrations but missing from custom TS definitions (5 tables):** `technical_audits`, `competitive_analyses`, `crawl_jobs`, `crawl_results`, `crawl_cache`.
- **Final Canonical Schema:** All 57 tables are defined in the unified Drizzle ORM schema at `database/schema/index.ts`.

---

## 2. Field Mismatches & Canonical Resolutions

| Table | Field | Conflict | Canonical Resolution | Justification |
| :--- | :--- | :--- | :--- | :--- |
| `websites` | `cms_type` | `VARCHAR(50)` vs `TEXT` | `TEXT` | Unbounded string allows flexible CMS identification across crawlers. |
| `pages` | `http_status` | Default `200` vs No default | `INTEGER NOT NULL DEFAULT 200` | Standard default prevents NULL status on successful crawl ingestion. |
| `prompt_executions` | `status` | `'succeeded'`/`'timed_out'` vs `'completed'` | Enum with `'queued'`, `'running'`, `'succeeded'`, `'failed'`, `'timed_out'`, `'cancelled'` | Supports precise state-machine retry tracking in background workers. |
| `competitive_seo_findings` | `finding_type` | Multi-step ALTER TABLE CHECK | Single unified CHECK constraint with 11 types | Combines finding types from migrations 0013 and 0014 into a single constraint. |

---

## 3. Row-Level Security (RLS) & Tenant Isolation Audit

### RLS Enabled Tables (37 Tables)
All 37 tenant-scoped tables feature `ENABLE ROW LEVEL SECURITY`, `FORCE ROW LEVEL SECURITY`, and policy expressions checking `app.current_tenant_id`:
- `organizations`
- `brands`
- `entities`
- `entity_relationships`
- `prompts`
- `prompt_definitions`
- `prompt_schedules`
- `prompt_executions`
- `position_observations`
- `ai_observations`
- `brand_mentions`
- `citations`
- `citation_sources`
- `citation_occurrences`
- `visibility_scores`
- `recommendations`
- `brand_associations`
- `recommendation_observations`
- `tenant_quotas`
- `tenant_subscriptions`
- `document_embeddings`
- `kg_entities`
- `kg_relationships`
- `premium_audits`
- `technical_audits`
- `competitive_analyses`
- `websites`
- `pages`
- `keywords`
- `topics`
- `competitors`
- `historical_metrics`
- `diagnostic_findings`
- `diagnostic_finding_relationships`
- `aeo_analyses`
- `faq_opportunities`
- `kg_alignments`
- `competitor_changes`
- `competitive_seo_findings`
- `crawl_jobs`
- `crawl_results`
- `crawl_cache`

### Non-RLS Tables (Global/System Context - 16 Tables)
1. `roles` (System RBAC)
2. `permissions` (System RBAC)
3. `admin_users` (Platform Admins)
4. `audit_records` (System Audit Logging)
5. `feature_flags` (Global Feature Toggles)
6. `system_configurations` (Global Engine Settings)
7. `ai_provider_configs` (LLM Provider Gateways)
8. `ai_engines` (AI Engine Master Catalog)
9. `pages_keywords` (Join Table)
10. `pages_topics` (Join Table)
11. `pages_entities` (Join Table)
12. `keywords_topics` (Join Table)
13. `topics_entities` (Join Table)
14. `ai_visibility_audits` (Aggregated Audit Master)
15. `audit_prompts` (Audit Prompt Map)

---

## 4. Architectural Notes & Observations

- **Worker Context Bypass:** As audited, `scripts/crawl-worker.ts` maintains its own ad-hoc database pool and bypasses `TenantContextManager`. This behavior is retained as designed and noted in accordance with constraints.
- **Migration Artifacts:** Legacy SQL scripts (`0001-0014`) are preserved under `database/migrations/` as historical audit logs. All current Drizzle ORM migrations are managed under `database/drizzle/`.
