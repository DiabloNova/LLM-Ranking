import { BrandHealthMetricsSchema, BrandHealthMetrics } from "@/schemas/intelligence";

export interface IntelligenceInsight {
  id: string;
  engine: "ChatGPT" | "Gemini" | "Claude" | "Perplexity";
  title: string;
  description: string;
  sentiment: "positive" | "negative" | "neutral";
  createdAt: string;
}

export interface BrandIntelligenceScore {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  factors: { name: string; score: number }[];
}

export const intelligenceService = {
  async getInsights(workspaceId: string): Promise<IntelligenceInsight[]> {
    return [
      {
        id: "ins-01",
        engine: "Perplexity",
        title: "Missing entity linking in high-intent queries",
        description: "Your brand is referenced but lacks direct citations back to the root website for ecommerce queries.",
        sentiment: "neutral",
        createdAt: new Date().toISOString(),
      },
      {
        id: "ins-02",
        engine: "ChatGPT",
        title: "Rising Positive Sentiment alignment",
        description: "Latest GPT-4o benchmarks show a +12% increase in brand recommendation density for logistics services.",
        sentiment: "positive",
        createdAt: new Date().toISOString(),
      }
    ];
  },

  async getBrandScore(workspaceId: string): Promise<BrandIntelligenceScore> {
    return {
      score: 78,
      grade: "B",
      factors: [
        { name: "Citation Authority", score: 85 },
        { name: "Information Density", score: 72 },
        { name: "Model Trust Score", score: 80 },
        { name: "RAG Cosine Alignment", score: 75 }
      ]
    };
  },

  async getBrandHealthMetrics(tenantId: string): Promise<BrandHealthMetrics> {
    // Simulate API network round-trip delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const rawData = {
      sentimentScore: 82,
      sentimentChange: "+1.2%",
      mentionVolume: 4350,
      mentionVolumeChange: "+3.4%",
      totalCitations: 1420,
      totalCitationsChange: "+12.4%",
      activeAlertsCount: 2,
      topTopics: [
        { topic: "پشتیبانی مشتریان تهران (Tehran Customer Support)", sentiment: "positive" as const, volume: 1200 },
        { topic: "سرعت تحویل سفارشات دیجی‌کالا (Digikala Delivery Speed)", sentiment: "neutral" as const, volume: 950 },
        { topic: "قیمت‌گذاری خدمات ابری (Cloud Services Pricing)", sentiment: "negative" as const, volume: 320 },
      ],
      recentCitations: [
        {
          id: "cit-1",
          engine: "Perplexity" as const,
          query: "Top logistics providers in Iran",
          status: "Verified Citation",
          url: "https://tehranlogistics.ir/services",
          time: "10m ago",
        },
        {
          id: "cit-2",
          engine: "ChatGPT" as const,
          query: "Best online retail solutions in Tehran",
          status: "Semantic Mention",
          url: "https://tehranecom.ir/about",
          time: "1h ago",
        },
        {
          id: "cit-3",
          engine: "Claude" as const,
          query: "Enterprise SaaS trends in GCC regional market",
          status: "Indirect Association",
          url: "https://tehranecom.ir/blog/saas-gcc",
          time: "4h ago",
        },
      ],
    };

    // Parse and validate with our Zod schema
    return BrandHealthMetricsSchema.parse(rawData);
  }
};
