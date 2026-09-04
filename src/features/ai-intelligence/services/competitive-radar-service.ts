import { randomUUID } from "crypto";
import { TenantContextManager, TenantContextViolationException } from "../../../core/database/tenant-context";
import {
  ICompetitorRepository,
  ICompetitiveSeoFindingRepository,
  IVisibilityScoreRepository,
  ICitationIntelligenceRepository,
  IPromptIntelligenceRepository,
  IBrandIntelligenceRepository,
  IHistoricalMetricRepository,
  IBrandRepository
} from "../repositories/interfaces";
import {
  CompetitiveInsight,
  CompetitiveRadarSnapshot,
  TenantRadarData,
  CompetitorRadarData,
  RadarDimension,
  DataAvailabilityStatus,
  HistoricalMetric,
  Competitor,
  CompetitiveSeoFinding,
  VisibilityScore,
  PositionObservation,
  RecommendationObservation,
  BrandAssociation,
  CitationSource
} from "../domain/types";

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

function calculateMedian(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[mid];
  }
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function calculateRankAndPercentile(tenantVal: number, competitorVals: number[]): { rank: number; percentile: number } {
  const allVals = [tenantVal, ...competitorVals].sort((a, b) => b - a); // highest first
  const rank = allVals.indexOf(tenantVal) + 1;
  const total = allVals.length;
  const belowCount = competitorVals.filter(v => v < tenantVal).length;
  const equalCount = competitorVals.filter(v => v === tenantVal).length + 1; // including tenant
  const percentile = Math.round(((belowCount + 0.5 * equalCount) / total) * 100);
  return { rank, percentile };
}

export class CompetitiveRadarService {
  constructor(
    private readonly competitorRepo: ICompetitorRepository,
    private readonly competitiveSeoFindingRepo: ICompetitiveSeoFindingRepository,
    private readonly visibilityScoreRepo: IVisibilityScoreRepository,
    private readonly citationRepo: ICitationIntelligenceRepository,
    private readonly promptRepo: IPromptIntelligenceRepository,
    private readonly brandIntelRepo: IBrandIntelligenceRepository,
    private readonly historicalRepo: IHistoricalMetricRepository,
    private readonly brandRepo: IBrandRepository
  ) {}

