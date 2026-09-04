/**
 * Phase 7C.1 — AI Visibility Intelligence Engine
 * Enterprise Decoupled Repository Interfaces
 * Follows the Interface Segregation & Dependency Inversion Principles.
 */

import {
  Organization,
  Brand,
  Entity,
  EntityRelationship,
  AIEngine,
  Prompt,
  AIObservation,
  BrandMention,
  CompetitorMention,
  Citation,
  VisibilityScore,
  Recommendation,
  RelationshipType,
  Website,
  Page,
  Keyword,
  Topic,
  Competitor,
  CompetitorChange,
  CompetitiveSeoFinding,
  HistoricalMetric,
  DiagnosticFinding,
  DiagnosticFindingRelationship,
  FindingRelationshipType,
  AIVisibilityAudit,
  AuditPrompt,
  PromptDefinition,
  PromptSchedule,
  PromptExecution,
  PositionObservation,
  CitationSource,
  CitationOccurrence,
  BrandAssociation,
  RecommendationObservation,
  AeoAnalysis,
  FaqOpportunity,
  KgAlignment
} from "../domain/types";

export interface QueryParams {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  includeDeleted?: boolean; // Soft deletion support
}

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  limit: number;
  offset: number;
}

export interface IOrganizationRepository {
  findById(id: string): Promise<Organization | null>;
  save(org: Organization): Promise<Organization>;
  deleteSoft(id: string, deletedBy: string): Promise<boolean>;
}

export interface IBrandRepository {
  findById(organizationId: string, id: string): Promise<Brand | null>;
  findByOrganizationId(organizationId: string, params?: QueryParams): Promise<PaginatedResult<Brand>>;
  save(brand: Brand): Promise<Brand>;
  deleteSoft(organizationId: string, id: string, deletedBy: string): Promise<boolean>;
}

export interface IEntityRepository {
  findById(organizationId: string, id: string): Promise<Entity | null>;
  findByName(organizationId: string, name: string): Promise<Entity | null>;
  findByBrandId(organizationId: string, brandId: string, params?: QueryParams): Promise<PaginatedResult<Entity>>;
  save(entity: Entity): Promise<Entity>;
  deleteSoft(organizationId: string, id: string, deletedBy: string): Promise<boolean>;

  // Semantic Relationships (Tenant-scoped)
  getRelationships(organizationId: string): Promise<EntityRelationship[]>;
  saveRelationship(relationship: EntityRelationship): Promise<EntityRelationship>;
  deleteRelationship(organizationId: string, sourceId: string, targetId: string, type: RelationshipType): Promise<boolean>;
}

export interface IAIEngineRepository {
  findById(id: string): Promise<AIEngine | null>;
  findAll(params?: QueryParams): Promise<PaginatedResult<AIEngine>>;
  save(engine: AIEngine): Promise<AIEngine>;
  deleteSoft(id: string, deletedBy: string): Promise<boolean>;
}

export interface IPromptRepository {
  findById(organizationId: string, id: string): Promise<Prompt | null>;
  findByBrandId(organizationId: string, brandId: string, params?: QueryParams): Promise<PaginatedResult<Prompt>>;
  save(prompt: Prompt): Promise<Prompt>;
  deleteSoft(organizationId: string, id: string, deletedBy: string): Promise<boolean>;
}

export interface IObservationRepository {
  findById(organizationId: string, id: string): Promise<AIObservation | null>;
  findByPromptId(organizationId: string, promptId: string, params?: QueryParams): Promise<PaginatedResult<AIObservation>>;
  findByEngineId(organizationId: string, engineId: string, params?: QueryParams): Promise<PaginatedResult<AIObservation>>;
  save(observation: AIObservation): Promise<AIObservation>;
  deleteSoft(organizationId: string, id: string, deletedBy: string): Promise<boolean>;

