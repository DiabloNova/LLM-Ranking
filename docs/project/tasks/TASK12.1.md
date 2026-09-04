PHASE 12 — MONETIZATION & CONVERSION

Task 12.1 — Premium Tool Strategy

Mission

Implement the complete Premium Tool Strategy for Seorchable as one single, self-contained, non-divisible engineering task.

This task defines and implements the premium access layer for the product's advanced capabilities:

Premium Dashboards

Advanced Reports

Monitoring

Historical Data

AI Intelligence

Competitor Intelligence

Automated Recommendations


Do not split this task into additional Task 12.x tasks.

Internal implementation steps are allowed, but all seven requirements above belong to this single Task 12.1.

The objective is:

> Free capability → Demonstrate value → Premium capability → Upgrade → Retain



This task must build on verified existing product capabilities and the monetization infrastructure established by the repository. It must not invent missing product, billing, entitlement, persistence, or intelligence architecture.


---

1. STRATEGIC CONTEXT

Task 12.1 follows Task 12.0 — Free Tool Strategy.

The intended product progression is:

Free Tools
    ↓
Limited Value
    ↓
Upgrade Trigger
    ↓
Premium Tools
    ↓
Deeper Intelligence
    ↓
Continuous Monitoring
    ↓
Historical Insights
    ↓
Recommendations
    ↓
Retention

Premium functionality must therefore provide meaningful additional depth, not merely hide arbitrary UI elements behind a paywall.

Premium access must be based on the repository's actual:

plans,

entitlements,

subscriptions,

usage limits,

workspace/account state,

authorization mechanisms,


where those mechanisms already exist.


---

2. ABSOLUTE EVIDENCE-FIRST RULE

The repository implementation is the primary source of truth.

Before modifying anything, inspect:

actual premium capabilities,

existing dashboards,

existing reports,

monitoring implementation,

historical data implementation,

AI intelligence services,

competitor intelligence services,

recommendation/action engines,

pricing/plans,

entitlements,

billing,

usage tracking,

authentication,

authorization,

tenant/workspace boundaries,

repositories,

database schema,

APIs/server actions,

existing tests.


Do not assume that a capability exists because it appears in:

documentation,

roadmap,

old task descriptions,

UI mockups,

comments,

audit reports.


When documentation conflicts with implementation:

> Trust the current implementation.




---

3. NO-GUESSING / NO-FABRICATION

Never invent:

premium features,

plan names,

prices,

entitlements,

quotas,

repositories,

services,

APIs,

database tables,

columns,

migrations,

historical-data models,

monitoring infrastructure,

recommendation engines,

AI capabilities,

competitor data,

customer data,

report data,

dashboard metrics.


If the required architecture cannot be verified:

> BLOCKED — INSUFFICIENT EVIDENCE



Do not create a mock or simulated implementation to make the task appear complete.


---

4. TASK SCOPE — NON-DIVISIBLE

The following seven requirements are all part of Task 12.1:

1. Premium Dashboards


2. Advanced Reports


3. Monitoring


4. Historical Data


5. AI Intelligence


6. Competitor Intelligence


7. Automated Recommendations



Do not create:

Task 12.1 Dashboard
Task 12.2 Reports
Task 12.3 Monitoring
...

All seven must be addressed within this task.

Internal implementation ordering is permitted.


---

5. CRITICAL MONETIZATION BOUNDARY

Task 12.0 established the Free Tool Strategy.

Task 12.1 may connect premium UX to existing monetization infrastructure.

It must not invent monetization infrastructure.

Before implementing premium access, identify the canonical source of truth for:

plan,

subscription,

entitlement,

usage,

quota,

account/workspace status.


If the repository already contains this infrastructure:

> Reuse it.



If it does not exist:

> Do not create a guessed replacement merely to complete the task.



Report:

BLOCKED — INSUFFICIENT EVIDENCE

with the exact missing architecture.


---

6. PREMIUM ACCESS CONTROL

Premium access must be enforced server-side.

The client UI must never be the authorization source of truth.

Incorrect:

if (userCanSeePremium) {
  showPremiumData()
}

when the server does not independently enforce access.

Correct:

Client
  ↓
Server Action / API
  ↓
Authentication
  ↓
Authorization / Entitlement
  ↓
Tenant Boundary
  ↓
Premium Service
  ↓
Verified Data

A user must not gain premium access by:

modifying client state,

changing URL parameters,

manipulating JavaScript,

calling a server endpoint directly without authorization,

changing workspace identifiers.



---

