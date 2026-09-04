import { randomUUID } from "crypto";
import {
  Competitor,
  CompetitiveSeoFinding,
  AIVisibilityAudit,
  CitationSource,
  PositionObservation,
  BrandAssociation,
  RecommendationObservation
} from "../domain/types";
import {
  ICompetitorRepository,
  IAIVisibilityAuditRepository,
  ICitationIntelligenceRepository,
  IPromptIntelligenceRepository,
  IBrandIntelligenceRepository,
  ICompetitiveSeoFindingRepository
} from "../repositories/interfaces";

export class CompetitiveAiService {
  constructor(
    private readonly competitorRepo: ICompetitorRepository,
    private readonly auditRepo: IAIVisibilityAuditRepository,
    private readonly citationRepo: ICitationIntelligenceRepository,
    private readonly promptRepo: IPromptIntelligenceRepository,
    private readonly brandRepo: IBrandIntelligenceRepository,
    private readonly findingRepo: ICompetitiveSeoFindingRepository
  ) {}

  /**
   * Compares AI Visibility, Citations, Prompts, Brand Mentions, and Observed Recommendations.
   */
  public async compareAi(
    organizationId: string,
    tenantBrandId: string,
    competitorId: string,
    provider = "ChatGPT",
    model = "GPT-4o",
    measurementPeriod = "30d"
  ): Promise<CompetitiveSeoFinding[]> {
    const findings: CompetitiveSeoFinding[] = [];

    const competitor = await this.competitorRepo.findById(organizationId, competitorId);
    if (!competitor || competitor.status === "rejected") {
      return findings;
    }

    // ----------------------------------------------------
    // 1. AI VISIBILITY COMPARISON
    // ----------------------------------------------------
    // Fetch latest visibility audit of tenant
    const tenantAudits = await this.auditRepo.findByBrandId(organizationId, tenantBrandId);
    const tenantAudit = tenantAudits.data[0];

    // Try to fetch competitor audits (if the competitor has an audit in our system, or fallback gracefully)
    // Note: We'll assume the competitor might have an audit or we'll fallback safely.
    // To be compatible with our mock database, we look for an audit matching competitorId or use standard mock data
    let competitorAudit: AIVisibilityAudit | null = null;
    const competitorAudits = await this.auditRepo.findByBrandId(organizationId, competitorId);
    if (competitorAudits.data.length > 0) {
      competitorAudit = competitorAudits.data[0];
    }

    if (tenantAudit && competitorAudit) {
      // Both tenant and competitor audits exist and are comparable
      const tenantScore = tenantAudit.overallScore || 0;
      const competitorScore = competitorAudit.overallScore || 0;
      const scoreDiff = tenantScore - competitorScore;

      const finding: CompetitiveSeoFinding = {
        id: randomUUID(),
        organizationId,
        competitorId,
        findingType: "ai_visibility_gap",
        comparisonScope: "overall_visibility_score",
        competitivePosition: scoreDiff > 5 ? "advantage" : scoreDiff < -5 ? "disadvantage" : "neutral",
        tenantValue: `${tenantScore}/100`,
        competitorValue: `${competitorScore}/100`,
        difference: scoreDiff,
        differenceDirection: scoreDiff > 0 ? "positive" : scoreDiff < 0 ? "negative" : "none",
        severity: scoreDiff < -5 ? "high" : "low",
        evidence: {
          provider,
          model,
          measurementPeriod,
          explanation: scoreDiff < -5
            ? `Your overall AI visibility score is ${tenantScore}/100, which is lower than competitor's score of ${competitorScore}/100.`
            : `Your AI visibility is in an advantageous position at ${tenantScore}/100 vs competitor's ${competitorScore}/100.`
        },
        calculationMetadata: {
          tenantAuditId: tenantAudit.id,
          competitorAuditId: competitorAudit.id
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      };

      await this.findingRepo.save(finding);
      findings.push(finding);
    } else if (tenantAudit) {
      // Incomplete competitor audit data handled gracefully
      const score = tenantAudit.overallScore || 0;
      const finding: CompetitiveSeoFinding = {
        id: randomUUID(),
        organizationId,
        competitorId,
        findingType: "ai_visibility_gap",
        comparisonScope: "overall_visibility_score",
        competitivePosition: "neutral",
        tenantValue: `${score}/100`,
        competitorValue: "unknown",
        difference: undefined,
        differenceDirection: "none",
        severity: "low",
        evidence: {
          provider,
          model,
          measurementPeriod,
          explanation: "Competitor AI visibility audit is missing/incomplete for this period. Showing tenant value only."
        },
        calculationMetadata: {
          tenantAuditId: tenantAudit.id
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      };

      await this.findingRepo.save(finding);
      findings.push(finding);
    }

    // ----------------------------------------------------
    // 2. CITATION COMPARISON
    // ----------------------------------------------------
    const sources = await this.citationRepo.findSources(organizationId);
    const competitorSources = sources.data.filter(s => s.classification === "competitor");
    const tenantSources = sources.data.filter(s => s.classification === "owned");

    if (competitorSources.length > 0) {
      const citedOverlap: string[] = [];
      const competitorOnlyCitations: string[] = [];

      for (const cs of competitorSources) {
        if (tenantSources.some(ts => ts.domain === cs.domain)) {
          citedOverlap.push(cs.domain);
        } else {
          competitorOnlyCitations.push(cs.domain);
        }
      }

      const citationFinding: CompetitiveSeoFinding = {
        id: randomUUID(),
        organizationId,
        competitorId,
        findingType: "citation_gap",
        comparisonScope: "citation_source_coverage",
        competitivePosition: competitorOnlyCitations.length > 0 ? "disadvantage" : "neutral",
        tenantValue: `${tenantSources.length} sources cited`,
        competitorValue: `${competitorSources.length} sources cited`,
        difference: competitorOnlyCitations.length,
        differenceDirection: competitorOnlyCitations.length > 0 ? "negative" : "none",
        severity: competitorOnlyCitations.length > 3 ? "medium" : "low",
        evidence: {
          competitorOnlyCitations,
          citedOverlap,
          explanation: competitorOnlyCitations.length > 0
            ? `Competitors are cited from several sources like ${competitorOnlyCitations.slice(0, 2).join(", ")} where you have no observed citation presence.`
            : "No significant citation gaps detected between your brand and competitor."
        },
        calculationMetadata: {
          overlapCount: citedOverlap.length,
          competitorOnlyCount: competitorOnlyCitations.length
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      };

      await this.findingRepo.save(citationFinding);
      findings.push(citationFinding);
    }

    // ----------------------------------------------------
    // 3. PROMPT COMPARISON
    // ----------------------------------------------------
    // Query position observations from executions
    // For this test, we can retrieve position observations of competitor vs tenant brand
    // and identify prompt-level competitive gaps
    const competitorPositions = await this.brandRepo.findAssociationsByBrandId(organizationId, competitorId);
    const tenantPositions = await this.brandRepo.findAssociationsByBrandId(organizationId, tenantBrandId);

    const competitorVisibleConcepts = competitorPositions.map(p => p.entityName);
    const tenantVisibleConcepts = tenantPositions.map(p => p.entityName);

    const promptGapConcepts = competitorVisibleConcepts.filter(c => !tenantVisibleConcepts.includes(c));

    if (promptGapConcepts.length > 0) {
      const promptFinding: CompetitiveSeoFinding = {
        id: randomUUID(),
        organizationId,
        competitorId,
        findingType: "prompt_gap",
        comparisonScope: "concept_prompt_visibility",
        competitivePosition: "disadvantage",
        tenantValue: `${tenantPositions.length} associated concepts`,
        competitorValue: `${competitorPositions.length} associated concepts`,
        difference: promptGapConcepts.length,
        differenceDirection: "negative",
        severity: "medium",
        evidence: {
          promptGapConcepts,
          explanation: `Competitor is frequently associated with concepts like ${promptGapConcepts.slice(0, 2).map(c => `"${c}"`).join(", ")} in AI responses where your brand is completely absent.`
        },
        calculationMetadata: {
          gapConceptsCount: promptGapConcepts.length
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      };

      await this.findingRepo.save(promptFinding);
      findings.push(promptFinding);
    }

    // ----------------------------------------------------
    // 4. BRAND MENTION COMPARISON
    // ----------------------------------------------------
    const competitorMentionsCount = competitorPositions.reduce((sum, p) => sum + p.occurrenceCount, 0);
    const tenantMentionsCount = tenantPositions.reduce((sum, p) => sum + p.occurrenceCount, 0);
    const mentionDiff = tenantMentionsCount - competitorMentionsCount;

    const brandFinding: CompetitiveSeoFinding = {
      id: randomUUID(),
      organizationId,
      competitorId,
      findingType: "brand_mention_gap",
      comparisonScope: "observed_brand_mentions",
      competitivePosition: mentionDiff > 5 ? "advantage" : mentionDiff < -5 ? "disadvantage" : "neutral",
      tenantValue: `${tenantMentionsCount} mentions`,
      competitorValue: `${competitorMentionsCount} mentions`,
      difference: mentionDiff,
      differenceDirection: mentionDiff > 0 ? "positive" : mentionDiff < 0 ? "negative" : "none",
      severity: mentionDiff < -5 ? "medium" : "low",
      evidence: {
        provider,
        model,
        explanation: mentionDiff < -5
          ? `Competitor has significantly higher observed brand mention count (${competitorMentionsCount}) than yours (${tenantMentionsCount}).`
          : `Your brand mention frequency (${tenantMentionsCount}) is competitive compared to competitor (${competitorMentionsCount}).`
      },
      calculationMetadata: {
        tenantMentionsCount,
        competitorMentionsCount
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };

    await this.findingRepo.save(brandFinding);
    findings.push(brandFinding);

    // ----------------------------------------------------
    // 5. OBSERVED RECOMMENDATION COMPARISON (STRICTLY OBSERVATIONAL)
    // ----------------------------------------------------
    const competitorRecs = await this.brandRepo.findRecommendationsByBrandId(organizationId, competitorId);
    const tenantRecs = await this.brandRepo.findRecommendationsByBrandId(organizationId, tenantBrandId);

    const competitorRecsCount = competitorRecs.length;
    const tenantRecsCount = tenantRecs.length;
    const recsDiff = tenantRecsCount - competitorRecsCount;

    // Strict boundary: No generated recommendations or predictive calculations here
    const recsFinding: CompetitiveSeoFinding = {
      id: randomUUID(),
      organizationId,
      competitorId,
      findingType: "ai_recommendation_gap",
      comparisonScope: "observed_ai_recommendations",
      competitivePosition: recsDiff > 0 ? "advantage" : recsDiff < 0 ? "disadvantage" : "neutral",
      tenantValue: `${tenantRecsCount} recommendations observed`,
      competitorValue: `${competitorRecsCount} recommendations observed`,
      difference: recsDiff,
      differenceDirection: recsDiff > 0 ? "positive" : recsDiff < 0 ? "negative" : "none",
      severity: recsDiff < 0 ? "medium" : "low",
      evidence: {
        provider,
        model,
        explanation: recsDiff < 0
          ? `Competitor has been recommended in observed responses ${competitorRecsCount} times vs your ${tenantRecsCount} times.`
          : `Your brand is recommended in observed responses ${tenantRecsCount} times vs competitor's ${competitorRecsCount} times.`
      },
      calculationMetadata: {
        tenantRecsCount,
        competitorRecsCount,
        strictlyObservational: true // guarantees no predictions are made
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };

    await this.findingRepo.save(recsFinding);
    findings.push(recsFinding);

    return findings;
  }
}