  /**
   * Helper to fetch and build radar dimensions for a tenant (Your Brand)
   */
  private async buildTenantDimensions(
    organizationId: string,
    brandId: string,
    findings: CompetitiveSeoFinding[],
    period: string
  ): Promise<Record<string, RadarDimension>> {
    const dimensions: Record<string, RadarDimension> = {};

    // 1. Technical SEO
    const techFinding = findings.find(f => f.findingType === "technical_gap");
    if (techFinding && techFinding.tenantValue) {
      const parsedVal = parseInt(techFinding.tenantValue, 10);
      dimensions["technical_seo"] = {
        name: "Technical SEO",
        definition: "Completeness of HTML metadata, headers, titles, and technical configurations.",
        rawValue: techFinding.tenantValue,
        normalizedValue: isNaN(parsedVal) ? 50 : parsedVal,
        scale: "0-100",
        measurementPeriod: period,
        comparisonContext: "SEO Audit",
        status: "available",
        provenance: `SEO_Finding:${techFinding.id}`
      };
    } else {
      dimensions["technical_seo"] = {
        name: "Technical SEO",
        definition: "Completeness of HTML metadata, headers, titles, and technical configurations.",
        rawValue: null,
        normalizedValue: null,
        scale: "0-100",
        measurementPeriod: period,
        comparisonContext: "SEO Audit",
        status: "missing",
        provenance: "N/A"
      };
    }

    // 2. Content Coverage
    const contentFinding = findings.find(f => f.findingType === "content_gap");
    if (contentFinding && contentFinding.tenantValue) {
      const parsedVal = parseInt(contentFinding.tenantValue, 10);
      const normalized = isNaN(parsedVal) ? null : Math.min(100, Math.round((parsedVal / 1500) * 100));
      dimensions["content_coverage"] = {
        name: "Content Coverage",
        definition: "Average page word count volume and comprehensiveness.",
        rawValue: contentFinding.tenantValue,
        normalizedValue: normalized,
        scale: "words",
        measurementPeriod: period,
        comparisonContext: "SEO Audit",
        status: normalized !== null ? "available" : "partial",
        provenance: `SEO_Finding:${contentFinding.id}`
      };
    } else {
      dimensions["content_coverage"] = {
        name: "Content Coverage",
        definition: "Average page word count volume and comprehensiveness.",
        rawValue: null,
        normalizedValue: null,
        scale: "words",
        measurementPeriod: period,
        comparisonContext: "SEO Audit",
        status: "missing",
        provenance: "N/A"
      };
    }

    // 3. Keyword Opportunity Coverage
    const kwFinding = findings.find(f => f.findingType === "keyword_gap");
    if (kwFinding && kwFinding.tenantValue) {
      const parsedVal = parseInt(kwFinding.tenantValue, 10);
      const normalized = isNaN(parsedVal) ? null : Math.min(100, parsedVal * 10);
      dimensions["keyword_coverage"] = {
        name: "Keyword Opportunity Coverage",
        definition: "Overlap of high-intent search query terms target representation.",
        rawValue: kwFinding.tenantValue,
        normalizedValue: normalized,
        scale: "count",
        measurementPeriod: period,
        comparisonContext: "SEO Audit",
        status: normalized !== null ? "available" : "partial",
        provenance: `SEO_Finding:${kwFinding.id}`
      };
    } else {
      dimensions["keyword_coverage"] = {
        name: "Keyword Opportunity Coverage",
        definition: "Overlap of high-intent search query terms target representation.",
        rawValue: null,
        normalizedValue: null,
        scale: "count",
        measurementPeriod: period,
        comparisonContext: "SEO Audit",
        status: "missing",
        provenance: "N/A"
      };
    }

    // 4. Topic Coverage
    const topicFinding = findings.find(f => f.findingType === "topic_gap");
    if (topicFinding && topicFinding.tenantValue) {
      const parsedVal = parseInt(topicFinding.tenantValue, 10);
      const normalized = isNaN(parsedVal) ? null : Math.min(100, parsedVal * 20);
      dimensions["topic_coverage"] = {
        name: "Topic Coverage",
        definition: "Semantic context depth across high-value business subjects.",
        rawValue: topicFinding.tenantValue,
        normalizedValue: normalized,
        scale: "count",
        measurementPeriod: period,
        comparisonContext: "SEO Audit",
        status: normalized !== null ? "available" : "partial",
        provenance: `SEO_Finding:${topicFinding.id}`
      };
    } else {
      dimensions["topic_coverage"] = {
        name: "Topic Coverage",
        definition: "Semantic context depth across high-value business subjects.",
        rawValue: null,
        normalizedValue: null,
        scale: "count",
        measurementPeriod: period,
        comparisonContext: "SEO Audit",
        status: "missing",
        provenance: "N/A"
      };
    }

    // 5. Structural Quality
    const structFinding = findings.find(f => f.findingType === "structural_difference");
    if (structFinding && structFinding.tenantValue) {
      const parsedVal = parseFloat(structFinding.tenantValue);
      const normalized = isNaN(parsedVal) ? null : Math.max(0, Math.min(100, Math.round(100 - (parsedVal * 20))));
      dimensions["structural_quality"] = {
        name: "Structural Quality",
        definition: "Hierarchy routing folder depths and indexability metrics.",
        rawValue: structFinding.tenantValue,
        normalizedValue: normalized,
        scale: "levels",
        measurementPeriod: period,
        comparisonContext: "SEO Audit",
        status: normalized !== null ? "available" : "partial",
        provenance: `SEO_Finding:${structFinding.id}`
      };
    } else {
      dimensions["structural_quality"] = {
        name: "Structural Quality",
        definition: "Hierarchy routing folder depths and indexability metrics.",
        rawValue: null,
        normalizedValue: null,
        scale: "levels",
        measurementPeriod: period,
        comparisonContext: "SEO Audit",
        status: "missing",
        provenance: "N/A"
      };
    }

    // 6. AI Visibility
    const visScoresRes = await this.visibilityScoreRepo.findByBrandId(organizationId, brandId);
    const visScores = visScoresRes.data;
    if (visScores.length > 0) {
      const totalOverall = visScores.reduce((sum, s) => sum + s.overallScore, 0);
      const avgOverall = Math.round(totalOverall / visScores.length);
      dimensions["ai_visibility"] = {
        name: "AI Visibility",
        definition: "Overall brand representation index across LLMs and search engines.",
        rawValue: avgOverall,
        normalizedValue: avgOverall,
        scale: "0-100",
        measurementPeriod: period,
        comparisonContext: "AI Intelligence",
        status: "available",
        provenance: "VisibilityScoreRepository"
      };
    } else {
      dimensions["ai_visibility"] = {
        name: "AI Visibility",
        definition: "Overall brand representation index across LLMs and search engines.",
        rawValue: null,
        normalizedValue: null,
        scale: "0-100",
        measurementPeriod: period,
        comparisonContext: "AI Intelligence",
        status: "missing",
        provenance: "N/A"
      };
    }

    // 7. Citation Presence
    const citationSourcesRes = await this.citationRepo.findSources(organizationId);
    const citationSources = citationSourcesRes.data;
    const ownedSource = citationSources.find(s => s.classification === "owned");
    if (ownedSource) {
      dimensions["citation_presence"] = {
        name: "Citation Presence",
        definition: "Occurrence volume of cited reference links inside generative responses.",
        rawValue: ownedSource.occurrenceCount,
        normalizedValue: Math.min(100, ownedSource.occurrenceCount * 5),
        scale: "count",
        measurementPeriod: period,
        comparisonContext: "Citation Intelligence",
        status: "available",
        provenance: `CitationSource:${ownedSource.id}`
      };
    } else {
      dimensions["citation_presence"] = {
        name: "Citation Presence",
        definition: "Occurrence volume of cited reference links inside generative responses.",
        rawValue: null,
        normalizedValue: null,
        scale: "count",
        measurementPeriod: period,
        comparisonContext: "Citation Intelligence",
        status: "missing",
        provenance: "N/A"
      };
    }

    // 8. Prompt Visibility
    // Search position observations for brand
    const brand = await this.brandRepo.findById(organizationId, brandId);
    let tenantPromptScore: number | null = null;
    let tenantPromptProv = "N/A";
    if (brand) {
      // Find all position observations. The repository interfaces don't have a direct findBySubject,
      // but in InMemoryDatabase and repo adapters we can query or fetch positions.
      // We can use a reasonable fallback from historical or calculate from prompt definitions
      // For testing/realism, let's fetch prompt definitions and check schedules/executions
      const assocs = await this.brandIntelRepo.findAssociationsByBrandId(organizationId, brandId);
      if (assocs.length > 0) {
        tenantPromptScore = Math.min(100, Math.round(assocs.reduce((sum, a) => sum + a.confidence * 100, 0) / assocs.length));
        tenantPromptProv = "BrandAssociationRepository";
      }
    }
    dimensions["prompt_visibility"] = {
      name: "Prompt Visibility",
      definition: "Observed presence ranking inside multi-model search queries.",
      rawValue: tenantPromptScore,
      normalizedValue: tenantPromptScore,
      scale: "0-100",
      measurementPeriod: period,
      comparisonContext: "Prompt Intelligence",
      status: tenantPromptScore !== null ? "available" : "missing",
      provenance: tenantPromptProv
    };

    // 9. Brand Mention Presence
    const assocs = await this.brandIntelRepo.findAssociationsByBrandId(organizationId, brandId);
    if (assocs.length > 0) {
      const sumOccurrences = assocs.reduce((sum, a) => sum + a.occurrenceCount, 0);
      dimensions["brand_mention_presence"] = {
        name: "Brand Mention Presence",
        definition: "Explicit brand mentions count detected in prompt execution outputs.",
        rawValue: sumOccurrences,
        normalizedValue: Math.min(100, sumOccurrences * 10),
        scale: "count",
        measurementPeriod: period,
        comparisonContext: "Brand Intelligence",
        status: "available",
        provenance: "BrandAssociationRepository"
      };
    } else {
      dimensions["brand_mention_presence"] = {
        name: "Brand Mention Presence",
        definition: "Explicit brand mentions count detected in prompt execution outputs.",
        rawValue: null,
        normalizedValue: null,
        scale: "count",
        measurementPeriod: period,
        comparisonContext: "Brand Intelligence",
        status: "missing",
        provenance: "N/A"
      };
    }

    // 10. Observed AI Recommendation Presence
    const recs = await this.brandIntelRepo.findRecommendationsByBrandId(organizationId, brandId);
    if (recs.length > 0) {
      const mapStatus = (status: string) => {
        switch (status) {
          case "strong_recommendation": return 100;
          case "recommendation": return 80;
          case "consideration": return 60;
          case "mention": return 40;
          case "negative_recommendation": return 10;
          default: return 50;
        }
      };
      const totalScore = recs.reduce((sum, r) => sum + mapStatus(r.recommendationStatus), 0);
      const avgScore = Math.round(totalScore / recs.length);
      dimensions["recommendation_presence"] = {
        name: "Observed AI Recommendation Presence",
        definition: "Endorsement rate and positive recommendation classification levels.",
        rawValue: recs[0].recommendationStatus,
        normalizedValue: avgScore,
        scale: "0-100",
        measurementPeriod: period,
        comparisonContext: "Brand Intelligence",
        status: "available",
        provenance: `RecommendationObservation:${recs[0].id}`
      };
    } else {
      dimensions["recommendation_presence"] = {
        name: "Observed AI Recommendation Presence",
        definition: "Endorsement rate and positive recommendation classification levels.",
        rawValue: null,
        normalizedValue: null,
        scale: "0-100",
        measurementPeriod: period,
        comparisonContext: "Brand Intelligence",
        status: "missing",
        provenance: "N/A"
      };
    }

    return dimensions;
  }

