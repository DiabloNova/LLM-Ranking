import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { getCachedData, setCachedData } from './redis';
import type { SeoSignals } from './crawler';

export const AeoInsightsSchema = z.object({
  summary: z.string().describe('A summary of the AEO/GEO readiness.'),
  entitySalience: z.array(z.string()).describe('Key entities identified in the content.'),
  questionAnswering: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    })
  ).describe('Questions answered by the content and their extracted answers.'),
  recommendations: z.array(z.string()).describe('Actionable recommendations to improve Answer Engine Optimization.'),
});

export type AeoInsights = z.infer<typeof AeoInsightsSchema>;

export interface AeoAnalysisResult {
  success: boolean;
  data: AeoInsights | null;
  error?: string;
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = ''; // Remove hash
    return parsed.toString();
  } catch {
    return url;
  }
}

export async function analyzeSeoForAEO(url: string, signals: SeoSignals): Promise<AeoAnalysisResult> {
  const normalizedUrl = normalizeUrl(url);
  const cacheKey = `aeo_analysis:${normalizedUrl}`;

  // 1. Check Cache
  try {
    const cached = await getCachedData<AeoInsights>(cacheKey);
    if (cached) {
      return { success: true, data: cached };
    }
  } catch (error) {
    console.error('Error reading from cache:', error);
  }

  // 2. Analyze using Google AI SDK
  try {
    const prompt = `Analyze the following SEO signals for Answer Engine Optimization (AEO) and Generative Engine Optimization (GEO).

URL: ${normalizedUrl}
Title: ${signals.title || 'N/A'}
Description: ${signals.description || 'N/A'}
H1 Headings: ${signals.h1.join(' | ')}
H2 Headings: ${signals.h2.join(' | ')}
H3 Headings: ${signals.h3.join(' | ')}

Provide a detailed summary, key entities (entity salience), questions implicitly or explicitly answered by these signals, and actionable recommendations to improve AEO/GEO readiness.`;

    const { object } = await generateObject({
      model: google('gemini-1.5-pro'),
      schema: AeoInsightsSchema,
      prompt,
    });

    // 3. Cache Result (7 days = 604800 seconds)
    try {
      await setCachedData(cacheKey, object, 604800);
    } catch (error) {
      console.error('Error setting cache:', error);
    }

    return { success: true, data: object };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred during AI analysis'
    };
  }
}
