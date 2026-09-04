import { TenantContextManager, TenantContextViolationException } from '../../../core/database/tenant-context';
import {
  LLMEvaluationRecord,
  LLMSentimentAnalytics,
  LLMBiasAnalytics,
  LLMAnswerQualityAnalytics,
  LLMTokenUsageAnalytics,
  LLMLatencyAnalytics,
  LLMCostAnalytics,
  LLMModelSummary,
  LLMAnalyticsComparisonResult
} from '../domain/types';

export class LLMAnalyticsService {

  /**
   * Enforces multi-tenant context validation for all evaluation records
   */
  private enforceTenantContext(organizationId: string, records: LLMEvaluationRecord[]): void {
    if (TenantContextManager.isSystemMode()) {
      return;
    }
    const activeTenantId = TenantContextManager.getRequiredTenantId();
    if (activeTenantId !== organizationId) {
      throw new TenantContextViolationException(
        `Tenant Context Violation: Access Denied. Cross-tenant operation blocked. Target organization ${organizationId} does not match active tenant ${activeTenantId}.`
      );
    }

    // Verify individual record ownership
    for (const record of records) {
      if (record.organizationId && record.organizationId !== activeTenantId) {
        throw new TenantContextViolationException(
          `Tenant Context Violation: Record belongs to tenant ${record.organizationId}, active tenant is ${activeTenantId}.`
        );
      }
    }
  }

  /**
   * Aggregates sentiment distribution and ratio metrics
   */
  public aggregateSentiment(records: LLMEvaluationRecord[]): LLMSentimentAnalytics {
    if (!records || records.length === 0) {
      return {
        positive: 0,
        neutral: 0,
        negative: 0,
        positiveRatio: 0,
        neutralRatio: 0,
        negativeRatio: 0,
        aggregateSentimentScore: null
      };
    }

    let positive = 0;
    let neutral = 0;
    let negative = 0;
    const sentimentScores: number[] = [];

    for (const record of records) {
      if (record.sentiment === 'positive') positive++;
      else if (record.sentiment === 'negative') negative++;
      else if (record.sentiment === 'neutral') neutral++;

      if (typeof record.sentimentScore === 'number' && !Number.isNaN(record.sentimentScore) && record.sentimentScore >= 0) {
        sentimentScores.push(Math.min(record.sentimentScore, 100));
      }
    }

    const totalCount = records.length;
    const positiveRatio = parseFloat((positive / totalCount).toFixed(4));
    const neutralRatio = parseFloat((neutral / totalCount).toFixed(4));
    const negativeRatio = parseFloat((negative / totalCount).toFixed(4));

    const aggregateSentimentScore = sentimentScores.length > 0
      ? parseFloat((sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length).toFixed(1))
      : null;

    return {
      positive,
      neutral,
      negative,
      positiveRatio,
      neutralRatio,
      negativeRatio,
      aggregateSentimentScore
    };
  }

  /**
   * Aggregates bias detection metrics and categories
   */
  public analyzeBias(records: LLMEvaluationRecord[]): LLMBiasAnalytics {
    if (!records || records.length === 0) {
      return {
        biasScore: null,
        biasedAnswers: 0,
        unbiasedAnswers: 0,
        biasRate: 0,
        categories: []
      };
    }

    let biasedAnswers = 0;
    let unbiasedAnswers = 0;
    const biasScores: number[] = [];
    const categoryMap = new Map<string, number>();

    for (const record of records) {
      if (record.biasDetected === true) {
        biasedAnswers++;
      } else if (record.biasDetected === false) {
        unbiasedAnswers++;
      }

      if (typeof record.biasScore === 'number' && !Number.isNaN(record.biasScore) && record.biasScore >= 0) {
        biasScores.push(Math.min(record.biasScore, 100));
      }

      if (record.biasCategory && record.biasCategory.trim().length > 0) {
        const cat = record.biasCategory.trim().toLowerCase();
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
      }
    }

    const evaluatedCount = biasedAnswers + unbiasedAnswers;
    const biasRate = evaluatedCount > 0 ? parseFloat((biasedAnswers / evaluatedCount).toFixed(4)) : 0;

    const biasScore = biasScores.length > 0
      ? parseFloat((biasScores.reduce((a, b) => a + b, 0) / biasScores.length).toFixed(1))
      : null;

    const categories = Array.from(categoryMap.entries())
      .map(([category, occurrences]) => ({ category, occurrences }))
      .sort((a, b) => b.occurrences - a.occurrences || a.category.localeCompare(b.category));

    return {
      biasScore,
      biasedAnswers,
      unbiasedAnswers,
      biasRate,
      categories
    };
  }

