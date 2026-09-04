/**
 * Phase 7C.1 — AI Visibility Intelligence Engine
 * Enterprise SaaS Multi-Tenant Domain Type Definitions & Value Objects
 */

export type SubscriptionPlan = "free" | "growth" | "enterprise";

/**
 * Value Object: Audit Metadata
 * Captures lifecycle, ownership, and soft deletion information for compliance and security
 */
export interface AuditMetadata {
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: string; // User ID or system service identifier
  updatedBy: string; // User ID or system service identifier
  deletedAt?: Date | string; // Soft deletion support
  version: number; // Optimistic locking version
}

/**
 * Value Object: Sentiment
 * Captures granular sentiment indicators for brand mentions or AI observations
 */
export interface SentimentVO {
  score: number; // Normalized -100 (negative) to 100 (positive)
  label: "positive" | "negative" | "neutral";
  confidence: number; // 0.0 to 1.0 confidence of sentiment classifier
}

/**
 * Value Object: Confidence
 * Captures statistical confidence ratings
 */
export interface ConfidenceVO {
  score: number; // 0.0 to 1.0
  rating: "high" | "medium" | "low";
}

/**
 * Entity: Organization
 * Aggregate Root representing the Multi-Tenant subscription holder.
 */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: SubscriptionPlan;
  audit: AuditMetadata;
}

/**
 * Entity: Brand
 * Represents a company/brand monitored inside a Tenant/Organization.
 */
export interface Brand {
  id: string;
  organizationId: string; // strict multi-tenant partition key
  name: string;
  description?: string;
  website: string;
  industry?: string;
  country?: string;
  audit: AuditMetadata;
}

/**
 * Entity: Entity
 * Represents a semantic entity extracted from AI ecosystems (Wikidata/Knowledge Graphs).
 */
export interface Entity {
  id: string;
  organizationId: string; // strict multi-tenant partition key
  brandId: string;
  name: string;
  type: string; // e.g., "Brand", "Product", "Competitor", "Person", "Organization"
  wikidataId?: string;
  wikipediaUrl?: string;
  confidence: ConfidenceVO; // Rich Value Object
  aliases?: string[];
  description?: string;
  provenance?: Record<string, unknown>;
  authorityScore?: number;
  completenessScore?: number;
  status?: string;
  audit: AuditMetadata;
}

export type RelationshipType = "owns" | "creates" | "competes_with" | "related_to" | "mentioned_with";

/**
 * Entity: EntityRelationship
 * Defines direct semantic connections within the client's Knowledge Graph.
 */
export interface EntityRelationship {
  organizationId: string; // strict multi-tenant partition key
  sourceEntityId: string;
  targetEntityId: string;
  relationshipType: RelationshipType;
  confidence: ConfidenceVO; // Rich Value Object
  direction?: "directed" | "undirected" | string;
  provenance?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  audit: AuditMetadata;
}

export type AIEngineName = "ChatGPT" | "Claude" | "Gemini" | "Perplexity";

/**
 * Entity: AIEngine
 * Represents an external generative engine / platform being analyzed.
 */
export interface AIEngine {
  id: string; // e.g. "engine-chatgpt-4o"
  name: AIEngineName;
  provider: string; // e.g., "OpenAI"
  version: string; // e.g., "gpt-4o"
  capabilities: string[]; // e.g. ["RAG", "web_search", "citations"]
  isActive: boolean;
  audit: AuditMetadata;
}

export type PromptIntent = "Discovery" | "Comparison" | "Recommendation" | "Purchase" | "Research" | "Authority";

export type PriorityLevel = "low" | "medium" | "high";

/**
 * Entity: Prompt
 * Represents an AEO trackable query formulated to evaluate generative responses.
 */
export interface Prompt {
  id: string;
  organizationId: string; // strict multi-tenant partition key
  brandId: string;
  text: string;
  category: string;
  intent: PromptIntent;
  language: "en" | "fa" | string;
  priority: PriorityLevel;
  audit: AuditMetadata;
}

/**
 * Entity: AIObservation
 * Represents a captured generative response run.
 */
export interface AIObservation {
  id: string;
  organizationId: string; // strict multi-tenant partition key
  promptId: string;
  engineId: string;
  responseText: string;
  visibilityScore: number; // 0 to 100 AEO composite score
  sentiment: SentimentVO; // Rich Value Object
  confidence: ConfidenceVO; // Rich Value Object
  executedAt: Date | string;
  audit: AuditMetadata;
}

