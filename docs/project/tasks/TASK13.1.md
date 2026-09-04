PHASE 13 — MARKETING WEBSITE & SERVICE LANDING PAGES

Task 13.1 — Service Landing Pages

Objective

Create dedicated, production-quality landing pages for Seorchable's major services.

These pages must establish a clear SEO/GEO-oriented service architecture, provide indexable content for each service, and create a consistent path from marketing content to the relevant product/service experience.

The implementation must reuse the existing design system, localization architecture, components, typography, navigation, footer, and established application conventions.

Do not redesign the entire website.

---

Required Service Pages

Create dedicated landing pages for:

1. SEO Audit
2. AI Visibility Audit
3. AI Citation Monitoring
4. AI Brand Intelligence
5. Competitive Intelligence
6. Content Intelligence
7. Technical SEO
8. Knowledge Graph
9. RAG Intelligence

Each service must have its own canonical route and independently indexable page.

---

Page Requirements

Every service landing page must contain:

1. Hero Section

- Clear service-specific H1
- Concise value proposition
- Primary CTA
- Secondary CTA where appropriate
- Service-specific messaging
- No generic duplicated hero copy across all pages

2. Problem / Value Section

Explain:

- What problem the service solves
- Why the problem matters
- What users gain from solving it

3. Capabilities

Present the major capabilities of that service.

Capabilities must reflect actual capabilities already present in the repository.

Do not invent product functionality that does not exist.

4. How It Works

Provide a concise explanation of the service workflow.

Use existing components where possible.

5. Benefits / Outcomes

Explain measurable or operational outcomes the service is intended to provide.

Avoid unsupported numerical claims.

6. CTA

End each page with a clear conversion action appropriate to the service.

---

SEO Requirements

Each page must have:

- Unique "<title>"
- Unique meta description
- Unique H1
- Correct heading hierarchy
- Canonical URL
- Open Graph metadata where the existing architecture supports it
- Appropriate internal links
- Descriptive URLs
- Indexable server-rendered content
- No duplicated page metadata

Where appropriate, add structured data using the existing project's SEO/metadata conventions.

Do not introduce a second SEO framework.

---

GEO / AI Visibility Requirements

The copy should also be structured for machine understanding and AI discovery.

Use:

- Explicit service definitions
- Clear entity/service terminology
- Well-structured sections
- FAQ content where genuinely useful
- Semantic internal linking
- Clear relationships between Seorchable, the service, and its capabilities

Do not keyword-stuff.

Do not make unsupported claims about rankings, AI engines, citations, or guaranteed results.

---

Localization

The existing bilingual architecture must be preserved.

Implement the pages for the project's supported locales:

- English ("en")
- Persian ("fa")

Persian pages must correctly support RTL.

Do not create a separate localization system.

Use the existing translation/message architecture if one is already established in the repository.

Do not hard-code English strings into components where the project convention requires localized messages.

---

Routing

Follow the existing "src/app/[locale]/" routing architecture.

Use the project's established routing conventions.

Do not introduce a parallel routing architecture.

Before implementing routes, inspect the existing application structure and determine the correct location for the service pages.

Use clean service-specific slugs, for example:

- "/seo-audit"
- "/ai-visibility-audit"
- "/ai-citation-monitoring"
- "/ai-brand-intelligence"
- "/competitive-intelligence"
- "/content-intelligence"
- "/technical-seo"
- "/knowledge-graph"
- "/rag-intelligence"

Adapt these only if the existing routing conventions require a different structure.

---

Internal Linking

Create logical links between:

- Service landing pages
- Relevant existing product/application pages
- Pricing
- Documentation
- Authentication/signup
- Other relevant service pages

Avoid creating artificial link networks.

Each service page should have a clear relationship to the rest of the site's information architecture.

---

Design Requirements

Use the existing Seorchable visual system.

Pages must be:

- Responsive
- Accessible
- Mobile-friendly
- Consistent with the existing navigation and footer
- Consistent with the existing light/dark theme architecture
- Visually distinct enough that they do not appear to be nine copies of the same page

Reuse existing components before creating new ones.

Do not perform unrelated UI refactoring.

---

Content Accuracy

Before writing service copy, inspect the repository and identify the actual implementation associated with each service.

The landing pages must accurately describe existing functionality.

In particular, map the pages to the existing capabilities for:

- SEO analysis
- AI visibility
- AI citations
- Brand intelligence
- Competitive intelligence
- Content intelligence
- Technical SEO
- Knowledge graph
- RAG intelligence

If a capability is not actually implemented, describe it only as a product/service concept when appropriate; do not present it as an already-available feature.

Do not create fake API endpoints, fake integrations, fake metrics, or fake product screenshots.

---

Allowed Scope

Primarily modify:

- "src/app/[locale]/" — service page routes and page-level metadata
- Existing localization/message files used by the marketing site
- Existing marketing/service components where required
- Existing shared UI components only when necessary for these pages
- Existing SEO/metadata utilities when required by the current architecture

You may create a dedicated service-landing component directory if the existing architecture supports this cleanly.

Do Not Modify

Do not modify:

- Database schema
- Database migrations
- Authentication/security architecture
- Tenant isolation
- Billing logic
- API authentication
- Background processing
- Core intelligence engines
- Existing business logic unrelated to these landing pages
- Production infrastructure
- Environment variables/secrets

Do not introduce new dependencies unless absolutely necessary and justified.

---

Architectural Constraints

- Existing architecture is authoritative.
- Reuse existing components and utilities.
- Server-side authorization remains authoritative wherever application links/actions enter protected functionality.
- Marketing-page visibility must never be treated as an authorization mechanism.
- Do not move business logic into client components merely to render marketing content.
- Prefer Server Components for static/indexable landing-page content.
- Preserve existing application behavior.
- No undocumented architectural changes.
- No destructive changes.
- No unrelated refactoring.

---

Validation

Before completing the task:

1. Verify all 9 service routes exist.
2. Verify both "en" and "fa" versions work.
3. Verify Persian RTL rendering.
4. Verify every page has unique title/meta description/H1.
5. Verify canonical metadata.
6. Verify internal links.
7. Verify navigation and footer remain functional.
8. Verify light/dark themes.
9. Verify responsive behavior.
10. Run the relevant lint/typecheck/test commands.
11. Fix only issues introduced by this task.

---

Deliverables

The final implementation must include:

- 9 dedicated service landing pages
- English and Persian localization
- Unique SEO metadata
- Service-specific content
- Internal linking
- Consistent responsive design
- Appropriate CTAs
- No invented functionality
- No unrelated architectural changes

At completion, report:

1. Exact routes created/modified
2. Components created/reused
3. Localization files modified
4. SEO/metadata implementation
5. Validation commands executed
6. Test/lint/typecheck results
7. Any capability that could not be accurately represented because the underlying functionality does not yet exist

One Jules task = one clearly defined scope. Do not expand this task into other Phase 13 work.
