PHASE 12 — MONETIZATION & CONVERSION

Task 12.0 — Free Tool Strategy

Mission

Implement the complete Free Tool Strategy defined by Task 12.0 as one independent, complete engineering scope.

The scope includes:

Free SEO tools

Free AI visibility tools

Limited audits

Usage limits

Result previews

Account requirements

Upgrade triggers


This task must be implemented against the actual current repository implementation.

Do not reduce this task to a single-tool prototype. Do not defer any requirement listed above into another task.

Jules may internally organize the implementation into technical steps for execution, validation, and review, but all Task 12.0 requirements must be completed within this task.


---

1. SOURCE-OF-TRUTH AND EVIDENCE-FIRST RULE

The repository is the primary source of truth.

Before implementing anything, inspect and verify:

actual source code,

actual routes,

actual components,

actual services,

actual repositories,

actual database schema,

actual migrations,

actual API contracts,

actual authentication flow,

actual authorization behavior,

actual tenant-context flow,

actual tests,

actual configuration,

actual installed dependencies.


Approved repository documentation and AGENTS.md are supporting evidence.

Do not assume that documentation, comments, previous audit reports, task descriptions, or architectural diagrams accurately describe the current implementation.

When implementation and documentation disagree:

> Trust the current repository implementation.




---

2. ABSOLUTE NO-GUESSING RULE

Never guess.

Do not invent:

database tables,

columns,

repositories,

repository methods,

services,

APIs,

API contracts,

routes,

tenant behavior,

authorization behavior,

migration behavior,

schema relationships,

configuration,

environment variables,

external services,

fallback data sources,

production infrastructure,

entitlement mechanisms,

usage mechanisms,

mock production implementations.


If a required implementation detail cannot be established from:

1. the current repository implementation,


2. approved repository documentation,


3. AGENTS.md,


4. or the explicit requirements of this task,



STOP.

Report:

> BLOCKED — INSUFFICIENT EVIDENCE



and identify:

exact file/path,

exact missing dependency,

evidence searched,

why implementation would require guessing,

exact evidence required to unblock the task.


Do not continue by making an assumption.


---

3. MANDATORY ENGINEERING RULES

Follow AGENTS.md in full.

In particular:

preserve the existing architecture;

make the smallest correct change;

do not refactor unrelated code;

do not introduce speculative features;

do not create parallel implementations;

preserve authentication and authorization;

preserve tenant isolation;

preserve RLS;

preserve persistence guarantees;

preserve API contracts;

preserve error semantics;

fail closed when required dependencies fail;

do not fabricate application data;

do not introduce mock/demo/fake/fallback production data;

inspect the final diff before completion.


Do not use mocks to conceal missing production implementation.

Mocks are permitted only for appropriate deterministic tests or existing development tooling explicitly designed around mocks.


---

4. STRATEGIC PRIORITY

Follow the established execution priority:

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



Task 12.0 must consume and extend capabilities established by earlier phases.

Do not bypass or weaken earlier architectural foundations to implement monetization.

Do not rebuild existing intelligence engines merely to expose them through the free-tool strategy.


---

5. TASK SCOPE — ONE COMPLETE SCOPE

Task 12.0 is one independent product/engineering scope.

The following are all part of this same task:

1. Free SEO tools


2. Free AI visibility tools


3. Limited audits


4. Usage limits


5. Result previews


6. Account requirements


7. Upgrade triggers



Do not implement only one of these and declare the task complete.

Do not defer any of them into a later Task 12.x task.

Internal technical implementation steps are allowed, but they are execution steps inside Task 12.0, not separate tasks.


---

6. REPOSITORY INVESTIGATION

Before editing, inspect the actual repository and trace the relevant implementation.

At minimum investigate:

Product capabilities

existing SEO tools,

existing technical SEO capabilities,

existing keyword capabilities,

existing AI Visibility / GEO / AEO capabilities,

existing audit functionality,

existing diagnostic functionality,

existing reporting/results functionality.


Identity and access

authentication,

sessions,

users,

organizations,

workspaces,

