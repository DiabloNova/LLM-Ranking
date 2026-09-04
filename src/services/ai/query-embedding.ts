/**
 * Optimus AI — Query Embedding Service
 * Generates 768-dimensional semantic vector embeddings for user queries using text-embedding-004.
 */

import { embed } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY || '';

const googleProvider = googleApiKey
  ? createGoogleGenerativeAI({ apiKey: googleApiKey })
  : null;

/**
 * Converts a user query into a 768-dimensional vector embedding.
 * Uses the native text-embedding-004 model via Vercel AI SDK and Google Generative AI Provider.
 * Uses a real provider in production; deterministic vectors are test-only.
 */
export async function embedQuery(query: string): Promise<number[]> {
  if (process.env.NODE_ENV === 'test') {
    // Generate a deterministic 768-dimensional mock embedding based on the query text
    // This ensures distinct queries produce stable, different vectors for similarity testing.
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      hash = (hash << 5) - hash + query.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }

    const factor = Math.abs(hash) % 100 / 100; // Value between 0.0 and 0.99
    return Array.from({ length: 768 }, (_, i) => {
      if (i === 0) {
        return 0.8 + factor * 0.15; // Primary dimension variation for query matching
      }
      return 0.01 + ((i + Math.abs(hash)) % 100) / 10000; // Small deterministic noise
    });
  }

  if (!googleProvider) throw new Error('Google Generative AI is not configured.');
  const embeddingModel = googleProvider.textEmbeddingModel('text-embedding-004');

  const { embedding } = await embed({
    model: embeddingModel,
    value: query,
  });

  return embedding;
}
