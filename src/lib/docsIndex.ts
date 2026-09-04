// Auto-generated metadata index for navigation and search
export interface DocMeta {
  slug: string;
  titleEn: string;
  titleFa: string;
  category: string;
  categoryFa?: string;
  snippet: string;
}

export const DOCS_INDEX: DocMeta[] = [
  {
    slug: "product",
    titleEn: "Seorchable Documentation Architecture",
    titleFa: "Seorchable Documentation Architecture",
    category: "product",
    categoryFa: "Product",
    snippet: `# Seorchable Documentation Architecture  Welcome to the Seorchable documentation. This documentation accurately reflects the implemented state of the repository, separating currently available capabilities from future plans.  ## Documentation Domains  To find what you are looking for, navigate to one of our six documentation domains:  ### 1. [Product Documentation](./product/README.md) Explains what Seorchable is and what capabilities it provides. Useful for understanding core features like AI V`
  },
  {
    slug: "api",
    titleEn: "API Documentation",
    titleFa: "API Documentation",
    category: "api",
    categoryFa: "API",
    snippet: `# API Documentation  This section describes the application's API surface.  ## Status Dictionary - **Implemented**: API endpoint is verified and functional. - **Partial**: API endpoint is in development or missing edge case handling. - **Planned**: Endpoint is not currently implemented.  ## Overview  Developer API endpoints under \`src/app/api/v1/\` utilize the \`authorizeApiRequest\` function to securely resolve user and tenant contexts, prioritizing validated server sessions over client-provided r`
  },
  {
    slug: "CACHING_AND_COST_CONTROL",
    titleEn: "Caching & AI Cost Governance Architecture",
    titleFa: "Caching & AI Cost Governance Architecture",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Caching & AI Cost Governance Architecture  This document specifies the technical design, contracts, and security boundaries implemented for application-level caching, request deduplication, and AI cost/budget governance on the **seorchable** platform.  ---  ## 1. Caching Layer Architecture  The platform employs a provider-independent caching hierarchy that isolates business layers from future backend storage adapters (such as Redis or Upstash).  \`\`\` Application / Domain Services           │   `
  },
  {
    slug: "DASHBOARD_SHELL_ARCHITECTURE",
    titleEn: "Seorchable — Dashboard Shell Architecture & Specification",
    titleFa: "Seorchable — Dashboard Shell Architecture & Specification",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Seorchable — Dashboard Shell Architecture & Specification  This document details the production-grade architectural design of the unified authenticated Dashboard Shell implemented in **Task 3.0**. The shell serves as the layout foundation for all authenticated sub-modules, establishing strict client-server component boundaries, unified configuration-driven navigation, multi-tenant workspace context integration, and comprehensive LTR/RTL bidirectional layout controls.  ---  ## 1. Directory Stru`
  },
  {
    slug: "OBSERVABILITY_AND_GOVERNANCE",
    titleEn: "Observability & Cost Governance Architecture Reference",
    titleFa: "Observability & Cost Governance Architecture Reference",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Observability & Cost Governance Architecture Reference  This document defines the architectural specification, environment configurations, and security/isolation properties established for request-scoped context propagation, trace sampling, decoupled latency metrics, and AI cost warning thresholds on the **seorchable** platform.  ---  ## 1. Request Context & Async Context Propagation  For advanced request-scoped context tracing without manually prop-drilling identifiers through business servic`
  },
  {
    slug: "architecture",
    titleEn: "Architecture Documentation",
    titleFa: "Architecture Documentation",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Architecture Documentation  This section describes the technical architecture of Seorchable.  ## Status Dictionary - **Implemented**: Documented architecture accurately reflects the codebase. - **Planned**: Architectural changes that are proposed but not implemented.  ## System Overview  Seorchable is a Next.js application built on a PostgreSQL database utilizing Drizzle ORM. The architecture enforces strict multi-tenant isolation, structured service boundaries, and deterministic background pr`
  },
  {
    slug: "SITEMAP_AND_ROUTE_SPECIFICATION",
    titleEn: "Seorchable — Sitemap, Route Architecture & Legacy Redirect Specification",
    titleFa: "Seorchable — Sitemap, Route Architecture & Legacy Redirect Specification",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Seorchable — Sitemap, Route Architecture & Legacy Redirect Specification  **Execution Phase:** Phase 1 — Target Product Architecture **Task ID:** 1.1 **Execution Agent:** Jules **Document Version:** 1.0.0 **Date:** August 2026 **Status:** Authoritative Specification (Read-Only Planning Blueprint)  ---  ## 1. Executive Summary  This document establishes the canonical sitemap, route architecture, and redirect policy for the **Seorchable** SaaS platform. It acts as the single source of truth for `
  },
  {
    slug: "architecture",
    titleEn: "Database Architecture",
    titleFa: "Database Architecture",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Database Architecture  This directory contains technical specifications and decisions regarding the PostgreSQL persistence layer.  ## Available Documents - [Migration Strategy](./migration-strategy.md) - [Reconciliation Report](./reconciliation-report.md) - [Tenant Context Spec](./tenant-context-spec.md) `
  },
  {
    slug: "migration-strategy",
    titleEn: "Relational Database Migration Strategy",
    titleFa: "Relational Database Migration Strategy",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Relational Database Migration Strategy  This specification details the canonical schema modeling, migration execution, and deployment strategy for the AI Visibility Intelligence relational schema.  ---  ## 1. Migration Tech Stack  We utilize **Drizzle ORM** paired with **Drizzle Kit** for schema modeling, SQL generation, schema diffing, and programmatic migration execution.  \`\`\`  [Canonical Drizzle Schema] (database/schema/index.ts)          │          ▼  (pnpm run db:generate / drizzle-kit ge`
  },
  {
    slug: "reconciliation-report",
    titleEn: "Database Reconciliation Report & Implementation Plan",
    titleFa: "Database Reconciliation Report & Implementation Plan",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Database Reconciliation Report & Implementation Plan  **Date:** August 2024 **Scope:** Reconstruct Database Source of Truth, Drizzle ORM Canonical Schema, and Migration Pipeline  ---  ## 1. Inventory & Reconciliation Summary  A comprehensive reconciliation was performed across: 1. Legacy hand-written SQL migrations (\`0001-0014\`) 2. TypeScript schema metadata (\`database/schema/*.ts\`) 3. Codebase repository/service usage patterns (\`src/\`, \`tests/\`)  ### Table Count & Verification - **Total Uniqu`
  },
  {
    slug: "tenant-context-spec",
    titleEn: "PostgreSQL Row Level Security (RLS) & Tenant Context Specification",
    titleFa: "PostgreSQL Row Level Security (RLS) & Tenant Context Specification",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# PostgreSQL Row Level Security (RLS) & Tenant Context Specification  This document details the architecture, configuration, and security guarantees achieved by implementing PostgreSQL Row Level Security (RLS) for tenant isolation across the application database schema.  ---  ## 1. Architectural Overview  To ensure zero-trust tenant isolation, the database layer implements real PostgreSQL Row Level Security. Every database table owned by a tenant contains a tenant partition identifier (\`organiza`
  },
  {
    slug: "ADMIN_ARCHITECTURE",
    titleEn: "Admin Module Architectural Blueprint",
    titleFa: "Admin Module Architectural Blueprint",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Admin Module Architectural Blueprint  This document details the software architecture of the **Enterprise Administrative Bounded Context** of the AI Visibility Intelligence Platform SaaS.  ## Bounded Context & Isolation Invariant  The Admin module is designed as a completely independent bounded context under \`src/features/admin/\`. It maintains 100% decoupling from customer-facing tenant workspaces, except through explicitly published domain interfaces and shared schemas.  \`\`\` ┌────────────────`
  },
  {
    slug: "AI_CITATION_INTELLIGENCE_ARCHITECTURE",
    titleEn: "AI Citation Intelligence Architecture",
    titleFa: "AI Citation Intelligence Architecture",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# AI Citation Intelligence Architecture  This document specifies the technical design, entity-relationship structures, classification rules, quality evaluation algorithms, and trend telemetry metrics implemented by the **AI Citation Intelligence Layer** (Task 5.2).  ---  ## 1. Citation Occurrence vs. Citation Source  To prevent historical overwrites and compile precise temporal metrics, the architecture maintains a strict separation between individual occurrences and their unique normalized sour`
  },
  {
    slug: "AI_PIPELINE_ARCHITECTURE",
    titleEn: "AI processing Pipeline Architecture",
    titleFa: "AI processing Pipeline Architecture",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# AI processing Pipeline Architecture  This document describes the design and abstract contracts created to coordinate multi-model scraping, sanitization, and metric calculation.  ---  ## 1. Pipeline Stages  Ingesting and evaluating Generative engine search results operates in six decoupled abstract stages:  \`\`\`   [Stage 1: IAIEngineAdapter]             │ Dispatches queries to ChatGPT / Claude / Gemini / Perplexity             ▼   [Stage 2: IPromptExecutionPipeline]             │ Schedules cron `
  },
  {
    slug: "AI_PROMPT_INTELLIGENCE_ARCHITECTURE",
    titleEn: "AI Prompt Intelligence Architecture",
    titleFa: "AI Prompt Intelligence Architecture",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# AI Prompt Intelligence Architecture  This document specifies the technical design, state transitions, variable rendering, and competitor position analysis implemented by the **AI Prompt Intelligence Layer** (Task 5.1).  ---  ## 1. Core Architecture & Alignment  The Prompt Intelligence Layer extends Task 5.0 (AI Visibility Core) to provide persistent, multi-tenant isolated prompt parameterization, execution, cron-scheduling, and side-by-side model comparison.  The data pipeline operates as foll`
  },
  {
    slug: "AI_VISIBILITY_ENGINE_ARCHITECTURE",
    titleEn: "AI Visibility Engine Architecture",
    titleFa: "AI Visibility Engine Architecture",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# AI Visibility Engine Architecture  This document specifies the technical architecture, domain models, and scoring equations of the production-grade **AI Visibility Audit Engine** (Task 5.0).  ---  ## 1. Core Distinctions  A key architectural design principle is the strict separation of conversational retrieval indicators. We explicitly differentiate between these five concepts:  1. **Mention:** The simple lexical presence of a brand's name, localized spellings, or aliases within the text block`
  },
  {
    slug: "APPLICATION_LAYER",
    titleEn: "Application Layer Design Specification",
    titleFa: "Application Layer Design Specification",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Application Layer Design Specification  This document outlines the design and responsibilities of the Application Layer inside the AI Visibility Intelligence Engine.  ---  ## 1. Architectural Role  The Application Layer is the orchestrator of use-cases. It sits directly between the API entry boundary and the Domain Layer, enforcing: - **No Domain Leakage**: Raw Domain Entities never cross the API threshold. They are mapped into strongly-typed Data Transfer Objects (DTOs) prior to leaving the b`
  },
  {
    slug: "ARCHITECTURE",
    titleEn: "Clean & Multi-Tenant Architecture Specification",
    titleFa: "Clean & Multi-Tenant Architecture Specification",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Clean & Multi-Tenant Architecture Specification  This document details the modular layout and patterns implemented under **Phase 7C.1** to support infinite horizontal scaling and future-proof enterprise security.  ---  ## 1. Enterprise Layered Architecture  The module is structured into distinct, decoupled boundaries following the Clean Architecture pattern:  \`\`\`   ┌────────────────────────────────────────────────────────┐   │                   Application / UI Layer               │   │       `
  },
  {
    slug: "AUDIT_DESIGN",
    titleEn: "Immutable Administrative Audit Trail",
    titleFa: "Immutable Administrative Audit Trail",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Immutable Administrative Audit Trail  This document details the system design of the immutable audit logging module within the administrative context.  ## Audit Record Schema  Each record captured by the audit tracker contains:  - \`id\`: Globally unique UUID trace identifier. - \`timestamp\`: ISO-8601 server timestamp. - \`actorId\` & \`actorEmail\`: Unambiguous identity of the acting administrator. - \`actorRole\`: Role context of the administrator. - \`action\`: Specific state change string (e.g., \`TEN`
  },
  {
    slug: "CQRS_DESIGN",
    titleEn: "Command Query Responsibility Segregation (CQRS) Design",
    titleFa: "Command Query Responsibility Segregation (CQRS) Design",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Command Query Responsibility Segregation (CQRS) Design  This document details the CQRS design pattern used to separate writes (State Mutation) from reads (State Materialization).  ---  ## 1. Segregation Concept  To scale search visibility ingestion separately from rich analytics dashboards, we divide use-cases into:  1. **Commands (Write Store)**:    - Optimized for safety, constraints, and relational consistency.    - Triggers state shifts and emits events.    - Executed via \`ApplicationComma`
  },
  {
    slug: "CRAWL_ACQUISITION",
    titleEn: "Crawl acquisition",
    titleFa: "Crawl acquisition",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Crawl acquisition  The acquisition feature separates request validation, durable scheduling, and provider execution. A request is normalized, policy-checked, and SSRF validated before a job is created or a provider is selected. The internal provider uses the pinned-DNS \`safeFetch\` client and performs bounded, non-browser HTML traversal. The Firecrawl adapter is isolated under \`infrastructure/providers/firecrawl/\`; Firecrawl SDK types do not cross into the domain.  ## Domain and providers  \`Cra`
  },
  {
    slug: "DATA_FLOW",
    titleEn: "Data Flow & Pipelines",
    titleFa: "Data Flow & Pipelines",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Data Flow & Pipelines  This document maps the sequential lifecycles and pipelines of the AI Visibility Intelligence Engine.  ---  ## 1. AI Observation Ingestion Lifecycle  This pipeline details how incoming LLM query captures flow into calculated analytics and triggers autonomous recovery actions.  \`\`\`  [AI Agent Engine]         │ Executes Search Query         ▼  [Raw JSON Payload]         │         ▼  [ObservationService.processObservation()]         │         ├─► 1. Save Raw Observation     `
  },
  {
    slug: "DEPENDENCY_INJECTION",
    titleEn: "Dependency Injection and IoC Container",
    titleFa: "Dependency Injection and IoC Container",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Dependency Injection and IoC Container  This document outlines the design of our lightweight Inversion of Control (IoC) dependency container.  ## Container Design  The \`DependencyContainer\` class acts as the centralized registry for all infrastructure and application services.  \`\`\`typescript import { container } from \\"@/core/container\\";  // Resolve Postgres Repository const tenantRepo = container.resolve<ITenantRepository>(\\"TenantRepository\\");  // Resolve Client gateway const apiClient = conta`
  },
  {
    slug: "DOMAIN_MODEL",
    titleEn: "Domain Model Design Specification",
    titleFa: "Domain Model Design Specification",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Domain Model Design Specification  This document details the Domain-Driven Design (DDD) model established for the **AI Visibility Intelligence Engine (Phase 7C.1)**.  ---  ## 1. Domain Architectural Paradigms  This domain operates on strict **Domain-Driven Design (DDD)** principles to separate technical details (database, controllers, API) from the underlying core business rules of Answer Engine Optimization (AEO) and Generative Engine Optimization (GEO).  \`\`\`    ┌─────────────────────────────`
  },
  {
    slug: "EVENT_ARCHITECTURE",
    titleEn: "Event-Driven Architecture (EDA) Blueprint",
    titleFa: "Event-Driven Architecture (EDA) Blueprint",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Event-Driven Architecture (EDA) Blueprint  This specification details our distributed, asynchronous messaging design built on eventual consistency and correlation trace headers.  ---  ## 1. Tracing & Context Propagation  Every Domain Event published contains a mandatory, structured \`metadata\` block carrying trace properties:  - **eventId**: A unique identifier for auditability and deduplication. - **organizationId**: Strict tenant partition key, ensuring events are routed to proper tenant stre`
  },
  {
    slug: "EVENT_PIPELINE",
    titleEn: "Domain and Audit Event Pipelines",
    titleFa: "Domain and Audit Event Pipelines",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Domain and Audit Event Pipelines  This document details the system design of the asynchronous Event pipeline and immutable Audit trail.  ## Dual Event Dispatch  Every administrative action triggers two distinct pipeline streams:  1. **Domain Events**: Dispatched asynchronously to eventual-consistency consumers (e.g., triggering crawler processes or email schedules).    - \`TenantCreatedEvent\`    - \`TenantSuspendedEvent\`    - \`AdminUserCreatedEvent\`    - \`FeatureFlagChangedEvent\`    - \`AIProvide`
  },
  {
    slug: "FUTURE_EVOLUTION",
    titleEn: "Future Platform Evolution Guidelines",
    titleFa: "Future Platform Evolution Guidelines",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Future Platform Evolution Guidelines  This document outlines the clear technical roadmap for integrating Drizzle ORM, orchestrating background processing agents, and scaling to billions of daily tracked queries.  ---  ## 1. Drizzle ORM Schema Integration  To implement production SQL persistence, follow these steps to link the database schemas:  1. **Schema Translation**: Map the schemas defined in \`database/schema/*.ts\` into Drizzle syntax.    Example \`database/schema/brand.ts\`:    \`\`\`typescri`
  },
  {
    slug: "INFRASTRUCTURE_ARCHITECTURE",
    titleEn: "Infrastructure and Services Architecture",
    titleFa: "Infrastructure and Services Architecture",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Infrastructure and Services Architecture  This document describes the **SaaS Platform Operations Infrastructure Architecture**, connecting domain entities to PostgreSQL repositories, in-memory caching, and event-driven backbones.  ## Architectural Layout  \`\`\`                         ┌──────────────────────────────────┐                         │       CQRS Handlers / API        │                         └────────────────┬─────────────────┘                                          │             `
  },
  {
    slug: "KNOWLEDGE_GRAPH_DESIGN",
    titleEn: "Semantic Knowledge Graph Architecture Design",
    titleFa: "Semantic Knowledge Graph Architecture Design",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Semantic Knowledge Graph Architecture Design  This document details the abstract contracts and models designed to map, claimed, and travers brand concept networks inside external AI platforms.  ---  ## 1. Graph Model Definitions  - **GraphNode**: Mapped concept representing brands, competitors, key executives, or products. Anchored by a unique name and optional Wikidata \`wikidataId\`. - **GraphEdge**: Mapped semantic relationship containing predicates like \`owns\`, \`creates\`, \`competes_with\`, \`r`
  },
  {
    slug: "PERSISTENCE_MODEL",
    titleEn: "Relational Database Persistence Model",
    titleFa: "Relational Database Persistence Model",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Relational Database Persistence Model  This document details the PostgreSQL table structures, query optimizations, soft deletion strategy, and optimistic concurrency locks.  ## UUID Entity Persistence  Every record persisted across the administrative subsystem uses globally unique UUID primary keys.  ## Optimistic Concurrency Control  Optimistic Locking is enforced on all state updates to prevent concurrency conflicts or racing administrative commands:  - Each table (e.g., \`brands\`, \`feature_f`
  },
  {
    slug: "PLATFORM_MONITORING",
    titleEn: "Platform Monitoring and Telemetry Design",
    titleFa: "Platform Monitoring and Telemetry Design",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Platform Monitoring and Telemetry Design  This document describes how our system tracks operational health, background worker status, and external AI adapters.  ## Health Probes  The \`SystemOperationsConsole\` runs real-time diagnostic checks across four core infrastructural vectors:  1. **Transactional DB Latency**: Check connection pool response times. 2. **Redis Message Queue**: Evaluate backlog and processing queue sizes. 3. **ElasticSearch Indexes**: Check hybrid and full-text search avail`
  },
  {
    slug: "architecture",
    titleEn: "Feature Architectures",
    titleFa: "Feature Architectures",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Feature Architectures  This directory contains architectural documentation specific to feature domains and services, originally co-located with the source code.  These documents outline domain models, service boundaries, event pipelines, and AI intelligence pipeline structures. `
  },
  {
    slug: "SERVICE_BOUNDARIES",
    titleEn: "Service Boundaries & Use Cases",
    titleFa: "Service Boundaries & Use Cases",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Service Boundaries & Use Cases  This document describes the clear responsibilities, inputs, and outputs of the service layer interfaces.  ---  ## 1. Boundary Matrix  Every Service has a singular, unified domain of responsibility. Cross-domain actions are handled through composition or event-driven listeners.  | Service Name | Primary Boundary | Dependencies | Key Use Cases | | :--- | :--- | :--- | :--- | | **ObservationService** | AI response ingestion & prompt tracking | \`IObservationReposito`
  },
  {
    slug: "TENANT_OPERATIONS",
    titleEn: "Tenant Operations Guide",
    titleFa: "Tenant Operations Guide",
    category: "architecture",
    categoryFa: "Architecture",
    snippet: `# Tenant Operations Guide  This document describes the administrative operations supporting multi-tenant lifecycle states, limits, and quotas.  ## Lifecycle States  - **Active**: The tenant runs normal crawl jobs, executes prompts, and accesses standard features. - **Suspended**: The tenant cannot process new crawl jobs or access features, but their database schemas and configurations are kept intact. - **Archived**: The tenant is soft-deleted, removing active schedules and preparing records for`
  },
  {
    slug: "product",
    titleEn: "Product Documentation",
    titleFa: "Product Documentation",
    category: "product",
    categoryFa: "Product",
    snippet: `# Product Documentation  This section describes the implemented product capabilities of Seorchable.  ## Status Dictionary - **Implemented**: Fully operational in the current codebase. - **Partial**: Feature exists but may be incomplete or experimental. - **Planned**: Not currently implemented.  ## Implemented Capabilities  ### AI Visibility Audit Engine Measures brand representation across large language models, evaluates metrics for 8 visibility dimensions, and calculates a deterministic weight`
  },
  {
    slug: "RBAC_MODEL",
    titleEn: "Hierarchical RBAC Security Model",
    titleFa: "Hierarchical RBAC Security Model",
    category: "security",
    categoryFa: "Security",
    snippet: `# Hierarchical RBAC Security Model  This document specifies the administrative privilege levels and authorization structures enforced across the Admin console.  ## Roles and Ranks  We enforce a strict linear role hierarchy rank mapped numerically to compare permission levels:  | Role Name | Rank | Primary Accountability | |---|---|---| | **Super Admin** | 100 | Complete system override, administrative provisioning, billing bypass | | **Platform Admin** | 80 | Full tenant lifecycle management, fe`
  },
  {
    slug: "security",
    titleEn: "Security Documentation",
    titleFa: "Security Documentation",
    category: "security",
    categoryFa: "Security",
    snippet: `# Security Documentation  This section describes the security model and critical mechanisms in Seorchable.  ## Status Dictionary - **Implemented**: Security mechanism is enforced in the current codebase.  ## Core Security Mechanisms  ### Server-Side Identity Boundary The server-side identity boundary is fully hardened. Plain-text \`user_id\` and \`tenant_id\` cookies are strictly non-authoritative on the server. The comprehensive security suite validates resilience against user/tenant cookie tamperi`
  },
  {
    slug: "SECURITY_MODEL",
    titleEn: "Security Architecture Model",
    titleFa: "Security Architecture Model",
    category: "security",
    categoryFa: "Security",
    snippet: `# Security Architecture Model  This document outlines the security, tenant authorization, Role-Based Access Control (RBAC), and compliance guidelines implemented for the AI Intelligence Engine.  ---  ## 1. Zero-Trust Tenant Isolation  The platform enforces zero-trust tenant isolation through multiple decoupled security shields:  1. **Repository Guard Rails**: Finders require explicit \`organizationId\` parameter filtering. 2. **Domain Layer Assertions**: Tenant contexts are verified inside domain `
  },
  {
    slug: "services",
    titleEn: "Service Documentation",
    titleFa: "Service Documentation",
    category: "services",
    categoryFa: "Services",
    snippet: `# Service Documentation  This section describes the internal application services, their boundaries, and responsibilities.  ## Status Dictionary - **Implemented**: Verified existing service. - **Partial**: Service exists but is missing functionality. - **Planned**: Not currently implemented.  ## Core Services  ### Asynchronous Job Processing (\`src/services/jobs/\`) Defines a canonical, infrastructure-agnostic background processing boundary via \`IJobQueue\`, \`IJobExecutor\`, and \`IJobRepository\` int`
  },
  {
    slug: "user-guides",
    titleEn: "User Guides",
    titleFa: "User Guides",
    category: "user-guides",
    categoryFa: "User Guides",
    snippet: `# User Guides  This section provides user-facing documentation for navigating and operating Seorchable.  ## Status Dictionary - **Implemented**: Verified user workflows supported by the UI/backend. - **Partial**: Workflow is accessible but missing edge cases or polished UI. - **Planned**: Not currently implemented.  ## Core Concepts & Workflows  ### Dashboard Navigation The platform offers an authenticated unified Dashboard Shell with collapsible responsive sidebars, directional support (RTL/LTR`
  },
];
