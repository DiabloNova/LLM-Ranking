# PostgreSQL Row Level Security (RLS) & Tenant Context Specification

This document details the architecture, configuration, and security guarantees achieved by implementing PostgreSQL Row Level Security (RLS) for tenant isolation across the application database schema.

---

## 1. Architectural Overview

To ensure zero-trust tenant isolation, the database layer implements real PostgreSQL Row Level Security. Every database table owned by a tenant contains a tenant partition identifier (`organization_id` or `tenant_id`). The system enforces isolation dynamically via runtime database-level policies rather than relying purely on application-level filtering.

```
                   ┌────────────────────────────────────────┐
                   │       Application Layer Session        │
                   │ (Active tenant identity: tenant_uuid)  │
                   └───────────────────┬────────────────────┘
                                       │
                                       ▼ (Execute SQL inside Transaction)
                    SET LOCAL app.current_tenant_id = 'tenant_uuid';
                                       │
                                       ▼
                   ┌────────────────────────────────────────┐
                   │    PostgreSQL Engine RLS Evaluation    │
                   ├────────────────────────────────────────┤
                   │  SELECT / UPDATE / DELETE checks:      │
                   │    USING (organization_id = tenant_id) │
                   │  INSERT / UPDATE checks:               │
                   │    WITH CHECK (organization_id = ...)  │
                   └────────────────────────────────────────┘
```

---

## 2. Session Context Injection Assumptions

PostgreSQL maps session state to RLS policies using the `current_setting(setting_name, true)` utility. The application and persistence layer make the following technical assumptions:

1. **Transaction-Scoped Settings**: Prior to issuing any query or mutation against a tenant-scoped table within a leased database client or transaction, the application must execute the following session variable configuration statement:
   ```sql
   SET LOCAL app.current_tenant_id = 'your-tenant-uuid-here';
   ```
   - Using `SET LOCAL` guarantees that the tenant parameter is strictly bound to the active transaction block and automatically discarded upon transaction commit, rollback, or connection return to the pool (preventing cross-connection contamination).
2. **Strict Session Matching**: If a query is executed without first configuring the session setting, `NULLIF(current_setting('app.current_tenant_id', true), '')` evaluates to `NULL`, and all operations will fail to retrieve or modify any records, complying with a secure-by-default standard.
3. **No Ownership Changes / Hijacking**:
   - `INSERT`: Policies enforce that any newly created row has a tenant partition ID matching the active `app.current_tenant_id`. Any attempt to insert records belonging to another tenant is blocked with a security violation.
   - `UPDATE`: Policies enforce a dual-check:
     - The `USING` clause ensures the administrator is updating a row that currently belongs to their tenant session.
     - The `WITH CHECK` clause ensures that the resulting updated row *remains* under their tenant partition. This prevents any ownership hijacking or changing the partition column of existing records.

---

## 3. Secured Tenant-Scoped Tables & Columns

The following 12 tables are strictly isolated via Row Level Security:

| Table Name | Partition Column | RLS Scope & Policies implemented |
| :--- | :--- | :--- |
| `organizations` | `id` | Explicit `SELECT`, `INSERT`, `UPDATE`, `DELETE` matching `app.current_tenant_id` |
| `brands` | `organization_id` | Explicit `SELECT`, `INSERT`, `UPDATE`, `DELETE` matching `app.current_tenant_id` |
| `entities` | `organization_id` | Explicit `SELECT`, `INSERT`, `UPDATE`, `DELETE` matching `app.current_tenant_id` |
| `entity_relationships` | `organization_id` | Explicit `SELECT`, `INSERT`, `UPDATE`, `DELETE` matching `app.current_tenant_id` |
| `prompts` | `organization_id` | Explicit `SELECT`, `INSERT`, `UPDATE`, `DELETE` matching `app.current_tenant_id` |
| `ai_observations` | `organization_id` | Explicit `SELECT`, `INSERT`, `UPDATE`, `DELETE` matching `app.current_tenant_id` |
| `brand_mentions` | `organization_id` | Explicit `SELECT`, `INSERT`, `UPDATE`, `DELETE` matching `app.current_tenant_id` |
| `citations` | `organization_id` | Explicit `SELECT`, `INSERT`, `UPDATE`, `DELETE` matching `app.current_tenant_id` |
| `visibility_scores` | `organization_id` | Explicit `SELECT`, `INSERT`, `UPDATE`, `DELETE` matching `app.current_tenant_id` |
| `recommendations` | `organization_id` | Explicit `SELECT`, `INSERT`, `UPDATE`, `DELETE` matching `app.current_tenant_id` |
| `tenant_quotas` | `tenant_id` | Explicit `SELECT`, `INSERT`, `UPDATE`, `DELETE` matching `app.current_tenant_id` |
| `tenant_subscriptions` | `tenant_id` | Explicit `SELECT`, `INSERT`, `UPDATE`, `DELETE` matching `app.current_tenant_id` |

---

## 4. Reversibility and Zero-Downtime Migration Pattern

Migrations that enable or modify RLS are designed to be safe and reversible:
- To revert RLS policies, a migration can simply run:
  ```sql
  ALTER TABLE tableName DISABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS select_tenant_isolation_policy ON tableName;
  DROP POLICY IF EXISTS insert_tenant_isolation_policy ON tableName;
  DROP POLICY IF EXISTS update_tenant_isolation_policy ON tableName;
  DROP POLICY IF EXISTS delete_tenant_isolation_policy ON tableName;
  ```
- Because RLS policies are executed dynamically on every database query, zero-downtime deployment is ensured by deploying transaction-scoped settings in application repositories *before* applying policy definitions to the target PostgreSQL cluster.
