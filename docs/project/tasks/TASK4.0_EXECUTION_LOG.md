# Task 4.0 execution log

## Scope

This log records the unified crawl acquisition implementation on branch
`main`. No commit or push was made. The PostgreSQL 16 verification container
is intentionally left running.

## Chronology and changed areas

1. Added domain contracts, URL normalization, policy validation, state
   transitions, identity keys, SSRF validation, and bounded safe fetching.
2. Added acquisition unit suites, including pinned-DNS socket tests.
3. Added standalone `0004_crawl_acquisition.sql` with text tenant IDs, RLS,
   active-job partial deduplication, cache/result constraints, and
   `SECURITY DEFINER` dispatcher functions.
4. Added tenant-aware job, result, cache, and dispatcher repositories and
   repository-driven PostgreSQL integration tests.
5. Added carry-over tenant predicates, retry classification correction, and
   atomic terminal completion facts.
6. Added provider contracts, internal bounded HTTP provider, Firecrawl
   adapter, provider router, orchestrator, worker, authenticated crawl API,
   architecture documentation, and this log.
7. Closed handoff-3 failures C1-C12: explicitly queued submitted jobs;
   stopped non-fallback router errors from reaching another provider; added a
   global retry deadline, abortable backoff, and retry-after floors; moved
   provider execution outside worker transactions; routed completion through
   lease ownership; corrected lifecycle event semantics; corrected API status
   and not-found responses; added observed concurrency/rate-limit tests;
   defined worker cancellation/shutdown behavior; added repository-backed
   end-to-end execution and cache-hit coverage; propagated Firecrawl job IDs
   and cancellation; and updated this documentation.

## Persistence

Migration `0004_crawl_acquisition.sql` creates `crawl_jobs`, `crawl_results`,
and `crawl_cache`; enables and forces RLS; uses `TEXT` tenant IDs; adds the
active partial dedup index, queued claim index, provider and tenant indexes,
cache key uniqueness, and one-result-per-job constraints. Cache rows are
tenant scoped and store normalized results.

Dispatcher functions are `SECURITY DEFINER`, set
`search_path = pg_catalog, public`, revoke public execution, and grant execute
to `crawler`. Deployment requires table ownership to remain with a role able
to bypass RLS while the application role remains non-owner and lacks
`BYPASSRLS`.

The verified local role shape is: crawl tables owned by `postgres`
(`rolsuper=true`, `rolbypassrls=true`), application role `crawler`
(`rolsuper=false`, `rolbypassrls=false`), with `USAGE` on `public`, table
`SELECT/INSERT/UPDATE/DELETE` grants, sequence `USAGE/SELECT` grants, and
explicit `EXECUTE` on the dispatcher functions. The integration suite invokes
the dispatcher as `crawler` and verifies cross-tenant claim rows are returned
by the security-definer function.

## Verification record

The final provider/API/worker verification produced:

```text
$ npx tsx tests/features/acquisition/run-all.ts
✅ acquisition suites passed

$ DATABASE_URL='postgresql://crawler:***@127.0.0.1:55432/seorchable' \
  npx tsx tests/features/acquisition/integration/run-all.ts
✅ acquisition integration suites passed

$ pnpm exec eslint src/features/acquisition tests/features/acquisition src/app/api/v1/crawl scripts
passed with no diagnostics

$ pnpm lint
✖ 227 problems (82 errors, 145 warnings)

$ pnpm exec tsc --noEmit
failed on pre-existing diagnostics in analytics, auth, ingestion, and RAG tests;
no diagnostics were reported in acquisition, crawl API, worker, or acquisition tests

$ pnpm build
✓ Compiled successfully
✓ Finished TypeScript
✓ Generating static pages
```

The full lint baseline remains 82 errors and 145 warnings. The TypeScript
failures are unrelated existing test diagnostics.

The integration suite now submits a job through the orchestrator, claims it
through the dispatcher, executes the internal provider against a local HTTP
server, verifies terminal state and persisted result, and submits again to
observe a cache hit. The unit suite observes worker-pool concurrency and
same-host request spacing rather than only checking completion.

Known limitation: the Firecrawl SDK adapter accepts an abort signal at the
boundary, but whether an SDK implementation stops an already-started remote
poll is provider-client dependent; no secret or provider payload is exposed.

## Security finding

`POST /api/v1/crawler/start` takes tenant identity from unauthenticated
`x-tenant-id`, accepts user-supplied seed URLs, and passes them to
`CrawlerOrchestrator` without SSRF validation. It is deliberately untouched
because it is out of Task 4.0. The new `/api/v1/crawl` boundary requires a
real session and validates URLs before provider selection. The repository as a
whole is therefore not SSRF-safe. Remediate the legacy route in a follow-up.
