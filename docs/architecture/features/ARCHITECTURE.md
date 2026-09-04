# Clean & Multi-Tenant Architecture Specification

This document details the modular layout and patterns implemented under **Phase 7C.1** to support infinite horizontal scaling and future-proof enterprise security.

---

## 1. Enterprise Layered Architecture

The module is structured into distinct, decoupled boundaries following the Clean Architecture pattern:

```
  ┌────────────────────────────────────────────────────────┐
  │                   Application / UI Layer               │
  │               (React Components & Page Routes)         │
  └───────────────────────────┬────────────────────────────┘
                              │ Uses Services
  ┌───────────────────────────▼────────────────────────────┐
  │                       Service Layer                    │
  │                  (Use Case Orchestration)              │
  └───────────────────────────┬────────────────────────────┘
                              │ Uses Interfaces
  ┌───────────────────────────▼────────────────────────────┐
  │                     Repository Contracts               │
  │                 (Persistence Abstraction)              │
  └───────────────────────────┬────────────────────────────┘
                              │ Implemented By
  ┌───────────────────────────▼────────────────────────────┐
  │                 InMemory database / SQL Drizzle        │
  │                   (Concrete Data Adapters)             │
  └────────────────────────────────────────────────────────┘
```

---

## 2. Multi-Tenant Partitioning (RLS Preparedness)

To guarantee SaaS boundary safety, we implement a **Silo/Pooled Partitioning Model** at the application level:

1. **Explicit Organization Partition Key**: Every database schema table and TypeScript domain model contains a mandatory `organizationId` parameter.
2. **Tenant Filter Scoping**: All query finders inside repository interfaces (`interfaces.ts`) enforce `organizationId` as a leading parameter. It is impossible to invoke a fetch without providing tenant context.
3. **RLS Policy Compatibility**: The SQL scripts defined inside `database/schema/` are structured to directly leverage PostgreSQL Row-Level Security (RLS) policies:
   ```sql
   ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
   CREATE POLICY tenant_brand_isolation_policy ON brands
     FOR ALL TO authenticated
     USING (organization_id = CURRENT_SETTING('app.current_organization_id'));
   ```

---

## 3. Separation of Concerns & Dependency Inversion

- **Dependency Inversion**: Core Services depend strictly on abstract repository interfaces (`src/features/ai-intelligence/repositories/interfaces.ts`), not on concrete classes.
- **Pluggable Adapters**: The In-Memory Repository represents a pluggable test adapter. In future phases, SQL/PostgreSQL or Document database adapters can be written and injected seamlessly into Services without modifying any business logic.
