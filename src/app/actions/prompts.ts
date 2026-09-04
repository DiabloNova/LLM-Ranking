"use server";

import { secureServerAction, secureServerActionNoInput } from "@/lib/safe-action";
import { z } from "zod";
import { TenantContextManager } from "@/core/database/tenant-context";
import { eq, and } from "drizzle-orm";
import { prompts, brands } from "../../../database/schema";
import { drizzle } from "drizzle-orm/node-postgres";

// 1. دریافت لیست پرسش‌ها بدون نیاز به ورودی (استفاده از secureServerActionNoInput)
export const getPromptsAction = secureServerActionNoInput(async (ctx) => {
  return TenantContextManager.runWithTenantContext(ctx.workspaceId, ctx.userId, null, async () => {
    const db = drizzle(TenantContextManager.getDbClient());

    const allPrompts = await db
      .select({
        id: prompts.id,
        queryText: prompts.queryText,
        category: prompts.category,
        buyingIntent: prompts.buyingIntent,
        createdAt: prompts.createdAt,
        brandName: brands.name,
      })
      .from(prompts)
      .leftJoin(brands, eq(prompts.brandId, brands.id))
      .where(eq(prompts.organizationId, ctx.workspaceId))
      .orderBy(prompts.createdAt);

    return allPrompts;
  });
});

// تعریف اسکیما برای اعتبارسنجی ورودی افزودن پرسش
const addPromptSchema = z.object({
  query: z.string().min(1, "Query is required"),
});

// 2. افزودن پرسش جدید با استفاده از secureServerAction
export const addPromptAction = secureServerAction(
  async (input: z.infer<typeof addPromptSchema>, ctx) => {
    // اعتبارسنجی ورودی با Zod
    const parsedInput = addPromptSchema.parse(input);

    return TenantContextManager.runWithTenantContext(ctx.workspaceId, ctx.userId, null, async () => {
      const db = drizzle(TenantContextManager.getDbClient());

      // یافتن اولین برند برای فضای کاری
      const userBrands = await db
        .select({ id: brands.id })
        .from(brands)
        .where(eq(brands.organizationId, ctx.workspaceId))
        .limit(1);

      if (userBrands.length === 0) {
        throw new Error("No active brand found for the workspace. Please register a brand first.");
      }

      const brandId = userBrands[0].id;

      const [inserted] = await db
        .insert(prompts)
        .values({
          organizationId: ctx.workspaceId,
          brandId: brandId,
          queryText: parsedInput.query,
          category: "General",
          buyingIntent: "Discovery",
          isActive: true,
        })
        .returning();

      return inserted;
    });
  }
);

// تعریف اسکیما برای اعتبارسنجی ورودی حذف پرسش
const deletePromptSchema = z.object({
  promptId: z.string().uuid(),
});

// 3. حذف پرسش با استفاده از secureServerAction
export const deletePromptAction = secureServerAction(
  async (input: z.infer<typeof deletePromptSchema>, ctx) => {
    // اعتبارسنجی ورودی با Zod
    const parsedInput = deletePromptSchema.parse(input);

    return TenantContextManager.runWithTenantContext(ctx.workspaceId, ctx.userId, null, async () => {
      const db = drizzle(TenantContextManager.getDbClient());

      const [deleted] = await db
        .delete(prompts)
        .where(
          and(
            eq(prompts.id, parsedInput.promptId),
            eq(prompts.organizationId, ctx.workspaceId)
          )
        )
        .returning();

      if (!deleted) {
        throw new Error("Prompt not found or unauthorized to delete");
      }

      return deleted;
    });
  }
);
