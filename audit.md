# Seorchable Repository Forensic Audit

Audit basis: read-only inspection of the supplied ZIP, current repository contents, source, configuration, migrations, tests, docs, logs, and route tree. Existing docs were treated as leads only and checked against code. No repository files were modified. Dependency-backed build/test commands were not executed because the archive contains no `node_modules` and this environment has no internet access for installation.

## 1. EXECUTIVE SUMMARY

**Verdict: NOT READY for production.** This is a large Next.js SaaS-shaped codebase with substantial domain modeling, UI surface area, AI/crawl feature scaffolding, PostgreSQL/RLS intent, and many unit-style tests. It is not yet a reliable commercial product because the repository contains contradictory generations of architecture, two migration systems, tracked runtime artifacts and a tracked `.env`, incomplete auth flows, unauthenticated/weakly authenticated expensive endpoints, production mock fallbacks, and UI paths that present simulated or hardcoded intelligence as real product output.

The most serious issue is security and data integrity, not polish. Premium/engine routes accept caller-controlled identity headers or defaults, some public routes invoke expensive external work without consistent quota/rate/SSRF controls, and database failure paths can degrade into mock or in-memory success. Authentication is internally inconsistent: the current `auth.ts` passes passwords and uses scrypt helpers, but system context still does not expose a database client to callers, registration sends non-persisted verification tokens, and password-reset tokens are explicitly non-functional. A tracked `.env` exists in the archive; its values are redacted here, but any real credentials must be considered exposed and rotated.

The repository has meaningful foundations: server-signed HTTP-only sessions, explicit tenant context with `SET LOCAL app.current_tenant_id`, a dedicated SSRF guard in acquisition, Zod validation in several endpoints, RLS-oriented migrations, feature separation under `src/features`, and broad test names covering acquisition, admin, AI intelligence, monitoring, billing, auth, and services. Those foundations are undermined by bypass paths and stale code. The correct strategy is not a rewrite. Establish one canonical runtime/data architecture, close security/data-integrity blockers, remove production fakes, then make each core product workflow truthful and verifiable.

Release recommendation: freeze feature expansion; execute the P0/P1 prompts first; require the final gate in section 10. Do not call this ready because TypeScript or a subset of tests passes.

## 2. REPOSITORY MAP

```text
seorchable-main/
â”œâ”€â”€ src/app/[locale]/             Next App Router public, auth, dashboard, docs, pricing, SEO routes
â”œâ”€â”€ src/app/actions/              Server actions for auth, audits, prompts, workspace, intelligence
â”œâ”€â”€ src/app/api/                  Inngest, v1 APIs, crawl/audit/analytics, payment webhook
â”œâ”€â”€ src/components/               App shell, marketing, feature panels, graphs, SEO JSON-LD
â”œâ”€â”€ src/core/                     cache, config, DI container, database tenant context/UoW, events
â”œâ”€â”€ src/features/
â”‚   â”œâ”€â”€ acquisition/              crawl domain, providers, SSRF, repositories
â”‚   â”œâ”€â”€ admin/                    admin domain, persistence, security, CQRS
â”‚   â”œâ”€â”€ ai-intelligence/          AI domain/services/repositories/security
â”‚   â”œâ”€â”€ billing/                  subscription/billing domain
â”‚   â”œâ”€â”€ monitoring/               website and AI visibility monitoring
â”‚   â”œâ”€â”€ public-api/               API middleware and public API surface
â”‚   â””â”€â”€ recommendations/          recommendation domain/application
â”œâ”€â”€ src/services/                 auth, crawler, AI, audits, jobs, RAG, observability, dashboards
â”œâ”€â”€ src/inngest/                  background functions and client
â”œâ”€â”€ database/schema/              Drizzle TypeScript schema, 32 files including admin
â”œâ”€â”€ database/migrations/          raw SQL migration chain 0001 to 0019
â”œâ”€â”€ database/drizzle/             second Drizzle-generated migration chain 0000 to 0004
â”œâ”€â”€ tests/                        75 test files across features/services/API/integration
â”œâ”€â”€ docs/                         architecture, security, product, audits, roadmaps, task logs
â”œâ”€â”€ scripts/                      crawl worker, migration guard, docs generation, domain test
â”œâ”€â”€ public/                       fonts, logos, icons, sample PDF/placeholders
â”œâ”€â”€ .circleci/config.yml          CI build/evals, no evident production deploy implementation
â”œâ”€â”€ package.json                  Next 16, React 19, Drizzle, pg, Firecrawl, Inngest, AI SDK
â”œâ”€â”€ package-lock.json + pnpm-lock.yaml  two lockfiles / package-manager ambiguity
â”œâ”€â”€ .env + .env.example           runtime env file is included in the archive
â””â”€â”€ source artifacts              .orig, .rej, temp schema, patch files, server logs, reports
```

### Actual architecture and request/data flow

- **Frontend:** locale-first App Router pages, a dashboard route family, many client components, a duplicated `components/` root area plus `src/components/`, and a client-heavy homepage. `src/proxy.ts` only redirects `/` to `/fa`; it is not an auth boundary.
- **Auth:** server actions call `TenantContextManager.runWithSystemContext`; sessions are signed HMAC payloads in an HTTP-only cookie and include user/workspace claims. Convenience tenant/user cookies are non-authoritative. Client `AuthProvider` and `ProtectedRoute` still participate in UX gating.
- **Authorization:** `services/auth/authorization.ts` checks membership in system context and has role hierarchy, but `authorizeApiRequest` accepts plain `x-user-id`/`x-tenant-id` headers as a developer API fallback. Several routes do not use the helper.
- **Tenant isolation:** `runWithTenantContext` leases a PostgreSQL client, begins a transaction, sets `app.current_tenant_id` locally, and releases it. The boundary is good in concept but not universal. RLS is represented in migrations and tenant table lists, not proven across every route/schema/table.
- **Persistence:** PostgreSQL via a singleton `PostgresClient`, repositories, and direct SQL in some application paths. Some repositories have in-memory fallback maps or mock pool behavior. `scripts/crawl-worker.ts` creates a separate ad-hoc pool.
- **Jobs:** Inngest route/functions plus a crawl worker script exist, but the free/premium audit paths visibly do synchronous provider work and are not consistently queued/idempotent.
- **External boundaries:** Firecrawl, Google Generative AI, Resend, Upstash Redis, payment webhook, Inngest. Resilience, rate controls, and failure semantics differ by endpoint.
- **SEO:** `src/app/robots.ts` and `sitemap.ts` exist, but prior repository logs/audit evidence report invalid endpoint behavior; this needs runtime verification after build.

## 3. CURRENT PRODUCT STATUS

| Capability | Status | Evidence |
|---|---|---|
| Public discovery / landing | PARTIAL | Locale landing pages and marketing components exist; homepage is a large client component with mock/illustrative dashboard content and duplicated implementations. |
| Registration | BROKEN / PRODUCTION RISK | `src/app/actions/auth.ts` provisions user/org, but system context callers require a DB client that `runWithSystemContext` does not place in context in the current implementation. |
| Login | BROKEN / PRODUCTION RISK | Same system-context client gap; signed session implementation exists but cannot be reached reliably if DB lookup fails. |
| Email verification | MISSING | Registration creates a random token but does not persist it; the consumer cannot validate it. |
| Password reset | MISSING | Reset action creates a non-persisted token and no consuming reset flow is present. |
| Server-side route protection | PARTIAL | `ProtectedRoute` is client-side; `src/proxy.ts` only handles `/`; dashboard server layout must be the security boundary. |
| Workspace/tenant management | PARTIAL | Workspace actions and membership tables exist; session-selected workspace is not consistently authoritative across UI/routes. |
| Core free audit | MOCKED / ABUSEABLE | `/api/v1/audit/free` directly calls Firecrawl when configured and has a rich offline simulation fallback; no consistent IP/domain quota, queue, or SSRF guard is evident. |
| Premium audit | SECURITY RISK / PRODUCTION BLOCKER | Existing audit evidence identifies caller-controlled tenant/user headers/default identity and missing membership/subscription enforcement. |
| Audit persistence | PRODUCTION RISK | Database failure paths and repository fallback maps can return success without durable writes. |
| AI visibility | PARTIAL / MIXED | Domain, services, schemas, prompts and tests exist; multiple routes/services generate hardcoded or random metrics/data. |
| Prompt/model tracking | PARTIAL | Prompt intelligence schemas/actions/pages exist; end-to-end provider execution, persistence, retry, and scheduled monitoring require proof. |
| Citations/sources | PARTIAL / MOCKED | Citation schema/service exists; action contains â€œmock baseline sourcesâ€ and â€œmock occurrencesâ€ paths. |
| Competitor intelligence | PARTIAL / MOCKED | Feature and UI exist; competitive route has deterministic mock fallback/hardcoded response evidence. |
| Crawling | PARTIAL | Acquisition feature has a real HTTP provider, Firecrawl provider, SSRF guard, state machine and repositories; UI/API paths bypass parts of the pipeline. |
| Monitoring and alerts | PARTIAL | Monitoring schema/services/tests exist; production scheduling, delivery, retries, and user-visible alert configuration are not proven. |
| Billing | PARTIAL / PRODUCTION RISK | Billing pages/schema/tests/webhook exist; no evidence of complete provider lifecycle, entitlements, invoice correctness, failed-payment handling, or verified subscription gate on expensive routes. |
| Documentation/help | PARTIAL | Docs routes and generated docs data exist; route/slug duplication and static-only content are reported. |
| SEO | PARTIAL / UNVERIFIED | Metadata, `robots.ts`, `sitemap.ts`, JSON-LD exist; repository audit/log evidence reports invalid robots/sitemap runtime output and needs a real deployment smoke test. |
| GEO/AEO | PARTIAL | AEO content, entity graph, citation, prompt, and visibility surfaces exist; genuine measurement vs UI representation is mixed. |
| RTL/Persian/English | PARTIAL | Locale routes, Persian fonts, RTL checks and bilingual copy exist; hydration/locale redirect/accessibility inconsistencies are documented. |
| Mobile/responsive UX | PARTIAL | Responsive Tailwind layouts exist; dense dashboards, graph/canvas fallback, focus, labels, and async states have documented gaps. |
| Accessibility | NOT READY | Homepage audit identifies missing persistent labels, hover-only tooltips, canvas fallback, tab ARIA, icon labels, and landmark/heading issues. |
| Tests | PARTIAL | 75 test files cover many domains; no clear browser E2E, real DB/RLS integration gate, full auth flow, migration convergence, or production smoke suite. |
| CI/CD | PARTIAL / PRODUCTION RISK | CircleCI build/evals exists, but deploy command is a placeholder and CI does not show lint/test/migration/security/route smoke gates. |
| Observability | PARTIAL | `src/services/observability` and logs exist; no demonstrated end-to-end error reporting, metrics, alerts, health/readiness or cost telemetry gate. |

