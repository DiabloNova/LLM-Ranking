/**
 * Phase 7C.1 — AI Visibility Intelligence Engine
 * Enterprise InMemory Database and Repository Adapters
 */

import { TenantContextManager, TenantContextViolationException } from "../../../core/database/tenant-context";
import { PostgresClient } from "../../admin/infrastructure/persistence/postgres";
import {
  Organization,
  SubscriptionPlan,
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
  AuditMetadata,
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
  AIVisibilityAuditStatus,
  AuditPromptStatus,
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
import {
  IOrganizationRepository,
  IBrandRepository,
  IEntityRepository,
  IAIEngineRepository,
  IPromptRepository,
  IObservationRepository,
  IVisibilityScoreRepository,
  IRecommendationRepository,
  QueryParams,
  PaginatedResult,
  IWebsiteRepository,
  IPageRepository,
  IKeywordRepository,
  ITopicRepository,
  ICompetitorRepository,
  ICompetitiveSeoFindingRepository,
  IHistoricalMetricRepository,
  IDiagnosticFindingRepository,
  IAIVisibilityAuditRepository,
  IPromptIntelligenceRepository,
  ICitationIntelligenceRepository,
  IBrandIntelligenceRepository,
  IAeoContentIntelligenceRepository
} from "./interfaces";

function createMockAudit(createdBy = "system"): AuditMetadata {
  return {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy,
    updatedBy: createdBy,
    version: 1
  };
}

function createPersistenceArray<T>(): T[] {
  const array: T[] = [];
  if (process.env.NODE_ENV === "test") return array;
  return new Proxy(array, {
    get() { throw new Error("In-memory persistence is disabled outside tests."); },
    set() { throw new Error("In-memory persistence is disabled outside tests."); }
  });
}

function createPersistenceMap<K, V>(): Map<K, V> {
  const map = new Map<K, V>();
  if (process.env.NODE_ENV === "test") return map;
  return new Proxy(map, {
    get(target, property, receiver) {
      if (property === "size") throw new Error("In-memory persistence is disabled outside tests.");
      const value = Reflect.get(target, property, receiver);
      if (typeof value === "function") {
        return () => { throw new Error("In-memory persistence is disabled outside tests."); };
      }
      return value;
    }
  });
}

function enforceTenantContext(organizationId: string): void {
  if (TenantContextManager.isSystemMode()) {
    return;
  }
  const activeTenantId = TenantContextManager.getRequiredTenantId();
  if (activeTenantId !== organizationId) {
    throw new TenantContextViolationException(
      `Tenant Context Violation: Access Denied. Cross-tenant operation blocked. Target organization ${organizationId} does not match active tenant ${activeTenantId}.`
    );
  }
}

class InMemoryDatabase {
  public organizations: Map<string, Organization> = createPersistenceMap();
  public brands: Map<string, Brand> = createPersistenceMap();
  public entities: Map<string, Entity> = createPersistenceMap();
  public relationships: EntityRelationship[] = createPersistenceArray();
  public engines: Map<string, AIEngine> = createPersistenceMap();
  public prompts: Map<string, Prompt> = createPersistenceMap();
  public observations: Map<string, AIObservation> = createPersistenceMap();
  public mentions: Map<string, BrandMention> = createPersistenceMap();
  public competitorMentions: Map<string, CompetitorMention> = createPersistenceMap();
  public citations: Map<string, Citation> = createPersistenceMap();
  public visibilityScores: Map<string, VisibilityScore> = createPersistenceMap();
  public recommendations: Map<string, Recommendation> = createPersistenceMap();
  public aiVisibilityAudits: Map<string, AIVisibilityAudit> = createPersistenceMap();
  public auditPrompts: Map<string, AuditPrompt> = createPersistenceMap();
  public promptDefinitions: Map<string, PromptDefinition> = createPersistenceMap();
  public promptSchedules: Map<string, PromptSchedule> = createPersistenceMap();
  public promptExecutions: Map<string, PromptExecution> = createPersistenceMap();
  public positionObservations: Map<string, PositionObservation> = createPersistenceMap();
  public citationSources: Map<string, CitationSource> = createPersistenceMap();
  public citationOccurrences: Map<string, CitationOccurrence> = createPersistenceMap();
  public brandAssociations: Map<string, BrandAssociation> = createPersistenceMap();
  public recommendationObservations: Map<string, RecommendationObservation> = createPersistenceMap();
  public aeoAnalyses: Map<string, AeoAnalysis> = createPersistenceMap();
  public faqOpportunities: Map<string, FaqOpportunity> = createPersistenceMap();
  public kgAlignments: Map<string, KgAlignment> = createPersistenceMap();

  // Unified Intelligence Data Model stores
  public websites: Map<string, Website> = createPersistenceMap();
  public pages: Map<string, Page> = createPersistenceMap();
  public keywords: Map<string, Keyword> = createPersistenceMap();
  public topics: Map<string, Topic> = createPersistenceMap();
  public competitors: Map<string, Competitor> = createPersistenceMap();
  public competitorChanges: Map<string, CompetitorChange> = createPersistenceMap();
  public competitiveSeoFindings: Map<string, CompetitiveSeoFinding> = createPersistenceMap();
  public historicalMetrics: Map<string, HistoricalMetric> = createPersistenceMap();
  public diagnosticFindings: Map<string, DiagnosticFinding> = createPersistenceMap();
  public diagnosticFindingRelationships: DiagnosticFindingRelationship[] = createPersistenceArray();

  // Join table models (Many-to-Many associations)
  public pagesKeywords: Array<{ organizationId: string, pageId: string, keywordId: string }> = createPersistenceArray();
  public pagesTopics: Array<{ organizationId: string, pageId: string, topicId: string }> = createPersistenceArray();
  public pagesEntities: Array<{ organizationId: string, pageId: string, entityId: string }> = createPersistenceArray();
  public keywordsTopics: Array<{ organizationId: string, keywordId: string, topicId: string }> = createPersistenceArray();
  public topicsEntities: Array<{ organizationId: string, topicId: string, entityId: string }> = createPersistenceArray();

  constructor() {
    if (process.env.NODE_ENV === "test") this.seed();
  }

  private seed() {
    // 1. Seed Organization
    const orgId = "org-enterprise-01";
    this.organizations.set(orgId, {
      id: orgId,
      name: "Acme Enterprise Corp",
      slug: "acme-corp",
      plan: "enterprise",
      audit: createMockAudit()
    });

    // 2. Seed Brand
    const brandId = "brand-acme-01";
    this.brands.set(brandId, {
      id: brandId,
      organizationId: orgId,
      name: "Acme SaaS",
      description: "Leading AI-driven Brand Intelligence & GEO Optimization SaaS",
      website: "https://acme-saas.io",
      industry: "Technology & software",
      country: "Global",
      audit: createMockAudit()
    });

    // 3. Seed AI Engines
    const engineIds = {
      chatgpt: "engine-chatgpt",
      claude: "engine-claude",
      gemini: "engine-gemini",
      perplexity: "engine-perplexity"
    };

    this.engines.set(engineIds.chatgpt, {
      id: engineIds.chatgpt,
      name: "ChatGPT",
      provider: "OpenAI",
      version: "GPT-4o",
      capabilities: ["RAG", "web_search", "code_interpreter"],
      isActive: true,
      audit: createMockAudit()
    });

    this.engines.set(engineIds.claude, {
      id: engineIds.claude,
      name: "Claude",
      provider: "Anthropic",
      version: "Claude 3.5 Sonnet",
      capabilities: ["RAG", "complex_reasoning", "multimodal"],
      isActive: true,
      audit: createMockAudit()
    });

    this.engines.set(engineIds.gemini, {
      id: engineIds.gemini,
      name: "Gemini",
      provider: "Google",
      version: "Gemini 1.5 Pro",
      capabilities: ["RAG", "web_search", "large_context"],
      isActive: true,
      audit: createMockAudit()
    });

    this.engines.set(engineIds.perplexity, {
      id: engineIds.perplexity,
      name: "Perplexity",
      provider: "Perplexity AI",
      version: "Sonar Large",
      capabilities: ["RAG", "live_web_search", "citation_parsing"],
      isActive: true,
      audit: createMockAudit()
    });

    // 4. Seed Prompts
    const prompt1Id = "prompt-discover-01";
    const prompt2Id = "prompt-compare-02";

    this.prompts.set(prompt1Id, {
      id: prompt1Id,
      organizationId: orgId,
      brandId: brandId,
      text: "What are the top enterprise brand intelligence platform recommendations for 2025?",
      category: "Market Discovery",
      intent: "Discovery",
      language: "en",
      priority: "high",
      audit: createMockAudit()
    });

    this.prompts.set(prompt2Id, {
      id: prompt2Id,
      organizationId: orgId,
      brandId: brandId,
      text: "Compare Acme SaaS vs CompetitorX on features, citation authority, and performance.",
      category: "Competitive Comparison",
      intent: "Comparison",
      language: "en",
      priority: "high",
      audit: createMockAudit()
    });

    // 5. Seed Entities
    const entityBrandId = "entity-acme-brand";
    const entityCompId = "entity-competitorx-brand";

    this.entities.set(entityBrandId, {
      id: entityBrandId,
      organizationId: orgId,
      brandId: brandId,
      name: "Acme SaaS",
      type: "Brand",
      wikidataId: "Q111999222",
      wikipediaUrl: "https://en.wikipedia.org/wiki/Acme_SaaS",
      confidence: { score: 0.95, rating: "high" },
      audit: createMockAudit()
    });

    this.entities.set(entityCompId, {
      id: entityCompId,
      organizationId: orgId,
      brandId: brandId,
      name: "CompetitorX",
      type: "Brand",
      wikidataId: "Q222000333",
      wikipediaUrl: "https://en.wikipedia.org/wiki/CompetitorX",
      confidence: { score: 0.88, rating: "high" },
      audit: createMockAudit()
    });

    // Seed relationship
    this.relationships.push({
      organizationId: orgId,
      sourceEntityId: entityBrandId,
      targetEntityId: entityCompId,
      relationshipType: "competes_with",
      confidence: { score: 0.92, rating: "high" },
      audit: createMockAudit()
    });

    // 6. Seed Observations
    const obs1Id = "obs-chatgpt-01";
    const obs2Id = "obs-perplexity-02";

    this.observations.set(obs1Id, {
      id: obs1Id,
      organizationId: orgId,
      promptId: prompt1Id,
      engineId: engineIds.chatgpt,
      responseText: "For enterprise brand intelligence platforms, Acme SaaS stands out as a strong recommendation because of its unique AEO and GEO optimization suite. Other platforms include CompetitorX which focuses on traditional SEO metrics.",
      visibilityScore: 82,
      sentiment: { score: 88, label: "positive", confidence: 0.95 },
      confidence: { score: 0.90, rating: "high" },
      executedAt: new Date("2025-02-20T10:00:00.000Z"),
      audit: createMockAudit()
    });

    this.observations.set(obs2Id, {
      id: obs2Id,
      organizationId: orgId,
      promptId: prompt2Id,
      engineId: engineIds.perplexity,
      responseText: "According to industry analyst documents, Acme SaaS holds higher citation authority compared to CompetitorX. However, CompetitorX possesses a wider market positioning footprint.",
      visibilityScore: 78,
      sentiment: { score: 72, label: "neutral", confidence: 0.85 },
      confidence: { score: 0.95, rating: "high" },
      executedAt: new Date("2025-02-20T11:30:00.000Z"),
      audit: createMockAudit()
    });

    // 7. Seed Brand Mentions
    this.mentions.set("mention-01", {
      id: "mention-01",
      organizationId: orgId,
      observationId: obs1Id,
      entityId: entityBrandId,
      context: {
        textSnippet: "Acme SaaS stands out as a strong recommendation because of its unique AEO and GEO...",
        charStart: 45,
        charEnd: 125
      },
      sentiment: { score: 92, label: "positive", confidence: 0.96 },
      confidence: { score: 0.94, rating: "high" },
      audit: createMockAudit()
    });

    this.mentions.set("mention-02", {
      id: "mention-02",
      organizationId: orgId,
      observationId: obs1Id,
      entityId: entityCompId,
      context: {
        textSnippet: "Other platforms include CompetitorX which focuses on traditional SEO metrics.",
        charStart: 135,
        charEnd: 211
      },
      sentiment: { score: 0, label: "neutral", confidence: 0.90 },
      confidence: { score: 0.89, rating: "high" },
      audit: createMockAudit()
    });

    // 8. Seed Citations
    this.citations.set("cit-01", {
      id: "cit-01",
      organizationId: orgId,
      observationId: obs2Id,
      url: "https://acme-saas.io/case-studies/enterprise-growth",
      domain: "acme-saas.io",
      title: "Enterprise Brand Growth with Acme SaaS Case Study",
      authorityScore: 85,
      relevanceScore: 92,
      audit: createMockAudit()
    });

    // 9. Seed Visibility Scores
    const engines = [engineIds.chatgpt, engineIds.claude, engineIds.gemini, engineIds.perplexity];
    engines.forEach((engId, index) => {
      this.visibilityScores.set(`vis-score-${engId}`, {
        id: `vis-score-${engId}`,
        organizationId: orgId,
        brandId: brandId,
        engineId: engId,
        overallScore: 75 + index * 3,
        mentionScore: 80 + index * 2,
        citationScore: 70 + index * 4,
        authorityScore: 82 + index,
        sentimentScore: 78 + index * 3,
        positionScore: 85 - index * 2,
        date: new Date("2025-02-20T00:00:00.000Z"),
        audit: createMockAudit()
      });
    });

    // 10. Seed Recommendations
    this.recommendations.set("rec-01", {
      id: "rec-01",
      organizationId: orgId,
      brandId: brandId,
      category: "Citation Authority",
      priority: "high",
      impactScore: 15,
      description: "Associate your brand website with key high-intent discovery prompt citations back to the root website for ecommerce queries.",
      status: "pending",
      audit: createMockAudit()
    });

    this.recommendations.set("rec-02", {
      id: "rec-02",
      organizationId: orgId,
      brandId: brandId,
      category: "Entity Linking",
      priority: "medium",
      impactScore: 8,
      description: "Map and claim missing entity properties on Wikidata to anchor entity recognition models.",
      status: "pending",
      audit: createMockAudit()
    });
  }
}

// Test fixture only. Production data must come from PostgreSQL.
export const db = new InMemoryDatabase();

/**
 * Helper to paginate array results
 */
function paginateArray<T>(items: T[], params?: QueryParams): PaginatedResult<T> {
  const limit = params?.limit || 50;
  const offset = params?.offset || 0;
  const paginated = items.slice(offset, offset + limit);
  return {
    data: paginated,
    totalCount: items.length,
    limit,
    offset
  };
}

/**
 * ----------------------------------------------------
 * Repositories Implementation implementing contracts
 * ----------------------------------------------------
 */

export class OrganizationRepository implements IOrganizationRepository {
  private pg: PostgresClient;

  constructor(pg?: PostgresClient) {
    this.pg = pg || PostgresClient.getInstance();
  }

  public async findById(id: string): Promise<Organization | null> {
    enforceTenantContext(id);
    const sql = `
      SELECT id, name, slug, plan, created_at, updated_at, created_by, updated_by, deleted_at, version
      FROM organizations
      WHERE id = $1 AND deleted_at IS NULL
      LIMIT 1;
    `;
    console.debug(`[Postgres SQL] Executing Parameterised Query: "${sql}" with values: [${id}]`);

    const res = await this.pg.query(sql, [id]);
    if (!res.rowCount || res.rowCount === 0) return null;

    const row = res.rows[0];
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      plan: row.plan as SubscriptionPlan,
      audit: {
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by,
        updatedBy: row.updated_by,
        deletedAt: row.deleted_at || undefined,
        version: row.version
      }
    };
  }

  public async save(org: Organization): Promise<Organization> {
    enforceTenantContext(org.id);
    const checkSql = `SELECT version FROM organizations WHERE id = $1 LIMIT 1;`;
    console.debug(`[Postgres SQL] Executing Parameterised Query: "${checkSql}" with values: [${org.id}]`);

    const checkRes = await this.pg.query(checkSql, [org.id]);
    if (checkRes.rowCount && checkRes.rowCount > 0) {
      const existingVersion = checkRes.rows[0].version;
      const versionDiff = org.audit.version - existingVersion;
      if (versionDiff !== 0 && versionDiff !== 1) {
        throw new Error(`Optimistic Concurrency Lock Exception: version mismatch on Organization. Expected ${existingVersion}, got ${org.audit.version}`);
      }

      const nextVersion = versionDiff === 0 ? org.audit.version + 1 : org.audit.version;
      const updateSql = `
        UPDATE organizations
        SET name = $1, slug = $2, plan = $3, updated_at = $4, updated_by = $5, version = $6
        WHERE id = $7;
      `;
      console.debug(`[Postgres SQL] Executing Parameterised Query: "${updateSql}" with values: [${org.name}, ${org.slug}, ${org.plan}, ...]`);
      await this.pg.query(updateSql, [
        org.name,
        org.slug,
        org.plan,
        new Date().toISOString(),
        org.audit.updatedBy,
        nextVersion,
        org.id
      ]);
      org.audit.version = nextVersion;
      org.audit.updatedAt = new Date().toISOString();
    } else {
      const insertSql = `
        INSERT INTO organizations (id, name, slug, plan, created_at, updated_at, created_by, updated_by, version)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
      `;
      console.debug(`[Postgres SQL] Executing Parameterised Query: "${insertSql}" with values: [${org.id}, ${org.name}, ${org.slug}, ...]`);
      org.audit.version = 1;
      org.audit.createdAt = new Date().toISOString();
      org.audit.updatedAt = new Date().toISOString();

      await this.pg.query(insertSql, [
        org.id,
        org.name,
        org.slug,
        org.plan,
        org.audit.createdAt,
        org.audit.updatedAt,
        org.audit.createdBy,
        org.audit.updatedBy,
        org.audit.version
      ]);
    }

    return org;
  }

  public async deleteSoft(id: string, deletedBy: string): Promise<boolean> {
    enforceTenantContext(id);
    const sql = `
      UPDATE organizations
      SET deleted_at = $1, updated_by = $2, updated_at = $3
      WHERE id = $4 AND deleted_at IS NULL;
    `;
    console.debug(`[Postgres SQL] Executing Parameterised Query: "${sql}" with values: [${deletedBy}, ${id}]`);

    const res = await this.pg.query(sql, [new Date().toISOString(), deletedBy, new Date().toISOString(), id]);
    return (res.rowCount !== null && res.rowCount > 0);
  }
}