  /**
   * Aggregates answer quality breakdown
   */
  public calculateAnswerQuality(records: LLMEvaluationRecord[]): LLMAnswerQualityAnalytics {
    if (!records || records.length === 0) {
      return {
        answerQualityScore: null,
        correctness: null,
        relevance: null,
        completeness: null,
        factuality: null,
        citationQuality: null
      };
    }

    const correctnessList: number[] = [];
    const relevanceList: number[] = [];
    const completenessList: number[] = [];
    const factualityList: number[] = [];
    const citationQualityList: number[] = [];
    const overallList: number[] = [];

    for (const r of records) {
      if (typeof r.correctness === 'number' && !Number.isNaN(r.correctness) && r.correctness >= 0) correctnessList.push(r.correctness);
      if (typeof r.relevance === 'number' && !Number.isNaN(r.relevance) && r.relevance >= 0) relevanceList.push(r.relevance);
      if (typeof r.completeness === 'number' && !Number.isNaN(r.completeness) && r.completeness >= 0) completenessList.push(r.completeness);
      if (typeof r.factuality === 'number' && !Number.isNaN(r.factuality) && r.factuality >= 0) factualityList.push(r.factuality);
      if (typeof r.citationQuality === 'number' && !Number.isNaN(r.citationQuality) && r.citationQuality >= 0) citationQualityList.push(r.citationQuality);
      if (typeof r.overallAnswerQuality === 'number' && !Number.isNaN(r.overallAnswerQuality) && r.overallAnswerQuality >= 0) overallList.push(r.overallAnswerQuality);
    }

    const avg = (list: number[]) => list.length > 0 ? list.reduce((a, b) => a + b, 0) / list.length : null;

    const correctness = avg(correctnessList);
    const relevance = avg(relevanceList);
    const completeness = avg(completenessList);
    const factuality = avg(factualityList);
    const citationQuality = avg(citationQualityList);

    let answerQualityScore: number | null = avg(overallList);

    if (answerQualityScore === null) {
      // Formula: correctness * 0.30 + relevance * 0.25 + completeness * 0.20 + factuality * 0.15 + citationQuality * 0.10
      let weightedSum = 0;
      let totalWeight = 0;

      if (correctness !== null) { weightedSum += correctness * 0.30; totalWeight += 0.30; }
      if (relevance !== null) { weightedSum += relevance * 0.25; totalWeight += 0.25; }
      if (completeness !== null) { weightedSum += completeness * 0.20; totalWeight += 0.20; }
      if (factuality !== null) { weightedSum += factuality * 0.15; totalWeight += 0.15; }
      if (citationQuality !== null) { weightedSum += citationQuality * 0.10; totalWeight += 0.10; }

      if (totalWeight > 0) {
        answerQualityScore = parseFloat((weightedSum / totalWeight).toFixed(1));
      }
    } else {
      answerQualityScore = parseFloat(answerQualityScore.toFixed(1));
    }

    return {
      answerQualityScore,
      correctness: correctness !== null ? parseFloat(correctness.toFixed(1)) : null,
      relevance: relevance !== null ? parseFloat(relevance.toFixed(1)) : null,
      completeness: completeness !== null ? parseFloat(completeness.toFixed(1)) : null,
      factuality: factuality !== null ? parseFloat(factuality.toFixed(1)) : null,
      citationQuality: citationQuality !== null ? parseFloat(citationQuality.toFixed(1)) : null
    };
  }

  /**
   * Aggregates token usage
   */
  public calculateTokenUsage(records: LLMEvaluationRecord[]): LLMTokenUsageAnalytics {
    if (!records || records.length === 0) {
      return {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        averageInputTokens: 0,
        averageOutputTokens: 0,
        averageTotalTokens: 0
      };
    }

    let inputTokens = 0;
    let outputTokens = 0;
    let totalTokens = 0;

    for (const r of records) {
      const inp = Math.max(r.inputTokens ?? 0, 0);
      const out = Math.max(r.outputTokens ?? 0, 0);
      const tot = Math.max(r.totalTokens ?? (inp + out), 0);

      inputTokens += inp;
      outputTokens += out;
      totalTokens += tot;
    }

    const count = records.length;

    return {
      inputTokens,
      outputTokens,
      totalTokens,
      averageInputTokens: Math.round(inputTokens / count),
      averageOutputTokens: Math.round(outputTokens / count),
      averageTotalTokens: Math.round(totalTokens / count)
    };
  }

  /**
   * Aggregates latency
   */
  public calculateLatency(records: LLMEvaluationRecord[]): LLMLatencyAnalytics {
    const latencies = records
      .map(r => r.latencyMs)
      .filter((lat): lat is number => typeof lat === 'number' && !Number.isNaN(lat) && lat >= 0);

    if (latencies.length === 0) {
      return {
        averageLatencyMs: null,
        minLatencyMs: null,
        maxLatencyMs: null
      };
    }

    const sum = latencies.reduce((a, b) => a + b, 0);
    const averageLatencyMs = Math.round(sum / latencies.length);
    const minLatencyMs = Math.min(...latencies);
    const maxLatencyMs = Math.max(...latencies);

    return {
      averageLatencyMs,
      minLatencyMs,
      maxLatencyMs
    };
  }