export interface TextContextVO {
  textSnippet: string;
  charStart: number;
  charEnd: number;
}

/**
 * Entity: BrandMention
 * Represents a resolved brand presence mapped within an AIObservation.
 */
export interface BrandMention {
  id: string;
  organizationId: string; // strict multi-tenant partition key
  observationId: string;
  entityId: string;
  context: TextContextVO; // Rich Value Object
  sentiment: SentimentVO; // Rich Value Object
  confidence: ConfidenceVO; // Rich Value Object
  audit: AuditMetadata;
}

/**
 * Entity: Citation
 * Represents a cited source/link resolved within an AIObservation response.
 */
export interface Citation {
  id: string;
  organizationId: string; // strict multi-tenant partition key
  observationId: string;
  url: string;
  domain: string;
  title: string;
  authorityScore: number; // 0 to 100 (Domain Trust)
  relevanceScore: number; // 0 to 100 (Topic Similarity)
  audit: AuditMetadata;
}

/**
 * Entity: VisibilityScore
 * Aggregated analytics snapshot representing engine-specific brand visibility over time.
 */
export interface VisibilityScore {
  id: string;
  organizationId: string; // strict multi-tenant partition key
  brandId: string;
  engineId: string;
  overallScore: number;
  mentionScore: number;
  citationScore: number;
  authorityScore: number;
  sentimentScore: number;
  positionScore: number;
  date: Date | string;
  audit: AuditMetadata;
}

export type RecommendationStatus = "pending" | "applied" | "ignored";

/**
 * Entity: Recommendation
 * Represents an autonomous recommendation action proposed to boost brand visibility.
 */
export interface Recommendation {
  id: string;
  organizationId: string; // strict multi-tenant partition key
  brandId: string;
  category: string;
  priority: PriorityLevel;
  impactScore: number; // Predicted lift (0-100)
  description: string;
  status: RecommendationStatus;
  audit: AuditMetadata;
}

/**
 * Entity: DocumentEmbedding
 * Represents stored text chunks along with dense high-dimensional semantic vector embeddings.
 */
export interface DocumentEmbedding {
  id: string;
  tenantId: string; // strict multi-tenant partition key
  contentChunk: string;
  metadata: Record<string, unknown>;
  embedding: number[];
  createdAt: Date | string;
}

/**
 * Entity: KgEntity
 * Represents a semantic entity inside the Optimus AI Persian Knowledge Graph.
 */
export interface KgEntity {
  id: string;
  tenantId: string; // strict multi-tenant partition key
  name: string;
  type: string;
  properties: Record<string, unknown>;
  createdAt: Date | string;
  updatedAt: Date | string;
}
/**
 * Task 9.2 — Site Architecture Intelligence Domain Types
 */
export interface SiteArchitectureInput {
  pages: Page[];
  links: Array<{
    sourceUrl: string;
    targetUrl: string;
    normalizedTargetUrl: string;
    anchorText?: string;
    rel?: string | null;
  }>;
  seoSignalsMap?: Record<string, unknown>; // URL -> SeoSignals
  rootUrl?: string; // Optional entry root URL override
}

export type SiteArchitectureCategory =
  | "site-structure"
  | "crawl-depth"
  | "internal-linking"
  | "orphan-page"
  | "content-hierarchy"
  | "architecture";

export interface CrawlDepthResult {
  url: string;
  crawlDepth: number; // 0 for root
  pathFromRoot: string[];
  isReachableFromRoot: boolean;
}

export interface SiteArchitectureFinding {
  id: string;
  organizationId: string;
  websiteId: string;
  category: SiteArchitectureCategory;
  code: string;
  title: string;
  explanation: string;
  severity: FindingSeverity;
  confidence: FindingConfidence;
  affectedResource: string;
  evidence: Record<string, unknown>;
  recommendation: {
    action: string;
    description: string;
    impact: string;
  };
}

export interface SiteArchitectureAnalysisResult {
  findings: SiteArchitectureFinding[];
  crawlDepths: CrawlDepthResult[];
  orphanCandidates: string[];
  metrics: {
    totalPagesAnalyzed: number;
    totalInternalLinks: number;
    maxCrawlDepth: number;
    avgCrawlDepth: number;
    orphanPageCount: number;
    deepPagesCount: number; // Depth > 3
  };
}
/**
 * LLM Analytics Domain Interfaces (Task 8.3)
 * Task 9.1 — Keyword Intelligence Domain Types
 */
