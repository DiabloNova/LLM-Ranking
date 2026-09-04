Infrastructure Remediation & Production Readiness Plan

Purpose

This document defines a dedicated remediation program for resolving the infrastructure, database, security, runtime, asynchronous processing, and production-data issues identified in:

"docs/audit/INFRA_READINESS_AUDIT.md"

This is a standalone remediation program and is not part of the main product development roadmap or Phase 9/Phase 10 task sequence.

The existing infrastructure audit is considered authoritative. No additional audit, discovery, inventory, or architectural review is required before executing the tasks defined below.

---

Execution Principles

1. The existing infrastructure audit is the source of truth for the remediation scope.
2. Remediation tasks must be executed sequentially.
3. Each task must be completed, tested, and verified before the next task begins.
4. Existing working architecture must not be unnecessarily rewritten.
5. Database schema integrity and tenant isolation must take priority over application-level convenience.
6. Production secrets must never be committed to the repository or exposed to development agents.
7. Long-running operations must not execute synchronously inside Serverless API request lifecycles.
8. Production application paths must not rely on mock, random, hardcoded, or in-memory substitute data.
9. Every remediation must include automated verification appropriate to the affected subsystem.
10. Changes must remain scoped to the current remediation task; unrelated refactoring is prohibited.

---

REMEDIATION PROGRAM

Task R1 — ORM & Database Migration Consolidation

Objective

Establish a consistent and reproducible database migration architecture using Drizzle and resolve the existing migration/schema inconsistencies identified by the infrastructure audit.

Scope

- Install and configure:
  - "drizzle-orm"
  - "drizzle-kit"
  - "tsx"
- Configure Drizzle migration tooling.
- Standardize database-related package scripts.
- Establish the authoritative Drizzle schema representation.
- Reconcile the existing database schema definitions with the migration system.
- Generate migrations for all currently missing tables identified by the audit.
- Ensure the 21 missing tables are represented in the migration chain.
- Correct migration dependency ordering.
- Resolve Foreign Key dependencies so referenced tables always exist before dependent tables are created.
- Preserve required indexes, constraints, extensions, defaults, and database-level behavior.
- Remove or consolidate obsolete/conflicting migration definitions where necessary.
- Ensure a fresh database can be bootstrapped deterministically from the migration chain.

Required Package Scripts

The project must provide reliable Drizzle-based commands for:

- Schema generation
- Migration generation
- Migration execution
- Database push where appropriate for development

The exact commands must follow the repository's final Drizzle configuration and must not introduce multiple competing migration mechanisms.

Migration Requirements

The final migration structure must:

- Be executable against an empty PostgreSQL database.
- Respect all table dependencies.
- Create referenced tables before Foreign Keys referencing them.
- Preserve required PostgreSQL extensions.
- Preserve required indexes and constraints.
- Preserve existing tenant/security-related database behavior.
- Avoid destructive changes unless explicitly required by the existing schema.
- Be reproducible across development and deployment environments.

Validation

The task is complete only when:

- Dependencies install successfully.
- Drizzle configuration works.
- Migration generation works.
- Migration execution works.
- A clean Neon development database can be initialized successfully.
- All required tables are created.
- All required Foreign Keys are valid.
- No migration fails because of table ordering.
- Application database access remains functional.
- Existing database tests pass.

Deliverable

A stable, reproducible Drizzle-based database migration foundation suitable for Neon.

---

Task R2 — Database Security & RLS Enforcement

Objective

Complete PostgreSQL Row-Level Security enforcement for all tenant-scoped tables identified by the infrastructure audit.

Scope

- Implement RLS for the 15 tables identified as lacking appropriate RLS protection.
- Define tenant-isolation policies using:

"app.current_tenant_id"

- Ensure policies correctly distinguish tenant-owned records from global/system records where applicable.
- Apply "FORCE ROW LEVEL SECURITY" where required.
- Preserve the existing tenant context architecture.
- Do not unnecessarily rewrite the existing "TenantContextManager".
- Ensure background and repository-based database access remains compatible with RLS.

Security Requirements

Tenant-scoped tables must prevent:

- Cross-tenant SELECT access.
- Cross-tenant INSERT.
- Cross-tenant UPDATE.
- Cross-tenant DELETE.

Where applicable, INSERT and UPDATE policies must verify that the record's tenant identifier matches the active tenant context.

