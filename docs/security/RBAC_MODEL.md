# Hierarchical RBAC Security Model

This document specifies the administrative privilege levels and authorization structures
for the platform, and is explicit about what is **enforced today** versus **designed but
not yet wired to any route**. The two previous versions of this document described only
the aspirational 7-tier model below as if it were live; it is not, and no request in the
application currently resolves against it. Treat this distinction as load-bearing before
building anything against either model.

## Currently enforced (production): 3-role model

`src/types/auth.ts` defines the only `UserRole` type that the running application's
session, `requireRole()`, and `authorizeApiRequest()` (`src/services/auth/authorization.ts`)
actually check:

| Role | Rank | Scope |
|---|---|---|
| `super_admin` | 3 | Bypasses workspace-membership checks; access to any tenant. |
| `workspace_admin` | 2 | Full read/write inside their own organization. |
| `viewer` | 1 | Read-only inside their own organization. |

Every session cookie, API route, and Server Action in this codebase authorizes against
this model and nothing else.

## Designed, not yet wired: 7-tier admin console model

`src/features/admin/domain/types.ts` defines a separate, more granular `UserRole` union
(`Super Admin`, `Platform Admin`, `Security Auditor`, `Operations`, `Finance`, `Support`,
`Read-Only Observer`) with an associated permission matrix, intended for a future
dedicated admin console (tenant lifecycle management, billing overrides, AI adapter
failover config, prompt version management). The domain, application, and
persistence-adapter layers for this exist under `src/features/admin/`, but:

- No API route or page currently imports or enforces it.
- It has its own `UserRole` type, entirely distinct from (and not interchangeable with)
  `src/types/auth.ts`'s `UserRole`. Do not assume a `session.user.role` value can ever be
  one of these seven strings; it cannot.

Treat this module as a domain-layer scaffold for future work, not as an active security
boundary. If it is picked up, the two role models need to be explicitly reconciled (either
by extending the real session's role type, or by giving the admin console its own,
separately-authenticated identity) before any admin route is built on top of it.

## Permissions Matrix (7-tier model, not yet enforced)

- `tenant:create`, `tenant:write`, `tenant:read`, `tenant:suspend`, `tenant:activate`, `tenant:archive`
- `admin:write`, `admin:read`
- `config:write`, `config:read`
- `ai:manage`, `ai:read`
- `audit:read`
- `billing:write`, `billing:read`
- `prompt:manage`
- `crawler:manage`
- `system:monitor`

## SSO Preparedness

The schema and domain entities under `src/features/admin/` are pre-configured to link
federated external identities (`saml`, `oidc`, `google`, `azure`) onto administrative user
accounts for a future Enterprise SSO integration. This is scaffold-only, in the same
"designed, not yet wired" category as the rest of the admin console domain layer above.
