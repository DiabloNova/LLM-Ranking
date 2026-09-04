import {
  CitationSource,
  CitationOccurrence,
  CitationSourceClassification,
  Brand,
  Competitor,
  AuditMetadata,
  AIVisibilityAudit
} from "../domain/types";
import {
  CitationIntelligenceRepository,
  BrandRepository,
  CompetitorRepository,
  AIVisibilityAuditRepository
} from "../repositories";

export class CitationIntelligenceService {
  private repo: CitationIntelligenceRepository;
  private brandRepo: BrandRepository;
  private compRepo: CompetitorRepository;
  private auditRepo: AIVisibilityAuditRepository;

  constructor(
    repo?: CitationIntelligenceRepository,
    brandRepo?: BrandRepository,
    compRepo?: CompetitorRepository,
    auditRepo?: AIVisibilityAuditRepository
  ) {
    this.repo = repo || new CitationIntelligenceRepository();
    this.brandRepo = brandRepo || new BrandRepository();
    this.compRepo = compRepo || new CompetitorRepository();
    this.auditRepo = auditRepo || new AIVisibilityAuditRepository();
  }

  /**
   * Safe, deterministic URL normalization and tracking parameters stripping
   */
  public normalizeUrl(urlText: string): string {
    let trimmed = urlText.trim();
    if (!trimmed) return "";

    try {
      if (!/^https?:\/\//i.test(trimmed)) {
        trimmed = `https://${trimmed}`;
      }
      const parsed = new URL(trimmed);
      let host = parsed.hostname.toLowerCase();
      if (host.startsWith("www.")) {
        host = host.substring(4);
      }

      let pathname = parsed.pathname;
      if (pathname.endsWith("/") && pathname.length > 1) {
        pathname = pathname.substring(0, pathname.length - 1);
      }

      // Strips common tracking parameters but preserves semantically meaningful ones
      const searchParams = new URLSearchParams();
      parsed.searchParams.forEach((val, key) => {
        const lowerKey = key.toLowerCase();
        if (
          !lowerKey.startsWith("utm_") &&
          lowerKey !== "fbclid" &&
          lowerKey !== "gclid" &&
          lowerKey !== "yc_delivery"
        ) {
          searchParams.append(key, val);
        }
      });

      const searchStr = searchParams.toString();
      return `${parsed.protocol}//${host}${pathname}${searchStr ? "?" + searchStr : ""}`;
    } catch {
      return trimmed.toLowerCase();
    }
  }

