/**
 * Optimus AI — RAG Query Service
 * Orchestrates query embedding, multi-tenant context retrieval, prompt construction, and LLM query answering.
 */

import { getLLMClient } from "../ai/llm-client";
import { embedQuery } from "../ai/query-embedding";
import { retrieveRelevantContext, RetrievedChunk } from "./context-retrieval";

export interface RAGResponse {
  answer: string;
  sources: RetrievedChunk[];
  confidence: number; // 0 to 1, based on similarity scores
}

export const RAG_SYSTEM_PROMPT = `You are an expert brand intelligence analyst for Optimus AI.

Your task is to answer the user's question based ONLY on the provided context from brand intelligence data.

Rules:
1. If the answer is not in the context, say "I don't have enough information to answer this question based on the available data."
2. Cite the source chunks by their IDs when making specific claims.
3. If the context contains conflicting information, mention the different perspectives.
4. Maintain a professional, analytical tone.
5. Answer in the same language as the question (Persian or English).

Context:
{context}

Question: {question}

Answer:`;

/**
 * Answers a user's question using Retrieval-Augmented Generation (RAG).
 * Fully respects tenant isolation boundaries.
 */
export async function answerQuestion(
  question: string,
  organizationId: string,
  limit: number = 5
): Promise<RAGResponse> {
  if (!organizationId) {
    throw new Error("Tenant context violation: organizationId must be provided for RAG Query Service");
  }

  // 1. Convert question to vector embedding (768 dimensions)
  const queryEmbedding = await embedQuery(question);

  // 2. Retrieve top-K relevant chunks under strict tenant isolation
  const sources = await retrieveRelevantContext(queryEmbedding, organizationId, limit);

  // 3. Compute overall confidence score based on the highest similarity score (Top 1)
  const confidence = sources.length > 0 ? Math.max(0, Math.min(1, sources[0].similarityScore)) : 0;

  // 4. Construct context text
  let contextText = "No relevant context found in brand intelligence data.";
  if (sources.length > 0) {
    contextText = sources
      .map((source, index) => `[Source ${index + 1}] ID: ${source.id}\nContent: ${source.content}`)
      .join("\n\n");
  }

  // 5. Construct the prompt
  const finalPrompt = RAG_SYSTEM_PROMPT
    .replace("{context}", contextText)
    .replace("{question}", question);

  // 6. Execute LLM Call using abstract client
  const llm = getLLMClient();
  const answer = await llm.generateText(finalPrompt, {
    temperature: 0.1, // Low temperature for factual RAG responses and minimal hallucination
  });

  return {
    answer,
    sources,
    confidence,
  };
}
