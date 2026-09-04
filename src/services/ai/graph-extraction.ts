import { generateObject } from 'ai';
import { z } from 'zod';
import { getLLMClient, GeminiLLMClient, geminiFlashModel } from './llm-client';

export type EntityType = 'brand' | 'person' | 'product' | 'organization' | 'concept' | 'location';

export interface ExtractedEntity {
  name: string;
  type: EntityType;
  properties?: Record<string, unknown>;
}

export interface ExtractedRelationship {
  sourceEntityName: string;
  targetEntityName: string;
  relationshipType: string;
  properties?: Record<string, unknown>;
}

export interface ExtractedGraph {
  entities: ExtractedEntity[];
  relationships: ExtractedRelationship[];
}

export const extractedGraphSchema = z.object({
  entities: z.array(
    z.object({
      name: z.string(),
      type: z.enum(['brand', 'person', 'product', 'organization', 'concept', 'location']),
      // ✅ اصلاح شده: اضافه کردن z.string() به عنوان نوع کلید
      properties: z.record(z.string(), z.unknown()).optional(),
    })
  ),
  relationships: z.array(
    z.object({
      sourceEntityName: z.string(),
      targetEntityName: z.string(),
      relationshipType: z.string(), // e.g., 'competes_with', 'owns', 'mentions', 'located_in'
      // ✅ اصلاح شده: اضافه کردن z.string() به عنوان نوع کلید
      properties: z.record(z.string(), z.unknown()).optional(),
    })
  ),
});

const systemPrompt = `You are an expert knowledge graph extraction engine for brand intelligence.
Analyze the provided text and extract all relevant entities and the relationships between them.
Focus on brands, competitors, key people, products, and market concepts.
Return the result strictly as a JSON object matching the provided schema.`;

/**
 * Extracts semantic entities and their relationships from a text chunk.
 * Leverages structured output parsing with Vercel AI SDK when Gemini API is active,
 * Test fixtures may inject deterministic providers; production does not synthesize graph data.
 */
export async function extractGraphEntities(text: string): Promise<ExtractedGraph> {
  const client = getLLMClient();

  if (client instanceof GeminiLLMClient && geminiFlashModel) {
    const result = await generateObject({
      model: geminiFlashModel,
      schema: extractedGraphSchema,
      prompt: `${systemPrompt}\n\nAnalyze this text:\n"${text}"`,
    });

    return result.object as ExtractedGraph;
  }

  throw new Error("Graph extraction provider is not configured for this environment.");

}