  // Extracted Mentions (Tenant-scoped)
  findMentionsByObservationId(organizationId: string, observationId: string): Promise<BrandMention[]>;
  saveMention(mention: BrandMention): Promise<BrandMention>;
  findCompetitorMentionsByObservationId(organizationId: string, observationId: string): Promise<CompetitorMention[]>;
  saveCompetitorMention(mention: CompetitorMention): Promise<CompetitorMention>;

  // Extracted Citations (Tenant-scoped)
  findCitationsByObservationId(organizationId: string, observationId: string): Promise<Citation[]>;
  saveCitation(citation: Citation): Promise<Citation>;
}

export interface IVisibilityScoreRepository {
  findByBrandId(organizationId: string, brandId: string, params?: QueryParams): Promise<PaginatedResult<VisibilityScore>>;
  save(score: VisibilityScore): Promise<VisibilityScore>;
  deleteSoft(organizationId: string, id: string, deletedBy: string): Promise<boolean>;
}

export interface IRecommendationRepository {
  findByBrandId(organizationId: string, brandId: string, params?: QueryParams): Promise<PaginatedResult<Recommendation>>;
  save(rec: Recommendation): Promise<Recommendation>;
  deleteSoft(organizationId: string, id: string, deletedBy: string): Promise<boolean>;
}

export interface IWebsiteRepository {
  findById(organizationId: string, id: string): Promise<Website | null>;
  findByDomain(organizationId: string, domain: string): Promise<Website | null>;
  save(website: Website): Promise<Website>;
  deleteSoft(organizationId: string, id: string, deletedBy: string): Promise<boolean>;
}

export interface IPageRepository {
  findById(organizationId: string, id: string): Promise<Page | null>;
  findByWebsiteId(organizationId: string, websiteId: string, params?: QueryParams): Promise<PaginatedResult<Page>>;
  findByNormalizedUrl(organizationId: string, websiteId: string, normalizedUrl: string): Promise<Page | null>;
  save(page: Page): Promise<Page>;
  deleteSoft(organizationId: string, id: string, deletedBy: string): Promise<boolean>;

  // Many-to-many associations
  linkKeyword(organizationId: string, pageId: string, keywordId: string): Promise<void>;
  linkTopic(organizationId: string, pageId: string, topicId: string): Promise<void>;
  linkEntity(organizationId: string, pageId: string, entityId: string): Promise<void>;
  getLinkedKeywords(organizationId: string, pageId: string): Promise<Keyword[]>;
  getLinkedTopics(organizationId: string, pageId: string): Promise<Topic[]>;
  getLinkedEntities(organizationId: string, pageId: string): Promise<Entity[]>;
}

export interface IKeywordRepository {
  findById(organizationId: string, id: string): Promise<Keyword | null>;
  findByName(organizationId: string, name: string): Promise<Keyword | null>;
  save(keyword: Keyword): Promise<Keyword>;
  deleteSoft(organizationId: string, id: string, deletedBy: string): Promise<boolean>;
  linkTopic(organizationId: string, keywordId: string, topicId: string): Promise<void>;
  getLinkedTopics(organizationId: string, keywordId: string): Promise<Topic[]>;
}

export interface ITopicRepository {
  findById(organizationId: string, id: string): Promise<Topic | null>;
  findByName(organizationId: string, name: string): Promise<Topic | null>;
  save(topic: Topic): Promise<Topic>;
  deleteSoft(organizationId: string, id: string, deletedBy: string): Promise<boolean>;
  linkEntity(organizationId: string, topicId: string, entityId: string): Promise<void>;
  getLinkedEntities(organizationId: string, topicId: string): Promise<Entity[]>;
}

export interface ICompetitorRepository {
  findById(organizationId: string, id: string): Promise<Competitor | null>;
  findByOrganizationId(organizationId: string, params?: QueryParams): Promise<PaginatedResult<Competitor>>;
  findByDomain(organizationId: string, domain: string): Promise<Competitor | null>;
  save(competitor: Competitor): Promise<Competitor>;
  deleteSoft(organizationId: string, id: string, deletedBy: string): Promise<boolean>;