## 4. CRITICAL FINDINGS

### P0 / critical

**P0-01: Authentication dependency is internally broken.** `runWithSystemContext()` creates a system context without `dbClient`, while `auth.ts` and authorization immediately call `getDbClient()` and fail if null. Impact: login, registration, password reset lookup, membership and role checks can fail closed or make the product unusable. Fix with request-scoped system DB leasing and restricted system-role policy, then integration-test every auth path.

**P0-02: Premium and engine authorization bypass risk.** `src/app/api/v1/audit/premium/route.ts` and `src/app/api/v1/audit/engine/route.ts` are identified by repository evidence as trusting `x-tenant-id`/`x-user-id` and/or default identities without verified session/API credential, membership, role, subscription, and quota. Impact: cross-tenant writes, unauthenticated expensive crawling/LLM usage, and privilege escalation. Remove defaults and require one authoritative credential path.

**P0-03: Production database failure can become fake success.** `PostgresClient` and intelligence repositories contain mock/in-memory fallback behavior, and premium audit persistence errors have been reported as swallowed while returning success. Impact: false audit results, lost paid work, and invisible outages. Production must fail closed; mocks only under explicit development/test configuration.

**P0-04: Canonical database state is undefined.** `database/schema`, `database/migrations`, and `database/drizzle` represent competing sources/outputs. Existing audit evidence identifies missing schema tables from raw migrations and type/nullability/constraint drift. Impact: clean environments and production can converge to different schemas; deploys can fail or silently omit tables/policies.

**P0-05: Tracked `.env` is present.** The archive includes `.env` with database/external-service variable names and values redacted from this report. If these are real credentials, rotate them immediately, remove the file from repository history, and audit provider access. Never copy values into Jules prompts.

### P1 / production blockers

**P1-01: Unauthenticated expensive endpoints and inconsistent SSRF protection.** Free/premium audit routes call providers directly, use URL validation that is not a complete SSRF policy, and bypass the robust acquisition guard. Add centralized HTTP(S), DNS/IP, redirect, domain policy, rate, quota, timeout and budget controls.

**P1-02: Auth recovery is not implemented.** Verification/reset tokens are generated but not persisted or consumable. Do not represent these flows as working.

**P1-03: Synchronous crawl path is not production-safe.** Deep Firecrawl work can exceed serverless request limits. Queue jobs, return 202/job status, make processing idempotent, and provide retry/failure state.

**P1-04: Tenant boundary is not universal.** A secure tenant context exists, but route/service bypasses, system-mode queries, caller headers, direct SQL, fallback repositories, and a second worker pool create inconsistent isolation guarantees. Prove every tenant-scoped repository and route with cross-tenant regression tests.

**P1-05: CI and deployment gates are insufficient.** CircleCI runs build/evals, but no clear lint, full test, migration replay, RLS integration, dependency audit, route smoke, secret scan, health/readiness or deploy verification gate exists; deploy step is example text.

**P1-06: SEO runtime correctness is unverified and prior evidence reports failure.** `robots.ts`/`sitemap.ts` exist, but the repository audit reports they returned the landing page. Verify built runtime responses and fix route placement/config before launch.

## 5. COMPLETE GAP MATRIX

| ID | Area | Finding | Severity | Evidence | Impact | Recommended Fix | Dependencies |
|---|---|---|---|---|---|---|---|
| G-001 | Secrets | `.env` included in archive | P0 | Root `.env` exists | Credential exposure | Rotate, remove, secret scan, tighten ignore/history process | None |
| G-002 | Auth/DB | System context has no client for callers | P0 | `tenant-context/index.ts`, `auth.ts` | Auth unusable | Lease restricted system client request-scope | G-004 |
| G-003 | Auth | Verification token not persisted | P1 | `actions/auth.ts` comment and code | Accounts cannot verify | Add hashed token table/consume action | G-004 |
| G-004 | Auth | Password reset not consumable | P1 | `actions/auth.ts` | Account recovery missing | Add token table, expiry, single-use consume, tests | G-002 |
| G-005 | Authorization | Premium accepts caller identity/defaults | P0 | premium audit route and prior audit | IDOR/cost abuse | Central credential and subscription checks | G-002 |
| G-006 | Authorization | Engine route same risk | P0 | engine route and prior audit | Cross-tenant/expensive work | Remove defaults, authorize route | G-002 |
| G-007 | API auth | Plain identity headers fallback | P1 | `authorization.ts` | Spoofable integration boundary if exposed | Replace with hashed API keys/signed tokens, scope keys | G-005 |
| G-008 | Tenant isolation | Context not enforced on all paths | P1 | route/action/repository mix | Cross-tenant leakage | Centralize tenant repository factory and tests | G-002, G-005 |
| G-009 | DB reliability | Mock pool/in-memory repository fallbacks | P0 | admin persistence, AI repos, audit evidence | False success/data loss | Production fail closed; explicit test-only adapters | G-010 |
| G-010 | DB | Singleton mutable transaction state | P1 | Postgres persistence audit | Concurrent request corruption | PoolClient/AsyncLocalStorage transaction ownership | G-002 |
| G-011 | DB | Two migration systems/directories | P0 | `database/migrations`, `database/drizzle`, scripts/config | Schema drift | Choose Drizzle canonical chain and archive/remove obsolete path | None |
| G-012 | DB | Schema/migration tables and types drift | P0 | audit report; schema vs SQL | Deploy mismatch | Generate/reconcile one schema, replay on empty DB | G-011 |
| G-013 | DB | RLS completeness/force not proven | P1 | RLS migration and tenant table registry | Bypass under owner/service role | Add FORCE RLS/policies/role tests for every tenant table | G-011 |
| G-014 | Crawl | Free audit rich mock fallback | P1 | free audit route | Fabricated user result | Fail closed in production, explicit demo mode only | G-009 |
| G-015 | Crawl | Direct provider calls bypass SSRF guard | P1 | free/premium routes vs acquisition guard | SSRF/internal access | Shared safe URL fetch boundary | G-005 |
| G-016 | Crawl | No consistent public rate/quota/cost controls | P1 | free endpoint and prior audit | Provider bill/abuse | Upstash limiter, domain cooldown, quota, budget | G-015 |
| G-017 | Jobs | Long crawl synchronous | P1 | Firecrawl integration/docs | 504/timeouts | Queue + idempotent job state + polling | G-016 |
| G-018 | Jobs | Worker opens ad-hoc pool | P2 | `scripts/crawl-worker.ts` | Boundary inconsistency | Use shared DB adapter and tenant context | G-010 |
| G-019 | Product truth | Dashboard/audit routes use mock/random data | P1 | `auditService`, competitive/analytics/optimization/graph routes | Misleading results | Replace with persisted domain queries or honest demo labels | G-009 |
| G-020 | Product truth | Citation/brand actions seed mock baseline | P1 | intelligence actions | Fake intelligence | Remove seed from production; fixture-only test path | G-009 |
| G-021 | Billing | Paid route lacks proven subscription entitlement | P1 | premium route/evidence | Unauthorized paid usage | Central entitlement service and transaction check | G-005, G-012 |
| G-022 | Auth UX | Client-only protected route | P1 | `ProtectedRoute`, `proxy.ts` | Protected UI flash/bypass perception | Server dashboard layout `requireSession`/role | G-002 |
| G-023 | UX | Hardcoded workspace/user/demo metrics | P2 | DashboardShell and prior audit | Wrong tenant context | Server-resolved workspace and data | G-008 |
| G-024 | SEO | Robots/sitemap prior runtime failure | P1 | `robots.ts`, `sitemap.ts`, logs/audit | Crawl/index failure | Runtime route smoke and correct metadata | G-011 |
| G-025 | Frontend | Homepage oversized client boundary/duplicate | P2 | locale page, root page, prior audit | JS/LCP/TBT/crawl cost | Server page + interactive islands | None |
| G-026 | UX/a11y | Labels, tabs, canvas fallback, focus gaps | P2 | homepage audit | WCAG failure/conversion loss | Accessible component pass + axe/keyboard checks | G-025 |
| G-027 | UX | Hydration mismatch risk | P1 | ThemeProvider, dev logs, prior audit | Flicker/hydration errors | Server initial locale/theme and stable hydration | G-025 |
| G-028 | Monitoring | Alerts/retries/delivery not proven | P2 | monitoring schemas/services/tests | Missed customer alerts | Idempotent scheduler, delivery log, retry/dead-letter | G-017 |
| G-029 | Observability | No complete readiness/error/cost gate | P1 | observability exists but no deployment gate | Silent production failures | Health/readiness, structured logs, metrics, alerts | G-009 |
| G-030 | CI | Build/evals only, deploy placeholder | P1 | `.circleci/config.yml` | Broken releases | Add lint/type/test/migration/security/smoke gates | G-011, G-029 |
| G-031 | Tooling | npm and pnpm lockfiles | P2 | root files | Non-deterministic install | Select one package manager, validate lockfile | G-030 |
| G-032 | Hygiene | `.orig`, `.rej`, temp schema, logs, patches in archive | P2 | root/source files | Dead/ambiguous code and leakage | Remove artifacts; add CI hygiene check | None |
| G-033 | Testing | No demonstrated browser E2E/RLS migration gate | P1 | 75 tests but no Playwright/browser suite | Critical regressions escape | Add DB-backed auth/tenant/API/flow tests | G-002, G-011 |
| G-034 | Error semantics | Mixed thrown errors/JSON/console leakage | P2 | actions/routes broadly | Poor UX and sensitive logs | Typed error boundary and safe logging policy | G-029 |
| G-035 | Performance | Client graphs/RAF and direct analytics work | P2 | homepage/graph, prior audit | High CPU/bundle cost | Stable refs, reduced motion, dynamic imports, budgets | G-025 |
| G-036 | Legal/SaaS | Billing/legal/data deletion completeness unverified | P1 | pricing/billing/privacy pages, schemas | Compliance/support risk | Map implemented vs placeholder flows and close required lifecycle | G-021 |

