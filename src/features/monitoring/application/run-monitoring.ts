import { MonitoringConfigRepository } from "../repositories/monitoring-config-repository";
import { CrawlSnapshotRepository } from "../repositories/crawl-snapshot-repository";
import { MonitoringAlertRepository } from "../repositories/monitoring-alert-repository";
import { ChangeDetectionService } from "../services/change-detection-service";
import { RegressionDetectionService } from "../services/regression-detection-service";
import { ContentChangeDetectionService } from "../services/content-change-detection-service";
import { AlertGenerationService } from "../services/alert-generation-service";
import { CrawlSnapshot, SnapshotPage } from "../domain/entities/crawl-snapshot";
import type {
  CrawlProvider,
  CrawlRequest,
  CrawlResult,
  CrawledDocument,
  CrawlMetadata,
} from "../../acquisition/domain/contracts";
import { DEFAULT_CRAWL_POLICY } from "../../acquisition/domain/policy";
import { normalizeUrl } from "../../acquisition/domain/url/normalizer";
import { randomUUID } from "crypto";

/** Reads the robots directive out of loosely-typed crawl metadata, if the crawler saw one. */
function readRobotsDirective(metadata: CrawlMetadata): string | null {
  const raw = metadata["robots"] ?? metadata["robotsDirective"] ?? metadata["x-robots-tag"];
  return typeof raw === "string" && raw.trim() !== "" ? raw : null;
}

/** First heading the crawler captured, used as the page H1. */
function readFirstHeading(metadata: CrawlMetadata): string | null {
  const headings = metadata.headings;
  if (Array.isArray(headings)) {
    const first = headings.find((h) => typeof h === "string" && h.trim() !== "");
    return first ?? null;
  }
  return null;
}

function countWords(text: string): number {
  return text.split(/\s+/).filter((token) => token.length > 0).length;
}

/** True only when the crawl actually fetched this path with a 2xx status. */
function pathObserved(documents: CrawledDocument[], predicate: (path: string) => boolean): boolean {
  return documents.some((doc) => {
    if (doc.httpStatus < 200 || doc.httpStatus >= 300) {
      return false;
    }
    try {
      return predicate(new URL(doc.finalUrl || doc.canonicalUrl || doc.requestedUrl).pathname.toLowerCase());
    } catch {
      return false;
    }
  });
}

export class RunMonitoring {
  constructor(
    private configRepo: MonitoringConfigRepository,
    private snapshotRepo: CrawlSnapshotRepository,
    private alertRepo: MonitoringAlertRepository,
    private changeDetection: ChangeDetectionService,
    private regressionDetection: RegressionDetectionService,
    private contentDetection: ContentChangeDetectionService,
    private alertGeneration: AlertGenerationService,
    // Typed against the real acquisition contract. This was previously `any`, which hid
    // the fact that the body below called a `crawl(url)` method returning `{ items }` --
    // neither exists on `CrawlProvider`, so this orchestrator could never have run
    // successfully against `FirecrawlCrawlProvider`.
    private crawlProvider: CrawlProvider
  ) {}

