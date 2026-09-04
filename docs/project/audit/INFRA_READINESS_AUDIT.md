# Infrastructure & Mock-Data Readiness Audit

**Audit Date:** August 16, 2024
**Audit Scope:** Entire Repository Analysis (Read-Only Audit Report)
**Auditor:** Jules (AI Software Engineer)

---

## 1. DATA ACCESS INVENTORY

### 1.1 DB Client / `pg` Usage Inventory

Direct usage of the PostgreSQL database driver (`pg`) is limited to two files in the codebase:

1. **`src/features/admin/infrastructure/persistence/postgres/index.ts`**
   - **Line 8:** `import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";`
   - **Lines 30–50:** Defines `PostgresClient` singleton encapsulating a `pg.Pool`.
2. **`scripts/crawl-worker.ts`**
   - **Line 2:** `import { Pool } from "pg";`
   - **Line 147:** Instantiates an ad-hoc connection pool `const pool = new Pool({ connectionString: process.env.DATABASE_URL });`.

*Note:* No other file directly imports or requires `pg`. Higher-level feature repositories and services import `PostgresClient` from `src/features/admin/infrastructure/persistence/postgres/index.ts`.

---

### 1.2 Shared DB Client/Pool vs Ad-Hoc Connections

- **Shared Database Client & Connection Pool:**
  - `PostgresClient` (`src/features/admin/infrastructure/persistence/postgres/index.ts`, lines 30–50) implements a singleton pattern around a `pg.Pool` initialized with `max: 20`, `idleTimeoutMillis: 30000`, and `connectionTimeoutMillis: 2000`.
  - `TenantContextManager` (`src/core/database/tenant-context/index.ts`, lines 180–189) leases a `PoolClient` per transaction using `PostgresClient.getInstance().connectClient()`.
- **Ad-Hoc Connection Pools:**
  - `scripts/crawl-worker.ts` (line 147) bypasses `PostgresClient` and creates a standalone `new Pool({ connectionString: process.env.DATABASE_URL })` connection pool.

---

### 1.3 Data Read and Write Operations Grouped by Feature/Service

#### A. Admin Infrastructure Persistence
- **Location:** `src/features/admin/infrastructure/persistence/postgres/index.ts`
- **Repositories & Operations:**
  - `PostgresTenantRepository` (lines 411–545): Writes (`tenants` insert/update/soft-delete, lines 431, 461, 510), Reads (`tenants` select by ID/slug, lines 479, 497).
  - `PostgresAdminUserRepository` (lines 565–680): Writes (`admin_users` insert/update/delete, lines 612, 638), Reads (lines 653, 670).
  - `PostgresFeatureFlagRepository` (lines 740–815): Writes (`feature_flags` insert/update/delete, lines 756, 780), Reads (lines 794, 807).
  - `PostgresAuditRecordRepository` (lines 835–885): Writes (`audit_records` insert, line 851), Reads (lines 870, 883).
  - `PostgresAIProviderConfigurationRepository` (lines 960–1005): Writes (`ai_provider_configs` insert/update, line 985), Reads (line 1000).