Application Role Requirements

The application database role must not be able to bypass tenant isolation through ordinary application access.

RLS enforcement must therefore exist at the PostgreSQL layer rather than relying exclusively on application-level filtering.

Validation

The task is complete only when automated tests demonstrate:

- Tenant A cannot read Tenant B's records.
- Tenant A cannot modify Tenant B's records.
- Tenant A cannot delete Tenant B's records.
- Tenant A cannot create records belonging to Tenant B.
- Authorized same-tenant operations continue to work.
- Existing global/system records behave according to their intended access model.
- RLS remains effective through repository and service layers.

Deliverable

Complete PostgreSQL-level tenant isolation across all applicable tables.

---

Task R3 — Environment, Authentication & Runtime Configuration Hardening

Objective

Normalize environment configuration and eliminate authentication/session instability in Serverless environments.

Scope

Session Configuration

- Add "SESSION_SECRET" to ".env.example".
- Ensure production authentication requires a stable secret.
- Remove insecure or non-persistent runtime fallback behavior.
- Ensure session behavior is compatible with Serverless execution.
- Ensure separate deployments can maintain consistent session verification behavior.

Google AI Configuration

Standardize the Google AI API key variable to:

"GOOGLE_AI_API_KEY"

Update all affected:

- AI services
- API integrations
- environment examples
- configuration modules
- tests
- documentation where applicable

Remove obsolete or conflicting Google AI variable names.

Environment Cleanup

Remove obsolete environment variables such as:

"MIGRATION_DATABASE_URL"

unless the final architecture explicitly requires them.

Ensure ".env.example" represents only variables that are genuinely required by the current architecture.

Security Requirements

- No real credentials may be committed.
- No secrets may be hardcoded.
- No secret values may appear in logs.
- Server-side secrets must remain server-side.
- Environment naming must be consistent across development, preview, and production configuration.

Validation

The task is complete only when:

- Authentication works consistently in Serverless execution.
- Sessions remain verifiable across separate requests.
- Google AI services resolve the standardized environment variable.
- No obsolete environment variable is required by runtime code.
- Environment validation succeeds.
- Relevant authentication and AI integration tests pass.

Deliverable

A clean, deterministic, Serverless-safe runtime configuration.

---

Task R4 — Asynchronous Job Infrastructure with Upstash Redis

Objective

Move long-running crawling and complex AI operations out of synchronous Serverless API request lifecycles and establish a durable asynchronous processing architecture.

Scope

- Integrate Upstash Redis as the queue/transport layer.
- Introduce a persistent Job model/state representation in Neon.
- Move long-running Firecrawl operations out of API Routes.
- Move long-running AI processing out of synchronous request handlers where applicable.
- Implement background workers.
- Preserve tenant context throughout asynchronous execution.

Job Lifecycle

Jobs must support the following states:

PENDING
   ↓
PROCESSING
   ↓
COMPLETED

or:

PENDING
   ↓
PROCESSING
   ↓
FAILED

Additional states may be introduced only when justified by the implementation.

API Behavior

API Routes responsible for long-running operations must:

1. Validate the request.
2. Authenticate the user.
3. Resolve the tenant.
4. Create a persistent Job record.
5. Enqueue the Job.
6. Return immediately with the Job identifier and current status.

The API Route must not wait for the complete crawling or AI operation.

Worker Responsibilities

The Worker must:

- Consume queued jobs.
- Validate job ownership and tenant context.
- Transition jobs from "PENDING" to "PROCESSING".
- Execute the long-running operation.
- Persist progress where appropriate.
- Persist successful results.
- Transition successful jobs to "COMPLETED".
- Capture failures.
- Persist meaningful error information.
- Transition failed jobs to "FAILED".
- Support controlled retry behavior.
- Avoid duplicate processing.

Reliability Requirements

The queue architecture must provide:

- Idempotent job execution.
- Controlled retries.
- Failure recovery.
- Duplicate execution protection.
- Persistent job state.
- Tenant-aware processing.
- Safe handling of worker crashes.
- No dependency on in-memory process state for durable job status.

Tenant Isolation

Background workers must not bypass the established tenant isolation architecture.

The worker must establish the appropriate tenant context before accessing tenant-scoped database records.

Direct database access that bypasses the application's tenant-context/RLS architecture must not be introduced as a shortcut.

