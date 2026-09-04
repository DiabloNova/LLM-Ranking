# Crawl acquisition

The acquisition feature separates request validation, durable scheduling, and
provider execution. A request is normalized, policy-checked, and SSRF
validated before a job is created or a provider is selected. The internal
provider uses the pinned-DNS `safeFetch` client and performs bounded,
non-browser HTML traversal. The Firecrawl adapter is isolated under
`infrastructure/providers/firecrawl/`; Firecrawl SDK types do not cross into
the domain.

## Domain and providers

`CrawlRequest`, `CrawlResult`, `CrawledDocument`, and `CrawlProvider` are
provider-neutral contracts. A provider declares capabilities and executes a
normalized request with an `AbortSignal`. `ProviderRouter` only falls back
when the `CrawlError` classification explicitly permits it. No Firecrawl key
is required: without one, the internal provider is used.

## Security model

URLs are normalized, policy-validated, and resolved through the SSRF guard
before provider selection. Internal HTTP requests pin the validated addresses
in the socket lookup callback and revalidate every redirect hop. They do not
send cookies or authorization headers, execute JavaScript, or retain sessions.
The Firecrawl service fetches from its own infrastructure, so the local pinned
DNS guarantee does not extend to it. The application boundary is that a URL
that failed local validation is never handed to any provider.

The new `/api/v1/crawl` route requires an actual signed session and derives
tenant identity from that session. It does not accept `x-tenant-id` or
`x-user-id` as identity.

The legacy `POST /api/v1/crawler/start` route remains vulnerable and is
deliberately untouched because it is outside Task 4.0. It accepts tenant
identity from an unauthenticated `x-tenant-id` header, accepts user-provided
seed URLs, and passes them to `CrawlerOrchestrator` without SSRF validation.
Follow-up remediation should require a real session, route all URLs through
the acquisition SSRF boundary, and retire the legacy path.

## Deduplication, cache, and lifecycle

Deduplication keys include tenant, canonical URL, and material policy fields.
The active-job partial unique index covers only `PENDING`, `QUEUED`, and
`RUNNING`, so terminal jobs can be recrawled. Cache entries are tenant-scoped
only; global sharing is deferred until a result is proven globally shareable.
The cache stores normalized results, not provider payloads.

Jobs move through the domain state machine with optimistic versions. Dispatcher
claim and expired-lease recovery are narrow `SECURITY DEFINER` functions that
return only job and tenant identities. The application role must not own crawl
tables and must not have `BYPASSRLS`. The function owner must be a superuser or
have `BYPASSRLS`. Every subsequent job operation establishes tenant context.

Submission explicitly transitions a newly inserted `PENDING` job to `QUEUED`;
the dispatcher claims queued jobs only. Provider execution happens outside
tenant transactions. Heartbeats and terminal writes use independent short
transactions, and terminal completion is lease-owner guarded. Cancellation
observed by the worker aborts the provider signal; shutdown aborts active work
and fails it through the same lease-owner guard.

Terminal completion facts are written atomically with the conditional status
transition: provider identifiers, duration, counts, cache outcome, result
reference, and structured error.

The internal provider uses a bounded worker pool and serializes requests per
host to enforce `perHostRequestsPerSecond`. Firecrawl provider job IDs are
persisted when supplied by the adapter, and abort signals are passed through
the adapter boundary. Firecrawl SDK polling cancellation remains dependent on
the SDK/client honoring that signal.

## Observability and future providers

Crawl lifecycle events use the existing `coreEventBus` and carry tenant,
request, trace, correlation, job, and provider-job identifiers. Secrets,
cookies, tokens, and raw page content are never event payloads.

To add a provider, implement `CrawlProvider` in infrastructure, map all
external failures to `CrawlError`, declare capabilities, add adapter tests at
the external boundary, and place it in the ordered router only after its SSRF
and fallback behavior are reviewed.
