import { ModelPricing } from "./types";

export const pricingCatalog: Record<string, ModelPricing> = {
  // OpenAI Paid Models
  "gpt-4o": {
    provider: "openai",
    model: "gpt-4o",
    pricingMode: "paid",
    inputCostPer1M: 2.50,
    outputCostPer1M: 10.0
  },
  // Google Gemini Paid Models
  "gemini-2.5-flash": {
    provider: "google",
    model: "gemini-2.5-flash",
    pricingMode: "paid",
    inputCostPer1M: 0.075,
    outputCostPer1M: 0.30
  },
  "gemini-2.5-pro": {
    provider: "google",
    model: "gemini-2.5-pro",
    pricingMode: "paid",
    inputCostPer1M: 1.25,
    outputCostPer1M: 5.0
  },
  // Google Gemini Free-Tier Models
  "gemini-3.5-flash": {
    provider: "google",
    model: "gemini-3.5-flash",
    pricingMode: "free_tier",
    freeTier: {
      requestsPerMinute: 15,
      requestsPerDay: 1500
    },
    availability: {
      freeTierAvailable: true,
      restrictedRegions: ["EU", "UK", "CH"]
    }
  },
  // Groq Free-Tier Model
  "llama-3.3-70b-versatile": {
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    pricingMode: "free_tier",
    freeTier: {
      requestsPerMinute: 30,
      requestsPerDay: 1000
    }
  },
  // Groq Paid Model
  "gpt-oss-120b": {
    provider: "groq",
    model: "gpt-oss-120b",
    pricingMode: "paid",
    inputCostPer1M: 2.50,
    outputCostPer1M: 10.0
  },
  // Cloudflare Workers AI Free-Tier Models
  "@cf/openai/gpt-oss-120b": {
    provider: "cloudflare",
    model: "@cf/openai/gpt-oss-120b",
    pricingMode: "free_tier",
    freeTier: {
      neuronsPerDay: 10000
    }
  },
  "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b": {
    provider: "cloudflare",
    model: "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
    pricingMode: "free_tier",
    freeTier: {
      neuronsPerDay: 50000
    }
  },
  // Mistral Paid Model
  "codestral-latest": {
    provider: "mistral",
    model: "codestral-latest",
    pricingMode: "paid",
    inputCostPer1M: 1.0,
    outputCostPer1M: 3.0
  },
  // Self-hosted / Open-Weight Models
  "glm-4.6": {
    provider: "self_hosted",
    model: "glm-4.6",
    pricingMode: "self_hosted"
  },
  "deepseek-v3-0324": {
    provider: "self_hosted",
    model: "deepseek-v3-0324",
    pricingMode: "self_hosted"
  }
};

export class CostCalculator {
  /**
   * Calculates the exact estimated cost for an LLM request.
   * If model pricing is unknown, returns undefined (cost = unknown) instead of zero.
   * Self-hosted and free-tier models resolve to 0 cost within their quota boundaries,
   * but remain clearly distinguishable from each other.
   */
  static calculateCost(model: string, inputTokens: number, outputTokens: number): number | undefined {
    const pricing = pricingCatalog[model];
    if (!pricing) {
      return undefined; // Strictly unknown pricing
    }

    if (pricing.pricingMode === "free_tier" || pricing.pricingMode === "self_hosted") {
      return 0.0; // Free within quota or self-hosted inference cost
    }

    const inputCost = (inputTokens / 1_000_000) * (pricing.inputCostPer1M || 0);
    const outputCost = (outputTokens / 1_000_000) * (pricing.outputCostPer1M || 0);
    return inputCost + outputCost;
  }
}
