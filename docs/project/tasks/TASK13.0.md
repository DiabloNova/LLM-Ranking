PHASE 13 — PUBLIC WEBSITE & MARKET POSITIONING

Task 13.0 — Marketing Architecture

Mission

Implement the complete Public Website & Marketing Architecture for Seorchable as one single, self-contained engineering task.

This task covers the complete public-facing architecture required for market positioning:

Homepage

Solutions

Industries

Features

Pricing

Resources

Documentation

Blog

About

Contact


This task MUST NOT be split into additional Task 13.x tasks.

Jules may internally organize the work into implementation and validation steps, but all ten requirements above must be completed within Task 13.0.

The objective is to transform the existing verified product capabilities into a coherent public website that:

> Explains → Educates → Builds Trust → Converts



The objective is not to rebuild, invent, or replace the underlying product architecture.


---

1. STRATEGIC CONTEXT

Task 13.0 is part of the established execution roadmap.

The strategic priority order is:

1. Security Foundation


2. Tenant Isolation


3. Async Processing


4. Caching & Cost Control


5. Unified Dashboard


6. Core Intelligence Engine


7. AI Visibility / GEO / AEO


8. Competitive Intelligence


9. Diagnostic & Action Engine


10. Content Intelligence


11. Knowledge Intelligence


12. Selective SEO Intelligence


13. Monitoring & Automation


14. Monetization & Conversion


15. Public Website & Market Positioning



Task 13.0 therefore operates on top of the capabilities established by previous phases.

It must package, explain, expose, and position verified capabilities publicly.

It must not rebuild those capabilities.

Strategic boundary

Existing Product Capabilities
        ↓
Public Marketing Architecture
        ↓
Explain
        ↓
Educate
        ↓
Build Trust
        ↓
Convert

Not:

Marketing Page
        ↓
Invent Missing Product Capability
        ↓
Create New Backend
        ↓
Create New Database
        ↓
Create New API


---

2. ABSOLUTE EVIDENCE-FIRST RULE

The repository implementation is the primary source of truth.

Before modifying anything, inspect:

actual source code,

actual routes,

actual components,

actual layouts,

actual services,

actual APIs,

actual repositories,

actual database schema,

actual authentication,

actual authorization,

actual tenant behavior,

actual localization,

actual content infrastructure,

actual pricing implementation,

actual documentation infrastructure,

actual blog/resource infrastructure,

actual SEO infrastructure,

actual analytics,

actual tests,

actual installed dependencies.


AGENTS.md is mandatory.

Approved documentation is supporting evidence.

When documentation conflicts with implementation:

> Trust the current implementation.



Do not modify working code merely to make it match outdated documentation.


---

3. ABSOLUTE NO-GUESSING RULE

Never guess.

Never invent:

routes,

pages,

components,

APIs,

API contracts,

services,

repositories,

database tables,

database columns,

migrations,

CMS systems,

blog systems,

content models,

pricing models,

billing behavior,

authentication behavior,

authorization behavior,

tenant behavior,

analytics systems,

environment variables,

external services,

infrastructure,

product capabilities,

customer evidence,

marketing statistics.


If required implementation information cannot be verified:

> STOP — BLOCKED



Use exactly:

> BLOCKED — INSUFFICIENT EVIDENCE



Then report:

exact file/path,

missing dependency,

evidence searched,

why implementation would require guessing,

evidence required to unblock the task.


Do not work around the blocker with a mock, placeholder architecture, fake content, or invented implementation.


---

4. TASK SCOPE — NON-DIVISIBLE

Task 13.0 contains exactly these ten requirements:

1. Homepage


2. Solutions


3. Industries


4. Features


5. Pricing


6. Resources


7. Documentation


8. Blog


9. About


10. Contact



All ten belong to this one task.

Do not say:

“Blog will be handled later.”

“Pricing will be implemented in Task 13.1.”

“Documentation will be a future task.”

“Contact can be added later.”

“Only the homepage is needed for this task.”


That would violate the task definition.

