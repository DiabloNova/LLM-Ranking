/**
 * Task 8.3 — LLM Analytics Integration & Security Test Suite
 * Verifies model comparison, sentiment, bias, answer quality, token usage, latency, cost,
 * aggregate performance scoring, missing-metrics handling, deterministic model ranking,
 * multi-tenant security boundaries, and exact deep equality determinism.
 */

import * as assert from 'assert';
import { TenantContextManager, TenantContextViolationException } from '../../../src/core/database/tenant-context';
import { LLMAnalyticsService } from '../../../src/features/ai-intelligence/services/llm-analytics-service';
import { LLMEvaluationRecord } from '../../../src/features/ai-intelligence/domain/types';

export async function runLLMAnalyticsTests() {
  console.log('=========================================================================');
  console.log('LLM ANALYTICS — INTEGRATION, SECURITY & DETERMINISM TEST SUITE');
  console.log('=========================================================================');

  const tenantA = 'org-tenant-alpha-llm-83';
  const tenantB = 'org-tenant-beta-llm-83';

  const analyticsService = new LLMAnalyticsService();

  try {
    // ----------------------------------------------------
    // 1. Empty Dataset Handling
    // ----------------------------------------------------
    console.log('▶ TEST 1: Empty Evaluation Dataset Handling...');

    await TenantContextManager.runWithTenantContext(tenantA, 'usr-test-1', 'req-llm-e1', async () => {
      const emptyRes = analyticsService.compareModels(tenantA, []);
      assert.strictEqual(emptyRes.organizationId, tenantA);
      assert.strictEqual(emptyRes.totalEvaluations, 0);
      assert.strictEqual(emptyRes.models.length, 0);
      assert.strictEqual(emptyRes.ranking.length, 0);
    });

    console.log('  ✅ Empty dataset returns clean structure without errors.');

    // ----------------------------------------------------
    // 2. Single-Model & Multiple-Model Comparison
    // ----------------------------------------------------
    console.log('▶ TEST 2: Single-Model & Multiple-Model Comparison...');

    const sampleRecords: LLMEvaluationRecord[] = [
      {
        id: 'eval-01',
        organizationId: tenantA,
        model: 'gemini-1.5-pro',
        provider: 'Google',
        evaluatedAt: new Date().toISOString(),
        correctness: 90,
        relevance: 85,
        completeness: 80,
        factuality: 95,
        citationQuality: 90,
        sentiment: 'positive',
        sentimentScore: 88,
        biasDetected: false,
        biasScore: 95,
        latencyMs: 750,
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500,
        cost: 0.003
      },
      {
        id: 'eval-02',
        organizationId: tenantA,
        model: 'gemini-1.5-pro',
        provider: 'Google',
        evaluatedAt: new Date().toISOString(),
        correctness: 88,
        relevance: 90,
        completeness: 85,
        factuality: 90,
        citationQuality: 85,
        sentiment: 'positive',
        sentimentScore: 90,
        biasDetected: false,
        biasScore: 90,
        latencyMs: 850,
        inputTokens: 1100,
        outputTokens: 550,
        totalTokens: 1650,
        cost: 0.0035
      },
      {
        id: 'eval-03',
        organizationId: tenantA,
        model: 'gpt-4o',
        provider: 'OpenAI',
        evaluatedAt: new Date().toISOString(),
        correctness: 75,
        relevance: 70,
        completeness: 65,
        factuality: 80,
        citationQuality: 70,
        sentiment: 'neutral',
        sentimentScore: 60,
        biasDetected: true,
        biasScore: 60,
        biasCategory: 'framing',
        latencyMs: 1200,
        inputTokens: 2000,
        outputTokens: 1000,
        totalTokens: 3000,
        cost: 0.012
      }
    ];

    await TenantContextManager.runWithTenantContext(tenantA, 'usr-test-1', 'req-llm-m1', async () => {
      const res = analyticsService.compareModels(tenantA, sampleRecords);

      assert.strictEqual(res.organizationId, tenantA);
      assert.strictEqual(res.totalEvaluations, 3);
      assert.strictEqual(res.models.length, 2);

      // Model A (gemini-1.5-pro) should rank higher than Model B (gpt-4o)
      assert.strictEqual(res.ranking[0], 'gemini-1.5-pro');
      assert.strictEqual(res.ranking[1], 'gpt-4o');

      const geminiSummary = res.models.find(m => m.model === 'gemini-1.5-pro')!;
      assert.strictEqual(geminiSummary.evaluationsCount, 2);
      assert.strictEqual(geminiSummary.provider, 'Google');
      assert.ok(geminiSummary.performanceScore > 80);
      assert.strictEqual(geminiSummary.sentiment.positive, 2);
      assert.strictEqual(geminiSummary.bias.biasedAnswers, 0);

      const gpt4Summary = res.models.find(m => m.model === 'gpt-4o')!;
      assert.strictEqual(gpt4Summary.evaluationsCount, 1);
      assert.strictEqual(gpt4Summary.bias.biasedAnswers, 1);
      assert.strictEqual(gpt4Summary.bias.categories[0].category, 'framing');
    });

    console.log('  ✅ Multiple-model comparison and summaries verified.');

    // ----------------------------------------------------
    // 3. Sentiment, Bias, Quality, Token, Latency & Cost Aggregations
    // ----------------------------------------------------
    console.log('▶ TEST 3-10: Sub-system Aggregations (Sentiment, Bias, Quality, Tokens, Latency, Cost)...');

    // Sentiment Aggregation
    const sentimentAgg = analyticsService.aggregateSentiment(sampleRecords);
    assert.strictEqual(sentimentAgg.positive, 2);
    assert.strictEqual(sentimentAgg.neutral, 1);
    assert.strictEqual(sentimentAgg.negative, 0);
    assert.strictEqual(parseFloat(sentimentAgg.positiveRatio.toFixed(2)), 0.67);
    assert.strictEqual(sentimentAgg.aggregateSentimentScore, 79.3);

    // Bias Aggregation
    const biasAgg = analyticsService.analyzeBias(sampleRecords);
    assert.strictEqual(biasAgg.biasedAnswers, 1);
    assert.strictEqual(biasAgg.unbiasedAnswers, 2);
    assert.strictEqual(parseFloat(biasAgg.biasRate.toFixed(2)), 0.33);
    assert.strictEqual(biasAgg.biasScore, 81.7);
    assert.strictEqual(biasAgg.categories.length, 1);

    // Answer Quality
    const qualityAgg = analyticsService.calculateAnswerQuality(sampleRecords);
    assert.ok(qualityAgg.answerQualityScore! > 70);

    // Token Usage
    const tokenAgg = analyticsService.calculateTokenUsage(sampleRecords);
    assert.strictEqual(tokenAgg.inputTokens, 4100);
    assert.strictEqual(tokenAgg.outputTokens, 2050);
    assert.strictEqual(tokenAgg.totalTokens, 6150);
    assert.strictEqual(tokenAgg.averageTotalTokens, 2050);

    // Latency
    const latencyAgg = analyticsService.calculateLatency(sampleRecords);
    assert.strictEqual(latencyAgg.minLatencyMs, 750);
    assert.strictEqual(latencyAgg.maxLatencyMs, 1200);
    assert.strictEqual(latencyAgg.averageLatencyMs, 933);

    // Cost
    const costAgg = analyticsService.calculateCost(sampleRecords);
    assert.strictEqual(costAgg.totalCost, 0.0185);
    assert.strictEqual(costAgg.averageCost, 0.006167);

    console.log('  ✅ Sub-system aggregations verified.');

    // ----------------------------------------------------
    // 4. Missing Metrics & Dynamic Renormalization
    // ----------------------------------------------------
    console.log('▶ TEST 11: Missing Metrics Handling...');

    const partialRecords: LLMEvaluationRecord[] = [
      {
        id: 'partial-01',
        organizationId: tenantA,
        model: 'partial-model',
        evaluatedAt: new Date().toISOString(),
        correctness: 80,
        relevance: 80
        // Missing latency, missing cost, missing sentiment, missing bias
      }
    ];

    await TenantContextManager.runWithTenantContext(tenantA, 'usr-test-1', 'req-llm-p1', async () => {
      const res = analyticsService.compareModels(tenantA, partialRecords);
      const summary = res.models[0];

      // Missing operational/sentiment/bias metrics must be null
      assert.strictEqual(summary.sentimentScore, null);
      assert.strictEqual(summary.biasScore, null);
      assert.strictEqual(summary.averageLatencyMs, null);
      assert.strictEqual(summary.averageCost, null);

      // Performance score should be calculated from quality alone without converting missing metrics to zero
      assert.strictEqual(summary.performanceScore, 80);
    });

    console.log('  ✅ Missing metrics handling and dynamic score normalization verified.');

    // ----------------------------------------------------
    // 5. Deterministic Tie-Breaking
    // ----------------------------------------------------
    console.log('▶ TEST 12: Deterministic Tie-Breaking for Equal Scores...');

    const tieRecords: LLMEvaluationRecord[] = [
      {
        id: 'tie-01',
        organizationId: tenantA,
        model: 'model-zebra',
        evaluatedAt: new Date().toISOString(),
        correctness: 90
      },
      {
        id: 'tie-02',
        organizationId: tenantA,
        model: 'model-alpha',
        evaluatedAt: new Date().toISOString(),
        correctness: 90
      }
    ];

    await TenantContextManager.runWithTenantContext(tenantA, 'usr-test-1', 'req-llm-tie', async () => {
      const res = analyticsService.compareModels(tenantA, tieRecords);
      assert.strictEqual(res.models[0].performanceScore, res.models[1].performanceScore);
      // Secondary tie-breaker: model identifier ASC ('model-alpha' before 'model-zebra')
      assert.strictEqual(res.ranking[0], 'model-alpha');
      assert.strictEqual(res.ranking[1], 'model-zebra');
    });

    console.log('  ✅ Deterministic tie-breaking verified.');

    // ----------------------------------------------------
    // 6. Zero-Trust Multi-Tenant Security Isolation
    // ----------------------------------------------------
    console.log('▶ TEST 13: Zero-Trust Multi-Tenant Security Isolation...');

    const tenantBRecords: LLMEvaluationRecord[] = [
      {
        id: 'eval-b1',
        organizationId: tenantB,
        model: 'gemini-1.5-pro',
        evaluatedAt: new Date().toISOString(),
        correctness: 100
      }
    ];

    // Attempting to evaluate Tenant B records under Tenant A context must throw
    let isolationBlocked = false;
    try {
      await TenantContextManager.runWithTenantContext(tenantA, 'usr-test-1', 'req-llm-sec', async () => {
        analyticsService.compareModels(tenantA, tenantBRecords);
      });
    } catch (err: unknown) {
      isolationBlocked = true;
      assert.ok(err instanceof TenantContextViolationException);
    }
    assert.strictEqual(isolationBlocked, true, 'SECURITY FAILURE: Cross-tenant evaluation processing allowed!');

    console.log('  ✅ Multi-tenant isolation boundary verified.');

    // ----------------------------------------------------
    // 7. Explicit End-to-End Deep Equality Determinism Test
    // ----------------------------------------------------
    console.log('▶ TEST 15: Explicit End-to-End Deep Equality Determinism Test...');

    let run1: any;
    let run2: any;
    let run3: any;

    await TenantContextManager.runWithTenantContext(tenantA, 'usr-test-1', 'req-llm-det1', async () => {
      run1 = analyticsService.compareModels(tenantA, sampleRecords);
    });

    await TenantContextManager.runWithTenantContext(tenantA, 'usr-test-1', 'req-llm-det2', async () => {
      run2 = analyticsService.compareModels(tenantA, sampleRecords);
    });

    await TenantContextManager.runWithTenantContext(tenantA, 'usr-test-1', 'req-llm-det3', async () => {
      run3 = analyticsService.compareModels(tenantA, sampleRecords);
    });

    assert.deepStrictEqual(run1, run2);
    assert.deepStrictEqual(run2, run3);

    console.log('  ✅ Deep equality verified across 3 identical LLM Analytics runs.');

    console.log('=========================================================================');
    console.log('✅ ALL LLM ANALYTICS TESTS PASSED SUCCESSFULLY!');
    console.log('=========================================================================');

  } catch (err: unknown) {
    console.error('❌ LLM Analytics Test Suite failed:', err);
    throw err;
  }
}

if (require.main === module) {
  runLLMAnalyticsTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