members,

roles,

permissions,

tenant context,

authorization.


Data and persistence

canonical schema,

canonical repositories,

database queries,

RLS,

tenant boundaries,

persistence guarantees,

existing usage/accounting structures if any.


Infrastructure

asynchronous processing,

job/queue architecture,

caching,

deduplication,

rate limiting,

external API usage,

analytics/instrumentation.


Product UX

localized routes,

existing dashboard,

existing tool pages,

pricing pages,

account flows,

upgrade surfaces.


Validation

package scripts,

unit tests,

integration tests,

E2E tests,

existing security tests.


Do not guess any of the above.


---

7. NEXT.JS REQUIREMENT

This repository uses a Next.js version whose APIs and conventions may differ from general training knowledge.

Before modifying Next.js-specific code:

1. Inspect the installed Next.js version.


2. Read the relevant documentation under:



node_modules/next/dist/docs/

3. Check relevant deprecation notices.


4. Use only APIs and conventions supported by the installed version.



Do not rely on knowledge of older Next.js versions.


---

8. IDENTIFY THE ACTUAL FREE-TOOL CAPABILITIES

Determine from repository evidence which already implemented capabilities can satisfy:

Free SEO Tools

Identify the existing SEO functionality that can safely be exposed as free functionality.

For each selected existing capability, establish from evidence:

actual route/API,

actual service/use-case,

actual repository/data source,

actual input contract,

actual output contract,

existing authentication requirements,

existing authorization behavior,

tenant boundary,

resource/cost characteristics.


Free AI Visibility Tools

Perform the same evidence-based analysis for existing AI Visibility / GEO / AEO capabilities.

Do not invent a new tool because a desired capability is absent.

If a required category cannot be implemented from existing verified capabilities without inventing architecture:

BLOCKED — INSUFFICIENT EVIDENCE.


---

9. DOMAIN / DATA / API CONTRACTS

Before changing UI or wiring new flows, establish from repository evidence:

relevant domain model,

existing data contracts,

existing API contracts,

request validation,

response structures,

authentication requirements,

authorization boundaries,

tenant boundaries,

error contracts.


Do not invent an API contract where an existing contract can be reused.

Do not silently change an existing API contract.

If a breaking API change is genuinely required:

identify all affected consumers,

explain why it is required,

preserve backward compatibility where the architecture requires it,

remain within this task's explicit scope.


If the required contract cannot be established:

BLOCK.


---

10. FREE SEO TOOLS

Implement the free SEO experience using verified existing SEO capabilities.

The strategy must establish, based on actual repository capabilities:

available free functionality,

accepted inputs,

execution behavior,

result behavior,

free limitations,

account requirements,

usage limits,

result previews,

upgrade boundaries.


Do not rebuild existing SEO engines.

Do not fabricate SEO results.

Do not substitute demo/static data for missing production persistence or processing.


---

11. FREE AI VISIBILITY TOOLS

Implement the free AI Visibility experience using verified existing AI Visibility / GEO / AEO capabilities.

Establish:

available functionality,

accepted inputs,

execution path,

actual data sources,

result behavior,

free limitations,

account requirements,

usage limits,

result previews,

upgrade boundaries.


Preserve existing:

AI provider integrations,

API contracts,

credential handling,

validation,

asynchronous processing,

error handling,

server/client boundaries.


Do not introduce a new provider unless explicitly required and supported by repository evidence.


---

12. LIMITED AUDITS

Implement the limited-audit experience using the existing audit architecture.

The free audit must provide real product value while controlling resource consumption.

Define, using verified implementation evidence:

allowed inputs,

execution scope,

processing limits,

result limits,

analysis-depth limits,

preview boundary,

account boundary,

usage boundary.


If the existing audit system is asynchronous, preserve the asynchronous architecture.

Do not convert an asynchronous workload into synchronous request processing simply to support the free tier.


---

13. USAGE LIMITS

Implement server-enforced usage limits for the complete Free Tool Strategy.

Before implementing usage accounting, inspect whether the repository already contains:

usage tracking,

