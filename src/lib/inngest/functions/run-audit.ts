import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { inngest } from "../client";
import { crawlWebsite } from "../../crawler";
import { analyzeSeoForAEO } from "../../ai";
import { TenantContextManager } from "../../../core/database/tenant-context";
import { audits } from "../../../../database/schema/audits";
import { SubscriptionService } from "../../../features/billing/services/subscription-service";

/**
 * Credit accounting for this job runs through `SubscriptionService`, the only supported way
 * to read or mutate a tenant credit balance (`tenant_quotas.credits_balance` plus the
 * `credit_transactions` ledger). The previous implementation imported `checkCredits` /
 * `deductCredits` from `src/lib/credits`, a module that was deleted when the standalone
 * `credits` schema was dropped, so this file could not resolve at all.
 */
const CREDITS_PER_AUDIT = 1;

type AuditPatch = Partial<{
  status: string;
  errorMessage: string | null;
  rawSignals: unknown;
  aiInsights: unknown;
}>;

/**
 * Applies a patch to a single audit row inside the tenant's row-level-security context.
 */
async function patchAudit(
  workspaceId: string,
  userId: string | null,
  auditId: string,
  patch: AuditPatch,
): Promise<void> {
  await TenantContextManager.runWithTenantContext(workspaceId, userId, null, async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) {
      throw new Error("run-audit: database client unavailable in tenant context");
    }
    const db = drizzle(client);
    await db
      .update(audits)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(audits.id, auditId));
  });
}

export const runAudit = inngest.createFunction(
  { id: "run-audit", triggers: [{ event: "audit.requested" }] },
  async ({ event, step }) => {
    const { workspaceId, userId, url, auditId } = event.data as {
      workspaceId: string;
      userId: string | null;
      url: string;
      auditId: string;
    };

    // Step 0: consume credits. SubscriptionService resolves the tenant from the ambient
    // tenant context and decrements the balance atomically, throwing when the balance is
    // insufficient, which also removes the previous check-then-deduct race.
    const charged = await step.run("consume-credits", async () => {
      try {
        await TenantContextManager.runWithTenantContext(workspaceId, userId, null, async () => {
          await new SubscriptionService().consumeCredits(
            CREDITS_PER_AUDIT,
            `Site audit for ${url}`,
            auditId,
          );
        });
        return { ok: true as const };
      } catch (error) {
        return {
          ok: false as const,
          error: error instanceof Error ? error.message : "Failed to consume credits",
        };
      }
    });

    if (!charged.ok) {
      await step.run("update-status-failed-credits", async () => {
        await patchAudit(workspaceId, userId, auditId, {
          status: "failed",
          errorMessage: charged.error,
        });
      });
      return { success: false, error: charged.error };
    }

    // Step 1: Update DB status to 'crawling'
    await step.run("update-status-crawling", async () => {
      await patchAudit(workspaceId, userId, auditId, { status: "crawling" });
    });

    // Step 2: Execute crawlWebsite
    const crawlResult = await step.run("execute-crawl", async () => {
      return await crawlWebsite(url);
    });

    if (!crawlResult.success || !crawlResult.data) {
      await step.run("update-status-failed-crawl", async () => {
        await patchAudit(workspaceId, userId, auditId, {
          status: "failed",
          errorMessage: crawlResult.error || "Failed to crawl website",
        });
      });
      return { success: false, error: crawlResult.error };
    }

    // Step 3: Update DB status to 'analyzing'
    await step.run("update-status-analyzing", async () => {
      await patchAudit(workspaceId, userId, auditId, {
        status: "analyzing",
        rawSignals: crawlResult.data,
      });
    });

    // Step 4: Execute analyzeSeoForAEO
    const analysisResult = await step.run("execute-analysis", async () => {
      return await analyzeSeoForAEO(url, crawlResult.data!);
    });

    if (!analysisResult.success || !analysisResult.data) {
      await step.run("update-status-failed-analysis", async () => {
        await patchAudit(workspaceId, userId, auditId, {
          status: "failed",
          errorMessage: analysisResult.error || "Failed to analyze SEO",
        });
      });
      return { success: false, error: analysisResult.error };
    }

    // Step 5: Update DB status to 'completed'
    await step.run("update-status-completed", async () => {
      await patchAudit(workspaceId, userId, auditId, {
        status: "completed",
        aiInsights: analysisResult.data,
      });
    });

    return { success: true, auditId };
  },
);
