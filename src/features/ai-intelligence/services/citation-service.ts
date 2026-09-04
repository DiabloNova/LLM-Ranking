import { Citation } from "../domain/types";
import { IObservationRepository } from "../repositories/interfaces";
import { ObservationRepository } from "../repositories";

export class CitationService {
  private obsRepo: IObservationRepository;

  constructor(obsRepo?: IObservationRepository) {
    this.obsRepo = obsRepo || new ObservationRepository();
  }

  /**
   * Resolve citations linked to a response observation event
   */
  public async analyzeCitations(organizationId: string, observationId: string): Promise<Citation[]> {
    return this.obsRepo.findCitationsByObservationId(organizationId, observationId);
  }

  /**
   * Helper utility to extract domain names from URLs
   */
  public extractDomain(url: string): string {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname.replace("www.", "");
    } catch {
      return "unknown-domain.com";
    }
  }

  /**
   * Calculate Domain Authority rating dynamically based on domain properties & hierarchy
   */
  public calculateAuthorityScore(url: string): number {
    const domain = this.extractDomain(url).toLowerCase();

    // High authority domains
    if (domain.endsWith(".gov")) return 98;
    if (domain.endsWith(".edu")) return 95;

    // Core trusted sources
    const authorityMap: Record<string, number> = {
      "wikipedia.org": 96,
      "github.com": 92,
      "techcrunch.com": 85,
      "medium.com": 75,
      "stackoverflow.com": 88,
      "reddit.com": 70,
      "news.ycombinator.com": 80,
      "nytimes.com": 92,
      "bloomberg.com": 90,
      "forbes.com": 88,
      "reuters.com": 94
    };

    // Robust suffix/exact matching
    for (const [key, value] of Object.entries(authorityMap)) {
      if (domain === key || domain.endsWith("." + key)) {
        return value;
      }
    }

    // Default heuristics based on domain suffixes
    if (domain.endsWith(".org")) return 75;
    if (domain.endsWith(".net")) return 60;
    if (domain.endsWith(".io")) return 65;
    if (domain.endsWith(".ir")) return 55; // Phase 1 localized market domain

    return 50; // default base authority
  }

  /**
   * Create and record a new citation linked to an observation response inside a tenant boundary
   */
  public async addCitation(
    organizationId: string,
    observationId: string,
    url: string,
    title: string,
    relevanceScore: number = 80,
    actorId = "system"
  ): Promise<Citation> {
    const domain = this.extractDomain(url);
    const authorityScore = this.calculateAuthorityScore(url);

    const citation: Citation = {
      id: `cit-${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      observationId,
      url,
      domain,
      title,
      authorityScore,
      relevanceScore: Math.min(Math.max(relevanceScore, 0), 100),
      audit: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: actorId,
        updatedBy: actorId,
        version: 1
      }
    };

    return this.obsRepo.saveCitation(citation);
  }
}