## 6. TARGET ARCHITECTURE

Converge on a **modular monolith with explicit boundaries**, not a rewrite:

1. **Request boundary:** Next route/server action validates input with shared Zod schemas, resolves identity from signed session or scoped API key, resolves tenant from credential/membership, applies rate/quota policy, and calls one application use case.
2. **Application layer:** Feature use cases own orchestration, authorization requirements, transaction boundaries, idempotency keys, and typed results. Routes contain no business rules and never accept authoritative tenant identity from UI state.
3. **Domain layer:** Pure policies/state machines/scoring. No `pg`, Next cookies, Firecrawl, Redis, or environment access.
4. **Infrastructure layer:** One PostgreSQL adapter/repository factory, one transaction abstraction backed by request-scoped PoolClient, one safe outbound HTTP/crawl adapter, one AI provider gateway, one queue/event gateway, one rate-limit adapter. No in-memory fallback in production.
5. **Tenant isolation:** Every tenant table has an organization key, FK, indexes, RLS policy, `FORCE ROW LEVEL SECURITY` where appropriate, and tests executed with non-owner roles. Application tenant context sets a transaction-local value. System context is a restricted, explicitly named role for identity/bootstrap operations only.
6. **Database:** Drizzle schema and generated SQL migrations are canonical. Raw historical migrations are reconciled into one ordered chain, replayed on an empty database, then applied to a staging clone. Deployment runs migrations separately from app build with a lock and rollback plan.
7. **Jobs:** Crawl and model observation work is queued, idempotent, retryable with bounded backoff, observable, and returns job status. Provider failures are durable job failures, never fabricated success.
8. **Product truth:** Every dashboard metric comes from a persisted query or is explicitly labeled demo/illustrative. The real audit path shares the same acquisition and analysis services as background jobs.
9. **Frontend:** Public marketing is server-rendered; only audit form, graph, tabs and live controls are client islands. Authenticated dashboard layout protects on the server. Shared accessible components handle loading/error/empty/success states and locale/RTL direction.
10. **Operations:** Structured logs with request/tenant/job correlation, error reporting, health/readiness, provider/database latency/cost metrics, alerts, dependency audit, CI migration replay, security tests, smoke tests, and deployment verification.

## 7. PRODUCT-READY ROADMAP

**Phase A, security and secrets:** G-001, G-002, G-005, G-006, G-007, G-008, G-015, G-016.

**Phase B, database integrity:** G-009, G-010, G-011, G-012, G-013, then G-018.

**Phase C, auth and SaaS lifecycle:** G-003, G-004, G-022, G-021, G-036.

**Phase D, truthful core workflow:** G-014, G-017, G-019, G-020, then G-028.

**Phase E, verification and operations:** G-033, G-029, G-030, G-031, G-032, G-034.

**Phase F, frontend/SEO/performance:** G-024, G-025, G-027, G-026, G-035, G-023.

Do not start new AI features until the endpoint authorization, persistence truth, queue behavior, and test gates are closed.

## 8. JULES MICRO-PROMPTS

Each prompt below is intentionally single-scope. Jules must stop if required evidence differs from this audit, if a change needs files outside the allowed set, or if tests reveal a pre-existing blocker that would make the result misleading.

### JULES-001
**TITLE:** Remove tracked runtime secrets and add repository secret hygiene

**CONTEXT:** The supplied archive contains a root `.env`. Values must never be exposed or copied into prompts.

**OBJECTIVE:** Remove the tracked runtime env file/artifacts from the repository and add a deterministic secret-hygiene check without changing application behavior.

**CURRENT PROBLEM:** Real credentials may be exposed; ignore rules alone do not remove an already tracked file.

**EVIDENCE:** Root `.env`; `.env.example`; `.gitignore`.

**SCOPE:** Repository hygiene only.

**ALLOWED FILES:** `.env`, `.gitignore`, `.env.example`, `scripts/security/secret-hygiene.ts` if needed, CI config only for invoking the check.

**DO NOT TOUCH:** Runtime auth, database, migrations, product logic, or secret values.

**IMPLEMENTATION REQUIREMENTS:** Remove `.env` from the commit; preserve variable names only in `.env.example`; fail on tracked `.env`, private keys, and known credential patterns; document rotation without printing values.

**SECURITY REQUIREMENTS:** Assume any real values in the archive are compromised; do not emit them.

**BACKWARD COMPATIBILITY:** Local development still works with `.env.example` copied and populated manually.

**TEST REQUIREMENTS:** Test the checker against safe fixtures and a fixture containing a fake secret.

**VERIFICATION:** `git ls-files .env`; run the hygiene checker; confirm no secret value appears in output.

**ACCEPTANCE CRITERIA:** No tracked `.env`; safe example remains; checker fails closed; no runtime files changed.

**EXPECTED FILE CHANGES:** `.env` removed; ignore/example/checker/CI invocation as needed.

**COMMIT MESSAGE:** `security: remove tracked env and add secret hygiene`

**STOP CONDITION:** Stop if the repository history requires an external credential rotation action; report it without inventing credentials.

### JULES-002
**TITLE:** Make system database context request-scoped and usable by auth

**CONTEXT:** Auth and authorization call `getDbClient()` inside `runWithSystemContext`, but current system context does not lease a client.

**OBJECTIVE:** Implement a restricted request-scoped system DB client lifecycle with guaranteed release.

**CURRENT PROBLEM:** Login, registration, membership, and role checks fail because system context has no client.

**EVIDENCE:** `src/core/database/tenant-context/index.ts`, `src/app/actions/auth.ts`, `src/services/auth/authorization.ts`.

**SCOPE:** System context lifecycle only.

**ALLOWED FILES:** `src/core/database/tenant-context/index.ts`, `src/features/admin/infrastructure/persistence/postgres/index.ts`, related auth/session tests.

**DO NOT TOUCH:** Tenant RLS policy semantics, UI, migration definitions, or unrelated repositories.

**IMPLEMENTATION REQUIREMENTS:** Lease/release one PoolClient per system scope; no shared mutable transaction state; preserve explicit system mode; provide a restricted system-role configuration seam.

