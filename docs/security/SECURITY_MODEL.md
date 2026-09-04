# Security Architecture Model

This document outlines the security, tenant authorization, Role-Based Access Control
(RBAC), and compliance guidelines implemented for the platform. See
[`RBAC_MODEL.md`](./RBAC_MODEL.md) for the full role breakdown and, importantly, which
role model is actually enforced versus designed-but-unwired.

---

## 1. Zero-Trust Tenant Isolation

The platform enforces zero-trust tenant isolation through multiple decoupled security
layers:

1. **PostgreSQL Row-Level Security (RLS)**: every tenant-scoped table carries
   `organization_id`/`tenant_id` RLS policies keyed off `current_setting('app.current_tenant_id')`,
   set exclusively inside `TenantContextManager.runWithTenantContext()`
   (`src/core/database/tenant-context/index.ts`). This is the authoritative isolation
   boundary; application-layer filtering is defense in depth on top of it, not a
   substitute for it.
2. **`TenantContextManager.isQueryTenantScoped()` guard**: the wrapped Postgres client
   (`PostgresClient.connectClient()`) refuses to run a query against any table in
   `TENANT_SCOPED_TABLES` unless a tenant transaction is active.
3. **`authorizeApiRequest()`**: the sole entry point for resolving caller identity on
   internal `/api/v1/*` routes. Accepts a signed session cookie or a hashed
   `Authorization: Bearer <API_KEY>` token; never trusts client-supplied identity headers.

## 2. Role-Based Access Control (RBAC)

The application enforces a three-role hierarchy (`super_admin` > `workspace_admin` >
`viewer`), checked by `requireRole()` and `requireWorkspaceMembership()`
(`src/services/auth/authorization.ts`). A separate, more granular 7-tier model exists as
an unwired domain-layer scaffold for a future dedicated admin console; see
[`RBAC_MODEL.md`](./RBAC_MODEL.md) for the distinction. Do not treat the 7-tier model as
an active control until it is explicitly wired to real routes.

## 3. Session Security

Sessions are signed, integrity-protected cookies (`src/services/auth/session.ts`):
HMAC-SHA256 over the payload with `crypto.timingSafeEqual` verification,
`httpOnly` + `secure` (in production) + `SameSite=Strict` cookie flags, and a mandatory,
length-checked `SESSION_SECRET` in production (the process fails to serve traffic rather
than fall back to a per-process ephemeral secret, which would cause random cross-instance
logouts in any horizontally scaled deployment).

## 4. API Key Authentication

Public/developer API access (`src/features/public-api/`) uses hashed API keys
(`sha256`, never stored or compared in plaintext) verified with
`crypto.timingSafeEqual`. Internal `/api/v1/*` routes accept the same key format via
`authorizeApiRequest()`.

## 5. Rate Limiting & Spend Protection

Metered endpoints (premium audits, crawler campaigns, RAG queries) are rate-limited
per-tenant on Upstash Redis (`src/lib/rate-limit.ts`) and **fail closed**: if the limiter
backend is unreachable or unconfigured in production, the request is rejected with 503
rather than allowed through unmetered.

## 6. Webhook Integrity

Inbound webhooks (`src/app/api/webhooks/payment/route.ts`) are authenticated with a
timing-safe shared-secret comparison and processed idempotently via an
insert-before-process ledger (`processed_webhook_events`), so an at-least-once delivery
can never be applied twice.

## 7. Sensitive Data & PII Protection

To remain compliant with GDPR, CCPA, and data privacy policies, the platform implements a
**`SensitiveDataProtector`** utility that automatically redacts high-risk secrets (Bearer
tokens, AWS credentials, custom API keys) scraped or captured within LLM response logs,
and masks sensitive consumer data prior to logging observations.