export class BrandRepository implements IBrandRepository {
  public async findById(organizationId: string, id: string): Promise<Brand | null> {
    enforceTenantContext(organizationId);
    const brand = db.brands.get(id);
    if (!brand || brand.organizationId !== organizationId || brand.audit.deletedAt) {
      return null;
    }
    return brand;
  }

  public async findByOrganizationId(organizationId: string, params?: QueryParams): Promise<PaginatedResult<Brand>> {
    enforceTenantContext(organizationId);
    const list = Array.from(db.brands.values()).filter(
      b => b.organizationId === organizationId && (params?.includeDeleted || !b.audit.deletedAt)
    );
    return paginateArray(list, params);
  }

  public async save(brand: Brand): Promise<Brand> {
    enforceTenantContext(brand.organizationId);
    const existing = db.brands.get(brand.id);
    if (existing && existing.organizationId !== brand.organizationId) {
      throw new Error("Tenant Isolation Exception: Cannot modify or change tenant ownership for existing Brand.");
    }
    db.brands.set(brand.id, brand);
    return brand;
  }

  public async deleteSoft(organizationId: string, id: string, deletedBy: string): Promise<boolean> {
    enforceTenantContext(organizationId);
    const brand = db.brands.get(id);
    if (!brand || brand.organizationId !== organizationId) return false;
    brand.audit.deletedAt = new Date().toISOString();
    brand.audit.updatedBy = deletedBy;
    brand.audit.updatedAt = new Date().toISOString();
    return true;
  }
}

export class AeoContentIntelligenceRepository implements IAeoContentIntelligenceRepository {
  private pg: PostgresClient;
  constructor(pg?: PostgresClient) {
    this.pg = pg || PostgresClient.getInstance();
  }

  private mapRowToAnalysis(row: any): AeoAnalysis {
    return {
      id: row.id,
      organizationId: row.organization_id,
      pageId: row.page_id,
      overallScore: row.overall_score,
      answerability: typeof row.answerability === "string" ? JSON.parse(row.answerability) : (row.answerability || {}),
      entityCoverage: typeof row.entity_coverage === "string" ? JSON.parse(row.entity_coverage) : (row.entity_coverage || []),
      semanticCoverage: typeof row.semantic_coverage === "string" ? JSON.parse(row.semantic_coverage) : (row.semantic_coverage || {}),
      questionCoverage: typeof row.question_coverage === "string" ? JSON.parse(row.question_coverage) : (row.question_coverage || {}),
      citationReadiness: typeof row.citation_readiness === "string" ? JSON.parse(row.citation_readiness) : (row.citation_readiness || {}),
      structuredAnswerQuality: typeof row.structured_answer_quality === "string" ? JSON.parse(row.structured_answer_quality) : (row.structured_answer_quality || {}),
      kgAlignment: typeof row.kg_alignment === "string" ? JSON.parse(row.kg_alignment) : (row.kg_alignment || {}),
      scoringVersion: row.scoring_version,
      analyzerVersion: row.analyzer_version,
      provenance: typeof row.provenance === "string" ? JSON.parse(row.provenance) : (row.provenance || {}),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapRowToFaqOpportunity(row: any): FaqOpportunity {
    return {
      id: row.id,
      organizationId: row.organization_id,
      pageId: row.page_id,
      question: row.question,
      sourceType: row.source_type,
      evidenceSourceId: row.evidence_source_id || undefined,
      priority: row.priority as any,
      impactScore: row.impact_score,
      status: row.status as any,
      createdAt: row.created_at
    };
  }

  private mapRowToKgAlignment(row: any): KgAlignment {
    return {
      id: row.id,
      organizationId: row.organization_id,
      pageId: row.page_id,
      alignmentType: row.alignment_type as any,
      entityName: row.entity_name,
      propertyName: row.property_name || undefined,
      expectedValue: row.expected_value || undefined,
      actualValue: row.actual_value || undefined,
      status: row.status as any,
      createdAt: row.created_at
    };
  }

  // AEO Analyses
  public async findAnalysisById(organizationId: string, id: string): Promise<AeoAnalysis | null> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM aeo_analyses WHERE id = $1 AND organization_id = $2 LIMIT 1;`;
      const res = await this.pg.query(sql, [id, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        return this.mapRowToAnalysis(res.rows[0]);
      }
    } catch (err) {
      console.warn("[AeoContentIntelligenceRepository.findAnalysisById Error]: skipping DB.", err);
    }
    const item = db.aeoAnalyses.get(id);
    if (!item || item.organizationId !== organizationId) return null;
    return item;
  }

  public async findAnalysisByPageId(organizationId: string, pageId: string): Promise<AeoAnalysis | null> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM aeo_analyses WHERE page_id = $1 AND organization_id = $2 ORDER BY created_at DESC LIMIT 1;`;
      const res = await this.pg.query(sql, [pageId, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        return this.mapRowToAnalysis(res.rows[0]);
      }
    } catch (err) {
      console.warn("[AeoContentIntelligenceRepository.findAnalysisByPageId Error]: skipping DB.", err);
    }
    for (const item of db.aeoAnalyses.values()) {
      if (item.pageId === pageId && item.organizationId === organizationId) {
        return item;
      }
    }
    return null;
  }

  public async findAnalysesByPageId(organizationId: string, pageId: string, params?: QueryParams): Promise<PaginatedResult<AeoAnalysis>> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM aeo_analyses WHERE page_id = $1 AND organization_id = $2 ORDER BY created_at DESC;`;
      const res = await this.pg.query(sql, [pageId, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        const mapped = res.rows.map(row => this.mapRowToAnalysis(row));
        return paginateArray(mapped, params);
      }
    } catch (err) {
      console.warn("[AeoContentIntelligenceRepository.findAnalysesByPageId Error]: skipping DB.", err);
    }
    const list = Array.from(db.aeoAnalyses.values()).filter(
      v => v.pageId === pageId && v.organizationId === organizationId
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return paginateArray(list, params);
  }

  public async saveAnalysis(analysis: AeoAnalysis): Promise<AeoAnalysis> {
    enforceTenantContext(analysis.organizationId);
    try {
      const sql = `
        INSERT INTO aeo_analyses (id, organization_id, page_id, overall_score, answerability, entity_coverage, semantic_coverage, question_coverage, citation_readiness, structured_answer_quality, kg_alignment, scoring_version, analyzer_version, provenance, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (page_id, analyzer_version, scoring_version) DO UPDATE SET
          overall_score = EXCLUDED.overall_score,
          answerability = EXCLUDED.answerability,
          entity_coverage = EXCLUDED.entity_coverage,
          semantic_coverage = EXCLUDED.semantic_coverage,
          question_coverage = EXCLUDED.question_coverage,
          citation_readiness = EXCLUDED.citation_readiness,
          structured_answer_quality = EXCLUDED.structured_answer_quality,
          kg_alignment = EXCLUDED.kg_alignment,
          provenance = EXCLUDED.provenance,
          updated_at = EXCLUDED.updated_at;
      `;
      await this.pg.query(sql, [
        analysis.id,
        analysis.organizationId,
        analysis.pageId,
        analysis.overallScore,
        JSON.stringify(analysis.answerability),
        JSON.stringify(analysis.entityCoverage),
        JSON.stringify(analysis.semanticCoverage),
        JSON.stringify(analysis.questionCoverage),
        JSON.stringify(analysis.citationReadiness),
        JSON.stringify(analysis.structuredAnswerQuality),
        JSON.stringify(analysis.kgAlignment),
        analysis.scoringVersion,
        analysis.analyzerVersion,
        JSON.stringify(analysis.provenance),
        analysis.createdAt,
        analysis.updatedAt
      ]);
    } catch (err) {
      console.warn("[AeoContentIntelligenceRepository.saveAnalysis Error]: skipping DB.", err);
    }
    db.aeoAnalyses.set(analysis.id, analysis);
    return analysis;
  }

  public async deleteAnalysisSoft(organizationId: string, id: string, deletedBy: string): Promise<boolean> {
    enforceTenantContext(organizationId);
    try {
      const sql = `DELETE FROM aeo_analyses WHERE id = $1 AND organization_id = $2;`;
      const res = await this.pg.query(sql, [id, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        db.aeoAnalyses.delete(id);
        return true;
      }
    } catch (err) {
      console.warn("[AeoContentIntelligenceRepository.deleteAnalysisSoft Error]: skipping DB.", err);
    }
    if (db.aeoAnalyses.has(id)) {
      const item = db.aeoAnalyses.get(id);
      if (item && item.organizationId === organizationId) {
        db.aeoAnalyses.delete(id);
        return true;
      }
    }
    return false;
  }

  // FAQ Opportunities
  public async findFaqOpportunityById(organizationId: string, id: string): Promise<FaqOpportunity | null> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM faq_opportunities WHERE id = $1 AND organization_id = $2 LIMIT 1;`;
      const res = await this.pg.query(sql, [id, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        return this.mapRowToFaqOpportunity(res.rows[0]);
      }
    } catch (err) {
      console.warn("[AeoContentIntelligenceRepository.findFaqOpportunityById Error]: skipping DB.", err);
    }
    const item = db.faqOpportunities.get(id);
    if (!item || item.organizationId !== organizationId) return null;
    return item;
  }

  public async findFaqOpportunitiesByPageId(organizationId: string, pageId: string): Promise<FaqOpportunity[]> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM faq_opportunities WHERE page_id = $1 AND organization_id = $2 ORDER BY created_at DESC;`;
      const res = await this.pg.query(sql, [pageId, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        return res.rows.map(row => this.mapRowToFaqOpportunity(row));
      }
    } catch (err) {
      console.warn("[AeoContentIntelligenceRepository.findFaqOpportunitiesByPageId Error]: skipping DB.", err);
    }
    return Array.from(db.faqOpportunities.values()).filter(
      p => p.pageId === pageId && p.organizationId === organizationId
    );
  }

  public async findAllFaqOpportunities(organizationId: string): Promise<FaqOpportunity[]> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM faq_opportunities WHERE organization_id = $1 ORDER BY created_at DESC;`;
      const res = await this.pg.query(sql, [organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        return res.rows.map(row => this.mapRowToFaqOpportunity(row));
      }
    } catch (err) {
      console.warn("[AeoContentIntelligenceRepository.findAllFaqOpportunities Error]: skipping DB.", err);
    }
    return Array.from(db.faqOpportunities.values()).filter(
      p => p.organizationId === organizationId
    );
  }

  public async saveFaqOpportunity(opportunity: FaqOpportunity): Promise<FaqOpportunity> {
    enforceTenantContext(opportunity.organizationId);
    try {
      const sql = `
        INSERT INTO faq_opportunities (id, organization_id, page_id, question, source_type, evidence_source_id, priority, impact_score, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (page_id, question) DO UPDATE SET
          priority = EXCLUDED.priority,
          impact_score = EXCLUDED.impact_score,
          status = EXCLUDED.status;
      `;
      await this.pg.query(sql, [
        opportunity.id,
        opportunity.organizationId,
        opportunity.pageId,
        opportunity.question,
        opportunity.sourceType,
        opportunity.evidenceSourceId || null,
        opportunity.priority,
        opportunity.impactScore,
        opportunity.status,
        opportunity.createdAt
      ]);
    } catch (err) {
      console.warn("[AeoContentIntelligenceRepository.saveFaqOpportunity Error]: skipping DB.", err);
    }

    // Deduplicate in memory based on page_id and question to mirror PG constraint
    let existingId = opportunity.id;
    for (const [key, existing] of db.faqOpportunities.entries()) {
      if (existing.pageId === opportunity.pageId && existing.question === opportunity.question && existing.organizationId === opportunity.organizationId) {
        existingId = key;
        break;
      }
    }
    db.faqOpportunities.set(existingId, { ...opportunity, id: existingId });
    return opportunity;
  }

