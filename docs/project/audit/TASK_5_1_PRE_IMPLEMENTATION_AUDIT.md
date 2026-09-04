# Pre-Implementation Audit & Compatibility Report (Task 5.1)

This audit is conducted as the mandatory pre-implementation step of Phase 5 Task 5.1 (AI Prompt Intelligence).

---

## 1. Domain Entities & Database Mapping

Our design must extend and align with our Task 5.0 implementation. We will avoid creating any parallel or duplicate architectures.

### Existing Entities (from Task 5.0 & prior)
- `brands` (monitored tenant brand containing `name` and `website`)
- `prompts` (pre-existing tenant-scoped prompt definitions table)
- `ai_observations` (generative run captures)
- `brand_mentions` (contextual mentions)
- `citations` (parsed URL reference records)
- `ai_visibility_audits` (audit pipeline lifecycle logs)
- `audit_prompts` (individual prompt executions with full analysis evidence)

### Proposed Extended Database Schema & Models
To support Task 5.1 (AI Prompt Intelligence), we need to represent the following concepts:
1. **Prompt Library Definitions (`prompt_definitions`):**
   - Extends the legacy `prompts` table with versioning, templates, variables, active/inactive states, target competitors, and tags.
   - We will define `prompt_definitions` table in PostgreSQL.
2. **Prompt Templates & Resolved Variable Values:**
   - Parameterized prompt templates (e.g. `Who are the best {service} providers in {location}?`).
   - For every execution, the exact resolved prompt text must be persisted in an immutable snapshot version.
3. **Scheduled Prompts (`prompt_schedules`):**
   - Integrates with the existing `Job` scheduler structure of the project (`src/services/jobs/`).
   - Daily/weekly/monthly schedules, last/next execution, status, and failure states.
4. **Execution Attempts / State Machine (`prompt_executions`):**
   - Execution status machine states: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled`.
5. **Model Catalog / Comparative Model Matrix:**
   - We will define models in code (e.g. `gpt-4o`, `gemini-1.5-flash`, `sonar-medium`, etc.) rather than hard-coding provider strings in routes, keeping them fully decoupled.
6. **Brand vs. Competitor Positions (`position_observations`):**
   - Extracted semantic layout classifications: `not_present`, `mentioned`, `recommended`, `ranked`, `unknown` with numeric rankings and contextual snippet excerpts as evidence.

---

## 2. Tenant isolation and Row-Level Security (RLS)

All new tables will strictly enable and enforce row-level security (RLS) policies using the established tenant partition key:
`organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid`

This guarantees that a tenant can never query, edit, or execute another tenant's prompt definitions, versions, schedules, or execution observations.

---

## 3. Reusable Architecture & Integration Points

We will reuse:
- **Scoring Engine:** Reuses the custom deterministic scoring framework from Task 5.0.
- **Provider Abstraction:** Reuses the `IAIVisibilityProvider` interface from `src/services/ai/ai-visibility-provider.ts` to support both Mock and Gemini model executions seamlessly.
- **Citations & Mentions:** Reuses the lexical brand matchers, citation parsers, and entity recognition status indicators.
- **Scheduler Integration:** We will map logical scheduled prompt executions onto the platform's job worker (`JobService`).

---

## 4. Modified & Created Files Matrix

We will create/modify:
- **Database:**
  - Create: `database/migrations/0008_prompt_intelligence.sql`
  - Create: `database/schema/prompt-intelligence.ts`
- **Domain Layer:**
  - Modify: `src/features/ai-intelligence/domain/types/index.ts` (extend with prompt definitions, scheduled parameters, execution states, position observations)
- **Persistence Layer:**
  - Modify: `src/features/ai-intelligence/repositories/interfaces.ts` (add `IPromptIntelligenceRepository`)
  - Modify: `src/features/ai-intelligence/repositories/index.ts` (implement `PromptIntelligenceRepository` with both PostgresClient and memory Map fallbacks)
- **Services & Use Cases:**
  - Create: `src/features/ai-intelligence/services/prompt-intelligence-service.ts` (core state transition machine, variable parser, template resolver, execution scheduler, competitor position ranker, and model comparison engine)
- **API Boundary & Server Actions:**
  - Create: `src/app/actions/prompt-intelligence.ts` (secure server action endpoints for dashboard library operations, scheduled updates, running prompts, and comparative charts retrieval)
- **Interactive UI:**
  - Create: `src/app/[locale]/dashboard/aeo/playground/page.tsx` (fully featured, i18n/RTL-compliant, interactive playground supporting variable parameters, comparison across multiple models, scheduled prompt setups, and visual position rankings)
- **Verification Tests:**
  - Create: `tests/services/audit-engine/prompt-intelligence.test.ts` (complete coverage of state machine transitions, variable templating, model comparison, position evidence extraction, and isolation boundaries)
