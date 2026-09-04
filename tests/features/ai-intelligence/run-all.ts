/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Phase 7C.1 — AI Visibility Intelligence Engine
 * Comprehensive Enterprise Test Runner Suite
 */

import { Pool } from "pg";
import { db } from "../../../src/features/ai-intelligence/repositories";
import { testDomain } from "./domain.test";
import { testSecurity } from "./security.test";
import { testApplication } from "./application.test";
import { testEvents } from "./events.test";
import { TenantContextManager } from "../../../src/core/database/tenant-context";
import { testTenantPipeline } from "./tenant-pipeline.test";
import { testVectorStore } from "./vector-store.test";
import { testDocumentIngestion } from "../../services/ingestion/document-ingestion.test";
import { testRAGQueryService } from "../../services/rag/query-service.test";

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

// Global Pool.query mock to intercept queries for local offline TSX run checks
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

  if (normalizedSql.includes("select version from organizations")) {
    const orgId = params[0] as string;
    const org = db.organizations.get(orgId);
    if (org) {
      return { rowCount: 1, rows: [{ version: org.audit.version }] };
    }
    return { rowCount: 0, rows: [] };
  }

  if (normalizedSql.includes("select id, name, slug")) {
    const orgId = params[0] as string;
    const org = db.organizations.get(orgId);
    if (org && !org.audit.deletedAt) {
      return {
        rowCount: 1,
        rows: [{
          id: org.id,
          name: org.name,
          slug: org.slug,
          plan: org.plan,
          created_at: org.audit.createdAt,
          updated_at: org.audit.updatedAt,
          created_by: org.audit.createdBy,
          updated_by: org.audit.updatedBy,
          deleted_at: org.audit.deletedAt,
          version: org.audit.version
        }]
      };
    }
    return { rowCount: 0, rows: [] };
  }

  if (normalizedSql.includes("insert into organizations")) {
    const [id, name, slug, plan, created_at, updated_at, created_by, updated_by, version] = params as any[];
    db.organizations.set(id, {
      id,
      name,
      slug,
      plan,
      audit: {
        createdAt: created_at,
        updatedAt: updated_at,
        createdBy: created_by,
        updatedBy: updated_by,
        version
      }
    });
    return { rowCount: 1, rows: [] };
  }

  if (normalizedSql.includes("update organizations")) {
    if (normalizedSql.includes("deleted_at")) {
      const [deletedAt, deletedBy, updatedAt, id] = params as any[];
      const org = db.organizations.get(id);
      if (org) {
        org.audit.deletedAt = deletedAt;
        org.audit.updatedBy = deletedBy;
        org.audit.updatedAt = updatedAt;
        return { rowCount: 1, rows: [] };
      }
      return { rowCount: 0, rows: [] };
    } else {
      const [name, slug, plan, updatedAt, updatedBy, version, id] = params as any[];
      const org = db.organizations.get(id);
      if (org) {
        org.name = name;
        org.slug = slug;
        org.plan = plan;
        org.audit.updatedAt = updatedAt;
        org.audit.updatedBy = updatedBy;
        org.audit.version = version;
        return { rowCount: 1, rows: [] };
      }
      return { rowCount: 0, rows: [] };
    }
  }

  return { rowCount: 0, rows: [] };
};

async function main() {
  console.log("====================================================");
  console.log("🚀 Starting Enterprise Platform Architecture Tests...");
  console.log("====================================================");

  try {
    testDomain();

    // Run Security tests under an explicit System Context
    await TenantContextManager.runWithSystemContext("user-admin", "req-admin-01", async () => {
      await testSecurity();
    });

    // Run Application CQRS tests under an explicit Tenant Context
    await TenantContextManager.runWithTenantContext("org-enterprise-01", "user-test-01", "req-test-01", async () => {
      await testApplication();
    });

    // Run custom Tenant Pipeline Context tests
    await testTenantPipeline();

    // Run Vector Store and Persian KG Foundation tests
    await testVectorStore();

    // Run Document Ingestion Pipeline tests
    await testDocumentIngestion();
    // Run Optimus RAG Query Pipeline Tests
    await testRAGQueryService();

    testEvents();

    // Allow asynchronous event bus execution to complete before final status log
    setTimeout(() => {
      console.log("\n====================================================");
      console.log("🎉 ALL ENTERPRISE TEST SUITES PASSED SECURELY!");
      console.log("====================================================");
    }, 100);

  } catch (error) {
    console.error("\n❌ TEST SUITE RUNNER FAILURE:", error);
    process.exit(1);
  }
}

main();
