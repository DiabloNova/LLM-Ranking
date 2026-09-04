# Seorchable — Sitemap, Route Architecture & Legacy Redirect Specification

**Execution Phase:** Phase 1 — Target Product Architecture
**Task ID:** 1.1
**Execution Agent:** Jules
**Document Version:** 1.0.0
**Date:** August 2026
**Status:** Authoritative Specification (Read-Only Planning Blueprint)

---

## 1. Executive Summary

This document establishes the canonical sitemap, route architecture, and redirect policy for the **Seorchable** SaaS platform. It acts as the single source of truth for the transition of our application from a series of semi-independent features into a highly cohesive, secure, multi-tenant workspace.

By categorizing every public and authenticated path, we safeguard authentication boundaries (Public vs. Dashboard), define localization expectations (`/[locale]/en` and `/[locale]/fa`), map out service relationships, and specify exactly which legacy or duplicate paths require Next.js-level permanent redirects.

**This is a planning and specification blueprint.** No application code is changed during this task. Future implementation phases will execute against this specification.

---

## 2. Source-of-Truth Declaration

This specification is aligned strictly and exclusively with the approved project roadmaps present in the repository:
1. `docs/roadmap/TASKS.md`
2. `docs/roadmap/EXECUTION_ROADMAP.md`
3. `docs/roadmap/PRODUCT_EVOLUTION_ROADMAP.md`

Any discrepancy between historical audit files, previous AI-generated reports, or local assumptions is resolved by treating the above three files as the supreme authority. This document consolidates their directives into an actionable architectural structure.

---

## 3. Route Classification Methodology

To ensure absolute precision, every route in this specification is classified under one of the following state classifications:

*   **EXISTING:** The route physically exists in the repository directories as verified by the current structure under `src/app/[locale]/`.
*   **TARGET:** The route is part of the approved future canonical architecture, but might not yet have a physical implementation or requires directory refactoring.
*   **LEGACY:** The route exists or is historically referenced, but is considered obsolete, redundant, or a duplicate. It is not part of the long-term canonical architecture.
*   **REDIRECT:** A legacy/obsolete route that must permanently redirect to a canonical TARGET route.
*   **DEFERRED:** A route or feature set explicitly postponed according to the roadmap phases (e.g., Tier 3/4 expansion features or Phase 13+ modules).

---

## 4. Public Sitemap

The public sitemap represents the unauthenticated, search-engine-indexable marketing and acquisition funnel. It is designed to capture organic search traffic across SEO and AI Visibility (GEO/AEO) keywords, demonstrate capabilities, and drive registrations.

The public surface must support the bilingual model: `/[locale]/` with `/en/` (LTR, English) and `/fa/` (RTL, Persian).

### Canonical Public Routes

1.  **Homepage (`/[locale]/`)**
    *   *Status:* EXISTING / TARGET
    *   *Purpose:* Primary portal. Features product-first interactive mock dashboards, B2B comparison table, Enterprise Trust Layer, and entry points for the free tool funnel.
    *   *Indexable:* Yes.
    *   *Localization:* Fully translated, supporting LTR (English) and RTL (Persian).
    *   *Relationship to Dashboard:* Houses the unauthenticated `#free-audit` and `#pricing` CTA sections.
2.  **Solutions Overview & Segments (`/[locale]/solutions`)**
    *   *Status:* EXISTING / TARGET
    *   *Sub-routes:*
        *   `/[locale]/solutions/aeo` (EXISTING / TARGET) - Generative Engine Optimization / AI Search Visibility marketing.
        *   `/[locale]/solutions/geo` (EXISTING / TARGET) - AI Search Optimization landing page.
        *   `/[locale]/solutions/protection` (EXISTING / TARGET) - AI Advertising & Brand Protection.
        *   `/[locale]/solutions/radar` (EXISTING / TARGET) - Competitive Intelligence Radar landing page.
    *   *Purpose:* Industry-specific and segment-specific landing pages detailing how Seorchable solves specific enterprise visibility needs.
    *   *Indexable:* Yes.
3.  **Pricing (`/[locale]/pricing`)**
    *   *Status:* EXISTING / TARGET
    *   *Purpose:* Showcases the Free, Professional, Business, and Enterprise plans, usage limits, and triggers registration.
    *   *Indexable:* Yes.