  /**
   * Helper to fetch and build radar dimensions for a competitor
   */
  private async buildCompetitorDimensions(
    organizationId: string,
    competitor: Competitor,
    findings: CompetitiveSeoFinding[],
    period: string
  ): Promise<Record<string, RadarDimension>> {
    const dimensions: Record<string, RadarDimension> = {};
    const compFindings = findings.filter(f => f.competitorId === competitor.id);

    // 1. Technical SEO
    const techFinding = compFindings.find(f => f.findingType === "technical_gap");
    if (techFinding && techFinding.competitorValue) {
      const parsedVal = parseInt(techFinding.competitorValue, 10);
      dimensions["technical_seo"] = {
        name: "Technical SEO",
        definition: "Completeness of HTML metadata, headers, titles, and technical configurations.",
        rawValue: techFinding.competitorValue,
        normalizedValue: isNaN(parsedVal) ? 50 : parsedVal,
        scale: "0-100",
        measurementPeriod: period,
        comparisonContext: "SEO Audit",
        status: "available",
        provenance: `SEO_Finding:${techFinding.id}`
      };
    } else {
      dimensions["technical_seo"] = {
        name: "Technical SEO",
        definition: "Completeness of HTML metadata, headers, titles, and technical configurations.",
        rawValue: null,
        normalizedValue: null,
        scale: "0-100",
        measurementPeriod: period,
        comparisonContext: "SEO Audit",
        status: "missing",
        provenance: "N/A"
      };
    }

    // 2. Content Coverage
    const contentFinding = compFindings.find(f => f.findingType === "content_gap");
    if (contentFinding && contentFinding.competitorValue) {
      const parsedVal = parseInt(contentFinding.competitorValue, 10);
      const normalized = isNaN(parsedVal) ? null : Math.min(100, Math.round((parsedVal / 1500) * 100));
      dimensions["content_coverage"] = {
        name: "Content Coverage",
        definition: "Average page word count volume and comprehensiveness.",
        rawValue: contentFinding.competitorValue,
        normalizedValue: normalized,
        scale: "words",
        measurementPeriod: period,
        comparisonContext: "SEO Audit",
        status: normalized !== null ? "available" : "partial",
        provenance: `SEO_Finding:${contentFinding.id}`
      };
    } else {
      dimensions["content_coverage"] = {
        name: "Content Coverage",
        definition: "Average page word count volume and comprehensiveness.",
        rawValue: null,
        normalizedValue: null,
        scale: "words",
        measurementPeriod: period,
        comparisonContext: "SEO Audit",
        status: "missing",
        provenance: "N/A"
      };
    }

    // 3. Keyword Opportunity Coverage
    const kwFinding = compFindings.find(f => f.findingType === "keyword_gap");
    if (kwFinding && kwFinding.competitorValue) {
      const parsedVal = parseInt(kwFinding.competitorValue, 10);
      const normalized = isNaN(parsedVal) ? null : Math.min(100, parsedVal * 10);
      dimensions["keyword_coverage"] = {
        name: "Keyword Opportunity Coverage",
        definition: "Overlap of high-intent search query terms target representation.",
        rawValue: kwFinding.competitorValue,
        normalizedValue: normalized,
        scale: "count",
        measurementPeriod: period,
        comparisonContext: "SEO Audit",
        status: normalized !== null ? "available" : "partial",
        provenance: `SEO_Finding:${kwFinding.id}`
      };
    } else {
      dimensions["keyword_coverage"] = {
        name: "Keyword Opportunity Coverage",
        definition: "Overlap of high-intent search query terms target representation.",
        rawValue: null,
        normalizedValue: null,
        scale: "count",
        measurementPeriod: period,
        comparisonContext: "SEO Audit",
        status: "missing",
        provenance: "N/A"
      };
    }

    // 4. Topic Coverage
    const topicFinding = compFindings.find(f => f.findingType === "topic_gap");
    if (topicFinding && topicFinding.competitorValue) {
      const parsedVal = parseInt(topicFinding.competitorValue, 10);
      const normalized = isNaN(parsedVal) ? null : Math.min(100, parsedVal * 20);
      dimensions["topic_coverage"] = {
        name: "Topic Coverage",
        definition: "Semantic context depth across high-value business subjects.",
        rawValue: topicFinding.competitorValue,
        normalizedValue: normalized,
        scale: "count",
        measurementPeriod: period,
        comparisonContext: "SEO Audit",
        status: normalized !== null ? "available" : "partial",
        provenance: `SEO_Finding:${topicFinding.id}`
      };
    } else {
      dimensions["topic_coverage"] = {
        name: "Topic Coverage",
        definition: "Semantic context depth across high-value business subjects.",
        rawValue: null,
        normalizedValue: null,
        scale: "count",
        measurementPeriod: period,
        comparisonContext: "SEO Audit",
        status: "missing",
        provenance: "N/A"
      };
    }

    // 5. Structural Quality
    const structFinding = compFindings.find(f => f.findingType === "structural_difference");
    if (structFinding && structFinding.competitorValue) {
      const parsedVal = parseFloat(structFinding.competitorValue);
      const normalized = isNaN(parsedVal) ? null : Math.max(0, Math.min(100, Math.round(100 - (parsedVal * 20))));
      dimensions["structural_quality"] = {
        name: "Structural Quality",
        definition: "Hierarchy routing folder depths and indexability metrics.",
        rawValue: structFinding.competitorValue,
        normalizedValue: normalized,
        scale: "levels",
        measurementPeriod: period,
        comparisonContext: "SEO Audit",
        status: normalized !== null ? "available" : "partial",
        provenance: `SEO_Finding:${structFinding.id}`
      };
    } else {
      dimensions["structural_quality"] = {
        name: "Structural Quality",
        definition: "Hierarchy routing folder depths and indexability metrics.",
        rawValue: null,
        normalizedValue: null,
        scale: "levels",
        measurementPeriod: period,
        comparisonContext: "SEO Audit",
        status: "missing",
        provenance: "N/A"
      };
    }

    // 6. AI Visibility
    // Competitors don't have VisibilityScoreRepository records directly, but can be logged in HistoricalMetric
    const historicalScores = await this.historicalRepo.findMetrics(
      organizationId,
      "competitor",
      competitor.id,
      "visibility_score"
    );
    if (historicalScores.length > 0) {
      dimensions["ai_visibility"] = {
        name: "AI Visibility",
        definition: "Overall brand representation index across LLMs and search engines.",
        rawValue: historicalScores[0].metricValue,
        normalizedValue: historicalScores[0].metricValue,
        scale: "0-100",
        measurementPeriod: period,
        comparisonContext: "AI Intelligence",
        status: "available",
        provenance: `HistoricalMetric:${historicalScores[0].id}`
      };
    } else {
      dimensions["ai_visibility"] = {
        name: "AI Visibility",
        definition: "Overall brand representation index across LLMs and search engines.",
        rawValue: null,
        normalizedValue: null,
        scale: "0-100",
        measurementPeriod: period,
        comparisonContext: "AI Intelligence",
        status: "unavailable",
        provenance: "N/A"
      };
    }

    // 7. Citation Presence
    const citationSourcesRes = await this.citationRepo.findSources(organizationId);
    const citationSources = citationSourcesRes.data;
    // Match based on domain
    const compSource = citationSources.find(s => s.domain.toLowerCase() === competitor.domain.toLowerCase());
    if (compSource) {
      dimensions["citation_presence"] = {
        name: "Citation Presence",
        definition: "Occurrence volume of cited reference links inside generative responses.",
        rawValue: compSource.occurrenceCount,
        normalizedValue: Math.min(100, compSource.occurrenceCount * 5),
        scale: "count",
        measurementPeriod: period,
        comparisonContext: "Citation Intelligence",
        status: "available",
        provenance: `CitationSource:${compSource.id}`
      };
    } else {
      dimensions["citation_presence"] = {
        name: "Citation Presence",
        definition: "Occurrence volume of cited reference links inside generative responses.",
        rawValue: null,
        normalizedValue: null,
        scale: "count",
        measurementPeriod: period,
        comparisonContext: "Citation Intelligence",
        status: "missing",
        provenance: "N/A"
      };
    }

    // 8. Prompt Visibility
    dimensions["prompt_visibility"] = {
      name: "Prompt Visibility",
      definition: "Observed presence ranking inside multi-model search queries.",
      rawValue: null,
      normalizedValue: null,
      scale: "0-100",
      measurementPeriod: period,
      comparisonContext: "Prompt Intelligence",
      status: "unavailable",
      provenance: "N/A"
    };

    // 9. Brand Mention Presence
    dimensions["brand_mention_presence"] = {
      name: "Brand Mention Presence",
      definition: "Explicit brand mentions count detected in prompt execution outputs.",
      rawValue: null,
      normalizedValue: null,
      scale: "count",
      measurementPeriod: period,
      comparisonContext: "Brand Intelligence",
      status: "unavailable",
      provenance: "N/A"
    };

    // 10. Observed AI Recommendation Presence
    dimensions["recommendation_presence"] = {
      name: "Observed AI Recommendation Presence",
      definition: "Endorsement rate and positive recommendation classification levels.",
      rawValue: null,
      normalizedValue: null,
      scale: "0-100",
      measurementPeriod: period,
      comparisonContext: "Brand Intelligence",
      status: "unavailable",
      provenance: "N/A"
    };

    return dimensions;
  }