#### B. Unified Intelligence & Domain Repositories
- **Location:** `src/features/ai-intelligence/repositories/index.ts`
- **Repositories & Operations:**
  - `PostgresAEOAuditRepository` (lines 430–560): Writes (`ai_visibility_audits`, `audit_prompts`, lines 460–510), Reads (lines 530–555). Fallback to in-memory `Map` (`this.audits`, line 408) on DB connection errors.
  - `PostgresPromptIntelligenceRepository` (lines 575–930): Writes (`prompt_definitions`, `prompt_schedules`, `prompt_executions`, `position_observations`, lines 600–850), Reads (lines 880–925). Fallback to in-memory `Map` (`this.prompts`, line 570).
  - `PostgresCitationIntelligenceRepository` (lines 935–1155): Writes (`citation_sources`, `citation_occurrences`, lines 970–1080), Reads (lines 1100–1150).
  - `PostgresBrandIntelligenceRepository` (lines 1160–1565): Writes (`brand_associations`, `recommendation_observations`, lines 1200–1450), Reads (lines 1500–1560).
  - `PostgresAeoContentIntelligenceRepository` (lines 1570–1800): Writes (`aeo_analyses`, `faq_opportunities`, `kg_alignments`, lines 1610–1740), Reads (lines 1760–1795).
  - `PostgresCompetitorRepository` (lines 2434–2645): Writes (`competitors`, lines 2560, 2595), Reads (lines 2480, 2500, 2520).
  - `PostgresCompetitorChangeRepository` (lines 2656–2800): Writes (`competitor_changes`, line 2755), Reads (lines 2685, 2700, 2720).
  - `PostgresCompetitiveSEOFindingRepository` (lines 2812–2875): Writes (`competitive_seo_findings`, line 2820), Reads (line 2865).
  - `PostgresEntityRepository` (lines 1804–1995): Writes (`entities`, `entity_relationships`, lines 1850, 1920), Reads (lines 1950, 1980).
  - `PostgresDiagnosticFindingRepository` (lines 2882–3025): Writes (`diagnostic_findings`, `diagnostic_finding_relationships`, lines 2935, 2990), Reads (lines 2888, 2898, 3018).
  - `PostgresWebsiteRepository` (lines 2000–2070): Writes (`websites`, line 2030), Reads (lines 2010, 2050).
  - `PostgresPageRepository` (lines 2075–2235): Writes (`pages`, `pages_keywords`, `pages_topics`, `pages_entities`, lines 2120, 2170, 2180, 2190), Reads (lines 2085, 2205).
  - `PostgresKeywordRepository` (lines 2240–2330): Writes (`keywords`, `keywords_topics`, lines 2275, 2310), Reads (lines 2245, 2325).
  - `PostgresTopicRepository` (lines 2335–2430): Writes (`topics`, `topics_entities`, lines 2370, 2408), Reads (lines 2342, 2422).
  - `PostgresBrandRepository` (lines 3030–3320): Writes (`brands`, `brand_associations`, lines 3175, 3270), Reads (lines 3090, 3110, 3135, 3240).

#### C. Acquisition / Web Crawling Engine
- **Locations:**
  - `src/features/acquisition/infrastructure/persistence/postgres/crawl-job-repository.ts`
  - `src/features/acquisition/infrastructure/persistence/postgres/crawl-result-repository.ts`
  - `src/features/acquisition/infrastructure/persistence/postgres/crawl-cache-repository.ts`
- **Operations:**
  - `CrawlJobRepository` (lines 170–350): Writes (`crawl_jobs` insert/update, PL/pgSQL function calls `claim_crawl_job`, `fail_crawl_job`, `complete_crawl_job`), Reads (`crawl_jobs` select).
  - `CrawlResultRepository` (lines 20–50): Writes (`crawl_results` insert), Reads (`crawl_results` select).
  - `CrawlCacheRepository` (lines 40–90): Writes (`crawl_cache` insert), Reads (`crawl_cache` select).

#### D. Core Tenant Context Manager
- **Location:** `src/core/database/tenant-context/index.ts`
- **Operations:**
  - Lines 195–215: Transaction control writes (`BEGIN`, `SELECT set_config('app.current_tenant_id', $1, true)`, `SAVEPOINT`, `RELEASE SAVEPOINT`, `ROLLBACK TO SAVEPOINT`, `COMMIT`, `ROLLBACK`).

---

## 2. MOCK / FAKE / HARDCODED DATA INVENTORY