API Consumption

The frontend must be able to obtain job status through a dedicated status endpoint suitable for polling.

The architecture should remain extensible for future webhook/event-driven status notifications.

Targeted Operations

At minimum, the asynchronous architecture must cover the long-running operations identified in the audit, including:

- Premium audit crawling.
- Firecrawl-dependent workflows.
- Long-running Content Studio processing.
- Complex AI processing where synchronous execution presents Serverless timeout risk.

Validation

The task is complete only when:

- API Routes return without waiting for long-running operations.
- Jobs are persisted in Neon.
- Jobs are successfully queued through Upstash Redis.
- Workers consume and process jobs.
- Job state transitions are correct.
- Failed jobs are persisted correctly.
- Retry behavior works.
- Duplicate processing is controlled.
- Tenant isolation is preserved.
- Existing affected API workflows work end-to-end.

Deliverable

A production-ready asynchronous processing foundation for long-running operations.

---

Task R5 — Mock Data Elimination & Real Data Cutover

Objective

Remove production reliance on mock, random, hardcoded, and in-memory substitute data and connect affected application paths to the real Neon/PostgreSQL data layer.

Scope

Remove production usage of:

- "Math.random()" as generated business data.
- Hardcoded API responses.
- Mock datasets.
- Fake metrics.
- In-memory repositories used as production substitutes.
- Artificial fallback records.
- Development-only data presented as real application results.

Database Integration

Affected services and API Routes must use the established:

- "PostgresClient"
- Repository layer
- Domain services
- Real database schema

where appropriate.

The application must use the actual Neon database for production data access.

Target Areas

At minimum, address the mock-data paths identified by the audit, including:

- "/api/v1/optimization/technical"
- Audit-related services
- Intelligence services
- Dashboard metrics
- Other production API paths identified by the existing audit

Fallback Behavior

When real data does not exist, the application must return an appropriate:

- Empty state
- "404"
- Domain-specific "no data" response
- Validation error
- Service error

as appropriate.

It must not fabricate data to make the UI appear populated.

Production Requirements

Production application paths must not depend on:

- Mock repositories.
- Randomized metrics.
- Hardcoded intelligence results.
- Fake audit results.
- Temporary in-memory state as a substitute for persistent storage.

Validation

The task is complete only when:

- Identified "Math.random()" production usages are eliminated or explicitly justified as non-business/random utility behavior.
- Mock responses are removed from production paths.
- Real PostgreSQL data is returned.
- API contracts remain stable.
- Empty states behave correctly.
- Dashboard data originates from actual persisted records.
- Audit results originate from real processing.
- Tenant isolation remains intact.
- End-to-end tests pass against a real Neon database.

Deliverable

A production data path in which application results are generated from real persisted data and real processing rather than simulated data.

---

Final Verification — Infrastructure Production Readiness

After R1–R5 have been completed, perform a final verification pass against the original audit findings.

This is verification, not a new audit.

The verification must confirm:

- Database migrations bootstrap successfully from an empty Neon database.
- All required tables exist.
- Foreign Keys are correctly ordered and enforced.
- Drizzle migration tooling is operational.
- RLS is enforced for all applicable tenant-scoped tables.
- Cross-tenant access is blocked.
- Authentication sessions are stable in Serverless execution.
- "GOOGLE_AI_API_KEY" is used consistently.
- Obsolete environment variables are removed.
- Long-running operations are asynchronous.
- Upstash Redis queue processing works.
- Neon persists Job state correctly.
- Worker execution preserves tenant context.
- Retry and failure handling work.
- Production APIs no longer rely on mock/random/hardcoded business data.
- Real database data flows successfully from Neon through repositories/services to APIs and the frontend.
- Relevant automated tests pass.
- No production secrets are committed.

Completion Criteria

The remediation program is considered complete only when all five remediation tasks have been individually completed and verified:

R1  ORM & Database Migration Consolidation
        ↓
R2  Database Security & RLS Enforcement
        ↓
R3  Environment, Authentication & Runtime Hardening
        ↓
R4  Asynchronous Job Infrastructure
        ↓
R5  Mock Data Elimination & Real Data Cutover
        ↓
Final Production Readiness Verification

No subsequent remediation task should begin while the previous task contains unresolved blockers or failing acceptance tests.
