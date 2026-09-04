/**
 * Technical contract representing the required metadata structure of a crawl job.
 */
export interface CrawlJobMetadata {
  targetUrl: string;
  depthLimit: number;
  maxPages: number;
}

/**
 * Technical contract representing the required metadata structure of an AI analysis job.
 */
export interface AiAnalysisJobMetadata {
  modelName: string;
  promptTemplate: string;
  targetDomain: string;
}
