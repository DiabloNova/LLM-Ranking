export type AuditStatus = "idle" | "invalid-url" | "loading" | "auth-required" | "processing" | "completed" | "error";

export interface FirecrawlLog {
  timestamp: string;
  level: "info" | "warning" | "error";
  message: string;
}

export interface LLMProviderInsight {
  providerName: string;
  sentimentScore: number; // 0-100
  visibilityIndex: number; // 0-100
  recommendation: string;
}

export interface AIAnalysisResult {
  geminiScore: number;
  geminiInsights: string;
  firecrawlCrawledPagesCount: number;
  firecrawlLogs: FirecrawlLog[];
  llmProviderInsights: LLMProviderInsight[];
}

export interface RecommendationItem {
  issue: string;
  recommendation: string;
  priority: "high" | "medium" | "low";
}

export interface RecommendationResult {
  contentGaps: RecommendationItem[];
  missingEntities: string[];
  brandPositioningImprovements: string[];
  aiDiscoverabilityRecommendations: string[];
}

export interface AuditJob {
  id: string;
  url: string;
  status: AuditStatus;
  createdAt: string;
  score: number; // 0-100
  grade: "A" | "B" | "C" | "D" | "F";
  analysis: AIAnalysisResult;
  recommendations: RecommendationResult;
}

/**
 * Interface definition for a future backend API Client or service.
 * Separating provider business logic from the React UI components.
 */
export interface IAiAuditService {
  validateUrl: (url: string) => boolean;
  provisionAuditJob: (url: string) => Promise<AuditJob>;
  simulateCrawlingAndAnalysis: (job: AuditJob, onProgress: (log: string) => void) => Promise<AuditJob>;
}

// ============================================================================
// Core Intelligence Audit Engine - Stable Contracts (Phase 2)
// ============================================================================

export interface UrlNormalizationResult {
  originalUrl: string;
  normalizedUrl: string;
  isValid: boolean;
  error?: string;
}

export interface CrawlResult {
  url: string;
  statusCode: number;
  headers: Record<string, string>;
  isHttps: boolean;
  redirectChain: string[];
  redirectDepth: number;
  bodySize: number;
  rawHtml: string;
}

export interface TechnicalSignals {
  statusCode: number;
  isHttps: boolean;
  hasCanonical: boolean;
  canonicalUrl?: string;
  robotsTxtAllowed: boolean;
  sitemapAvailable: boolean;
  responseTimeMs: number;
  headers: Record<string, string>;
}

export interface ContentSignals {
  wordCount: number;
  headingHierarchy: Record<string, number>; // e.g., { h1: 1, h2: 4, h3: 10 }
  paragraphCount: number;
  internalLinksCount: number;
  externalLinksCount: number;
  imageCount: number;
  missingAltCount: number;
  hasAuthor: boolean;
  hasPublishDate: boolean;
}

export interface EntitySignals {
  detectedEntities: string[];
  entityDensity: number;
  hasBrandEntity: boolean;
}

export interface StructuredDataSignals {
  hasJsonLd: boolean;
  schemaTypes: string[]; // e.g. ["Organization", "Article", "FAQPage", "Product"]
  isValidSchema: boolean;
}

export interface RawWebsiteSignals {
  technical: TechnicalSignals;
  metadata: Record<string, string>;
  content: ContentSignals;
  entities: EntitySignals;
  structuredData: StructuredDataSignals;
}

export interface NormalizedIntelligenceFeatures {
  technicalHealth: {
    score: number;
    factors: string[];
  };
  contentQuality: {
    score: number;
    factors: string[];
  };
  entitySignals: {
    score: number;
    factors: string[];
  };
  structuredDataSignals: {
    score: number;
    factors: string[];
  };
}

export interface ScoreContributor {
  name: string;
  points: number;
  isPositive: boolean;
  description: string;
}

export interface ScoreStructure {
  overall: number;
  breakdown: {
    technical: number;
    content: number;
    entities: number;
    structuredData: number;
  };
  contributors: ScoreContributor[];
}

export interface CoreRecommendation {
  id: string;
  category: "technical" | "content" | "entity" | "structured_data";
  priority: "high" | "medium" | "low";
  impactScore: number;
  issue: string;
  recommendation: string;
}

export interface AuditWarning {
  code: string;
  message: string;
}

export interface AuditError {
  code: string;
  message: string;
  details?: string;
}

import { SeoSignals } from "./seo-signals";

export interface CoreIntelligenceAuditResponse {
  auditId: string;
  url: string;
  normalizedUrl: string;
  timestamp: string;
  seoSignals?: SeoSignals;
  data: {
    technicalOptimisation: {
      signals: TechnicalSignals;
      features: NormalizedIntelligenceFeatures["technicalHealth"];
    };
    aeoInsights: {
      estimatedVisibility: number;
      visibilityFactors: string[];
    };
    llmAnalytics: {
      sentimentAlignment: "positive" | "neutral" | "negative";
      retrievalRiskIndex: number; // 0-100
    };
    promptIntelligence: {
      suggestedTemplates: string[];
    };
    contentStudio: {
      contentGapSummary: string;
    };
    aiShopping: {
      productEligibilityScore: number; // 0-100
    };
    mcp: {
      mcpCompatible: boolean;
    };
    agent: {
      agentReadinessScore: number; // 0-100
    };
  };
  scores: {
    overall: number;
    breakdown: Record<string, number>;
  };
  recommendations: CoreRecommendation[];
  warnings: AuditWarning[];
}