Important distinction

Internal implementation steps are allowed:

Inspect
→ Plan
→ Implement
→ Validate
→ Review

But task decomposition is not allowed:

Task 13.0 Homepage
Task 13.1 Solutions
Task 13.2 Pricing
...

The latter is explicitly prohibited.


---

5. CORRECT / INCORRECT EXECUTION EXAMPLES

Example 1 — Existing capability

Correct:

If the repository already contains an implemented AI Visibility engine, inspect it and use its verified capabilities when building the public Features and Solutions pages.

Incorrect:

Create a new AIVisibilityMarketingService because the public website needs an AI Visibility page.


---

Example 2 — Missing CMS

Correct:

If the repository contains an existing MDX/content system, reuse it for Blog/Resources/Documentation.

Incorrect:

Install a new CMS merely because the task contains a Blog section.

If no suitable content architecture exists and implementing the required Blog would require inventing persistence or CMS architecture:

> BLOCKED — INSUFFICIENT EVIDENCE




---

Example 3 — Marketing claims

Correct:

If repository evidence proves that Seorchable provides AI Visibility analysis, publicly describe that capability.

Incorrect:

Claim:

“10,000 customers”

“50% more visibility”

“#1 AI visibility platform”

“Trusted by 500 enterprises”


unless those claims are explicitly supported by authoritative repository/task evidence.


---

Example 4 — Pricing

Correct:

Reuse the existing verified pricing/plan implementation established by the product.

Incorrect:

Invent new plans, prices, quotas, subscriptions, or payment states because the Pricing page needs content.


---

Example 5 — Contact

Correct:

Inspect whether the repository already has contact/email/form infrastructure and reuse it.

Incorrect:

Install an arbitrary email provider and invent environment variables simply to make the Contact form appear functional.


---

Example 6 — Scope creep

Correct:

If an unrelated database problem is discovered, report it and continue only if Task 13.0 does not depend on it.

Incorrect:

Refactor the database architecture because the public website happens to expose a feature that uses that database.


---

6. REPOSITORY INVESTIGATION

Before editing, investigate:

Routing

Inspect:

src/app/,

route groups,

locale routing,

layouts,

middleware/proxy,

public routes,

authenticated routes.


Existing public website

Inspect:

current homepage,

navigation,

footer,

existing landing-page sections,

CTA components,

pricing pages,

public content.


Product capabilities

Verify actual implementations for:

SEO,

AI Visibility / GEO / AEO,

Competitive Intelligence,

Diagnostic/Action Engine,

Content Intelligence,

Knowledge Intelligence,

Monitoring,

audits,

reporting,

workspace/account functionality.


Content infrastructure

Determine whether the repository already uses:

MDX,

Markdown,

static content,

content collections,

CMS,

existing blog infrastructure,

existing documentation infrastructure.


SEO infrastructure

Inspect:

metadata,

canonical URLs,

sitemap,

robots,

structured data,

Open Graph,

locale alternates.


Analytics

Inspect the existing analytics mechanism.

Do not introduce a duplicate system.


---

7. NEXT.JS REQUIREMENT

This repository uses a Next.js version that may differ from training knowledge.

Before changing Next.js-specific code:

1. inspect the installed version;


2. read the relevant documentation under:



node_modules/next/dist/docs/

3. inspect deprecation notices;


4. use only APIs supported by the installed version.



Do not rely on older Next.js conventions.


---

8. PUBLIC INFORMATION ARCHITECTURE

Create a coherent public architecture around:

Product discovery

Homepage

Features

Solutions

Industries


Commercial evaluation

Pricing


Education

Resources

Documentation

Blog


Company

About

Contact


The exact URLs must follow the repository's existing routing conventions.

Do not invent routing conventions without inspection.


---

9. HOMEPAGE

Implement the complete public Homepage.

It should communicate, using verified information:

what Seorchable is,

the problem it solves,

its AI-era brand visibility positioning,

major product capabilities,

relevant solutions,

relevant industries,

key differentiation,

