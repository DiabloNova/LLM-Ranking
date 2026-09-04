/**
 * Phase 7C.5 — Enterprise Admin Console & Platform Operations Layer
 * Public Admin Feature Exports
 */

// Domain Layer
export * from "./domain/types";
export * from "./domain/entities";
export * from "./domain/events";

// Application Layer (CQRS)
export * from "./application/commands";
export * from "./application/queries";
export * from "./application/dto";
export * from "./application/mappers";
export { ApplicationAdminCommandHandler, ApplicationAdminQueryHandler } from "./application/handlers";

// Infrastructure Layer
export { AdminMockDatabase } from "./infrastructure/mock-db";

// API Layer
export * from "./api/v1/admin";

// Security Layer
export * from "./security";

// Analytics & Operations Consoles
export * from "./analytics";
export * from "./ai-management";
export * from "./prompt-management";
export * from "./crawler-management";
export * from "./system";