**SECURITY REQUIREMENTS:** System mode is not an unrestricted tenant bypass; preserve parameterized queries and fail closed on missing DB.

**BACKWARD COMPATIBILITY:** Existing callers keep the same public context methods.

**TEST REQUIREMENTS:** Add tests for client availability, release on success/failure, nested scope behavior, and missing-client failure.

**VERIFICATION:** Run targeted auth/context tests and TypeScript.

**ACCEPTANCE CRITERIA:** Auth callers receive a live client; every leased client is released; no mock client is created in production.

**EXPECTED FILE CHANGES:** Context manager, DB adapter lifecycle, targeted tests.

**COMMIT MESSAGE:** `fix: lease system database context per request`

**STOP CONDITION:** Stop if a restricted DB role cannot be represented without a migration; report the exact migration requirement.

### JULES-003
**TITLE:** Remove unauthenticated identity defaults from premium audit

**CONTEXT:** Premium audit is an expensive, tenant-writing endpoint.

**OBJECTIVE:** Require verified session or scoped API credential, membership, role, active entitlement, and tenant context before work begins.

**CURRENT PROBLEM:** Caller-controlled headers/default identities can authorize expensive work or cross-tenant writes.

**EVIDENCE:** `src/app/api/v1/audit/premium/route.ts`; `src/services/auth/authorization.ts`; prior audit evidence.

**SCOPE:** Premium audit route authorization only.

**ALLOWED FILES:** Premium route, shared authorization/entitlement service files, targeted route/security tests.

**DO NOT TOUCH:** Crawl provider implementation, UI, schema migration, or pricing copy.

**IMPLEMENTATION REQUIREMENTS:** No default user/tenant; use authoritative credential; check membership, workspace-admin capability, active subscription/quota; enter tenant context only after checks.

**SECURITY REQUIREMENTS:** Ignore client tenant selectors for authorization; return safe 401/403/429/402 responses; never log credentials.

**BACKWARD COMPATIBILITY:** Existing valid authenticated sessions remain supported.

**TEST REQUIREMENTS:** Unauthenticated, spoofed headers, cross-tenant, viewer, inactive subscription, and valid admin cases.

**VERIFICATION:** Targeted API security tests plus manual request matrix.

**ACCEPTANCE CRITERIA:** No expensive or tenant-writing work occurs before all checks pass.

**EXPECTED FILE CHANGES:** Premium route, authorization/entitlement adapter, tests.

**COMMIT MESSAGE:** `security: enforce premium audit authorization`

**STOP CONDITION:** Stop if subscription source of truth is absent; add a failing explicit dependency note, not a permissive fallback.

### JULES-004
**TITLE:** Remove unauthenticated identity defaults from audit engine

**CONTEXT:** The audit engine is another tenant-sensitive entry point.

**OBJECTIVE:** Apply the same authoritative identity and tenant checks as premium audit.

**CURRENT PROBLEM:** Header/default identity paths bypass the intended session/API-key boundary.

**EVIDENCE:** `src/app/api/v1/audit/engine/route.ts`, prior audit evidence.

**SCOPE:** Engine route auth only.

**ALLOWED FILES:** Engine route, shared auth helper if necessary, route security tests.

**DO NOT TOUCH:** Scoring engine internals or database schema.

**IMPLEMENTATION REQUIREMENTS:** No default identities; credential-derived user/tenant; membership and role checks; explicit tenant context.

**SECURITY REQUIREMENTS:** Cross-tenant and unauthenticated requests fail before DB/provider work.

**BACKWARD COMPATIBILITY:** Preserve valid API response shape for authorized callers.

**TEST REQUIREMENTS:** Negative and positive authorization tests.

**VERIFICATION:** Targeted route tests and lint/typecheck.

**ACCEPTANCE CRITERIA:** Identity cannot be selected by arbitrary request headers.

**EXPECTED FILE CHANGES:** Engine route and tests.

**COMMIT MESSAGE:** `security: close audit engine identity bypass`

**STOP CONDITION:** Stop if the current client contract cannot be migrated without documenting the API-key replacement.

### JULES-005
**TITLE:** Replace plain identity headers with scoped API credentials

**CONTEXT:** `authorizeApiRequest` falls back to `x-user-id` and `x-tenant-id`.

**OBJECTIVE:** Replace spoofable headers with hashed, scoped, revocable API keys or signed service tokens.

**CURRENT PROBLEM:** A plain header is not an authentication factor.

**EVIDENCE:** `src/services/auth/authorization.ts`.

**SCOPE:** Public API credential verification.

**ALLOWED FILES:** Authorization service, API-key schema/repository/migration if required, public API middleware, tests.

**DO NOT TOUCH:** Browser session cookie format or feature scoring.

**IMPLEMENTATION REQUIREMENTS:** Store only hashes; include tenant and scopes; constant-time verification; expiry/revocation; no raw key logging.

**SECURITY REQUIREMENTS:** Fail closed; never accept user/tenant identity as authority from headers.

**BACKWARD COMPATIBILITY:** Existing session-authenticated browser calls continue to work.

**TEST REQUIREMENTS:** valid, expired, revoked, wrong tenant, wrong scope, malformed and replay cases.

**VERIFICATION:** Targeted auth tests and migration replay.

**ACCEPTANCE CRITERIA:** Header-only identity is rejected; scoped credential maps to one tenant.

**EXPECTED FILE CHANGES:** Credential service/schema/migration/middleware/tests.

**COMMIT MESSAGE:** `security: authenticate API requests with scoped credentials`

**STOP CONDITION:** Stop if a migration is required but cannot be generated from the canonical system selected in JULES-009.

### JULES-006
**TITLE:** Make production database failures fail closed

**CONTEXT:** Persistence code contains mock pool/in-memory fallback behavior.

**OBJECTIVE:** Disable fake persistence in production and make write failures observable errors.

**CURRENT PROBLEM:** Database outages can return fabricated success or lose writes.

**EVIDENCE:** admin persistence, AI repository fallback maps, premium audit error handling, audit report.

**SCOPE:** Production fallback removal.

**ALLOWED FILES:** `src/features/admin/infrastructure/persistence/postgres/**`, `src/features/ai-intelligence/repositories/**`, affected audit route, tests.

**DO NOT TOUCH:** UI or unrelated domain rules.

**IMPLEMENTATION REQUIREMENTS:** Production requires real PostgreSQL; mocks only behind explicit test/development flag; no swallowed persistence errors; structured error classification.

**SECURITY REQUIREMENTS:** Never turn authorization/data-integrity failure into success.

**BACKWARD COMPATIBILITY:** Test adapters remain available through explicit dependency injection.

**TEST REQUIREMENTS:** DB unavailable, write failure, read failure, test-mode adapter cases.

**VERIFICATION:** Targeted tests; grep production paths for fallback success.

**ACCEPTANCE CRITERIA:** Any durable write failure produces non-success response and telemetry.

**EXPECTED FILE CHANGES:** Persistence/repository/route tests.

**COMMIT MESSAGE:** `fix: fail closed when persistence is unavailable`

**STOP CONDITION:** Stop if a fallback is required by a documented test harness; isolate it rather than deleting blindly.

### JULES-007
**TITLE:** Remove shared mutable transaction state

**CONTEXT:** Prior audit identifies singleton transaction fields in PostgreSQL persistence.

**OBJECTIVE:** Make transaction ownership request/client scoped.

**CURRENT PROBLEM:** Concurrent requests can share transaction state.

**EVIDENCE:** `PostgresClient` implementation and audit report.

**SCOPE:** Transaction state only.

**ALLOWED FILES:** `src/features/admin/infrastructure/persistence/postgres/index.ts`, context tests, concurrency tests.

**DO NOT TOUCH:** Schema or repository business methods.

**IMPLEMENTATION REQUIREMENTS:** PoolClient owns BEGIN/COMMIT/ROLLBACK; AsyncLocalStorage carries current client; no singleton `inTransaction` or operation arrays.

**SECURITY REQUIREMENTS:** Release/rollback in all paths; no cross-request tenant state.

**BACKWARD COMPATIBILITY:** Preserve repository interfaces.

**TEST REQUIREMENTS:** Parallel transactions for two tenants and rollback isolation.

**VERIFICATION:** Run concurrency tests and inspect for shared mutable transaction fields.

**ACCEPTANCE CRITERIA:** Parallel requests cannot observe or commit each other's transaction state.

**EXPECTED FILE CHANGES:** DB client/context/tests.

**COMMIT MESSAGE:** `fix: isolate transaction state per request`

**STOP CONDITION:** Stop if current repository APIs require a broader refactor; keep the diff to transaction ownership.

### JULES-008
**TITLE:** Centralize SSRF-safe URL validation for all audit entry points

**CONTEXT:** A robust SSRF guard exists in acquisition but free/premium routes bypass it.

**OBJECTIVE:** Make every outbound crawl use one safe URL policy.

**CURRENT PROBLEM:** `z.string().url()` does not block internal/private destinations or unsafe redirects.

