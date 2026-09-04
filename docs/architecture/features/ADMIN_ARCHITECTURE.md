# Admin Module Architectural Blueprint

This document details the software architecture of the **Enterprise Administrative Bounded Context** of the AI Visibility Intelligence Platform SaaS.

## Bounded Context & Isolation Invariant

The Admin module is designed as a completely independent bounded context under `src/features/admin/`. It maintains 100% decoupling from customer-facing tenant workspaces, except through explicitly published domain interfaces and shared schemas.

```
┌─────────────────────────────────┐        ┌─────────────────────────────────┐
│     Customer SaaS Workspace     │        │     Enterprise Admin Context    │
│  (src/features/ai-intelligence) │        │      (src/features/admin)       │
└────────────────┬────────────────┘        └────────────────┬────────────────┘
                 │                                          │
                 │              Publish Event               │
                 └─────────────────────────────────────────►│
```

- **SaaS Tenant Isolation Invariant**: Standard customers can NEVER bypass authorization guards to invoke administrative CQRS handlers or view internal configuration values.
- **Administrative Portability**: The Admin module runs in its own bounded namespace, ensuring SaaS admins can easily manage and audit system workloads without cross-tenant performance interference.

## Submodule Layout

- `domain/`: Contains immutable state types, rich value objects, aggregate root actions (`TenantAggregate`, `AdminUserAggregate`, `FeatureFlagAggregate`), and domain event contracts.
- `application/`: Standardized CQRS use-case layer defining command handlers, queries, DTO structures, and mapping transformations.
- `api/v1/admin/`: Declares strict versioned REST routing contracts, API request objects, and standard JSON envelope response models.
- `security/`: Coordinates strict administrative authorization guards, permission checks, role-hierarchy evaluators, and API key token masks.
- `analytics/`: Houses platform growth engines, operational statistics consolidators, and estimated cost calculators.
- `infrastructure/`: Hosts mock transactional database stores and persistent record-keeping abstractions.
