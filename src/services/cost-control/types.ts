export type PricingMode = "paid" | "free_tier" | "self_hosted" | "unknown";

export interface FreeTierQuota {
  requestsPerMinute?: number;
  requestsPerDay?: number;
  tokensPerMinute?: number;
  tokensPerDay?: number;
  neuronsPerDay?: number;
}

export interface AvailabilityRestriction {
  freeTierAvailable?: boolean;
  restrictedRegions?: string[];
}

export interface UsageRecord {
  tenantId: string;
  provider: string;
  model: string;
  operation: string;
  requestId: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  units?: number;
  estimatedCost?: number;
  timestamp: number;
}

export interface ModelPricing {
  provider: string;
  model: string;
  pricingMode: PricingMode;
  inputCostPer1M?: number; // only applicable for "paid"
  outputCostPer1M?: number; // only applicable for "paid"
  freeTier?: FreeTierQuota;
  availability?: AvailabilityRestriction;
}

export interface RequestBudget {
  tenantId: string;
  period: "hour" | "day" | "month";
  limit: number;
  used: number;
}
