/**
 * Phase 7C.1 — AI Visibility Intelligence Engine
 * Enterprise Domain Event Contracts & Metadata Specifications
 */

export interface EventMetadata {
  eventId: string; // Unique event trace ID
  organizationId: string; // Strict tenant boundary key
  actorId: string; // User or system identity initiating action
  timestamp: string; // ISO-8601 creation time
  correlationId: string; // Tracks the aggregate root trace transaction
  causationId: string; // ID of the triggering upstream cause event
  version: number; // Contract version
}

export interface DomainEvent<TPayload = unknown> {
  metadata: EventMetadata;
  eventType: string; // Event routing type key (e.g. "aibi.brand.created")
  aggregateId: string; // ID of target Aggregate Root
  payload: TPayload; // Structured typed payload data
}

// Event Bus Handler contract
export interface IEventHandler<T extends DomainEvent = DomainEvent> {
  handle(event: T): Promise<void>;
  supports(eventType: string): boolean;
}

// 1. BrandCreatedEvent
export interface BrandCreatedPayload {
  brandId: string;
  name: string;
  website: string;
  industry?: string;
  country?: string;
  createdBy: string;
}
export type BrandCreatedEvent = DomainEvent<BrandCreatedPayload>;

// 2. EntityDiscoveredEvent
export interface EntityDiscoveredPayload {
  entityId: string;
  brandId: string;
  name: string;
  type: string;
  wikidataId?: string;
  confidenceScore: number;
}
export type EntityDiscoveredEvent = DomainEvent<EntityDiscoveredPayload>;

// 3. AIObservationCapturedEvent
export interface AIObservationCapturedPayload {
  observationId: string;
  promptId: string;
  engineId: string;
  visibilityScore: number;
  sentimentLabel: "positive" | "negative" | "neutral";
  sentimentScore: number;
  mentionsCount: number;
  citationsCount: number;
}
export type AIObservationCapturedEvent = DomainEvent<AIObservationCapturedPayload>;

// 4. CitationCreatedEvent
export interface CitationCreatedPayload {
  citationId: string;
  observationId: string;
  url: string;
  domain: string;
  authorityScore: number;
  relevanceScore: number;
}
export type CitationCreatedEvent = DomainEvent<CitationCreatedPayload>;

// 5. VisibilityScoreCalculatedEvent
export interface VisibilityScoreCalculatedPayload {
  scoreId: string;
  brandId: string;
  engineId: string;
  overallScore: number;
  mentionScore: number;
  citationScore: number;
  sentimentScore: number;
}
export type VisibilityScoreCalculatedEvent = DomainEvent<VisibilityScoreCalculatedPayload>;

// 6. RecommendationGeneratedEvent
export interface RecommendationGeneratedPayload {
  recommendationId: string;
  brandId: string;
  category: string;
  priority: "low" | "medium" | "high";
  impactScore: number;
  description: string;
}
export type RecommendationGeneratedEvent = DomainEvent<RecommendationGeneratedPayload>;

/**
 * Event Factory supporting full tracing, correlation, and causation headers
 */
export const DomainEventFactory = {
  create<T>(
    eventType: string,
    aggregateId: string,
    organizationId: string,
    payload: T,
    actorId = "system",
    correlationId?: string,
    causationId?: string,
    version = 1
  ): DomainEvent<T> {
    const traceId = `trace-${Math.random().toString(36).substr(2, 9)}`;
    return {
      metadata: {
        eventId: `evt-${Math.random().toString(36).substr(2, 9)}`,
        organizationId,
        actorId,
        timestamp: new Date().toISOString(),
        correlationId: correlationId || traceId,
        causationId: causationId || traceId,
        version
      },
      eventType,
      aggregateId,
      payload
    };
  }
};

// Export event-bus sub-module directly for clean relative resolution
export * from "./event-bus";