  // Competitor Changes
  saveChange(change: CompetitorChange): Promise<CompetitorChange>;
  findChangesByCompetitorId(organizationId: string, competitorId: string): Promise<CompetitorChange[]>;
}

export interface ICompetitiveSeoFindingRepository {
  findById(organizationId: string, id: string): Promise<CompetitiveSeoFinding | null>;
  findByCompetitorId(organizationId: string, competitorId: string): Promise<CompetitiveSeoFinding[]>;
  findByOrganizationId(organizationId: string, params?: QueryParams): Promise<PaginatedResult<CompetitiveSeoFinding>>;
  save(finding: CompetitiveSeoFinding): Promise<CompetitiveSeoFinding>;
  deleteSoft(organizationId: string, id: string): Promise<boolean>;
}

export interface IHistoricalMetricRepository {
  save(metric: HistoricalMetric): Promise<HistoricalMetric>;
  findMetrics(
    organizationId: string,
    targetType: string,
    targetId: string,
    metricName?: string,
    startTime?: Date | string,
    endTime?: Date | string
  ): Promise<HistoricalMetric[]>;
}

export interface IDiagnosticFindingRepository {
  findById(organizationId: string, id: string): Promise<DiagnosticFinding | null>;
  findByWebsiteId(organizationId: string, websiteId: string, params?: QueryParams): Promise<PaginatedResult<DiagnosticFinding>>;
  findByCodeAndResource(organizationId: string, websiteId: string, code: string, affectedResource: string): Promise<DiagnosticFinding | null>;
  save(finding: DiagnosticFinding): Promise<DiagnosticFinding>;
  deleteSoft(organizationId: string, id: string, deletedBy: string): Promise<boolean>;

  // Relationships mapping
  linkFindings(organizationId: string, sourceId: string, targetId: string, type: FindingRelationshipType): Promise<void>;
  getLinkedFindings(organizationId: string, findingId: string): Promise<DiagnosticFindingRelationship[]>;
}

export interface IAIVisibilityAuditRepository {
  findById(organizationId: string, id: string): Promise<AIVisibilityAudit | null>;
  findByBrandId(organizationId: string, brandId: string, params?: QueryParams): Promise<PaginatedResult<AIVisibilityAudit>>;
  save(audit: AIVisibilityAudit): Promise<AIVisibilityAudit>;
  deleteSoft(organizationId: string, id: string, deletedBy: string): Promise<boolean>;

  // Audit Prompts (Tenant-scoped)
  findPromptsByAuditId(organizationId: string, auditId: string): Promise<AuditPrompt[]>;
  findPromptById(organizationId: string, id: string): Promise<AuditPrompt | null>;
  savePrompt(prompt: AuditPrompt): Promise<AuditPrompt>;
}

export interface IPromptIntelligenceRepository {
  // Definitions (Tenant-scoped)
  findDefinitionById(organizationId: string, id: string): Promise<PromptDefinition | null>;
  findDefinitionsByBrandId(organizationId: string, brandId: string, params?: QueryParams): Promise<PaginatedResult<PromptDefinition>>;
  saveDefinition(definition: PromptDefinition): Promise<PromptDefinition>;
  deleteDefinitionSoft(organizationId: string, id: string, deletedBy: string): Promise<boolean>;

  // Schedules (Tenant-scoped)
  findScheduleByPromptId(organizationId: string, promptId: string): Promise<PromptSchedule | null>;
  findScheduleById(organizationId: string, id: string): Promise<PromptSchedule | null>;
  findAllSchedules(organizationId: string): Promise<PromptSchedule[]>;
  findActiveSchedules(): Promise<PromptSchedule[]>;
  saveSchedule(schedule: PromptSchedule): Promise<PromptSchedule>;

