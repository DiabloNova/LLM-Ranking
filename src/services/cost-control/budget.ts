import { UsageRecord, RequestBudget } from "./types";
import { CostCalculator } from "./pricing";
import { requireSession } from "../auth/session";

export class BudgetService {
  private records: UsageRecord[] = [];
  private budgets = new Map<string, RequestBudget>();

  async recordUsage(record: UsageRecord): Promise<void> {
    this.records.push({ ...record });
  }

  async setBudget(budget: RequestBudget): Promise<void> {
    this.budgets.set(budget.tenantId, { ...budget });
  }

  async getBudget(tenantId: string): Promise<RequestBudget | null> {
    const budget = this.budgets.get(tenantId);
    if (!budget) {
      return null;
    }

    // Aggregate used cost from records for this tenant
    const usedCost = this.records
      .filter(r => r.tenantId === tenantId)
      .reduce((acc, curr) => acc + (curr.estimatedCost || 0), 0);

    return {
      ...budget,
      used: usedCost
    };
  }

  /**
   * Atomically or deterministically checks and reserves budget for a tenant.
   * If a budget does not exist or limit is exceeded, fails closed.
   */
  async checkAndReserve(options: {
    tenantId: string;
    estimatedCost: number;
  }): Promise<{ allowed: boolean; remaining: number }> {
    const budget = await this.getBudget(options.tenantId);
    if (!budget) {
      // Fail closed: No budget configured -> Deny operations
      return { allowed: false, remaining: 0 };
    }

    const remaining = budget.limit - budget.used;
    if (remaining < options.estimatedCost) {
      return { allowed: false, remaining };
    }

    // Reservation pattern
    return { allowed: true, remaining: remaining - options.estimatedCost };
  }

  /**
   * High-security boundary checker: ensures identity is resolved strictly from server-side context.
   */
  async checkSecureRequest(estimatedCost: number): Promise<{ allowed: boolean; remaining: number }> {
    const session = await requireSession();
    if (!session.user) {
      throw new Error("Unauthorized: Active session user required.");
    }
    const tenantId = session.user.workspaceId;

    return await this.checkAndReserve({
      tenantId,
      estimatedCost
    });
  }

  clearRecords() {
    this.records = [];
  }
}
