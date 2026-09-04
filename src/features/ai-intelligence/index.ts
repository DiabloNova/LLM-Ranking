/**
 * Phase 7C.1 — AI Visibility Intelligence Engine
 * Public Feature Exports
 */

// Domain Types
export * from "./domain/types";

// Validation Schemas
export * from "./domain/schemas";

// Domain Events
export * from "./domain/events";
export * from "./domain/events/event-bus";

// Domain Services
export { AeoScoreEngine } from "./domain/services/aeo-score-engine";

// Domain Entities & Aggregates
export { BrandEntity } from "./domain/entities/brand-entity";
export { ObservationAggregate } from "./domain/models/observation-aggregate";

// Repositories
export * from "./repositories/interfaces";
export * from "./repositories";

// Services
export { EntityService } from "./services/entity-service";
export { CitationService } from "./services/citation-service";
export { VisibilityService, type BrandDashboardPayload, type AggregateEngineScore } from "./services/visibility-service";
export { ObservationService } from "./services/observation-service";

// Application Layer (CQRS, Handlers & DTOs)
export * from "./application/dto";
export * from "./application/mappers";
export * from "./application/commands";
export * from "./application/queries";
export { ApplicationCommandHandler, ApplicationQueryHandler } from "./application/handlers";

// Security & Compliance
export * from "./security";

// API Layer Boundaries
export * from "./api";

// AI Pipeline Foundations
export * from "./pipeline";

// Semantic Knowledge Graph Foundations
export * from "./knowledge-graph";

// Observability Layer
export * from "./observability";
