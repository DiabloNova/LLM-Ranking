export interface SnapshotPage {
  url: string;
  statusCode: number | null;
  indexable: boolean;
  canonicalUrl: string | null;
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  robotsDirective: string | null;
  contentHash: string;
  wordCount: number;
  crawlable: boolean;
  brokenLinksCount: number;
}

export interface CrawlSnapshot {
  id: string;
  tenantId: string;
  monitoringConfigId: string;
  websiteId: string;
  capturedAt: Date;
  pages: SnapshotPage[];
  totalPages: number;
  indexablePages: number;
  nonIndexablePages: number;
  error4xxCount: number;
  error5xxCount: number;
  robotsTxtAvailable: boolean;
  sitemapAvailable: boolean;
  extractedContent?: string | null;
}