7. TENANT ISOLATION

Premium functionality must preserve tenant/workspace isolation.

Verify:

tenant identification,

workspace context,

repository scoping,

authorization,

PostgreSQL RLS where applicable.


Never trust client-provided tenant identifiers.

Never bypass repository/RLS boundaries to simplify premium access.

If tenant isolation cannot be demonstrated:

> BLOCKED — INSUFFICIENT EVIDENCE




---

8. PREMIUM DASHBOARDS

Implement premium dashboard access using existing verified dashboard and intelligence capabilities.

Premium dashboards may expose deeper information such as:

expanded metrics,

deeper analysis,

cross-feature intelligence,

additional visualizations,

advanced breakdowns,

historical trends,


only where the underlying data actually exists.

Do not fabricate metrics to populate dashboard cards.

Do not create:

Math.random()
mockData
demoData
fakeData
fallbackData

as production dashboard data.

Example — Correct

If the repository already stores historical AI visibility measurements, a premium dashboard may expose verified trend analysis over those measurements.

Example — Incorrect

If historical measurements do not exist, create fake historical points to make a chart look complete.


---

9. ADVANCED REPORTS

Inspect the existing reporting infrastructure.

Reuse:

existing report generators,

existing audit results,

existing intelligence outputs,

existing export mechanisms,

existing repositories.


Premium reports may provide additional verified depth over the free result.

Potential differences may include:

Free
↓
Summary / Preview

Premium
↓
Full Findings
↓
Detailed Analysis
↓
Historical Context
↓
Recommendations

Only implement differences supported by actual data and service contracts.

Do not invent report fields or API contracts.


---

10. MONITORING

Inspect the existing Monitoring & Automation implementation.

Determine whether the repository already supports:

monitored entities,

schedules,

snapshots,

change detection,

alerts,

monitoring jobs,

historical observations,

monitoring repositories,

asynchronous processing.


If monitoring exists:

> Integrate premium access with the existing architecture.



If monitoring does not exist:

> Do not invent a monitoring subsystem solely for Task 12.1.



Do not create speculative:

cron systems,

queues,

workers,

monitoring tables,

scheduler infrastructure,

notification systems.


If required infrastructure is absent:

> BLOCKED — INSUFFICIENT EVIDENCE




---

11. HISTORICAL DATA

Historical data must come from real persisted application data.

Before implementing historical views, verify:

1. canonical table,


2. relevant columns,


3. existing repository/query,


4. repository behavior,


5. tenant boundary,


6. authorization boundary,


7. expected error behavior.



If any of these cannot be established:

> BLOCKED — INSUFFICIENT EVIDENCE



Do not create:

fake historical points,

in-memory history,

random timestamps,

demo snapshots,

fallback history.


A legitimate empty history must remain distinguishable from an infrastructure failure.


---

12. AI INTELLIGENCE

Inspect the actual AI Intelligence implementation.

Identify existing verified capabilities such as:

AI visibility analysis,

AI-generated insights,

brand intelligence,

AI citation intelligence,

AI-related diagnostics,

AI result analysis.


Premium UI may expose deeper existing intelligence.

It must not create a second AI intelligence engine.

Do not:

invent a model,

invent model outputs,

create fake AI results,

introduce a new external AI provider,

expose private model credentials.


If an AI capability is incomplete or absent:

> BLOCKED — INSUFFICIENT EVIDENCE



Do not simulate it.


---

13. COMPETITOR INTELLIGENCE

Inspect the existing Competitive Intelligence implementation.

Premium functionality may expose verified:

competitor comparisons,

competitor visibility,

competitive gaps,

competitive trends,

competitor reports,


only where the underlying implementation and data exist.

Do not invent:

competitor data,

competitor metrics,

competitor identities,

competitor reports,

benchmark numbers.


Example — Correct

If the repository already contains a competitor intelligence service and repository, reuse them through the existing access boundary.

Example — Incorrect

Generate competitor metrics from static sample values because the premium dashboard requires a comparison chart.


---

14. AUTOMATED RECOMMENDATIONS

Inspect the existing Diagnostic & Action Engine / recommendation infrastructure.

If verified recommendation functionality exists:

expose it through premium experiences,

preserve its existing service contracts,

enforce access server-side.


If it does not exist:

> Do not invent a new recommendation engine merely to satisfy this task.



Do not create arbitrary recommendations such as:

"Improve your SEO score by adding 10 keywords."

unless the repository's actual intelligence engine produces such recommendations.

Automated recommendations must be:

