# AGENTS.md — SEOrchable

Instructions for coding agents (Jules, Codex, Copilot, Cursor) working in this repository.
**The user prompt defines the task. This file defines the non-negotiable constraints.**

---

## 1. Project facts

- **Stack:** Next.js 16.2.11 (App Router) · React 19.2.4 · TypeScript strict · Drizzle ORM 0.45 + PostgreSQL · Inngest (jobs) · Upstash Redis (cache + rate limit) · Zod · Tailwind v4
- **Product:** multi-tenant AEO / GEO / SEO intelligence platform. Tenants are `organizations`; isolation is enforced by PostgreSQL RLS driven by `app.current_tenant_id`.
- **Locales:** `fa` (RTL, default) and `en` (LTR), routed as `src/app/[locale]/**`.
- **Package manager:** `pnpm` (`pnpm-lock.yaml` is authoritative; `package-lock.json` is stale, do not use `npm install`).

### Directory map

| Path | Contents |
|---|---|
| `src/app/[locale]/**` | Marketing + dashboard pages |
| `src/app/api/**` | HTTP route handlers |
| `src/app/actions/**` | Server Actions |
| `src/services/**` | Cross-cutting services (auth, crawler, AI, cost control) |
| `src/features/**` | Vertical feature modules (domain / application / infrastructure) |
| `src/core/**` | Database, cache, container, tenant context |
| `database/schema/**` | Drizzle table definitions (source of truth) |
| `database/drizzle/**` | **Canonical, journalled migration chain — the only one applied.** See `database/drizzle/README.md` |
| `database/migrations/**` | Frozen historical record. Executed by nothing; never add files here. See `database/migrations/README.md` |
| `docs/**` | Product and architecture documentation |

---

## 2. Commands

```bash
pnpm install                 # install dependencies
pnpm dev                     # dev server
pnpm build                   # runs scripts/generate-docs-data.ts, then next build
pnpm lint                    # eslint
pnpm exec tsc --noEmit       # type check (no dedicated script exists)
pnpm test:acquisition        # acquisition feature test runner
pnpm db:generate             # drizzle-kit generate (migration authoring only)
pnpm db:migrate              # apply database/drizzle/** (MIGRATION_DATABASE_URL, falls back to DATABASE_URL)
```

Before declaring a task complete you MUST run `pnpm exec tsc --noEmit` and `pnpm lint`.
If a command cannot run, say so explicitly and state why. Never claim a check passed without executing it.

---

## 3. Next.js version warning

The installed Next.js is newer than most training data. **Read `node_modules/next/dist/docs/` before writing Next.js-specific code.** Do not rely on remembered Next 13/14 APIs. Honour deprecation notices.

---

## 4. Hard prohibitions

An agent MUST NOT, under any circumstances:

1. **Fabricate data.** No `return mockData`, no `Math.random()` standing in for persisted values, no `try { db() } catch { return fakeData }`, no hardcoded "example" API responses in a production code path. Mocks are permitted **only** in `tests/**` and in dev-only paths gated by an explicit `process.env.NODE_ENV !== "production"` check.
2. **Invent repository facts.** No invented table, column, repository method, service, API contract, env var, or config key. If you cannot verify it in the repository, **STOP and report `BLOCKED — INSUFFICIENT EVIDENCE`**, naming the exact missing evidence.
3. **Weaken a security boundary.** Never remove, bypass, or loosen an authentication check, authorization check, tenant filter, RLS policy, or input validator to make something work.
4. **Trust a client-supplied identity.** `x-tenant-id`, `x-user-id`, `tenant_id` cookie and any request body field are untrusted input. Resolve identity through `authorizeApiRequest(req)` from `src/services/auth/authorization.ts`, or through `requireSession()` for Server Actions.
5. **Fail open.** When the database, tenant context, or a required external service fails, the request must fail with a visible error. Never downgrade a failure into an empty result, a success response, stale data, or demo data.
6. **Touch secrets.** Never print, log, commit, or quote the value of any env var, `.env` content, connection string, token, or key. Reference variable *names* only.
7. **Use `MIGRATION_DATABASE_URL` at runtime.** It is for the migration script only. `DATABASE_URL` is the runtime connection. Migrations never run during `next build`, deploy, or app startup.
8. **Expand scope.** Modify only files the prompt authorizes. Discovered problems get reported, not fixed.