| File Path | Exported Symbol / Location | Consuming Route / Component | Shape of Data | Real Schema Table(s) |
|---|---|---|---|---|
| `src/lib/docsData.ts` | `DOCS_TOPICS` (line 11) | `/[locale]/docs` & `/[locale]/docs/[slug]` | Static Array of 8 Documentation Topics with Farsi/English titles, descriptions, markdown | None (CMS/Static Content) |
| `src/services/auditService.ts` | `auditService` (lines 12–110) | `/[locale]/dashboard/audits/page.tsx` | In-memory array `mockAudits`, `Math.random()` score generators, mocked audit response object | `ai_visibility_audits`, `audit_prompts` |
| `src/app/api/v1/optimization/technical/route.ts` | GET Handler (lines 268–272) | `/api/v1/optimization/technical` | `Math.random()` generated string/number metrics (`avgLoadTime`, `LCP`, `CLS`, `totalPageSize`, `imageOptimizationScore`) | `technical_audits`, `historical_metrics` |
| `src/app/api/v1/analysis/competitive/route.ts` | GET Handler (lines 339–350) | `/api/v1/analysis/competitive` | `Math.random()` ID generator and literal JSON response for competitive findings | `competitive_seo_findings`, `competitive_analyses` |
| `src/app/api/v1/analytics/llm/route.ts` | GET Handler (lines 126–163) | `/api/v1/analytics/llm` | `Math.random()` calculated sentiment, brand mention %, hallucination risk, and hardcoded provider models | `ai_observations`, `position_observations`, `historical_metrics` |
| `src/app/api/v1/knowledge-graph/query/route.ts` | POST Handler (lines 103, 124) | `/api/v1/knowledge-graph/query` | Hardcoded JSON nodes (`node-gemini-mock`, `جمینای پرو (آزمایشی)`) | `kg_entities`, `kg_relationships` |
| `src/app/[locale]/dashboard/audits/page.tsx` | Client Handler (lines 87–88) | `/[locale]/dashboard/audits` | `Math.random()` audit ID and score generator for new audit creation | `ai_visibility_audits` |
| `src/components/features/graph/LiveKnowledgeGraph.tsx` | `LiveKnowledgeGraph` (line 139) | Homepage & Dashboard Knowledge Graph | `Math.random()` metric fluctuation (`diff = (Math.random() - 0.5) * 0.3`) for dynamic radar chart | `historical_metrics`, `visibility_scores` |
| `src/app/actions/auth.ts` | `loginAction`, `registerAction` (lines 15, 31) | Authentication Forms | `Math.random()` user ID generator (`usr-${Math.random()...}`) returned in mock user session | `admin_users`, `organizations` |
| `src/app/actions/ai-visibility-audit.ts` | Server Action (line 152) | `/[locale]/dashboard/aeo/audits` | `Math.random()` brand ID generator (`brand-${Math.random()...}`) when brand is missing | `brands` |
| `src/features/admin/infrastructure/persistence/postgres/index.ts` | `PostgresTenantRepository` etc. (lines 433, 615, 759, 854, 988) | Admin Repositories in Fallback/Mock Mode | `Math.random()` UUID/ID generators for tenants, users, feature flags, audit records, provider configs | `organizations`, `admin_users`, `feature_flags`, `audit_records`, `ai_provider_configs` |
| `src/features/admin/prompt-management/index.ts` | `PromptManagementService` (lines 91, 142) | Admin Prompt Management | Hardcoded model performance array (`gemini-1.5-pro`, `cost: 0.0015`) and `Math.random()` template IDs | `prompt_definitions`, `prompt_executions` |
| `src/features/ai-intelligence/services/citation-service.ts` | `CitationService` (line 87) | Citation Analysis Pipeline | `Math.random()` citation ID generator (`cit-${Math.random()...}`) | `citation_sources`, `citation_occurrences` |
| `src/features/ai-intelligence/services/observation-service.ts` | `ObservationService` (lines 35, 74, 106, 141, 175) | AI Observation Pipeline | `Math.random()` prompt ID, observation ID, mention ID, citation ID, recommendation ID generators | `ai_observations`, `brand_mentions`, `citations`, `recommendations` |
| `src/features/ai-intelligence/services/visibility-service.ts` | `VisibilityService` (line 52) | Visibility Calculation Engine | `Math.random()` score record ID generator (`vis-${Math.random()...}`) | `visibility_scores` |
| `src/features/ai-intelligence/services/entity-service.ts` | `EntityService` (line 192) | Entity Intelligence Engine | `Math.random()` entity ID generator (`entity-${Math.random()...}`) | `entities`, `kg_entities` |
| `src/features/ai-intelligence/repositories/index.ts` | In-memory Fallback Maps (lines 408, 570, 935, 1160, 1570) | Intelligence Repositories | In-memory `Map<string, ...>` storage used as database substitute when Postgres connection fails | All `database/schema/*.ts` tables |

