import { randomUUID } from "node:crypto";
import { fetchAndExtractText } from "./web-crawler";
import { extractSeedLinks } from "./link-discovery";
import { DocumentIngestionService } from "../ingestion/document-ingestion";
import { TenantContextManager } from "../../core/database/tenant-context";

export interface CrawlerResult {
  totalUrlsFound: number;
  totalTextsExtracted: number;
  totalDocumentsIngested: number;
  details: Array<{
    url: string;
    status: "success" | "failed" | "skipped";
    textLength?: number;
    error?: string;
    ingestionResult?: {
      success: boolean;
      totalChunks: number;
      processedChunks: number;
      failedChunks: number;
    };
  }>;
}

export class CrawlerOrchestrator {
  private ingestionService: DocumentIngestionService;

  constructor(ingestionService?: DocumentIngestionService) {
    this.ingestionService = ingestionService || new DocumentIngestionService();
  }

  /**
   * Runs a 1-level deep web crawler campaign starting from a list of seed URLs.
   * Discovers target URLs, extracts text, normalizes/cleans it, and feeds it into the multi-tenant ingestion pipeline.
   * Guarantees absolute fault tolerance: errors on individual URLs do not halt the campaign.
   */
  public async runCrawlerCampaign(
    seedUrls: string[],
    organizationId: string,
    userId: string = "system_crawler",
    requestId: string = randomUUID()
  ): Promise<CrawlerResult> {
    const targetUrlsSet = new Set<string>();
    const details: CrawlerResult["details"] = [];

    let totalUrlsFound = 0;
    let totalTextsExtracted = 0;
    let totalDocumentsIngested = 0;

    // Phase 1: Link Discovery
    for (const seedUrl of seedUrls) {
      try {
        const discovered = await extractSeedLinks(seedUrl);
        for (const url of discovered) {
          targetUrlsSet.add(url);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[CrawlerOrchestrator] Failed to extract links from seed URL ${seedUrl}:`, errorMsg);
        details.push({
          url: seedUrl,
          status: "failed",
          error: `Failed to extract links from seed: ${errorMsg}`
        });
      }
    }

    totalUrlsFound = targetUrlsSet.size;
    const targetUrls = Array.from(targetUrlsSet);

    // Phase 2: Text Extraction and Ingestion
    for (const targetUrl of targetUrls) {
      try {
        // 1. Fetch and Extract Text
        const cleanText = await fetchAndExtractText(targetUrl);
        const textLength = cleanText.length;

        // 2. Enforce Minimum Text Length
        if (textLength < 100) {
          details.push({
            url: targetUrl,
            status: "skipped",
            textLength,
            error: `Text content length (${textLength}) is below the minimum threshold of 100 characters.`
          });
          continue;
        }

        totalTextsExtracted++;

        // 3. Ingest Document under secure Tenant Context
        const ingestionResult = await TenantContextManager.runWithTenantContext(
          organizationId,
          userId,
          requestId,
          async () => {
            return await this.ingestionService.ingestDocument(
              cleanText,
              {
                source: "web-crawler",
                url: targetUrl,
                extractedAt: new Date().toISOString()
              }
            );
          }
        );

        if (ingestionResult.success) {
          totalDocumentsIngested++;
          details.push({
            url: targetUrl,
            status: "success",
            textLength,
            ingestionResult: {
              success: ingestionResult.success,
              totalChunks: ingestionResult.totalChunks,
              processedChunks: ingestionResult.processedChunks,
              failedChunks: ingestionResult.failedChunks
            }
          });
        } else {
          details.push({
            url: targetUrl,
            status: "failed",
            textLength,
            error: "Ingestion service returned success: false.",
            ingestionResult: {
              success: ingestionResult.success,
              totalChunks: ingestionResult.totalChunks,
              processedChunks: ingestionResult.processedChunks,
              failedChunks: ingestionResult.failedChunks
            }
          });
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[CrawlerOrchestrator] Failed to process target URL ${targetUrl}:`, errorMsg);
        details.push({
          url: targetUrl,
          status: "failed",
          error: errorMsg
        });
      }
    }

    return {
      totalUrlsFound,
      totalTextsExtracted,
      totalDocumentsIngested,
      details
    };
  }
}