rate limiting,

quotas,

entitlement checks,

account limits,

workspace limits,

tenant-level limits,

existing billing-related structures.


Reuse or safely extend existing mechanisms where appropriate.

Do not create a parallel usage system.

Database Evidence Requirement

Before changing any database-backed usage functionality, verify all of the following from repository evidence:

1. canonical table,


2. relevant columns,


3. existing repository or approved query,


4. repository behavior,


5. tenant boundary,


6. authorization boundary,


7. expected error behavior.



If any required evidence is missing:

> BLOCKED — INSUFFICIENT EVIDENCE



Do not create a guessed table, column, relation, repository, migration, or RLS policy.


---

14. DATABASE AND MIGRATION PROTECTION

Task 12.0 does not implicitly authorize speculative database architecture.

Do not:

create guessed tables,

create guessed columns,

create guessed relations,

create guessed repositories,

create guessed migrations,

modify RLS based on assumptions,

modify tenant isolation based on assumptions,

create migration infrastructure to unblock the task.


If a verified database change is genuinely required by the existing architecture and can be fully evidenced, follow the repository's canonical migration workflow.

Use:

DATABASE_URL for normal application/runtime queries and tenant-scoped application tests.

MIGRATION_DATABASE_URL only for explicitly executing migrations.


Never:

use MIGRATION_DATABASE_URL in runtime code,

use it in API routes,

use it in runtime-simulating tests,

use it in Vercel,

use it client-side,

log or expose either connection string.


Never run migrations automatically during:

next build,

Vercel deployment,

application startup.


If the required database architecture cannot be established:

BLOCK.


---

15. ANONYMOUS USERS

Determine the anonymous-user experience from actual authentication and application architecture.

Where the existing architecture supports anonymous access, implement a controlled free experience.

Where an account is required, enforce that requirement server-side.

Never trust client-provided:

user IDs,

tenant IDs,

organization IDs,

workspace IDs,

quota counters,

usage counters,

entitlement flags,

plan identifiers.


Anonymous access must not create an uncontrolled path to expensive infrastructure.


---

16. ACCOUNT REQUIREMENT

Implement account requirements as real server-side product rules.

Establish from actual architecture:

what can be used anonymously,

what requires authentication,

when authentication becomes necessary,

how authentication is enforced,

how the authenticated user continues the workflow,

whether an existing result can safely be preserved across authentication.


The conceptual flow may be:

Free Entry
   ↓
Controlled Free Experience
   ↓
Limited Result / Preview
   ↓
Account Requirement
   ↓
Authenticated Free Experience
   ↓
Free Usage Boundary
   ↓
Upgrade Trigger

The actual sequence must follow the repository's verified architecture.

Do not create a new authentication system.


---

17. RESULT PREVIEWS

Implement meaningful result previews using actual production results.

A preview may expose, where supported by the underlying implementation:

selected findings,

limited metrics,

summary insights,

selected recommendations,

partial audit results,

limited AI visibility findings.


The exact preview must be derived from the real underlying capability.

Do not fabricate results.

Do not rely solely on frontend hiding.

The server must enforce any restricted-result boundary.

A legitimate empty result must remain distinguishable from infrastructure failure when the existing architecture provides that distinction.


---

18. UPGRADE TRIGGERS

Implement conversion triggers at real product boundaries.

Potential verified boundaries include:

free usage exhausted,

additional results requested,

deeper analysis requested,

expanded audit requested,

additional AI visibility analysis requested,

recurring functionality requested,

functionality outside the free allowance requested.


Only implement boundaries supported by the actual product capabilities.

Upgrade triggers must not falsely claim that payment or subscription has occurred.

If the repository already contains a pricing or upgrade destination, reuse it.

Do not create a parallel pricing/account system.


---

19. BILLING BOUNDARY

Task 12.0 establishes the conversion path, not an invented payment system.

Do not implement:

payment gateway,

checkout,

subscription billing,

invoice processing,

payment reconciliation,

coupon system,

affiliate system,


unless one of these is explicitly included by a verified existing Task 12.0 requirement—which it currently is not.