---

## 3. SCHEMA vs MIGRATION DRIFT

### 3.1 Comparison: `database/schema/*.ts` vs `database/migrations/*.sql`

#### A. Tables Defined in TypeScript Schema but MISSING from ALL SQL Migrations (21 Tables Total)

1. **`organizations`** (`database/schema/organization.ts`, line 4)
2. **`admin_users`** (`database/schema/admin/index.ts`, line 4)
3. **`roles`** (`database/schema/admin/index.ts`, line 39)
4. **`permissions`** (`database/schema/admin/index.ts`, line 62)
5. **`audit_records`** (`database/schema/admin/index.ts`, line 85)
6. **`feature_flags`** (`database/schema/admin/index.ts`, line 132)
7. **`system_configurations`** (`database/schema/admin/index.ts`, line 163)
8. **`tenant_quotas`** (`database/schema/admin/index.ts`, line 192)
9. **`tenant_subscriptions`** (`database/schema/admin/index.ts`, line 259)
10. **`ai_provider_configs`** (`database/schema/admin/index.ts`, line 320)
11. **`brands`** (`database/schema/brand.ts`, line 4)
12. **`entities`** (`database/schema/entity.ts`, line 4)
13. **`entity_relationships`** (`database/schema/entity.ts`, line 220)
14. **`citations`** (`database/schema/citation.ts`, line 4)
15. **`ai_observations`** (`database/schema/observation.ts`, line 4)
16. **`brand_mentions`** (`database/schema/observation.ts`, line 203)
17. **`visibility_scores`** (`database/schema/visibility.ts`, line 4)
18. **`recommendations`** (`database/schema/recommendation.ts`, line 4)
19. **`premium_audits`** (`database/schema/premium-audit.ts`, line 4)
20. **`ai_engines`** (`database/schema/prompt.ts`, line 4)
21. **`prompts`** (`database/schema/prompt.ts`, line 111)

#### B. Tables in SQL Migrations but MISSING from Schema Files
- **None.** All 32 tables created in SQL migrations have corresponding definitions or related representations in `database/schema/*.ts`.

#### C. Column Type, Nullability, Default & Check Constraint Mismatches

1. **`websites` table:**
   - Schema (`database/schema/website.ts`, lines 18–25): Column `cms_type` is defined as `VARCHAR(50)`.
   - Migration `0005_unified_intelligence_model.sql` (lines 11–12): Column `cms_type` is defined as `TEXT`.
2. **`pages` table:**
   - Schema (`database/schema/page.ts`, lines 30–35): Defines `http_status` as `INTEGER`, default `200`.
   - Migration `0005_unified_intelligence_model.sql` (lines 28–29): Defines `http_status` as `INTEGER` without default.
3. **`prompt_executions` table:**
   - Schema (`database/schema/prompt-intelligence.ts`, line 240): Enforces status enum: `['queued', 'running', 'succeeded', 'failed', 'timed_out', 'cancelled']`.
   - Migration `0008_prompt_intelligence.sql` (line 62): Check constraint enforces: `CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled'))`. **Discrepancy:** `'succeeded'` vs `'completed'`, and missing `'timed_out'`.
