import { SnapshotChangeResult } from "../domain/types/snapshot-change-result";
import { RegressionResult } from "../domain/types/regression-result";
import { CrawlSnapshot } from "../domain/entities/crawl-snapshot";

export class RegressionDetectionService {
  public detectRegressions(
    changes: SnapshotChangeResult,
    previousSnapshot: CrawlSnapshot | null,
    currentSnapshot: CrawlSnapshot
  ): RegressionResult[] {
    const regressions: RegressionResult[] = [];

    if (!previousSnapshot) return regressions;

    // 1. Technical Regressions
    for (const techChange of changes.technicalChanges) {
      // HTTP Status
      if (techChange.type === "statusCode") {
        const prev = techChange.previousValue as number | null;
        const curr = techChange.currentValue as number | null;

        if (prev !== null && prev >= 200 && prev < 300) {
          if (curr === null) {
            regressions.push({
              type: "technical", severity: "critical", url: techChange.url, metric: "statusCode",
              previousValue: prev, currentValue: curr, message: `Status code changed from 2xx to null`
            });
          } else if (curr >= 400 && curr < 500) {
            regressions.push({
              type: "technical", severity: "critical", url: techChange.url, metric: "statusCode",
              previousValue: prev, currentValue: curr, message: `Status code changed from 2xx to 4xx`
            });
          } else if (curr >= 500) {
            regressions.push({
              type: "technical", severity: "critical", url: techChange.url, metric: "statusCode",
              previousValue: prev, currentValue: curr, message: `Status code changed from 2xx to 5xx`
            });
          }
        }
      }

      // Crawlability
      if (techChange.type === "crawlable") {
        if (techChange.previousValue === true && techChange.currentValue === false) {
          regressions.push({
            type: "technical", severity: "critical", url: techChange.url, metric: "crawlable",
            previousValue: true, currentValue: false, message: `Page became non-crawlable`
          });
        }
      }

      // Indexability
      if (techChange.type === "indexable") {
        if (techChange.previousValue === true && techChange.currentValue === false) {
          regressions.push({
            type: "technical", severity: "critical", url: techChange.url, metric: "indexable",
            previousValue: true, currentValue: false, message: `Page became non-indexable`
          });
        }
      }

      // Canonical
      if (techChange.type === "canonicalUrl") {
        const prev = techChange.previousValue as string | null;
        const curr = techChange.currentValue as string | null;

        if (prev) {
          if (curr === null) {
            regressions.push({
              type: "technical", severity: "warning", url: techChange.url, metric: "canonicalUrl",
              previousValue: prev, currentValue: curr, message: `Valid canonical URL removed`
            });
          } else if (prev !== curr) {
            regressions.push({
              type: "technical", severity: "info", url: techChange.url, metric: "canonicalUrl",
              previousValue: prev, currentValue: curr, message: `Canonical URL changed`
            });
          }
        }
      }

      // Broken links
      if (techChange.type === "brokenLinksCount") {
        const prev = typeof techChange.previousValue === 'number' ? techChange.previousValue : 0;
        const curr = typeof techChange.currentValue === 'number' ? techChange.currentValue : 0;

        if (curr > prev) {
           regressions.push({
              type: "technical", severity: "warning", url: techChange.url, metric: "brokenLinksCount",
              previousValue: prev, currentValue: curr, message: `Broken links increased from ${prev} to ${curr}`
            });
        }
      }
    }

    // 2. SEO Regressions
    for (const seoChange of changes.seoChanges) {
      if (seoChange.type === "title") {
        if (seoChange.previousValue && !seoChange.currentValue) {
           regressions.push({
              type: "seo", severity: "warning", url: seoChange.url, metric: "title",
              previousValue: seoChange.previousValue, currentValue: seoChange.currentValue, message: `Title removed`
            });
        }
      }
      if (seoChange.type === "metaDescription") {
        if (seoChange.previousValue && !seoChange.currentValue) {
           regressions.push({
              type: "seo", severity: "warning", url: seoChange.url, metric: "metaDescription",
              previousValue: seoChange.previousValue, currentValue: seoChange.currentValue, message: `Meta description removed`
            });
        }
      }
      if (seoChange.type === "h1") {
        if (seoChange.previousValue && !seoChange.currentValue) {
           regressions.push({
              type: "seo", severity: "warning", url: seoChange.url, metric: "h1",
              previousValue: seoChange.previousValue, currentValue: seoChange.currentValue, message: `H1 removed`
            });
        }
      }
      if (seoChange.type === "robotsDirective") {
        const prev = typeof seoChange.previousValue === 'string' ? seoChange.previousValue : '';
        const curr = typeof seoChange.currentValue === 'string' ? seoChange.currentValue : '';
        if (prev.indexOf('noindex') === -1 && curr.indexOf('noindex') !== -1) {
            regressions.push({
              type: "seo", severity: "critical", url: seoChange.url, metric: "robotsDirective",
              previousValue: seoChange.previousValue, currentValue: seoChange.currentValue, message: `noindex directive introduced`
            });
        }
      }
    }

    // Site-level SEO regression
    if (currentSnapshot.indexablePages < previousSnapshot.indexablePages) {
       regressions.push({
          type: "seo", severity: "warning", url: null, metric: "indexablePagesCount",
          previousValue: previousSnapshot.indexablePages, currentValue: currentSnapshot.indexablePages, message: `Indexable page count decreased`
       });
    }

    return regressions;
  }
}