export type KeywordSource = "content" | "title" | "heading" | "competitor" | "prompt" | "entity" | "topic";

export type SearchIntent = "informational" | "commercial" | "transactional" | "navigational" | "unknown";

export interface DiscoveredKeyword {
  term: string;
  normalizedTerm: string;
  source: KeywordSource;
  evidence: {
    sourceType: KeywordSource;
    sourceReference: string;
    description: string;
    rawExcerpt?: string;
  };
  intent: SearchIntent;
  intentConfidence: number; // 0.0 - 1.0
  opportunityScore?: number; // 0 - 100 or undefined if data unavailable
  language: string;
  discoveredAt: Date | string;
}

export interface KeywordCluster {
  id: string;
  clusterName: string;
  primaryKeyword: DiscoveredKeyword;
  memberKeywords: DiscoveredKeyword[];
  theme: string;
  size: number;
}

export interface KeywordGap {
  id: string;
  organizationId: string;
  keyword: string;
  normalizedKeyword: string;
  sourceCompetitorId?: string;
  sourceCompetitorDomain?: string;
  tenantCoverageStatus: "absent" | "semantic_coverage" | "partial_coverage" | "covered";
  evidence: {
    competitorPresence: string;
    tenantExistingPageUrl?: string;
    tenantExistingCoverageSummary?: string;
    reasoning: string;
  };
  searchIntent: SearchIntent;
  recommendedAction: string;
}

export interface KeywordIntelligenceResult {
  discoveredKeywords: DiscoveredKeyword[];
  clusters: KeywordCluster[];
  gaps: KeywordGap[];
  semanticKeywords: Array<{
    primaryTerm: string;
    relatedTerm: string;
    relationshipType: string;
    evidence: string;
  }>;
  longTailKeywords: Array<{
    seedTerm: string;
    variant: string;
    intent: SearchIntent;
    evidence: string;
  }>;
  summary: {
    discoveredCount: number;
    clusterCount: number;
    gapCount: number;
    semanticCount: number;
    longTailCount: number;
  };
}

/**
/**
 * Content Brief Domain Models (Task 7.1)
 */

export interface LLMEvaluationRecord {
  id: string;
  organizationId: string; // Tenant partition key
  model: string; // e.g. "gemini-1.5-pro", "gpt-4o", "claude-3.5-sonnet"
  provider?: string; // e.g. "Google", "OpenAI", "Anthropic"
  evaluatedAt: Date | string;
  promptText?: string;
  responseText?: string;

  // Quality signals (0-100)
  correctness?: number;
  relevance?: number;
  completeness?: number;
  factuality?: number;
  citationQuality?: number;
  answerability?: number;
  overallAnswerQuality?: number;

  // Sentiment signal
  sentiment?: "positive" | "neutral" | "negative";
  sentimentScore?: number; // 0-100

  // Bias signals
  biasDetected?: boolean;
  biasScore?: number; // 0-100 where 100 = completely unbiased
  biasCategory?: string; // e.g. "framing", "omission", "favoritism"

  // Operational signals
  latencyMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  cost?: number; // USD
}

export interface LLMSentimentAnalytics {
  positive: number;
  neutral: number;
  negative: number;
  positiveRatio: number;
  neutralRatio: number;
  negativeRatio: number;
  aggregateSentimentScore: number | null;
}

export interface LLMBiasAnalytics {
  biasScore: number | null; // 0-100
  biasedAnswers: number;
  unbiasedAnswers: number;
  biasRate: number; // 0.0 to 1.0
  categories: Array<{ category: string; occurrences: number }>;
}

export interface LLMAnswerQualityAnalytics {
  answerQualityScore: number | null; // 0-100
  correctness: number | null;
  relevance: number | null;
  completeness: number | null;
  factuality: number | null;
  citationQuality: number | null;
}

export interface LLMTokenUsageAnalytics {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  averageInputTokens: number;
  averageOutputTokens: number;
  averageTotalTokens: number;
}

export interface LLMLatencyAnalytics {
  averageLatencyMs: number | null;
  minLatencyMs: number | null;
  maxLatencyMs: number | null;
}

export interface LLMCostAnalytics {
  totalCost: number | null;
  averageCost: number | null;
  costPer1kTokens: number | null;
}

