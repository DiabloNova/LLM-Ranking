import {
  Organization,
  Brand,
  Entity,
  EntityRelationship,
  AIEngine,
  Prompt,
  AIObservation,
  BrandMention,
  Citation,
  VisibilityScore,
  Recommendation,
  SubscriptionPlan,
  RelationshipType,
  AIEngineName,
  PromptIntent,
  PriorityLevel,
  RecommendationStatus,
  AuditMetadata,
  ConfidenceVO,
  SentimentVO,
  TextContextVO
} from "../types";

export interface ValidationError {
  field: string;
  message: string;
}

export type ValidationResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  errors: ValidationError[];
};

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null;
}

export function parseAudit(data: unknown): AuditMetadata {
  const defaultAudit: AuditMetadata = {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "system",
    updatedBy: "system",
    version: 1
  };

  if (!isRecord(data)) return defaultAudit;

  return {
    createdAt: typeof data.createdAt === "string" || data.createdAt instanceof Date ? data.createdAt : defaultAudit.createdAt,
    updatedAt: typeof data.updatedAt === "string" || data.updatedAt instanceof Date ? data.updatedAt : defaultAudit.updatedAt,
    createdBy: typeof data.createdBy === "string" ? data.createdBy : defaultAudit.createdBy,
    updatedBy: typeof data.updatedBy === "string" ? data.updatedBy : defaultAudit.updatedBy,
    deletedAt: typeof data.deletedAt === "string" || data.deletedAt instanceof Date ? data.deletedAt : undefined,
    version: typeof data.version === "number" ? data.version : defaultAudit.version
  };
}

export function parseConfidence(data: unknown): ConfidenceVO {
  const defaultConfidence: ConfidenceVO = { score: 1.0, rating: "high" };
  if (!isRecord(data)) return defaultConfidence;

  const score = typeof data.score === "number" ? data.score : defaultConfidence.score;
  let rating = data.rating as "high" | "medium" | "low";
  if (rating !== "high" && rating !== "medium" && rating !== "low") {
    rating = score >= 0.8 ? "high" : score >= 0.5 ? "medium" : "low";
  }

  return { score, rating };
}

export function parseSentiment(data: unknown): SentimentVO {
  const defaultSentiment: SentimentVO = { score: 0, label: "neutral", confidence: 1.0 };
  if (!isRecord(data)) return defaultSentiment;

  const score = typeof data.score === "number" ? data.score : defaultSentiment.score;
  let label = data.label as "positive" | "negative" | "neutral";
  if (label !== "positive" && label !== "negative" && label !== "neutral") {
    label = score > 15 ? "positive" : score < -15 ? "negative" : "neutral";
  }
  const confidence = typeof data.confidence === "number" ? data.confidence : defaultSentiment.confidence;

  return { score, label, confidence };
}

export function parseTextContext(data: unknown): TextContextVO {
  const defaultContext: TextContextVO = { textSnippet: "", charStart: 0, charEnd: 0 };
  if (!isRecord(data)) return defaultContext;

  return {
    textSnippet: typeof data.textSnippet === "string" ? data.textSnippet : defaultContext.textSnippet,
    charStart: typeof data.charStart === "number" ? data.charStart : defaultContext.charStart,
    charEnd: typeof data.charEnd === "number" ? data.charEnd : defaultContext.charEnd
  };
}

export const organizationSchema = {
  safeParse(data: unknown): ValidationResult<Organization> {
    const errors: ValidationError[] = [];
    if (!isRecord(data)) {
      return { success: false, errors: [{ field: "root", message: "Invalid data object" }] };
    }

    const { id, name, slug, plan, audit } = data;

    if (typeof id !== "string" || !id.trim()) {
      errors.push({ field: "id", message: "ID is required and must be a non-empty string" });
    }
    if (typeof name !== "string" || !name.trim()) {
      errors.push({ field: "name", message: "Name is required and must be a non-empty string" });
    }
    if (typeof slug !== "string" || !/^[a-z0-9-_]+$/.test(slug)) {
      errors.push({ field: "slug", message: "Slug must contain only lowercase alphanumeric characters, dashes, or underscores" });
    }

    const validPlans: SubscriptionPlan[] = ["free", "growth", "enterprise"];
    if (typeof plan !== "string" || !validPlans.includes(plan as SubscriptionPlan)) {
      errors.push({ field: "plan", message: `Plan must be one of: ${validPlans.join(", ")}` });
    }

    if (errors.length > 0) return { success: false, errors };

    return {
      success: true,
      data: {
        id: id as string,
        name: name as string,
        slug: slug as string,
        plan: plan as SubscriptionPlan,
        audit: parseAudit(audit)
      }
    };
  }
};

