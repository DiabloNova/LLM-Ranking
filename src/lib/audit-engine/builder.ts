import { CoreIntelligenceAuditResponse, AuditWarning } from "@/types/audit";
import { normalizeUrl, isSafeUrl } from "./url-validator";
import { secureCrawl } from "./crawler";
import { extractSignals } from "./extractor";
import { extractSeoSignals } from "./seo-extractor";
import { normalizeFeatures } from "./normalizer";
import { calculateScores } from "./scorer";
import { generateRecommendations, simulateAiVisibility } from "./recommendations";
import { AuditLogger } from "./logger";

/**
 * Runs the complete Core Intelligence Audit Engine pipeline.
 * Perfectly decoupled, highly secure, deterministic, and independently testable.
 */
export async function executeAudit(
  inputUrl: string,
  tenantId: string = "system-default",
  auditId?: string
): Promise<CoreIntelligenceAuditResponse> {
  const activeAuditId = auditId || `audit-${Math.random().toString(36).substring(2, 11)}`;
  const logger = new AuditLogger(activeAuditId);

  logger.info("Executing Core Intelligence Audit pipeline", { inputUrl, tenantId });

  const warnings: AuditWarning[] = [];

  // 1. URL Normalization
  const normResult = normalizeUrl(inputUrl);
  if (!normResult.isValid || !normResult.normalizedUrl) {
    logger.error("URL Normalization step failed", new Error(normResult.error || "Invalid URL format"));
    throw new Error(`Normalization Error: ${normResult.error || "آدرس وب‌سایت معتبر نیست"}`);
  }

  const normalizedUrl = normResult.normalizedUrl;
  logger.info("URL Normalized successfully", { normalizedUrl });

  // 2. SSRF Validation Check
  if (!isSafeUrl(normalizedUrl)) {
    logger.error("SSRF security validation blocked request", new Error("Target hostname is restricted"));
    throw new Error("Security Error: دسترسی به این دامنه به دلایل امنیتی مسدود شده است (SSRF)");
  }

  const startTime = Date.now();

  // 3. Secure Crawling
  const crawlResult = await secureCrawl(normalizedUrl, logger);
  const responseTimeMs = Date.now() - startTime;

  // 4. Raw Data Extraction
  const rawSignals = await extractSignals(crawlResult, responseTimeMs, logger);

  // Extract production-grade SEO Signals
  const seoSignals = await extractSeoSignals(crawlResult, { responseTimeMs });

  // 5. Feature Normalization
  const normalizedFeatures = normalizeFeatures(rawSignals);

  // 6. Deterministic Scoring Framework
  const scores = calculateScores(normalizedFeatures);

  // 7. AI Visibility Simulation
  const visibilitySim = simulateAiVisibility(normalizedFeatures, rawSignals);

  // 8. Recommendation Framework
  const recommendations = generateRecommendations(scores, normalizedFeatures, rawSignals);

  // 9. Unified Response Construction
  // Create modular sub-properties matching our required architecture
  const result: CoreIntelligenceAuditResponse = {
    auditId: activeAuditId,
    url: inputUrl,
    normalizedUrl: crawlResult.url,
    timestamp: new Date().toISOString(),
    seoSignals,
    data: {
      technicalOptimisation: {
        signals: rawSignals.technical,
        features: normalizedFeatures.technicalHealth
      },
      aeoInsights: {
        estimatedVisibility: visibilitySim.estimatedVisibility,
        visibilityFactors: visibilitySim.visibilityFactors
      },
      llmAnalytics: {
        sentimentAlignment: "neutral",
        retrievalRiskIndex: Math.max(0, 100 - scores.breakdown.entities)
      },
      promptIntelligence: {
        suggestedTemplates: [
          `Analyze Snapp vs ${rawSignals.metadata.title || "this website"} regarding pricing.`,
          `Is ${rawSignals.metadata.title || "this website"} compatible with enterprise security standards?`
        ]
      },
      contentStudio: {
        contentGapSummary: `وب‌سایت شما هم‌اکنون دارای ${rawSignals.content.wordCount} کلمه و تعداد ${rawSignals.content.internalLinksCount} لینک داخلی است. گراف موجودیت‌های شما شامل ${rawSignals.entities.detectedEntities.join(", ") || "هیچ موجودیتی"} است.`
      },
      aiShopping: {
        productEligibilityScore: Math.round(scores.breakdown.structuredData * 0.8 + scores.breakdown.content * 0.2)
      },
      mcp: {
        mcpCompatible: rawSignals.structuredData.hasJsonLd && rawSignals.technical.isHttps
      },
      agent: {
        agentReadinessScore: Math.round(scores.overall * 0.9)
      }
    },
    scores: {
      overall: scores.overall,
      breakdown: scores.breakdown
    },
    recommendations,
    warnings
  };

  logger.info("Core Intelligence Audit pipeline completed successfully", {
    overallScore: scores.overall,
    recommendationsCount: recommendations.length
  });

  return result;
}