  /**
   * Aggregates cost
   */
  public calculateCost(records: LLMEvaluationRecord[]): LLMCostAnalytics {
    const costs = records
      .map(r => r.cost)
      .filter((c): c is number => typeof c === 'number' && !Number.isNaN(c) && c >= 0);

    if (costs.length === 0) {
      return {
        totalCost: null,
        averageCost: null,
        costPer1kTokens: null
      };
    }

    const totalCost = parseFloat(costs.reduce((a, b) => a + b, 0).toFixed(6));
    const averageCost = parseFloat((totalCost / costs.length).toFixed(6));

    const tokenUsage = this.calculateTokenUsage(records);
    const costPer1kTokens = tokenUsage.totalTokens > 0
      ? parseFloat(((totalCost / tokenUsage.totalTokens) * 1000).toFixed(6))
      : null;

    return {
      totalCost,
      averageCost,
      costPer1kTokens
    };
  }

  /**
   * Calculates dynamic performance score
   */
  public calculateModelPerformance(
    quality: LLMAnswerQualityAnalytics,
    bias: LLMBiasAnalytics,
    sentiment: LLMSentimentAnalytics,
    latency: LLMLatencyAnalytics,
    cost: LLMCostAnalytics,
    tokens: LLMTokenUsageAnalytics
  ): number {
    let weightedSum = 0;
    let totalWeight = 0;

    if (quality.answerQualityScore !== null) {
      weightedSum += quality.answerQualityScore * 0.40;
      totalWeight += 0.40;
    }

    if (bias.biasScore !== null) {
      weightedSum += bias.biasScore * 0.20;
      totalWeight += 0.20;
    }

    if (sentiment.aggregateSentimentScore !== null) {
      weightedSum += sentiment.aggregateSentimentScore * 0.10;
      totalWeight += 0.10;
    }

    if (latency.averageLatencyMs !== null) {
      const latencyEfficiency = Math.max(0, Math.min(100, 100 - (latency.averageLatencyMs / 20)));
      weightedSum += latencyEfficiency * 0.15;
      totalWeight += 0.15;
    }

    if (cost.averageCost !== null) {
      const costEfficiency = Math.max(0, Math.min(100, 100 - (cost.averageCost * 10000)));
      weightedSum += costEfficiency * 0.10;
      totalWeight += 0.10;
    }

    if (tokens.averageTotalTokens > 0) {
      const tokenEfficiency = Math.max(0, Math.min(100, 100 - (tokens.averageTotalTokens / 50)));
      weightedSum += tokenEfficiency * 0.05;
      totalWeight += 0.05;
    }

    if (totalWeight === 0) {
      return 0.0;
    }

    return parseFloat((weightedSum / totalWeight).toFixed(1));
  }

  /**
   * Evaluates and compares multiple LLM models deterministically
   */
  public compareModels(
    organizationId: string,
    records: LLMEvaluationRecord[]
  ): LLMAnalyticsComparisonResult {
    this.enforceTenantContext(organizationId, records);

    if (!records || records.length === 0) {
      return {
        organizationId,
        totalEvaluations: 0,
        models: [],
        ranking: []
      };
    }

    // Group records by model
    const groups = new Map<string, LLMEvaluationRecord[]>();
    for (const r of records) {
      const modelKey = (r.model || 'unknown-model').trim().toLowerCase();
      if (!groups.has(modelKey)) {
        groups.set(modelKey, []);
      }
      groups.get(modelKey)!.push(r);
    }

    const summaries: LLMModelSummary[] = [];

    for (const [modelKey, modelRecords] of groups.entries()) {
      const provider = modelRecords.find(r => r.provider)?.provider || 'Unknown';
      const sentiment = this.aggregateSentiment(modelRecords);
      const bias = this.analyzeBias(modelRecords);
      const qualityBreakdown = this.calculateAnswerQuality(modelRecords);
      const tokenUsage = this.calculateTokenUsage(modelRecords);
      const latency = this.calculateLatency(modelRecords);
      const cost = this.calculateCost(modelRecords);

      const performanceScore = this.calculateModelPerformance(
        qualityBreakdown,
        bias,
        sentiment,
        latency,
        cost,
        tokenUsage
      );

      summaries.push({
        model: modelKey,
        provider,
        evaluationsCount: modelRecords.length,
        performanceScore,
        answerQuality: qualityBreakdown.answerQualityScore,
        sentimentScore: sentiment.aggregateSentimentScore,
        biasScore: bias.biasScore,
        averageLatencyMs: latency.averageLatencyMs,
        averageInputTokens: tokenUsage.averageInputTokens,
        averageOutputTokens: tokenUsage.averageOutputTokens,
        averageTotalTokens: tokenUsage.averageTotalTokens,
        averageCost: cost.averageCost,
        sentiment,
        bias,
        qualityBreakdown,
        tokenUsage,
        latency,
        cost
      });
    }

    // Deterministic Ranking Order: performanceScore DESC, then model ASC
    summaries.sort((a, b) => {
      if (Math.abs(b.performanceScore - a.performanceScore) > 1e-6) {
        return b.performanceScore - a.performanceScore;
      }
      return a.model.localeCompare(b.model);
    });

    const ranking = summaries.map(s => s.model);

    return {
      organizationId,
      totalEvaluations: records.length,
      models: summaries,
      ranking
    };
  }
}
