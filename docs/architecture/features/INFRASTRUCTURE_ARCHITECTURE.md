# Infrastructure and Services Architecture

This document describes the **SaaS Platform Operations Infrastructure Architecture**, connecting domain entities to PostgreSQL repositories, in-memory caching, and event-driven backbones.

## Architectural Layout

```
                        ┌──────────────────────────────────┐
                        │       CQRS Handlers / API        │
                        └────────────────┬─────────────────┘
                                         │
                         ┌───────────────▼───────────────┐
                         │   Unit of Work / Transaction  │
                         └───────────────┬───────────────┘
                                         │
                 ┌───────────────────────┼───────────────────────┐
                 │                       │                       │
      ┌──────────▼──────────┐ ┌──────────▼──────────┐ ┌──────────▼──────────┐
      │  Postgres Repos     │ │   InMemory Cache    │ │   Core Event Bus    │
      │  (Optimistic Lock)  │ │   (TTL Evictions)   │ │   (Post-Commit)     │
      └─────────────────────┘ └─────────────────────┘ └─────────────────────┘
```

## System Integration Invariants

- **Atomic Transactions**: Modifying any tenant or administrative credential runs within a single Unit of Work boundary.
- **Transactional Consistency**: Domain events are queued and only dispatched AFTER the underlying database transaction successfully commits. If a rollback is triggered, all registered events are discarded.
- **Resource Protection**: API key strings, credentials, and tokens are securely masked at rest and before audit serialization to guarantee zero-leak logs.
