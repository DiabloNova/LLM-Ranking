import { randomUUID } from "crypto";
import { Competitor, CompetitorStatusType, AuditMetadata, CitationSourceClassification } from "../domain/types";
import { ICompetitorRepository } from "../repositories/interfaces";

export interface DiscoveryEvidenceRecord {
  signal: string; // e.g. 'explicit_competitor', 'crawl_external_link', 'citation_domain', 'extracted_entity'
  sourceReference?: string; // e.g. page URL, citation URL, prompt execution ID
  timestamp: string;
  normalizedDomain: string;
  reason: string;
}

export interface DiscoveryResult {
  domain: string;
  isCompetitor: boolean;
  rejectionReason?: "self-domain" | "invalid domain" | "duplicate" | "unrelated domain" | "insufficient evidence" | "excluded domain" | "manually rejected";
  evidence?: DiscoveryEvidenceRecord;
  confidence?: number;
}

/**
 * Validates domain format.
 * Must contain at least one dot, no spaces, only valid characters.
 */
export function isValidHostname(host: string): boolean {
  if (!host) return false;
  const cleaned = host.trim().toLowerCase();
  if (cleaned.includes(" ") || cleaned.includes("/") || cleaned.includes(":") || cleaned.includes("@")) {
    return false;
  }
  const parts = cleaned.split(".");
  if (parts.length < 2) return false;
  const hostRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;
  return parts.every(part => part && hostRegex.test(part));
}

/**
 * Normalizes domain according to project's canonical policy.
 */
export function normalizeDomain(input: string): string {
  if (!input) return "";
  let cleaned = input.trim().toLowerCase();
  // Strip protocol and www.
  cleaned = cleaned.replace(/^(https?:\/\/)?(www\.)?/i, "");
  // Remove path, query, and fragment
  cleaned = cleaned.split("/")[0];
  // Remove port if present
  cleaned = cleaned.split(":")[0];
  // Remove trailing dot
  if (cleaned.endsWith(".")) {
    cleaned = cleaned.slice(0, -1);
  }
  return cleaned;
}

/**
 * CompetitorDiscoveryService
 * Consumes existing discovery/intelligence signals and maintains competitor candidates.
 */
export class CompetitorDiscoveryService {
  constructor(private readonly competitorRepo: ICompetitorRepository) {}

  /**
   * Evaluates a candidate domain.
   */
  public evaluateCandidate(
    candidateRaw: string,
    targetDomain: string,
    signal: string,
    sourceReference?: string,
    reason?: string
  ): DiscoveryResult {
    const normalizedTarget = normalizeDomain(targetDomain);
    const normalizedCandidate = normalizeDomain(candidateRaw);

    if (!isValidHostname(normalizedCandidate)) {
      return {
        domain: normalizedCandidate || candidateRaw,
        isCompetitor: false,
        rejectionReason: "invalid domain"
      };
    }

    if (normalizedCandidate === normalizedTarget) {
      return {
        domain: normalizedCandidate,
        isCompetitor: false,
        rejectionReason: "self-domain"
      };
    }

    // Default confidence scoring based on signals
    let confidence = 0.5;
    if (signal === "explicit_competitor") {
      confidence = 1.0;
    } else if (signal === "extracted_entity") {
      confidence = 0.85;
    } else if (signal === "citation_domain") {
      confidence = 0.75;
    } else if (signal === "crawl_external_link") {
      confidence = 0.6;
    }

    const evidence: DiscoveryEvidenceRecord = {
      signal,
      sourceReference,
      timestamp: new Date().toISOString(),
      normalizedDomain: normalizedCandidate,
      reason: reason || `Discovered via signal: ${signal}`
    };

    return {
      domain: normalizedCandidate,
      isCompetitor: true,
      evidence,
      confidence
    };
  }

  /**
   * Process explicit competitor domains supplied by user.
   */
  public async discoverExplicitCompetitors(
    organizationId: string,
    targetDomain: string,
    domains: string[],
    createdBy = "system"
  ): Promise<Competitor[]> {
    const competitors: Competitor[] = [];

    // Deduplicate domains first on normalization
    const uniqueDomains = Array.from(new Set(domains.map(d => normalizeDomain(d))));

    for (const rawDomain of uniqueDomains) {
      const evaluation = this.evaluateCandidate(
        rawDomain,
        targetDomain,
        "explicit_competitor",
        undefined,
        "Explicitly supplied by user/organization as competitor."
      );

      if (!evaluation.isCompetitor) {
        console.debug(`[CompetitorDiscoveryService] Candidate ${rawDomain} rejected: ${evaluation.rejectionReason}`);
        continue;
      }

      // Check if candidate already exists
      const existing = await this.competitorRepo.findByDomain(organizationId, evaluation.domain);
      if (existing) {
        // Idempotent: running again must not create duplicates or disrupt existing profiles.
        // We will return the existing record.
        competitors.push(existing);
        continue;
      }

      const id = randomUUID();
      const name = evaluation.domain.split(".")[0];
      const displayName = name.charAt(0).toUpperCase() + name.slice(1);

      const competitor: Competitor = {
        id,
        organizationId,
        name: displayName,
        domain: evaluation.domain,
        status: "candidate",
        classification: "unknown",
        discoverySource: evaluation.evidence?.signal,
        discoveryEvidence: evaluation.evidence as any,
        confidence: evaluation.confidence,
        firstDiscoveredAt: new Date().toISOString(),
        lastObservedAt: new Date().toISOString(),
        monitoringStatus: "idle",
        audit: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy,
          updatedBy: createdBy,
          version: 1
        }
      };

      const saved = await this.competitorRepo.save(competitor);
      competitors.push(saved);
    }

    return competitors;
  }
}
