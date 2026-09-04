# Applied fixes — file manifest

Every file in this archive is a **complete replacement or new file**, ready to drop into the
repository at the path shown. Paths are relative to the repository root.

> **Not verified by compilation.** These were written against the real source but `node_modules`
> was not available, so `tsc --noEmit` could not be run. Run `pnpm exec tsc --noEmit` and
> `pnpm lint` after applying, before committing.

---

## New files

| Path | What it does |
|---|---|
| `src/app/robots.ts` | `/robots.txt`. Non-production disallows everything. Production allows general crawlers plus 12 answer-engine crawlers (GPTBot, PerplexityBot, ClaudeBot, …) and disallows `/api/` and every authenticated surface in both locales. Points at the sitemap. Domain read from `siteConfig`. |
| `src/app/sitemap.ts` | `/sitemap.xml`. 15 static routes × 2 locales, plus all 9 service slugs and every docs slug, each with `fa`/`en` hreflang alternates. Dashboard, settings, profile, invoice and auth routes excluded. |
| `src/lib/rate-limit.ts` | Upstash-backed fixed-window limiter. **Fails closed**: no Redis in production means 503, not an allowed request. In-process fallback gated on `NODE_ENV !== "production"`. Rule registry for the five metered paths. |
| `src/lib/password.ts` | scrypt hashing (N=16384, r=8, p=1, 64-byte key, 16-byte salt) with a self-describing storage format so cost can be raised later. `timingSafeEqual` verification, policy validation returning localizable violation codes, rehash detection, and a dummy-verification helper for timing equalisation. **Zero new dependencies.** |
| `src/components/seo/JsonLd.tsx` | Server-only JSON-LD emitter with `</script>` breakout escaping, plus builders for Organization, WebSite, SoftwareApplication, Product/Offer, FAQPage and BreadcrumbList. `pricingSchema` takes offers as a parameter: no hardcoded prices. |
| `database/migrations/0019_user_credentials_and_webhook_idempotency.sql` | Adds `password_hash`, `password_updated_at`, `failed_login_attempts`, `locked_until` to `users`, plus a unique index on `lower(email)`. Creates `processed_webhook_events` for webhook idempotency. Idempotent, wrapped in a transaction. |
| `AGENTS.md` | Replacement guardrails, rewritten for agent adherence. |
| `readme.md` / `readme-eng.md` | Persian and English project overviews. |
| `docs/ROADMAP.md` | The 53-step Jules prompt program. |

---

## Replaced files

### `src/services/auth/session.ts`
`SESSION_SECRET` was resolved at module load with a `crypto.randomBytes(32)` fallback, so every
instance minted its own key and cookies signed by one instance failed on every other one.

Now lazily resolved and cached. Production runtime throws if it is missing or under 32 characters.
The `next build` page-data-collection phase is exempted via `NEXT_PHASE`, which is what the old
fallback was actually trying to solve. Exports `assertSessionConfiguration()` for boot/health
checks. Cookie format, HMAC, expiry and every public function's behaviour are unchanged.

### `src/app/actions/auth.ts`
`loginAction(email)` looked the user up by email and immediately issued a session. No credential
check existed, and none was possible: the schema had no credential column.

Now `loginAction(email, password)`:
- selects explicit columns including `password_hash` (no more `SELECT *`)
- matches on `lower(email)`
- verifies via `verifyPassword` before anything else happens
- returns the **identical** error for unknown email and wrong password
- runs `performDummyVerification()` when no row is found, so latency does not leak existence
- transparently upgrades weak hashes after a successful login

`registerAction(name, email, password)` validates the policy before any write and stores a hash.
`requestPasswordResetAction` is preserved with a comment marking the unpersisted-token limitation.

⚠️ **Breaking call sites:** `AuthProvider.login/register`, the login page and the register page all
still pass the old argument counts. See roadmap task **T1.5**.
⚠️ **Requires migration 0019** to be applied first.

### `src/app/api/v1/crawler/start/route.ts`
Read `x-tenant-id` straight off the request and treated it as tenant identity. No session, no
membership check. Anyone could start crawl jobs against any tenant.

Now: identity only from `authorizeApiRequest(req)`, per-tenant rate limit before the orchestrator
is constructed, `seedUrls` capped at 50, rate-limit headers on every response path, and the raw
error message no longer leaks in the 500 body.

### `src/app/api/v1/audit/premium/route.ts`
Four entangled defects, all fixed:
1. **Access control** — `x-tenant-id` header plus a `"usr-premium-default"` user id, both gone.
   Identity now comes from `authorizeApiRequest`.
