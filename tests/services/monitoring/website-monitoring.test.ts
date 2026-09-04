import assert from "node:assert/strict";
import { ChangeDetectionService } from "../../../src/features/monitoring/services/change-detection-service";
import { RegressionDetectionService } from "../../../src/features/monitoring/services/regression-detection-service";
import { CrawlSnapshot } from "../../../src/features/monitoring/domain/entities/crawl-snapshot";

export async function testWebsiteMonitoringFoundation() {
  console.log("Running Website Monitoring Foundation Tests...");

  const changeService = new ChangeDetectionService();
  const regressionService = new RegressionDetectionService();

  const prevSnapshot: CrawlSnapshot = {
    id: "prev-1",
    tenantId: "org-1",
    monitoringConfigId: "cfg-1",
    websiteId: "web-1",
    capturedAt: new Date(),
    pages: [{
        url: "http://example.com", statusCode: 200, indexable: true, canonicalUrl: "http://example.com",
        title: "Hello", metaDescription: "Desc", h1: "Hello", robotsDirective: "", contentHash: "hash-hello", wordCount: 1, crawlable: true, brokenLinksCount: 0
    }],
    totalPages: 1, indexablePages: 1, nonIndexablePages: 0, error4xxCount: 0, error5xxCount: 0, robotsTxtAvailable: true, sitemapAvailable: true,
    extractedContent: "hello"
  };

  const sameSnapshot: CrawlSnapshot = {
    ...prevSnapshot,
    id: "same-1",
    extractedContent: "hello"
  };

  const helloWorldSnapshot: CrawlSnapshot = {
    ...prevSnapshot,
    id: "diff-1",
    pages: [{
        url: "http://example.com", statusCode: 200, indexable: true, canonicalUrl: "http://example.com",
        title: "Hello World", metaDescription: "Desc", h1: "Hello", robotsDirective: "", contentHash: "hash-diff", wordCount: 2, crawlable: true, brokenLinksCount: 0
    }],
    extractedContent: "hello world"
  };

  const emptySnapshot: CrawlSnapshot = {
    ...prevSnapshot,
    id: "empty-1",
    pages: [],
    extractedContent: null
  };

  const sameExtractedSnapshotWithDifferentReference: CrawlSnapshot = {
    ...prevSnapshot,
    id: "diff-ref-1",
    extractedContent: "hello"
  };

  // ----------------------------------------------------
  // Change Detection Verify Cases
  // ----------------------------------------------------

  // Case 1: Identical content shouldn't trigger changes
  const case1 = changeService.detectChanges(prevSnapshot, sameSnapshot);
  assert.equal(case1.hasChanges, false);

  // Case 2: Changed content should trigger changes
  const case2 = changeService.detectChanges(prevSnapshot, helloWorldSnapshot);
  assert.equal(case2.hasChanges, true);

  // Case 3: Initial snapshot doesn't generate false Regression/Change boolean
  const case3 = changeService.detectChanges(null, prevSnapshot);
  assert.equal(case3.hasChanges, false);

  // Case 4: Complete content deletion
  const case4 = changeService.detectChanges(prevSnapshot, emptySnapshot);
  assert.equal(case4.hasChanges, true);

  // Case 5: Hash equivalence checks
  const case5 = changeService.detectChanges(prevSnapshot, sameExtractedSnapshotWithDifferentReference);
  assert.equal(case5.hasChanges, false);
}
