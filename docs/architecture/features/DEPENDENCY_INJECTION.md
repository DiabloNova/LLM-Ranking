# Dependency Injection and IoC Container

This document outlines the design of our lightweight Inversion of Control (IoC) dependency container.

## Container Design

The `DependencyContainer` class acts as the centralized registry for all infrastructure and application services.

```typescript
import { container } from "@/core/container";

// Resolve Postgres Repository
const tenantRepo = container.resolve<ITenantRepository>("TenantRepository");

// Resolve Client gateway
const apiClient = container.resolve<AdminAPIClient>("AdminAPIClient");
```

## central Registrations

- **Database**: Accesses the global mocked persistent store.
- **UnitOfWork**: Manages transactional boundaries and commitments.
- **EventPublisher**: Interacts with the event bus routing keys.
- **Repositories**: Injects `PostgresTenantRepository`, `PostgresAdminUserRepository`, `PostgresFeatureFlagRepository`, `PostgresAuditRecordRepository`, and `PostgresAIProviderConfigurationRepository`.
