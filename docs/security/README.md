# Security Documentation

This section describes the security model and critical mechanisms in Seorchable.

## Status Dictionary
- **Implemented**: Security mechanism is enforced in the current codebase.

## Core Security Mechanisms

### Server-Side Identity Boundary
The server-side identity boundary is fully hardened. Plain-text `user_id` and `tenant_id` cookies are strictly non-authoritative on the server. The comprehensive security suite validates resilience against user/tenant cookie tampering, spoofing, and session forgery.
*Status: Implemented*

### Authentication and Authorization
The `AuthProvider` stores user session credentials client-side for UI mocking purposes, but the client synchronizes this state from the server session (`getServerSessionAction`) on mount. Server-side Role-Based Access Control (RBAC) hierarchy and workspace membership validation rules are managed in `src/services/auth/authorization.ts` through `requireWorkspaceMembership(userId, workspaceId)` and `requireRole(requiredRole)`.
*Status: Implemented*

### Multi-Tenant Isolation & Row-Level Security (RLS)
The canonical schema defined in `database/schema/index.ts` models 57 tables with explicit `pgPolicy` Row-Level Security (RLS) definitions on 37 tenant-scoped tables. Tenant scoping enforces transaction-local `SET LOCAL app.current_tenant_id = $1` inside active transactions, guaranteeing leased PostgreSQL clients are released securely. Fallbacks explicitly fail closed when database connections or queries fail.
*Status: Implemented*

### Cache Security
The cache layer is secured against client-side tenantId spoofing by validating that any requested key's tenant ID strictly matches the server-verified active session user's workspace ID, throwing a security violation on mismatch.
*Status: Implemented*

### Server Actions Validation
The server-side authentication system prevents client-side identity fabrication or signing oracle vulnerabilities by resolving user objects, roles, and workspace IDs strictly on the server inside `loginAction` and `registerAction`, accepting only simple inputs from the client.
*Status: Implemented*

## Detailed Security Specifications
- [Security Model Overview](./SECURITY_MODEL.md)
- [RBAC Model Specification](./RBAC_MODEL.md)
