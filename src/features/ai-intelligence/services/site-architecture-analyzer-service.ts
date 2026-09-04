/**
 * Task 9.2 — Site Architecture Intelligence Engine
 * Enterprise SaaS Multi-Tenant Domain Service
 * Performs pure, deterministic information architecture and internal link graph audits.
 */

import { TenantContextManager } from "../../../core/database/tenant-context";
import {
  SiteArchitectureInput,
  CrawlDepthResult,
  SiteArchitectureFinding,
  SiteArchitectureAnalysisResult,
  SiteArchitectureCategory,
  FindingSeverity,
  Page
} from "../domain/types";

/**
 * Normalizes URL paths and URLs for exact graph node matching.
 */
export function normalizeGraphUrl(rawUrl: string): string {
  if (!rawUrl) return "";
  try {
    const parsed = new URL(rawUrl.startsWith("http") ? rawUrl : `https://example.com${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`);
    let path = parsed.pathname;
    if (path.length > 1 && path.endsWith("/")) {
      path = path.slice(0, -1);
    }
    return `${parsed.protocol}//${parsed.host}${path}`;
  } catch {
    let clean = rawUrl.trim().toLowerCase();
    if (clean.length > 1 && clean.endsWith("/")) {
      clean = clean.slice(0, -1);
    }
    return clean;
  }
}

/**
 * Severity Priority for deterministic sorting.
 */
const SEVERITY_WEIGHT: Record<FindingSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
};