4.  **About Us (`/[locale]/about`)**
    *   *Status:* EXISTING / TARGET
    *   *Purpose:* Describes company vision, team, and careers.
    *   *Indexable:* Yes.
5.  **Contact Us (`/[locale]/contact`)**
    *   *Status:* EXISTING / TARGET
    *   *Purpose:* Direct lead capture form, B2B enterprise custom request form, and support entry point.
    *   *Indexable:* Yes.
6.  **Privacy & Terms (`/[locale]/privacy`)**
    *   *Status:* EXISTING / TARGET
    *   *Purpose:* Legally required privacy policy, terms of service, and cookie disclosures.
    *   *Indexable:* Yes (with nofollow options on certain legal variations if needed).
7.  **Blog (`/[locale]/blog`)**
    *   *Status:* EXISTING / TARGET
    *   *Purpose:* Content marketing hub containing SEO, GEO, AEO, and AI Search Visibility educational articles.
    *   *Indexable:* Yes.

---

## 5. Authentication Routes

Authentication routes are unauthenticated but must be strictly isolated from the dashboard workspace shell. They manage user access, registration, and email verification.

*   **Login (`/[locale]/login`)**
    *   *Status:* EXISTING / TARGET
    *   *Purpose:* Authenticate returning users. Once logged in, redirects to `/[locale]/dashboard`.
    *   *Indexable:* No (blocked via `robots.txt` / meta robots tag).
*   **Register (`/[locale]/register`)**
    *   *Status:* EXISTING / TARGET
    *   *Purpose:* SaaS workspace registration form with onboarding prompts. Once completed, redirects to registration verification.
    *   *Indexable:* No.
*   **Forgot Password (`/[locale]/forgot-password`)**
    *   *Status:* EXISTING / TARGET
    *   *Purpose:* Allows users to request password reset links.
    *   *Indexable:* No.
*   **Verify Email (`/[locale]/verify-email`)**
    *   *Status:* EXISTING / TARGET
    *   *Purpose:* Landing page for email verification tokens.
    *   *Indexable:* No.

---

## 6. Dashboard Architecture

The Authenticated Dashboard Layer is protected via `<ProtectedRoute>` boundaries. These routes manage tenant workspace operations and product tools.

### Canonical Workspace Structure

1.  **Dashboard Overview (`/[locale]/dashboard`)**
    *   *Status:* EXISTING / TARGET
    *   *Purpose:* Executive landing dashboard showing consolidated health indicators (Visibility Score, SEO Health, AI Visibility, Brand Authority, Citation Coverage, Competitor Position).
2.  **AI Visibility Audits (`/[locale]/dashboard/audits`)**
    *   *Status:* EXISTING / TARGET
    *   *Purpose:* Historical crawls list and start point for new on-demand crawls.
3.  **Audit Detail Scorecard (`/[locale]/dashboard/audits/[id]`)**
    *   *Status:* EXISTING / TARGET
    *   *Purpose:* Granular analysis for a single crawl ID, displaying AI Visibility scores, technical recommendations, and citations.
4.  **AI Query Lab / Prompt Monitor (`/[locale]/dashboard/query`)**
    *   *Status:* EXISTING / TARGET
    *   *Purpose:* Playground for running simulated prompts across LLM models and tracking sentiment scores.
5.  **Advanced Document Ingest (`/[locale]/dashboard/ingestion`)**
    *   *Status:* EXISTING / TARGET
    *   *Purpose:* Upload portal for proprietary documents (.txt, .md, .json) to train tenant-isolated RAG vector engines.
6.  **Competitive Intelligence (`/[locale]/dashboard/competitive`)**
    *   *Status:* EXISTING / TARGET
    *   *Purpose:* Interactive spider charts and tables comparing metrics across 5 domains.
7.  **Brand & Citation Monitoring (`/[locale]/dashboard/brand-monitoring`)**
    *   *Status:* EXISTING / TARGET
    *   *Purpose:* Real-time tracking of brand mentions and citation citations found in LLM answers.
8.  **Knowledge & Entity Explorer (`/[locale]/dashboard/entities`)**
    *   *Status:* EXISTING / TARGET
    *   *Purpose:* Visualization of the company’s semantic knowledge graph, entity authority, and connections.