export interface LLMModelSummary {
  model: string;
  provider?: string;
  evaluationsCount: number;
  performanceScore: number;
  answerQuality: number | null;
  sentimentScore: number | null;
  biasScore: number | null;
  averageLatencyMs: number | null;
  averageInputTokens: number;
  averageOutputTokens: number;
  averageTotalTokens: number;
  averageCost: number | null;
  sentiment: LLMSentimentAnalytics;
  bias: LLMBiasAnalytics;
  qualityBreakdown: LLMAnswerQualityAnalytics;
  tokenUsage: LLMTokenUsageAnalytics;
  latency: LLMLatencyAnalytics;
  cost: LLMCostAnalytics;
}

export interface LLMAnalyticsComparisonResult {
  organizationId: string;
  totalEvaluations: number;
  models: LLMModelSummary[];
  ranking: string[]; // Model identifiers ordered by performanceScore DESC, then model ASC
}

/**
 * Competitive Radar (Task 6.3) Type Definitions
 */
export type DataAvailabilityStatus =
  | "available"
  | "partial"
  | "missing"
  | "unavailable"
  | "not_applicable"
  | "incompatible";

export interface RadarDimension {
  name: string;
  definition: string;
  rawValue: string | number | null;
  normalizedValue: number | null;
  scale: string;
  measurementPeriod: string;
  comparisonContext: string;
  status: DataAvailabilityStatus;
  provenance: string;
}

export interface TenantRadarData {
  tenantId: string;
  dimensions: Record<string, RadarDimension>;
}

export interface CompetitorRadarData {
  competitorId: string;
  competitorName: string;
  dimensions: Record<string, RadarDimension>;
}

export interface CompetitiveRadarSnapshot {
  tenantData: TenantRadarData;
  competitorData: CompetitorRadarData[];
}

export interface CompetitiveInsight {
  type: "strength" | "weakness" | "opportunity";
  dimension: string;
  tenantValue: string | number | null;
  competitiveReference: string | number | null;
  competitiveGap: string | number | null;
  severity: "low" | "medium" | "high" | "critical" | null;
  measurementPeriod: string;
  comparisonContext: string;
  evidence: Record<string, unknown>;
}

export type CompetitiveFindingType =
  | "technical_gap"
  | "content_gap"
  | "keyword_gap"
  | "topic_gap"
  | "structural_difference"
  | "ai_visibility_gap"
  | "citation_gap"
  | "prompt_gap"
  | "brand_mention_gap"
  | "ai_recommendation_gap"
  | "citation_overlap";
export type CompetitivePositionType = "advantage" | "disadvantage" | "neutral";
export type DifferenceDirectionType = "positive" | "negative" | "none";

/**
 * Entity: CompetitiveSeoFinding
 * Represents one structured competitive gap or advantage find between tenant and competitor.
 */
export interface CompetitiveSeoFinding {
  id: string;
  organizationId: string; // Tenant context
  competitorId: string; // Competitor identity link
  findingType: CompetitiveFindingType;
  comparisonScope: string; // e.g. 'canonical_coverage'
  competitivePosition: CompetitivePositionType;
  tenantValue?: string;
  competitorValue?: string;
  difference?: number;
  differenceDirection: DifferenceDirectionType;
  severity: "low" | "medium" | "high" | "critical";
  evidence: Record<string, unknown>; // supporting telemetry traces
  sourceReference?: string; // target URLs evaluated
  calculationMetadata: Record<string, unknown>; // intermediate values
  createdAt: Date | string;
  updatedAt: Date | string;
  version: number;
}

/**
 * AEO Content Intelligence Types (Task 5.4)
 */
export type AnswerabilityLevel =
  | "directly_answerable"
  | "partially_answerable"
  | "indirectly_answerable"
  | "not_answerable"
  | "insufficient_evidence";

export type EntityCoverageStatus =
  | "covered"
  | "partially_covered"
  | "mentioned_only"
  | "not_covered"
  | "unresolved"
  | "ambiguous";

export type QuestionCoverageStatus =
  | "answered"
  | "partially_answered"
  | "indirectly_answered"
  | "unanswered"
  | "not_applicable"
  | "insufficient_evidence";

export type CitationReadinessLevel =
  | "high"
  | "medium"
  | "low"
  | "insufficient_evidence";

export type KgAlignmentStatus =
  | "aligned"
  | "missing_entity"
  | "missing_relationship"
  | "unresolved_entity"
  | "ambiguous_entity"
  | "potential_contradiction"
  | "conflicting_evidence";

