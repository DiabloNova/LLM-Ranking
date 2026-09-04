import assert from "node:assert";
import { Pool } from "pg";
import { embedQuery } from "../../../src/services/ai/query-embedding";
import { retrieveRelevantContext } from "../../../src/services/rag/context-retrieval";
import { answerQuestion } from "../../../src/services/rag/query-service";
import { TenantContextManager } from "../../../src/core/database/tenant-context";
import { VectorStoreService } from "../../../src/services/knowledge-graph/vector-store";

interface MockDocumentRecord {
  id: string;
  tenant_id: string;
  content_chunk: string;
  metadata: Record<string, unknown>;
  embedding: number[];
  created_at: string;
}

// Local in-memory store for standalone test execution
const localEmbeddingsStore: MockDocumentRecord[] = [];

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

interface MockQueryable {
  query: (sql: string, params?: unknown[]) => Promise<{ rowCount: number; rows: unknown[] }>;
}

// Resilient query mocking for standalone execution
const originalQuery = Pool.prototype.query;
function setupMockInterceptors() {
  (Pool.prototype as unknown as MockQueryable).query = async function(sql: string, params: unknown[] = []) {
    const normalizedSql = sql.toLowerCase();

    if (normalizedSql.includes("insert into document_embeddings")) {
      const [id, tenantId, contentChunk, metadataJson, embeddingStr, createdAt] = params as [string, string, string, string | Record<string, unknown>, string, string];
      const embedding = JSON.parse(embeddingStr) as number[];
      const metadata = typeof metadataJson === "string" ? JSON.parse(metadataJson) as Record<string, unknown> : metadataJson;

      const newRecord: MockDocumentRecord = {
        id,
        tenant_id: tenantId,
        content_chunk: contentChunk,
        metadata,
        embedding,
        created_at: createdAt
      };
      localEmbeddingsStore.push(newRecord);

      return {
        rowCount: 1,
        rows: [newRecord]
      };
    }

    if (normalizedSql.includes("select") && normalizedSql.includes("document_embeddings")) {
      const [tenantId, queryEmbeddingStr, limit] = params as [string, string, number];
      const queryEmbedding = JSON.parse(queryEmbeddingStr) as number[];

      const matched = localEmbeddingsStore
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

    // Call original or fallback
    if (originalQuery) {
      return originalQuery.apply(this, [sql, params as unknown[]]);
    }
    return { rowCount: 0, rows: [] };
  };
}

export async function testRAGQueryService() {
  console.log("▶ Running Optimus RAG Query Pipeline Tests...");

  // Use unique tenant IDs to guarantee absolute isolation and prevent state pollution from other test files in global runs
  const tenantAId = "org-enterprise-rag-01";
  const tenantBId = "org-startup-rag-02";

  const vectorService = new VectorStoreService();

  // 1. Check Embedding dimensions
  console.log("  * Testing Query Embedding Dimension (must be exactly 768)...");
  const query = "ویژگی‌های سیستم اپتیموس چیست؟";
  const embedding = await embedQuery(query);
  assert.strictEqual(embedding.length, 768, `Expected 768-dimensional embedding, but got ${embedding.length}`);

  // 2. Ingest isolated brand intelligence documents
  console.log("  * Ingesting isolated document chunks for Tenant A and Tenant B...");
  const chunkA1 = "اپتیموس ای آی اولین موتور بهینه‌سازی GEO در خاورمیانه است که بر مبنای هوش مصنوعی کار می‌کند.";
  // Create a 768-dimensional mock embedding for chunk A1
  const embeddingA1 = Array.from({ length: 768 }, (_, i) => (i === 0 ? 0.95 : 0.001));

  const chunkB1 = "The competitor is launching a standard rule-based semantic analyzer with no LLM capabilities.";
  const embeddingB1 = Array.from({ length: 768 }, (_, i) => (i === 0 ? 0.15 : 0.005));

  await TenantContextManager.runWithTenantContext(tenantAId, "user-01", "req-rag-01", async () => {
    await vectorService.insertEmbedding(tenantAId, chunkA1, embeddingA1, {
      lang: "fa",
      sentiment: { score: 0.8, label: "positive" }
    });
  });

  await TenantContextManager.runWithTenantContext(tenantBId, "user-02", "req-rag-02", async () => {
    await vectorService.insertEmbedding(tenantBId, chunkB1, embeddingB1, {
      lang: "en",
      sentiment: { score: -0.2, label: "neutral" }
    });
  });

  // 3. Test Retrieve context under Tenant A context
  console.log("  * Testing context retrieval tenant isolation & sentiment mapping...");
  await TenantContextManager.runWithTenantContext(tenantAId, "user-01", "req-rag-03", async () => {
    const results = await retrieveRelevantContext(embeddingA1, tenantAId, 5);

    assert.ok(results.length > 0, "Should retrieve at least one chunk");
    assert.strictEqual(results[0].content, chunkA1, "Should match the ingested chunk A1");
    assert.deepStrictEqual(results[0].sentiment, { score: 0.8, label: "positive" }, "Should correctly map sentiment from metadata");

    // Cross-tenant check
    const hasTenantBData = results.some(r => r.content.includes("competitor") || r.id === "req-rag-02");
    assert.strictEqual(hasTenantBData, false, "Cross-tenant context leakage detected in context retrieval!");
  });

  // 4. Test RAG Flow with Tenant A and Tenant B
  console.log("  * Testing RAG Flow with active tenant isolation...");
  await TenantContextManager.runWithTenantContext(tenantAId, "user-01", "req-rag-04", async () => {
    const response = await answerQuestion("توضیح دهید سیستم اپتیموس چیست؟", tenantAId);

    assert.ok(response.answer, "RAG answer should be generated");
    assert.ok(response.confidence > 0, "Confidence score should be computed and > 0");
    assert.ok(response.sources.length >= 1, "Should have at least 1 source retrieved");
    assert.strictEqual(response.sources[0].content, chunkA1, "Primary source should belong to Tenant A");
  });

  await TenantContextManager.runWithTenantContext(tenantBId, "user-02", "req-rag-05", async () => {
    const response = await answerQuestion("What is the competitor launching?", tenantBId);

    assert.ok(response.answer, "RAG answer should be generated");
    assert.ok(response.sources.length >= 1, "Should have at least 1 source retrieved");
    assert.strictEqual(response.sources[0].content, chunkB1, "Primary source should belong to Tenant B");
  });

  // 5. Test Edge Case: Question with no relevant context
  console.log("  * Testing RAG flow edge case: No relevant context in DB...");
  await TenantContextManager.runWithTenantContext(tenantAId, "user-01", "req-rag-06", async () => {
    // Generate a distant query embedding with very low similarity to chunkA1
    // A completely empty/unrelated embedding
    const distantEmbedding = Array.from({ length: 768 }, () => 0.0);
    const results = await retrieveRelevantContext(distantEmbedding, tenantAId, 5);
    assert.ok(results, "Should successfully retrieve context even if similarity is low or empty");

    const response = await answerQuestion("آیا خورشید امروز ابری است؟", tenantAId);
    assert.ok(response.answer, "Should still return an answer even with empty or low-relevance context");
  });

  // 6. Test Edge Case: Very long question handling
  console.log("  * Testing RAG flow edge case: Very long question...");
  await TenantContextManager.runWithTenantContext(tenantAId, "user-01", "req-rag-07", async () => {
    const longQuestion = "اپتیموس ".repeat(100) + " چیست؟";
    const response = await answerQuestion(longQuestion, tenantAId);
    assert.ok(response.answer, "Should successfully handle extremely long queries without breaking");
  });

  // 7. Test Edge Case: Mixed Persian & English questions
  console.log("  * Testing RAG flow edge case: Mixed Persian/English input...");
  await TenantContextManager.runWithTenantContext(tenantAId, "user-01", "req-rag-08", async () => {
    const response = await answerQuestion("در مورد competitor launch توضیح بده", tenantAId);
    assert.ok(response.answer, "Should successfully process mixed-language inputs");
  });

  console.log("✅ Optimus RAG Query Pipeline Tests Passed Successfully!");
}

// Standard direct execution fallback
if (require.main === module) {
  setupMockInterceptors();
  testRAGQueryService().catch(err => {
    console.error("❌ Optimus RAG Query Pipeline Tests Failed:", err);
    process.exit(1);
  });
}
