/**
 * Phase 7C.1 — AI Visibility Intelligence Engine
 * Application Layer Data Transfer Objects (DTOs)
 * Protects domain aggregates and encapsulates API payloads.
 */

export interface OrganizationDTO {
  id: string;
  name: string;
  slug: string;
  plan: string;
}

export interface BrandDTO {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  website: string;
  industry?: string;
  country?: string;
}

export interface EntityDTO {
  id: string;
  brandId: string;
  name: string;
  type: string;
  wikidataId?: string;
  wikipediaUrl?: string;
  confidenceScore: number;
  confidenceRating: string;
}

export interface EntityRelationshipDTO {
  sourceEntityId: string;
  targetEntityId: string;
  relationshipType: string;
  confidenceScore: number;
}

export interface PromptDTO {
  id: string;
  brandId: string;
  text: string;
  category: string;
  intent: string;
  language: string;
  priority: string;
}

export interface AIObservationDTO {
  id: string;
  promptId: string;
  engineId: string;
  responseText: string;
  visibilityScore: number;
  sentimentLabel: string;
  sentimentScore: number;
  confidenceScore: number;
  executedAt: string;
}

export interface BrandMentionDTO {
  id: string;
  observationId: string;
  entityId: string;
  textSnippet: string;
  sentimentLabel: string;
  sentimentScore: number;
  confidenceScore: number;
}

export interface CitationDTO {
  id: string;
  observationId: string;
  url: string;
  domain: string;
  title: string;
  authorityScore: number;
  relevanceScore: number;
}

export interface VisibilityScoreDTO {
  id: string;
  brandId: string;
  engineId: string;
  overallScore: number;
  mentionScore: number;
  citationScore: number;
  authorityScore: number;
  sentimentScore: number;
  positionScore: number;
  date: string;
}

export interface RecommendationDTO {
  id: string;
  brandId: string;
  category: string;
  priority: string;
  impactScore: number;
  description: string;
  status: string;
}