9.  **Content Studio (`/[locale]/dashboard/content`)**
    *   *Status:* EXISTING / TARGET
    *   *Purpose:* Semantic editor, topic cluster analyser, and content optimization scoring system.
10. **Technical SEO Analyzer (`/[locale]/dashboard/optimization/technical`)**
    *   *Status:* EXISTING / TARGET
    *   *Purpose:* Details canonical mismatch, robots.txt, sitemaps, structured schema data, and crawl logs.
11. **LLM & Semantic Analytics (`/[locale]/dashboard/analytics/llm`)**
    *   *Status:* EXISTING / TARGET
    *   *Purpose:* Analytics dashboard tracking AI model response shares and prompt historical trends.
12. **Automated Reports (`/[locale]/dashboard/reports`)**
    *   *Status:* EXISTING / TARGET
    *   *Purpose:* Schedule automated PDF / CSV visibility report delivery.
13. **Billing & Subscriptions (`/[locale]/dashboard/billing`)**
    *   *Status:* EXISTING / TARGET
    *   *Purpose:* Upgrades, payment history, invoices, and quota details.
14. **Workspace & Profile Settings (`/[locale]/dashboard/settings`)**
    *   *Status:* EXISTING / TARGET
    *   *Purpose:* Team management, API tokens, workspace-level preferences.

---

## 7. Service Route Inventory

Each core Seorchable intelligence domain maps directly through three essential layers:
$$\text{Public Marketing Landing Page} \longrightarrow \text{Authenticated Workspace Tool} \longrightarrow \text{Technical Documentation Guide}$$

This maps the acquisition surface to the application workspace and the user education layer.

```
       [ Public Landing Page ]                [ Authenticated Tool ]               [ User Documentation ]
  /[locale]/solutions/aeo           -->  /[locale]/dashboard/audits         -->  /[locale]/docs/architecture
  /[locale]/solutions/geo           -->  /[locale]/dashboard/analytics/llm  -->  /[locale]/docs/ai-pipeline-architecture
  /[locale]/solutions/radar         -->  /[locale]/dashboard/competitive    -->  /[locale]/docs/domain-model
  /[locale]/solutions/protection    -->  /[locale]/dashboard/brand-monitoring-->  /[locale]/docs/rbac-model
```

### Strategic Mappings

*   **AI Visibility & Audits:**
    *   *Marketing Page:* `/[locale]/solutions/aeo`
    *   *Application Path:* `/[locale]/dashboard/audits` (And details at `/[locale]/dashboard/audits/[id]`)
    *   *Documentation:* `/[locale]/docs/architecture`
*   **AI Analytics & Prompting:**
    *   *Marketing Page:* `/[locale]/solutions/geo`
    *   *Application Path:* `/[locale]/dashboard/query`
    *   *Documentation:* `/[locale]/docs/ai-pipeline-architecture`
*   **Competitive Intelligence:**
    *   *Marketing Page:* `/[locale]/solutions/radar`
    *   *Application Path:* `/[locale]/dashboard/competitive`
    *   *Documentation:* `/[locale]/docs/domain-model`
*   **Content Intelligence & Studio:**
    *   *Marketing Page:* `/[locale]/solutions/geo` (To be expanded in future phases)
    *   *Application Path:* `/[locale]/dashboard/content`
    *   *Documentation:* `/[locale]/docs/data-flow`
*   **Knowledge Graph & Entities:**
    *   *Marketing Page:* `/[locale]/solutions/aeo`
    *   *Application Path:* `/[locale]/dashboard/entities`
    *   *Documentation:* `/[locale]/docs/knowledge-graph-design`

---

## 8. SEO Landing Page Architecture

To capture high-intent search volumes, Seorchable defines specialized SEO-focused public acquisition landing pages. These are structured as lightweight informational paths rather than authenticated routes.

Since individual sub-routes are planned for future programmatic rollout under Phase 13, they are currently marked as **TARGET / DEFERRED** to prevent indexing empty or low-fidelity stubs:

1.  **Technical SEO Marketing Page (`/[locale]/solutions/technical-seo`)**
    *   *Classification:* TARGET / DEFERRED
    *   *Purpose:* Landing page explaining crawlability, indexing limits, status codes, and why technical health affects AI crawler indexation.
