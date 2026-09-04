# Service Documentation

This section describes the internal application services, their boundaries, and responsibilities.

## Status Dictionary
- **Implemented**: Verified existing service.
- **Partial**: Service exists but is missing functionality.
- **Planned**: Not currently implemented.

## Core Services

### Asynchronous Job Processing (`src/services/jobs/`)
Defines a canonical, infrastructure-agnostic background processing boundary via `IJobQueue`, `IJobExecutor`, and `IJobRepository` interfaces, backed by a state-machine driven `JobService` enforcing tenant-scoped idempotency, exponential backoff retries, and strict lifecycle transitions.
*Status: Implemented*

### Cache Service (`src/services/cache/`)
Implements `InMemoryCacheStore`, `CacheService`, and promise deduplication, secured against client-side tenantId spoofing by validating that any requested key's tenant ID strictly matches the server-verified active session user's workspace ID.
*Status: Implemented*

### Cost Governance (`src/services/cost-control/`)
Models real AI-provider capabilities by explicitly classifying models into pricing modes ("paid", "free_tier", "self_hosted", "unknown") and enforcing geographic availability restrictions.
*Status: Implemented*

### Diagnostic Engine (`src/services/diagnostic-engine/`)
Evaluates evidence-backed diagnostics across 7 domains (Technical, Content, SEO, AEO, Entity, Citation, Competitive). Segregates severity and confidence, performs dynamic Root-Cause Analysis (RCA) dependencies, and handles historical regressions.
*Status: Implemented*

### AI Intelligence Services (`src/features/ai-intelligence/services/`)
A collection of engines including:
- `ai-visibility-audit-engine.ts`
- `competitor-discovery-service.ts`
- `content-brief-engine.ts`
- `content-gap-engine.ts`
- `keyword-intelligence-service.ts`
- `site-architecture-analyzer-service.ts`
- `aeo-content-intelligence-service.ts`
*Status: Implemented*
