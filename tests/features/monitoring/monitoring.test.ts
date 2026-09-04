import * as assert from "node:assert/strict";
import { ChangeDetectionService } from "../../../src/features/monitoring/services/change-detection-service";
import { RegressionDetectionService } from "../../../src/features/monitoring/services/regression-detection-service";
import { ContentChangeDetectionService } from "../../../src/features/monitoring/services/content-change-detection-service";
import { AlertGenerationService } from "../../../src/features/monitoring/services/alert-generation-service";
import { CrawlSnapshot, SnapshotPage } from "../../../src/features/monitoring/domain/entities/crawl-snapshot";

export async function runMonitoringTests() {
  console.log("Running Monitoring Tests...");

  const changeService = new ChangeDetectionService();
  const regressionService = new RegressionDetectionService();
  const contentService = new ContentChangeDetectionService();
  const alertService = new AlertGenerationService();

  const prevPage: SnapshotPage = {
    url: "https://example.com",
    statusCode: 200,
    indexable: true,
    canonicalUrl: "https://example.com",
    title: "Old Title",
    metaDescription: "Old Desc",
    h1: "Old H1",
    robotsDirective: null,
    contentHash: changeService.hashContent("Old content"),
    wordCount: 100,
    crawlable: true,
    brokenLinksCount: 0
  };

  const currPage: SnapshotPage = {
    url: "https://example.com",
    statusCode: 404, // Tech Regression (200 -> 404)
    indexable: false, // Tech Regression (true -> false)
    canonicalUrl: null, // Tech Regression (valid -> null)
    title: null, // SEO Regression (non-empty -> null)
    metaDescription: null, // SEO Regression
    h1: null, // SEO Regression
    robotsDirective: "noindex", // SEO Regression
    contentHash: changeService.hashContent("New content"), // Content Regression
    wordCount: 20, // Content Regression (> 50 diff)
    crawlable: false, // Tech Regression
    brokenLinksCount: 5 // Tech Regression
  };

  const prevSnapshot: CrawlSnapshot = {
    id: "prev-id",
    tenantId: "tenant-1",
    monitoringConfigId: "config-1",
    websiteId: "site-1",
    capturedAt: new Date(),
    pages: [prevPage],
    totalPages: 1,
    indexablePages: 1,
    nonIndexablePages: 0,
    error4xxCount: 0,
    error5xxCount: 0,
    robotsTxtAvailable: true,
    sitemapAvailable: true
  };

  const currSnapshot: CrawlSnapshot = {
    ...prevSnapshot,
    id: "curr-id",
    pages: [currPage],
    indexablePages: 0, // SEO Regression (decreased)
    error4xxCount: 1
  };

  // 1. Test Change Detection
  const changes = changeService.detectChanges(prevSnapshot, currSnapshot);
  assert.equal(changes.hasChanges, true);
  assert.equal(changes.modifiedPages.includes("https://example.com"), true);

  // 2. Test Technical & SEO Regressions
  const regressions = regressionService.detectRegressions(changes, prevSnapshot, currSnapshot);

  // Tech Regressions
  assert.ok(regressions.some(r => r.type === "technical" && r.metric === "statusCode"));
  assert.ok(regressions.some(r => r.type === "technical" && r.metric === "crawlable"));
  assert.ok(regressions.some(r => r.type === "technical" && r.metric === "indexable"));
  assert.ok(regressions.some(r => r.type === "technical" && r.metric === "canonicalUrl"));
  assert.ok(regressions.some(r => r.type === "technical" && r.metric === "brokenLinksCount"));

  // SEO Regressions
  assert.ok(regressions.some(r => r.type === "seo" && r.metric === "title"));
  assert.ok(regressions.some(r => r.type === "seo" && r.metric === "metaDescription"));
  assert.ok(regressions.some(r => r.type === "seo" && r.metric === "h1"));
  assert.ok(regressions.some(r => r.type === "seo" && r.metric === "robotsDirective"));
  assert.ok(regressions.some(r => r.type === "seo" && r.metric === "indexablePagesCount"));

  // 3. Test Content Changes
  const contentRegressions = contentService.detectContentChanges(changes);
  assert.ok(contentRegressions.some(r => r.metric === "contentHash"));
  assert.ok(contentRegressions.some(r => r.metric === "wordCount"));

  // 4. Baseline Test
  const baselineChanges = changeService.detectChanges(null, currSnapshot);
  assert.equal(baselineChanges.hasChanges, false);
  const baselineRegressions = regressionService.detectRegressions(baselineChanges, null, currSnapshot);
  assert.equal(baselineRegressions.length, 0);

  // 5. Alert Deduplication Fingerprint Test
  const f1 = alertService.generateFingerprint("tenant-1", "config-1", "technical", "statusCode", "https://example.com", "statusCode");
  const f2 = alertService.generateFingerprint("tenant-1", "config-1", "technical", "statusCode", "https://example.com", "statusCode");
  assert.equal(f1, f2); // Deterministic

  console.log("All Monitoring Tests Passed!");
}