derived from actual analysis,

traceable to real findings,

tenant-safe,

authorization-safe,

distinguishable from generic static advice.



---

15. FREE → PREMIUM BOUNDARY

Task 12.0 established the Free Tool Strategy.

Task 12.1 must establish the premium boundary consistently.

The boundary should be based on actual product value, not arbitrary UI hiding.

Example:

Free
├── Basic audit
├── Limited findings
└── Result preview

Premium
├── Full audit
├── Advanced findings
├── Historical analysis
├── Monitoring
├── Competitor intelligence
└── Automated recommendations

This is an architectural example only.

The actual boundary must be determined from repository evidence.

Do not assume these exact entitlements exist.


---

16. UPGRADE EXPERIENCE

When a user attempts to access a premium capability without entitlement:

preserve authentication behavior,

preserve authorization,

show an appropriate upgrade path,

use the existing pricing route,

do not leak premium data before authorization.


The upgrade CTA may direct the user to the existing /pricing route if that route is verified by the repository.

Do not invent another billing route.


---

17. ACCOUNT REQUIREMENT

Inspect existing authentication and account architecture.

Determine which premium capabilities require:

anonymous access,

authenticated account,

workspace membership,

paid entitlement.


Do not invent account requirements.

Enforce protected access server-side.


---

18. API / SERVER ACTIONS

Do not create an API merely because premium functionality exists.

First inspect:

existing Server Actions,

existing API routes,

service layer,

repository layer,

existing contracts.


Reuse the established architecture.

A Server Action is acceptable where it matches the existing application architecture.

A REST endpoint is acceptable where the existing architecture requires it.

Do not create duplicate interfaces.

Before changing an API contract, inspect:

implementation,

consumers,

validation,

authentication,

authorization,

tests.



---

19. DATABASE RULES

Database-backed premium functionality must follow AGENTS.md.

Before changing database-backed code, identify:

1. canonical table,


2. relevant columns,


3. existing repository/query,


4. repository behavior,


5. tenant boundary,


6. authorization boundary,


7. expected error behavior.



If any is unknown:

> BLOCKED — INSUFFICIENT EVIDENCE



Do not create guessed:

tables,

columns,

repositories,

migrations,

relations,

RLS policies.


Task 12.1 does not authorize speculative database architecture.


---

20. ASYNC PROCESSING

Premium functionality involving long-running workloads must reuse the repository's existing asynchronous architecture.

Examples:

monitoring,

large reports,

historical aggregation,

expensive AI analysis.


Do not introduce a new queue/worker architecture unless explicitly required and supported by repository evidence.

Do not turn an asynchronous workload into a blocking request merely for convenience.


---

21. CACHING AND COST CONTROL

Inspect existing caching/deduplication mechanisms before adding expensive premium operations.

Reuse existing:

cache,

deduplication,

result persistence,

job state,

invalidation mechanisms.


Do not introduce speculative caching architecture.

Premium access must not become a reason to bypass existing cost controls.


---

22. SECURITY

Preserve:

authentication,

authorization,

tenant isolation,

RLS,

CSRF protections where applicable,

input validation,

SSRF protections,

secret handling.


Never expose:

API keys,

database credentials,

private tokens,

privileged service credentials.


Client-side state must never determine premium authorization.


---

23. LOCALIZATION

Premium experiences must preserve:

/fa,

/en,

Persian RTL,

English LTR.


Do not hard-code user-facing strings where the existing localization system should be used.

Do not implement premium functionality in only one locale.


---

24. THEMES AND UI

Preserve:

light theme,

dark theme,

existing design system,

typography,

spacing,

semantic colors,

responsive behavior.


Reuse existing dashboard/report components where appropriate.

Do not redesign unrelated product areas.


---

25. ACCESSIBILITY

Verify:

keyboard navigation,

focus states,

semantic structure,

accessible controls,

chart/data accessibility where applicable,

meaningful loading/error states.


Do not introduce inaccessible premium-only UI.


---

26. ERROR SEMANTICS

Premium failures must fail closed.

Do not convert:

database errors,

authorization failures,

tenant failures,

required service failures


into:

empty premium data,

mock data,

demo data,

fabricated success.


Distinguish legitimate empty results from infrastructure failures wherever the existing architecture supports that distinction.


---

27. NO IN-MEMORY PRODUCTION QUOTAS

Do not implement premium entitlements or usage limits using:

in-memory Maps,

process-local counters,

simulated quota,

temporary state,

fake persistence.


Example of forbidden behavior:

