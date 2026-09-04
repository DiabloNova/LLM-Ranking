import { PlanDefinition } from "./types";

export const PLANS: Record<string, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    entitlements: {
      canAddUsers: false,
      canUseCustomPrompts: false,
      canExportReports: false,
      canAccessApi: false,
      maxProjects: 1,
      maxKeywords: 10,
    },
    quotas: {
      maxUsers: 1,
      maxBrands: 1,
      maxPrompts: 5,
      maxObservationsPerMonth: 50,
      maxCrawlJobsPerDay: 1,
      monthlyTokenLimit: 10000,
      monthlyCostLimitUsd: 0,
    },
    credits: {
      monthlyAllocation: 0,
    }
  },
  professional: {
    id: "professional",
    name: "Professional",
    entitlements: {
      canAddUsers: true,
      canUseCustomPrompts: true,
      canExportReports: true,
      canAccessApi: false,
      maxProjects: 5,
      maxKeywords: 100,
    },
    quotas: {
      maxUsers: 5,
      maxBrands: 5,
      maxPrompts: 50,
      maxObservationsPerMonth: 1000,
      maxCrawlJobsPerDay: 10,
      monthlyTokenLimit: 500000,
      monthlyCostLimitUsd: 50,
    },
    credits: {
      monthlyAllocation: 1000,
    }
  },
  business: {
    id: "business",
    name: "Business",
    entitlements: {
      canAddUsers: true,
      canUseCustomPrompts: true,
      canExportReports: true,
      canAccessApi: true,
      maxProjects: 20,
      maxKeywords: 500,
    },
    quotas: {
      maxUsers: 20,
      maxBrands: 20,
      maxPrompts: 200,
      maxObservationsPerMonth: 5000,
      maxCrawlJobsPerDay: 50,
      monthlyTokenLimit: 2000000,
      monthlyCostLimitUsd: 200,
    },
    credits: {
      monthlyAllocation: 5000,
    }
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    entitlements: {
      canAddUsers: true,
      canUseCustomPrompts: true,
      canExportReports: true,
      canAccessApi: true,
      maxProjects: "unlimited",
      maxKeywords: "unlimited",
    },
    quotas: {
      maxUsers: 999,
      maxBrands: 999,
      maxPrompts: 9999,
      maxObservationsPerMonth: 100000,
      maxCrawlJobsPerDay: 500,
      monthlyTokenLimit: 10000000,
      monthlyCostLimitUsd: 1000,
    },
    credits: {
      monthlyAllocation: 25000,
    }
  }
};