  // KG Alignments
  public async findKgAlignmentById(organizationId: string, id: string): Promise<KgAlignment | null> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM kg_alignments WHERE id = $1 AND organization_id = $2 LIMIT 1;`;
      const res = await this.pg.query(sql, [id, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        return this.mapRowToKgAlignment(res.rows[0]);
      }
    } catch (err) {
      console.warn("[AeoContentIntelligenceRepository.findKgAlignmentById Error]: skipping DB.", err);
    }
    const item = db.kgAlignments.get(id);
    if (!item || item.organizationId !== organizationId) return null;
    return item;
  }

  public async findKgAlignmentsByPageId(organizationId: string, pageId: string): Promise<KgAlignment[]> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM kg_alignments WHERE page_id = $1 AND organization_id = $2 ORDER BY created_at DESC;`;
      const res = await this.pg.query(sql, [pageId, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        return res.rows.map(row => this.mapRowToKgAlignment(row));
      }
    } catch (err) {
      console.warn("[AeoContentIntelligenceRepository.findKgAlignmentsByPageId Error]: skipping DB.", err);
    }
    return Array.from(db.kgAlignments.values()).filter(
      p => p.pageId === pageId && p.organizationId === organizationId
    );
  }

  public async findAllKgAlignments(organizationId: string): Promise<KgAlignment[]> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM kg_alignments WHERE organization_id = $1 ORDER BY created_at DESC;`;
      const res = await this.pg.query(sql, [organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        return res.rows.map(row => this.mapRowToKgAlignment(row));
      }
    } catch (err) {
      console.warn("[AeoContentIntelligenceRepository.findAllKgAlignments Error]: skipping DB.", err);
    }
    return Array.from(db.kgAlignments.values()).filter(
      p => p.organizationId === organizationId
    );
  }

  public async saveKgAlignment(alignment: KgAlignment): Promise<KgAlignment> {
    enforceTenantContext(alignment.organizationId);
    try {
      const sql = `
        INSERT INTO kg_alignments (id, organization_id, page_id, alignment_type, entity_name, property_name, expected_value, actual_value, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (page_id, alignment_type, entity_name, COALESCE(property_name, '')) DO UPDATE SET
          expected_value = EXCLUDED.expected_value,
          actual_value = EXCLUDED.actual_value,
          status = EXCLUDED.status;
      `;
      await this.pg.query(sql, [
        alignment.id,
        alignment.organizationId,
        alignment.pageId,
        alignment.alignmentType,
        alignment.entityName,
        alignment.propertyName || null,
        alignment.expectedValue || null,
        alignment.actualValue || null,
        alignment.status,
        alignment.createdAt
      ]);
    } catch (err) {
      console.warn("[AeoContentIntelligenceRepository.saveKgAlignment Error]: skipping DB.", err);
    }

    // Deduplicate in memory to mirror PG constraint
    let existingId = alignment.id;
    for (const [key, existing] of db.kgAlignments.entries()) {
      if (
        existing.pageId === alignment.pageId &&
        existing.alignmentType === alignment.alignmentType &&
        existing.entityName === alignment.entityName &&
        (existing.propertyName || "") === (alignment.propertyName || "") &&
        existing.organizationId === alignment.organizationId
      ) {
        existingId = key;
        break;
      }
    }
    db.kgAlignments.set(existingId, { ...alignment, id: existingId });
    return alignment;
  }
}

export class AIVisibilityAuditRepository implements IAIVisibilityAuditRepository {
  private pg: PostgresClient;
  constructor(pg?: PostgresClient) {
    this.pg = pg || PostgresClient.getInstance();
  }

  private mapRowToAudit(row: any): AIVisibilityAudit {
    return {
      id: row.id,
      organizationId: row.organization_id,
      brandId: row.brand_id,
      status: row.status as AIVisibilityAuditStatus,
      overallScore: row.overall_score,
      metrics: typeof row.metrics === "string" ? JSON.parse(row.metrics) : (row.metrics || {}),
      promptsCoverage: typeof row.prompts_coverage === "string" ? JSON.parse(row.prompts_coverage) : (row.prompts_coverage || {}),
      evidenceSummary: typeof row.evidence_summary === "string" ? JSON.parse(row.evidence_summary) : (row.evidence_summary || {}),
      scoringVersion: row.scoring_version,
      analyzerVersion: row.analyzer_version,
      audit: {
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by,
        updatedBy: row.updated_by,
        deletedAt: row.deleted_at || undefined,
        version: row.version
      }
    };
  }

  private mapRowToPrompt(row: any): AuditPrompt {
    return {
      id: row.id,
      organizationId: row.organization_id,
      auditId: row.audit_id,
      promptText: row.prompt_text,
      category: row.category,
      targetEntity: row.target_entity,
      locale: row.locale,
      status: row.status as AuditPromptStatus,
      errorMessage: row.error_message || undefined,
      latencyMs: row.latency_ms || undefined,
      executedAt: row.executed_at || undefined,
      responseText: row.response_text || undefined,
      analysis: typeof row.analysis === "string" ? JSON.parse(row.analysis) : (row.analysis || {}),
      audit: {
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by,
        updatedBy: row.updated_by,
        deletedAt: row.deleted_at || undefined,
        version: row.version
      }
    };
  }

  public async findById(organizationId: string, id: string): Promise<AIVisibilityAudit | null> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM ai_visibility_audits WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL LIMIT 1;`;
      const res = await this.pg.query(sql, [id, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        return this.mapRowToAudit(res.rows[0]);
      }
    } catch (err) {
      console.warn("[AIVisibilityAuditRepository.findById Error]: Database query skipped or failed, using memory fallback.", err);
    }
    const item = db.aiVisibilityAudits.get(id);
    if (!item || item.organizationId !== organizationId || item.audit.deletedAt) return null;
    return item;
  }

  public async findByBrandId(organizationId: string, brandId: string, params?: QueryParams): Promise<PaginatedResult<AIVisibilityAudit>> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM ai_visibility_audits WHERE brand_id = $1 AND organization_id = $2 AND deleted_at IS NULL ORDER BY created_at DESC;`;
      const res = await this.pg.query(sql, [brandId, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        const mapped = res.rows.map(row => this.mapRowToAudit(row));
        return paginateArray(mapped, params);
      }
    } catch (err) {
      console.warn("[AIVisibilityAuditRepository.findByBrandId Error]: Database query skipped or failed, using memory fallback.", err);
    }
    const list = Array.from(db.aiVisibilityAudits.values()).filter(
      v => v.brandId === brandId && v.organizationId === organizationId && (params?.includeDeleted || !v.audit.deletedAt)
    ).sort((a, b) => new Date(b.audit.createdAt).getTime() - new Date(a.audit.createdAt).getTime());
    return paginateArray(list, params);
  }

  public async save(audit: AIVisibilityAudit): Promise<AIVisibilityAudit> {
    enforceTenantContext(audit.organizationId);
    try {
      const sql = `
        INSERT INTO ai_visibility_audits (id, organization_id, brand_id, status, overall_score, metrics, prompts_coverage, evidence_summary, scoring_version, analyzer_version, created_at, updated_at, created_by, updated_by, version)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          overall_score = EXCLUDED.overall_score,
          metrics = EXCLUDED.metrics,
          prompts_coverage = EXCLUDED.prompts_coverage,
          evidence_summary = EXCLUDED.evidence_summary,
          updated_at = EXCLUDED.updated_at,
          updated_by = EXCLUDED.updated_by,
          version = ai_visibility_audits.version + 1;
      `;
      await this.pg.query(sql, [
        audit.id,
        audit.organizationId,
        audit.brandId,
        audit.status,
        audit.overallScore,
        JSON.stringify(audit.metrics),
        JSON.stringify(audit.promptsCoverage),
        JSON.stringify(audit.evidenceSummary),
        audit.scoringVersion,
        audit.analyzerVersion,
        audit.audit.createdAt,
        audit.audit.updatedAt,
        audit.audit.createdBy,
        audit.audit.updatedBy,
        audit.audit.version
      ]);
    } catch (err) {
      console.warn("[AIVisibilityAuditRepository.save Error]: Database write skipped or failed, using memory fallback.", err);
    }
    db.aiVisibilityAudits.set(audit.id, audit);
    return audit;
  }

  public async deleteSoft(organizationId: string, id: string, deletedBy: string): Promise<boolean> {
    enforceTenantContext(organizationId);
    try {
      const sql = `UPDATE ai_visibility_audits SET deleted_at = NOW(), updated_by = $1, updated_at = NOW() WHERE id = $2 AND organization_id = $3;`;
      const res = await this.pg.query(sql, [deletedBy, id, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        return true;
      }
    } catch (err) {
      console.warn("[AIVisibilityAuditRepository.deleteSoft Error]: Database write skipped or failed, using memory fallback.", err);
    }
    const item = db.aiVisibilityAudits.get(id);
    if (!item || item.organizationId !== organizationId) return false;
    item.audit.deletedAt = new Date().toISOString();
    item.audit.updatedBy = deletedBy;
    item.audit.updatedAt = new Date().toISOString();
    return true;
  }

  public async findPromptsByAuditId(organizationId: string, auditId: string): Promise<AuditPrompt[]> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM audit_prompts WHERE audit_id = $1 AND organization_id = $2 AND deleted_at IS NULL ORDER BY created_at ASC;`;
      const res = await this.pg.query(sql, [auditId, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        return res.rows.map(row => this.mapRowToPrompt(row));
      }
    } catch (err) {
      console.warn("[AIVisibilityAuditRepository.findPromptsByAuditId Error]: Database query skipped or failed, using memory fallback.", err);
    }
    return Array.from(db.auditPrompts.values()).filter(
      p => p.auditId === auditId && p.organizationId === organizationId && !p.audit.deletedAt
    );
  }

  public async findPromptById(organizationId: string, id: string): Promise<AuditPrompt | null> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM audit_prompts WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL LIMIT 1;`;
      const res = await this.pg.query(sql, [id, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        return this.mapRowToPrompt(res.rows[0]);
      }
    } catch (err) {
      console.warn("[AIVisibilityAuditRepository.findPromptById Error]: Database query skipped or failed, using memory fallback.", err);
    }
    const item = db.auditPrompts.get(id);
    if (!item || item.organizationId !== organizationId || item.audit.deletedAt) return null;
    return item;
  }

  public async savePrompt(prompt: AuditPrompt): Promise<AuditPrompt> {
    enforceTenantContext(prompt.organizationId);
    try {
      const sql = `
        INSERT INTO audit_prompts (id, organization_id, audit_id, prompt_text, category, target_entity, locale, status, error_message, latency_ms, executed_at, response_text, analysis, created_at, updated_at, created_by, updated_by, version)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          error_message = EXCLUDED.error_message,
          latency_ms = EXCLUDED.latency_ms,
          executed_at = EXCLUDED.executed_at,
          response_text = EXCLUDED.response_text,
          analysis = EXCLUDED.analysis,
          updated_at = EXCLUDED.updated_at,
          updated_by = EXCLUDED.updated_by,
          version = audit_prompts.version + 1;
      `;
      await this.pg.query(sql, [
        prompt.id,
        prompt.organizationId,
        prompt.auditId,
        prompt.promptText,
        prompt.category,
        prompt.targetEntity,
        prompt.locale,
        prompt.status,
        prompt.errorMessage || null,
        prompt.latencyMs || null,
        prompt.executedAt || null,
        prompt.responseText || null,
        JSON.stringify(prompt.analysis),
        prompt.audit.createdAt,
        prompt.audit.updatedAt,
        prompt.audit.createdBy,
        prompt.audit.updatedBy,
        prompt.audit.version
      ]);
    } catch (err) {
      console.warn("[AIVisibilityAuditRepository.savePrompt Error]: Database write skipped or failed, using memory fallback.", err);
    }
    db.auditPrompts.set(prompt.id, prompt);
    return prompt;
  }
}

export class PromptIntelligenceRepository implements IPromptIntelligenceRepository {
  private pg: PostgresClient;
  constructor(pg?: PostgresClient) {
    this.pg = pg || PostgresClient.getInstance();
  }

  private mapRowToDefinition(row: any): PromptDefinition {
    return {
      id: row.id,
      organizationId: row.organization_id,
      brandId: row.brand_id,
      name: row.name,
      promptTemplate: row.prompt_template,
      category: row.category,
      intent: row.intent,
      locale: row.locale,
      isActive: row.is_active,
      variables: typeof row.variables === "string" ? JSON.parse(row.variables) : (row.variables || []),
      competitors: row.competitors || [],
      tags: row.tags || [],
      notes: row.notes || undefined,
      version: row.version,
      audit: {
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by,
        updatedBy: row.updated_by,
        deletedAt: row.deleted_at || undefined,
        version: row.opt_version
      }
    };
  }

  private mapRowToSchedule(row: any): PromptSchedule {
    return {
      id: row.id,
      organizationId: row.organization_id,
      promptId: row.prompt_id,
      enabled: row.enabled,
      cronExpression: row.cron_expression,
      timezone: row.timezone,
      nextExecutionAt: row.next_execution_at || undefined,
      lastExecutionAt: row.last_execution_at || undefined,
      status: row.status,
      failureReason: row.failure_reason || undefined,
      scheduleVersion: row.schedule_version,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapRowToExecution(row: any): PromptExecution {
    return {
      id: row.id,
      organizationId: row.organization_id,
      promptId: row.prompt_id,
      promptVersion: row.prompt_version,
      resolvedPromptText: row.resolved_prompt_text,
      variablesValues: typeof row.variables_values === "string" ? JSON.parse(row.variables_values) : (row.variables_values || {}),
      status: row.status,
      provider: row.provider,
      model: row.model,
      modelVersion: row.model_version || undefined,
      responseText: row.response_text || undefined,
      latencyMs: row.latency_ms || undefined,
      errorMessage: row.error_message || undefined,
      attempts: row.attempts,
      maxAttempts: row.max_attempts,
      scheduledFor: row.scheduled_for || undefined,
      executedAt: row.executed_at || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapRowToPosition(row: any): PositionObservation {
    return {
      id: row.id,
      organizationId: row.organization_id,
      sourceExecutionId: row.source_execution_id,
      subjectEntityId: row.subject_entity_id,
      presence: row.presence,
      numericPosition: row.numeric_position || undefined,
      evidenceExcerpt: row.evidence_excerpt,
      evidenceStructure: row.evidence_structure,
      confidence: row.confidence,
      analyzerVersion: row.analyzer_version,
      createdAt: row.created_at
    };
  }

  // Definitions
  public async findDefinitionById(organizationId: string, id: string): Promise<PromptDefinition | null> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM prompt_definitions WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL LIMIT 1;`;
      const res = await this.pg.query(sql, [id, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        return this.mapRowToDefinition(res.rows[0]);
      }
    } catch (err) {
      console.warn("[PromptIntelligenceRepository.findDefinitionById Error]: using memory fallback.", err);
    }
    const item = db.promptDefinitions.get(id);
    if (!item || item.organizationId !== organizationId || item.audit.deletedAt) return null;
    return item;
  }

  public async findDefinitionsByBrandId(organizationId: string, brandId: string, params?: QueryParams): Promise<PaginatedResult<PromptDefinition>> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM prompt_definitions WHERE brand_id = $1 AND organization_id = $2 AND deleted_at IS NULL ORDER BY created_at DESC;`;
      const res = await this.pg.query(sql, [brandId, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        const mapped = res.rows.map(row => this.mapRowToDefinition(row));
        return paginateArray(mapped, params);
      }
    } catch (err) {
      console.warn("[PromptIntelligenceRepository.findDefinitionsByBrandId Error]: using memory fallback.", err);
    }
    const list = Array.from(db.promptDefinitions.values()).filter(
      v => v.brandId === brandId && v.organizationId === organizationId && (params?.includeDeleted || !v.audit.deletedAt)
    ).sort((a, b) => new Date(b.audit.createdAt).getTime() - new Date(a.audit.createdAt).getTime());
    return paginateArray(list, params);
  }

  public async saveDefinition(definition: PromptDefinition): Promise<PromptDefinition> {
    enforceTenantContext(definition.organizationId);
    try {
      const sql = `
        INSERT INTO prompt_definitions (id, organization_id, brand_id, name, prompt_template, category, intent, locale, is_active, variables, competitors, tags, notes, version, created_at, updated_at, created_by, updated_by, opt_version)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          prompt_template = EXCLUDED.prompt_template,
          category = EXCLUDED.category,
          intent = EXCLUDED.intent,
          locale = EXCLUDED.locale,
          is_active = EXCLUDED.is_active,
          variables = EXCLUDED.variables,
          competitors = EXCLUDED.competitors,
          tags = EXCLUDED.tags,
          notes = EXCLUDED.notes,
          version = EXCLUDED.version,
          updated_at = EXCLUDED.updated_at,
          updated_by = EXCLUDED.updated_by,
          opt_version = prompt_definitions.opt_version + 1;
      `;
      await this.pg.query(sql, [
        definition.id,
        definition.organizationId,
        definition.brandId,
        definition.name,
        definition.promptTemplate,
        definition.category,
        definition.intent,
        definition.locale,
        definition.isActive,
        JSON.stringify(definition.variables),
        definition.competitors,
        definition.tags,
        definition.notes || null,
        definition.version,
        definition.audit.createdAt,
        definition.audit.updatedAt,
        definition.audit.createdBy,
        definition.audit.updatedBy,
        definition.audit.version
      ]);
    } catch (err) {
      console.warn("[PromptIntelligenceRepository.saveDefinition Error]: using memory fallback.", err);
    }
    db.promptDefinitions.set(definition.id, definition);
    return definition;
  }

  public async deleteDefinitionSoft(organizationId: string, id: string, deletedBy: string): Promise<boolean> {
    enforceTenantContext(organizationId);
    try {
      const sql = `UPDATE prompt_definitions SET deleted_at = NOW(), updated_by = $1 WHERE id = $2 AND organization_id = $3;`;
      const res = await this.pg.query(sql, [deletedBy, id, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        return true;
      }
    } catch (err) {
      console.warn("[PromptIntelligenceRepository.deleteDefinitionSoft Error]: using memory fallback.", err);
    }
    const item = db.promptDefinitions.get(id);
    if (!item || item.organizationId !== organizationId) return false;
    item.audit.deletedAt = new Date().toISOString();
    item.audit.updatedBy = deletedBy;
    item.audit.updatedAt = new Date().toISOString();
    return true;
  }

  // Schedules
  public async findScheduleByPromptId(organizationId: string, promptId: string): Promise<PromptSchedule | null> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM prompt_schedules WHERE prompt_id = $1 AND organization_id = $2 AND deleted_at IS NULL LIMIT 1;`;
      const res = await this.pg.query(sql, [promptId, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        return this.mapRowToSchedule(res.rows[0]);
      }
    } catch (err) {
      console.warn("[PromptIntelligenceRepository.findScheduleByPromptId Error]: using memory fallback.", err);
    }
    for (const item of db.promptSchedules.values()) {
      if (item.promptId === promptId && item.organizationId === organizationId) {
        return item;
      }
    }
    return null;
  }

  public async findScheduleById(organizationId: string, id: string): Promise<PromptSchedule | null> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM prompt_schedules WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL LIMIT 1;`;
      const res = await this.pg.query(sql, [id, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        return this.mapRowToSchedule(res.rows[0]);
      }
    } catch (err) {
      console.warn("[PromptIntelligenceRepository.findScheduleById Error]: using memory fallback.", err);
    }
    const item = db.promptSchedules.get(id);
    if (!item || item.organizationId !== organizationId) return null;
    return item;
  }

  public async findActiveSchedules(): Promise<PromptSchedule[]> {
    try {
      const sql = `SELECT * FROM prompt_schedules WHERE enabled = true;`;
      const res = await this.pg.query(sql, []);
      if (res.rowCount && res.rowCount > 0) {
        return res.rows.map(row => this.mapRowToSchedule(row));
      }
    } catch (err) {
      console.warn("Error", err);
    }
    return Array.from(db.promptSchedules.values()).filter(p => p.enabled);
  }

  public async findAllSchedules(organizationId: string): Promise<PromptSchedule[]> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM prompt_schedules WHERE organization_id = $1 AND deleted_at IS NULL;`;
      const res = await this.pg.query(sql, [organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        return res.rows.map(row => this.mapRowToSchedule(row));
      }
    } catch (err) {
      console.warn("[PromptIntelligenceRepository.findAllSchedules Error]: using memory fallback.", err);
    }
    return Array.from(db.promptSchedules.values()).filter(
      p => p.organizationId === organizationId
    );
  }

  public async saveSchedule(schedule: PromptSchedule): Promise<PromptSchedule> {
    enforceTenantContext(schedule.organizationId);
    try {
      const sql = `
        INSERT INTO prompt_schedules (id, organization_id, prompt_id, enabled, cron_expression, timezone, next_execution_at, last_execution_at, status, failure_reason, schedule_version, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO UPDATE SET
          enabled = EXCLUDED.enabled,
          cron_expression = EXCLUDED.cron_expression,
          timezone = EXCLUDED.timezone,
          next_execution_at = EXCLUDED.next_execution_at,
          last_execution_at = EXCLUDED.last_execution_at,
          status = EXCLUDED.status,
          failure_reason = EXCLUDED.failure_reason,
          schedule_version = EXCLUDED.schedule_version,
          updated_at = EXCLUDED.updated_at;
      `;
      await this.pg.query(sql, [
        schedule.id,
        schedule.organizationId,
        schedule.promptId,
        schedule.enabled,
        schedule.cronExpression,
        schedule.timezone,
        schedule.nextExecutionAt || null,
        schedule.lastExecutionAt || null,
        schedule.status,
        schedule.failureReason || null,
        schedule.scheduleVersion,
        schedule.createdAt,
        schedule.updatedAt
      ]);
    } catch (err) {
      console.warn("[PromptIntelligenceRepository.saveSchedule Error]: using memory fallback.", err);
    }
    db.promptSchedules.set(schedule.id, schedule);
    return schedule;
  }

  // Executions
  public async findExecutionById(organizationId: string, id: string): Promise<PromptExecution | null> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM prompt_executions WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL LIMIT 1;`;
      const res = await this.pg.query(sql, [id, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        return this.mapRowToExecution(res.rows[0]);
      }
    } catch (err) {
      console.warn("[PromptIntelligenceRepository.findExecutionById Error]: using memory fallback.", err);
    }
    const item = db.promptExecutions.get(id);
    if (!item || item.organizationId !== organizationId) return null;
    return item;
  }

  public async findExecutionsByPromptId(organizationId: string, promptId: string, params?: QueryParams): Promise<PaginatedResult<PromptExecution>> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM prompt_executions WHERE prompt_id = $1 AND organization_id = $2 AND deleted_at IS NULL ORDER BY created_at DESC;`;
      const res = await this.pg.query(sql, [promptId, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        const mapped = res.rows.map(row => this.mapRowToExecution(row));
        return paginateArray(mapped, params);
      }
    } catch (err) {
      console.warn("[PromptIntelligenceRepository.findExecutionsByPromptId Error]: using memory fallback.", err);
    }
    const list = Array.from(db.promptExecutions.values()).filter(
      v => v.promptId === promptId && v.organizationId === organizationId
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return paginateArray(list, params);
  }

  public async saveExecution(execution: PromptExecution): Promise<PromptExecution> {
    enforceTenantContext(execution.organizationId);
    try {
      const sql = `
        INSERT INTO prompt_executions (id, organization_id, prompt_id, prompt_version, resolved_prompt_text, variables_values, status, provider, model, model_version, response_text, latency_ms, error_message, attempts, max_attempts, scheduled_for, executed_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          response_text = EXCLUDED.response_text,
          latency_ms = EXCLUDED.latency_ms,
          error_message = EXCLUDED.error_message,
          attempts = EXCLUDED.attempts,
          executed_at = EXCLUDED.executed_at,
          updated_at = EXCLUDED.updated_at;
      `;
      await this.pg.query(sql, [
        execution.id,
        execution.organizationId,
        execution.promptId,
        execution.promptVersion,
        execution.resolvedPromptText,
        JSON.stringify(execution.variablesValues),
        execution.status,
        execution.provider,
        execution.model,
        execution.modelVersion || null,
        execution.responseText || null,
        execution.latencyMs || null,
        execution.errorMessage || null,
        execution.attempts,
        execution.maxAttempts,
        execution.scheduledFor || null,
        execution.executedAt || null,
        execution.createdAt,
        execution.updatedAt
      ]);
    } catch (err) {
      console.warn("[PromptIntelligenceRepository.saveExecution Error]: using memory fallback.", err);
    }
    db.promptExecutions.set(execution.id, execution);
    return execution;
  }

  // Position Observations
  public async findPositionsByExecutionId(organizationId: string, executionId: string): Promise<PositionObservation[]> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM position_observations WHERE source_execution_id = $1 AND organization_id = $2;`;
      const res = await this.pg.query(sql, [executionId, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        return res.rows.map(row => this.mapRowToPosition(row));
      }
    } catch (err) {
      console.warn("[PromptIntelligenceRepository.findPositionsByExecutionId Error]: using memory fallback.", err);
    }
    return Array.from(db.positionObservations.values()).filter(
      p => p.sourceExecutionId === executionId && p.organizationId === organizationId
    );
  }

  public async savePosition(position: PositionObservation): Promise<PositionObservation> {
    enforceTenantContext(position.organizationId);
    try {
      const sql = `
        INSERT INTO position_observations (id, organization_id, source_execution_id, subject_entity_id, presence, numeric_position, evidence_excerpt, evidence_structure, confidence, analyzer_version, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO NOTHING;
      `;
      await this.pg.query(sql, [
        position.id,
        position.organizationId,
        position.sourceExecutionId,
        position.subjectEntityId,
        position.presence,
        position.numericPosition || null,
        position.evidenceExcerpt,
        position.evidenceStructure,
        position.confidence,
        position.analyzerVersion,
        position.createdAt
      ]);
    } catch (err) {
      console.warn("[PromptIntelligenceRepository.savePosition Error]: using memory fallback.", err);
    }
    db.positionObservations.set(position.id, position);
    return position;
  }
}

export class CitationIntelligenceRepository implements ICitationIntelligenceRepository {
  private pg: PostgresClient;
  constructor(pg?: PostgresClient) {
    this.pg = pg || PostgresClient.getInstance();
  }

  private mapRowToSource(row: any): CitationSource {
    return {
      id: row.id,
      organizationId: row.organization_id,
      domain: row.domain,
      canonicalUrl: row.canonical_url || undefined,
      classification: row.classification,
      qualityScore: row.quality_score,
      authorityScore: row.authority_score,
      firstSeenAt: row.first_seen_at,
      lastSeenAt: row.last_seen_at,
      occurrenceCount: row.occurrence_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapRowToOccurrence(row: any): CitationOccurrence {
    return {
      id: row.id,
      organizationId: row.organization_id,
      sourceId: row.source_id,
      auditId: row.audit_id || undefined,
      executionId: row.execution_id || undefined,
      promptId: row.prompt_id || undefined,
      observationId: row.observation_id || undefined,
      url: row.url,
      title: row.title || undefined,
      snippet: row.snippet || undefined,
      position: row.position || undefined,
      confidence: row.confidence,
      createdAt: row.created_at
    };
  }

  public async findSourceById(organizationId: string, id: string): Promise<CitationSource | null> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM citation_sources WHERE id = $1 AND organization_id = $2 LIMIT 1;`;
      const res = await this.pg.query(sql, [id, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        return this.mapRowToSource(res.rows[0]);
      }
    } catch (err) {
      console.warn("[CitationIntelligenceRepository.findSourceById Error]: using memory fallback.", err);
    }
    const item = db.citationSources.get(id);
    if (!item || item.organizationId !== organizationId) return null;
    return item;
  }

  public async findSourceByDomain(organizationId: string, domain: string): Promise<CitationSource | null> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM citation_sources WHERE LOWER(domain) = LOWER($1) AND organization_id = $2 LIMIT 1;`;
      const res = await this.pg.query(sql, [domain, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        return this.mapRowToSource(res.rows[0]);
      }
    } catch (err) {
      console.warn("[CitationIntelligenceRepository.findSourceByDomain Error]: using memory fallback.", err);
    }
    for (const item of db.citationSources.values()) {
      if (item.domain.toLowerCase() === domain.toLowerCase() && item.organizationId === organizationId) {
        return item;
      }
    }
    return null;
  }

  public async findSources(organizationId: string, params?: QueryParams): Promise<PaginatedResult<CitationSource>> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM citation_sources WHERE organization_id = $1 ORDER BY occurrence_count DESC;`;
      const res = await this.pg.query(sql, [organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        const mapped = res.rows.map(row => this.mapRowToSource(row));
        return paginateArray(mapped, params);
      }
    } catch (err) {
      console.warn("[CitationIntelligenceRepository.findSources Error]: using memory fallback.", err);
    }
    const list = Array.from(db.citationSources.values()).filter(
      v => v.organizationId === organizationId
    ).sort((a, b) => b.occurrenceCount - a.occurrenceCount);
    return paginateArray(list, params);
  }

  public async saveSource(source: CitationSource): Promise<CitationSource> {
    enforceTenantContext(source.organizationId);
    try {
      const sql = `
        INSERT INTO citation_sources (id, organization_id, domain, canonical_url, classification, quality_score, authority_score, first_seen_at, last_seen_at, occurrence_count, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (organization_id, domain) DO UPDATE SET
          canonical_url = EXCLUDED.canonical_url,
          classification = EXCLUDED.classification,
          quality_score = EXCLUDED.quality_score,
          authority_score = EXCLUDED.authority_score,
          last_seen_at = EXCLUDED.last_seen_at,
          occurrence_count = EXCLUDED.occurrence_count,
          updated_at = EXCLUDED.updated_at;
      `;
      await this.pg.query(sql, [
        source.id,
        source.organizationId,
        source.domain,
        source.canonicalUrl || null,
        source.classification,
        source.qualityScore,
        source.authorityScore,
        source.firstSeenAt,
        source.lastSeenAt,
        source.occurrenceCount,
        source.createdAt,
        source.updatedAt
      ]);
    } catch (err) {
      console.warn("[CitationIntelligenceRepository.saveSource Error]: using memory fallback.", err);
    }
    db.citationSources.set(source.id, source);
    return source;
  }

  public async findOccurrencesBySourceId(organizationId: string, sourceId: string): Promise<CitationOccurrence[]> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM citation_occurrences WHERE source_id = $1 AND organization_id = $2 ORDER BY created_at DESC;`;
      const res = await this.pg.query(sql, [sourceId, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        return res.rows.map(row => this.mapRowToOccurrence(row));
      }
    } catch (err) {
      console.warn("[CitationIntelligenceRepository.findOccurrencesBySourceId Error]: using memory fallback.", err);
    }
    return Array.from(db.citationOccurrences.values()).filter(
      p => p.sourceId === sourceId && p.organizationId === organizationId
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async findOccurrencesByAuditId(organizationId: string, auditId: string): Promise<CitationOccurrence[]> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM citation_occurrences WHERE audit_id = $1 AND organization_id = $2;`;
      const res = await this.pg.query(sql, [auditId, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        return res.rows.map(row => this.mapRowToOccurrence(row));
      }
    } catch (err) {
      console.warn("[CitationIntelligenceRepository.findOccurrencesByAuditId Error]: using memory fallback.", err);
    }
    return Array.from(db.citationOccurrences.values()).filter(
      p => p.auditId === auditId && p.organizationId === organizationId
    );
  }

  public async findOccurrencesByExecutionId(organizationId: string, executionId: string): Promise<CitationOccurrence[]> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM citation_occurrences WHERE execution_id = $1 AND organization_id = $2;`;
      const res = await this.pg.query(sql, [executionId, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        return res.rows.map(row => this.mapRowToOccurrence(row));
      }
    } catch (err) {
      console.warn("[CitationIntelligenceRepository.findOccurrencesByExecutionId Error]: using memory fallback.", err);
    }
    return Array.from(db.citationOccurrences.values()).filter(
      p => p.executionId === executionId && p.organizationId === organizationId
    );
  }

  public async findAllOccurrences(organizationId: string): Promise<CitationOccurrence[]> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM citation_occurrences WHERE organization_id = $1 ORDER BY created_at DESC;`;
      const res = await this.pg.query(sql, [organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        return res.rows.map(row => this.mapRowToOccurrence(row));
      }
    } catch (err) {
      console.warn("[CitationIntelligenceRepository.findAllOccurrences Error]: using memory fallback.", err);
    }
    return Array.from(db.citationOccurrences.values()).filter(
      p => p.organizationId === organizationId
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async saveOccurrence(occurrence: CitationOccurrence): Promise<CitationOccurrence> {
    enforceTenantContext(occurrence.organizationId);
    try {
      const sql = `
        INSERT INTO citation_occurrences (id, organization_id, source_id, audit_id, execution_id, prompt_id, observation_id, url, title, snippet, position, confidence, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (organization_id, source_id, observation_id, url) DO NOTHING;
      `;
      await this.pg.query(sql, [
        occurrence.id,
        occurrence.organizationId,
        occurrence.sourceId,
        occurrence.auditId || null,
        occurrence.executionId || null,
        occurrence.promptId || null,
        occurrence.observationId || null,
        occurrence.url,
        occurrence.title || null,
        occurrence.snippet || null,
        occurrence.position || null,
        occurrence.confidence,
        occurrence.createdAt
      ]);
    } catch (err) {
      console.warn("[CitationIntelligenceRepository.saveOccurrence Error]: using memory fallback.", err);
    }
    const exists = Array.from(db.citationOccurrences.values()).some(
      o => o.organizationId === occurrence.organizationId &&
           o.sourceId === occurrence.sourceId &&
           o.observationId === occurrence.observationId &&
           o.url === occurrence.url
    );
    if (!exists) {
      db.citationOccurrences.set(occurrence.id, occurrence);
    }
    return occurrence;
  }
}