Upgrade CTAs may direct the user to an existing pricing/upgrade surface.

Do not simulate successful payment or subscription state.


---

20. COST AND ABUSE PROTECTION

Free functionality is a potential cost-abuse vector.

Protect verified existing resources, including where applicable:

database,

crawling,

Firecrawl,

Gemini/LLM,

asynchronous workers,

external APIs,

CPU/memory,

storage.


Reuse existing:

rate limiting,

caching,

deduplication,

asynchronous processing,

validation,

resource controls.


Do not invent a new cost-control architecture when an existing mechanism can be reused.

Do not silently convert failures into successful-looking responses.

Required dependencies must fail closed.


---

21. TENANT ISOLATION

Before modifying tenant-sensitive functionality, explicitly trace and verify:

tenant identification,

tenant-context propagation,

repository scoping,

PostgreSQL RLS,

authorization.


Never infer tenant behavior.

Never trust a client-provided tenant identifier.

Never bypass repository or database-level tenant isolation.

Never weaken existing RLS policies.

If tenant behavior cannot be demonstrated:

BLOCK.


---

22. AUTHORIZATION

Preserve the existing authorization architecture.

Never:

remove authorization checks,

weaken authorization,

bypass policy checks,

expose data through direct repository calls merely because they are convenient,

assume authentication implies authorization.


If authorization behavior is unclear:

BLOCK.


---

23. FAIL-CLOSED BEHAVIOR

Required dependencies must fail closed.

Database failures, authorization failures, tenant-context failures, and required external-service failures must not silently become:

mock data,

random data,

demo data,

fabricated success,

fake results,

arbitrary fallback data.


Do not use:

Math.random()

mockData

demoData

fakeData

fallbackData


as substitutes for unavailable production data.


---

24. ANALYTICS / CONVERSION INSTRUMENTATION

Use the repository's existing analytics/instrumentation mechanism.

Where the existing architecture supports these events, instrument the funnel:

free tool viewed,

free tool started,

free execution accepted,

free execution completed,

result preview displayed,

account requirement displayed,

account flow started,

free usage limit reached,

upgrade trigger displayed,

upgrade destination selected.


Do not introduce a duplicate analytics provider.

Do not send unnecessary sensitive user, tenant, credential, or internal data.

Analytics must not become the source of truth for:

authorization,

quota,

entitlement,

billing.


If the existing analytics implementation cannot support a requested event and creating a new analytics architecture would be required, inspect and report the dependency rather than inventing a parallel system.


---

25. LOCALIZATION

Preserve the existing localized architecture:

/fa

/en


All user-facing changes must preserve:

Persian RTL,

English LTR,

locale routing,

translations,

responsive behavior,

text expansion.


Do not hard-code user-facing strings when the existing localization system should be used.

Do not implement the feature for one locale while breaking the other.


---

26. UI / THEMES / DESIGN SYSTEM

The application supports light and dark themes.

Preserve:

light theme,

dark theme,

existing design tokens,

typography,

spacing,

component conventions,

Tailwind conventions,

existing animation conventions.


New UI must remain:

responsive,

accessible,

RTL/LTR compatible,

light/dark compatible.


Do not perform an unrelated visual redesign.


---

27. CLIENT / SERVER BOUNDARIES

Respect Next.js server/client boundaries.

Keep:

database access,

secrets,

privileged operations,

authorization decisions,

usage enforcement,


on the server.

Never expose:

API keys,

database credentials,

private tokens,

privileged operations,

server-only environment variables


to client-side code.

Do not add "use client" unless required.

Before moving logic between server and client, inspect security, rendering, and data-flow implications.


---

28. URL FETCHING / SSRF

If the selected free tools accept user-provided URLs, treat server-side URL fetching as security-sensitive.

Preserve existing SSRF protections.

Do not introduce unrestricted requests to arbitrary user URLs.

Verify handling of:

localhost,

loopback,

private networks,

internal services,

cloud metadata endpoints,

redirects,

unexpected protocols,

