import { CrawlSnapshot, SnapshotPage } from "../domain/entities/crawl-snapshot";
import { SnapshotChangeResult, TechnicalChange, SeoChange, ContentChange } from "../domain/types/snapshot-change-result";
import { createHash } from "crypto";

export class ChangeDetectionService {
  /**
   * Normalizes content by:
   * 1. removing irrelevant whitespace differences
   * 2. normalizing repeated whitespace
   * 3. normalizing line endings
   * 4. removing surrounding whitespace
   */
  public normalizeContent(content: string): string {
    if (!content) return "";
    return content
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Deterministically hashes the normalized content using sha256
   */
  public hashContent(content: string): string {
    const normalized = this.normalizeContent(content);
    return createHash("sha256").update(normalized, "utf8").digest("hex");
  }

  /**
   * Compares two snapshots to detect changes deterministically by normalized URL
   */
  public detectChanges(
    previousSnapshot: CrawlSnapshot | null,
    currentSnapshot: CrawlSnapshot
  ): SnapshotChangeResult {
    const result: SnapshotChangeResult = {
      addedPages: [],
      removedPages: [],
      modifiedPages: [],
      technicalChanges: [],
      seoChanges: [],
      contentChanges: [],
      hasChanges: false,
    };

    const isInitialSnapshot = !previousSnapshot;

    if (isInitialSnapshot) {
      return result;
    }

    const prevPagesMap = new Map<string, SnapshotPage>();
    for (const p of previousSnapshot.pages) {
      prevPagesMap.set(p.url, p);
    }

    const currentPagesMap = new Map<string, SnapshotPage>();
    for (const p of currentSnapshot.pages) {
      currentPagesMap.set(p.url, p);
    }

    // Removed pages
    for (const [url, prevPage] of prevPagesMap.entries()) {
      if (!currentPagesMap.has(url)) {
        result.removedPages.push(url);
        result.hasChanges = true;
      }
    }

    // Added and Modified pages
    for (const [url, currPage] of currentPagesMap.entries()) {
      const prevPage = prevPagesMap.get(url);

      if (!prevPage) {
        result.addedPages.push(url);
        result.hasChanges = true;
      } else {
        // Compare pages
        let isModified = false;

        // Technical changes
        if (prevPage.statusCode !== currPage.statusCode) {
          result.technicalChanges.push({ url, type: "statusCode", previousValue: prevPage.statusCode, currentValue: currPage.statusCode });
          isModified = true;
        }
        if (prevPage.crawlable !== currPage.crawlable) {
          result.technicalChanges.push({ url, type: "crawlable", previousValue: prevPage.crawlable, currentValue: currPage.crawlable });
          isModified = true;
        }
        if (prevPage.indexable !== currPage.indexable) {
          result.technicalChanges.push({ url, type: "indexable", previousValue: prevPage.indexable, currentValue: currPage.indexable });
          isModified = true;
        }
        if (prevPage.canonicalUrl !== currPage.canonicalUrl) {
          result.technicalChanges.push({ url, type: "canonicalUrl", previousValue: prevPage.canonicalUrl, currentValue: currPage.canonicalUrl });
          isModified = true;
        }
        if (prevPage.brokenLinksCount !== currPage.brokenLinksCount) {
          result.technicalChanges.push({ url, type: "brokenLinksCount", previousValue: prevPage.brokenLinksCount, currentValue: currPage.brokenLinksCount });
          isModified = true;
        }

        // SEO changes
        if (prevPage.title !== currPage.title) {
          result.seoChanges.push({ url, type: "title", previousValue: prevPage.title, currentValue: currPage.title });
          isModified = true;
        }
        if (prevPage.metaDescription !== currPage.metaDescription) {
          result.seoChanges.push({ url, type: "metaDescription", previousValue: prevPage.metaDescription, currentValue: currPage.metaDescription });
          isModified = true;
        }
        if (prevPage.h1 !== currPage.h1) {
          result.seoChanges.push({ url, type: "h1", previousValue: prevPage.h1, currentValue: currPage.h1 });
          isModified = true;
        }
        if (prevPage.robotsDirective !== currPage.robotsDirective) {
          result.seoChanges.push({ url, type: "robotsDirective", previousValue: prevPage.robotsDirective, currentValue: currPage.robotsDirective });
          isModified = true;
        }

        // Content changes
        if (prevPage.contentHash !== currPage.contentHash) {
          result.contentChanges.push({ url, type: "contentHash", previousValue: prevPage.contentHash, currentValue: currPage.contentHash });
          isModified = true;
        }
        if (prevPage.wordCount !== currPage.wordCount) {
          result.contentChanges.push({ url, type: "wordCount", previousValue: prevPage.wordCount, currentValue: currPage.wordCount });
          isModified = true;
        }

        if (isModified) {
          result.modifiedPages.push(url);
          result.hasChanges = true;
        }
      }
    }

    return result;
  }
}
