# Pre-Implementation Audit & Compatibility Report (Task 5.3)

This audit is conducted as the mandatory pre-implementation step of Phase 5 Task 5.3 (AI Brand Intelligence).

---

## 1. Domain Entities & Database Mapping

Our design must extend and align with our Task 5.0 and Task 5.2 implementations, reusing pre-existing tables whenever possible.

### Existing Entities & Tables
- `brands` (monitored tenant brand entity, containing `id`, `organization_id`, `name`, `website`)
- `competitors` (tenant's competitors containing `id`, `organization_id`, `name`, `domain`)
- `ai_observations` (generative run captures, containing `id`, `response_text`, `visibility_score`)
- `brand_mentions` (pre-existing table containing `id`, `organization_id`, `observation_id`, `entity_id`, `context_text_snippet`, `sentiment_score`, `sentiment_label`, `sentiment_confidence`, `confidence_score`, `confidence_rating`)
- `citation_sources` (citation sources, containing `id`, `domain`, `classification`, `authority_score`)
- `citation_occurrences` (individual URL occurrences, containing `id`, `source_id`, `created_at`)

### Proposed Extended Database Schema & Models
To support Task 5.3 (AI Brand Intelligence) without duplicate architecture, we will represent:
1. **Brand Associations (`brand_associations`):**
   - Mappings between the canonical `Brand` and extracted entities/concepts (products, categories, locations, competitors).
   - We will define `brand_associations` table in PostgreSQL.
2. **Recommendation Observations (`recommendation_observations`):**
   - Mappings between the canonical `Brand` and observed recommendation endorsement levels (`mention`, `consideration`, `recommendation`, `strong_recommendation`, `negative_recommendation`).
   - We will define `recommendation_observations` table in PostgreSQL.

---

## 2. Tenant isolation and Row-Level Security (RLS)

All new tables will strictly enable and enforce row-level security (RLS) policies:
`organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid`

This ensures that Tenant A can never retrieve, evaluate, or compare Tenant B's brand mentions, sentiment distributions, product associations, or recommendation share.

---

## 3. Reusable Architecture & Integration Points

We will reuse:
- **Lexical/Fuzzy Matchers:** Reuses the brand and alias extraction methods from Task 5.0.
- **Provider Abstraction:** Reuses the `IAIVisibilityProvider` interface to run prompts against Mock LLM or Gemini.
- **Citation Intelligence Integration:** Consumes citation and source authority signals from Task 5.2 to compute the brand's RAG citation support.
- **Task 4.4 Recommendation integration points:** Exposes structured signals (like brand visibility decline or competitor recommendation increase) for the Action Engine to consume.
- **Tenant Context Manager:** Runs all database actions inside the secure, transactional tenant context.

---

## 4. Modified & Created Files Matrix

We will create/modify:
- **Database:**
  - Create: `database/migrations/0010_brand_intelligence.sql`
  - Create: `database/schema/brand-intelligence.ts`
- **Domain Layer:**
  - Modify: `src/features/ai-intelligence/domain/types/index.ts` (extend with BrandAssociation, RecommendationObservation, and BrandAuthority types)
- **Persistence Layer:**
  - Modify: `src/features/ai-intelligence/repositories/interfaces.ts` (add `IBrandIntelligenceRepository`)
  - Modify: `src/features/ai-intelligence/repositories/index.ts` (implement `BrandIntelligenceRepository`)
- **Services & Use Cases:**
  - Create: `src/features/ai-intelligence/services/brand-intelligence-service.ts` (brand mention discovery, sentiment classifier, semantic entity association parser, recommendation level evaluator, and internal AI Brand Authority and AI Brand Visibility scorer)
- **API Boundary & Server Actions:**
  - Create: `src/app/actions/brand-intelligence.ts` (secure server action endpoints for retrieving brand overview, associations, and visibility trends)
- **Interactive UI:**
  - Create: `src/app/[locale]/dashboard/brand-monitoring/page.tsx` or overlay `page.tsx` with a fully featured, i18n/RTL-compliant Dashboard. Let's see: `src/app/[locale]/dashboard/brand-monitoring/` has `page.tsx`. We will implement our Farsi/English RTL dashboard there!
- **Verification Tests:**
  - Create: `tests/services/audit-engine/brand-intelligence.test.ts` (complete coverage of brand matching, sentiment classification, association strength, recommendation detection, and isolation boundaries)