4. **`competitive_seo_findings` table:**
   - Schema (`database/schema/competitive-seo-finding.ts`, line 15): Enum finding types: `'technical_gap'`, `'content_gap'`, `'keyword_gap'`, `'topic_gap'`, `'structural_difference'`, `'ai_visibility_gap'`, `'citation_gap'`, `'prompt_gap'`, `'brand_mention_gap'`, `'ai_recommendation_gap'`, `'citation_overlap'`.
   - Migration `0013_competitive_seo_intelligence.sql` (line 12): Originally only contained SEO finding types. Migration `0014_competitive_ai_intelligence.sql` (lines 4–8) added the AI gap types via `ALTER TABLE ... ADD CONSTRAINT`.

---

### 3.2 Migration Execution & Dependency Order Verification

Running the 14 SQL migration scripts sequentially (`0001_optimus_vector_kg.sql` through `0014_competitive_ai_intelligence.sql`) against a clean, empty PostgreSQL database **FAILS CRITICALLY**:

1. **`0003_competitive_analyses.sql` (Line 9):**
   - Statement: `organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE`
   - **Failure:** Table `organizations` does not exist in `0001` or `0002`. The migration fails immediately with `ERROR: relation "organizations" does not exist`.
2. **`0005_unified_intelligence_model.sql` (Lines 8, 25, 41):**
   - Statements: References `organizations(id)` and `brands(id)`.
   - **Failure:** Neither `organizations` nor `brands` table is ever created in any migration file (`0001` to `0014`).
3. **`0012_competitor_discovery.sql` (Lines 11–12):**
   - Statements: References `organizations(id)` and `brands(id)`.
   - **Failure:** Fails due to uncreated referenced tables.

---

### 3.3 Migration Runner Status & Strategy Contradiction

- **Migration Runner in Repo:**
  **NO migration runner exists in this codebase.** There is no script or CLI command in `package.json` or `scripts/` to apply, track, or rollback SQL migrations.
- **Architectural Contradiction:**
  `database/schema/migration-strategy.md` (lines 14–61) explicitly documents that schema migrations are managed using **Drizzle ORM** and **Drizzle Kit** (`npx drizzle-kit generate:pg`, `npx drizzle-kit push:pg`).
  **Contradiction:** `package.json` contains **NO Drizzle dependencies** whatsoever (`drizzle-orm` and `drizzle-kit` are completely missing). `package.json` only includes standard `pg` (`"pg": "^8.13.1"`). Furthermore, the files in `database/schema/*.ts` are custom TypeScript objects defined using a local `TableDefinition` interface (`database/schema/types.ts`), NOT Drizzle ORM schema objects!

---

## 4. RLS & TENANT CONTEXT READINESS

### 4.1 Row-Level Security (RLS) Enablement Inventory

#### Tables WITH RLS Enabled in Migrations (17 Tables)
1. `document_embeddings` (`0001_optimus_vector_kg.sql`, line 62)
2. `kg_entities` (`0001_optimus_vector_kg.sql`, line 63)
3. `kg_relationships` (`0001_optimus_vector_kg.sql`, line 64)
4. `technical_audits` (`0002_technical_audits.sql`, line 15)
5. `competitive_analyses` (`0003_competitive_analyses.sql`, line 17)
6. `websites` (`0005_unified_intelligence_model.sql`, line 83)
7. `pages` (`0005_unified_intelligence_model.sql`, line 112)
8. `keywords` (`0005_unified_intelligence_model.sql`, line 155)
9. `topics` (`0005_unified_intelligence_model.sql`, line 196)
10. `competitors` (`0005_unified_intelligence_model.sql`, line 238)
11. `historical_metrics` (`0005_unified_intelligence_model.sql`, line 271)
12. `pages_keywords` (`0005_unified_intelligence_model.sql`, line 300)
13. `pages_topics` (`0005_unified_intelligence_model.sql`, line 329)
14. `pages_entities` (`0005_unified_intelligence_model.sql`, line 358)
15. `keywords_topics` (`0005_unified_intelligence_model.sql`, line 387)
16. `diagnostic_findings` (`0006_diagnostic_engine_model.sql`, line 31)
17. `diagnostic_finding_relationships` (`0006_diagnostic_engine_model.sql`, line 74)

