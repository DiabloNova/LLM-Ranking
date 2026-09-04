import {
  Organization,
  Brand,
  Entity,
  EntityRelationship,
  Prompt,
  AIObservation,
  BrandMention,
  Citation,
  VisibilityScore,
  Recommendation
} from "../../domain/types";
import {
  OrganizationDTO,
  BrandDTO,
  EntityDTO,
  EntityRelationshipDTO,
  PromptDTO,
  AIObservationDTO,
  BrandMentionDTO,
  CitationDTO,
  VisibilityScoreDTO,
  RecommendationDTO
} from "../dto";

export const DTOHandlers = {
  organizationToDTO(domain: Organization): OrganizationDTO {
    return {
      id: domain.id,
      name: domain.name,
      slug: domain.slug,
      plan: domain.plan
    };
  },

  brandToDTO(domain: Brand): BrandDTO {
    return {
      id: domain.id,
      organizationId: domain.organizationId,
      name: domain.name,
      description: domain.description,
      website: domain.website,
      industry: domain.industry,
      country: domain.country
    };
  },

  entityToDTO(domain: Entity): EntityDTO {
    return {
      id: domain.id,
      brandId: domain.brandId,
      name: domain.name,
      type: domain.type,
      wikidataId: domain.wikidataId,
      wikipediaUrl: domain.wikipediaUrl,
      confidenceScore: domain.confidence.score,
      confidenceRating: domain.confidence.rating
    };
  },

  relationshipToDTO(domain: EntityRelationship): EntityRelationshipDTO {
    return {
      sourceEntityId: domain.sourceEntityId,
      targetEntityId: domain.targetEntityId,
      relationshipType: domain.relationshipType,
      confidenceScore: domain.confidence.score
    };
  },

  promptToDTO(domain: Prompt): PromptDTO {
    return {
      id: domain.id,
      brandId: domain.brandId,
      text: domain.text,
      category: domain.category,
      intent: domain.intent,
      language: domain.language,
      priority: domain.priority
    };
  },

  observationToDTO(domain: AIObservation): AIObservationDTO {
    return {
      id: domain.id,
      promptId: domain.promptId,
      engineId: domain.engineId,
      responseText: domain.responseText,
      visibilityScore: domain.visibilityScore,
      sentimentLabel: domain.sentiment.label,
      sentimentScore: domain.sentiment.score,
      confidenceScore: domain.confidence.score,
      executedAt: typeof domain.executedAt === "string" ? domain.executedAt : domain.executedAt.toISOString()
    };
  },

  mentionToDTO(domain: BrandMention): BrandMentionDTO {
    return {
      id: domain.id,
      observationId: domain.observationId,
      entityId: domain.entityId,
      textSnippet: domain.context.textSnippet,
      sentimentLabel: domain.sentiment.label,
      sentimentScore: domain.sentiment.score,
      confidenceScore: domain.confidence.score
    };
  },

  citationToDTO(domain: Citation): CitationDTO {
    return {
      id: domain.id,
      observationId: domain.observationId,
      url: domain.url,
      domain: domain.domain,
      title: domain.title,
      authorityScore: domain.authorityScore,
      relevanceScore: domain.relevanceScore
    };
  },

  visibilityScoreToDTO(domain: VisibilityScore): VisibilityScoreDTO {
    return {
      id: domain.id,
      brandId: domain.brandId,
      engineId: domain.engineId,
      overallScore: domain.overallScore,
      mentionScore: domain.mentionScore,
      citationScore: domain.citationScore,
      authorityScore: domain.authorityScore,
      sentimentScore: domain.sentimentScore,
      positionScore: domain.positionScore,
      date: typeof domain.date === "string" ? domain.date : domain.date.toISOString()
    };
  },

  recommendationToDTO(domain: Recommendation): RecommendationDTO {
    return {
      id: domain.id,
      brandId: domain.brandId,
      category: domain.category,
      priority: domain.priority,
      impactScore: domain.impactScore,
      description: domain.description,
      status: domain.status
    };
  }
};
