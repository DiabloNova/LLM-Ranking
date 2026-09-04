## Part 1 — Tenant / Organization / Workspace Architecture Decision

### A. Verified Current Architecture
The current database architecture uses `organization_id` on most resource tables to isolate data, with RLS policies checking against `NULLIF(current_setting('app.current_tenant_id', true), '')::uuid`.
The `organizations` table represents the primary tenant concept in the database and contains a self-referencing RLS based on its `id` matching the `app.current_tenant_id`.
There is a distinct conceptual crossover in the application code where the `TenantContextManager` handles `app.current_tenant_id` at a transaction level, but the authentication layer resolves `User.workspaceId` directly into `tenant_id` (e.g. in `authorizeApiRequest`). `session.user.workspaceId` is what gets passed to `runWithTenantContext`.

### B. Tenant Boundary
The tenant boundary is the `app.current_tenant_id` session setting in PostgreSQL, which conceptually maps to `organization_id` across all resource tables (and occasionally `tenant_id` in tables like `tenant_quotas`).
Evidence: `database/schema/index.ts` contains a helper `tenantPolicy` that generates RLS policies mapping `organization_id` or `tenant_id` to `app.current_tenant_id`.
Evidence: The `organizations` table in `database/schema/organization.ts` uses its `id` column against `app.current_tenant_id`.

### C. Runtime "app.current_tenant_id" Flow
1. Auth Context: The `authorizeApiRequest` function gets the `tenantId` from `session.user.workspaceId`.
2. Server Actions: Server actions extract `tenantId` from `session.user.workspaceId`.
3. Database Transaction: `TenantContextManager.runWithTenantContext(tenantId, ...)` is called.
4. Postgres Setup: Inside this manager (in `src/core/database/tenant-context/index.ts`), it executes `SELECT set_config('app.current_tenant_id', $1, true)` with the `tenantId`.
5. RLS Evaluation: PostgreSQL row-level security uses `current_setting('app.current_tenant_id', true)` to enforce access against `organization_id` (or `tenant_id`).

### D. User / Authentication Model
There is **no persistent application users table** in the schema. The `admin_users` table exists, but based on `database/schema/admin/index.ts` and its name, it is for system administration rather than typical SaaS users.
Users are currently handled ephemerally via sessions. `loginAction` and `registerAction` in `src/app/actions/auth.ts` create a mock `User` object (with a random ID starting with `usr-`) and `workspaceId: "ws-default"` upon login/registration. This object is serialized into a secure JWT-like cookie (`seorchable_session`).
The `User.workspaceId` maps directly to the `tenantId` used for database tenant context, effectively acting as the Organization ID.

### E. Workspace Evidence
There is **no persistent Workspace table** in the database schema.
However, "workspace" is heavily used as an application concept:
- `User.workspaceId` is the key tenant attribute in the auth layer.
- `src/services/auth/authorization.ts` exposes `requireWorkspaceMembership`.
- UI strings use the term "workspace" (e.g., "Establish your multi-tenant workspace").
- Logically, in the code, Workspace is completely synonymous with Tenant and Organization (i.e., `User.workspaceId` is the `app.current_tenant_id` which must match `organization_id`).

### F. Tenant-Scoped Resource Inventory
The following tables are tenant-scoped (via `TENANT_SCOPED_TABLES` in `TenantContextManager`):
- `brands`, `entities`, `entity_relationships`, `prompts`, `ai_observations`, `brand_mentions`, `citations`, `visibility_scores`, `recommendations`, `document_embeddings`, `kg_entities`, `kg_relationships`, `premium_audits`, `competitive_analyses`, `crawl_jobs`, `crawl_results`, `crawl_cache`, `ai_visibility_audits`, `audit_prompts`, `prompt_definitions`, `prompt_schedules`, `prompt_executions`, `position_observations`, `citation_sources`, `citation_occurrences`, `brand_associations`, `recommendation_observations`, `aeo_analyses`, `faq_opportunities`, `kg_alignments`
All of these tables enforce RLS by matching their `organization_id` (or `tenant_id` for quotas) column against `app.current_tenant_id`.

### G. Architecture Options
**Model A: Organization = Tenant = Workspace**
- **Evidence:** `User.workspaceId` feeds directly into `app.current_tenant_id`, which maps to `organizations.id` and `resource.organization_id`. There is no separate `workspace_id` in any DB table.
- **RLS Implications:** RLS remains perfectly intact. No migration of existing tenant IDs is required.
- **Implementation Impact:** We simply build the missing `users`, `workspace_members`, and `workspace_invitations` tables. We use the existing `organizations` table as the workspace/tenant. Or we rename `organizations` to `workspaces` (which is destructive). The safest approach is treating the `organizations` table as the workspace entity in the code.

**Model B: Organization -> Workspace = Tenant**
- **Evidence:** B2B SaaS conventionally has orgs containing workspaces.
- **RLS Implications:** We would need to create a `workspaces` table (`id` being the tenant boundary). We would then point `organizations` to `workspaces` or vice versa. The RLS relies on `organization_id` meaning if Workspace is the Tenant, we would logically have to rename `organization_id` to `workspace_id` across 30+ tables or just conceptually map Workspace ID to `organization_id` (which is confusing).

**Model C: Organization = Tenant -> Workspace**
- **Evidence:** None in the DB.
- **RLS Implications:** If Workspace is a sub-entity but Organization is the Tenant, RLS wouldn't isolate at the Workspace level without migrating 30+ tables to include a `workspace_id` and updating all 30+ RLS policies. This contradicts the prompt's warning.

### H. Recommended Architecture
**Model A: Organization = Tenant = Workspace**
The repository evidence shows that `User.workspaceId`, `app.current_tenant_id`, and `organizations.id` are currently the exact same conceptual and runtime boundary. `requireWorkspaceMembership` currently checks if `session.user.workspaceId === workspaceId`.
To introduce a separate Workspace entity that isolates resources would require migrating all 30+ `TENANT_SCOPED_TABLES` from `organization_id` to `workspace_id` and rewriting their RLS policies.
Therefore, the safest and only viable architecture supported by the repository is that the existing `organizations` table IS the workspace/tenant boundary. We will build `users`, `organization_members` (acting as workspace members), and `organization_invitations` to satisfy the requirements without disrupting RLS.

### I. Migration / Implementation Impact
- Create a `users` table to replace the ephemeral mock users in `auth.ts`.
- Create a `workspace_members` (or `organization_members`) table linking `users` to `organizations` (tenant).
- Create a `workspace_invitations` table for inviting users to the organization/workspace.
- Update `auth.ts` to actually fetch/persist the user and their membership.
- Update `authorization.ts` (`requireWorkspaceMembership`) to query the membership table instead of relying solely on the session object (since session is just a snapshot).
- No changes to `TENANT_SCOPED_TABLES` schema or RLS policies.

### J. Unresolved Questions
None. The architecture is clear and treating Organization = Tenant = Workspace is the only non-destructive path.