#### Tables WITHOUT RLS Enabled in Migrations (15 Tables)
1. `crawl_jobs` (`0004_crawl_acquisition.sql`)
2. `crawl_results` (`0004_crawl_acquisition.sql`)
3. `crawl_cache` (`0004_crawl_acquisition.sql`)
4. `topics_entities` (`0005_unified_intelligence_model.sql`)
5. `ai_visibility_audits` (`0007_ai_visibility_audit.sql`)
6. `audit_prompts` (`0007_ai_visibility_audit.sql`)
7. `prompt_definitions` (`0008_prompt_intelligence.sql`)
8. `prompt_schedules` (`0008_prompt_intelligence.sql`)
9. `prompt_executions` (`0008_prompt_intelligence.sql`)
10. `position_observations` (`0008_prompt_intelligence.sql`)
11. `citation_sources` (`0009_citation_intelligence.sql`)
12. `citation_occurrences` (`0009_citation_intelligence.sql`)
13. `brand_associations` (`0010_brand_intelligence.sql`)
14. `recommendation_observations` (`0010_brand_intelligence.sql`)
15. `aeo_analyses`, `faq_opportunities`, `kg_alignments`, `competitor_changes`, `competitive_seo_findings` (`0011`–`0013`)

---

### 4.2 Application Code Setting `app.current_tenant_id`

Application code sets `app.current_tenant_id` in **EXACTLY ONE PLACE**:
- **`src/core/database/tenant-context/index.ts` (Line 199):**
  ```ts
  await client.query(
    "SELECT set_config('app.current_tenant_id', $1, true)",
    [context.tenantId]
  );
  ```
- **Execution Mechanism:** Inside `TenantContextManager.runWithTenantContext()`, the parameter `is_local = true` ensures `app.current_tenant_id` is scoped strictly to the current database transaction block (`SET LOCAL`).

---

### 4.3 Connection Strategy & Per-Request Session Variable Safety

- **Current Architecture:**
  `TenantContextManager.runWithTenantContext()` (lines 138–230) leases a single `PoolClient` from `PostgresClient.getInstance()`, issues `BEGIN`, sets `app.current_tenant_id` locally, executes the callback, and guarantees `COMMIT` or `ROLLBACK` in a `finally` block before releasing the client back to the pool.
- **Safety Rating:** **SAFE.** Because `is_local = true` is passed to `set_config`, PostgreSQL automatically resets the setting at transaction completion, preventing session variable leakage across pooled client connections.

---

### 4.4 Behavior Comparison Against `tenant-context-spec.md`

- **Specification Requirement (`database/schema/tenant-context-spec.md`, lines 35–60):**
  Every tenant-partitioned SQL query must be wrapped in `TenantContextManager.runWithTenantContext(tenantId, userId, requestId, fn)`.
- **Actual Behavior:**
  1. Server Actions (`src/app/actions/*.ts`) correctly wrap operations in `TenantContextManager.runWithTenantContext()`.
  2. Background worker (`scripts/crawl-worker.ts`, line 147) creates an ad-hoc connection pool and executes SQL queries **WITHOUT wrapping them in `TenantContextManager`** or setting `app.current_tenant_id`, violating the tenant context specification.

---

## 5. ENVIRONMENT VARIABLE CONTRACT

### 5.1 Comprehensive `process.env` Inventory

