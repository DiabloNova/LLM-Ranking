import { AuditJob, IAiAuditService, FirecrawlLog } from "@/types/audit";

export class MockAiAuditService implements IAiAuditService {
  /**
   * Validates if a string is a properly formatted HTTP/HTTPS URL.
   */
  validateUrl(url: string): boolean {
    const trimmed = url.trim();
    if (!trimmed) return false;

    try {
      // If it doesn't start with http/https, try prepending it to validate
      const withProto = trimmed.match(/^https?:\/\//i) ? trimmed : `https://${trimmed}`;
      const parsed = new URL(withProto);

      // Ensure there's a valid hostname with at least one dot
      return parsed.hostname.includes(".") && parsed.hostname.length > 3;
    } catch {
      return false;
    }
  }

  /**
   * Provisions a brand new AuditJob structure ready for processing.
   */
  async provisionAuditJob(url: string): Promise<AuditJob> {
    return {
      id: `job-${Math.random().toString(36).substr(2, 9)}`,
      url: url.trim(),
      status: "idle",
      createdAt: new Date().toISOString(),
      score: 0,
      grade: "C",
      analysis: {
        geminiScore: 0,
        geminiInsights: "",
        firecrawlCrawledPagesCount: 0,
        firecrawlLogs: [],
        llmProviderInsights: []
      },
      recommendations: {
        contentGaps: [],
        missingEntities: [],
        brandPositioningImprovements: [],
        aiDiscoverabilityRecommendations: []
      }
    };
  }

  /**
   * Simulates high-fidelity crawl and AI-driven analysis.
   * Feeds the state machine real-time progress callbacks.
   */
  async simulateCrawlingAndAnalysis(
    job: AuditJob,
    onProgress: (log: string) => void
  ): Promise<AuditJob> {
    const domain = job.url.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
    const timestamp = () => new Date().toLocaleTimeString();

    // 1. Initial Handshake & crawler initialization
    onProgress(`[${timestamp()}] Initializing Firecrawl crawler cluster for ${domain}...`);
    await new Promise((r) => setTimeout(r, 800));

    // 2. Fetch Robots.txt & Sitemap crawling
    onProgress(`[${timestamp()}] Fetching robots.txt guidelines and checking crawl accessibility...`);
    await new Promise((r) => setTimeout(r, 600));

    // 3. Page Ingestion Simulation
    onProgress(`[${timestamp()}] Firecrawl successfully ingesting pages. Discovered 12 corporate pages...`);
    await new Promise((r) => setTimeout(r, 600));

    // 4. Content Parsing & Entity Extraction
    onProgress(`[${timestamp()}] Core content parsed. Initiating Google Gemini entity extraction model...`);
    await new Promise((r) => setTimeout(r, 800));

    // 5. LLM Citation and Sentiment Matching
    onProgress(`[${timestamp()}] Correlating parsed brand claims against foundational AI indices...`);
    await new Promise((r) => setTimeout(r, 800));

    // 6. Synthesizing recommendations
    onProgress(`[${timestamp()}] Formulating strategic recommendations and grading page discoverability score...`);
    await new Promise((r) => setTimeout(r, 400));

    const score = Math.floor(Math.random() * 26) + 65; // realistic score between 65 and 90
    const grade = score >= 85 ? "A" : score >= 75 ? "B" : "C";

    // Build Firecrawl crawling logs
    const firecrawlLogs: FirecrawlLog[] = [
      { timestamp: timestamp(), level: "info", message: `Crawled root path / successfully with HTTP 200.` },
      { timestamp: timestamp(), level: "info", message: `Discovered and extracted canonical schema elements.` },
      { timestamp: timestamp(), level: "warning", message: `No semantic entity-relationship schema detected in header metadata.` }
    ];

    return {
      ...job,
      status: "completed",
      score,
      grade,
      analysis: {
        geminiScore: score - 2,
        geminiInsights: `The website ${domain} demonstrates acceptable structural search layouts. However, it lacks defined schema triples for brand identity, meaning conversational agents must infer your value proposition. Ingesting clean, semantic entities will decrease hallucination risk from 14% to below 3%.`,
        firecrawlCrawledPagesCount: 12,
        firecrawlLogs,
        llmProviderInsights: [
          {
            providerName: "OpenAI GPT-4o",
            sentimentScore: score + 4,
            visibilityIndex: score - 5,
            recommendation: "Provide direct claim mapping in technical guides to avoid model retrieval bias."
          },
          {
            providerName: "Anthropic Claude 3.5 Sonnet",
            sentimentScore: score - 2,
            visibilityIndex: score + 3,
            recommendation: "Structure pricing tables using explicit XML microdata to secure exact quote citations."
          },
          {
            providerName: "Perplexity AI",
            sentimentScore: score + 1,
            visibilityIndex: score - 1,
            recommendation: "Verify references in your robots.txt to ensure the conversational crawler is permitted."
          }
        ]
      },
      recommendations: {
        contentGaps: [
          {
            issue: "Missing semantic correlation for core product specifications.",
            recommendation: "Write clear, entity-rich comparison pages stating compatibility and APIs.",
            priority: "high"
          },
          {
            issue: "Incomplete metadata mapping for executive bio profiles.",
            recommendation: "Introduce standard JSON-LD Schema on team profiles to link brand leaders with external indices.",
            priority: "medium"
          }
        ],
        missingEntities: [
          "EnterpriseBrandDefinition",
          "AeoOptimizationWorkspace",
          "VerificationSovereignty"
        ],
        brandPositioningImprovements: [
          "Explicitly declare target industry niches inside your landing page H1 titles to feed semantic neural layers.",
          "Consolidate service categories into standard semantic categories instead of complex, abstract marketing copy."
        ],
        aiDiscoverabilityRecommendations: [
          "Structure brand content in Q&A format using direct, active-voice declarations to capture Conversational Citations.",
          "Add structured semantic triples in meta-headers using seorchable schemas."
        ]
      }
    };
  }
}

export const auditService = new MockAiAuditService();
export default auditService;