export const brandSchema = {
  safeParse(data: unknown): ValidationResult<Brand> {
    const errors: ValidationError[] = [];
    if (!isRecord(data)) {
      return { success: false, errors: [{ field: "root", message: "Invalid data object" }] };
    }

    const { id, organizationId, name, description, website, industry, country, audit } = data;

    if (typeof id !== "string" || !id.trim()) {
      errors.push({ field: "id", message: "ID is required" });
    }
    if (typeof organizationId !== "string" || !organizationId.trim()) {
      errors.push({ field: "organizationId", message: "organizationId is required" });
    }
    if (typeof name !== "string" || !name.trim()) {
      errors.push({ field: "name", message: "Name is required" });
    }
    if (typeof website !== "string" || !website.startsWith("http")) {
      errors.push({ field: "website", message: "Website must be a valid URL starting with http:// or https://" });
    }

    if (errors.length > 0) return { success: false, errors };

    return {
      success: true,
      data: {
        id: id as string,
        organizationId: organizationId as string,
        name: name as string,
        description: typeof description === "string" ? description : undefined,
        website: website as string,
        industry: typeof industry === "string" ? industry : undefined,
        country: typeof country === "string" ? country : undefined,
        audit: parseAudit(audit)
      }
    };
  }
};

export const entitySchema = {
  safeParse(data: unknown): ValidationResult<Entity> {
    const errors: ValidationError[] = [];
    if (!isRecord(data)) {
      return { success: false, errors: [{ field: "root", message: "Invalid data object" }] };
    }

    const { id, organizationId, brandId, name, type, wikidataId, wikipediaUrl, confidence, audit } = data;

    if (typeof id !== "string" || !id.trim()) {
      errors.push({ field: "id", message: "ID is required" });
    }
    if (typeof organizationId !== "string" || !organizationId.trim()) {
      errors.push({ field: "organizationId", message: "organizationId is required" });
    }
    if (typeof brandId !== "string" || !brandId.trim()) {
      errors.push({ field: "brandId", message: "brandId is required" });
    }
    if (typeof name !== "string" || !name.trim()) {
      errors.push({ field: "name", message: "Name is required" });
    }
    if (typeof type !== "string" || !type.trim()) {
      errors.push({ field: "type", message: "Type is required" });
    }

    if (wikidataId !== undefined && typeof wikidataId !== "string") {
      errors.push({ field: "wikidataId", message: "wikidataId must be a string" });
    }

    if (wikipediaUrl !== undefined && typeof wikipediaUrl !== "string") {
      errors.push({ field: "wikipediaUrl", message: "wikipediaUrl must be a string" });
    }

    if (errors.length > 0) return { success: false, errors };

    return {
      success: true,
      data: {
        id: id as string,
        organizationId: organizationId as string,
        brandId: brandId as string,
        name: name as string,
        type: type as string,
        wikidataId: wikidataId as string | undefined,
        wikipediaUrl: wikipediaUrl as string | undefined,
        confidence: parseConfidence(confidence),
        audit: parseAudit(audit)
      }
    };
  }
};

export const entityRelationshipSchema = {
  safeParse(data: unknown): ValidationResult<EntityRelationship> {
    const errors: ValidationError[] = [];
    if (!isRecord(data)) {
      return { success: false, errors: [{ field: "root", message: "Invalid data object" }] };
    }

    const { organizationId, sourceEntityId, targetEntityId, relationshipType, confidence, audit } = data;

    if (typeof organizationId !== "string" || !organizationId.trim()) {
      errors.push({ field: "organizationId", message: "organizationId is required" });
    }
    if (typeof sourceEntityId !== "string" || !sourceEntityId.trim()) {
      errors.push({ field: "sourceEntityId", message: "sourceEntityId is required" });
    }
    if (typeof targetEntityId !== "string" || !targetEntityId.trim()) {
      errors.push({ field: "targetEntityId", message: "targetEntityId is required" });
    }

    const validRelations: RelationshipType[] = ["owns", "creates", "competes_with", "related_to", "mentioned_with"];
    if (typeof relationshipType !== "string" || !validRelations.includes(relationshipType as RelationshipType)) {
      errors.push({ field: "relationshipType", message: `Relationship type must be one of: ${validRelations.join(", ")}` });
    }

    if (errors.length > 0) return { success: false, errors };

    return {
      success: true,
      data: {
        organizationId: organizationId as string,
        sourceEntityId: sourceEntityId as string,
        targetEntityId: targetEntityId as string,
        relationshipType: relationshipType as RelationshipType,
        confidence: parseConfidence(confidence),
        audit: parseAudit(audit)
      }
    };
  }
};

