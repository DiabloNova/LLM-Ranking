import { z } from "zod";

export const BrandHealthMetricsSchema = z.object({
  sentimentScore: z.number().min(0).max(100),
  sentimentChange: z.string(),
  mentionVolume: z.number().nonnegative(),
  mentionVolumeChange: z.string(),
  totalCitations: z.number().nonnegative(),
  totalCitationsChange: z.string(),
  activeAlertsCount: z.number().nonnegative(),
  topTopics: z.array(
    z.object({
      topic: z.string(),
      sentiment: z.enum(["positive", "neutral", "negative"]),
      volume: z.number().nonnegative(),
    })
  ),
  recentCitations: z.array(
    z.object({
      id: z.string(),
      engine: z.enum(["ChatGPT", "Gemini", "Claude", "Perplexity"]),
      query: z.string(),
      status: z.string(),
      url: z.string().url(),
      time: z.string(),
    })
  ),
});

export type BrandHealthMetrics = z.infer<typeof BrandHealthMetricsSchema>;
