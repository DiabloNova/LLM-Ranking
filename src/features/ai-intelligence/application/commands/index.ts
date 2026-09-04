import { PromptIntent, PriorityLevel, RelationshipType } from "../../domain/types";

export interface CreateBrandCommand {
  organizationId: string;
  name: string;
  description?: string;
  website: string;
  industry?: string;
  country?: string;
  actorId: string;
}

export interface DiscoverEntityCommand {
  organizationId: string;
  brandId: string;
  name: string;
  type: string;
  wikidataId?: string;
  wikipediaUrl?: string;
  confidenceScore: number;
  actorId: string;
}

export interface CaptureAIObservationCommand {
  organizationId: string;
  promptId: string;
  engineId: string;
  responseText: string;
  rawVisibilityScore: number;
  sentimentScore: number;
  confidenceScore: number;
  actorId: string;
}

export interface CalculateVisibilityScoreCommand {
  organizationId: string;
  brandId: string;
  engineId: string;
  overallScore: number;
  mentionScore: number;
  citationScore: number;
  authorityScore: number;
  sentimentScore: number;
  positionScore: number;
  actorId: string;
}

export interface GenerateRecommendationCommand {
  organizationId: string;
  brandId: string;
  category: string;
  priority: PriorityLevel;
  impactScore: number;
  description: string;
  actorId: string;
}

// Additional commands to enhance graph indexing and prompt tracks
export interface RegisterPromptCommand {
  organizationId: string;
  brandId: string;
  text: string;
  category: string;
  intent: PromptIntent;
  language: string;
  priority: PriorityLevel;
  actorId: string;
}

export interface LinkSemanticEntitiesCommand {
  organizationId: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationshipType: RelationshipType;
  confidenceScore: number;
  actorId: string;
}