export class BrandIntelligenceRepository implements IBrandIntelligenceRepository {
  private pg: PostgresClient;
  constructor(pg?: PostgresClient) {
    this.pg = pg || PostgresClient.getInstance();
  }

  private mapRowToAssociation(row: any): BrandAssociation {
    return {
      id: row.id,
      organizationId: row.organization_id,
      brandId: row.brand_id,
      entityName: row.entity_name,
      relationshipType: row.relationship_type,
      occurrenceCount: row.occurrence_count,
      firstSeenAt: row.first_seen_at,
      lastSeenAt: row.last_seen_at,
      supportingContext: row.supporting_context,
      confidence: row.confidence,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapRowToRecommendation(row: any): RecommendationObservation {
    return {
      id: row.id,
      organizationId: row.organization_id,
      brandId: row.brand_id,
      executionId: row.execution_id || undefined,
      promptId: row.prompt_id || undefined,
      observationId: row.observation_id,
      recommendationStatus: row.recommendation_status,
      position: row.position || undefined,
      evidenceExcerpt: row.evidence_excerpt,
      createdAt: row.created_at
    };
  }

  public async findAssociationById(organizationId: string, id: string): Promise<BrandAssociation | null> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM brand_associations WHERE id = $1 AND organization_id = $2 LIMIT 1;`;
      const res = await this.pg.query(sql, [id, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        return this.mapRowToAssociation(res.rows[0]);
      }
    } catch (err) {
      console.warn("[BrandIntelligenceRepository.findAssociationById Error]: using memory fallback.", err);
    }
    const item = db.brandAssociations.get(id);
    if (!item || item.organizationId !== organizationId) return null;
    return item;
  }

  public async findAssociationByEntity(organizationId: string, brandId: string, entityName: string, relType: string): Promise<BrandAssociation | null> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM brand_associations WHERE LOWER(entity_name) = LOWER($1) AND relationship_type = $2 AND brand_id = $3 AND organization_id = $4 LIMIT 1;`;
      const res = await this.pg.query(sql, [entityName, relType, brandId, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        return this.mapRowToAssociation(res.rows[0]);
      }
    } catch (err) {
      console.warn("[BrandIntelligenceRepository.findAssociationByEntity Error]: using memory fallback.", err);
    }
    for (const item of db.brandAssociations.values()) {
      if (
        item.entityName.toLowerCase() === entityName.toLowerCase() &&
        item.relationshipType === relType &&
        item.brandId === brandId &&
        item.organizationId === organizationId
      ) {
        return item;
      }
    }
    return null;
  }

  public async findAssociationsByBrandId(organizationId: string, brandId: string): Promise<BrandAssociation[]> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM brand_associations WHERE brand_id = $1 AND organization_id = $2 ORDER BY occurrence_count DESC;`;
      const res = await this.pg.query(sql, [brandId, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        return res.rows.map(row => this.mapRowToAssociation(row));
      }
    } catch (err) {
      console.warn("[BrandIntelligenceRepository.findAssociationsByBrandId Error]: using memory fallback.", err);
    }
    return Array.from(db.brandAssociations.values()).filter(
      p => p.brandId === brandId && p.organizationId === organizationId
    ).sort((a, b) => b.occurrenceCount - a.occurrenceCount);
  }

  public async saveAssociation(association: BrandAssociation): Promise<BrandAssociation> {
    enforceTenantContext(association.organizationId);
    try {
      const sql = `
        INSERT INTO brand_associations (id, organization_id, brand_id, entity_name, relationship_type, occurrence_count, first_seen_at, last_seen_at, supporting_context, confidence, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (organization_id, brand_id, entity_name, relationship_type) DO UPDATE SET
          occurrence_count = EXCLUDED.occurrence_count,
          last_seen_at = EXCLUDED.last_seen_at,
          supporting_context = EXCLUDED.supporting_context,
          confidence = EXCLUDED.confidence,
          updated_at = EXCLUDED.updated_at;
      `;
      await this.pg.query(sql, [
        association.id,
        association.organizationId,
        association.brandId,
        association.entityName,
        association.relationshipType,
        association.occurrenceCount,
        association.firstSeenAt,
        association.lastSeenAt,
        association.supportingContext,
        association.confidence,
        association.createdAt,
        association.updatedAt
      ]);
    } catch (err) {
      console.warn("[BrandIntelligenceRepository.saveAssociation Error]: using memory fallback.", err);
    }
    db.brandAssociations.set(association.id, association);
    return association;
  }

  // Recommendations
  public async findRecommendationByObservationId(organizationId: string, brandId: string, observationId: string): Promise<RecommendationObservation | null> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM recommendation_observations WHERE observation_id = $1 AND brand_id = $2 AND organization_id = $3 LIMIT 1;`;
      const res = await this.pg.query(sql, [observationId, brandId, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        return this.mapRowToRecommendation(res.rows[0]);
      }
    } catch (err) {
      console.warn("[BrandIntelligenceRepository.findRecommendationByObservationId Error]: using memory fallback.", err);
    }
    for (const item of db.recommendationObservations.values()) {
      if (item.observationId === observationId && item.brandId === brandId && item.organizationId === organizationId) {
        return item;
      }
    }
    return null;
  }

  public async findRecommendationsByBrandId(organizationId: string, brandId: string): Promise<RecommendationObservation[]> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM recommendation_observations WHERE brand_id = $1 AND organization_id = $2 ORDER BY created_at DESC;`;
      const res = await this.pg.query(sql, [brandId, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        return res.rows.map(row => this.mapRowToRecommendation(row));
      }
    } catch (err) {
      console.warn("[BrandIntelligenceRepository.findRecommendationsByBrandId Error]: using memory fallback.", err);
    }
    return Array.from(db.recommendationObservations.values()).filter(
      p => p.brandId === brandId && p.organizationId === organizationId
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async saveRecommendationObservation(rec: RecommendationObservation): Promise<RecommendationObservation> {
    enforceTenantContext(rec.organizationId);
    try {
      const sql = `
        INSERT INTO recommendation_observations (id, organization_id, brand_id, execution_id, prompt_id, observation_id, recommendation_status, position, evidence_excerpt, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (organization_id, brand_id, observation_id) DO UPDATE SET
          recommendation_status = EXCLUDED.recommendation_status,
          position = EXCLUDED.position,
          evidence_excerpt = EXCLUDED.evidence_excerpt;
      `;
      await this.pg.query(sql, [
        rec.id,
        rec.organizationId,
        rec.brandId,
        rec.executionId || null,
        rec.promptId || null,
        rec.observationId,
        rec.recommendationStatus,
        rec.position || null,
        rec.evidenceExcerpt,
        rec.createdAt
      ]);
    } catch (err) {
      console.warn("[BrandIntelligenceRepository.saveRecommendationObservation Error]: using memory fallback.", err);
    }
    db.recommendationObservations.set(rec.id, rec);
    return rec;
  }
}

export class WebsiteRepository implements IWebsiteRepository {
  private pg: PostgresClient;
  constructor(pg?: PostgresClient) {
    this.pg = pg || PostgresClient.getInstance();
  }

  public async findById(organizationId: string, id: string): Promise<Website | null> {
    enforceTenantContext(organizationId);
    const sql = `SELECT * FROM websites WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL LIMIT 1;`;
    await this.pg.query(sql, [id, organizationId]);

    const item = db.websites.get(id);
    if (!item || item.organizationId !== organizationId || item.audit.deletedAt) return null;
    return item;
  }

  public async findByDomain(organizationId: string, domain: string): Promise<Website | null> {
    enforceTenantContext(organizationId);
    const sql = `SELECT * FROM websites WHERE domain = $1 AND organization_id = $2 AND deleted_at IS NULL LIMIT 1;`;
    await this.pg.query(sql, [domain, organizationId]);

    for (const item of db.websites.values()) {
      if (item.domain === domain && item.organizationId === organizationId && !item.audit.deletedAt) {
        return item;
      }
    }
    return null;
  }

  public async save(website: Website): Promise<Website> {
    enforceTenantContext(website.organizationId);
    const sql = `
      INSERT INTO websites (id, organization_id, domain, normalized_url, status, last_crawled_at, last_analyzed_at, created_at, updated_at, created_by, updated_by, version)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (organization_id, domain) DO UPDATE SET
        normalized_url = EXCLUDED.normalized_url,
        status = EXCLUDED.status,
        last_crawled_at = EXCLUDED.last_crawled_at,
        last_analyzed_at = EXCLUDED.last_analyzed_at,
        updated_at = EXCLUDED.updated_at,
        updated_by = EXCLUDED.updated_by,
        version = websites.version + 1;
    `;
    await this.pg.query(sql, [
      website.id,
      website.organizationId,
      website.domain,
      website.normalizedUrl,
      website.status,
      website.lastCrawledAt || null,
      website.lastAnalyzedAt || null,
      website.audit.createdAt,
      website.audit.updatedAt,
      website.audit.createdBy,
      website.audit.updatedBy,
      website.audit.version
    ]);

    db.websites.set(website.id, website);
    return website;
  }

  public async deleteSoft(organizationId: string, id: string, deletedBy: string): Promise<boolean> {
    enforceTenantContext(organizationId);
    const sql = `UPDATE websites SET deleted_at = NOW(), updated_by = $1 WHERE id = $2 AND organization_id = $3;`;
    await this.pg.query(sql, [deletedBy, id, organizationId]);

    const item = db.websites.get(id);
    if (!item || item.organizationId !== organizationId) return false;
    item.audit.deletedAt = new Date().toISOString();
    item.audit.updatedBy = deletedBy;
    item.audit.updatedAt = new Date().toISOString();
    return true;
  }
}

export class PageRepository implements IPageRepository {
  private pg: PostgresClient;
  constructor(pg?: PostgresClient) {
    this.pg = pg || PostgresClient.getInstance();
  }

  public async findById(organizationId: string, id: string): Promise<Page | null> {
    enforceTenantContext(organizationId);
    const sql = `SELECT * FROM pages WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL LIMIT 1;`;
    await this.pg.query(sql, [id, organizationId]);

    const item = db.pages.get(id);
    if (!item || item.organizationId !== organizationId || item.audit.deletedAt) return null;
    return item;
  }

  public async findByWebsiteId(organizationId: string, websiteId: string, params?: QueryParams): Promise<PaginatedResult<Page>> {
    enforceTenantContext(organizationId);
    const sql = `SELECT * FROM pages WHERE website_id = $1 AND organization_id = $2 AND deleted_at IS NULL;`;
    await this.pg.query(sql, [websiteId, organizationId]);

    const list = Array.from(db.pages.values()).filter(
      p => p.websiteId === websiteId && p.organizationId === organizationId && (params?.includeDeleted || !p.audit.deletedAt)
    );
    return paginateArray(list, params);
  }

  public async findByNormalizedUrl(organizationId: string, websiteId: string, normalizedUrl: string): Promise<Page | null> {
    enforceTenantContext(organizationId);
    const sql = `SELECT * FROM pages WHERE website_id = $1 AND normalized_url = $2 AND organization_id = $3 AND deleted_at IS NULL LIMIT 1;`;
    await this.pg.query(sql, [websiteId, normalizedUrl, organizationId]);

    for (const item of db.pages.values()) {
      if (item.websiteId === websiteId && item.normalizedUrl === normalizedUrl && item.organizationId === organizationId && !item.audit.deletedAt) {
        return item;
      }
    }
    return null;
  }

  public async save(page: Page): Promise<Page> {
    enforceTenantContext(page.organizationId);
    const sql = `
      INSERT INTO pages (id, organization_id, website_id, url, normalized_url, path, status_code, indexability, title, description, created_at, updated_at, created_by, updated_by, version)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (website_id, normalized_url) DO UPDATE SET
        url = EXCLUDED.url,
        path = EXCLUDED.path,
        status_code = EXCLUDED.status_code,
        indexability = EXCLUDED.indexability,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        updated_at = EXCLUDED.updated_at,
        updated_by = EXCLUDED.updated_by,
        version = pages.version + 1;
    `;
    await this.pg.query(sql, [
      page.id,
      page.organizationId,
      page.websiteId,
      page.url,
      page.normalizedUrl,
      page.path,
      page.statusCode || null,
      page.indexability,
      page.title || null,
      page.description || null,
      page.audit.createdAt,
      page.audit.updatedAt,
      page.audit.createdBy,
      page.audit.updatedBy,
      page.audit.version
    ]);

    db.pages.set(page.id, page);
    return page;
  }

  public async deleteSoft(organizationId: string, id: string, deletedBy: string): Promise<boolean> {
    enforceTenantContext(organizationId);
    const sql = `UPDATE pages SET deleted_at = NOW(), updated_by = $1 WHERE id = $2 AND organization_id = $3;`;
    await this.pg.query(sql, [deletedBy, id, organizationId]);

    const item = db.pages.get(id);
    if (!item || item.organizationId !== organizationId) return false;
    item.audit.deletedAt = new Date().toISOString();
    item.audit.updatedBy = deletedBy;
    item.audit.updatedAt = new Date().toISOString();
    return true;
  }

  // Many-to-many associations
  public async linkKeyword(organizationId: string, pageId: string, keywordId: string): Promise<void> {
    enforceTenantContext(organizationId);
    const sql = `INSERT INTO pages_keywords (organization_id, page_id, keyword_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING;`;
    await this.pg.query(sql, [organizationId, pageId, keywordId]);

    const exists = db.pagesKeywords.some(link => link.pageId === pageId && link.keywordId === keywordId);
    if (!exists) {
      db.pagesKeywords.push({ organizationId, pageId, keywordId });
    }
  }

  public async linkTopic(organizationId: string, pageId: string, topicId: string): Promise<void> {
    enforceTenantContext(organizationId);
    const sql = `INSERT INTO pages_topics (organization_id, page_id, topic_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING;`;
    await this.pg.query(sql, [organizationId, pageId, topicId]);

    const exists = db.pagesTopics.some(link => link.pageId === pageId && link.topicId === topicId);
    if (!exists) {
      db.pagesTopics.push({ organizationId, pageId, topicId });
    }
  }

  public async linkEntity(organizationId: string, pageId: string, entityId: string): Promise<void> {
    enforceTenantContext(organizationId);
    const sql = `INSERT INTO pages_entities (organization_id, page_id, entity_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING;`;
    await this.pg.query(sql, [organizationId, pageId, entityId]);

    const exists = db.pagesEntities.some(link => link.pageId === pageId && link.entityId === entityId);
    if (!exists) {
      db.pagesEntities.push({ organizationId, pageId, entityId });
    }
  }

  public async getLinkedKeywords(organizationId: string, pageId: string): Promise<Keyword[]> {
    enforceTenantContext(organizationId);
    const sql = `
      SELECT k.* FROM keywords k
      INNER JOIN pages_keywords pk ON k.id = pk.keyword_id
      WHERE pk.page_id = $1 AND pk.organization_id = $2 AND k.deleted_at IS NULL;
    `;
    await this.pg.query(sql, [pageId, organizationId]);

    const keywordIds = db.pagesKeywords.filter(link => link.pageId === pageId && link.organizationId === organizationId).map(link => link.keywordId);
    return Array.from(db.keywords.values()).filter(k => keywordIds.includes(k.id) && k.organizationId === organizationId && !k.audit.deletedAt);
  }

  public async getLinkedTopics(organizationId: string, pageId: string): Promise<Topic[]> {
    enforceTenantContext(organizationId);
    const sql = `
      SELECT t.* FROM topics t
      INNER JOIN pages_topics pt ON t.id = pt.topic_id
      WHERE pt.page_id = $1 AND pt.organization_id = $2 AND t.deleted_at IS NULL;
    `;
    await this.pg.query(sql, [pageId, organizationId]);

    const topicIds = db.pagesTopics.filter(link => link.pageId === pageId && link.organizationId === organizationId).map(link => link.topicId);
    return Array.from(db.topics.values()).filter(t => topicIds.includes(t.id) && t.organizationId === organizationId && !t.audit.deletedAt);
  }

  public async getLinkedEntities(organizationId: string, pageId: string): Promise<Entity[]> {
    enforceTenantContext(organizationId);
    const sql = `
      SELECT e.* FROM entities e
      INNER JOIN pages_entities pe ON e.id = pe.entity_id
      WHERE pe.page_id = $1 AND pe.organization_id = $2 AND e.deleted_at IS NULL;
    `;
    await this.pg.query(sql, [pageId, organizationId]);

    const entityIds = db.pagesEntities.filter(link => link.pageId === pageId && link.organizationId === organizationId).map(link => link.entityId);
    return Array.from(db.entities.values()).filter(e => entityIds.includes(e.id) && e.organizationId === organizationId && !e.audit.deletedAt);
  }
}

export class KeywordRepository implements IKeywordRepository {
  private pg: PostgresClient;
  constructor(pg?: PostgresClient) {
    this.pg = pg || PostgresClient.getInstance();
  }

  public async findById(organizationId: string, id: string): Promise<Keyword | null> {
    enforceTenantContext(organizationId);
    const sql = `SELECT * FROM keywords WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL LIMIT 1;`;
    await this.pg.query(sql, [id, organizationId]);

    const item = db.keywords.get(id);
    if (!item || item.organizationId !== organizationId || item.audit.deletedAt) return null;
    return item;
  }

  public async findByName(organizationId: string, name: string): Promise<Keyword | null> {
    enforceTenantContext(organizationId);
    const sql = `SELECT * FROM keywords WHERE name = $1 AND organization_id = $2 AND deleted_at IS NULL LIMIT 1;`;
    await this.pg.query(sql, [name, organizationId]);

    for (const item of db.keywords.values()) {
      if (item.name === name && item.organizationId === organizationId && !item.audit.deletedAt) {
        return item;
      }
    }
    return null;
  }

  public async save(keyword: Keyword): Promise<Keyword> {
    enforceTenantContext(keyword.organizationId);
    const sql = `
      INSERT INTO keywords (id, organization_id, name, display_name, language, intent, created_at, updated_at, created_by, updated_by, version)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (organization_id, name) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        intent = EXCLUDED.intent,
        updated_at = EXCLUDED.updated_at,
        updated_by = EXCLUDED.updated_by,
        version = keywords.version + 1;
    `;
    await this.pg.query(sql, [
      keyword.id,
      keyword.organizationId,
      keyword.name,
      keyword.displayName,
      keyword.language,
      keyword.intent || null,
      keyword.audit.createdAt,
      keyword.audit.updatedAt,
      keyword.audit.createdBy,
      keyword.audit.updatedBy,
      keyword.audit.version
    ]);

    db.keywords.set(keyword.id, keyword);
    return keyword;
  }

  public async deleteSoft(organizationId: string, id: string, deletedBy: string): Promise<boolean> {
    enforceTenantContext(organizationId);
    const sql = `UPDATE keywords SET deleted_at = NOW(), updated_by = $1 WHERE id = $2 AND organization_id = $3;`;
    await this.pg.query(sql, [deletedBy, id, organizationId]);

    const item = db.keywords.get(id);
    if (!item || item.organizationId !== organizationId) return false;
    item.audit.deletedAt = new Date().toISOString();
    item.audit.updatedBy = deletedBy;
    item.audit.updatedAt = new Date().toISOString();
    return true;
  }

  public async linkTopic(organizationId: string, keywordId: string, topicId: string): Promise<void> {
    enforceTenantContext(organizationId);
    const sql = `INSERT INTO keywords_topics (organization_id, keyword_id, topic_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING;`;
    await this.pg.query(sql, [organizationId, keywordId, topicId]);

    const exists = db.keywordsTopics.some(link => link.keywordId === keywordId && link.topicId === topicId);
    if (!exists) {
      db.keywordsTopics.push({ organizationId, keywordId, topicId });
    }
  }

  public async getLinkedTopics(organizationId: string, keywordId: string): Promise<Topic[]> {
    enforceTenantContext(organizationId);
    const sql = `
      SELECT t.* FROM topics t
      INNER JOIN keywords_topics kt ON t.id = kt.topic_id
      WHERE kt.keyword_id = $1 AND kt.organization_id = $2 AND t.deleted_at IS NULL;
    `;
    await this.pg.query(sql, [keywordId, organizationId]);

    const topicIds = db.keywordsTopics.filter(link => link.keywordId === keywordId && link.organizationId === organizationId).map(link => link.topicId);
    return Array.from(db.topics.values()).filter(t => topicIds.includes(t.id) && t.organizationId === organizationId && !t.audit.deletedAt);
  }
}

export class TopicRepository implements ITopicRepository {
  private pg: PostgresClient;
  constructor(pg?: PostgresClient) {
    this.pg = pg || PostgresClient.getInstance();
  }

  public async findById(organizationId: string, id: string): Promise<Topic | null> {
    enforceTenantContext(organizationId);
    const sql = `SELECT * FROM topics WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL LIMIT 1;`;
    await this.pg.query(sql, [id, organizationId]);

    const item = db.topics.get(id);
    if (!item || item.organizationId !== organizationId || item.audit.deletedAt) return null;
    return item;
  }

  public async findByName(organizationId: string, name: string): Promise<Topic | null> {
    enforceTenantContext(organizationId);
    const sql = `SELECT * FROM topics WHERE name = $1 AND organization_id = $2 AND deleted_at IS NULL LIMIT 1;`;
    await this.pg.query(sql, [name, organizationId]);

    for (const item of db.topics.values()) {
      if (item.name === name && item.organizationId === organizationId && !item.audit.deletedAt) {
        return item;
      }
    }
    return null;
  }

  public async save(topic: Topic): Promise<Topic> {
    enforceTenantContext(topic.organizationId);
    const sql = `
      INSERT INTO topics (id, organization_id, name, description, language, parent_topic_id, created_at, updated_at, created_by, updated_by, version)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (organization_id, name) DO UPDATE SET
        description = EXCLUDED.description,
        parent_topic_id = EXCLUDED.parent_topic_id,
        updated_at = EXCLUDED.updated_at,
        updated_by = EXCLUDED.updated_by,
        version = topics.version + 1;
    `;
    await this.pg.query(sql, [
      topic.id,
      topic.organizationId,
      topic.name,
      topic.description || null,
      topic.language,
      topic.parentTopicId || null,
      topic.audit.createdAt,
      topic.audit.updatedAt,
      topic.audit.createdBy,
      topic.audit.updatedBy,
      topic.audit.version
    ]);

    db.topics.set(topic.id, topic);
    return topic;
  }

  public async deleteSoft(organizationId: string, id: string, deletedBy: string): Promise<boolean> {
    enforceTenantContext(organizationId);
    const sql = `UPDATE topics SET deleted_at = NOW(), updated_by = $1 WHERE id = $2 AND organization_id = $3;`;
    await this.pg.query(sql, [deletedBy, id, organizationId]);

    const item = db.topics.get(id);
    if (!item || item.organizationId !== organizationId) return false;
    item.audit.deletedAt = new Date().toISOString();
    item.audit.updatedBy = deletedBy;
    item.audit.updatedAt = new Date().toISOString();
    return true;
  }

  public async linkEntity(organizationId: string, topicId: string, entityId: string): Promise<void> {
    enforceTenantContext(organizationId);
    const sql = `INSERT INTO topics_entities (organization_id, topic_id, entity_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING;`;
    await this.pg.query(sql, [organizationId, topicId, entityId]);

    const exists = db.topicsEntities.some(link => link.topicId === topicId && link.entityId === entityId);
    if (!exists) {
      db.topicsEntities.push({ organizationId, topicId, entityId });
    }
  }

  public async getLinkedEntities(organizationId: string, topicId: string): Promise<Entity[]> {
    enforceTenantContext(organizationId);
    const sql = `
      SELECT e.* FROM entities e
      INNER JOIN topics_entities te ON e.id = te.entity_id
      WHERE te.topic_id = $1 AND te.organization_id = $2 AND e.deleted_at IS NULL;
    `;
    await this.pg.query(sql, [topicId, organizationId]);

    const entityIds = db.topicsEntities.filter(link => link.topicId === topicId && link.organizationId === organizationId).map(link => link.entityId);
    return Array.from(db.entities.values()).filter(e => entityIds.includes(e.id) && e.organizationId === organizationId && !e.audit.deletedAt);
  }
}

export class CompetitorRepository implements ICompetitorRepository {
  private pg: PostgresClient;
  constructor(pg?: PostgresClient) {
    this.pg = pg || PostgresClient.getInstance();
  }

  private mapRowToCompetitor(row: any): Competitor {
    return {
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      domain: row.domain,
      status: row.status as any,
      brandName: row.brand_name || undefined,
      classification: row.classification as any,
      discoverySource: row.discovery_source || undefined,
      discoveryEvidence: typeof row.discovery_evidence === "string" ? JSON.parse(row.discovery_evidence) : (row.discovery_evidence || undefined),
      confidence: row.confidence !== null && row.confidence !== undefined ? Number(row.confidence) : undefined,
      firstDiscoveredAt: row.first_discovered_at,
      lastObservedAt: row.last_observed_at,
      lastMonitoredAt: row.last_monitored_at || undefined,
      monitoringStatus: row.monitoring_status,
      notesMetadata: typeof row.notes_metadata === "string" ? JSON.parse(row.notes_metadata) : (row.notes_metadata || undefined),
      audit: {
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by,
        updatedBy: row.updated_by,
        deletedAt: row.deleted_at || undefined,
        version: row.version
      }
    };
  }

  private mapRowToCompetitorChange(row: any): CompetitorChange {
    return {
      id: row.id,
      organizationId: row.organization_id,
      competitorId: row.competitor_id,
      changedField: row.changed_field,
      previousValue: row.previous_value,
      newValue: row.new_value,
      changeType: row.change_type,
      observedAt: row.observed_at,
      createdAt: row.created_at
    };
  }

  public async findById(organizationId: string, id: string): Promise<Competitor | null> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM competitors WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL LIMIT 1;`;
      const res = await this.pg.query(sql, [id, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        return this.mapRowToCompetitor(res.rows[0]);
      }
    } catch (err) {
      console.warn("[CompetitorRepository.findById Error]: fallback to memory", err);
    }

    const item = db.competitors.get(id);
    if (!item || item.organizationId !== organizationId || item.audit.deletedAt) return null;
    return item;
  }

  public async findByOrganizationId(organizationId: string, params?: QueryParams): Promise<PaginatedResult<Competitor>> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM competitors WHERE organization_id = $1 AND deleted_at IS NULL;`;
      const res = await this.pg.query(sql, [organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        const mapped = res.rows.map(row => this.mapRowToCompetitor(row));
        return paginateArray(mapped, params);
      }
    } catch (err) {
      console.warn("[CompetitorRepository.findByOrganizationId Error]: fallback to memory", err);
    }

    const list = Array.from(db.competitors.values()).filter(
      c => c.organizationId === organizationId && (params?.includeDeleted || !c.audit.deletedAt)
    );
    return paginateArray(list, params);
  }

  public async findByDomain(organizationId: string, domain: string): Promise<Competitor | null> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM competitors WHERE LOWER(domain) = LOWER($1) AND organization_id = $2 AND deleted_at IS NULL LIMIT 1;`;
      const res = await this.pg.query(sql, [domain, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        return this.mapRowToCompetitor(res.rows[0]);
      }
    } catch (err) {
      console.warn("[CompetitorRepository.findByDomain Error]: fallback to memory", err);
    }

    for (const item of db.competitors.values()) {
      if (item.domain.toLowerCase() === domain.toLowerCase() && item.organizationId === organizationId && !item.audit.deletedAt) {
        return item;
      }
    }
    return null;
  }

  public async save(competitor: Competitor): Promise<Competitor> {
    enforceTenantContext(competitor.organizationId);
    try {
      const sql = `
        INSERT INTO competitors (
          id, organization_id, name, domain, status, brand_name, classification,
          discovery_source, discovery_evidence, confidence, first_discovered_at,
          last_observed_at, last_monitored_at, monitoring_status, notes_metadata,
          created_at, updated_at, created_by, updated_by, version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        ON CONFLICT (organization_id, domain) DO UPDATE SET
          name = EXCLUDED.name,
          status = EXCLUDED.status,
          brand_name = EXCLUDED.brand_name,
          classification = EXCLUDED.classification,
          discovery_source = EXCLUDED.discovery_source,
          discovery_evidence = EXCLUDED.discovery_evidence,
          confidence = EXCLUDED.confidence,
          last_observed_at = EXCLUDED.last_observed_at,
          last_monitored_at = EXCLUDED.last_monitored_at,
          monitoring_status = EXCLUDED.monitoring_status,
          notes_metadata = EXCLUDED.notes_metadata,
          updated_at = EXCLUDED.updated_at,
          updated_by = EXCLUDED.updated_by,
          version = competitors.version + 1;
      `;
      await this.pg.query(sql, [
        competitor.id,
        competitor.organizationId,
        competitor.name,
        competitor.domain,
        competitor.status,
        competitor.brandName || null,
        competitor.classification,
        competitor.discoverySource || null,
        competitor.discoveryEvidence ? JSON.stringify(competitor.discoveryEvidence) : null,
        competitor.confidence !== undefined ? competitor.confidence : null,
        competitor.firstDiscoveredAt || new Date().toISOString(),
        competitor.lastObservedAt || new Date().toISOString(),
        competitor.lastMonitoredAt || null,
        competitor.monitoringStatus,
        competitor.notesMetadata ? JSON.stringify(competitor.notesMetadata) : null,
        competitor.audit.createdAt,
        competitor.audit.updatedAt,
        competitor.audit.createdBy,
        competitor.audit.updatedBy,
        competitor.audit.version
      ]);
    } catch (err) {
      console.warn("[CompetitorRepository.save Error]: fallback to memory", err);
    }

    db.competitors.set(competitor.id, competitor);
    return competitor;
  }

  public async deleteSoft(organizationId: string, id: string, deletedBy: string): Promise<boolean> {
    enforceTenantContext(organizationId);
    try {
      const sql = `UPDATE competitors SET deleted_at = NOW(), updated_by = $1 WHERE id = $2 AND organization_id = $3;`;
      await this.pg.query(sql, [deletedBy, id, organizationId]);
    } catch (err) {
      console.warn("[CompetitorRepository.deleteSoft Error]: fallback to memory", err);
    }

    const item = db.competitors.get(id);
    if (!item || item.organizationId !== organizationId) return false;
    item.audit.deletedAt = new Date().toISOString();
    item.audit.updatedBy = deletedBy;
    item.audit.updatedAt = new Date().toISOString();
    return true;
  }

  public async saveChange(change: CompetitorChange): Promise<CompetitorChange> {
    enforceTenantContext(change.organizationId);
    try {
      const sql = `
        INSERT INTO competitor_changes (
          id, organization_id, competitor_id, changed_field, previous_value, new_value, change_type, observed_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
      `;
      await this.pg.query(sql, [
        change.id,
        change.organizationId,
        change.competitorId,
        change.changedField,
        change.previousValue,
        change.newValue,
        change.changeType,
        change.observedAt,
        change.createdAt
      ]);
    } catch (err) {
      console.warn("[CompetitorRepository.saveChange Error]: fallback to memory", err);
    }

    db.competitorChanges.set(change.id, change);
    return change;
  }

  public async findChangesByCompetitorId(organizationId: string, competitorId: string): Promise<CompetitorChange[]> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM competitor_changes WHERE competitor_id = $1 AND organization_id = $2 ORDER BY observed_at DESC;`;
      const res = await this.pg.query(sql, [competitorId, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        return res.rows.map(row => this.mapRowToCompetitorChange(row));
      }
    } catch (err) {
      console.warn("[CompetitorRepository.findChangesByCompetitorId Error]: fallback to memory", err);
    }

    return Array.from(db.competitorChanges.values())
      .filter(c => c.competitorId === competitorId && c.organizationId === organizationId)
      .sort((a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime());
  }
}

export class CompetitiveSeoFindingRepository implements ICompetitiveSeoFindingRepository {
  private pg: PostgresClient;
  constructor(pg?: PostgresClient) {
    this.pg = pg || PostgresClient.getInstance();
  }

  private mapRowToFinding(row: any): CompetitiveSeoFinding {
    return {
      id: row.id,
      organizationId: row.organization_id,
      competitorId: row.competitor_id,
      findingType: row.finding_type as any,
      comparisonScope: row.comparison_scope,
      competitivePosition: row.competitive_position as any,
      tenantValue: row.tenant_value || undefined,
      competitorValue: row.competitor_value || undefined,
      difference: row.difference !== null && row.difference !== undefined ? Number(row.difference) : undefined,
      differenceDirection: row.difference_direction as any,
      severity: row.severity as any,
      evidence: typeof row.evidence === "string" ? JSON.parse(row.evidence) : (row.evidence || {}),
      sourceReference: row.source_reference || undefined,
      calculationMetadata: typeof row.calculation_metadata === "string" ? JSON.parse(row.calculation_metadata) : (row.calculation_metadata || {}),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      version: row.version
    };
  }

  public async findById(organizationId: string, id: string): Promise<CompetitiveSeoFinding | null> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM competitive_seo_findings WHERE id = $1 AND organization_id = $2 LIMIT 1;`;
      const res = await this.pg.query(sql, [id, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        return this.mapRowToFinding(res.rows[0]);
      }
    } catch (err) {
      console.warn("[CompetitiveSeoFindingRepository.findById Error]: fallback to memory", err);
    }

    const item = db.competitiveSeoFindings.get(id);
    if (!item || item.organizationId !== organizationId) return null;
    return item;
  }

  public async findByCompetitorId(organizationId: string, competitorId: string): Promise<CompetitiveSeoFinding[]> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM competitive_seo_findings WHERE competitor_id = $1 AND organization_id = $2 ORDER BY created_at DESC;`;
      const res = await this.pg.query(sql, [competitorId, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        return res.rows.map(row => this.mapRowToFinding(row));
      }
    } catch (err) {
      console.warn("[CompetitiveSeoFindingRepository.findByCompetitorId Error]: fallback to memory", err);
    }

    return Array.from(db.competitiveSeoFindings.values())
      .filter(f => f.competitorId === competitorId && f.organizationId === organizationId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async findByOrganizationId(organizationId: string, params?: QueryParams): Promise<PaginatedResult<CompetitiveSeoFinding>> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM competitive_seo_findings WHERE organization_id = $1 ORDER BY created_at DESC;`;
      const res = await this.pg.query(sql, [organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        const mapped = res.rows.map(row => this.mapRowToFinding(row));
        return paginateArray(mapped, params);
      }
    } catch (err) {
      console.warn("[CompetitiveSeoFindingRepository.findByOrganizationId Error]: fallback to memory", err);
    }

    const list = Array.from(db.competitiveSeoFindings.values()).filter(
      f => f.organizationId === organizationId
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return paginateArray(list, params);
  }

  public async save(finding: CompetitiveSeoFinding): Promise<CompetitiveSeoFinding> {
    enforceTenantContext(finding.organizationId);
    try {
      const sql = `
        INSERT INTO competitive_seo_findings (
          id, organization_id, competitor_id, finding_type, comparison_scope, competitive_position,
          tenant_value, competitor_value, difference, difference_direction, severity,
          evidence, source_reference, calculation_metadata, created_at, updated_at, version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (id) DO UPDATE SET
          finding_type = EXCLUDED.finding_type,
          comparison_scope = EXCLUDED.comparison_scope,
          competitive_position = EXCLUDED.competitive_position,
          tenant_value = EXCLUDED.tenant_value,
          competitor_value = EXCLUDED.competitor_value,
          difference = EXCLUDED.difference,
          difference_direction = EXCLUDED.difference_direction,
          severity = EXCLUDED.severity,
          evidence = EXCLUDED.evidence,
          source_reference = EXCLUDED.source_reference,
          calculation_metadata = EXCLUDED.calculation_metadata,
          updated_at = EXCLUDED.updated_at,
          version = competitive_seo_findings.version + 1;
      `;
      await this.pg.query(sql, [
        finding.id,
        finding.organizationId,
        finding.competitorId,
        finding.findingType,
        finding.comparisonScope,
        finding.competitivePosition,
        finding.tenantValue || null,
        finding.competitorValue || null,
        finding.difference !== undefined ? finding.difference : null,
        finding.differenceDirection,
        finding.severity,
        JSON.stringify(finding.evidence),
        finding.sourceReference || null,
        JSON.stringify(finding.calculationMetadata),
        finding.createdAt,
        finding.updatedAt,
        finding.version
      ]);
    } catch (err) {
      console.warn("[CompetitiveSeoFindingRepository.save Error]: fallback to memory", err);
    }

    db.competitiveSeoFindings.set(finding.id, finding);
    return finding;
  }

  public async deleteSoft(organizationId: string, id: string): Promise<boolean> {
    enforceTenantContext(organizationId);
    try {
      const sql = `DELETE FROM competitive_seo_findings WHERE id = $1 AND organization_id = $2;`;
      const res = await this.pg.query(sql, [id, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        db.competitiveSeoFindings.delete(id);
        return true;
      }
    } catch (err) {
      console.warn("[CompetitiveSeoFindingRepository.deleteSoft Error]: fallback to memory", err);
    }

    if (db.competitiveSeoFindings.has(id)) {
      const item = db.competitiveSeoFindings.get(id);
      if (item && item.organizationId === organizationId) {
        db.competitiveSeoFindings.delete(id);
        return true;
      }
    }
    return false;
  }
}

export class HistoricalMetricRepository implements IHistoricalMetricRepository {
  private pg: PostgresClient;
  constructor(pg?: PostgresClient) {
    this.pg = pg || PostgresClient.getInstance();
  }

  public async save(metric: HistoricalMetric): Promise<HistoricalMetric> {
    enforceTenantContext(metric.organizationId);
    const sql = `
      INSERT INTO historical_metrics (id, organization_id, target_type, target_id, metric_name, metric_value, dimensions, timestamp, created_at, created_by, version)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);
    `;
    await this.pg.query(sql, [
      metric.id,
      metric.organizationId,
      metric.targetType,
      metric.targetId,
      metric.metricName,
      metric.metricValue,
      JSON.stringify(metric.dimensions),
      metric.timestamp,
      metric.audit.createdAt,
      metric.audit.createdBy,
      metric.audit.version
    ]);

    db.historicalMetrics.set(metric.id, metric);
    return metric;
  }

  public async findMetrics(
    organizationId: string,
    targetType: string,
    targetId: string,
    metricName?: string,
    startTime?: Date | string,
    endTime?: Date | string
  ): Promise<HistoricalMetric[]> {
    enforceTenantContext(organizationId);
    let sql = `SELECT * FROM historical_metrics WHERE organization_id = $1 AND target_type = $2 AND target_id = $3`;
    const params: unknown[] = [organizationId, targetType, targetId];

    if (metricName) {
      params.push(metricName);
      sql += ` AND metric_name = $${params.length}`;
    }
    if (startTime) {
      params.push(startTime);
      sql += ` AND timestamp >= $${params.length}`;
    }
    if (endTime) {
      params.push(endTime);
      sql += ` AND timestamp <= $${params.length}`;
    }

    sql += ` ORDER BY timestamp DESC;`;
    await this.pg.query(sql, params);

    return Array.from(db.historicalMetrics.values()).filter(m => {
      if (m.organizationId !== organizationId) return false;
      if (m.targetType !== targetType) return false;
      if (m.targetId !== targetId) return false;
      if (metricName && m.metricName !== metricName) return false;
      if (startTime && new Date(m.timestamp) < new Date(startTime)) return false;
      if (endTime && new Date(m.timestamp) > new Date(endTime)) return false;
      return true;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}

export class PostgresDiagnosticFindingRepository implements IDiagnosticFindingRepository {
  private pg: PostgresClient;
  constructor(pg?: PostgresClient) {
    this.pg = pg || PostgresClient.getInstance();
  }

  public async findById(organizationId: string, id: string): Promise<DiagnosticFinding | null> {
    enforceTenantContext(organizationId);
    const sql = `SELECT * FROM diagnostic_findings WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL LIMIT 1;`;
    await this.pg.query(sql, [id, organizationId]);

    const item = db.diagnosticFindings.get(id);
    if (!item || item.organizationId !== organizationId || item.audit.deletedAt) return null;
    return item;
  }

  public async findByWebsiteId(organizationId: string, websiteId: string, params?: QueryParams): Promise<PaginatedResult<DiagnosticFinding>> {
    enforceTenantContext(organizationId);
    const sql = `SELECT * FROM diagnostic_findings WHERE website_id = $1 AND organization_id = $2 AND deleted_at IS NULL;`;
    await this.pg.query(sql, [websiteId, organizationId]);

    const list = Array.from(db.diagnosticFindings.values()).filter(
      df => df.websiteId === websiteId && df.organizationId === organizationId && (params?.includeDeleted || !df.audit.deletedAt)
    );
    return paginateArray(list, params);
  }

  public async findByCodeAndResource(organizationId: string, websiteId: string, code: string, affectedResource: string): Promise<DiagnosticFinding | null> {
    enforceTenantContext(organizationId);
    const sql = `SELECT * FROM diagnostic_findings WHERE website_id = $1 AND code = $2 AND affected_resource = $3 AND organization_id = $4 AND deleted_at IS NULL LIMIT 1;`;
    await this.pg.query(sql, [websiteId, code, affectedResource, organizationId]);

    for (const item of db.diagnosticFindings.values()) {
      if (item.websiteId === websiteId && item.code === code && item.affectedResource === affectedResource && item.organizationId === organizationId && !item.audit.deletedAt) {
        return item;
      }
    }
    return null;
  }

  public async save(finding: DiagnosticFinding): Promise<DiagnosticFinding> {
    enforceTenantContext(finding.organizationId);
    const sql = `
      INSERT INTO diagnostic_findings (id, organization_id, website_id, category, code, title, explanation, severity, confidence, status, affected_resource, evidence, created_at, updated_at, created_by, updated_by, version)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (organization_id, website_id, code, affected_resource) DO UPDATE SET
        title = EXCLUDED.title,
        explanation = EXCLUDED.explanation,
        severity = EXCLUDED.severity,
        confidence = EXCLUDED.confidence,
        status = EXCLUDED.status,
        evidence = EXCLUDED.evidence,
        updated_at = EXCLUDED.updated_at,
        updated_by = EXCLUDED.updated_by,
        version = diagnostic_findings.version + 1;
    `;
    await this.pg.query(sql, [
      finding.id,
      finding.organizationId,
      finding.websiteId,
      finding.category,
      finding.code,
      finding.title,
      finding.explanation,
      finding.severity,
      finding.confidence,
      finding.status,
      finding.affectedResource,
      JSON.stringify(finding.evidence),
      finding.audit.createdAt,
      finding.audit.updatedAt,
      finding.audit.createdBy,
      finding.audit.updatedBy,
      finding.audit.version
    ]);

    // Emulate PostgreSQL UNIQUE ON CONFLICT constraint for in-memory database simulation
    for (const [key, existing] of db.diagnosticFindings.entries()) {
      if (
        existing.organizationId === finding.organizationId &&
        existing.websiteId === finding.websiteId &&
        existing.code === finding.code &&
        existing.affectedResource === finding.affectedResource
      ) {
        db.diagnosticFindings.delete(key);
      }
    }

    db.diagnosticFindings.set(finding.id, finding);
    return finding;
  }

  public async deleteSoft(organizationId: string, id: string, deletedBy: string): Promise<boolean> {
    enforceTenantContext(organizationId);
    const sql = `UPDATE diagnostic_findings SET deleted_at = NOW(), updated_by = $1 WHERE id = $2 AND organization_id = $3;`;
    await this.pg.query(sql, [deletedBy, id, organizationId]);

    const item = db.diagnosticFindings.get(id);
    if (!item || item.organizationId !== organizationId) return false;
    item.audit.deletedAt = new Date().toISOString();
    item.audit.updatedBy = deletedBy;
    item.audit.updatedAt = new Date().toISOString();
    return true;
  }

  public async linkFindings(organizationId: string, sourceId: string, targetId: string, type: FindingRelationshipType): Promise<void> {
    enforceTenantContext(organizationId);
    const sql = `
      INSERT INTO diagnostic_finding_relationships (organization_id, source_finding_id, target_finding_id, relationship_type, created_at, updated_at, created_by, updated_by, version)
      VALUES ($1, $2, $3, $4, NOW(), NOW(), 'system', 'system', 1)
      ON CONFLICT DO NOTHING;
    `;
    await this.pg.query(sql, [organizationId, sourceId, targetId, type]);

    const exists = db.diagnosticFindingRelationships.some(
      r => r.sourceFindingId === sourceId && r.targetFindingId === targetId && r.relationshipType === type
    );
    if (!exists) {
      db.diagnosticFindingRelationships.push({
        organizationId,
        sourceFindingId: sourceId,
        targetFindingId: targetId,
        relationshipType: type,
        audit: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: "system",
          updatedBy: "system",
          version: 1
        }
      });
    }
  }

  public async getLinkedFindings(organizationId: string, findingId: string): Promise<DiagnosticFindingRelationship[]> {
    enforceTenantContext(organizationId);
    const sql = `
      SELECT * FROM diagnostic_finding_relationships
      WHERE (source_finding_id = $1 OR target_finding_id = $1) AND organization_id = $2 AND deleted_at IS NULL;
    `;
    await this.pg.query(sql, [findingId, organizationId]);

    return db.diagnosticFindingRelationships.filter(
      r => (r.sourceFindingId === findingId || r.targetFindingId === findingId) && r.organizationId === organizationId && !r.audit.deletedAt
    );
  }
}

export class EntityRepository implements IEntityRepository {
  private pg: PostgresClient;

  constructor(pg?: PostgresClient) {
    this.pg = pg || PostgresClient.getInstance();
  }

  private mapRowToEntity(row: any): Entity {
    return {
      id: row.id,
      organizationId: row.organization_id,
      brandId: row.brand_id,
      name: row.name,
      type: row.type,
      wikidataId: row.wikidata_id || undefined,
      wikipediaUrl: row.wikipedia_url || undefined,
      aliases: row.aliases || undefined,
      description: row.description || undefined,
      provenance: typeof row.provenance === "string" ? JSON.parse(row.provenance) : (row.provenance || undefined),
      authorityScore: row.authority_score !== null && row.authority_score !== undefined ? Number(row.authority_score) : undefined,
      completenessScore: row.completeness_score !== null && row.completeness_score !== undefined ? Number(row.completeness_score) : undefined,
      status: row.status || undefined,
      confidence: {
        score: Number(row.confidence_score),
        rating: row.confidence_rating as "high" | "medium" | "low"
      },
      audit: {
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by,
        updatedBy: row.updated_by,
        deletedAt: row.deleted_at || undefined,
        version: row.version
      }
    };
  }

  private mapRowToRelationship(row: any): EntityRelationship {
    return {
      organizationId: row.organization_id,
      sourceEntityId: row.source_entity_id,
      targetEntityId: row.target_entity_id,
      relationshipType: row.relationship_type as RelationshipType,
      direction: row.direction || undefined,
      provenance: typeof row.provenance === "string" ? JSON.parse(row.provenance) : (row.provenance || undefined),
      metadata: typeof row.metadata === "string" ? JSON.parse(row.metadata) : (row.metadata || undefined),
      confidence: {
        score: Number(row.confidence_score),
        rating: row.confidence_rating as "high" | "medium" | "low"
      },
      audit: {
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by,
        updatedBy: row.updated_by,
        deletedAt: row.deleted_at || undefined,
        version: row.version
      }
    };
  }

  public async findById(organizationId: string, id: string): Promise<Entity | null> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM entities WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL LIMIT 1;`;
      const res = await this.pg.query(sql, [id, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        return this.mapRowToEntity(res.rows[0]);
      }
    } catch (err) {
      console.warn("[EntityRepository.findById] falling back to memory store.", err);
    }

    const entity = db.entities.get(id);
    if (!entity || entity.organizationId !== organizationId || entity.audit.deletedAt) {
      return null;
    }
    return entity;
  }

  public async findByName(organizationId: string, name: string): Promise<Entity | null> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM entities WHERE LOWER(name) = LOWER($1) AND organization_id = $2 AND deleted_at IS NULL LIMIT 1;`;
      const res = await this.pg.query(sql, [name.trim(), organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        return this.mapRowToEntity(res.rows[0]);
      }
    } catch (err) {
      console.warn("[EntityRepository.findByName] falling back to memory store.", err);
    }

    for (const entity of db.entities.values()) {
      if (
        entity.name.toLowerCase().trim() === name.trim().toLowerCase() &&
        entity.organizationId === organizationId &&
        !entity.audit.deletedAt
      ) {
        return entity;
      }
    }
    return null;
  }

  public async findByBrandId(organizationId: string, brandId: string, params?: QueryParams): Promise<PaginatedResult<Entity>> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM entities WHERE brand_id = $1 AND organization_id = $2 AND deleted_at IS NULL ORDER BY created_at DESC;`;
      const res = await this.pg.query(sql, [brandId, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        const mapped = res.rows.map(row => this.mapRowToEntity(row));
        return paginateArray(mapped, params);
      }
    } catch (err) {
      console.warn("[EntityRepository.findByBrandId] falling back to memory store.", err);
    }

    const list = Array.from(db.entities.values()).filter(
      e => e.organizationId === organizationId && e.brandId === brandId && (params?.includeDeleted || !e.audit.deletedAt)
    );
    return paginateArray(list, params);
  }

  public async save(entity: Entity): Promise<Entity> {
    enforceTenantContext(entity.organizationId);
    try {
      const sql = `
        INSERT INTO entities (
          id, organization_id, brand_id, name, type, wikidata_id, wikipedia_url,
          aliases, description, provenance, authority_score, completeness_score, status,
          confidence_score, confidence_rating, created_at, updated_at, created_by, updated_by, version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          type = EXCLUDED.type,
          wikidata_id = EXCLUDED.wikidata_id,
          wikipedia_url = EXCLUDED.wikipedia_url,
          aliases = EXCLUDED.aliases,
          description = EXCLUDED.description,
          provenance = EXCLUDED.provenance,
          authority_score = EXCLUDED.authority_score,
          completeness_score = EXCLUDED.completeness_score,
          status = EXCLUDED.status,
          confidence_score = EXCLUDED.confidence_score,
          confidence_rating = EXCLUDED.confidence_rating,
          updated_at = EXCLUDED.updated_at,
          updated_by = EXCLUDED.updated_by,
          version = EXCLUDED.version;
      `;
      await this.pg.query(sql, [
        entity.id,
        entity.organizationId,
        entity.brandId,
        entity.name,
        entity.type,
        entity.wikidataId || null,
        entity.wikipediaUrl || null,
        entity.aliases || null,
        entity.description || null,
        entity.provenance ? JSON.stringify(entity.provenance) : null,
        entity.authorityScore !== undefined ? entity.authorityScore : 0.0,
        entity.completenessScore !== undefined ? entity.completenessScore : 0.0,
        entity.status || "active",
        entity.confidence.score,
        entity.confidence.rating,
        entity.audit.createdAt,
        entity.audit.updatedAt,
        entity.audit.createdBy,
        entity.audit.updatedBy,
        entity.audit.version
      ]);
    } catch (err) {
      console.warn("[EntityRepository.save] falling back to memory store.", err);
    }

    const existing = db.entities.get(entity.id);
    if (existing && existing.organizationId !== entity.organizationId) {
      throw new Error("Tenant Isolation Exception: Cannot modify or change tenant ownership for existing Entity.");
    }
    db.entities.set(entity.id, entity);
    return entity;
  }

  public async deleteSoft(organizationId: string, id: string, deletedBy: string): Promise<boolean> {
    enforceTenantContext(organizationId);
    try {
      const sql = `UPDATE entities SET deleted_at = NOW(), updated_by = $1, updated_at = NOW() WHERE id = $2 AND organization_id = $3;`;
      const res = await this.pg.query(sql, [deletedBy, id, organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        const item = db.entities.get(id);
        if (item) {
          item.audit.deletedAt = new Date().toISOString();
          item.audit.updatedBy = deletedBy;
          item.audit.updatedAt = new Date().toISOString();
        }
        return true;
      }
    } catch (err) {
      console.warn("[EntityRepository.deleteSoft] falling back to memory store.", err);
    }

    const entity = db.entities.get(id);
    if (!entity || entity.organizationId !== organizationId) return false;
    entity.audit.deletedAt = new Date().toISOString();
    entity.audit.updatedBy = deletedBy;
    entity.audit.updatedAt = new Date().toISOString();
    return true;
  }

  public async getRelationships(organizationId: string): Promise<EntityRelationship[]> {
    enforceTenantContext(organizationId);
    try {
      const sql = `SELECT * FROM entity_relationships WHERE organization_id = $1 AND deleted_at IS NULL;`;
      const res = await this.pg.query(sql, [organizationId]);
      if (res.rowCount && res.rowCount > 0) {
        return res.rows.map(row => this.mapRowToRelationship(row));
      }
    } catch (err) {
      console.warn("[EntityRepository.getRelationships] falling back to memory store.", err);
    }

    return db.relationships.filter(
      r => r.organizationId === organizationId && !r.audit.deletedAt
    );
  }

  public async saveRelationship(relationship: EntityRelationship): Promise<EntityRelationship> {
    enforceTenantContext(relationship.organizationId);
    try {
      const sql = `
        INSERT INTO entity_relationships (
          organization_id, source_entity_id, target_entity_id, relationship_type,
          direction, provenance, metadata, confidence_score, confidence_rating,
          created_at, updated_at, created_by, updated_by, version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (source_entity_id, target_entity_id, relationship_type) DO UPDATE SET
          direction = EXCLUDED.direction,
          provenance = EXCLUDED.provenance,
          metadata = EXCLUDED.metadata,
          confidence_score = EXCLUDED.confidence_score,
          confidence_rating = EXCLUDED.confidence_rating,
          updated_at = EXCLUDED.updated_at,
          updated_by = EXCLUDED.updated_by,
          version = EXCLUDED.version;
      `;
      await this.pg.query(sql, [
        relationship.organizationId,
        relationship.sourceEntityId,
        relationship.targetEntityId,
        relationship.relationshipType,
        relationship.direction || "directed",
        relationship.provenance ? JSON.stringify(relationship.provenance) : null,
        relationship.metadata ? JSON.stringify(relationship.metadata) : null,
        relationship.confidence.score,
        relationship.confidence.rating,
        relationship.audit.createdAt,
        relationship.audit.updatedAt,
        relationship.audit.createdBy,
        relationship.audit.updatedBy,
        relationship.audit.version
      ]);
    } catch (err) {
      console.warn("[EntityRepository.saveRelationship] falling back to memory store.", err);
    }

    const existing = db.relationships.find(
      r => r.sourceEntityId === relationship.sourceEntityId &&
           r.targetEntityId === relationship.targetEntityId &&
           r.relationshipType === relationship.relationshipType
    );
    if (existing && existing.organizationId !== relationship.organizationId) {
      throw new Error("Tenant Isolation Exception: Cannot modify or change tenant ownership for existing Relationship.");
    }
    db.relationships = db.relationships.filter(
      r => !(r.sourceEntityId === relationship.sourceEntityId &&
             r.targetEntityId === relationship.targetEntityId &&
             r.relationshipType === relationship.relationshipType)
    );
    db.relationships.push(relationship);
    return relationship;
  }

  public async deleteRelationship(organizationId: string, sourceId: string, targetId: string, type: RelationshipType): Promise<boolean> {
    enforceTenantContext(organizationId);
    try {
      const sql = `DELETE FROM entity_relationships WHERE organization_id = $1 AND source_entity_id = $2 AND target_entity_id = $3 AND relationship_type = $4;`;
      const res = await this.pg.query(sql, [organizationId, sourceId, targetId, type]);
      if (res.rowCount && res.rowCount > 0) {
        db.relationships = db.relationships.filter(
          r => !(r.organizationId === organizationId &&
                 r.sourceEntityId === sourceId &&
                 r.targetEntityId === targetId &&
                 r.relationshipType === type)
        );
        return true;
      }
    } catch (err) {
      console.warn("[EntityRepository.deleteRelationship] falling back to memory store.", err);
    }

    const origLength = db.relationships.length;
    db.relationships = db.relationships.filter(
      r => !(r.organizationId === organizationId &&
             r.sourceEntityId === sourceId &&
             r.targetEntityId === targetId &&
             r.relationshipType === type)
    );
    return db.relationships.length < origLength;
  }
}

export class AIEngineRepository implements IAIEngineRepository {
  public async findById(id: string): Promise<AIEngine | null> {
    const engine = db.engines.get(id);
    if (!engine || engine.audit.deletedAt) return null;
    return engine;
  }

  public async findAll(params?: QueryParams): Promise<PaginatedResult<AIEngine>> {
    const list = Array.from(db.engines.values()).filter(
      e => (params?.includeDeleted || !e.audit.deletedAt)
    );
    return paginateArray(list, params);
  }

  public async save(engine: AIEngine): Promise<AIEngine> {
    db.engines.set(engine.id, engine);
    return engine;
  }

  public async deleteSoft(id: string, deletedBy: string): Promise<boolean> {
    const engine = db.engines.get(id);
    if (!engine) return false;
    engine.audit.deletedAt = new Date().toISOString();
    engine.audit.updatedBy = deletedBy;
    engine.audit.updatedAt = new Date().toISOString();
    return true;
  }
}

export class PromptRepository implements IPromptRepository {
  public async findById(organizationId: string, id: string): Promise<Prompt | null> {
    enforceTenantContext(organizationId);
    const prompt = db.prompts.get(id);
    if (!prompt || prompt.organizationId !== organizationId || prompt.audit.deletedAt) {
      return null;
    }
    return prompt;
  }

  public async findByBrandId(organizationId: string, brandId: string, params?: QueryParams): Promise<PaginatedResult<Prompt>> {
    enforceTenantContext(organizationId);
    const list = Array.from(db.prompts.values()).filter(
      p => p.organizationId === organizationId && p.brandId === brandId && (params?.includeDeleted || !p.audit.deletedAt)
    );
    return paginateArray(list, params);
  }

  public async save(prompt: Prompt): Promise<Prompt> {
    enforceTenantContext(prompt.organizationId);
    const existing = db.prompts.get(prompt.id);
    if (existing && existing.organizationId !== prompt.organizationId) {
      throw new Error("Tenant Isolation Exception: Cannot modify or change tenant ownership for existing Prompt.");
    }
    db.prompts.set(prompt.id, prompt);
    return prompt;
  }

  public async deleteSoft(organizationId: string, id: string, deletedBy: string): Promise<boolean> {
    enforceTenantContext(organizationId);
    const prompt = db.prompts.get(id);
    if (!prompt || prompt.organizationId !== organizationId) return false;
    prompt.audit.deletedAt = new Date().toISOString();
    prompt.audit.updatedBy = deletedBy;
    prompt.audit.updatedAt = new Date().toISOString();
    return true;
  }
}

export class ObservationRepository implements IObservationRepository {
  public async findById(organizationId: string, id: string): Promise<AIObservation | null> {
    enforceTenantContext(organizationId);
    const obs = db.observations.get(id);
    if (!obs || obs.organizationId !== organizationId || obs.audit.deletedAt) {
      return null;
    }
    return obs;
  }

  public async findByPromptId(organizationId: string, promptId: string, params?: QueryParams): Promise<PaginatedResult<AIObservation>> {
    enforceTenantContext(organizationId);
    const list = Array.from(db.observations.values()).filter(
      o => o.organizationId === organizationId && o.promptId === promptId && (params?.includeDeleted || !o.audit.deletedAt)
    );
    return paginateArray(list, params);
  }

  public async findByEngineId(organizationId: string, engineId: string, params?: QueryParams): Promise<PaginatedResult<AIObservation>> {
    enforceTenantContext(organizationId);
    const list = Array.from(db.observations.values()).filter(
      o => o.organizationId === organizationId && o.engineId === engineId && (params?.includeDeleted || !o.audit.deletedAt)
    );
    return paginateArray(list, params);
  }

  public async save(observation: AIObservation): Promise<AIObservation> {
    enforceTenantContext(observation.organizationId);
    const existing = db.observations.get(observation.id);
    if (existing && existing.organizationId !== observation.organizationId) {
      throw new Error("Tenant Isolation Exception: Cannot modify or change tenant ownership for existing Observation.");
    }
    db.observations.set(observation.id, observation);
    return observation;
  }

  public async deleteSoft(organizationId: string, id: string, deletedBy: string): Promise<boolean> {
    enforceTenantContext(organizationId);
    const obs = db.observations.get(id);
    if (!obs || obs.organizationId !== organizationId) return false;
    obs.audit.deletedAt = new Date().toISOString();
    obs.audit.updatedBy = deletedBy;
    obs.audit.updatedAt = new Date().toISOString();
    return true;
  }

  // Mentions
  public async findMentionsByObservationId(organizationId: string, observationId: string): Promise<BrandMention[]> {
    enforceTenantContext(organizationId);
    return Array.from(db.mentions.values()).filter(
      m => m.organizationId === organizationId && m.observationId === observationId && !m.audit.deletedAt
    );
  }

  public async saveMention(mention: BrandMention): Promise<BrandMention> {
    enforceTenantContext(mention.organizationId);
    const existing = db.mentions.get(mention.id);
    if (existing && existing.organizationId !== mention.organizationId) {
      throw new Error("Tenant Isolation Exception: Cannot modify or change tenant ownership for existing Mention.");
    }
    db.mentions.set(mention.id, mention);
    return mention;
  }

  public async findCompetitorMentionsByObservationId(organizationId: string, observationId: string): Promise<CompetitorMention[]> {
    enforceTenantContext(organizationId);
    return Array.from(db.competitorMentions.values()).filter(
      m => m.organizationId === organizationId && m.observationId === observationId && !m.audit.deletedAt
    );
  }

  public async saveCompetitorMention(mention: CompetitorMention): Promise<CompetitorMention> {
    enforceTenantContext(mention.organizationId);
    const existing = db.competitorMentions.get(mention.id);
    if (existing && existing.organizationId !== mention.organizationId) {
      throw new Error("Tenant Isolation Exception: Cannot modify or change tenant ownership for existing CompetitorMention.");
    }
    db.competitorMentions.set(mention.id, mention);
    return mention;
  }

  // Citations
  public async findCitationsByObservationId(organizationId: string, observationId: string): Promise<Citation[]> {
    enforceTenantContext(organizationId);
    return Array.from(db.citations.values()).filter(
      c => c.organizationId === organizationId && c.observationId === observationId && !c.audit.deletedAt
    );
  }

  public async saveCitation(citation: Citation): Promise<Citation> {
    enforceTenantContext(citation.organizationId);
    const existing = db.citations.get(citation.id);
    if (existing && existing.organizationId !== citation.organizationId) {
      throw new Error("Tenant Isolation Exception: Cannot modify or change tenant ownership for existing Citation.");
    }
    db.citations.set(citation.id, citation);
    return citation;
  }
}

export class VisibilityScoreRepository implements IVisibilityScoreRepository {
  public async findByBrandId(organizationId: string, brandId: string, params?: QueryParams): Promise<PaginatedResult<VisibilityScore>> {
    enforceTenantContext(organizationId);
    const list = Array.from(db.visibilityScores.values()).filter(
      v => v.organizationId === organizationId && v.brandId === brandId && (params?.includeDeleted || !v.audit.deletedAt)
    );
    return paginateArray(list, params);
  }

  public async save(score: VisibilityScore): Promise<VisibilityScore> {
    enforceTenantContext(score.organizationId);
    const existing = db.visibilityScores.get(score.id);
    if (existing && existing.organizationId !== score.organizationId) {
      throw new Error("Tenant Isolation Exception: Cannot modify or change tenant ownership for existing VisibilityScore.");
    }
    db.visibilityScores.set(score.id, score);
    return score;
  }

  public async deleteSoft(organizationId: string, id: string, deletedBy: string): Promise<boolean> {
    enforceTenantContext(organizationId);
    const score = db.visibilityScores.get(id);
    if (!score || score.organizationId !== organizationId) return false;
    score.audit.deletedAt = new Date().toISOString();
    score.audit.updatedBy = deletedBy;
    score.audit.updatedAt = new Date().toISOString();
    return true;
  }
}

export class RecommendationRepository implements IRecommendationRepository {
  public async findByBrandId(organizationId: string, brandId: string, params?: QueryParams): Promise<PaginatedResult<Recommendation>> {
    enforceTenantContext(organizationId);
    const list = Array.from(db.recommendations.values()).filter(
      r => r.organizationId === organizationId && r.brandId === brandId && (params?.includeDeleted || !r.audit.deletedAt)
    );
    return paginateArray(list, params);
  }

  public async save(rec: Recommendation): Promise<Recommendation> {
    enforceTenantContext(rec.organizationId);
    const existing = db.recommendations.get(rec.id);
    if (existing && existing.organizationId !== rec.organizationId) {
      throw new Error("Tenant Isolation Exception: Cannot modify or change tenant ownership for existing Recommendation.");
    }
    db.recommendations.set(rec.id, rec);
    return rec;
  }

  public async deleteSoft(organizationId: string, id: string, deletedBy: string): Promise<boolean> {
    enforceTenantContext(organizationId);
    const rec = db.recommendations.get(id);
    if (!rec || rec.organizationId !== organizationId) return false;
    rec.audit.deletedAt = new Date().toISOString();
    rec.audit.updatedBy = deletedBy;
    rec.audit.updatedAt = new Date().toISOString();
    return true;
  }



}
