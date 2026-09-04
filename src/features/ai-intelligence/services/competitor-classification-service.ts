import { CompetitorClassificationType } from "../domain/types";

export interface ClassificationResult {
  classification: CompetitorClassificationType;
  reason: string;
}

const MARKETPLACE_AGGREGATORS = new Set([
  "g2.com",
  "capterra.com",
  "clutch.co",
  "trustradius.com",
  "yelp.com",
  "yellowpages.com",
  "glassdoor.com",
  "indeed.com",
  "amazon.com",
  "ebay.com",
  "digikala.com",
  "torob.com",
  "emalls.ir"
]);

const CONTENT_AUTHORITIES = new Set([
  "wikipedia.org",
  "medium.com",
  "blogspot.com",
  "wordpress.com",
  "nytimes.com",
  "forbes.com",
  "techcrunch.com",
  "github.com",
  "stackoverflow.com",
  "reddit.com",
  "quora.com",
  "youtube.com"
]);

/**
 * CompetitorClassificationService
 * Responsible for applying deterministic classification rules.
 */
export class CompetitorClassificationService {
  /**
   * Deterministically classifies a competitor domain.
   */
  public classify(domain: string, notes?: string): ClassificationResult {
    if (!domain) {
      return { classification: "unknown", reason: "Insufficient evidence: missing domain identifier." };
    }

    const cleanDomain = domain.trim().toLowerCase();

    // Check directory / marketplace aggregators
    for (const aggregator of MARKETPLACE_AGGREGATORS) {
      if (cleanDomain === aggregator || cleanDomain.endsWith("." + aggregator)) {
        return {
          classification: "marketplace_aggregator",
          reason: `Deterministic Match: Matches known B2B/B2C marketplace aggregator directory (${aggregator}).`
        };
      }
    }

    // Check publishers / content authorities
    for (const authority of CONTENT_AUTHORITIES) {
      if (cleanDomain === authority || cleanDomain.endsWith("." + authority)) {
        return {
          classification: "content_authority",
          reason: `Deterministic Match: Matches known news, blogging, or reference content authority domain (${authority}).`
        };
      }
    }

    // Keyword heuristics from notes / metadata
    if (notes) {
      const lowercaseNotes = notes.toLowerCase();
      if (lowercaseNotes.includes("direct substitute") || lowercaseNotes.includes("direct competitor")) {
        return {
          classification: "direct",
          reason: "Heuristic Match: Competitor notes explicitly reference direct substitution."
        };
      }
      if (lowercaseNotes.includes("indirect") || lowercaseNotes.includes("adjacent need")) {
        return {
          classification: "indirect",
          reason: "Heuristic Match: Competitor notes explicitly reference indirect/adjacent alignment."
        };
      }
    }

    return {
      classification: "unknown",
      reason: "Insufficient evidence to safely assign a specific classification category."
    };
  }
}