| File Path | Variable Name | Documented in `.env.example`? | Default / Fallback Value in Code |
|---|---|---|---|
| `src/core/config/index.ts:20` | `NODE_ENV` | No | `"development"` |
| `src/core/config/index.ts:21` | `DATABASE_URL` | **Yes** | `"postgresql://localhost:5432/aeo_saas"` |
| `src/core/config/index.ts:22` | `NEXT_PUBLIC_IRAN_MARKET_LOCALISED` | No | `true` |
| `src/core/config/index.ts:23` | `ADMIN_SSO_ENABLED` | No | `false` |
| `src/core/config/index.ts:24` | `ADMIN_MFA_REQUIRED` | No | `true` |
| `src/core/config/index.ts:25` | `AI_DEFAULT_MAX_TOKENS` | No | `4000` |
| `src/config/env.ts:4` | `NEXT_PUBLIC_API_URL` | No | `"https://api.brandintelligence.ai"` |
| `src/config/env.ts:5` | `NEXT_PUBLIC_APP_URL` | No | `"http://localhost:3000"` |
| `src/services/auth/session.ts:18` | `SESSION_SECRET` | No | `crypto.randomBytes(32).toString("hex")` (Volatile in serverless!) |
| `src/services/ai/llm-client.ts:17` | `GOOGLE_AI_API_KEY` | **Yes** (as `GOOGLE_GENERATIVE_AI_API_KEY`) | `""` |
| `src/services/crawler/web-crawler.ts:39` | `USE_MOCK_CRAWLER` | No | `undefined` |
| `src/services/observability/tracker.ts:12` | `OBSERVABILITY_TRACE_SAMPLE_RATE` | No | `undefined` |
| `src/services/observability/tracker.ts:27` | `OBSERVABILITY_LLM_TOKEN_WARNING_THRESHOLD` | No | `undefined` |
| `src/features/acquisition/infrastructure/providers/firecrawl/firecrawl-crawl-provider.ts:101` | `FIRECRAWL_API_KEY` | **Yes** | `""` |
| `scripts/crawl-worker.ts:147` | `DATABASE_URL` | **Yes** | `undefined` |

---

### 5.2 Discrepancies and Undocumented Variables

1. **Variable Name Mismatch:**
   `.env.example` defines `GOOGLE_GENERATIVE_AI_API_KEY`, but application code in `src/services/ai/llm-client.ts` (line 17), `query-embedding.ts` (line 9), and `ai-visibility-provider.ts` (line 157) looks for `GOOGLE_AI_API_KEY`.
2. **Missing Security Critical Environment Variable:**
   `SESSION_SECRET` is missing from `.env.example`. In `src/services/auth/session.ts` (line 18), if `SESSION_SECRET` is omitted, it falls back to generating a random 32-byte key at module import time. In a serverless deployment (such as Vercel), this causes session verification to fail across different lambda invocations!