**EVIDENCE:** `src/features/acquisition/infrastructure/security/ssrf-guard.ts`, free/premium routes, audit report.

**SCOPE:** URL normalization and outbound fetch boundary.

**ALLOWED FILES:** SSRF guard, crawl provider adapters, free/premium route call sites, security tests.

**DO NOT TOUCH:** Scoring, UI, billing.

**IMPLEMENTATION REQUIREMENTS:** HTTP(S) only, reject local/private/link-local/CGNAT/multicast/documentation/mapped addresses, DNS revalidation, redirect revalidation, bounded timeout.

**SECURITY REQUIREMENTS:** No raw URL logging if it can contain sensitive query data; fail closed on DNS ambiguity.

**BACKWARD COMPATIBILITY:** Valid public URLs preserve response behavior.

**TEST REQUIREMENTS:** IPv4/IPv6/private/redirect/DNS-rebind/scheme cases.

**VERIFICATION:** Security tests and provider call-site grep.

**ACCEPTANCE CRITERIA:** Free and premium routes cannot call providers except through the shared guard.

**EXPECTED FILE CHANGES:** Guard/adapters/routes/tests.

**COMMIT MESSAGE:** `security: enforce shared SSRF policy for audits`

**STOP CONDITION:** Stop if provider redirect behavior cannot be controlled; disable redirects and report.

### JULES-009
**TITLE:** Select and document Drizzle as the sole migration system

**CONTEXT:** The repository has `database/schema`, `database/migrations`, and `database/drizzle` plus both npm/pnpm locks.

**OBJECTIVE:** Establish one canonical schema/migration directory and deterministic scripts.

**CURRENT PROBLEM:** Clean and production environments may converge differently.

**EVIDENCE:** `drizzle.config.ts`, `src/core/database/migrator.ts`, both migration directories, package scripts.

**SCOPE:** Migration system selection/documentation, not schema redesign.

**ALLOWED FILES:** `drizzle.config.ts`, `src/core/database/migrator.ts`, `package.json`, canonical migration docs, selected lockfile.

**DO NOT TOUCH:** Application features or RLS semantics yet.

**IMPLEMENTATION REQUIREMENTS:** Choose Drizzle; define one output; make runtime migrator and `db:generate`/`db:migrate` agree; choose one package manager and lockfile.

**SECURITY REQUIREMENTS:** Migration connection is separate from runtime; never use production destructive push.

**BACKWARD COMPATIBILITY:** Preserve existing deployment instructions by updating them, not silently breaking them.

**TEST REQUIREMENTS:** Script-level config assertions.

**VERIFICATION:** Generate/check dry-run on a disposable DB using the chosen path.

**ACCEPTANCE CRITERIA:** One canonical source and one ordered migration output are documented and used by scripts.

**EXPECTED FILE CHANGES:** Config, migrator, package scripts, docs, one lockfile removal.

**COMMIT MESSAGE:** `build: establish canonical Drizzle migration pipeline`

**STOP CONDITION:** Stop before deleting historical migrations if they cannot be replayed/reconciled; archive them clearly.

### JULES-010
**TITLE:** Reconcile schema and migrations on an empty database

**CONTEXT:** Prior audit identifies 21 schema tables absent from raw migration chain plus type/constraint drift.

**OBJECTIVE:** Produce a deterministic migration set that creates the actual canonical schema.

**CURRENT PROBLEM:** Production schema can differ from TypeScript schema.

**EVIDENCE:** `database/schema/**`, `database/migrations/**`, audit report.

**SCOPE:** Schema/migration reconciliation only.

**ALLOWED FILES:** `database/schema/**`, canonical migration directory, migration reconciliation doc, schema tests.

**DO NOT TOUCH:** Application queries except for compile fixes directly caused by canonical schema.

**IMPLEMENTATION REQUIREMENTS:** Reconcile tables, columns, nullability, defaults, enums/checks, FKs, indexes, tenant keys; preserve data-safe forward migrations.

**SECURITY REQUIREMENTS:** Do not drop production data; no destructive migration without explicit operator runbook.

**BACKWARD COMPATIBILITY:** Existing records and deployed migrations must be handled with additive/backfill steps.

**TEST REQUIREMENTS:** Replay from empty DB and upgrade from representative prior state.

**VERIFICATION:** Migration replay, schema introspection diff, TypeScript check.

**ACCEPTANCE CRITERIA:** Empty replay and upgrade converge to the same schema.

**EXPECTED FILE CHANGES:** Canonical schema/migrations/tests/docs.

**COMMIT MESSAGE:** `db: reconcile canonical schema and migrations`

**STOP CONDITION:** Stop on destructive drift; create a separate migration plan rather than applying it.

### JULES-011
**TITLE:** Verify and enforce tenant RLS for every tenant table

**CONTEXT:** RLS intent exists, but complete policy/force/role coverage is not proven.

**OBJECTIVE:** Enforce database-level tenant isolation and add regression tests.

**CURRENT PROBLEM:** App-level context alone is insufficient.

**EVIDENCE:** RLS migration, `TENANT_SCOPED_TABLES`, schema/migration drift.

**SCOPE:** RLS policies and tests.

**ALLOWED FILES:** RLS migrations, tenant context, DB integration tests, security docs.

**DO NOT TOUCH:** Product UI or scoring.

**IMPLEMENTATION REQUIREMENTS:** Every tenant table has tenant key, policy for select/insert/update/delete, appropriate `FORCE ROW LEVEL SECURITY`, safe system role separation, transaction-local tenant setting.

**SECURITY REQUIREMENTS:** Test with non-owner role; cross-tenant reads/writes must return zero/error.

**BACKWARD COMPATIBILITY:** System operations explicitly use restricted system role and are audited.

**TEST REQUIREMENTS:** Two tenants, owner/non-owner, null/missing context, nested transactions.

**VERIFICATION:** Disposable PostgreSQL integration suite.

**ACCEPTANCE CRITERIA:** Cross-tenant access fails at DB layer even if application filter is removed.

**EXPECTED FILE CHANGES:** RLS migrations/context/integration tests/docs.

**COMMIT MESSAGE:** `security: enforce and test tenant RLS coverage`

**STOP CONDITION:** Stop if production DB role ownership makes FORCE RLS unsafe; document exact role change needed.

### JULES-012
**TITLE:** Persist and consume email verification tokens

**CONTEXT:** Registration generates a token but never persists it.

**OBJECTIVE:** Implement secure, expiring, single-use email verification.

**CURRENT PROBLEM:** Verification links cannot be validated.

**EVIDENCE:** `src/app/actions/auth.ts`, verify-email page.

**SCOPE:** Verification lifecycle only.

**ALLOWED FILES:** auth actions/service, verification schema/migration, verify page, email helper, tests.

**DO NOT TOUCH:** Password reset, dashboard, billing.

**IMPLEMENTATION REQUIREMENTS:** Hash token at rest; expiry; single use; consume transactionally; mark user verified; generic request response; resend cooldown.

**SECURITY REQUIREMENTS:** Never store/log raw token; prevent token reuse and account enumeration.

**BACKWARD COMPATIBILITY:** Existing unverified accounts remain recoverable through resend.

**TEST REQUIREMENTS:** valid/expired/reused/wrong-user/resend cases.

**VERIFICATION:** Auth integration tests and migration replay.

**ACCEPTANCE CRITERIA:** A real sent link verifies exactly once and invalid links fail safely.

**EXPECTED FILE CHANGES:** Auth/schema/migration/page/email/tests.

**COMMIT MESSAGE:** `feat: implement email verification lifecycle`

**STOP CONDITION:** Stop if email provider contract is absent; preserve a safe pending state, not auto-verification.

### JULES-013
**TITLE:** Implement consumable password reset flow

**CONTEXT:** Reset action generates a non-persisted token and has no consuming action.

**OBJECTIVE:** Add a complete secure password reset lifecycle.

**CURRENT PROBLEM:** Users cannot recover accounts.

**EVIDENCE:** `auth.ts`, forgot-password page, missing reset route/action.

**SCOPE:** Password reset only.

**ALLOWED FILES:** auth actions/service, reset schema/migration, forgot/reset pages, password helper, tests.

**DO NOT TOUCH:** Registration or billing.

**IMPLEMENTATION REQUIREMENTS:** Hash token; short expiry; single use; invalidate prior sessions after reset; uniform request response; rate limit.

**SECURITY REQUIREMENTS:** No raw token/password logs; generic account existence response.

**BACKWARD COMPATIBILITY:** Existing valid sessions are invalidated intentionally after password change.

**TEST REQUIREMENTS:** request/consume/expired/reuse/weak-password/session-invalidation cases.

**VERIFICATION:** Targeted auth integration tests.

**ACCEPTANCE CRITERIA:** Reset works once, expires, and cannot enumerate accounts.

**EXPECTED FILE CHANGES:** Auth/schema/migration/pages/tests.

**COMMIT MESSAGE:** `feat: add secure password reset flow`

**STOP CONDITION:** Stop if no safe reset route exists in the locale structure; add the route narrowly.