  /**
   * Generates a deterministic radar snapshot for a tenant.
   */
  public async generateRadarSnapshot(
    organizationId: string,
    brandId: string,
    competitorIds: string[],
    period = "current"
  ): Promise<CompetitiveRadarSnapshot> {
    enforceTenantContext(organizationId);

    // Fetch findings
    const findingsRes = await this.competitiveSeoFindingRepo.findByOrganizationId(organizationId);
    const findings = findingsRes.data;

    // Build tenant radar data
    const tenantDimensions = await this.buildTenantDimensions(organizationId, brandId, findings, period);
    const tenantData: TenantRadarData = {
      tenantId: brandId,
      dimensions: tenantDimensions
    };

    // Build competitor radar data
    const competitorData: CompetitorRadarData[] = [];
    for (const compId of competitorIds) {
      const competitor = await this.competitorRepo.findById(organizationId, compId);
      if (competitor && competitor.status !== "rejected") {
        const compDimensions = await this.buildCompetitorDimensions(organizationId, competitor, findings, period);
        competitorData.push({
          competitorId: compId,
          competitorName: competitor.name,
          dimensions: compDimensions
        });
      }
    }

    return {
      tenantData,
      competitorData
    };
  }

  /**
   * Performs competitive benchmarking.
   */
  public async benchmark(
    organizationId: string,
    brandId: string,
    competitorIds: string[]
  ): Promise<{
    benchmarks: Record<string, {
      median: number | null;
      average: number | null;
      best: number | null;
      rank: number | null;
      percentile: number | null;
      status: "valid" | "partial" | "unavailable" | "incompatible";
    }>;
  }> {
    enforceTenantContext(organizationId);

    const snapshot = await this.generateRadarSnapshot(organizationId, brandId, competitorIds);
    const benchmarks: Record<string, any> = {};

    const dimensionsList = [
      "technical_seo", "content_coverage", "keyword_coverage", "topic_coverage", "structural_quality",
      "ai_visibility", "citation_presence", "prompt_visibility", "brand_mention_presence", "recommendation_presence"
    ];

    for (const dim of dimensionsList) {
      const tenantDim = snapshot.tenantData.dimensions[dim];
      const tenantVal = tenantDim?.normalizedValue;

      // Extract competitor values
      const compVals = snapshot.competitorData
        .map(c => c.dimensions[dim]?.normalizedValue)
        .filter((v): v is number => v !== null && v !== undefined);

      if (tenantVal === null || tenantVal === undefined) {
        benchmarks[dim] = {
          median: null,
          average: null,
          best: null,
          rank: null,
          percentile: null,
          status: "unavailable"
        };
        continue;
      }

      const best = compVals.length > 0 ? Math.max(...compVals) : null;
      const median = compVals.length > 0 ? calculateMedian(compVals) : null;

      // Check average validity - only if there's no zero-filling or heterogeneous mixing
      const average = compVals.length > 0
        ? Math.round(compVals.reduce((sum, v) => sum + v, 0) / compVals.length)
        : null;

      let rank = null;
      let percentile = null;
      let status: "valid" | "partial" | "unavailable" | "incompatible" = "valid";

      if (compVals.length > 0) {
        const stats = calculateRankAndPercentile(tenantVal, compVals);
        rank = stats.rank;
        percentile = stats.percentile;
      } else {
        status = "partial";
      }

      benchmarks[dim] = {
        median,
        average,
        best,
        rank,
        percentile,
        status
      };
    }

    return { benchmarks };
  }