export interface AnswerabilityAnalysis {
  level: AnswerabilityLevel;
  evidence: string;
  coveredDimensions: string[];
  missingDimensions: string[];
  confidence: number;
}

export interface EntityCoverageItem {
  entityId?: string;
  name: string;
  type: string;
  status: EntityCoverageStatus;
  evidence: string;
  confidence: number;
}

export interface SemanticCoverageAnalysis {
  score: number; // 0-100
  conceptsCovered: string[];
  conceptsMissing: string[];
  gapsIdentified: string[];
}

export interface QuestionCoverageItem {
  question: string;
  status: QuestionCoverageStatus;
  evidence: string;
}

export interface QuestionCoverageAnalysis {
  score: number; // 0-100
  questionUniverseType: string;
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  items: QuestionCoverageItem[];
}

export interface CitationReadinessAnalysis {
  level: CitationReadinessLevel;
  score: number; // 0-100
  hasFactualClaims: boolean;
  hasConciseAnswerBlock: boolean;
  hasSourceAttribution: boolean;
  hasAuthorInfo: boolean;
  hasPublicationDate: boolean;
  hasCanonicalUrl: boolean;
  evidence: string;
  confidence: number;
}

export interface StructuredAnswerQualityAnalysis {
  score: number; // 0-100
  headingHierarchyOk: boolean;
  hasDirectAnswerParagraphs: boolean;
  hasLists: boolean;
  hasTables: boolean;
  hasDefinitions: boolean;
  hasFAQStructure: boolean;
  sectionClarityOk: boolean;
  findings: {
    headingStructure: string;
    answerDirectness: string;
    questionAnswerPairing: string;
    listQuality: string;
    tableQuality: string;
    definitionQuality: string;
    sectionClarity: string;
    semanticStructure: string;
  };
}

export interface KgAlignmentItem {
  alignmentType: "kg_to_content" | "content_to_kg";
  entityName: string;
  propertyName?: string;
  expectedValue?: string;
  actualValue?: string;
  status: KgAlignmentStatus;
  evidence: string;
}

export interface KgAlignmentAnalysis {
  score: number; // 0-100
  alignedCount: number;
  mismatchedCount: number;
  items: KgAlignmentItem[];
}

