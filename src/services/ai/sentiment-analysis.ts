import { generateObject } from 'ai';
import { z } from 'zod';
import { getLLMClient, GeminiLLMClient, geminiFlashModel } from './llm-client';

export interface SentimentVO {
  score: number; // -1 to 1
  label: 'positive' | 'negative' | 'neutral';
  confidence: number; // 0 to 1
  emotions: string[]; // e.g., ['anger', 'joy', 'sadness']
}

export const sentimentSchema = z.object({
  score: z.number().min(-1).max(1),
  label: z.enum(['positive', 'negative', 'neutral']),
  confidence: z.number().min(0).max(1),
  emotions: z.array(z.string()),
});

const systemPrompt = `You are an expert Persian language sentiment analyzer.
Analyze the following Persian text and return a JSON object with:
- score: number between -1 (very negative) and 1 (very positive)
- label: 'positive' | 'negative' | 'neutral'
- confidence: number between 0 and 1
- emotions: array of detected emotions (e.g., 'anger', 'joy', 'sadness')

Please ensure that your analysis correctly accounts for Persian language contexts, metaphors, idioms, and sarcastic undertones (e.g., تعارف or کنایه).

Examples:
Text: "این محصول واقعاً عالی بود، خیلی راضی هستم"
Output: {"score": 0.9, "label": "positive", "confidence": 0.95, "emotions": ["joy"]}

Text: "خدمات مشتری افتضاح بود، دیگه خرید نمی‌کنم"
Output: {"score": -0.8, "label": "negative", "confidence": 0.92, "emotions": ["anger"]}

Now analyze this text:`;

/**
 * Analyzes the sentiment of a Persian text string.
 * Leverages structured output parsing with Vercel AI SDK when Gemini API is active,
 * Test-only fallback is selected by the client factory; production fails closed.
 */
export async function analyzeSentiment(text: string): Promise<SentimentVO> {
  const client = getLLMClient();

  if (client instanceof GeminiLLMClient && geminiFlashModel) {
    const result = await generateObject({
      model: geminiFlashModel,
      schema: sentimentSchema,
      prompt: `${systemPrompt}\n\n"${text}"`,
    });

    return result.object;
  }

  // Fallback to mock LLM responses or structured generation simulation
  const generatedText = await client.generateText(text, {
    systemPrompt,
  });

  try {
    const parsed = JSON.parse(generatedText);
    const validated = sentimentSchema.parse(parsed);
    return validated;
  } catch (error) {
    throw new Error("Sentiment provider returned invalid structured output.", { cause: error });
  }
}