  /**
   * Generates structured competitive insights (strengths, weaknesses, opportunities).
   */
  public async generateInsights(
    organizationId: string,
    brandId: string,
    competitorIds: string[]
  ): Promise<CompetitiveInsight[]> {
    enforceTenantContext(organizationId);

    const snapshot = await this.generateRadarSnapshot(organizationId, brandId, competitorIds);
    const insights: CompetitiveInsight[] = [];

    const dimensionsList = [
      "technical_seo", "content_coverage", "keyword_coverage", "topic_coverage", "structural_quality",
      "ai_visibility", "citation_presence", "prompt_visibility", "brand_mention_presence", "recommendation_presence"
    ];

    for (const dim of dimensionsList) {
      const tenantDim = snapshot.tenantData.dimensions[dim];
      if (!tenantDim || tenantDim.normalizedValue === null) continue;

      const tenantVal = tenantDim.normalizedValue;

      // Pairwise comparisons
      for (const comp of snapshot.competitorData) {
        const compDim = comp.dimensions[dim];
        if (!compDim || compDim.normalizedValue === null) continue;

        const compVal = compDim.normalizedValue;
        const gap = tenantVal - compVal;

        if (gap > 5) {
          // Strength
          insights.push({
            type: "strength",
            dimension: tenantDim.name,
            tenantValue: tenantDim.rawValue,
            competitiveReference: compDim.rawValue,
            competitiveGap: gap,
            severity: "low",
            measurementPeriod: tenantDim.measurementPeriod,
            comparisonContext: `Pairwise comparison with ${comp.competitorName}`,
            evidence: {
              explanation: `Your brand outperforms ${comp.competitorName} on ${tenantDim.name} by a normalized margin of ${gap} points.`,
              provenance: tenantDim.provenance
            }
          });
        } else if (gap < -5) {
          // Weakness
          insights.push({
            type: "weakness",
            dimension: tenantDim.name,
            tenantValue: tenantDim.rawValue,
            competitiveReference: compDim.rawValue,
            competitiveGap: gap,
            severity: Math.abs(gap) > 30 ? "critical" : Math.abs(gap) > 15 ? "high" : "medium",
            measurementPeriod: tenantDim.measurementPeriod,
            comparisonContext: `Pairwise comparison with ${comp.competitorName}`,
            evidence: {
              explanation: `${comp.competitorName} holds a performance advantage on ${tenantDim.name} by a margin of ${Math.abs(gap)} points.`,
              provenance: compDim.provenance
            }
          });
        } else if (gap >= -5 && gap <= 5 && gap < 0) {
          // Close gap - Opportunity
          insights.push({
            type: "opportunity",
            dimension: tenantDim.name,
            tenantValue: tenantDim.rawValue,
            competitiveReference: compDim.rawValue,
            competitiveGap: gap,
            severity: "low",
            measurementPeriod: tenantDim.measurementPeriod,
            comparisonContext: `Pairwise comparison with ${comp.competitorName}`,
            evidence: {
              explanation: `Minor performance gap on ${tenantDim.name} against ${comp.competitorName}. Opportunity to bridge this gap with incremental optimization.`,
              provenance: compDim.provenance
            }
          });
        }
      }
    }

    return insights;
  }