export const aiEngineSchema = {
  safeParse(data: unknown): ValidationResult<AIEngine> {
    const errors: ValidationError[] = [];
    if (!isRecord(data)) {
      return { success: false, errors: [{ field: "root", message: "Invalid data object" }] };
    }

    const { id, name, provider, version, capabilities, isActive, audit } = data;

    if (typeof id !== "string" || !id.trim()) {
      errors.push({ field: "id", message: "ID is required" });
    }

    const validEngines: AIEngineName[] = ["ChatGPT", "Claude", "Gemini", "Perplexity"];
    if (typeof name !== "string" || !validEngines.includes(name as AIEngineName)) {
      errors.push({ field: "name", message: `Name must be one of: ${validEngines.join(", ")}` });
    }

    if (typeof provider !== "string" || !provider.trim()) {
      errors.push({ field: "provider", message: "Provider is required" });
    }
    if (typeof version !== "string" || !version.trim()) {
      errors.push({ field: "version", message: "Version is required" });
    }
    if (!Array.isArray(capabilities)) {
      errors.push({ field: "capabilities", message: "Capabilities must be an array of strings" });
    }

    if (errors.length > 0) return { success: false, errors };

    return {
      success: true,
      data: {
        id: id as string,
        name: name as AIEngineName,
        provider: provider as string,
        version: version as string,
        capabilities: capabilities as string[],
        isActive: typeof isActive === "boolean" ? isActive : true,
        audit: parseAudit(audit)
      }
    };
  }
};

export const promptSchema = {
  safeParse(data: unknown): ValidationResult<Prompt> {
    const errors: ValidationError[] = [];
    if (!isRecord(data)) {
      return { success: false, errors: [{ field: "root", message: "Invalid data object" }] };
    }

    const { id, organizationId, brandId, text, category, intent, language, priority, audit } = data;

    if (typeof id !== "string" || !id.trim()) {
      errors.push({ field: "id", message: "ID is required" });
    }
    if (typeof organizationId !== "string" || !organizationId.trim()) {
      errors.push({ field: "organizationId", message: "organizationId is required" });
    }
    if (typeof brandId !== "string" || !brandId.trim()) {
      errors.push({ field: "brandId", message: "brandId is required" });
    }
    if (typeof text !== "string" || !text.trim()) {
      errors.push({ field: "text", message: "Text query is required" });
    }
    if (typeof category !== "string" || !category.trim()) {
      errors.push({ field: "category", message: "Category is required" });
    }

    const validIntents: PromptIntent[] = ["Discovery", "Comparison", "Recommendation", "Purchase", "Research", "Authority"];
    if (typeof intent !== "string" || !validIntents.includes(intent as PromptIntent)) {
      errors.push({ field: "intent", message: `Intent must be one of: ${validIntents.join(", ")}` });
    }

    if (typeof language !== "string" || !language.trim()) {
      errors.push({ field: "language", message: "Language is required" });
    }

    const validPriorities: PriorityLevel[] = ["low", "medium", "high"];
    if (typeof priority !== "string" || !validPriorities.includes(priority as PriorityLevel)) {
      errors.push({ field: "priority", message: `Priority must be one of: ${validPriorities.join(", ")}` });
    }

    if (errors.length > 0) return { success: false, errors };

    return {
      success: true,
      data: {
        id: id as string,
        organizationId: organizationId as string,
        brandId: brandId as string,
        text: text as string,
        category: category as string,
        intent: intent as PromptIntent,
        language: language as string,
        priority: priority as PriorityLevel,
        audit: parseAudit(audit)
      }
    };
  }
};