Map<userId, usage>

used as the production source of truth for premium access.

If the repository does not contain a canonical persistence-backed entitlement/usage mechanism:

> BLOCKED — INSUFFICIENT EVIDENCE



Do not simulate it.


---

28. DEPENDENCIES

Before adding dependencies:

1. inspect package.json;


2. inspect existing utilities;


3. inspect existing libraries;


4. determine whether the requirement can be fulfilled with current architecture.



Do not add:

billing SDKs,

analytics providers,

AI providers,

monitoring systems,

CMS,

database libraries,


unless explicitly required and supported by the task/repository architecture.


---

29. CHANGE SCOPE

Modify only files required for Task 12.1.

Potential areas include:

premium feature routes,

dashboard components,

report components,

existing services,

existing repositories,

existing entitlement/plan integration,

localization files,

tests.


These are potential locations, not blanket permission.

If an unrelated file must be modified:

> STOP and report the dependency.



Do not expand scope silently.


---

30. EXPLICITLY OUT OF SCOPE

Do not implement:

a new billing provider,

a new payment gateway,

a new subscription system,

speculative entitlement architecture,

speculative database schema,

a new monitoring platform,

a new AI provider,

a new competitor intelligence engine,

a new recommendation engine,

a new authentication system,

a new tenant architecture,

unrelated dashboard redesign,

framework upgrades,

dependency migrations,

deployment infrastructure.


The task is to connect premium product experiences to verified existing capabilities and monetization boundaries, not rebuild the product.


---

31. EXAMPLES OF CORRECT / INCORRECT BEHAVIOR

Example A — Existing entitlement

Correct:

Existing Plan
    ↓
Existing Entitlement Check
    ↓
Server-side Authorization
    ↓
Premium Service
    ↓
Premium Result

Incorrect:

Client receives "premium=true"
    ↓
Display premium result


---

Example B — Missing entitlement infrastructure

Correct:

Report:

BLOCKED — INSUFFICIENT EVIDENCE

because no canonical entitlement source can be established.

Incorrect:

Create:

const premiumUsers = new Set(...)

and use it as production authorization.


---

Example C — Historical data

Correct:

Use the verified historical repository and persisted snapshots.

Incorrect:

Generate historical points with random values or timestamps.


---

Example D — Monitoring

Correct:

Reuse the existing monitoring job/snapshot architecture.

Incorrect:

Create a new cron/queue system solely because Premium Monitoring is required.


---

Example E — AI Intelligence

Correct:

Expose deeper output from an existing verified AI intelligence engine.

Incorrect:

Create fake AI responses to populate a premium dashboard.


---

Example F — Recommendations

Correct:

Display recommendations produced by the existing diagnostic/action engine.

Incorrect:

Add static generic recommendations and label them “AI recommendations” without an existing engine producing them.


---

32. TESTING AND VALIDATION

Inspect package.json before running validation.

Use the repository's actual scripts.

Validate where applicable:

Authorization

unauthorized users cannot access premium data;

authenticated free users cannot bypass premium checks;

entitled users can access entitled functionality.


Tenant Isolation

tenant A cannot access tenant B's premium data;

workspace switching cannot bypass entitlement checks.


Data

premium results originate from real data;

no production mocks;

no fabricated fallback data.


Dashboards

premium metrics render correctly;

empty states are distinguishable from failures;

loading/error states work.


Reports

correct authorization;

correct report data;

export behavior remains secure.


Monitoring

existing monitoring architecture remains intact;

premium access does not bypass job/security boundaries.


Historical Data

correct tenant scope;

correct time range;

persisted data only.


AI Intelligence

existing service contracts remain intact;

failures fail closed.


Competitor Intelligence

competitor data remains properly scoped;

no fabricated metrics.


Recommendations

recommendations originate from verified intelligence;

no fabricated recommendations.


UI

/fa,

/en,

RTL,

LTR,

light,

dark,

responsive,

accessibility.


Do not claim a validation step passed unless it was actually executed.


---

33. FINAL DIFF REVIEW

Before completion:

1. inspect the complete diff;


2. inspect every modified file;


3. remove unrelated changes;


4. remove debug code;


5. remove temporary files;


6. remove unused imports;


7. verify no secrets;


8. verify no mock production data;


9. verify no in-memory production authorization/quota;


10. verify no fabricated premium data;


11. verify no fabricated recommendations;


12. verify authentication;


13. verify authorization;


14. verify tenant isolation;


15. verify API compatibility;


16. verify localization;


17. verify themes;