appropriate CTAs,

links to deeper public content.


Only describe functionality that exists.

Do not fabricate:

customers,

testimonials,

awards,

partnerships,

statistics,

benchmarks,

market share,

performance claims.



---

10. SOLUTIONS

Implement the Solutions architecture around verified customer problems/use cases.

Potential areas may include:

AI Visibility,

SEO Intelligence,

Content Intelligence,

Competitive Intelligence,

Brand Monitoring,


only when supported by actual repository capabilities.

Each solution should follow the conceptual structure:

Problem
   ↓
Verified Seorchable Capability
   ↓
Relevant Value
   ↓
Evidence / Feature
   ↓
CTA

Do not claim outcomes that cannot be substantiated.


---

11. INDUSTRIES

Implement the Industries architecture using verified use cases.

Determine appropriate industries from:

actual product capabilities,

existing content,

approved documentation,

explicit task context.


Do not fabricate:

industry customers,

case studies,

ROI,

performance statistics,

customer logos.


Industry pages should communicate genuine product relevance rather than duplicate generic copy.


---

12. FEATURES

Implement the Features architecture using actual product functionality.

Potential feature categories may include:

SEO Intelligence,

AI Visibility / GEO / AEO,

Competitive Intelligence,

Content Intelligence,

Knowledge Intelligence,

Monitoring,

Diagnostics,

Audits,

Reporting.


Every advertised feature must map to verified implementation.

Do not advertise incomplete or nonexistent functionality as available.


---

13. PRICING

Inspect the existing Phase 12 monetization implementation and current pricing architecture.

Determine:

existing plans,

pricing source of truth,

free limits,

upgrade behavior,

existing pricing routes,

existing plan/entitlement structures.


Reuse verified existing mechanisms.

Do not invent:

prices,

plans,

subscriptions,

payment states,

entitlements,

limits.


Task 13.0 does not authorize implementing a new billing system.

If pricing information is absent, do not fabricate it.


---

14. RESOURCES

Implement Resources using existing verified content infrastructure.

Reuse:

existing content collections,

MDX,

Markdown,

documentation infrastructure,

existing static content.


Do not introduce a CMS solely because Resources exists in the task.

Resources should link to actual available content.

Do not create empty navigation destinations merely to satisfy the architecture.


---

15. DOCUMENTATION

Implement the public Documentation architecture using the repository's actual documentation mechanism.

Inspect:

current docs routes,

MDX/Markdown system,

navigation,

search,

localization,

documentation components.


Documentation must describe actual functionality.

Do not expose:

secrets,

private tenant information,

internal credentials,

privileged operational information,

unsupported APIs.


Do not invent documentation for functionality that does not exist.


---

16. BLOG

First inspect whether a Blog system already exists.

If an existing system exists

Reuse:

its routes,

content model,

rendering mechanism,

localization,

metadata.


If static/MDX content exists

Use the existing mechanism.

If neither exists

Do not automatically install:

CMS,

database,

blog repository,

content API,

external blogging service.


If completing the Blog requirement requires inventing architecture:

> BLOCKED — INSUFFICIENT EVIDENCE



Report the exact missing evidence.

Do not create fake posts merely to make the page look complete.


---

17. ABOUT

Implement About using verified company/product information.

Do not fabricate:

founder biographies,

employee counts,

locations,

funding,

investors,

partnerships,

awards,

company history.


Use factual product/company positioning where evidence exists.


---

18. CONTACT

Inspect the existing infrastructure first.

Determine whether the repository already has:

contact form,

contact API,

server action,

email infrastructure,

validation,

spam protection,

analytics,

persistence.


Reuse existing mechanisms.

Do not invent:

email providers,

SMTP systems,

APIs,

environment variables,

database tables.


If real contact submission requires missing architecture:

> BLOCKED — INSUFFICIENT EVIDENCE



Do not fake successful submission.


---

19. NAVIGATION AND FOOTER

Implement coherent navigation across all ten public sections.

Every link must resolve.