DNS-related SSRF risks.


Do not replace a hardened implementation with an unrestricted fetch.


---

29. API CONTRACTS

Before changing or creating any API behavior, inspect:

implementation,

consumers,

request structure,

response structure,

validation,

authentication,

authorization,

tests.


Do not silently change existing API contracts.

Do not invent a new API contract when an existing API already satisfies the requirement.

If an API contract required by Task 12.0 cannot be established from repository evidence:

BLOCK.


---

30. DEPENDENCIES

Before adding a dependency:

1. verify whether the repository already provides the capability;


2. verify whether an existing dependency can be reused;


3. determine whether the new dependency is genuinely required.



Do not add packages for trivial functionality.

Do not upgrade dependencies unless required by this task.

Do not introduce an external service merely because it is convenient.


---

31. TESTING AND VALIDATION

Inspect package.json before running validation.

Use the repository's actual scripts.

Do not invent command names.

Run the relevant available validation for:

TypeScript/type checking,

ESLint/linting,

unit tests,

integration tests,

E2E tests,

production build,


where applicable to the changed functionality.

Do not claim a check passed unless it actually ran.

Do not remove or weaken tests to make them pass.


---

32. REQUIRED TEST COVERAGE

Add or update focused tests for the complete Task 12.0 scope.

Free SEO

valid free execution,

invalid input,

result boundary,

usage boundary.


Free AI Visibility

valid free execution,

invalid input,

result boundary,

usage boundary.


Limited Audits

valid audit path,

controlled scope,

preview restriction,

resource/usage restriction.


Account Requirement

anonymous path where supported,

account-required path,

server-side enforcement,

authenticated continuation.


Usage Limits

within-limit execution,

limit reached,

repeated requests,

client-side counter manipulation,

identity manipulation,

tenant manipulation.


Result Preview

valid preview,

restricted data not exposed,

server-side boundary enforcement.


Upgrade Triggers

correct trigger condition,

correct destination behavior,

analytics event where supported.


Security

unauthorized access,

cross-tenant access,

forged identity,

forged entitlement,

usage-limit bypass attempts.



---

33. CHANGE SCOPE

Before editing, identify the exact files that require modification.

Only modify files explicitly permitted by this task.

Expected areas may include:

src/app/

src/core/

src/lib/

relevant existing tests,

database/schema/ only when a verified database change is required,

database/drizzle/ only through the canonical migration process when a verified database change is required,

directly relevant documentation under doc/.


These are allowed areas, not an instruction to modify them.

If another file is required:

1. determine why;


2. verify it is necessary;


3. if it is outside the permitted scope, STOP and report BLOCKED.



Do not expand scope silently.


---

34. DOCUMENTATION GOVERNANCE

Documentation describes implementation; it does not define it.

Update documentation only where Task 12.0 requires documentation changes.

Document only verified implemented behavior:

free SEO capabilities,

free AI Visibility capabilities,

limited audits,

usage limits,

account requirements,

result previews,

upgrade triggers,

security boundaries,

cost-control behavior,

analytics events,

verified schema changes, if any.


Do not document planned or hypothetical functionality as implemented.

If documentation conflicts with implementation, report the discrepancy rather than changing working code merely to satisfy documentation.


---

35. FINAL CHANGE REVIEW

Before completion:

1. inspect the complete final diff;


2. verify every modified file;


3. remove unrelated changes;


4. remove debug code;


5. remove unused imports;


6. remove temporary files;


7. verify no secrets were introduced;


8. verify no mock/fake/random production data was introduced;


9. verify no authorization boundary was weakened;


10. verify tenant isolation;


11. verify localization;


12. verify light/dark themes;


13. verify no accidental architecture changes;


14. verify all Task 12.0 requirements are implemented.




---

36. DEFINITION OF DONE

Task 12.0 is complete only when all of the following are demonstrated with repository evidence:

[ ] Free SEO tools are implemented using verified existing capabilities.

[ ] Free AI visibility tools are implemented using verified existing capabilities.

[ ] Limited audits are implemented using verified existing audit capabilities.

