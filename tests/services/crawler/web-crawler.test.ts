/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Programmatic Enterprise Test Suite for Web Crawler & Data Extraction Service.
 * Verifies link discovery, text extraction, Persian normalization, mock fallback mode,
 * orchestrator campaign flow, fault tolerance, and multi-tenant isolation.
 */

import { Pool } from "pg";
import { normalizePersianText, fetchAndExtractText } from "../../../src/services/crawler/web-crawler";
import { extractSeedLinks } from "../../../src/services/crawler/link-discovery";
import { CrawlerOrchestrator } from "../../../src/services/crawler/crawler-orchestrator";
import { TenantContextManager } from "../../../src/core/database/tenant-context";
import { VectorStoreService } from "../../../src/services/knowledge-graph/vector-store";

// Mock database store for document embeddings
const mockEmbeddingsStore: any[] = [];

function calculateCosineDistance(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  const length = Math.min(a.length, b.length);
  for (let i = 0; i < length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 1;
  return 1 - (dotProduct / (Math.sqrt(normA) * Math.sqrt(normB)));
}

// Set up global pg.Pool query mock for offline test run
const originalPoolQuery = (Pool.prototype as any).query;

function setupPoolMock() {
  (Pool.prototype as any).query = async function(sql: string, params: unknown[] = []) {
    const normalizedSql = sql.toLowerCase();

    // Intercept document_embeddings insert queries
    if (normalizedSql.includes("insert into document_embeddings")) {
      const [id, tenantId, contentChunk, metadataJson, embeddingStr, createdAt] = params as any[];
      // Parse embedding string e.g. "[1.2, 2.3]"
      const embedding = JSON.parse(embeddingStr);
      const metadata = typeof metadataJson === "string" ? JSON.parse(metadataJson) : metadataJson;

      const newRecord = {
        id,
        tenant_id: tenantId,
        content_chunk: contentChunk,
        metadata,
        embedding,
        created_at: createdAt
      };
      mockEmbeddingsStore.push(newRecord);

      return {
        rowCount: 1,
        rows: [newRecord]
      };
    }

    // Intercept document_embeddings similarity search queries
    if (normalizedSql.includes("select") && normalizedSql.includes("document_embeddings")) {
      const [tenantId, queryEmbeddingStr, limit] = params as any[];
      const queryEmbedding = JSON.parse(queryEmbeddingStr);

      // Filter by tenant context and compute simulated cosine distance
      const matched = mockEmbeddingsStore
        .filter(record => record.tenant_id === tenantId)
        .map(record => {
          const distance = calculateCosineDistance(record.embedding, queryEmbedding);
          return {
            id: record.id,
            tenant_id: record.tenant_id,
            content_chunk: record.content_chunk,
            metadata: record.metadata,
            distance,
            created_at: record.created_at
          };
        })
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit);

      return {
        rowCount: matched.length,
        rows: matched
      };
    }

    return { rowCount: 0, rows: [] };
  };
}

function restorePoolMock() {
  (Pool.prototype as any).query = originalPoolQuery;
}

// Mock HTML pages database for HTTP fetch interception
const MOCK_HTML_PAGES: Record<string, string> = {
  "https://test-site.com/home": `
    <html>
      <head><title>صفحه اصلی</title></head>
      <body>
        <nav><a href="/ignored-nav">Ignored Nav Link</a></nav>
        <main>
          <h1>خوش آمدید</h1>
          <p>این یک سایت تستی برای موتور خزنده است.</p>
          <a href="/news/1">لینک اول - خبر فنی</a>
          <a href="https://test-site.com/news/2">لینک دوم - خبر کوتاه</a>
          <a href="https://external-site.com/leak">لینک خارجی نامرتبط</a>
          <a href="mailto:info@test-site.com">ایمیل پشتیبانی</a>
        </main>
        <footer><a href="/ignored-footer">Ignored Footer Link</a></footer>
      </body>
    </html>
  `,
  "https://test-site.com/news/1": `
    <html>
      <body>
        <main>
          <h1>رونمایی از موتور هوشمند اپتیموس</h1>
          <article>
            اين متن داراي حروف عربي ك و ي است كه بايد نرمال‌سازي شوند.
            این یک متن کاملاً طولانی است که قصد دارد شرط حداقل ۱۰۰ کاراکتر برای تغذیه موفقیت‌آمیز به خط لوله پردازش و ذخیره‌سازی داده را به طور کامل برآورده سازد.
            سامانه هوشمند کسب‌وکارها (نیم‌فاصله‌دار) از این تحلیل لذت خواهند برد.
          </article>
        </main>
      </body>
    </html>
  `,
  "https://test-site.com/news/2": `
    <html>
      <body>
        <article>کوتاه است.</article>
      </body>
    </html>
  `,
  "https://test-site.com/ignored-nav": "Not Found",
  "https://test-site.com/ignored-footer": "Not Found"
};