Do not use:

#,

fake routes,

unfinished destinations,

invented external URLs.


Reuse existing header/footer architecture.

Preserve separation between:

public marketing,

authentication,

authenticated application.



---

20. LOCALIZATION

The application contains:

/fa

/en


Preserve both.

Every public marketing surface must support:

Persian,

English,

RTL,

LTR,

locale routing,

responsive text layout.


Do not hard-code strings where the existing localization system should be used.

Do not complete only /en or only /fa.


---

21. UI / DESIGN SYSTEM

The application supports:

light theme,

dark theme.


Reuse:

existing design tokens,

typography,

spacing,

semantic colors,

Tailwind utilities,

components,

animation conventions.


Do not introduce a separate marketing design system without evidence that one already exists.

All public pages must be:

responsive,

accessible,

RTL/LTR compatible,

light/dark compatible.



---

22. ACCESSIBILITY

Verify:

semantic HTML,

heading hierarchy,

keyboard navigation,

focus states,

accessible controls,

meaningful link labels,

image alt text where applicable,

responsive behavior.


Do not introduce accessibility regressions into shared components.


---

23. PUBLIC SEO

Inspect existing SEO implementation before modifying it.

Verify:

title,

description,

canonical,

locale alternates,

Open Graph,

social metadata where supported,

sitemap,

robots,

structured data where appropriate.


Reuse existing SEO utilities.

Do not create duplicate metadata infrastructure.

Do not fabricate structured-data facts.


---

24. MARKETING CLAIM GOVERNANCE

All marketing claims must satisfy the evidence-first rule.

Allowed:

> “Seorchable provides AI Visibility analysis.”



if the capability exists in the repository.

Not allowed:

> “Seorchable increases AI visibility by 73%.”



unless verified evidence exists.

Not allowed:

> “Trusted by thousands of enterprises.”



unless verified evidence exists.

Not allowed:

> “The world's #1 AI visibility platform.”



unless explicitly supported by authoritative evidence.

When evidence does not exist:

remove the claim,

replace it with factual wording,

or report the blocker if the claim is mandatory.



---

25. AUTHENTICATION BOUNDARIES

Public pages must not alter authentication architecture.

Reuse existing routes for:

Sign Up,

Login,

Get Started,

Start Free,

Upgrade.


Do not create a parallel authentication system.

Do not expose authenticated application data publicly.


---

26. TENANT ISOLATION

Marketing pages normally should not access tenant-specific data.

If they do:

verify:

tenant identification,

tenant context,

repository scoping,

authorization,

RLS.


Never trust client-provided tenant IDs.

Never bypass tenant isolation.

If the boundary cannot be demonstrated:

> BLOCKED — INSUFFICIENT EVIDENCE




---

27. CONTACT DATA SECURITY

If contact submission is implemented:

validate server-side,

preserve existing security controls,

preserve existing authentication requirements where applicable,

protect sensitive configuration,

fail closed,

preserve error semantics.


Never return successful submission when the required backend operation failed.


---

28. CLIENT / SERVER BOUNDARIES

Keep server-only functionality server-side.

Never expose:

API keys,

DB credentials,

private tokens,

privileged operations,

server-only environment variables.


Do not add "use client" unless necessary.


---

29. ANALYTICS

Reuse the existing analytics infrastructure.

Where supported, instrument meaningful public events:

page viewed,

CTA clicked,

pricing viewed,

feature viewed,

documentation entered,

resource/blog selected,

contact interaction,

signup CTA selected.


Analytics must never become the source of truth for:

authorization,

billing,

entitlements,

tenant access.



---

30. PERFORMANCE

Public pages should avoid unnecessary runtime cost.

Reuse:

server rendering,

static rendering,

caching,

existing image handling,

code splitting.


Avoid:

unnecessary client components,

unnecessary dependencies,

expensive runtime computation,

large animation libraries when existing mechanisms suffice.


Do not optimize by changing architecture unnecessarily.


---

31. DEPENDENCIES

Before adding a dependency:

1. inspect package.json;


2. verify whether the capability already exists;


3. verify whether an existing dependency can solve it;


4. add a dependency only when genuinely necessary.



Do not:

add a CMS for convenience,

add an analytics provider,

upgrade dependencies unnecessarily,

introduce a new routing framework.



---

32. DATABASE PROTECTION

Task 13.0 does not authorize speculative database work.

Never invent:

blog tables,

resource tables,

contact tables,

pricing tables,

content tables,

repositories,

migrations,

relations.


Before any database-backed modification, establish:

1. canonical table,


2. relevant columns,


3. existing repository/query,


4. repository behavior,


5. tenant boundary,


6. authorization boundary,


7. expected error behavior.



If any is missing:

> BLOCKED — INSUFFICIENT EVIDENCE



Do not create schema merely to unblock the task.


---

33. ENVIRONMENT AND SECRETS

Never expose or commit:

DATABASE_URL,

MIGRATION_DATABASE_URL,

API keys,

tokens,

credentials,

passwords.


Use existing environment conventions.

Never create production secrets as part of this task.

Never use MIGRATION_DATABASE_URL for runtime behavior.

Never run migrations during:

next build,

Vercel deployment,

application startup.



---

34. TESTING AND VALIDATION

Inspect package.json first.

Use the repository's actual scripts.

Do not invent commands.

Validate where applicable:

Routing

all ten sections resolve,

/fa works,

/en works,

navigation works.


UI

light theme,

dark theme,

RTL,

LTR,

responsive,

accessibility.


SEO

metadata,

canonical,

locale handling,

sitemap/robots where affected.


Authentication

public routes remain public,

protected routes remain protected,

CTA destinations remain correct.


Contact

If implemented:

validation,

successful submission,

failure handling,

server-side enforcement,

secret safety.


Do not claim validation passed unless it actually ran.


---

35. CHANGE SCOPE

Only modify files necessary for Task 13.0.

Potential areas include:

src/app/

src/components/

existing localization/content files,

existing marketing components,

existing documentation/content directories,

relevant tests,

directly relevant documentation.


Database/schema files may only be modified if a verified database requirement exists.

These are potential locations, not permission to modify them indiscriminately.

If an unrelated file is required:

> STOP and report the dependency.



Do not silently expand scope.


---

36. EXPLICITLY OUT OF SCOPE

Do not implement:

payment gateway,

checkout,

billing architecture,

subscription engine,

new SEO engine,

new AI Visibility engine,

new Content Intelligence engine,

new Knowledge Intelligence engine,

new authentication system,

new tenant architecture,

new database architecture,

speculative CMS,

unrelated dashboard redesign,

framework upgrades,

dependency migrations,

deployment changes,

production infrastructure changes.


Task 13.0 is the public presentation and market-positioning layer.


---

37. DOCUMENTATION GOVERNANCE

Documentation describes implementation.

It does not define implementation.

If documentation conflicts with code:

1. inspect implementation;


2. determine actual behavior;


3. report discrepancy;


4. update documentation only where required.



Do not invent architecture to make documentation appear complete.


---

38. FINAL DIFF REVIEW

Before completion:

1. inspect the complete diff;


2. inspect every modified file;


3. remove unrelated changes;


4. remove debug code;


5. remove unused imports;


6. remove temporary files;


7. verify no secrets;


8. verify no fabricated claims;


9. verify no mock production data;


10. verify authentication boundaries;


11. verify tenant boundaries;


12. verify localization;


13. verify themes;


14. verify accessibility;


15. verify SEO;


16. verify all ten public sections;


17. verify no accidental architecture changes.




---

39. DEFINITION OF DONE

Task 13.0 is complete only when all ten requirements are implemented:

[ ] Homepage

[ ] Solutions

[ ] Industries

[ ] Features

[ ] Pricing

[ ] Resources

[ ] Documentation

[ ] Blog

[ ] About

[ ] Contact


And:

[ ] Public navigation works.

[ ] /fa works.