[ ] Usage limits are server-enforced.

[ ] Anonymous-user behavior is implemented according to the actual authentication architecture.

[ ] Account requirements are server-enforced.

[ ] Result previews are implemented using real production results.

[ ] Upgrade triggers are implemented at real product boundaries.

[ ] The complete free-to-upgrade journey is coherent.

[ ] Existing authentication remains intact.

[ ] Existing authorization remains intact.

[ ] Existing tenant isolation remains intact.

[ ] Existing RLS remains intact.

[ ] Existing async processing remains intact.

[ ] Existing caching/deduplication mechanisms are reused where applicable.

[ ] Cost-abuse vectors are controlled.

[ ] Existing analytics infrastructure is reused.

[ ] /fa and /en remain functional.

[ ] RTL/LTR behavior remains functional.

[ ] Light/dark themes remain functional.

[ ] Relevant security tests pass.

[ ] Relevant functional tests pass.

[ ] Relevant regression tests pass.

[ ] Required validation commands actually run.

[ ] Final diff has been reviewed.

[ ] No unrelated changes were introduced.

[ ] No production mock/fake/demo/fallback data was introduced.

[ ] No guessed database/API/repository/service architecture was introduced.

[ ] No Task 12.0 requirement has been deferred into another task.


If any required item cannot be demonstrated from repository evidence:

Do not claim completion.

Use:

> BLOCKED — INSUFFICIENT EVIDENCE




---

37. REQUIRED FINAL REPORT

Provide one consolidated report.

A. Scope

Confirm Task 12.0 was executed as one complete task.

Confirm no Task 12.0 requirement was deferred.


B. Free SEO

Existing capability used.

Actual implementation path.

Free limitations.

Result behavior.


C. Free AI Visibility

Existing capability used.

Actual implementation path.

Free limitations.

Result behavior.


D. Limited Audits

Existing audit capability used.

Free audit boundaries.

Preview behavior.


E. Usage Control

Existing mechanism used.

Source of truth.

Server-side enforcement.

Abuse protection.


F. Account Requirement

Anonymous behavior.

Authentication boundary.

Server-side enforcement.


G. Result Preview

Actual data source.

Preview boundary.

Restricted data behavior.


H. Upgrade Triggers

Exact verified trigger conditions.

Existing destination used.


I. Security

Authentication.

Authorization.

Tenant isolation.

RLS.

SSRF protections where applicable.

Fail-closed behavior.


J. Cost Control

Rate limiting.

Caching.

Deduplication.

Async processing.

External-resource protection.


K. Analytics

Events implemented.

Existing analytics mechanism used.


L. Localization / UI

/fa

/en

RTL/LTR

light/dark

responsive/accessibility verification.


M. Database

If database changes were made, report:

previous data source,

new data source,

canonical table,

canonical repository/query,

tenant boundary,

authorization behavior,

error behavior,

migration executed,

validation performed.


Never include connection strings or secrets.

If no database change was required, explicitly state that no database change was made.

N. Files

List every modified file and the reason for the modification.

O. Validation

Report:

exact commands actually executed,

exit status,

test results,

build/lint/typecheck results where applicable.


Never claim a validation step was executed if it was not.

P. Remaining Limitations

Report only verified limitations.

Do not hide missing implementation behind:

mocks,

placeholders,

fabricated data,

fallback data,

assumptions.


Q. Blocking Condition

If blocked, report:

exact file/path,

missing dependency,

evidence searched,

why implementation requires guessing,

evidence required to unblock.


Do not work around the blocker by inventing architecture.


---

PRIME DIRECTIVE

> Repository evidence is authoritative.

Approved documentation is supporting evidence.

AGENTS.md defines mandatory engineering constraints.

Task 12.0 defines the product scope.

Assumptions are not evidence.

When evidence is missing: STOP — do not guess, do not fabricate, do not create a mock to hide the gap.

When another task is discovered: report it; do not silently expand scope.

Task 12.0 must nevertheless be completed as one complete task; do not defer any of its seven defined requirements into another task.
