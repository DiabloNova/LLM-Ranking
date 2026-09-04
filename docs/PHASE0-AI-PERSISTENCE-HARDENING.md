# Phase 0.2: AI services and in-memory persistence hardening

## Implemented

- Production `PostgresClient` now requires `DATABASE_URL`; the localhost fallback was removed.
- Connection leasing no longer activates `ALLOW_OFFLINE_DB_SIMULATION` or `MockPoolClient`.
- The unified AI repository's seeded `InMemoryDatabase` is now test-only. Its Map and array stores are disabled outside `NODE_ENV=test`, so a production request cannot read or write process-local persistence.
- Legacy static Map stores in the admin PostgreSQL adapter now use disabled stores outside tests.
- Admin mock database construction is blocked outside tests.
- Google Generative AI is the only production LLM/embedding path. Deterministic LLM and embedding doubles remain available only for automated tests.
- Graph extraction fails closed when a real provider is not configured.
- Sentiment analysis no longer converts invalid provider output into a fabricated neutral result.
- AI visibility provider selection no longer defaults to a mock engine and rejects explicit mock selection outside tests.
- AEO content analysis now requires a real configured brand and real page content, and no longer injects synthetic website content or fake provider provenance.
- Observation processing no longer hardcodes Acme/Rasha entities or creates synthetic brand mentions. Citations are derived only from URLs present in the provider response.
- Generated IDs in observation processing use `crypto.randomUUID()` rather than pseudo-random strings.

## Intentionally retained

Maps used for request-local algorithms, graph traversal, deduplication, host locks, event handlers and cache coordination are not persistence stores. They remain bounded/transient and must not be used as a substitute for PostgreSQL.

Test doubles remain in AI modules so unit tests can run deterministically. They are selected only when `NODE_ENV=test` or through an explicit test-only injection path.

## Verification

- Removed database offline driver path and localhost database default.
- Verified unified AI repository Map/array fields use test-only persistence guards.
- Verified modified files have balanced braces.
- Full lint, typecheck, tests and production build were not executable in this environment because dependencies are not installed.

## Remaining product work

The repository still contains several AI feature services with hardcoded baseline assumptions and some action-level synthetic seed data. Those should be migrated feature-by-feature to PostgreSQL queries and provider-backed evidence before their routes are enabled for paid customers.