2.  **Structured Data & Schema Marketing Page (`/[locale]/solutions/schema-structured-data`)**
    *   *Classification:* TARGET / DEFERRED
    *   *Purpose:* Guides users on how microdata formats and JSON-LD schema help LLM networks extract facts accurately.
3.  **SEO Auditing Landing Page (`/[locale]/solutions/seo-auditing`)**
    *   *Classification:* TARGET / DEFERRED
    *   *Purpose:* Landing page targeting commercial keywords like "SEO Audit Tool" or "Farsi SEO Crawler".

---

## 9. Service Landing Page Architecture

The platform maps acquisition surfaces targeting enterprise decision-makers across primary service sectors. These reside under `/[locale]/solutions/` and exist as high-fidelity interactive templates:

1.  **AI Visibility & Generative Optimization (`/[locale]/solutions/aeo`)**
    *   *Classification:* EXISTING / TARGET
    *   *Fidelity:* High-fidelity interactive mockups mapping brand citation rate.
2.  **AI Search Optimization (`/[locale]/solutions/geo`)**
    *   *Classification:* EXISTING / TARGET
    *   *Fidelity:* Showcases how modern search networks rank content based on brand association factors.
3.  **Competitive Intelligence (`/[locale]/solutions/radar`)**
    *   *Classification:* EXISTING / TARGET
    *   *Fidelity:* Interactive Spider charts comparing simulated client values with a benchmark.
4.  **AI Brand Protection & Compliance (`/[locale]/solutions/protection`)**
    *   *Classification:* EXISTING / TARGET
    *   *Fidelity:* Focuses on detecting LLM negative sentiment, hallucinated claims, and incorrect pricing.

---

## 10. Documentation Routes

The Documentation Portal is a static, bilingually-rendered system using standard Next.js routing patterns.

*   **Documentation Core Root (`/[locale]/docs`)**
    *   *Classification:* EXISTING / TARGET
    *   *Public Access:* Yes (Fully accessible without login to improve authority).
    *   *Indexability:* Yes (highly indexable).
    *   *Localization:* Fully translated into English and Persian.
    *   *Fidelity:* Powered by a static data array (`DOCS_TOPICS` in `src/lib/docsData.ts`) to ensure extremely high performance and avoid server-side filesystem dependencies.
*   **Documentation Slug (`/[locale]/docs/[slug]`)**
    *   *Classification:* EXISTING / TARGET
    *   *Purpose:* Renders detailed markdown files (e.g., `rbac-model`, `ai-pipeline-architecture`, `knowledge-graph-design`).

---

## 11. Account Routes

Account and profile settings are separated based on organizational workspace boundaries:

1.  **User Profile Settings (`/[locale]/profile`)**
    *   *Classification:* EXISTING / TARGET
    *   *Purpose:* Manage personal user parameters (password change, user avatar, display name, bilingual preferences).
    *   *Authentication:* Required.
2.  **Legacy Global Settings (`/[locale]/settings`)**
    *   *Classification:* REDIRECT
    *   *Redirect Target:* `/[locale]/profile`
    *   *Reason:* Clean directory hierarchy. General account settings must redirect to `/profile` to differentiate from `/dashboard/settings` (which houses workspace/tenant parameters).

---

## 12. Billing Routes

Billing represents a critical enterprise conversion point and is isolated from basic profile settings:

1.  **Workspace Billing (`/[locale]/dashboard/billing`)**
    *   *Classification:* EXISTING / TARGET
    *   *Purpose:* Manage the organization's plan, upgrade/downgrade flows, historical invoice list, and current API/crawl quota balances.
    *   *Authentication:* Required.
2.  **Standalone Invoice Payment Flow (`/[locale]/invoice`)**
    *   *Classification:* EXISTING / TARGET
    *   *Purpose:* Dedicated page hosted under the root locale to process outstanding payments securely. Linked globally via invoice receipt icons.

---

## 13. Canonical URL Policy

To prevent search ranking penalties, duplicate index entries, or crawl budget waste, the platform enforces a strict canonical URL policy.

1.  **Locale Subdirectory:**
    *   All public indexable URLs must explicitly include the localized subdirectory: `https://seorchable.ir/fa/...` or `https://seorchable.ir/en/...`.