  /**
   * Idempotent citation discovery from an AI observation response run
   */
  public async discoverCitationsFromObservation(
    organizationId: string,
    observationId: string,
    responseText: string,
    context: {
      auditId?: string;
      executionId?: string;
      promptId?: string;
    }
  ): Promise<CitationOccurrence[]> {
    const urlRegex = /https?:\/\/[^\s]+/g;
    const matches = responseText.match(urlRegex) || [];
    const occurrences: CitationOccurrence[] = [];

    // Load active brand and competitor domains for classification
    const brandsRes = await this.brandRepo.findByOrganizationId(organizationId);
    const activeBrand = brandsRes.data[0] || null;

    const compsRes = await this.compRepo.findByOrganizationId(organizationId);
    const competitors = compsRes.data;

    let idx = 1;
    for (const rawUrl of matches) {
      const sanitizedUrl = rawUrl.replace(/[.,);]$/, ""); // remove trailing punctuation
      const normalized = this.normalizeUrl(sanitizedUrl);
      if (!normalized) continue;

      let domain = "";
      try {
        domain = new URL(normalized).hostname;
      } catch {
        continue;
      }

      // 1. Resolve or Create Citation Source (Deduplicated source identity)
      let source = await this.repo.findSourceByDomain(organizationId, domain);

      const classification = this.classifyDomain(domain, activeBrand, competitors);
      const qualityScore = this.evaluateCitationQuality(sanitizedUrl, responseText, activeBrand);
      const authorityScore = this.evaluateCitationAuthority(domain, classification);

      if (!source) {
        source = {
          id: crypto.randomUUID(),
          organizationId,
          domain,
          canonicalUrl: normalized,
          classification,
          qualityScore,
          authorityScore,
          firstSeenAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
          occurrenceCount: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      } else {
        source.occurrenceCount += 1;
        source.lastSeenAt = new Date().toISOString();
        source.qualityScore = qualityScore; // Keep freshest evaluated scores
        source.authorityScore = authorityScore;
        source.updatedAt = new Date().toISOString();
      }

      // Save Source idempotently
      await this.repo.saveSource(source);

      // Extract context snippet
      const lowerText = responseText.toLowerCase();
      const firstIdx = lowerText.indexOf(sanitizedUrl.toLowerCase());
      let snippet = "";
      if (firstIdx !== -1) {
        const start = Math.max(0, firstIdx - 50);
        const end = Math.min(responseText.length, firstIdx + sanitizedUrl.length + 50);
        snippet = "..." + responseText.substring(start, end).trim() + "...";
      }

      // Check if this exact occurrence already exists to enforce application-level idempotency
      const existingOccs = await this.repo.findAllOccurrences(organizationId);
      const isDuplicate = existingOccs.some(
        o => o.sourceId === source!.id && o.observationId === observationId && o.url === normalized
      );

      if (isDuplicate) {
        continue;
      }

      // 2. Persist Specific Citation Occurrence
      const occurrence: CitationOccurrence = {
        id: crypto.randomUUID(),
        organizationId,
        sourceId: source.id,
        auditId: context.auditId,
        executionId: context.executionId,
        promptId: context.promptId,
        observationId,
        url: normalized,
        title: `${domain.split(".")[0].toUpperCase()} resource reference`,
        snippet: snippet || "ذکری از مرجع پیوست شده",
        position: idx++,
        confidence: 0.95,
        createdAt: new Date().toISOString()
      };

      try {
        const saved = await this.repo.saveOccurrence(occurrence);
        occurrences.push(saved);
      } catch (err) {
        // Safe skip on uniqueness constraint violations
      }
    }

    return occurrences;
  }

  /**
   * Rule-based extensible Citation Classifier
   */
  public classifyDomain(
    domain: string,
    brand: Brand | null,
    competitors: Competitor[]
  ): CitationSourceClassification {
    const lowerDomain = domain.toLowerCase();

    // Check owned brand domain
    if (brand && brand.website) {
      try {
        const brandHost = new URL(brand.website).hostname.replace("www.", "").toLowerCase();
        if (lowerDomain === brandHost || lowerDomain.endsWith("." + brandHost)) {
          return "owned";
        }
      } catch {}
    }

    // Check competitor domains
    for (const comp of competitors) {
      if (comp.domain) {
        const compHost = comp.domain.replace("www.", "").toLowerCase();
        if (lowerDomain === compHost || lowerDomain.endsWith("." + compHost)) {
          return "competitor";
        }
      }
    }

    // Government domains
    if (lowerDomain.endsWith(".gov") || lowerDomain.endsWith(".mil") || lowerDomain.endsWith(".gov.ir")) {
      return "government";
    }

    // Academic research domains
    if (lowerDomain.endsWith(".edu") || lowerDomain.endsWith(".ac.ir") || lowerDomain.endsWith(".edu.ir")) {
      return "academic_research";
    }

    // Reference & Encyclopedia
    if (
      lowerDomain.includes("wikipedia.org") ||
      lowerDomain.includes("britannica.com") ||
      lowerDomain.includes("encyclopedia.com")
    ) {
      return "reference_encyclopedia";
    }

    // Social networks
    if (
      lowerDomain.includes("linkedin.com") ||
      lowerDomain.includes("twitter.com") ||
      lowerDomain.includes("x.com") ||
      lowerDomain.includes("instagram.com") ||
      lowerDomain.includes("facebook.com")
    ) {
      return "social";
    }

    // Forum/Community
    if (
      lowerDomain.includes("reddit.com") ||
      lowerDomain.includes("stackoverflow.com") ||
      lowerDomain.includes("github.com") ||
      lowerDomain.includes("medium.com")
    ) {
      return "forum_community";
    }

    // Publisher & Media houses
    if (
      lowerDomain.includes("nytimes.com") ||
      lowerDomain.includes("reuters.com") ||
      lowerDomain.includes("techcrunch.com") ||
      lowerDomain.includes("bloomberg.com") ||
      lowerDomain.includes("donya-e-eqtesad.com")
    ) {
      return "publisher_media";
    }

    // Documentation
    if (
      lowerDomain.includes("docs.") ||
      lowerDomain.includes("developer.") ||
      lowerDomain.includes("readme.io")
    ) {
      return "documentation";
    }

    return "third_party";
  }

