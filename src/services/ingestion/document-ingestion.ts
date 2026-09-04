/**
 * Optimus AI — Ingestion Pipeline & GraphRAG Orchestration
 * Handles document chunking, semantic vector indexing, and background KG population with fail-safe error boundaries.
 */

import { chunkText } from "../ai/text-chunker";
import { generateEmbedding } from "../ai/embed-client";
import { analyzeSentiment } from "../ai/sentiment-analysis";
import { VectorStoreService } from "../knowledge-graph/vector-store";
import { extractGraphEntities } from "../ai/graph-extraction";
import { GraphStoreService } from "../knowledge-graph/graph-store";
import { TenantContextManager } from "../../core/database/tenant-context";

// ==========================================
// INTERFACES
// ==========================================

export interface ChunkError {
  chunkIndex: number;
  error: string;
}

export interface IngestedChunkResult {
  chunkId: string;
  contentChunk: string;
  isGraphExtracted: boolean;
  graphError?: string;
}

export interface IngestionResult {
  success: boolean;
  tenantId: string;
  totalChunks: number;
  processedChunks: number;
  failedChunks: number;
  errors: ChunkError[];
}

// ==========================================
// SERVICE CLASS
// ==========================================

export class DocumentIngestionService {
  constructor(
    private vectorStore: VectorStoreService = new VectorStoreService(),
    private graphStore: GraphStoreService = new GraphStoreService()
  ) {}

  /**
   * Central Ingestion Pipeline for raw documents/texts.
   * Chunks, embeds, analyzes sentiment, secures elements in PostgreSQL Vector DB,
   * and attempts background KG population with fail-safe error boundaries.
   */
  public async ingestDocument(
    rawText: string,
    metadata: Record<string, unknown> = {},
    chunkingOptions?: { maxChunkSize?: number; overlap?: number }
  ): Promise<IngestionResult> {
    // 1. Get and enforce the active tenant ID from the AsyncLocalStorage context
    const tenantId = TenantContextManager.getRequiredTenantId();

    const maxChunkSize = chunkingOptions?.maxChunkSize ?? 500;
    const overlap = chunkingOptions?.overlap ?? 50;

    // 2. Step 1: Chunk text
    const chunks = chunkText(rawText, maxChunkSize, overlap);
    const totalChunks = chunks.length;

    if (totalChunks === 0) {
      return {
        success: true,
        tenantId,
        totalChunks: 0,
        processedChunks: 0,
        failedChunks: 0,
        errors: [],
      };
    }

    let processedCount = 0;
    let failedCount = 0;
    const errors: ChunkError[] = [];

    // 3. Step 2, 3 & 4: Process each chunk
    for (let i = 0; i < totalChunks; i++) {
      const chunk = chunks[i];
      let chunkId = `chunk_${tenantId}_${i}_${Date.now()}`;

      try {
        // A. Generate embedding (Uses real or mocked 768-dim provider)
        const embedding = await generateEmbedding(chunk);

        // B. Analyze sentiment
        const sentiment = await analyzeSentiment(chunk);

        // C. Build metadata payload for DB insertion
        const chunkMetadata = {
          ...metadata,
          chunkIndex: i,
          sentiment: {
            score: sentiment.score,
            label: sentiment.label,
            confidence: sentiment.confidence,
          },
        };

        // D. Insert into Vector DB
        const insertResult = await this.vectorStore.insertEmbedding(
          tenantId,
          chunk,
          embedding,
          chunkMetadata
        );
        
        // Safely extract ID if the service returns it, otherwise use fallback
        chunkId = (insertResult as any)?.id || chunkId;

        // E. Fail-safe Knowledge Graph Extraction
        try {
          const extractedGraph = await extractGraphEntities(chunk);
          await this.graphStore.upsertEntitiesAndRelationships(extractedGraph, chunkId);
        } catch (kgErr: unknown) {
          // Log the KG error, but DO NOT fail the chunk ingestion. Vector data is already saved.
          console.error(
            `[DocumentIngestionService] Fail-safe active. KG population failed for chunk ${i} (ID: ${chunkId}):`,
            kgErr instanceof Error ? kgErr.message : String(kgErr)
          );
        }

        // If we reach here, the core vector ingestion succeeded
        processedCount++;

      } catch (err: unknown) {
        // Critical failure for this chunk (e.g., embedding or vector DB insertion failed)
        failedCount++;
        const errorMessage = err instanceof Error ? err.message : String(err);
        errors.push({ chunkIndex: i, error: errorMessage });
        
        console.error(
          `[DocumentIngestionService] Critical failure for chunk ${i}:`,
          errorMessage
        );
      }
    }

    // 4. Return the aggregated result matching our agreed IngestionResult interface
    return {
      success: processedCount > 0, // True if at least one chunk was processed
      tenantId,
      totalChunks,
      processedChunks: processedCount,
      failedChunks: failedCount,
      errors,
    };
  }
}
