# Relational Database Persistence Model

This document details the PostgreSQL table structures, query optimizations, soft deletion strategy, and optimistic concurrency locks.

## UUID Entity Persistence

Every record persisted across the administrative subsystem uses globally unique UUID primary keys.

## Optimistic Concurrency Control

Optimistic Locking is enforced on all state updates to prevent concurrency conflicts or racing administrative commands:

- Each table (e.g., `brands`, `feature_flags`, `tenant_quotas`) contains a `version` column.
- During mutation, the repository compares the expected entity version against the version in the database.
- If they do not match, the query is aborted and an `OptimisticLockingException` is raised.
- If they match, the query succeeds, and the version is incremented by 1.

```typescript
if (entity.audit.version !== existing.audit.version) {
  throw new OptimisticLockingError("Tenant", entity.audit.version, existing.audit.version);
}
```

## Soft Delete Invariant

For security auditing and compliance, entities like `Tenant` and `AdminUser` are never permanently deleted from tables.

Instead, a soft delete strategy sets a `deleted_at` timestamp. All select operations filter out soft-deleted entities automatically unless explicit overrides are requested.
