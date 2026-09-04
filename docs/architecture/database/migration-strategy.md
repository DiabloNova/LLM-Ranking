# Relational Database Migration Strategy

This specification details the canonical schema modeling, migration execution, and deployment strategy for the AI Visibility Intelligence relational schema.

---

## 1. Migration Tech Stack

We utilize **Drizzle ORM** paired with **Drizzle Kit** for schema modeling, SQL generation, schema diffing, and programmatic migration execution.

```
 [Canonical Drizzle Schema] (database/schema/index.ts)
         │
         ▼  (pnpm run db:generate / drizzle-kit generate)
 [SQL Migration Artifacts] (database/drizzle/*.sql)
         │
         ▼  (pnpm run db:migrate / src/core/database/migrator.ts)
 [Target PostgreSQL / Neon Cluster]
```

- **ORM Client**: Drizzle ORM (`drizzle-orm`)
- **Migration CLI & Diff Engine**: Drizzle Kit (`drizzle-kit`)
- **Programmatic Runner**: `src/core/database/migrator.ts`
- **Target database**: PostgreSQL (v16+) / Neon Serverless PostgreSQL

---

## 2. Directory Hierarchy

All database definitions and generated migration scripts are version-controlled within the repository:

```
database/
  schema/
    index.ts             # Unified canonical Drizzle ORM pgTable schema definitions (57 tables)
    organization.ts      # Legacy TableDefinition metadata file (retained for reference)
    ...                  # Domain schema metadata files
  drizzle/
    meta/                # Drizzle Kit snapshot and migration metadata records
    0000_*.sql           # Auto-generated Drizzle migration scripts
  migrations/
    0001-0014_*.sql      # Historical hand-rolled SQL migrations (archived artifacts)
```

---

## 3. Operations & Package Scripts

The repository enforces a single migration mechanism with standard `package.json` scripts:

### Step 3.1: Schema Generation
When modifying TypeScript table definitions in `database/schema/index.ts`, generate incremental SQL migration scripts:
```bash
pnpm run db:generate
```

### Step 3.2: Database Migration Execution
Apply pending migration scripts programmatically against the configured `DATABASE_URL`:
```bash
pnpm run db:migrate
```

### Step 3.3: Local Sandbox Schema Push (Dev Only)
Directly push schema changes to a local disposable development database without generating migration files:
```bash
pnpm run db:push
```

---

## 4. Architectural Rules & Guardrails

1. **Single Source of Truth**: All database tables, indexes, constraints, and relations must be defined in `database/schema/index.ts`.
2. **Deterministic Execution**: Foreign key creation and table references are strictly dependency-ordered. Core tables (`organizations`, `brands`, `entities`) are bootstrapped before dependent foreign keys.
3. **Multi-Tenant Isolation**: Tenant-scoped tables enforce PostgreSQL Row Level Security (RLS) policies tied to `app.current_tenant_id` transaction settings via `TenantContextManager`.
4. **Disposable Verification**: Schema migrations are validated against empty disposable PostgreSQL instances prior to production deployments.