export class SiteArchitectureAnalyzerService {
  /**
   * Main Entrypoint: Evaluates site architecture, calculates crawl depth, identifies orphan pages,
   * analyzes internal link distribution, content hierarchy, and generates deterministic recommendations.
   */
  public analyzeArchitecture(
    organizationId: string,
    websiteId: string,
    input: SiteArchitectureInput
  ): SiteArchitectureAnalysisResult {
    const activeTenantId = TenantContextManager.getRequiredTenantId();
    if (activeTenantId !== organizationId) {
      throw new Error(
        `Tenant Context Violation: Access Denied. Cross-tenant operation blocked. Target organization ${organizationId} does not match active tenant ${activeTenantId}.`
      );
    }

    const pages = input.pages || [];
    const links = input.links || [];

    if (pages.length === 0) {
      return {
        findings: [],
        crawlDepths: [],
        orphanCandidates: [],
        metrics: {
          totalPagesAnalyzed: 0,
          totalInternalLinks: 0,
          maxCrawlDepth: 0,
          avgCrawlDepth: 0,
          orphanPageCount: 0,
          deepPagesCount: 0
        }
      };
    }

    // 1. Build Adjacency List & Link Metrics Maps
    const nodeMap = new Map<string, Page>();
    const adjacencyList = new Map<string, Set<string>>();
    const incomingLinksMap = new Map<string, Set<string>>();
    const outgoingCountMap = new Map<string, number>();

    for (const pg of pages) {
      const norm = normalizeGraphUrl(pg.url);
      nodeMap.set(norm, pg);
      if (!adjacencyList.has(norm)) adjacencyList.set(norm, new Set());
      if (!incomingLinksMap.has(norm)) incomingLinksMap.set(norm, new Set());
      outgoingCountMap.set(norm, 0);
    }

    for (const link of links) {
      const srcNorm = normalizeGraphUrl(link.sourceUrl);
      const tgtNorm = normalizeGraphUrl(link.normalizedTargetUrl || link.targetUrl);

      // Handle self-links safely
      if (srcNorm === tgtNorm) continue;

      if (nodeMap.has(srcNorm)) {
        outgoingCountMap.set(srcNorm, (outgoingCountMap.get(srcNorm) || 0) + 1);

        if (nodeMap.has(tgtNorm)) {
          adjacencyList.get(srcNorm)!.add(tgtNorm);
          incomingLinksMap.get(tgtNorm)!.add(srcNorm);
        }
      }
    }

    // 2. Identify Root Page (Entry Point)
    let rootNormUrl = input.rootUrl ? normalizeGraphUrl(input.rootUrl) : undefined;

    if (!rootNormUrl || !nodeMap.has(rootNormUrl)) {
      // Find homepage or root URL path
      for (const [norm, pg] of nodeMap.entries()) {
        if (pg.path === "/" || pg.path === "" || norm.endsWith(".com") || norm.endsWith(".io") || norm.endsWith(".org")) {
          rootNormUrl = norm;
          break;
        }
      }
      if (!rootNormUrl && pages.length > 0) {
        // Fallback: lexicographically first URL
        rootNormUrl = Array.from(nodeMap.keys()).sort()[0];
      }
    }

    // 3. BFS Graph Traversal for Crawl Depth Calculation
    const crawlDepths: CrawlDepthResult[] = [];
    const depthMap = new Map<string, number>();
    const pathMap = new Map<string, string[]>();

    if (rootNormUrl && nodeMap.has(rootNormUrl)) {
      const queue: Array<{ url: string; depth: number; path: string[] }> = [
        { url: rootNormUrl, depth: 0, path: [rootNormUrl] }
      ];
      const visited = new Set<string>([rootNormUrl]);

      depthMap.set(rootNormUrl, 0);
      pathMap.set(rootNormUrl, [rootNormUrl]);

      while (queue.length > 0) {
        const current = queue.shift()!;
        const neighbors = Array.from(adjacencyList.get(current.url) || []).sort();

        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            const neighborDepth = current.depth + 1;
            const neighborPath = [...current.path, neighbor];

            depthMap.set(neighbor, neighborDepth);
            pathMap.set(neighbor, neighborPath);

            queue.push({
              url: neighbor,
              depth: neighborDepth,
              path: neighborPath
            });
          }
        }
      }
    }

    // Map all analyzed pages to CrawlDepthResult
    for (const [norm, pg] of nodeMap.entries()) {
      const isReachable = depthMap.has(norm);
      const depth = isReachable ? depthMap.get(norm)! : -1;
      const path = isReachable ? pathMap.get(norm)! : [];

      crawlDepths.push({
        url: pg.url,
        crawlDepth: depth,
        pathFromRoot: path,
        isReachableFromRoot: isReachable
      });
    }

    crawlDepths.sort((a, b) => a.url.localeCompare(b.url));

    // 4. Perform Architectural Audits & Generate Standardized Findings
    const findings: SiteArchitectureFinding[] = [];
    const orphanCandidates: string[] = [];

    let totalCrawlDepthSum = 0;
    let reachableCount = 0;
    let maxCrawlDepth = 0;
    let deepPagesCount = 0;

    for (const cd of crawlDepths) {
      const norm = normalizeGraphUrl(cd.url);
      const pg = nodeMap.get(norm)!;
      const incomingCount = incomingLinksMap.get(norm)?.size || 0;
      const outgoingCount = outgoingCountMap.get(norm) || 0;

      if (cd.isReachableFromRoot) {
        reachableCount++;
        totalCrawlDepthSum += cd.crawlDepth;
        if (cd.crawlDepth > maxCrawlDepth) maxCrawlDepth = cd.crawlDepth;
        if (cd.crawlDepth > 3) deepPagesCount++;
      }

      // Audit A: Crawl Depth Checks
      if (cd.isReachableFromRoot) {
        if (cd.crawlDepth >= 5) {
          findings.push({
            id: `finding-depth-excessive-${norm.slice(-12)}`,
            organizationId,
            websiteId,
            category: "crawl-depth",
            code: "ERR_CRAWL_DEPTH_EXCESSIVE",
            title: "Excessive Crawl Depth (> 4 Hops)",
            explanation: `Page "${pg.title || cd.url}" requires ${cd.crawlDepth} internal hops from homepage, making it difficult for search engine crawlers and users to reach.`,
            severity: "high",
            confidence: "high",
            affectedResource: cd.url,
            evidence: {
              crawlDepth: cd.crawlDepth,
              pathFromRoot: cd.pathFromRoot,
              threshold: 4
            },
            recommendation: {
              action: "Add direct contextual link from higher-level hub page",
              description: `Create a direct contextual internal link from a hub page (e.g. "${cd.pathFromRoot[1] || '/'}") to reduce crawl depth from ${cd.crawlDepth} to 2.`,
              impact: "Improves indexation speed and link equity flow."
            }
          });
        } else if (cd.crawlDepth === 4) {
          findings.push({
            id: `finding-depth-elevated-${norm.slice(-12)}`,
            organizationId,
            websiteId,
            category: "crawl-depth",
            code: "WARN_CRAWL_DEPTH_ELEVATED",
            title: "Elevated Crawl Depth (4 Hops)",
            explanation: `Page "${pg.title || cd.url}" is 4 clicks away from homepage.`,
            severity: "medium",
            confidence: "high",
            affectedResource: cd.url,
            evidence: {
              crawlDepth: cd.crawlDepth,
              pathFromRoot: cd.pathFromRoot,
              threshold: 3
            },
            recommendation: {
              action: "Promote page in parent category navigation or hub list",
              description: "Include link in primary category sidebar or navigation sub-menu.",
              impact: "Reduces crawl friction."
            }
          });
        }
      }

      // Audit B: Orphan Page Detection
      // A page is an orphan ONLY when it has 0 incoming links from analyzed pages AND graph is complete
      if (incomingCount === 0 && norm !== rootNormUrl && pages.length >= 3) {
        orphanCandidates.push(cd.url);
        findings.push({
          id: `finding-orphan-${norm.slice(-12)}`,
          organizationId,
          websiteId,
          category: "orphan-page",
          code: "ERR_ORPHAN_PAGE_DETECTED",
          title: "Orphan Page Discovered (0 Inbound Internal Links)",
          explanation: `Page "${cd.url}" exists in the site catalog but receives zero internal links from any analyzed page in the crawl graph.`,
          severity: "high",
          confidence: "high",
          affectedResource: cd.url,
          evidence: {
            inboundInternalLinks: 0,
            analyzedPageCount: pages.length,
            isReachableFromRoot: cd.isReachableFromRoot
          },
          recommendation: {
            action: "Link orphan page from relevant category or hub",
            description: "Add contextual internal links pointing to this page from relevant category or topic hub pages.",
            impact: "Ensures page is discoverable and indexable by search engines."
          }
        });
      }

      // Audit C: Internal Linking Quality
      if (incomingCount === 1 && pages.length >= 5 && norm !== rootNormUrl) {
        findings.push({
          id: `finding-link-weak-${norm.slice(-12)}`,
          organizationId,
          websiteId,
          category: "internal-linking",
          code: "WARN_INTERNAL_LINK_WEAK",
          title: "Weak Inbound Internal Linking (Only 1 Link)",
          explanation: `Page "${cd.url}" receives only 1 inbound internal link across ${pages.length} analyzed pages.`,
          severity: "medium",
          confidence: "high",
          affectedResource: cd.url,
          evidence: {
            inboundInternalLinks: 1,
            analyzedPageCount: pages.length,
            rootReachability: cd.isReachableFromRoot
          },
          recommendation: {
            action: "Add 2-3 additional contextual internal links",
            description: "Link to this page from related article bodies or secondary navigation blocks.",
            impact: "Distributes PageRank authority and increases topical relevance."
          }
        });
      }

      if (outgoingCount > 100) {
        findings.push({
          id: `finding-link-excessive-${norm.slice(-12)}`,
          organizationId,
          websiteId,
          category: "internal-linking",
          code: "WARN_INTERNAL_LINK_EXCESSIVE_OUTGOING",
          title: "Excessive Outgoing Internal Links (> 100 Links)",
          explanation: `Page "${cd.url}" contains ${outgoingCount} outgoing links, diluting internal link equity.`,
          severity: "low",
          confidence: "high",
          affectedResource: cd.url,
          evidence: {
            outgoingInternalLinks: outgoingCount,
            threshold: 100
          },
          recommendation: {
            action: "Consolidate or paginate outgoing link blocks",
            description: "Trim non-essential footer or mega-menu links on this page.",
            impact: "Conserves link equity."
          }
        });
      }

      // Audit D: URL Hierarchy & Folder Structure Analysis
      const urlPathSegments = pg.path.split("/").filter(s => s.length > 0);
      if (urlPathSegments.length >= 4) {
        findings.push({
          id: `finding-struct-folder-depth-${norm.slice(-12)}`,
          organizationId,
          websiteId,
          category: "site-structure",
          code: "WARN_STRUCTURE_EXCESSIVE_FOLDER_DEPTH",
          title: "Excessive URL Hierarchy Depth (>= 4 Folders)",
          explanation: `URL path "${pg.path}" contains ${urlPathSegments.length} folder levels, creating deep structural nesting.`,
          severity: "low",
          confidence: "high",
          affectedResource: cd.url,
          evidence: {
            urlPath: pg.path,
            segmentCount: urlPathSegments.length,
            segments: urlPathSegments
          },
          recommendation: {
            action: "Flatten URL hierarchy structure",
            description: `Simplify URL structure from "/${urlPathSegments.join('/')}" to a flatter 2-level path.`,
            impact: "Clarity in URL hierarchy and better UX."
          }
        });
      }

      // Audit E: Content Hierarchy Missing Parent Check
      if (urlPathSegments.length >= 2) {
        const parentPath = `/${urlPathSegments.slice(0, urlPathSegments.length - 1).join("/")}`;
        const hasParentInCatalog = Array.from(nodeMap.values()).some(p => p.path === parentPath || p.path === `${parentPath}/`);

        if (!hasParentInCatalog && pages.length >= 4) {
          findings.push({
            id: `finding-hierarchy-parent-missing-${norm.slice(-12)}`,
            organizationId,
            websiteId,
            category: "content-hierarchy",
            code: "WARN_HIERARCHY_PARENT_MISSING",
            title: "Missing Parent Category Hub Page",
            explanation: `Child page "${pg.path}" exists under category path "${parentPath}", but parent hub page "${parentPath}" is absent in site catalog.`,
            severity: "medium",
            confidence: "medium",
            affectedResource: cd.url,
            evidence: {
              childPath: pg.path,
              missingParentPath: parentPath
            },
            recommendation: {
              action: "Create parent category hub page",
              description: `Publish a dedicated hub page at "${parentPath}" to group related sub-pages and establish a clear pillar-cluster hierarchy.`,
              impact: "Establishes clear topical hierarchy and hub-and-spoke content model."
            }
          });
        }
      }
    }

    // 5. Sort Findings Deterministically
    findings.sort((a, b) => {
      // 1. Severity weight (descending)
      const sevDiff = SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity];
      if (sevDiff !== 0) return sevDiff;

      // 2. Category (alphabetically)
      const catDiff = a.category.localeCompare(b.category);
      if (catDiff !== 0) return catDiff;

      // 3. Affected Resource URL (alphabetically)
      const resDiff = a.affectedResource.localeCompare(b.affectedResource);
      if (resDiff !== 0) return resDiff;

      // 4. Code (alphabetically)
      return a.code.localeCompare(b.code);
    });

    const avgCrawlDepth = reachableCount > 0 ? Number((totalCrawlDepthSum / reachableCount).toFixed(2)) : 0;

    return {
      findings,
      crawlDepths,
      orphanCandidates: orphanCandidates.sort(),
      metrics: {
        totalPagesAnalyzed: pages.length,
        totalInternalLinks: links.length,
        maxCrawlDepth,
        avgCrawlDepth,
        orphanPageCount: orphanCandidates.length,
        deepPagesCount
      }
    };
  }
}