---

## 5. Task protocol

1. **Restate** the objective and the authorized file scope in one line.
2. **Inspect** the real implementation before editing. Trace consumers of anything you change.
3. **Plan** in concrete steps grounded in what you read.
4. **Implement** the smallest correct change.
5. **Verify** with `pnpm exec tsc --noEmit`, `pnpm lint`, and any relevant tests.
6. **Review** your own diff; delete debug code, unused imports, and stray files.
7. **Report** using the template in §8.

**One task per session.** Do not start the next roadmap item, even if it is obvious. Stop and report.

---

## 6. Coding rules

**Server / client boundary**
- Do not add `"use client"` unless the file needs state, effects, refs, browser APIs, or event handlers.
- A `"use client"` file cannot export `metadata` or `generateMetadata`. Pages needing metadata must be Server Components with interactive parts extracted into small client islands.
- Secrets, DB access, and privileged logic stay server-side. Only `NEXT_PUBLIC_*` vars may reach the client.

**API routes**
- Validate every input with Zod.
- Resolve identity with `authorizeApiRequest(req)`; return `401`/`403` from `AuthorizationError.statusCode`.
- Any route that spends money (Firecrawl, LLM tokens, crawl compute) must be rate limited via `src/lib/rate-limit.ts` before the spend occurs.
- Status codes: `400` invalid input · `401` unauthenticated · `403` unauthorized · `422` valid input, unprocessable · `429` rate limited · `502` upstream failure · `503` dependency unavailable · `500` unexpected.
- Never return an upstream error message or stack trace to the client.

**Database**
- Table definitions live in `database/schema/**`. Never write raw DDL in application code.
- Schema change = Drizzle definition **plus** a migration. Both, in the same change.
- Every tenant-scoped query runs inside `TenantContextManager.runWithTenantContext(...)`.
- Long-running work (LLM calls, crawls, heavy processing) goes to Inngest, never inline in a route handler.

**UI**
- Both locales must keep working: `fa` RTL and `en` LTR. Both themes must keep working: light and dark.
- Use existing design tokens, semantic colours, and components. Do not introduce a parallel visual system.
- All raster images go through `next/image` with explicit dimensions and a meaningful `alt`.
- Use the existing localization mechanism. No hardcoded user-facing strings.

**Dependencies**
- Do not add a dependency without checking that the repo cannot already do it. Do not upgrade anything the task does not require.

---

## 7. Do not edit

| Path | Reason |
|---|---|
| `src/lib/docsIndex.ts` | Generated by `scripts/generate-docs-data.ts` at build time |
| `database/drizzle/meta/**` | Drizzle-managed snapshots |
| `pnpm-lock.yaml`, `package-lock.json` | Only via a package manager command |
| `node_modules/**` | Read for documentation only |
| `.env`, `.env.*` | Never read out, never commit |
| `next-env.d.ts` | Generated |

---

## 8. Required report format

```
## Objective
<one line>

## Files changed
<path> — <what and why>

## Evidence
Tables/columns touched:
Repository or query used:
Tenant boundary:
Authorization behaviour:
Error behaviour on dependency failure:

## Verification
pnpm exec tsc --noEmit  -> <exit status / output summary>
pnpm lint               -> <exit status / output summary>
tests                   -> <which, exit status>

## Out of scope but discovered
<list, or "none">

## Remaining limitations
<list, or "none">
```

If blocked, replace the body with:

```
BLOCKED — INSUFFICIENT EVIDENCE
Missing evidence: <exact table/column/method/contract>
Files searched: <paths>
What would unblock this: <specific artefact needed>
```

---

## 9. Definition of done

- Objective met, nothing more.
- No security boundary weakened; no fabricated data introduced.
- `tsc --noEmit` and `lint` executed and reported.
- Both locales and both themes still function (for UI changes).
- No secrets added; no unrelated files touched.
- Diff self-reviewed; report accurate.

**When uncertain: inspect. When docs and code disagree: trust the code. When evidence is missing: BLOCK. When a change is not required: do not make it.**