18. verify accessibility;


19. verify no speculative database changes.




---

34. DEFINITION OF DONE

Task 12.1 is complete only when all seven requirements have been addressed:

[ ] Premium Dashboards

[ ] Advanced Reports

[ ] Monitoring

[ ] Historical Data

[ ] AI Intelligence

[ ] Competitor Intelligence

[ ] Automated Recommendations


And:

[ ] Premium access is enforced server-side.

[ ] Existing authentication is preserved.

[ ] Existing authorization is preserved.

[ ] Tenant isolation is preserved.

[ ] Existing monetization/entitlement infrastructure is reused where available.

[ ] No in-memory production quota/entitlement simulation exists.

[ ] No fabricated premium data exists.

[ ] No fabricated AI output exists.

[ ] No fabricated competitor data exists.

[ ] No fabricated recommendations exist.

[ ] Existing APIs/contracts remain compatible.

[ ] Existing database architecture remains intact.

[ ] No speculative migrations were introduced.

[ ] Long-running work uses existing async architecture.

[ ] Existing caching/cost-control mechanisms are respected.

[ ] /fa works.

[ ] /en works.

[ ] RTL works.

[ ] LTR works.

[ ] Light theme works.

[ ] Dark theme works.

[ ] Relevant tests/checks actually ran.

[ ] Final diff was reviewed.

[ ] No unrelated refactoring exists.

[ ] No requirement was deferred to another task.


If any required premium capability depends on architecture that cannot be verified:

> BLOCKED — INSUFFICIENT EVIDENCE



Do not hide the missing architecture with mocks, in-memory state, fabricated data, or assumptions.


---

35. REQUIRED FINAL REPORT

Provide one consolidated report.

A. Scope

Confirm:

Task 12.1 was executed as one task.

All seven requirements were addressed.

No requirement was deferred to another Task.


B. Premium Capabilities

Report implementation status for:

Premium Dashboards

Advanced Reports

Monitoring

Historical Data

AI Intelligence

Competitor Intelligence

Automated Recommendations


C. Monetization / Entitlements

Report:

canonical plan source,

canonical entitlement source,

usage/quota source,

authorization mechanism,

upgrade behavior.


If no canonical source exists, report the blocker instead of creating a replacement.

D. Data Sources

For every database-backed premium capability report:

data source,

canonical repository,

canonical table,

tenant boundary,

authorization,

error behavior.


Never include credentials or connection strings.

E. Security

Report:

authentication,

authorization,

tenant isolation,

RLS,

server-side enforcement,

secret-safety verification.


F. API / Server Actions

Report:

existing interfaces reused,

new interfaces, if any,

why they were required,

consumers,

validation,

authorization.


G. Async / Monitoring

Report:

existing job architecture reused,

monitoring behavior,

historical persistence,

caching/deduplication where applicable.


H. Localization / UI

Report:

/fa,

/en,

RTL,

LTR,

light,

dark,

responsive,

accessibility.


I. Files

List every modified file and why it was modified.

J. Validation

Report:

exact commands,

exit status,

tests,

typecheck,

lint,

build,

E2E where applicable.


Never claim validation that was not actually executed.

K. Final Diff

Confirm:

unrelated changes removed,

debug code removed,

temporary files removed,

secrets absent,

no speculative architecture,

no mock production implementation.


L. Remaining Limitations

Report only verified limitations.

M. Blocking Condition

If blocked, report:

exact file/path,

missing dependency,

evidence searched,

why implementation would require guessing,

exact evidence required to unblock.



---

PRIME DIRECTIVE

> Repository implementation is authoritative.

AGENTS.md is mandatory.

Approved documentation is supporting evidence.

Task 12.1 defines one complete, non-divisible scope.

Premium authorization must be server-side.

Client state is never authorization truth.

Tenant isolation must never be inferred or bypassed.

Existing monetization, entitlement, usage, monitoring, intelligence, and data architecture must be reused where verified.

Do not create in-memory production quotas or simulated entitlements.

Do not invent premium data, AI results, competitor metrics, historical data, or recommendations.

Do not create database infrastructure, APIs, repositories, services, migrations, queues, or external providers merely to hide missing evidence.

When evidence is missing: STOP — BLOCKED — INSUFFICIENT EVIDENCE.

When another task is discovered: report it; do not silently expand scope.

All seven requirements belong to Task 12.1 and must be addressed within this single task.

The objective is: Free Value → Demonstrated Value → Premium Depth → Upgrade → Continuous Intelligence → Retention.