### JULES-014
**TITLE:** Enforce server-side dashboard protection

**CONTEXT:** Client `ProtectedRoute` is not a security boundary; proxy only redirects root.

**OBJECTIVE:** Protect authenticated dashboard layouts on the server and preserve locale-aware redirects.

**CURRENT PROBLEM:** Protected UI can render before client auth state resolves.

**EVIDENCE:** `src/components/ProtectedRoute.tsx`, `src/proxy.ts`, dashboard layout, prior audit.

**SCOPE:** Dashboard auth boundary.

**ALLOWED FILES:** Dashboard layout, auth/session helpers, proxy only if needed, focused tests.

**DO NOT TOUCH:** Auth cookie cryptography or feature pages.

**IMPLEMENTATION REQUIREMENTS:** Server `requireSession`, role/membership check, `redirect`/replace semantics, safe return path, no client-only authority.

**SECURITY REQUIREMENTS:** Unauthorized requests never receive protected data from server components/actions.

**BACKWARD COMPATIBILITY:** Keep client guard only as UX fallback if needed.

**TEST REQUIREMENTS:** unauthenticated, expired, viewer/admin, locale routes.

**VERIFICATION:** Route tests plus manual direct URL request.

**ACCEPTANCE CRITERIA:** Direct dashboard request is blocked server-side before protected data fetch.

**EXPECTED FILE CHANGES:** Layout/auth tests.

**COMMIT MESSAGE:** `security: protect dashboard routes on the server`

**STOP CONDITION:** Stop if layout grouping differs from assumed route tree; map actual group first and only touch the real boundary.

### JULES-015
**TITLE:** Replace free audit production simulation with truthful queued workflow

**CONTEXT:** Free audit route has a rich mock fallback and synchronous provider call.

**OBJECTIVE:** In production, return real provider result/job status or an explicit unavailable error, never fabricated analysis.

**CURRENT PROBLEM:** Users can be shown fake audit results.

**EVIDENCE:** `src/app/api/v1/audit/free/route.ts`, `FreeAuditPanel`, `auditService`.

**SCOPE:** Free audit API contract and panel integration.

**ALLOWED FILES:** Free audit route, audit panel/service, job status files, tests.

**DO NOT TOUCH:** Premium scoring or unrelated dashboards.

**IMPLEMENTATION REQUIREMENTS:** Explicit `MOCK_SERVICES` only for local/demo; production missing provider returns 503; real path persists job/result; queue long work; UI handles 202/status/error/retry.

**SECURITY REQUIREMENTS:** Apply JULES-008 and JULES-016 controls before provider call.

**BACKWARD COMPATIBILITY:** Preserve localized user-facing states and response compatibility where safe.

**TEST REQUIREMENTS:** mock-disabled, provider success/failure, queued, retry, persistence failure.

**VERIFICATION:** Route/component tests and local demo-mode test.

**ACCEPTANCE CRITERIA:** No production response contains simulated score/crawl content.

**EXPECTED FILE CHANGES:** Free audit route/panel/job adapter/tests.

**COMMIT MESSAGE:** `fix: make free audit results truthful in production`

**STOP CONDITION:** Stop if persistence/job infrastructure is not available; return explicit unavailable response rather than synchronous fake result.

### JULES-016
**TITLE:** Add distributed rate limits, quotas, and provider budget controls to audits

**CONTEXT:** Public and premium audit endpoints need abuse and cost protection.

**OBJECTIVE:** Add IP/account/domain rate limits, quota enforcement, concurrency caps, and provider cost ceilings.

**CURRENT PROBLEM:** Public crawl/LLM work can be abused or exceed budget.

**EVIDENCE:** Free route, premium route, Upstash env contract, prior audit.

**SCOPE:** Audit admission controls.

**ALLOWED FILES:** rate-limit service, audit routes, quota repository/schema if needed, tests.

**DO NOT TOUCH:** Scoring or frontend visual design.

**IMPLEMENTATION REQUIREMENTS:** Fail closed in production when limiter config missing; stable keys; domain cooldown; plan-aware quota; idempotency key.

**SECURITY REQUIREMENTS:** Prevent spoofable identity keys; do not use raw IP as sole tenant authority.

**BACKWARD COMPATIBILITY:** Local development has explicit test bypass only when configured.

**TEST REQUIREMENTS:** burst, quota exhausted, Redis unavailable, duplicate idempotency, plan differences.

**VERIFICATION:** Targeted route tests and load-shaped deterministic test.

**ACCEPTANCE CRITERIA:** Every expensive path is admitted by a bounded policy.

**EXPECTED FILE CHANGES:** Rate/quota/audit/tests.

**COMMIT MESSAGE:** `security: add audit rate and cost controls`

**STOP CONDITION:** Stop if billing entitlement is unavailable; deny premium work rather than defaulting open.

### JULES-017
**TITLE:** Queue crawl and model work with idempotent job lifecycle

**CONTEXT:** Deep crawls can exceed serverless request duration; Inngest and crawl worker exist.

**OBJECTIVE:** Make audit/crawl processing asynchronous, retryable, idempotent, and observable.

**CURRENT PROBLEM:** Synchronous provider calls can time out and duplicate work.

**EVIDENCE:** Firecrawl integration, Inngest routes/functions, crawl worker, acquisition state machine.

**SCOPE:** One audit/crawl job path.

**ALLOWED FILES:** `src/inngest/**`, acquisition orchestrator/job repositories, audit route/status endpoint, targeted tests.

**DO NOT TOUCH:** Other AI features.

**IMPLEMENTATION REQUIREMENTS:** 202 + job ID; durable states; idempotency key; bounded retry/backoff; timeout; dead-letter/manual retry signal; persisted provider errors.

**SECURITY REQUIREMENTS:** Job payload contains tenant/user scope derived server-side; worker revalidates scope.

**BACKWARD COMPATIBILITY:** Existing synchronous callers receive polling-compatible response.

**TEST REQUIREMENTS:** duplicate delivery, retry, timeout, permanent failure, cross-tenant job.

**VERIFICATION:** Inngest/job tests and worker smoke test.

**ACCEPTANCE CRITERIA:** One logical request produces at most one durable result and clear terminal state.

**STOP CONDITION:** Stop if queue deployment configuration is absent; document required env/deploy setup and keep route fail closed.

### JULES-018
**TITLE:** Remove random and hardcoded product data from one analytics route

**CONTEXT:** Multiple analytics/competitive/optimization routes generate random/hardcoded metrics.

**OBJECTIVE:** Replace one selected route, starting with `/api/v1/analytics/llm`, with persisted tenant-scoped queries or explicit empty state.

**CURRENT PROBLEM:** UI can present fabricated intelligence as real.

**EVIDENCE:** Route and audit inventory identify `Math.random()`/hardcoded provider metrics.

**SCOPE:** LLM analytics route only.

**ALLOWED FILES:** LLM analytics route, repository/query service, route tests.

**DO NOT TOUCH:** Other analytics routes or UI redesign.

**IMPLEMENTATION REQUIREMENTS:** Query canonical observations/positions/metrics; deterministic aggregation; empty dataset response; no random IDs/results.

**SECURITY REQUIREMENTS:** Tenant context and authorization before query.

**BACKWARD COMPATIBILITY:** Preserve response schema where possible; add explicit `hasData` only if needed.

**TEST REQUIREMENTS:** populated, empty, cross-tenant, DB failure.

**VERIFICATION:** Route tests and grep route for random/mock fallback.

**ACCEPTANCE CRITERIA:** Same DB state returns same response; no fabricated values.

**STOP CONDITION:** Stop if schema lacks required fields; return truthful not-available response and create a separate schema task.

### JULES-019
**TITLE:** Make monitoring alerts durable and retryable

**CONTEXT:** Monitoring schemas/services exist but delivery/retry/idempotency are not proven.

**OBJECTIVE:** Implement one end-to-end alert lifecycle for website or AI visibility monitoring.

**CURRENT PROBLEM:** Customers may miss alerts or receive duplicates.

**EVIDENCE:** monitoring feature/tests, `monitoring_configs`, `monitoring_alerts`, Inngest presence.

**SCOPE:** One alert type and delivery channel.

**ALLOWED FILES:** monitoring application/repository, one job function, alert tests/docs.

**DO NOT TOUCH:** UI-wide redesign or billing.

**IMPLEMENTATION REQUIREMENTS:** threshold evaluation, dedupe key, persisted delivery state, bounded retries, failure visibility.

**SECURITY REQUIREMENTS:** Tenant-scoped config/results and no cross-tenant recipient resolution.

**BACKWARD COMPATIBILITY:** Existing configs remain valid; disabled configs do nothing.

**TEST REQUIREMENTS:** threshold crossing, no crossing, duplicate run, provider failure/retry, tenant isolation.

**VERIFICATION:** Targeted monitoring tests and job replay.

**ACCEPTANCE CRITERIA:** One threshold event yields one durable alert outcome.

**STOP CONDITION:** Stop if notification provider is not configured; persist failed delivery, never claim sent.