  // Executions (Tenant-scoped)
  findExecutionById(organizationId: string, id: string): Promise<PromptExecution | null>;
  findExecutionsByPromptId(organizationId: string, promptId: string, params?: QueryParams): Promise<PaginatedResult<PromptExecution>>;
  saveExecution(execution: PromptExecution): Promise<PromptExecution>;

  // Position Observations (Tenant-scoped)
  findPositionsByExecutionId(organizationId: string, executionId: string): Promise<PositionObservation[]>;
  savePosition(position: PositionObservation): Promise<PositionObservation>;
}

export interface ICitationIntelligenceRepository {
  // Sources (Tenant-scoped)
  findSourceById(organizationId: string, id: string): Promise<CitationSource | null>;
  findSourceByDomain(organizationId: string, domain: string): Promise<CitationSource | null>;
  findSources(organizationId: string, params?: QueryParams): Promise<PaginatedResult<CitationSource>>;
  saveSource(source: CitationSource): Promise<CitationSource>;

  // Occurrences (Tenant-scoped)
  findOccurrencesBySourceId(organizationId: string, sourceId: string): Promise<CitationOccurrence[]>;
  findOccurrencesByAuditId(organizationId: string, auditId: string): Promise<CitationOccurrence[]>;
  findOccurrencesByExecutionId(organizationId: string, executionId: string): Promise<CitationOccurrence[]>;
  findAllOccurrences(organizationId: string): Promise<CitationOccurrence[]>;
  saveOccurrence(occurrence: CitationOccurrence): Promise<CitationOccurrence>;
}

export interface IBrandIntelligenceRepository {
  // Associations (Tenant-scoped)
  findAssociationById(organizationId: string, id: string): Promise<BrandAssociation | null>;
  findAssociationByEntity(organizationId: string, brandId: string, entityName: string, relType: string): Promise<BrandAssociation | null>;
  findAssociationsByBrandId(organizationId: string, brandId: string): Promise<BrandAssociation[]>;
  saveAssociation(association: BrandAssociation): Promise<BrandAssociation>;

  // Recommendations (Tenant-scoped)
  findRecommendationByObservationId(organizationId: string, brandId: string, observationId: string): Promise<RecommendationObservation | null>;
  findRecommendationsByBrandId(organizationId: string, brandId: string): Promise<RecommendationObservation[]>;
  saveRecommendationObservation(rec: RecommendationObservation): Promise<RecommendationObservation>;
}

export interface IAeoContentIntelligenceRepository {
  // AEO Analyses (Tenant-scoped)
  findAnalysisById(organizationId: string, id: string): Promise<AeoAnalysis | null>;
  findAnalysisByPageId(organizationId: string, pageId: string): Promise<AeoAnalysis | null>;
  findAnalysesByPageId(organizationId: string, pageId: string, params?: QueryParams): Promise<PaginatedResult<AeoAnalysis>>;
  saveAnalysis(analysis: AeoAnalysis): Promise<AeoAnalysis>;
  deleteAnalysisSoft(organizationId: string, id: string, deletedBy: string): Promise<boolean>;

  // FAQ Opportunities (Tenant-scoped)
  findFaqOpportunityById(organizationId: string, id: string): Promise<FaqOpportunity | null>;
  findFaqOpportunitiesByPageId(organizationId: string, pageId: string): Promise<FaqOpportunity[]>;
  findAllFaqOpportunities(organizationId: string): Promise<FaqOpportunity[]>;
  saveFaqOpportunity(opportunity: FaqOpportunity): Promise<FaqOpportunity>;

  // KG Alignments (Tenant-scoped)
  findKgAlignmentById(organizationId: string, id: string): Promise<KgAlignment | null>;
  findKgAlignmentsByPageId(organizationId: string, pageId: string): Promise<KgAlignment[]>;
  findAllKgAlignments(organizationId: string): Promise<KgAlignment[]>;
  saveKgAlignment(alignment: KgAlignment): Promise<KgAlignment>;
}