[ ] /en works.

[ ] RTL works.

[ ] LTR works.

[ ] Light theme works.

[ ] Dark theme works.

[ ] Responsive behavior works.

[ ] Accessibility has been checked.

[ ] Public SEO is correctly integrated.

[ ] Existing authentication is preserved.

[ ] Existing authorization is preserved.

[ ] Tenant isolation is preserved where applicable.

[ ] Existing APIs remain compatible.

[ ] Existing analytics is reused.

[ ] No fabricated marketing claims exist.

[ ] No mock/fake/demo production data exists.

[ ] No speculative CMS/content/database architecture exists.

[ ] No unrelated refactoring exists.

[ ] Relevant tests/checks actually ran.

[ ] Final diff was reviewed.

[ ] No requirement was deferred to another task.


If any required requirement cannot be completed from repository evidence:

> BLOCKED — INSUFFICIENT EVIDENCE



Do not claim completion.


---

40. REQUIRED FINAL REPORT

Provide one consolidated report.

A. Scope

Confirm:

Task 13.0 was executed as one task.

All ten requirements were addressed.

No Task 13.0 requirement was deferred.


B. Marketing Architecture

Report implementation status for:

Homepage

Solutions

Industries

Features

Pricing

Resources

Documentation

Blog

About

Contact


C. Repository Evidence

For each major section report the verified existing capability/content infrastructure used.

D. Routing

Report:

routes created/modified,

locale behavior,

navigation behavior.


E. Content

Report:

content source,

localization,

factual limitations,

claims deliberately excluded due to missing evidence.


F. Pricing

Report:

source of truth,

existing plans/limits reused,

whether pricing backend was changed.


G. Documentation / Blog / Resources

Report:

existing content infrastructure,

routes,

content source,

persistence changes, if any.


H. Contact

Report:

submission path,

validation,

infrastructure used,

error behavior.


I. SEO

Report:

metadata,

canonical behavior,

locale alternates,

sitemap/robots impact,

structured data changes.


J. UI / Localization

Report:

/fa,

/en,

RTL,

LTR,

light,

dark,

responsive,

accessibility.


K. Analytics

Report:

analytics system reused,

events added.


L. Security

Report:

authentication,

authorization,

tenant isolation where applicable,

SSRF considerations,

secret-safety verification.


M. Database

If database changes occurred, report:

previous data source,

new data source,

canonical table,

canonical repository/query,

tenant boundary,

authorization,

error behavior,

migration executed,

validation.


Never include connection strings or secrets.

If none occurred, state:

> No database changes were required.



N. Files

List every modified file and why it was modified.

O. Validation

Report:

exact commands,

exit status,

tests,

typecheck,

lint,

build,

E2E where applicable.


Never claim a command ran unless it actually ran.

P. Final Diff

Confirm:

unrelated changes removed,

debug code removed,

temporary files removed,

secrets absent,

no unintended architecture changes.


Q. Remaining Limitations

Report only verified limitations.

Never hide missing functionality behind:

placeholders,

fake content,

mock data,

fabricated claims,

assumptions.


R. Blocking Condition

If blocked, report:

exact file/path,

missing dependency,

evidence searched,

why guessing would be required,

evidence required to unblock.



---

PRIME DIRECTIVE

> Repository implementation is authoritative.

AGENTS.md is mandatory.

Approved documentation is supporting evidence.

Task instructions define scope.

The strategic roadmap defines priority.

Marketing content does not justify inventing product capabilities.

A missing CMS does not justify inventing a CMS.

A missing database table does not justify inventing a database table.

A missing API does not justify inventing an API.

A missing statistic does not justify inventing a marketing claim.

When evidence is missing: STOP — do not guess, fabricate, mock, or silently expand scope.

When another task is discovered: report it; do not silently expand the task.

Task 13.0 is nevertheless one complete, non-divisible task. All ten requirements must be addressed within this task.

The objective is: Explain → Educate → Build Trust → Convert, using only verified Seorchable capabilities and evidence.