export interface AeoAnalysis {
  id: string;
  organizationId: string;
  pageId: string;
  overallScore: number;
  answerability: AnswerabilityAnalysis;
  entityCoverage: EntityCoverageItem[];
  semanticCoverage: SemanticCoverageAnalysis;
  questionCoverage: QuestionCoverageAnalysis;
  citationReadiness: CitationReadinessAnalysis;
  structuredAnswerQuality: StructuredAnswerQualityAnalysis;
  kgAlignment: KgAlignmentAnalysis;
  scoringVersion: string;
  analyzerVersion: string;
  provenance: {
    provider: string;
    model: string;
    modelVersion?: string;
    timestamp: string;
    latencyMs?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface FaqOpportunity {
  id: string;
  organizationId: string;
  pageId: string;
  question: string;
  sourceType: string; // e.g. "ai_visibility_prompt" or "unanswered_question"
  evidenceSourceId?: string; // links to prompt or other source
  priority: PriorityLevel;
  impactScore: number; // 0-100
  status: "active" | "implemented" | "ignored";
  createdAt: string;
}

export interface KgAlignment {
  id: string;
  organizationId: string;
  pageId: string;
  alignmentType: "kg_to_content" | "content_to_kg";
  entityName: string;
  propertyName?: string;
  expectedValue?: string;
  actualValue?: string;
  status: KgAlignmentStatus;
  createdAt: string;
}

/**
 * AI Visibility Audit Types
 */
export type AIVisibilityAuditStatus = "PENDING" | "RUNNING" | "ANALYZING" | "COMPLETED" | "FAILED";

export interface AIVisibilityAuditMetrics {
  answerVisibilityScore: number;
  brandMentionScore: number;
  entityRecognitionScore: number;
  citationPresenceScore: number;
  sourceAuthorityScore: number;
  answerInclusionScore: number;
}

export interface AIVisibilityAudit {
  id: string;
  organizationId: string;
  brandId: string;
  status: AIVisibilityAuditStatus;
  overallScore: number | null;
  metrics: Partial<AIVisibilityAuditMetrics>;
  promptsCoverage: {
    total: number;
    executed: number;
    analyzed: number;
    failed: number;
    skipped: number;
  };
  evidenceSummary: {
    mentions: Array<{ promptId: string; count: number; snippet: string; level: string }>;
    citations: Array<{ promptId: string; url: string; domain: string; authority: string | number }>;
    entityRecognition: Array<{ promptId: string; status: string }>;
    answerInclusion: Array<{ promptId: string; status: string }>;
  };
  scoringVersion: string;
  analyzerVersion: string;
  audit: AuditMetadata;
}

export type AuditPromptStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

export interface AuditPromptAnalysis {
  answerVisibility: {
    level: "not_mentioned" | "indirectly_referenced" | "directly_mentioned" | "prominently_included" | "recommended_preferred";
    evidence: string;
    confidence: number;
  };
  brandMentions: {
    detected: boolean;
    count: number;
    type: string;
    evidence: string;
    confidence: number;
  };
  entityRecognition: {
    status: "not_recognized" | "ambiguously_recognized" | "correctly_recognized" | "strongly_associated";
    evidence: string;
    confidence: number;
  };
  citationPresence: {
    present: boolean;
    count: number;
    citations: Array<{
      url: string;
      domain: string;
      title: string;
      isTargetDomain: boolean;
      authority: string | number; // number or "unknown"
    }>;
    confidence: number;
  };
  sourceAuthority: {
    status: "unknown" | "resolved";
    averageScore?: number;
    evidence: string;
  };
  answerInclusion: {
    status: "absent" | "mentioned_but_not_included" | "included" | "prominently_included" | "recommended_preferred";
    evidence: string;
    confidence: number;
  };
  scoreContribution: number;
}

export interface AuditPrompt {
  id: string;
  organizationId: string;
  auditId: string;
  promptText: string;
  category: string;
  targetEntity: string;
  locale: string;
  status: AuditPromptStatus;
  errorMessage?: string;
  latencyMs?: number;
  executedAt?: string;
  responseText?: string;
  analysis: Partial<AuditPromptAnalysis>;
  audit: AuditMetadata;
}

/**
 * AI Prompt Intelligence Types (Task 5.1)
 */
export type PromptCategory =
  | "Brand Discovery"
  | "Product/Service Discovery"
  | "Category"
  | "Recommendation"
  | "Comparison"
  | "Problem/Solution"
  | "Local/Geographic"
  | "Entity"
  | "Informational"
  | "Transactional"
  | "Navigational";

export type PromptIntentType = "Discovery" | "Comparison" | "Recommendation" | "Purchase" | "Research" | "Authority" | "Informational" | "Transactional" | "Navigational";

export interface PromptVariable {
  name: string;
  defaultValue: string;
  description?: string;
}

export interface PromptDefinition {
  id: string;
  organizationId: string; // Tenant context
  brandId: string; // Target brand
  name: string; // friendly name
  promptTemplate: string; // parameterized string with {varName} placeholders
  category: PromptCategory;
  intent: PromptIntentType;
  locale: string;
  isActive: boolean;
  variables: PromptVariable[];
  competitors: string[]; // configured target competitors
  tags: string[];
  notes?: string;
  version: number; // Snapshot template version
  audit: AuditMetadata;
}

export interface PromptSchedule {
  id: string;
  organizationId: string;
  promptId: string;
  enabled: boolean;
  cronExpression: string; // cron syntax
  timezone: string; // e.g. "Asia/Tehran" or "UTC"
  nextExecutionAt?: Date | string;
  lastExecutionAt?: Date | string;
  status: "IDLE" | "QUEUED" | "RUNNING" | "FAILED";
  failureReason?: string;
  scheduleVersion: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type PromptExecutionStatus = "queued" | "running" | "succeeded" | "failed" | "timed_out" | "cancelled";

export interface PromptExecution {
  id: string;
  organizationId: string;
  promptId: string;
  promptVersion: number;
  resolvedPromptText: string;
  variablesValues: Record<string, string>;
  status: PromptExecutionStatus;
  provider: string;
  model: string;
  modelVersion?: string;
  responseText?: string;
  latencyMs?: number;
  errorMessage?: string;
  attempts: number;
  maxAttempts: number;
  scheduledFor?: Date | string;
  executedAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type PositionPresence = "not_present" | "mentioned" | "recommended" | "ranked" | "unknown";
export type EvidenceStructureType = "numbered_list" | "bullet_list" | "table" | "prose" | "unknown";

export interface PositionObservation {
  id: string;
  organizationId: string;
  sourceExecutionId: string;
  subjectEntityId: string; // Target brand Name or competitor name
  presence: PositionPresence;
  numericPosition?: number; // numbered list index (1-based)
  evidenceExcerpt: string;
  evidenceStructure: EvidenceStructureType;
  confidence: number;
  analyzerVersion: string;
  createdAt: Date | string;
}

/**
 * AI Citation Intelligence Types (Task 5.2)
 */
export type CitationSourceClassification =
  | "owned"
  | "competitor"
  | "third_party"
  | "publisher_media"
  | "government"
  | "academic_research"
  | "directory"
  | "marketplace"
  | "social"
  | "forum_community"
  | "documentation"
  | "reference_encyclopedia"
  | "other"
  | "unknown";

export interface CitationSource {
  id: string;
  organizationId: string;
  domain: string; // unique normalized lowercased domain (e.g. "wikipedia.org")
  canonicalUrl?: string;
  classification: CitationSourceClassification;
  qualityScore: number; // calculated deterministic quality
  authorityScore: number; // calculated independently evaluated authority
  firstSeenAt: Date | string;
  lastSeenAt: Date | string;
  occurrenceCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CitationOccurrence {
  id: string;
  organizationId: string;
  sourceId: string; // links to citation_sources
  auditId?: string; // links to ai_visibility_audits (nullable)
  executionId?: string; // links to prompt_executions (nullable)
  promptId?: string; // links to prompts (nullable)
  observationId?: string; // links to ai_observations (nullable)
  url: string; // exact matched raw URL
  title?: string;
  snippet?: string; // surrounding text context excerpt
  position?: number; // list index position of this citation in the response
  confidence: number; // extraction confidence (0.0 to 1.0)
  createdAt: Date | string;
}

/**
 * AI Brand Intelligence Types (Task 5.3)
 */
export type RecommendationStatusType =
  | "mention"
  | "consideration"
  | "recommendation"
  | "strong_recommendation"
  | "negative_recommendation";

export interface BrandAssociation {
  id: string;
  organizationId: string;
  brandId: string;
  entityName: string; // extracted associated entity/concept (product, location, competitor)
  relationshipType: string; // e.g. "product_of", "industry_category", "compares_with", "mentioned_with"
  occurrenceCount: number;
  firstSeenAt: Date | string;
  lastSeenAt: Date | string;
  supportingContext: string;
  confidence: number; // (0.0 to 1.0)
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface RecommendationObservation {
  id: string;
  organizationId: string;
  brandId: string;
  executionId?: string; // links to prompt_executions (nullable)
  promptId?: string; // links to prompts (nullable)
  observationId: string; // links to raw AI observation response
  recommendationStatus: RecommendationStatusType;
  position?: number; // list ranking position if present
  evidenceExcerpt: string; // verbatim phrased endorsement
  createdAt: Date | string;
}

/**
 * Entity: Website
 * Represents the analyzed/canonical website within a tenant/organization.
 */
export interface Website {
  id: string;
  organizationId: string; // strict multi-tenant partition key
  domain: string; // canonical domain/origin
  normalizedUrl: string; // standardized URL
  status: "active" | "archived" | string;
  lastCrawledAt?: Date | string;
  lastAnalyzedAt?: Date | string;
  audit: AuditMetadata;
}

/**
 * Entity: Page
 * Represents a crawlable/indexable website resource.
 */
export interface Page {
  id: string;
  organizationId: string; // strict multi-tenant partition key
  websiteId: string; // website container ownership
  url: string; // original canonical URL
  normalizedUrl: string; // standardized unique URL
  path: string; // relative path
  statusCode?: number;
  indexability: "indexable" | "noindex" | "blocked_by_robots" | "non_200_status" | "canonical_mismatch" | "undetermined" | string;
  title?: string;
  description?: string;
  audit: AuditMetadata;
}

/**
 * Entity: Keyword
 * Represents a normalized search/query term.
 */
export interface Keyword {
  id: string;
  organizationId: string; // strict multi-tenant partition key
  name: string; // normalized lowercased name (uniqueness index key)
  displayName: string; // original search/query term
  language: "en" | "fa" | string;
  intent?: string;
  audit: AuditMetadata;
}

/**
 * Entity: Topic
 * Represents a semantic/content topic.
 */
export interface Topic {
  id: string;
  organizationId: string; // strict multi-tenant partition key
  name: string; // canonical name (uniqueness index key)
  description?: string;
  language: "en" | "fa" | string;
  parentTopicId?: string; // parent relationship
  audit: AuditMetadata;
}

export type CompetitorStatusType = "candidate" | "active" | "inactive" | "rejected";

export type CompetitorClassificationType = "direct" | "indirect" | "marketplace_aggregator" | "content_authority" | "unknown";

/**
 * Entity: Competitor
 * Represents a monitored competitive brand/entity.
 */
export interface Competitor {
  id: string;
  organizationId: string; // strict multi-tenant partition key
  name: string; // Display Name
  domain: string; // Canonical Domain
  status: CompetitorStatusType;
  brandName?: string;
  classification: CompetitorClassificationType;
  discoverySource?: string;
  discoveryEvidence?: Record<string, unknown>;
  confidence?: number;
  firstDiscoveredAt?: Date | string;
  lastObservedAt?: Date | string;
  lastMonitoredAt?: Date | string;
  monitoringStatus: "idle" | "enabled" | "disabled" | "failed" | string;
  notesMetadata?: Record<string, unknown>;
  audit: AuditMetadata;
}

/**
 * Entity: CompetitorChange
 * Tracks historical competitor monitoring state transitions and changes.
 */
export interface CompetitorChange {
  id: string;
  organizationId: string;
  competitorId: string;
  changedField: string;
  previousValue: string | null;
  newValue: string | null;
  changeType: string; // status, classification, name, domain
  observedAt: Date | string;
  createdAt: Date | string;
}

/**
 * Entity: HistoricalMetric
 * General-purpose time-series log for trend-lines, visibility, and tracking indices.
 */
export interface HistoricalMetric {
  id: string;
  organizationId: string; // strict multi-tenant partition key
  targetType: "website" | "page" | "brand" | "competitor" | string;
  targetId: string;
  metricName: string; // e.g. "visibility_score", "word_count"
  metricValue: number;
  dimensions: Record<string, unknown>;
  timestamp: Date | string;
  audit: AuditMetadata;
}

export type DiagnosticCategory = "technical" | "content" | "seo" | "aeo" | "entity" | "citation" | "competitive";

export type FindingSeverity = "low" | "medium" | "high" | "critical";

export type FindingConfidence = "low" | "medium" | "high";

export type FindingStatus = "active" | "resolved" | "ignored";

export type FindingRelationshipType = "caused_by" | "contributes_to" | "depends_on" | "duplicate_of" | "related_to" | "affects" | "supported_by";

/**
 * Entity: DiagnosticFinding
 * Represents one evidence-backed diagnostic result.
 */
export interface DiagnosticFinding {
  id: string;
  organizationId: string; // strict multi-tenant partition key
  websiteId: string; // website context
  category: DiagnosticCategory;
  code: string; // machine-readable diagnostic code, e.g. "ERR_DUPLICATE_TITLE", "ERR_AEO_BRAND_ABSENT"
  title: string;
  explanation: string;
  severity: FindingSeverity;
  confidence: FindingConfidence;
  status: FindingStatus;
  affectedResource: string; // affected page URL, sitemap URL, or entity name
  evidence: Record<string, unknown>; // structured evidence bag
  audit: AuditMetadata;
}

/**
 * Entity: DiagnosticFindingRelationship
 * Defines directional semantic dependencies between findings (e.g. root cause -> symptom).
 */
export interface DiagnosticFindingRelationship {
  organizationId: string; // strict multi-tenant partition key
  sourceFindingId: string;
  targetFindingId: string;
  relationshipType: FindingRelationshipType;
  audit: AuditMetadata;
}

/**
 * Entity: KgRelationship
 * Represents a directed typed semantic relation link mapping between two KG nodes.
 */
export interface KgRelationship {
  id: string;
  tenantId: string; // strict multi-tenant partition key
  sourceEntityId: string;
  targetEntityId: string;
  relationshipType: string;
  properties: Record<string, unknown>;
  createdAt: Date | string;
  updatedAt: Date | string;
}
export interface CompetitorMention {
  id: string;
  organizationId: string;
  observationId: string;
  competitorId: string;
  context: TextContextVO;
  sentiment: SentimentVO;
  confidence: ConfidenceVO;
  audit: AuditMetadata;
}