// Global Fetch Interceptor Mock
const originalFetch = globalThis.fetch;

function setupFetchMock() {
  globalThis.fetch = async (input: RequestInfo | URL, _init?: RequestInit): Promise<Response> => {
    const urlString = input.toString();

    if (MOCK_HTML_PAGES[urlString] && MOCK_HTML_PAGES[urlString] !== "Not Found") {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () => MOCK_HTML_PAGES[urlString],
        headers: new Headers({ "content-type": "text/html" })
      } as Response;
    }

    return {
      ok: false,
      status: 404,
      statusText: "Not Found",
      text: async () => "Not Found"
    } as Response;
  };
}

function restoreFetchMock() {
  globalThis.fetch = originalFetch;
}

export async function testWebCrawlerSuite() {
  console.log("▶ Running Web Crawler & Data Extraction Service Tests...");
  setupFetchMock();
  setupPoolMock();

  try {
    // ----------------------------------------------------
    // 1. Test Persian Text Normalization & Cleaning
    // ----------------------------------------------------
    console.log("  * Testing Persian text normalization...");
    const rawArabicPersian = "اين متن داراي ك و ي عربي است. کسب‌وکارها بهینه‌سازی.";
    const normalized = normalizePersianText(rawArabicPersian);

    if (normalized.includes("ي") || normalized.includes("ك")) {
      throw new Error(`Normalization Failure: Arabic 'ي' or 'ك' were not converted! Got: ${normalized}`);
    }
    if (!normalized.includes("ی") || !normalized.includes("ک")) {
      throw new Error(`Normalization Failure: Failed to standardize to Persian 'ی' and 'ک'! Got: ${normalized}`);
    }
    // Verify zero width non-joiner (\u200C) is preserved
    if (!normalized.includes("کسب‌وکارها") || !normalized.includes("بهینه‌سازی")) {
      throw new Error(`Normalization Failure: Zero Width Non-Joiner was stripped! Got: ${normalized}`);
    }
    console.log("    ✅ Successfully verified Persian/Arabic character normalization and ZWNJ preservation.");

    // ----------------------------------------------------
    // 2. Test Mock/Fallback Mode
    // ----------------------------------------------------
    console.log("  * Testing mock/fallback mode for crawler and link discovery...");

    // Test Text extraction fallback
    const mockExtractedText = await fetchAndExtractText("https://mock.com/some-fake-path");
    if (!mockExtractedText.includes("Optimus AI") || !mockExtractedText.includes("گراف دانش")) {
      throw new Error("Mock Extraction Failure: Fallback Persian article was not returned properly.");
    }
    console.log("    ✅ Successfully verified mock HTML text extraction fallback.");

    // Test Link discovery fallback
    const mockDiscoveredLinks = await extractSeedLinks("https://mock.com", 3);
    if (mockDiscoveredLinks.length !== 3) {
      throw new Error(`Mock Link Discovery Failure: Expected 3 links, got ${mockDiscoveredLinks.length}`);
    }
    if (!mockDiscoveredLinks.every(url => url.startsWith("https://mock.com"))) {
      throw new Error(`Mock Link Discovery Failure: Invalid hostnames found: ${JSON.stringify(mockDiscoveredLinks)}`);
    }
    console.log("    ✅ Successfully verified mock link discovery fallback.");

    // ----------------------------------------------------
    // 3. Test Link Discovery (Absolute resolution & Domain restrictions)
    // ----------------------------------------------------
    console.log("  * Testing link discovery with absolute resolution and domain filtering...");
    const discovered = await extractSeedLinks("https://test-site.com/home");

    const hasRelativeResolved1 = discovered.includes("https://test-site.com/news/1");
    const hasRelativeResolved2 = discovered.includes("https://test-site.com/news/2");
    const hasExternalLeaked = discovered.some(url => url.includes("external-site.com"));
    const hasMailtoLeaked = discovered.some(url => url.startsWith("mailto:"));

    if (!hasRelativeResolved1 || !hasRelativeResolved2) {
      throw new Error(`Link Discovery Failure: Relative URLs were not correctly resolved. Found: ${JSON.stringify(discovered)}`);
    }
    if (hasExternalLeaked) {
      throw new Error("Link Discovery Failure: Security violation! External hostname leaked through domain filter.");
    }
    if (hasMailtoLeaked) {
      throw new Error("Link Discovery Failure: Non-HTTP protocol leaked through protocol filter.");
    }
    console.log("    ✅ Successfully verified relative URL resolution and single-domain constraints.");

    // ----------------------------------------------------
    // 4. Test E2E Crawler Orchestration & Multi-Tenant Ingestion
    // ----------------------------------------------------
    console.log("  * Testing E2E crawler campaign orchestration...");
    const orchestrator = new CrawlerOrchestrator();
    const testTenantId = "org-test-crawler-001";

    const result = await orchestrator.runCrawlerCampaign(
      ["https://test-site.com/home"],
      testTenantId,
      "user-crawler-test",
      "req-crawler-001"
    );

    if (result.totalUrlsFound === 0) {
      throw new Error("Orchestration Failure: No target URLs were discovered.");
    }

    const detailsNews1 = result.details.find(d => d.url === "https://test-site.com/news/1");
    const detailsNews2 = result.details.find(d => d.url === "https://test-site.com/news/2");

    if (!detailsNews1 || detailsNews1.status !== "success") {
      throw new Error(`Orchestration Failure: /news/1 should be ingested successfully. Detail: ${JSON.stringify(detailsNews1)}`);
    }
    if (!detailsNews2 || detailsNews2.status !== "skipped") {
      throw new Error(`Orchestration Failure: /news/2 should be skipped due to text length limit. Detail: ${JSON.stringify(detailsNews2)}`);
    }

    if (result.totalDocumentsIngested < 1) {
      throw new Error(`Orchestration Failure: Expected at least 1 ingested document, got ${result.totalDocumentsIngested}`);
    }

    console.log(`    ✅ Successfully executed crawler campaign: ${result.totalDocumentsIngested} document(s) ingested.`);

    // ----------------------------------------------------
    // 5. Test Multi-Tenant Isolation Boundaries
    // ----------------------------------------------------
    console.log("  * Verifying multi-tenant isolation of ingested crawl documents...");

    // We will query the Vector Store under the test tenant ID and verify we can retrieve it
    await TenantContextManager.runWithTenantContext(testTenantId, "user-crawler-test", "req-crawler-002", async () => {
      const vectorStore = new VectorStoreService();
      const queryEmbedding = Array.from({ length: 768 }, () => 0.01);
      const results = await vectorStore.findSimilarEmbeddings(testTenantId, queryEmbedding, 10);

      const found = results.some(r => r.contentChunk.includes("رونمایی از موتور هوشمند اپتیموس") || r.contentChunk.includes("نرمال‌سازی"));
      if (!found) {
        throw new Error("Multi-Tenant Isolation Failure: Ingested crawler document was not found under the crawler's active tenant context!");
      }
    });

    // We will query under another tenant ID and verify they CANNOT see the document
    const competitorTenantId = "org-spy-competitor";
    await TenantContextManager.runWithTenantContext(competitorTenantId, "spy-user", "req-crawler-003", async () => {
      const vectorStore = new VectorStoreService();
      const queryEmbedding = Array.from({ length: 768 }, () => 0.01);
      const results = await vectorStore.findSimilarEmbeddings(competitorTenantId, queryEmbedding, 10);

      const leaked = results.some(r => r.contentChunk.includes("رونمایی از موتور هوشمند اپتیموس") || r.tenantId === testTenantId);
      if (leaked) {
        throw new Error("SECURITY VIOLATION! Competitor tenant leaked access to the crawler tenant's database chunks!");
      }
      console.log("    ✅ Securely verified multi-tenant isolation of autonomously collected data.");
    });

    console.log("✅ All Web Crawler & Extraction Service Tests Passed Successfully!");
  } finally {
    restoreFetchMock();
    restorePoolMock();
  }
}

// Support executing directly
if (require.main === module) {
  testWebCrawlerSuite()
    .then(() => {
      console.log("Test finished with exit code 0.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Test failed with error:", err);
      process.exit(1);
    });
}