2. **Mock mode** — the three hardcoded fake Persian pages served when `FIRECRAWL_API_KEY` was
   missing are gone. Missing key now returns 503.
3. **Fake fallbacks** — a Firecrawl failure now returns 502 (was: a fabricated page). Zero pages
   returns 422. An LLM failure now returns `recommendations: []` plus
   `semanticAnalysisUnavailable: true` (was: hardcoded Persian recommendations presented as
   analysis). LLM output is validated item by item and capped at 20.
4. **Silent write loss** — a failed `premium_audits` INSERT now returns 500 instead of logging and
   continuing. `created_by`/`updated_by` carry the real user id instead of `'system'`.

Also: `semanticCoverage` scores 0 without real analysis and the overall score is renormalised
across the remaining weights rather than being dragged down by a missing component.

⚠️ **Breaking response change:** the `competitorComparison` block is removed. Its
`industryAverage: 68` and `topCompetitor: 88` were fabricated constants. `auditId` is now returned.
Grep the frontend for `competitorComparison` before shipping.

### `src/features/admin/infrastructure/persistence/postgres/index.ts`
Two silent-failure paths removed, one class added.

- Added `DatabaseUnavailableError` (statusCode 503) and `isConnectivityError()` covering libpq
  socket codes and PostgreSQL SQLSTATE connection classes.
- `connectClient()` no longer substitutes a `MockPoolClient` on any connection failure. It throws.
  The offline driver now requires **both** `NODE_ENV !== "production"` **and**
  `ALLOW_OFFLINE_DB_SIMULATION === "true"`.
- `query()` no longer returns a fabricated `{ rows: [], rowCount: 0 }` from its catch block.
  Connectivity errors become `DatabaseUnavailableError`; everything else rethrows.
- `MockPoolClient.query()` no longer masks `ECONNREFUSED` as an empty success.

Everything else in the 1380-line file, including the `Object.create` prototype wrapping, the
tenant-scope guards and every repository class, is untouched.

⚠️ Routes that previously never saw an exception can now throw. See roadmap task **T3.5** for the
error-boundary rollout.

### `src/core/database/tenant-context/index.ts`
`runWithTenantContext` caught the connection failure, logged `"creating fallback mock client"`, and
then created nothing: it continued with `leasedClient === null`, so `BEGIN` and
`set_config('app.current_tenant_id', …)` were both skipped and tenant work ran **outside its RLS
boundary**. The log message described behaviour that did not exist.

Now it logs and rethrows, then throws `TenantContextViolationException` if the client is still
falsy. The misleading comment is replaced with an accurate one.

### `database/schema/organization.ts`
Adds `passwordHash`, `passwordUpdatedAt`, `failedLoginAttempts` and `lockedUntil` to the `users`
table, matching migration 0019. `passwordHash` is nullable with a comment stating that NULL means
"cannot authenticate with a password" and must never mean "any password accepted".

### `.env.example`
Documents `SESSION_SECRET` (previously absent entirely, which is why it was easy to deploy without
it), `PAYMENT_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_ENV`, and states the production consequence of
omitting each variable.

---

## Apply order

Order matters. The auth changes will not run against an unmigrated database.

1. `AGENTS.md`, `.env.example`, `readme.md`, `readme-eng.md`, `docs/ROADMAP.md` — no code impact
2. `database/migrations/0019_*.sql` + `database/schema/organization.ts` — **run the migration**
3. `src/lib/password.ts`, `src/lib/rate-limit.ts` — new, no consumers yet
4. `src/services/auth/session.ts` — set `SESSION_SECRET` in every environment first
5. `src/app/actions/auth.ts` — **typecheck breaks here** until the client layer is updated (T1.5)
6. `src/app/api/v1/crawler/start/route.ts`, `src/app/api/v1/audit/premium/route.ts`
7. `src/features/.../postgres/index.ts`, `src/core/database/tenant-context/index.ts` — expect new
   exceptions to surface at route boundaries
8. `src/app/robots.ts`, `src/app/sitemap.ts`, `src/components/seo/JsonLd.tsx` — additive

---

## Deliberately not fixed here

These need repository-wide changes or product decisions, so they are roadmap tasks rather than
drop-in files:

- Converting 48 client-component pages to Server Components with per-page metadata (**T4.5–T4.12**)
- The memoization pass, which is only worth doing after those pages are split (**T5.2**)
- Payment webhook idempotency logic (the table ships in 0019; the handler is **T2.7**)
- Password reset and email verification token persistence (**T1.8**, **T1.9**)
- Repository hygiene: logs, scratch scripts, the committed `.env`, `index.ts.tmp2` (**T0.1**, **T0.2**)
- `next/image` migration and a11y lint enforcement (**T5.3**)