export const aiObservationSchema = {
  safeParse(data: unknown): ValidationResult<AIObservation> {
    const errors: ValidationError[] = [];
    if (!isRecord(data)) {
      return { success: false, errors: [{ field: "root", message: "Invalid data object" }] };
    }

    const {
      id,
      organizationId,
      promptId,
      engineId,
      responseText,
      visibilityScore,
      sentiment,
      confidence,
      executedAt,
      audit
    } = data;

    if (typeof id !== "string" || !id.trim()) {
      errors.push({ field: "id", message: "ID is required" });
    }
    if (typeof organizationId !== "string" || !organizationId.trim()) {
      errors.push({ field: "organizationId", message: "organizationId is required" });
    }
    if (typeof promptId !== "string" || !promptId.trim()) {
      errors.push({ field: "promptId", message: "promptId is required" });
    }
    if (typeof engineId !== "string" || !engineId.trim()) {
      errors.push({ field: "engineId", message: "engineId is required" });
    }
    if (typeof responseText !== "string") {
      errors.push({ field: "responseText", message: "responseText is required" });
    }
    if (typeof visibilityScore !== "number" || visibilityScore < 0 || visibilityScore > 100) {
      errors.push({ field: "visibilityScore", message: "visibilityScore must be between 0 and 100" });
    }

    if (errors.length > 0) return { success: false, errors };

    return {
      success: true,
      data: {
        id: id as string,
        organizationId: organizationId as string,
        promptId: promptId as string,
        engineId: engineId as string,
        responseText: responseText as string,
        visibilityScore: visibilityScore as number,
        sentiment: parseSentiment(sentiment),
        confidence: parseConfidence(confidence),
        executedAt: typeof executedAt === "string" || executedAt instanceof Date ? executedAt : new Date().toISOString(),
        audit: parseAudit(audit)
      }
    };
  }
};

export const brandMentionSchema = {
  safeParse(data: unknown): ValidationResult<BrandMention> {
    const errors: ValidationError[] = [];
    if (!isRecord(data)) {
      return { success: false, errors: [{ field: "root", message: "Invalid data object" }] };
    }

    const { id, organizationId, observationId, entityId, context, sentiment, confidence, audit } = data;

    if (typeof id !== "string" || !id.trim()) {
      errors.push({ field: "id", message: "ID is required" });
    }
    if (typeof organizationId !== "string" || !organizationId.trim()) {
      errors.push({ field: "organizationId", message: "organizationId is required" });
    }
    if (typeof observationId !== "string" || !observationId.trim()) {
      errors.push({ field: "observationId", message: "observationId is required" });
    }
    if (typeof entityId !== "string" || !entityId.trim()) {
      errors.push({ field: "entityId", message: "entityId is required" });
    }

    if (errors.length > 0) return { success: false, errors };

    return {
      success: true,
      data: {
        id: id as string,
        organizationId: organizationId as string,
        observationId: observationId as string,
        entityId: entityId as string,
        context: parseTextContext(context),
        sentiment: parseSentiment(sentiment),
        confidence: parseConfidence(confidence),
        audit: parseAudit(audit)
      }
    };
  }
};

export const citationSchema = {
  safeParse(data: unknown): ValidationResult<Citation> {
    const errors: ValidationError[] = [];
    if (!isRecord(data)) {
      return { success: false, errors: [{ field: "root", message: "Invalid data object" }] };
    }

    const { id, organizationId, observationId, url, domain, title, authorityScore, relevanceScore, audit } = data;

    if (typeof id !== "string" || !id.trim()) {
      errors.push({ field: "id", message: "ID is required" });
    }
    if (typeof organizationId !== "string" || !organizationId.trim()) {
      errors.push({ field: "organizationId", message: "organizationId is required" });
    }
    if (typeof observationId !== "string" || !observationId.trim()) {
      errors.push({ field: "observationId", message: "observationId is required" });
    }
    if (typeof url !== "string" || !url.trim()) {
      errors.push({ field: "url", message: "URL is required" });
    }
    if (typeof domain !== "string" || !domain.trim()) {
      errors.push({ field: "domain", message: "domain is required" });
    }
    if (typeof title !== "string" || !title.trim()) {
      errors.push({ field: "title", message: "title is required" });
    }
    if (typeof authorityScore !== "number" || authorityScore < 0 || authorityScore > 100) {
      errors.push({ field: "authorityScore", message: "authorityScore must be between 0 and 100" });
    }
    if (typeof relevanceScore !== "number" || relevanceScore < 0 || relevanceScore > 100) {
      errors.push({ field: "relevanceScore", message: "relevanceScore must be between 0 and 100" });
    }

    if (errors.length > 0) return { success: false, errors };

    return {
      success: true,
      data: {
        id: id as string,
        organizationId: organizationId as string,
        observationId: observationId as string,
        url: url as string,
        domain: domain as string,
        title: title as string,
        authorityScore: authorityScore as number,
        relevanceScore: relevanceScore as number,
        audit: parseAudit(audit)
      }
    };
  }
};

