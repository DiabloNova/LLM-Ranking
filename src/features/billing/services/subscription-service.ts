import { drizzle } from "drizzle-orm/node-postgres";
import { eq, sql } from "drizzle-orm";
import { TenantContextManager } from "@/core/database/tenant-context";
import { tenantSubscriptions, tenantQuotas, creditTransactions } from "../../../../database/schema";
import { PLANS } from "../domain/plans";
import { SubscriptionPlanId, TenantSubscriptionState, FeatureEntitlements, QuotaUsage } from "../domain/types";

export class SubscriptionService {
  /**
   * Resolves the effective subscription state for the active tenant.
   * If a subscription is missing, expired, or canceled, it falls back to the Free plan.
   */
  public async getEffectiveSubscription(): Promise<TenantSubscriptionState> {
    const tenantId = TenantContextManager.getRequiredTenantId();
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Database client not available in TenantContext");
    const db = drizzle(client);

    const subs = await db
      .select()
      .from(tenantSubscriptions)
      .where(eq(tenantSubscriptions.tenantId, tenantId))
      .limit(1);

    const now = new Date();

    if (subs.length === 0) {
      return {
        tenantId,
        effectivePlan: PLANS["free"],
        status: "active",
        startDate: now.toISOString(),
        endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        isExpired: false,
      };
    }

    const sub = subs[0];
    const isExpired = new Date(sub.endDate) < now || sub.status === "canceled" || sub.status === "expired";
    const planId = isExpired ? "free" : (sub.plan as SubscriptionPlanId);

    // Ensure plan exists in canonical definition
    const effectivePlan = PLANS[planId] || PLANS["free"];

    return {
      tenantId,
      effectivePlan,
      status: isExpired ? "expired" : (sub.status as any),
      startDate: sub.startDate.toISOString(),
      endDate: sub.endDate.toISOString(),
      isExpired,
    };
  }

  /**
   * Checks if the tenant has a specific feature entitlement.
   */
  public async checkEntitlement(feature: keyof FeatureEntitlements): Promise<boolean> {
    const state = await this.getEffectiveSubscription();
    const value = state.effectivePlan.entitlements[feature];
    return value === true;
  }

  /**
   * Returns current quota usage and credit balance.
   */
  public async getQuotaUsage(): Promise<QuotaUsage> {
    const tenantId = TenantContextManager.getRequiredTenantId();
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Database client not available in TenantContext");
    const db = drizzle(client);

    const quotas = await db
      .select()
      .from(tenantQuotas)
      .where(eq(tenantQuotas.tenantId, tenantId))
      .limit(1);

    if (quotas.length === 0) {
      return {
        usedObservationsThisMonth: 0,
        usedTokensThisMonth: 0,
        usedCrawlJobsToday: 0,
        creditsBalance: 0,
      };
    }

    const q = quotas[0];
    return {
      usedObservationsThisMonth: q.usedObservationsThisMonth,
      usedTokensThisMonth: q.usedTokensThisMonth,
      usedCrawlJobsToday: q.usedCrawlJobsToday,
      creditsBalance: q.creditsBalance,
    };
  }

  /**
   * Consumes a specific amount of credits atomically.
   * Throws an error if insufficient balance.
   */
  public async consumeCredits(amount: number, description: string, referenceId?: string): Promise<void> {
    if (amount <= 0) return;

    const tenantId = TenantContextManager.getRequiredTenantId();
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Database client not available in TenantContext");
    const db = drizzle(client);

    // Atomically decrement balance, returning the new balance to check if it dropped below zero
    const result = await db
      .update(tenantQuotas)
      .set({
        creditsBalance: sql`${tenantQuotas.creditsBalance} - ${amount}`
      })
      .where(eq(tenantQuotas.tenantId, tenantId))
      .returning({ newBalance: tenantQuotas.creditsBalance });

    if (result.length === 0) {
      throw new Error("Quota record not found for tenant");
    }

    if (result[0].newBalance < 0) {
      // Rollback the deduction
      await db
        .update(tenantQuotas)
        .set({
          creditsBalance: sql`${tenantQuotas.creditsBalance} + ${amount}`
        })
        .where(eq(tenantQuotas.tenantId, tenantId));

      throw new Error("Insufficient credit balance");
    }

    // Record the transaction
    await db.insert(creditTransactions).values({
      tenantId,
      amount: -amount,
      transactionType: "consumption",
      description,
      referenceId,
    });
  }

  /**
   * Allocates credits to the tenant (e.g. monthly renewal or purchase).
   */
  public async allocateCredits(amount: number, description: string, referenceId?: string): Promise<void> {
    if (amount <= 0) return;

    const tenantId = TenantContextManager.getRequiredTenantId();
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Database client not available in TenantContext");
    const db = drizzle(client);

    const result = await db
      .update(tenantQuotas)
      .set({
        creditsBalance: sql`${tenantQuotas.creditsBalance} + ${amount}`
      })
      .where(eq(tenantQuotas.tenantId, tenantId))
      .returning({ id: tenantQuotas.id });

    // If quota record doesn't exist, create it (fallback for missing initialization)
    if (result.length === 0) {
        const state = await this.getEffectiveSubscription();
        await db.insert(tenantQuotas).values({
            tenantId,
            creditsBalance: amount,
            maxUsers: state.effectivePlan.quotas.maxUsers,
            maxBrands: state.effectivePlan.quotas.maxBrands,
            maxPrompts: state.effectivePlan.quotas.maxPrompts,
            maxObservationsPerMonth: state.effectivePlan.quotas.maxObservationsPerMonth,
            maxCrawlJobsPerDay: state.effectivePlan.quotas.maxCrawlJobsPerDay,
            monthlyTokenLimit: state.effectivePlan.quotas.monthlyTokenLimit,
            monthlyCostLimitUsd: state.effectivePlan.quotas.monthlyCostLimitUsd
        });
    }

    await db.insert(creditTransactions).values({
      tenantId,
      amount,
      transactionType: "allocation",
      description,
      referenceId,
    });
  }
}

export const subscriptionService = new SubscriptionService();