3. **Unused / Extra `.env.example` Variables:**
   `.env.example` contains `MIGRATION_DATABASE_URL`, `STAGING_MIGRATION_DATABASE_URL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and `DATA_SOURCE`, none of which are referenced anywhere in `src/` or `lib/`.

---

## 6. EXTERNAL SERVICE READINESS

### 6.1 Firecrawl Crawling Provider

- **Implementation Location:** `src/features/acquisition/infrastructure/providers/firecrawl/firecrawl-crawl-provider.ts` & `src/lib/firecrawl.ts`
- **Execution Mode:**
  - API Routes (`/api/v1/audit/free`, `/api/v1/audit/premium`, `/api/v1/content/studio`) invoke Firecrawl **synchronously** during HTTP request processing.
- **Timeouts & Vercel Serverless Limits:**
  - Vercel Serverless Function execution limit is **10s** (Hobby) or **60s** (Pro).
  - Deep site crawls via Firecrawl can take **2 to 15+ minutes**. Calling Firecrawl synchronously inside Vercel API routes will trigger `504 Gateway Timeout` errors in production.
- **Retries & Error Handling:**
  `firecrawl-crawl-provider.ts` (lines 70–85) maps error response status codes (`RATE_LIMITED`, `TIMEOUT`, `AUTHENTICATION_ERROR`), but **NO automatic retry logic with backoff** is implemented.
- **Cost Tracking & Caching:**
  - Crawl results are cached in `crawl_cache` table via `CrawlCacheRepository` if executed through the acquisition orchestrator. However, direct API route calls bypass caching.
  - No cost or credit tracking exists for Firecrawl API calls.

---

### 6.2 Google Gemini AI Client

- **Implementation Locations:**
  - `src/services/ai/llm-client.ts`
  - `src/services/ai/embed-client.ts`
  - `src/services/ai/query-embedding.ts`
  - `src/services/ai/ai-visibility-provider.ts`
- **Execution Mode:**
  Calls are synchronous promises executed during HTTP requests or Server Actions.
- **Retries & Timeouts:**
  - Uses `@google/genai` SDK without custom retry wrappers or timeout limits. If the Google AI endpoint hangs or rate-limits, requests will stall until Vercel terminates the function instance.
- **Cost Tracking & Budget Governance:**
  - Cost tracking exists in `src/services/cost-control/` (`CostCalculator` & `BudgetService`).
  - However, `llm-client.ts` does NOT check tenant budget limits BEFORE dispatching requests to Gemini, allowing unbudgeted API consumption.

---

## 7. BLOCKERS (Prioritized Resolution List)

The following ordered list identifies all technical issues that must be addressed before connecting a live PostgreSQL database:

### 1. [BLOCKER] Missing Core Tables in SQL Migrations
- **Issue:** 21 tables defined in `database/schema/*.ts` (including `organizations`, `admin_users`, `brands`, `entities`, `citations`, `ai_observations`, `visibility_scores`, `prompts`) are missing from all SQL migration files in `database/migrations/`.
- **Impact:** Any repository query against missing tables will throw `relation "xyz" does not exist` database errors immediately.

### 2. [BLOCKER] Broken Migration FK Dependency Ordering
- **Issue:** `0003_competitive_analyses.sql` and `0005_unified_intelligence_model.sql` attempt to create foreign key constraints referencing `organizations(id)` and `brands(id)`, but neither table is created prior to these migrations.
- **Impact:** Running `psql -f database/migrations/*.sql` on a fresh database halts execution due to broken foreign key dependencies.

### 3. [BLOCKER] Absence of Database Migration Runner
- **Issue:** No migration execution or tracking system exists in the repo, contradicting `database/schema/migration-strategy.md` (which documents Drizzle Kit CLI commands not present in `package.json`).
- **Impact:** Schema migrations cannot be safely or reproducibly applied across environments.

### 4. [BLOCKER] Missing `SESSION_SECRET` and Mismatched Google API Key Env Vars
- **Issue:** `SESSION_SECRET` is missing from `.env.example` and generates volatile random keys in serverless runtimes. Google API key name in `.env.example` (`GOOGLE_GENERATIVE_AI_API_KEY`) differs from code (`GOOGLE_AI_API_KEY`).
- **Impact:** Invalidates user auth sessions across serverless invocations and fails Gemini AI API requests.

### 5. [RISK] Synchronous Vercel Serverless Function Timeouts on Firecrawl
- **Issue:** `/api/v1/audit/premium` and `/api/v1/content/studio` perform synchronous site crawling via Firecrawl within API handlers.
- **Impact:** Will hit 10s/60s Vercel serverless timeouts on large domains. Crawl operations must be offloaded to asynchronous background jobs (`scripts/crawl-worker.ts` or background queues).

### 6. [RISK] Missing RLS Security Policies on 15 Database Tables
- **Issue:** 15 SQL tables (including `audit_prompts`, `prompt_executions`, `citation_occurrences`, `recommendation_observations`) do not have Row-Level Security enabled.
- **Impact:** Potential cross-tenant data visibility if raw SQL queries bypass application-level filtering.

### 7. [NICE-TO-HAVE] Hardcoded and Math.random() Mock Data Replacement
- **Issue:** API endpoints (`/api/v1/optimization/technical`, `/api/v1/analytics/llm`, etc.) use `Math.random()` to construct response payloads instead of querying unified intelligence database tables.
- **Impact:** Dashboard displays synthetic metrics rather than real, crawled audit intelligence.
