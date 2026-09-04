import { embed } from "ai";
import { googleProvider } from "./llm-client";

/**
 * Generates a deterministic mock embedding of length 768 for offline/testing modes.
 */
export function generateDeterministicMockEmbedding(text: string): number[] {
  // Simple deterministic hash based on text
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }

  return Array.from({ length: 768 }, (_, i) => {
    const factor = Math.sin(hash + i) * 0.5;
    // Keep it centered around 0.01 with slight variations based on text hash
    return parseFloat((0.01 + factor * 0.005).toFixed(6));
  });
}

/**
 * Generates a 768-dimensional vector embedding for a given text using text-embedding-004.
 * Integrates with Google Gemini Provider via Vercel AI SDK.
 * Fails closed when the production embedding provider is unavailable.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (process.env.NODE_ENV === "test") return generateDeterministicMockEmbedding(text);
  if (!googleProvider) throw new Error("Google Generative AI is not configured.");

  try {
    const { embedding } = await embed({
      model: googleProvider.embedding("text-embedding-004"),
      value: text,
    });
    return embedding;
  } catch (error) {
    console.error("[generateEmbedding] Provider failed", error);
    throw error;
  }
}
