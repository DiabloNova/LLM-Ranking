# API Documentation

This section describes the application's API surface.

## Status Dictionary
- **Implemented**: API endpoint is verified and functional.
- **Partial**: API endpoint is in development or missing edge case handling.
- **Planned**: Endpoint is not currently implemented.

## Overview

Developer API endpoints under `src/app/api/v1/` utilize the `authorizeApiRequest` function to securely resolve user and tenant contexts, prioritizing validated server sessions over client-provided request headers.

### Knowledge Graph API
- **Endpoint**: `/api/v1/knowledge-graph/query`
- **Behavior**: Secured via server sessions, `TenantContextManager`, and `EntityService` lookups. Evaluates entities and relationships.
- **Status**: *Implemented*

### Dashboard Analytics API
- **Endpoint**: `/api/v1/dashboard/summary/`
- **Behavior**: Standardised refreshes for aggregated metrics via a transaction-safe tenant pipeline.
- **Status**: *Implemented*

### Competitive API
- **Endpoint**: `/api/v1/analysis/competitive`
- **Behavior**: Aggregates and benchmarks competitive SEO and AI visibility intelligence across dimensions.
- **Status**: *Implemented*

### LLM Analytics API
- **Endpoint**: `/api/v1/analytics/llm/route.ts`
- **Behavior**: Retrieves LLM output analytics. Fails closed with an explicit 500 error response when JSON parsing fails or response structure is invalid, rather than returning mock data.
- **Status**: *Implemented*

## Server Actions
In Next.js, many interactions are handled securely via Server Actions (e.g., `ingestDocumentAction`, `queryKnowledgeGraphAction`, `loginAction`, `registerAction`) rather than traditional REST APIs. These resolve user identity and tenant context strictly from the server-validated session, completely bypassing unsigned/client-provided cookies.