2.  **No Trailing Slashes:**
    *   Next.js defaults must be configured to trim trailing slashes. All canonical meta tags must point to the non-trailing-slash URL:
        `https://seorchable.ir/en/solutions/aeo` is canonical; `https://seorchable.ir/en/solutions/aeo/` is invalid and must redirect.
3.  **Canonical Meta Tags `<link rel="canonical">`:**
    *   Every public page must render a canonical link pointing to its absolute URL (including locale directory).
4.  **Bilingual Alternate Tags `hreflang`:**
    *   Cross-localized pages must render alternate meta tags to notify search spiders of matching translations:
        ```html
        <link rel="alternate" hreflang="en" href="https://seorchable.ir/en/pricing" />
        <link rel="alternate" hreflang="fa" href="https://seorchable.ir/fa/pricing" />
        <link rel="alternate" hreflang="x-default" href="https://seorchable.ir/en/pricing" />
        ```
5.  **Dashboard Route Canonicalization:**
    *   Dashboard routes nested under `/dashboard` are protected behind authentication and are served with `<meta name="robots" content="noindex, nofollow">` to block indexation. Canonical URLs inside the dashboard are specified for routing reference only.
6.  **Query Parameter Strategy:**
    *   Marketing tracking UTM tags, pagination indices, or search queries (`?q=`, `?utm_source=`) must not generate unique indexable pages. The canonical meta tag must point to the bare path (e.g. `/[locale]/solutions/aeo`).

---

## 14. Legacy Redirect Matrix

Multiple duplicates and transitional routes exist in the repository to maintain historical compatibility. These must be permanently redirected (`301 Moved Permanently`) to their canonical target routes to clean up the product taxonomy:

| Legacy Route (Source) | Canonical Route (Destination) | Redirect Type | Reason / Justification |
| :--- | :--- | :--- | :--- |
| `/[locale]/settings` | `/[locale]/profile` | `301` Permanent | Grouping separation. Global settings represent user profile info, whereas `/dashboard/settings` manages enterprise-level workspace variables. |
| `/[locale]/dashboard/rag` | `/[locale]/dashboard/query` | `301` Permanent | Consolidation. Both directories render the RAG playground. The roadmap canonicalized this under Prompt Intelligence (`/query`). |
| `/[locale]/dashboard/ingest` | `/[locale]/dashboard/ingestion` | `301` Permanent | Consolidation. Both handle document ingestion. `/ingestion` is the fully client-side unified page. |
| `/[locale]/dashboard/competitors`| `/[locale]/dashboard/competitive` | `301` Permanent | Consolidation. Avoids duplicate routing for Competitive Intelligence Spider Charts. |
| `/[locale]/dashboard/graph` | `/[locale]/dashboard/entities` | `301` Permanent | Consolidation. Avoids duplicate routes for the Interactive Live Knowledge Graph. |
| `/[locale]/dashboard/audit` | `/[locale]/dashboard/audits` | `301` Permanent | Redirects legacy single-action audits folder to the historical audits list dashboard. |
| `/[locale]/dashboard/audit/free` | `/[locale]/dashboard/audits` | `301` Permanent | Consolidation. Free audit panel logic is being integrated into the core audits dashboard. |
| `/[locale]/dashboard/audit/premium`| `/[locale]/dashboard/audits` | `301` Permanent | Consolidation. Premium audits are processed via the unified `/audits` engine. |

---

## 15. Next.js Redirect Specification

To configure the redirect matrix outlined in Section 14, the following `next.config.ts` configuration snippet is proposed.

*(Note: In accordance with Strict Change Control rules, this snippet is illustrative and must not be written to `next.config.ts` during this task).*

