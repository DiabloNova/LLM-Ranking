import { VisibilityScore } from "../domain/types";
import { IVisibilityScoreRepository, IAIEngineRepository } from "../repositories/interfaces";
import { VisibilityScoreRepository, AIEngineRepository } from "../repositories";

export interface AggregateEngineScore {
  engineName: string;
  overallScore: number;
  mentionScore: number;
  citationScore: number;
  sentimentScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
}

export interface BrandDashboardPayload {
  overallScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
  factors: { name: string; score: number }[];
  engineMetrics: AggregateEngineScore[];
}

export class VisibilityService {
  private visRepo: IVisibilityScoreRepository;
  private engineRepo: IAIEngineRepository;

  constructor(visRepo?: IVisibilityScoreRepository, engineRepo?: IAIEngineRepository) {
    this.visRepo = visRepo || new VisibilityScoreRepository();
    this.engineRepo = engineRepo || new AIEngineRepository();
  }

  /**
   * Helper function to map numeric score values to Letter Grades
   */
  public calculateGrade(score: number): "A" | "B" | "C" | "D" | "F" {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  }

  /**
   * Record a brand visibility score inside a tenant boundary
   */
  public async recordScore(
    organizationId: string,
    brandId: string,
    engineId: string,
    scores: Omit<VisibilityScore, "id" | "organizationId" | "brandId" | "engineId" | "audit">,
    actorId = "system"
  ): Promise<VisibilityScore> {
    const score: VisibilityScore = {
      id: `vis-${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      brandId,
      engineId,
      ...scores,
      audit: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: actorId,
        updatedBy: actorId,
        version: 1
      }
    };

    return this.visRepo.save(score);
  }

  /**
   * Retrieve raw visibility metric entries for a brand inside a tenant boundary
   */
  public async calculateVisibilityMetrics(organizationId: string, brandId: string): Promise<VisibilityScore[]> {
    const res = await this.visRepo.findByBrandId(organizationId, brandId);
    return res.data;
  }

  /**
   * Aggregate brand visibility metrics partitioned by external AI Engine inside a tenant boundary
   */
  public async aggregateEnginePerformance(organizationId: string, brandId: string): Promise<AggregateEngineScore[]> {
    const resScores = await this.visRepo.findByBrandId(organizationId, brandId);
    const rawScores = resScores.data;

    const resEngines = await this.engineRepo.findAll();
    const engines = resEngines.data;

    const aggregated: AggregateEngineScore[] = [];

    for (const engine of engines) {
      const engineScores = rawScores.filter(s => s.engineId === engine.id);
      if (engineScores.length === 0) {
        aggregated.push({
          engineName: engine.name,
          overallScore: 0,
          mentionScore: 0,
          citationScore: 0,
          sentimentScore: 0,
          grade: "F"
        });
        continue;
      }

      // Average the metrics
      const sum = engineScores.reduce((acc, curr) => ({
        overall: acc.overall + curr.overallScore,
        mention: acc.mention + curr.mentionScore,
        citation: acc.citation + curr.citationScore,
        sentiment: acc.sentiment + curr.sentimentScore,
      }), { overall: 0, mention: 0, citation: 0, sentiment: 0 });

      const count = engineScores.length;
      const overallAvg = Math.round(sum.overall / count);

      aggregated.push({
        engineName: engine.name,
        overallScore: overallAvg,
        mentionScore: Math.round(sum.mention / count),
        citationScore: Math.round(sum.citation / count),
        sentimentScore: Math.round(sum.sentiment / count),
        grade: this.calculateGrade(overallAvg)
      });
    }

    return aggregated;
  }

  /**
   * High-level helper preparing telemetry state specifically for the Brand Intelligence Command Center inside a tenant boundary
   */
  public async prepareDashboardData(organizationId: string, brandId: string): Promise<BrandDashboardPayload> {
    const resScores = await this.visRepo.findByBrandId(organizationId, brandId);
    const rawScores = resScores.data;

    const engineMetrics = await this.aggregateEnginePerformance(organizationId, brandId);

    if (rawScores.length === 0) {
      return {
        overallScore: 0,
        grade: "F",
        factors: [
          { name: "Citation Authority", score: 0 },
          { name: "Information Density", score: 0 },
          { name: "Model Trust Score", score: 0 },
          { name: "RAG Cosine Alignment", score: 0 }
        ],
        engineMetrics
      };
    }

    // Average across all recorded raw scores
    const count = rawScores.length;
    const totals = rawScores.reduce((acc, curr) => ({
      overall: acc.overall + curr.overallScore,
      mention: acc.mention + curr.mentionScore,
      citation: acc.citation + curr.citationScore,
      authority: acc.authority + curr.authorityScore,
      sentiment: acc.sentiment + curr.sentimentScore,
      position: acc.position + curr.positionScore
    }), { overall: 0, mention: 0, citation: 0, authority: 0, sentiment: 0, position: 0 });

    const overallScore = Math.round(totals.overall / count);
    const authorityScore = Math.round(totals.authority / count);
    const mentionScore = Math.round(totals.mention / count);
    const citationScore = Math.round(totals.citation / count);
    const positionScore = Math.round(totals.position / count);

    // Factors mapping
    const factors = [
      { name: "Citation Authority", score: authorityScore },
      { name: "Information Density", score: mentionScore },
      { name: "Model Trust Score", score: citationScore },
      { name: "RAG Cosine Alignment", score: positionScore }
    ];

    return {
      overallScore,
      grade: this.calculateGrade(overallScore),
      factors,
      engineMetrics
    };
  }
}