### JULES-020
**TITLE:** Add migration/RLS/auth CI quality gates

**CONTEXT:** CI currently builds/evals but does not demonstrate full product safety gates.

**OBJECTIVE:** Add deterministic lint, typecheck, tests, migration replay, RLS integration, secret hygiene, and route smoke stages.

**CURRENT PROBLEM:** Critical regressions can merge despite a green build.

**EVIDENCE:** `.circleci/config.yml`, package scripts, tests.

**SCOPE:** CI only.

**ALLOWED FILES:** `.circleci/config.yml`, `package.json`, test scripts, CI docs.

**DO NOT TOUCH:** Application behavior.

**IMPLEMENTATION REQUIREMENTS:** Pin package manager; fail on missing required env; disposable Postgres service; run canonical migrations; collect artifacts.

**SECURITY REQUIREMENTS:** No production credentials in CI; use ephemeral test secrets.

**BACKWARD COMPATIBILITY:** Existing eval job remains if useful.

**TEST REQUIREMENTS:** CI config validation and local command parity.

**VERIFICATION:** Run every CI command locally where possible.

**ACCEPTANCE CRITERIA:** CI proves code, schema, tenant isolation, security hygiene, and route smoke before deploy.

**STOP CONDITION:** Stop if external CI secrets/services are missing; mark gate blocked rather than weakening it.

### JULES-021
**TITLE:** Fix robots and sitemap runtime behavior

**CONTEXT:** Metadata generators exist, but prior audit/log evidence reports HTML returned for robots/sitemap.

**OBJECTIVE:** Make built runtime return valid `robots.txt` and `sitemap.xml` with environment-aware policy.

**CURRENT PROBLEM:** Search engines may receive the landing page instead of directives/feed.

**EVIDENCE:** `src/app/robots.ts`, `src/app/sitemap.ts`, prior audit/logs.

**SCOPE:** Robots/sitemap only.

**ALLOWED FILES:** `src/app/robots.ts`, `src/app/sitemap.ts`, site config, route smoke tests.

**DO NOT TOUCH:** Dashboard UI or content copy.

**IMPLEMENTATION REQUIREMENTS:** Production-only indexing; preview/staging disallowed; valid URLs/base URL; exclude private routes; no secrets.

**SECURITY REQUIREMENTS:** Never leak tenant URLs or internal routes beyond intended policy.

**BACKWARD COMPATIBILITY:** Preserve public localized URLs.

**TEST REQUIREMENTS:** Built route response content-type/body assertions for production and preview env.

**VERIFICATION:** `npm run build`, start server, curl both endpoints.

**ACCEPTANCE CRITERIA:** Valid directives/XML are returned, not HTML.

**STOP CONDITION:** Stop if base URL is not configured; fail build/config validation instead of inventing a domain.

### JULES-022
**TITLE:** Convert the homepage to a server component with explicit client islands

**CONTEXT:** The landing page is a large client component and there are duplicate implementations.

**OBJECTIVE:** Reduce client JS and remove duplication without changing product copy/functionality.

**CURRENT PROBLEM:** Poor crawl/performance and drift risk.

**EVIDENCE:** locale page, root page, prior audit.

**SCOPE:** Homepage component boundary only.

**ALLOWED FILES:** `src/app/[locale]/page.tsx`, root page, selected marketing/graph/audit island files, tests.

**DO NOT TOUCH:** Dashboard routes or backend APIs.

**IMPLEMENTATION REQUIREMENTS:** Server-render static content; isolate only interactive audit/tabs/graph; dynamic import heavy graph; preserve locale/RTL metadata.

**SECURITY REQUIREMENTS:** No client-side security decisions introduced.

**BACKWARD COMPATIBILITY:** Public URLs, content, and working interactions remain.

**TEST REQUIREMENTS:** Server/client boundary compile, route smoke, hydration check, bundle snapshot if available.

**VERIFICATION:** Production build and `/fa`/`/en` smoke.

**ACCEPTANCE CRITERIA:** Homepage is not a monolithic client boundary; no duplicate route implementation remains unexplained.

**STOP CONDITION:** Stop if root page is required by Next route resolution; redirect or document the single canonical page safely.

### JULES-023
**TITLE:** Fix theme/locale hydration determinism

**CONTEXT:** Prior dev logs report hydration mismatch from client localStorage/matchMedia mutating HTML attributes after server render.

**OBJECTIVE:** Make first server/client render agree for locale, direction, and theme.

**CURRENT PROBLEM:** Hydration warnings, flicker, possible broken interaction.

**EVIDENCE:** `src/components/ThemeProvider.tsx`, locale layout, dev logs/audit.

**SCOPE:** Theme/locale initialization only.

**ALLOWED FILES:** ThemeProvider, locale/root layout, theme cookie helper, focused tests.

**DO NOT TOUCH:** Dashboard visuals or auth.

**IMPLEMENTATION REQUIREMENTS:** Server-provided initial values; stable first render; optional blocking script only if necessary; reduced-motion safe.

**SECURITY REQUIREMENTS:** Theme cookies are non-sensitive and must not affect authorization.

**BACKWARD COMPATIBILITY:** Preserve manual theme and locale preferences.

**TEST REQUIREMENTS:** `/fa` and `/en` hydration regression and theme preference cases.

**VERIFICATION:** Dev/prod route smoke with no hydration mismatch.

**ACCEPTANCE CRITERIA:** No first-render mismatch for lang/dir/theme.

**STOP CONDITION:** Stop if browser-only library cannot be isolated; keep the isolation narrow.

### JULES-024
**TITLE:** Establish accessible async and chart states for the free audit panel

**CONTEXT:** Audit identifies missing label, inconsistent async states, and chart/canvas accessibility gaps.

**OBJECTIVE:** Make the free audit panel keyboard/screen-reader usable and truthful.

**CURRENT PROBLEM:** Input relies on placeholder; loading/error/success semantics and graph data are not accessible.

**EVIDENCE:** `FreeAuditPanel.tsx`, `LiveKnowledgeGraph.tsx`, homepage audit.

**SCOPE:** Free audit panel and its immediate visualization.

**ALLOWED FILES:** Free audit panel, graph fallback/table, shared input/button if necessary, component tests.

**DO NOT TOUCH:** Global design system rewrite.

**IMPLEMENTATION REQUIREMENTS:** Persistent label, error association, focus management, status announcements, keyboard tab semantics, textual table/fallback for canvas, reduced motion.

**SECURITY REQUIREMENTS:** Do not expose provider errors containing secrets/URLs beyond safe user message.

**BACKWARD COMPATIBILITY:** Preserve Persian/English copy and layout.

**TEST REQUIREMENTS:** Keyboard test, accessible names, loading/error/empty/success, RTL.

**VERIFICATION:** Axe/Lighthouse accessibility and component tests.

**ACCEPTANCE CRITERIA:** No critical axe issues in the panel; every async outcome is understandable without hover.

**STOP CONDITION:** Stop if the panel still consumes fake backend data; coordinate only with JULES-015 and label unavailable state.

### JULES-025
**TITLE:** Replace hardcoded dashboard identity/workspace data

**CONTEXT:** Dashboard shell contains demo names, workspace labels, quota/metrics, and local-only workspace switching.

**OBJECTIVE:** Render server-authoritative identity/workspace/quota data.

**CURRENT PROBLEM:** Users can see another/demo tenant context while actions use a different tenant.

**EVIDENCE:** `DashboardShell.tsx`, prior audit.

**SCOPE:** Dashboard shell identity and workspace selector.

**ALLOWED FILES:** Dashboard shell/navigation, workspace action/query, relevant types/tests.

**DO NOT TOUCH:** Feature metric queries or visual redesign.

**IMPLEMENTATION REQUIREMENTS:** Load membership list server-side; switch through validated action; refresh tenant data; remove demo values; explicit empty state.

**SECURITY REQUIREMENTS:** Server validates membership on every switch; UI state never selects tenant authority.

**BACKWARD COMPATIBILITY:** Preserve existing navigation and locale.

**TEST REQUIREMENTS:** one/multiple workspaces, unauthorized switch, refresh, quota absent.

**VERIFICATION:** Dashboard integration tests and direct request checks.

**ACCEPTANCE CRITERIA:** Displayed workspace and fetched data are the same authorized tenant.

**STOP CONDITION:** Stop if membership schema is incomplete; report required schema task.

### JULES-026
**TITLE:** Add health, readiness, structured logging, and provider failure telemetry

**CONTEXT:** Observability code exists, but production readiness and failure recovery are not proven.

**OBJECTIVE:** Provide safe health/readiness endpoints and correlated structured telemetry.

**CURRENT PROBLEM:** Operators cannot reliably distinguish build success from runtime health.

**EVIDENCE:** observability services, logs, missing deployment gates.

**SCOPE:** Operations observability only.

**ALLOWED FILES:** observability service, health/readiness routes, logging helper, deployment docs/tests.

**DO NOT TOUCH:** Business response schemas or UI.