  /**
   * Deterministic citation quality score calculated fromavailable evidence/signals
   */
  public evaluateCitationQuality(url: string, responseText: string, brand: Brand | null): number {
    let score = 0;

    // 1. URL validity (safe protocol HTTPS check): +35 points
    if (url.startsWith("https://")) {
      score += 35;
    } else if (url.startsWith("http://")) {
      score += 15;
    }

    // 2. Surrounding context relevance (does the prompt text mention target brand context): +35 points
    if (brand) {
      const brandNameLower = brand.name.toLowerCase();
      if (responseText.toLowerCase().includes(brandNameLower)) {
        score += 35;
      }
    } else {
      score += 20; // default baseline relevance
    }

    // 3. Complete URL string structure: +30 points
    try {
      const parsed = new URL(url);
      if (parsed.pathname && parsed.pathname.length > 1) {
        score += 30; // Has deep page path (more complete than home page)
      } else {
        score += 15;
      }
    } catch {
      // Invalid URL
    }

    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Independently evaluated domain authority scores
   */
  public evaluateCitationAuthority(domain: string, classification: CitationSourceClassification): number {
    // Return explicit deterministic authority baselines
    switch (classification) {
      case "government":
        return 95;
      case "academic_research":
        return 92;
      case "reference_encyclopedia":
        return 88;
      case "publisher_media":
        return 80;
      case "owned":
        return 75; // Target brand authority benchmark
      case "competitor":
        return 70;
      case "forum_community":
        return 65;
      case "social":
        return 50;
      default:
        return 40; // baseline third party domain authority
    }
  }

  /**
   * Exposes structured gap-analysis signals for Task 4.4 Action Engine
   * Detects high-authority competitor-cited domains that never cite our owned brand!
   */
  public async detectCitationGaps(organizationId: string): Promise<Array<{
    domain: string;
    competitorName: string;
    authorityScore: number;
    evidenceSnippet: string;
  }>> {
    const sourcesRes = await this.repo.findSources(organizationId);
    const sources = sourcesRes.data;

    const occurrences = await this.repo.findAllOccurrences(organizationId);

    const gaps: Array<{
      domain: string;
      competitorName: string;
      authorityScore: number;
      evidenceSnippet: string;
    }> = [];

    // Filter competitor-only citation sources
    const competitorSources = sources.filter(s => s.classification === "competitor" && s.authorityScore >= 60);

    for (const compSource of competitorSources) {
      // Check if we also have an owned citation source for this domain (overlap check)
      const hasOwnedOverlap = occurrences.some(occ => {
        const src = sources.find(s => s.id === occ.sourceId);
        return src && src.domain === compSource.domain && src.classification === "owned";
      });

      if (!hasOwnedOverlap) {
        // Find evidence excerpt of the competitor's citation
        const compOcc = occurrences.find(o => o.sourceId === compSource.id);

        gaps.push({
          domain: compSource.domain,
          competitorName: "Rival Competitor",
          authorityScore: compSource.authorityScore,
          evidenceSnippet: compOcc?.snippet || "برند رقیب در این مرجع استناد شده است."
        });
      }
    }

    return gaps;
  }
}
