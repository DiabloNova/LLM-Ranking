export type SubscriptionPlanId = "free" | "professional" | "business" | "enterprise";
export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "expired";

export interface FeatureEntitlements {
  canAddUsers: boolean;
  canUseCustomPrompts: boolean;
  canExportReports: boolean;
  canAccessApi: boolean;
  maxProjects: number | "unlimited";
  maxKeywords: number | "unlimited";
}

export interface PlanDefinition {
  id: SubscriptionPlanId;
  name: string;
  entitlements: FeatureEntitlements;
  quotas: {
    maxUsers: number;
    maxBrands: number;
    maxPrompts: number;
    maxObservationsPerMonth: number;
    maxCrawlJobsPerDay: number;
    monthlyTokenLimit: number;
    monthlyCostLimitUsd: number;
  };
  credits: {
    monthlyAllocation: number;
  };
}

export interface TenantSubscriptionState {
  tenantId: string;
  effectivePlan: PlanDefinition;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  isExpired: boolean;
}

export interface QuotaUsage {
  usedObservationsThisMonth: number;
  usedTokensThisMonth: number;
  usedCrawlJobsToday: number;
  creditsBalance: number;
}