```typescript
// Proposed redirect configuration for next.config.ts in future execution tasks
const nextConfig = {
  async redirects() {
    return [
      // 1. Legacy Global Settings to User Profile
      {
        source: '/:locale/settings',
        destination: '/:locale/profile',
        permanent: true,
      },
      // 2. Legacy RAG page to Prompt Query Intelligence
      {
        source: '/:locale/dashboard/rag',
        destination: '/:locale/dashboard/query',
        permanent: true,
      },
      // 3. Legacy Ingest to Advanced Ingestion Page
      {
        source: '/:locale/dashboard/ingest',
        destination: '/:locale/dashboard/ingestion',
        permanent: true,
      },
      // 4. Legacy Competitors page to Competitive Panel
      {
        source: '/:locale/dashboard/competitors',
        destination: '/:locale/dashboard/competitive',
        permanent: true,
      },
      // 5. Legacy Graph page to Entity Explorer
      {
        source: '/:locale/dashboard/graph',
        destination: '/:locale/dashboard/entities',
        permanent: true,
      },
      // 6. Legacy Audit paths to Audits list
      {
        source: '/:locale/dashboard/audit',
        destination: '/:locale/dashboard/audits',
        permanent: true,
      },
      {
        source: '/:locale/dashboard/audit/free',
        destination: '/:locale/dashboard/audits',
        permanent: true,
      },
      {
        source: '/:locale/dashboard/audit/premium',
        destination: '/:locale/dashboard/audits',
        permanent: true,
      }
    ];
  }
};
```

---

## 16. Route Migration & Dependency Notes

Transitioning from legacy paths to our canonical dashboard workspace introduces specific sequence-sensitive dependencies:

1.  **Authentication Guard Setup:**
    Ensure middleware is updated to protect `/[locale]/dashboard/settings`, `/[locale]/dashboard/billing`, `/[locale]/dashboard/audits`, and other dashboard sub-routes, while leaving `/[locale]/profile` and global navigation accessible.
2.  **Static Documentation Sync:**
    Since the dynamic route `/[locale]/docs/[slug]` depends on the `DOCS_TOPICS` array in `src/lib/docsData.ts`, any changes to slugs must be updated there simultaneously to avoid broken client-side hydration or 404s.
3.  **UI Navigation Component Updates:**
    Before applying the permanent redirects in `next.config.ts`, the navigation drawers (`AppSidebar.tsx` and bottom horizontal menus like `FloatingSidebar.tsx`) must have their reference links changed to point exclusively to the new canonical routes. Doing this out of order can trigger double-rendering cycles and degrade performance.

---

## 17. Explicit Deferred Items

According to the EXECUTION_ROADMAP timeline, the following items are deferred:

*   **Programmatic SEO Pages (`/[locale]/solutions/technical-seo`, `schema-structured-data`, `seo-auditing`):** Deferred to Phase 13. These routes do not exist physically in the repository.
*   **Third-Party API Integrations (WordPress/Shopify plugins under `/integrations`):** Deferred to Phase 15.
*   **Public API Developer Sandbox (`/[locale]/api-explorer`):** Deferred to Phase 16.
*   **Custom Enterprise SSO and SAML Login (`/[locale]/sso-login`):** Deferred to Phase 17.

---

## 18. Explicit Out-of-Scope Items

The following architectural topics are explicitly excluded from this specification to preserve the boundaries of Task 1.1:

*   **Authentication Logic Rewrite:** Modifying password hashing, session tokens, cookie middleware, or server actions is out of scope.
*   **Drizzle ORM Setup:** Setting up or migrating to a third-party ORM is out of scope (Postgres operations continue using standard TypeScript wrappers and pool clients).
*   **Payment Gateway APIs:** Writing actual payment processing gateways or integrating Stripe/Zarinpal webhooks is out of scope.
*   **UI Reskinning:** Redesigning color patterns or layout configurations is out of scope.

---

## 19. Authoritative Route Matrix

Every important route in Seorchable is cataloged below, displaying its classification, authentication boundary, indexing options, and localization details.