**IMPLEMENTATION REQUIREMENTS:** liveness without dependencies; readiness checks DB/Redis/provider config; request/tenant/job correlation; latency/error/cost counters; safe redaction.

**SECURITY REQUIREMENTS:** No cookies, tokens, prompts containing secrets, raw credentials, or sensitive page content in logs.

**BACKWARD COMPATIBILITY:** Existing logs remain readable or are migrated intentionally.

**TEST REQUIREMENTS:** dependency up/down, redaction, correlation, non-sensitive response.

**VERIFICATION:** Route smoke and log assertions.

**ACCEPTANCE CRITERIA:** Deployment can detect unhealthy dependencies and operators get actionable, redacted signals.

**STOP CONDITION:** Stop if a vendor is required but not configured; use an internal structured sink, not a fake success.

### JULES-027
**TITLE:** Add end-to-end critical flow and cross-tenant regression suite

**CONTEXT:** Broad tests exist, but no demonstrated browser/DB-backed release gate covers the full critical path.

**OBJECTIVE:** Test registration/login, protected dashboard, tenant separation, audit admission, job status, and logout.

**CURRENT PROBLEM:** Unit tests can pass while the real product flow is broken.

**EVIDENCE:** 75 tests without clear browser E2E/RLS release suite.

**SCOPE:** Test infrastructure and one critical flow.

**ALLOWED FILES:** `tests/e2e/**`, test config/scripts, fixtures, CI invocation.

**DO NOT TOUCH:** Production code except test seams that already exist.

**IMPLEMENTATION REQUIREMENTS:** Disposable Postgres with canonical migrations; two tenants/users; no production bypass; deterministic provider fakes injected at boundary.

**SECURITY REQUIREMENTS:** Assert direct cross-tenant access fails at app and DB layers.

**BACKWARD COMPATIBILITY:** Keep existing unit tests.

**TEST REQUIREMENTS:** Full listed flow plus failure/retry cases.

**VERIFICATION:** Run locally and in CI with ephemeral services.

**ACCEPTANCE CRITERIA:** Release gate fails for auth, tenant, migration, audit authorization, or persistence regressions.

**STOP CONDITION:** Stop if browser framework is absent; add the smallest existing-tool harness or document a separate dependency task.

### JULES-028
**TITLE:** Replace package/deploy ambiguity with a real release gate

**CONTEXT:** `package-lock.json` and `pnpm-lock.yaml` coexist; CircleCI deploy contains example placeholder text.

**OBJECTIVE:** Make install/build/lint/test/deploy verification deterministic.

**CURRENT PROBLEM:** CI can use a different dependency graph and declare a false deploy success.

**EVIDENCE:** package files and `.circleci/config.yml`.

**SCOPE:** Release configuration only.

**ALLOWED FILES:** `package.json`, selected lockfile, `.circleci/config.yml`, deployment docs.

**DO NOT TOUCH:** Runtime feature code.

**IMPLEMENTATION REQUIREMENTS:** Choose npm or pnpm; use frozen install; run lint/typecheck/tests/migrations/smoke; replace placeholder deploy with explicit integration or fail clearly; document rollback.

**SECURITY REQUIREMENTS:** No production credentials in build logs; secret validation without values.

**BACKWARD COMPATIBILITY:** Preserve supported local commands or document renamed commands.

**TEST REQUIREMENTS:** Validate CI commands on clean checkout.

**VERIFICATION:** Clean install/build/lint/test; inspect artifact and deploy status.

**ACCEPTANCE CRITERIA:** A green pipeline means the deployable artifact and required gates actually passed.

**STOP CONDITION:** Stop if deployment target is undefined; do not fake deployment, mark environment dependency blocked.

## 9. FINAL VERIFICATION PLAN

Run from a clean checkout with a disposable PostgreSQL instance, Redis test instance, explicit non-production env, and provider test doubles at the adapter boundary:

```bash
# deterministic install, using the single chosen package manager
npm ci

# static quality
npm run lint
npx tsc --noEmit

# unit/domain/service tests
npm test                 # add this script if absent, then run the repository test command
npm run test:acquisition

# database safety
npm run db:generate -- --check
npm run db:migrate       # disposable database only
npm run test:db          # migration replay, schema diff, RLS, tenant isolation

# security and hygiene
npm run security:secrets
npm run test:security    # auth, API credential, IDOR, SSRF, CSRF/header, webhook replay

# build/runtime
npm run build
npm run start
curl -i http://localhost:3000/robots.txt
curl -i http://localhost:3000/sitemap.xml
curl -i http://localhost:3000/en
curl -i http://localhost:3000/fa

# critical product smoke
# register -> verify -> login -> dashboard -> create resource -> run queued audit
# poll job -> inspect persisted result -> configure alert -> logout -> direct protected URL
```

Additional evidence checks:

- Replay canonical migrations from empty and from a representative prior schema; compare `pg_dump --schema-only` outputs.
- Run RLS tests as a non-owner role with two tenants and deliberately remove application filters in a test query.
- Verify production mode rejects missing `SESSION_SECRET`, Redis, Firecrawl, and required payment/webhook configuration where the feature needs them.
- Confirm no production route contains `Math.random()`/hardcoded intelligence/mock fallback unless explicitly behind an audited demo flag.
- Confirm every expensive external call has timeout, retry policy, rate/quota decision, SSRF-safe URL handling, tenant/user correlation, and cost telemetry.
- Run keyboard-only and axe/Lighthouse checks for `/en`, `/fa`, login, register, dashboard, free audit, monitoring, billing.
- Inspect logs for absence of cookies, auth tokens, provider keys, reset/verification tokens, raw payment payload secrets, and sensitive crawl contents.
- Verify webhook signature, replay/idempotency, out-of-order event handling, failed payment, cancellation, upgrade/downgrade, and entitlement revocation.

## 10. PRODUCT READY GATE

**READY only if every applicable item passes. Otherwise NOT READY.**

### Code and architecture

- [ ] One package manager and frozen lockfile install succeeds.
- [ ] TypeScript, lint, build, and full meaningful test suite pass.
- [ ] No broken imports, `.orig`/`.rej`/debug artifacts, or critical TODOs remain.
- [ ] Domain/application/infrastructure dependency direction is enforced.
- [ ] Production code has no unlabelled mock/random/fake product results.

### Security

- [ ] Login/registration/session expiry/logout verified end-to-end.
- [ ] Email verification and password reset are real, expiring, single-use flows.
- [ ] Every route derives identity from verified session or scoped API credential.
- [ ] No caller-controlled tenant authority or default identity remains.
- [ ] Cross-tenant reads/writes fail in app and PostgreSQL RLS tests.
- [ ] RLS policies, tenant keys, roles, and FORCE RLS coverage are proven.
- [ ] SSRF, rate limiting, quotas, abuse controls, webhook verification, safe redirects, headers, cookies, and secret hygiene pass.
- [ ] Any credentials from the supplied archive are rotated and removed from tracked content.

### Database and operations

- [ ] Canonical schema/migration system is established and deterministic.
- [ ] Empty replay and upgrade replay converge; indexes/FKs/uniques/checks are appropriate.
- [ ] No production mock/in-memory DB fallback exists.
- [ ] Transactions are request-scoped, released, rollback-safe, and concurrency-tested.
- [ ] Health/readiness, structured redacted logs, metrics, alerts, and error reporting work.
- [ ] Queue jobs are idempotent, retryable, bounded, observable, and recoverable.

### Product

- [ ] A real user can discover, register, verify, log in, onboard, configure a resource, run the core workflow, and see durable results.
- [ ] Dashboard identity/workspace/metrics are server-authoritative and tenant-correct.
- [ ] Monitoring schedules, thresholds, delivery, retries, dedupe, and alert history work.
- [ ] Billing entitlements, usage/quotas, upgrade/downgrade, cancellation, failed payment, invoices, and deletion behavior are verified or intentionally out of scope and truthfully presented.
- [ ] Privacy, terms, support/help, data export/deletion and account management are complete for the launch jurisdiction.

### AI visibility / SEO / GEO / AEO

- [ ] Prompt, model, observation, mention, competitor, citation, score, history, and alert records are real persisted data, not UI simulations.
- [ ] Technical SEO metadata, canonical URLs, sitemap, robots, structured data, crawlability, and indexability pass runtime checks.
- [ ] GEO/AEO outputs expose meaningful entity/source/citation signals and do not overclaim measurement.
- [ ] Public and private routes have correct index policy and no tenant data leakage.

### UX and accessibility

- [ ] Desktop/mobile layouts work at tested breakpoints.
- [ ] English/Persian copy, locale routing, RTL, fonts, and direction are correct.
- [ ] No hydration mismatch; loading, empty, error, success, retry, and unavailable states are explicit.
- [ ] Keyboard navigation, focus, labels, tab semantics, reduced motion, chart/canvas alternatives, and axe/Lighthouse baseline pass.
- [ ] Visual polish supports comprehension; no misleading demo identity or fabricated success state remains.

**Final decision for the supplied repository today: NOT READY.**