export const visibilityScoreSchema = {
  safeParse(data: unknown): ValidationResult<VisibilityScore> {
    const errors: ValidationError[] = [];
    if (!isRecord(data)) {
      return { success: false, errors: [{ field: "root", message: "Invalid data object" }] };
    }

    const {
      id,
      organizationId,
      brandId,
      engineId,
      overallScore,
      mentionScore,
      citationScore,
      authorityScore,
      sentimentScore,
      positionScore,
      date,
      audit
    } = data;

    if (typeof id !== "string" || !id.trim()) {
      errors.push({ field: "id", message: "ID is required" });
    }
    if (typeof organizationId !== "string" || !organizationId.trim()) {
      errors.push({ field: "organizationId", message: "organizationId is required" });
    }
    if (typeof brandId !== "string" || !brandId.trim()) {
      errors.push({ field: "brandId", message: "brandId is required" });
    }
    if (typeof engineId !== "string" || !engineId.trim()) {
      errors.push({ field: "engineId", message: "engineId is required" });
    }
    if (typeof overallScore !== "number" || overallScore < 0 || overallScore > 100) {
      errors.push({ field: "overallScore", message: "overallScore must be between 0 and 100" });
    }
    if (typeof mentionScore !== "number" || mentionScore < 0 || mentionScore > 100) {
      errors.push({ field: "mentionScore", message: "mentionScore must be between 0 and 100" });
    }
    if (typeof citationScore !== "number" || citationScore < 0 || citationScore > 100) {
      errors.push({ field: "citationScore", message: "citationScore must be between 0 and 100" });
    }
    if (typeof authorityScore !== "number" || authorityScore < 0 || authorityScore > 100) {
      errors.push({ field: "authorityScore", message: "authorityScore must be between 0 and 100" });
    }
    if (typeof sentimentScore !== "number" || sentimentScore < 0 || sentimentScore > 100) {
      errors.push({ field: "sentimentScore", message: "sentimentScore must be between 0 and 100" });
    }
    if (typeof positionScore !== "number" || positionScore < 0 || positionScore > 100) {
      errors.push({ field: "positionScore", message: "positionScore must be between 0 and 100" });
    }

    if (errors.length > 0) return { success: false, errors };

    return {
      success: true,
      data: {
        id: id as string,
        organizationId: organizationId as string,
        brandId: brandId as string,
        engineId: engineId as string,
        overallScore: overallScore as number,
        mentionScore: mentionScore as number,
        citationScore: citationScore as number,
        authorityScore: authorityScore as number,
        sentimentScore: sentimentScore as number,
        positionScore: positionScore as number,
        date: typeof date === "string" || date instanceof Date ? date : new Date().toISOString(),
        audit: parseAudit(audit)
      }
    };
  }
};

export const recommendationSchema = {
  safeParse(data: unknown): ValidationResult<Recommendation> {
    const errors: ValidationError[] = [];
    if (!isRecord(data)) {
      return { success: false, errors: [{ field: "root", message: "Invalid data object" }] };
    }

    const { id, organizationId, brandId, category, priority, impactScore, description, status, audit } = data;

    if (typeof id !== "string" || !id.trim()) {
      errors.push({ field: "id", message: "ID is required" });
    }
    if (typeof organizationId !== "string" || !organizationId.trim()) {
      errors.push({ field: "organizationId", message: "organizationId is required" });
    }
    if (typeof brandId !== "string" || !brandId.trim()) {
      errors.push({ field: "brandId", message: "brandId is required" });
    }
    if (typeof category !== "string" || !category.trim()) {
      errors.push({ field: "category", message: "Category is required" });
    }

    const validPriorities: PriorityLevel[] = ["low", "medium", "high"];
    if (typeof priority !== "string" || !validPriorities.includes(priority as PriorityLevel)) {
      errors.push({ field: "priority", message: `Priority must be one of: ${validPriorities.join(", ")}` });
    }

    if (typeof impactScore !== "number" || impactScore < 0 || impactScore > 100) {
      errors.push({ field: "impactScore", message: "impactScore must be between 0 and 100" });
    }
    if (typeof description !== "string" || !description.trim()) {
      errors.push({ field: "description", message: "description is required" });
    }

    const validStatuses: RecommendationStatus[] = ["pending", "applied", "ignored"];
    if (typeof status !== "string" || !validStatuses.includes(status as RecommendationStatus)) {
      errors.push({ field: "status", message: `Status must be one of: ${validStatuses.join(", ")}` });
    }

    if (errors.length > 0) return { success: false, errors };

    return {
      success: true,
      data: {
        id: id as string,
        organizationId: organizationId as string,
        brandId: brandId as string,
        category: category as string,
        priority: priority as PriorityLevel,
        impactScore: impactScore as number,
        description: description as string,
        status: status as RecommendationStatus,
        audit: parseAudit(audit)
      }
    };
  }
};