| Route (Template) | Type | Status | Canonical URL | Auth Required | Locale Directory | Indexable | Redirect Target | Notes / Context |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/[locale]` | EXISTING | TARGET | `/[locale]` | No | Yes (`/en`, `/fa`) | Yes | None | Primary marketing portal. |
| `/[locale]/solutions/aeo` | EXISTING | TARGET | `/[locale]/solutions/aeo` | No | Yes (`/en`, `/fa`) | Yes | None | High-fidelity interactive mockup. |
| `/[locale]/solutions/geo` | EXISTING | TARGET | `/[locale]/solutions/geo` | No | Yes (`/en`, `/fa`) | Yes | None | Search engine brand factors page. |
| `/[locale]/solutions/protection` | EXISTING | TARGET | `/[locale]/solutions/protection` | No | Yes (`/en`, `/fa`) | Yes | None | AI brand monitoring showcase. |
| `/[locale]/solutions/radar` | EXISTING | TARGET | `/[locale]/solutions/radar` | No | Yes (`/en`, `/fa`) | Yes | None | Competitive radar showcase. |
| `/[locale]/solutions/technical-seo` | TARGET | DEFERRED | `/[locale]/solutions/technical-seo` | No | Yes (`/en`, `/fa`) | No | None | Planned public acquisition page (Phase 13). |
| `/[locale]/solutions/schema-structured-data` | TARGET | DEFERRED | `/[locale]/solutions/schema-structured-data` | No | Yes (`/en`, `/fa`) | No | None | Planned public acquisition page (Phase 13). |
| `/[locale]/solutions/seo-auditing` | TARGET | DEFERRED | `/[locale]/solutions/seo-auditing` | No | Yes (`/en`, `/fa`) | No | None | Planned public acquisition page (Phase 13). |
| `/[locale]/pricing` | EXISTING | TARGET | `/[locale]/pricing` | No | Yes (`/en`, `/fa`) | Yes | None | Explains SaaS plans & quotas. |
| `/[locale]/about` | EXISTING | TARGET | `/[locale]/about` | No | Yes (`/en`, `/fa`) | Yes | None | About Us / Career hub. |
| `/[locale]/contact` | EXISTING | TARGET | `/[locale]/contact` | No | Yes (`/en`, `/fa`) | Yes | None | B2B enterprise leads intake. |
| `/[locale]/privacy` | EXISTING | TARGET | `/[locale]/privacy` | No | Yes (`/en`, `/fa`) | Yes | None | Standard terms & policies page. |
| `/[locale]/blog` | EXISTING | TARGET | `/[locale]/blog` | No | Yes (`/en`, `/fa`) | Yes | None | Content marketing repository. |
| `/[locale]/docs` | EXISTING | TARGET | `/[locale]/docs` | No | Yes (`/en`, `/fa`) | Yes | None | Documentation landing page. |
| `/[locale]/docs/[slug]` | EXISTING | TARGET | `/[locale]/docs/[slug]` | No | Yes (`/en`, `/fa`) | Yes | None | Renders individual topic markdowns. |
| `/[locale]/login` | EXISTING | TARGET | `/[locale]/login` | No | Yes (`/en`, `/fa`) | No | None | Handles secure workspace access. |
| `/[locale]/register` | EXISTING | TARGET | `/[locale]/register` | No | Yes (`/en`, `/fa`) | No | None | Handles new workspace registrations. |
| `/[locale]/forgot-password` | EXISTING | TARGET | `/[locale]/forgot-password` | No | Yes (`/en`, `/fa`) | No | None | Password resetting. |
| `/[locale]/verify-email` | EXISTING | TARGET | `/[locale]/verify-email` | No | Yes (`/en`, `/fa`) | No | None | Verification portal landing. |
| `/[locale]/dashboard` | EXISTING | TARGET | `/[locale]/dashboard` | Yes | Yes (`/en`, `/fa`) | No | None | Main authenticated executive overview. |
| `/[locale]/dashboard/audits` | EXISTING | TARGET | `/[locale]/dashboard/audits` | Yes | Yes (`/en`, `/fa`) | No | None | Lists historical crawler logs & audits. |
| `/[locale]/dashboard/audits/[id]` | EXISTING | TARGET | `/[locale]/dashboard/audits/[id]` | Yes | Yes (`/en`, `/fa`) | No | None | Scores AI footprints for crawl ID. |
| `/[locale]/dashboard/query` | EXISTING | TARGET | `/[locale]/dashboard/query` | Yes | Yes (`/en`, `/fa`) | No | None | Playground to run models & test prompts. |
| `/[locale]/dashboard/ingestion` | EXISTING | TARGET | `/[locale]/dashboard/ingestion` | Yes | Yes (`/en`, `/fa`) | No | None | Portal to upload files to vector DB. |
| `/[locale]/dashboard/competitive` | EXISTING | TARGET | `/[locale]/dashboard/competitive` | Yes | Yes (`/en`, `/fa`) | No | None | Compare up to 5 domains. |
| `/[locale]/dashboard/brand-monitoring` | EXISTING | TARGET | `/[locale]/dashboard/brand-monitoring` | Yes | Yes (`/en`, `/fa`) | No | None | Track brand mentions in AI outputs. |
| `/[locale]/dashboard/entities` | EXISTING | TARGET | `/[locale]/dashboard/entities` | Yes | Yes (`/en`, `/fa`) | No | None | Renders Live Knowledge Graph canvas. |
| `/[locale]/dashboard/content` | EXISTING | TARGET | `/[locale]/dashboard/content` | Yes | Yes (`/en`, `/fa`) | No | None | Content Studio editor & scoring. |
| `/[locale]/dashboard/optimization/technical` | EXISTING | TARGET | `/[locale]/dashboard/optimization/technical` | Yes | Yes (`/en`, `/fa`) | No | None | Canonical tags, robots, sitemaps. |
| `/[locale]/dashboard/analytics/llm` | EXISTING | TARGET | `/[locale]/dashboard/analytics/llm` | Yes | Yes (`/en`, `/fa`) | No | None | LLM responses and share rate charts. |
| `/[locale]/dashboard/reports` | EXISTING | TARGET | `/[locale]/dashboard/reports` | Yes | Yes (`/en`, `/fa`) | No | None | Schedules automated PDF reports. |
| `/[locale]/dashboard/billing` | EXISTING | TARGET | `/[locale]/dashboard/billing` | Yes | Yes (`/en`, `/fa`) | No | None | Workspace subscription settings. |
| `/[locale]/dashboard/settings` | EXISTING | TARGET | `/[locale]/dashboard/settings` | Yes | Yes (`/en`, `/fa`) | No | None | Workspace parameters and team invites. |
| `/[locale]/profile` | EXISTING | TARGET | `/[locale]/profile` | Yes | Yes (`/en`, `/fa`) | No | None | Personal user account preferences. |
| `/[locale]/invoice` | EXISTING | TARGET | `/[locale]/invoice` | No | Yes (`/en`, `/fa`) | No | None | Direct payment gateway portal. |
| `/[locale]/settings` | EXISTING | LEGACY | None | Yes | Yes (`/en`, `/fa`) | No | `/[locale]/profile` | Legacy global settings (needs redirect). |
| `/[locale]/dashboard/rag` | EXISTING | LEGACY | None | Yes | Yes (`/en`, `/fa`) | No | `/[locale]/dashboard/query` | Duplicate RAG index page (needs redirect). |
| `/[locale]/dashboard/ingest` | EXISTING | LEGACY | None | Yes | Yes (`/en`, `/fa`) | No | `/[locale]/dashboard/ingestion` | Duplicate Ingest index page (needs redirect). |
| `/[locale]/dashboard/competitors`| EXISTING | LEGACY | None | Yes | Yes (`/en`, `/fa`) | No | `/[locale]/dashboard/competitive`| Duplicate Competitors index page (redirect). |
| `/[locale]/dashboard/graph` | EXISTING | LEGACY | None | Yes | Yes (`/en`, `/fa`) | No | `/[locale]/dashboard/entities` | Duplicate Knowledge Graph page (redirect). |
| `/[locale]/dashboard/audit` | EXISTING | LEGACY | None | Yes | Yes (`/en`, `/fa`) | No | `/[locale]/dashboard/audits` | Single-audit legacy page (needs redirect). |
| `/[locale]/dashboard/audit/free` | EXISTING | LEGACY | None | Yes | Yes (`/en`, `/fa`) | No | `/[locale]/dashboard/audits` | Legacy Free Audit panel (needs redirect). |
| `/[locale]/dashboard/audit/premium`| EXISTING | LEGACY | None | Yes | Yes (`/en`, `/fa`) | No | `/[locale]/dashboard/audits` | Legacy Premium Audit panel (redirect). |

---

## 20. Conclusion

This blueprint provides an absolute route and redirect plan for subsequent SaaS platform development. All verified duplicate paths discovered in the repository have been assigned permanent `301` redirect mappings to optimize user experiences and avoid indexing duplicate routes.

Developers executing Task 1.3 (Dashboard Navigation Architecture) or subsequent routing implementations must refer strictly to this guide to maintain architectural integrity.
