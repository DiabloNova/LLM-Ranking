/**
 * Phase 7C.5 — Enterprise Admin Analytics Specification
 * Aggregates SaaS metrics for Platform growth, operations, and estimated AI financial costs.
 */

import { AdminMockDatabase } from "../infrastructure/mock-db";

export interface PlatformMetrics {
  totalTenants: number;
  tenantGrowthRatePct: number;
  activeUsersCount: number;
  totalAIConsumptionTokens: number;
  processingVolumeObservations: number;
  totalStorageUsageBytes: number;
}

export interface OperationalMetrics {
  failedBackgroundJobs: number;
  queueHealthPct: number;
  crawlerSuccessRatePct: number;
  averageAIProviderLatencyMs: number;
  activeQueueLength: number;
}

export interface FinancialMetrics {
  estimatedMonthlyAIEngineCostUsd: number;
  subscriptionRevenueMonthlyUsd: number;
  averageQuotaConsumptionPct: number;
}

export class AdminAnalyticsEngine {
  private db: AdminMockDatabase;

  constructor(db?: AdminMockDatabase) {
    this.db = db || AdminMockDatabase.getInstance();
  }

  /**
   * Platform Metrics calculations
   */
  public getPlatformMetrics(): PlatformMetrics {
    const list = Array.from(this.db.tenants.values());
    const totalTenants = list.length;
    const activeUsersCount = list.reduce((sum, t) => sum + t.quota.maxUsers, 0);
    const totalAIConsumptionTokens = list.reduce((sum, t) => sum + t.quota.usedTokensThisMonth, 0);
    const processingVolumeObservations = list.reduce((sum, t) => sum + t.quota.usedObservationsThisMonth, 0);

    return {
      totalTenants,
      tenantGrowthRatePct: 15.4, // +15.4% week-on-week
      activeUsersCount,
      totalAIConsumptionTokens,
      processingVolumeObservations,
      totalStorageUsageBytes: 1024 * 1024 * 1024 * 342.8 // 342.8 GB
    };
  }

  /**
   * Operational Metrics calculations
   */
  public getOperationalMetrics(): OperationalMetrics {
    return {
      failedBackgroundJobs: 3,
      queueHealthPct: 99.4,
      crawlerSuccessRatePct: 98.7,
      averageAIProviderLatencyMs: 915, // average across models
      activeQueueLength: 5
    };
  }

  /**
   * Financial Metrics calculations
   */
  public getFinancialMetrics(): FinancialMetrics {
    const list = Array.from(this.db.tenants.values());

    // Calculate subscription revenue
    const subscriptionRevenueMonthlyUsd = list.reduce((sum, t) => {
      if (t.status !== "active") return sum;
      if (t.subscription.billingCycle === "yearly") {
        return sum + Math.round(t.subscription.priceAmount / 12);
      }
      return sum + t.subscription.priceAmount;
    }, 0);

    // AI costs estimated at $0.002 per 1K tokens
    const totalTokens = list.reduce((sum, t) => sum + t.quota.usedTokensThisMonth, 0);
    const estimatedMonthlyAIEngineCostUsd = parseFloat(((totalTokens / 1000) * 0.002).toFixed(2));

    // Average quota consumption
    const quotaConsumptions = list.map(t => {
      const tokenConsumption = t.quota.usedTokensThisMonth / t.quota.monthlyTokenLimit;
      const obsConsumption = t.quota.usedObservationsThisMonth / t.quota.maxObservationsPerMonth;
      return ((tokenConsumption + obsConsumption) / 2) * 100;
    });
    const averageQuotaConsumptionPct = quotaConsumptions.length > 0
      ? parseFloat((quotaConsumptions.reduce((a, b) => a + b, 0) / quotaConsumptions.length).toFixed(1))
      : 0;

    return {
      estimatedMonthlyAIEngineCostUsd,
      subscriptionRevenueMonthlyUsd,
      averageQuotaConsumptionPct
    };
  }
}