  public async execute(input: { monitoringConfigId: string }): Promise<void> {
    const config = await this.configRepo.findById(input.monitoringConfigId);
    if (!config || !config.enabled) {
      return;
    }

    // Load previous BEFORE creating new snapshot
    const previousSnapshot = await this.snapshotRepo.findLatestSuccessful(config.id);

    // 1. Execute the crawl through the acquisition provider contract.
    const normalized = normalizeUrl(config.crawlUrl, DEFAULT_CRAWL_POLICY.stripTrackingParams);
    if (!normalized.ok) {
      throw normalized.error;
    }

    const request: CrawlRequest = {
      tenantId: config.tenantId,
      requestedUrl: config.crawlUrl,
      normalizedUrl: normalized.value,
      policy: DEFAULT_CRAWL_POLICY,
      priority: 0,
    };

    const controller = new AbortController();
    const deadline = setTimeout(() => controller.abort(), DEFAULT_CRAWL_POLICY.maxDurationMs);
    let crawlResult: CrawlResult;
    try {
      crawlResult = await this.crawlProvider.execute(
        request,
        DEFAULT_CRAWL_POLICY,
        controller.signal
      );
    } catch (error) {
      console.error("Crawl failed", error);
      throw error;
    } finally {
      clearTimeout(deadline);
    }

    // Adapt CrawledDocument -> SnapshotPage.
    const pages: SnapshotPage[] = crawlResult.documents.map((doc) => {
      const robotsDirective = readRobotsDirective(doc.metadata);
      const isSuccess = doc.httpStatus >= 200 && doc.httpStatus < 300;
      const metaDescription = doc.metadata.description;
      return {
        url: doc.finalUrl || doc.canonicalUrl || doc.requestedUrl,
        statusCode: doc.httpStatus,
        // Derived, not assumed: a page is indexable when it responded 2xx and was not
        // marked noindex. The previous hardcoded `true` made the regression check on
        // indexablePages equivalent to a total-page-count check.
        indexable: isSuccess && !/noindex/i.test(robotsDirective ?? ""),
        canonicalUrl: doc.canonicalUrl || null,
        title: doc.title ?? null,
        metaDescription: typeof metaDescription === "string" ? metaDescription : null,
        h1: readFirstHeading(doc.metadata),
        robotsDirective,
        contentHash: this.changeDetection.hashContent(doc.text || ""),
        wordCount: countWords(doc.text || ""),
        crawlable: isSuccess,
        brokenLinksCount: 0,
      };
    });

    const indexablePages = pages.filter((page) => page.indexable).length;

    const newSnapshot: CrawlSnapshot = {
      id: randomUUID(),
      tenantId: config.tenantId,
      monitoringConfigId: config.id,
      websiteId: config.websiteId,
      capturedAt: new Date(),
      pages,
      totalPages: pages.length,
      indexablePages,
      nonIndexablePages: pages.length - indexablePages,
      error4xxCount: pages.filter(p => p.statusCode !== null && p.statusCode >= 400 && p.statusCode < 500).length,
      error5xxCount: pages.filter(p => p.statusCode !== null && p.statusCode >= 500).length,
      // Reflects what this crawl actually fetched. Previously hardcoded to `true`, which
      // recorded a fact the crawl never established.
      robotsTxtAvailable: pathObserved(crawlResult.documents, (path) => path === "/robots.txt"),
      sitemapAvailable: pathObserved(crawlResult.documents, (path) => path.endsWith("sitemap.xml"))
    };

    await this.snapshotRepo.create(newSnapshot);

    if (!previousSnapshot) {
       // First snapshot, baseline only.
       return;
    }

    // 4. Run change detection
    const changes = this.changeDetection.detectChanges(previousSnapshot, newSnapshot);

    // 5. Run regression detection
    const regressions = this.regressionDetection.detectRegressions(changes, previousSnapshot, newSnapshot);

    // 6. Run content detection
    const contentRegressions = this.contentDetection.detectContentChanges(changes);
    const allRegressions = [...regressions, ...contentRegressions];

    // 7. Alert Generation & Deduplication
    const alertsToCreate = this.alertGeneration.generateAlerts(
      config.tenantId,
      config.id,
      newSnapshot.id,
      allRegressions
    );

    const openAlertsCurrentRun = new Set<string>();

    for (const alertData of alertsToCreate) {
      const openAlert = await this.alertRepo.findOpenByFingerprint(alertData.fingerprint);
      openAlertsCurrentRun.add(alertData.fingerprint);

      if (!openAlert) {
         await this.alertRepo.create({
           ...alertData,
           id: randomUUID(),
           createdAt: new Date(),
           resolvedAt: null
         });
      }
    }

    // Alert Recovery - If it's not in openAlertsCurrentRun but is currently open, resolve it.
    // Fetch all currently open alerts for this config
    const openAlerts = await this.alertRepo.findOpenAlertsByConfig(config.id);
    const now = new Date();

    for (const alert of openAlerts) {
       if (!openAlertsCurrentRun.has(alert.fingerprint)) {
          await this.alertRepo.resolve(alert.id, now);
       }
    }
  }
}