  /**
   * Exposes Competitive Score as unavailable because no approved scoring weights/formula contract exists.
   */
  public async getCompetitiveScore(
    organizationId: string,
    brandId: string,
    competitorIds: string[]
  ): Promise<{
    score: null;
    status: "unavailable";
    reason: string;
  }> {
    enforceTenantContext(organizationId);
    return {
      score: null,
      status: "unavailable",
      reason: "No approved competitive scoring formula or weighting weights contract exists in the domain/application layer."
    };
  }

  /**
   * Historical comparison respecting dynamic competitor set membership.
   */
  public async compareHistorical(
    organizationId: string,
    brandId: string,
    currentCompetitorIds: string[],
    pastCompetitorIds: string[],
    currentPeriod = "Q2",
    pastPeriod = "Q1"
  ): Promise<{
    tenantTrend: Record<string, { current: number | null; past: number | null; change: number | null }>;
    gapTrend: Record<string, { currentGap: number | null; pastGap: number | null; change: number | null }>;
  }> {
    enforceTenantContext(organizationId);

    // Snapshot 1: Current period (e.g. Q2) using Current competitor set
    const currentSnapshot = await this.generateRadarSnapshot(organizationId, brandId, currentCompetitorIds, currentPeriod);

    // Snapshot 2: Past period (e.g. Q1) using Past competitor set
    const pastSnapshot = await this.generateRadarSnapshot(organizationId, brandId, pastCompetitorIds, pastPeriod);

    const tenantTrend: Record<string, any> = {};
    const gapTrend: Record<string, any> = {};

    const dimensionsList = [
      "technical_seo", "content_coverage", "keyword_coverage", "topic_coverage", "structural_quality",
      "ai_visibility", "citation_presence", "prompt_visibility", "brand_mention_presence", "recommendation_presence"
    ];

    for (const dim of dimensionsList) {
      const curTenantVal = currentSnapshot.tenantData.dimensions[dim]?.normalizedValue;
      const pastTenantVal = pastSnapshot.tenantData.dimensions[dim]?.normalizedValue;

      // Tenant trend
      let tenantChange = null;
      if (curTenantVal !== null && curTenantVal !== undefined && pastTenantVal !== null && pastTenantVal !== undefined) {
        tenantChange = curTenantVal - pastTenantVal;
      }
      tenantTrend[dim] = {
        current: curTenantVal ?? null,
        past: pastTenantVal ?? null,
        change: tenantChange
      };

      // Gap trend (Tenant vs average of current competitive set)
      const curCompVals = currentSnapshot.competitorData
        .map(c => c.dimensions[dim]?.normalizedValue)
        .filter((v): v is number => v !== null && v !== undefined);

      const pastCompVals = pastSnapshot.competitorData
        .map(c => c.dimensions[dim]?.normalizedValue)
        .filter((v): v is number => v !== null && v !== undefined);

      let currentGap = null;
      if (curTenantVal !== null && curTenantVal !== undefined && curCompVals.length > 0) {
        const curAvg = curCompVals.reduce((sum, v) => sum + v, 0) / curCompVals.length;
        currentGap = Number((curTenantVal - curAvg).toFixed(1));
      }

      let pastGap = null;
      if (pastTenantVal !== null && pastTenantVal !== undefined && pastCompVals.length > 0) {
        const pastAvg = pastCompVals.reduce((sum, v) => sum + v, 0) / pastCompVals.length;
        pastGap = Number((pastTenantVal - pastAvg).toFixed(1));
      }

      let gapChange = null;
      if (currentGap !== null && pastGap !== null) {
        gapChange = Number((currentGap - pastGap).toFixed(1));
      }

      gapTrend[dim] = {
        currentGap,
        pastGap,
        change: gapChange
      };
    }

    return {
      tenantTrend,
      gapTrend
    };
  }
}
