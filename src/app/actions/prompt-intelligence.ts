"use server";

import { z } from "zod";
import { TenantContextManager } from "@/core/database/tenant-context";
import { requireSession } from "@/services/auth/session";
import { requireWorkspaceMembership } from "@/services/auth/authorization";
import { PromptIntelligenceService } from "@/features/ai-intelligence/services/prompt-intelligence-service";
import { PromptIntelligenceRepository } from "@/features/ai-intelligence/repositories";
import {
  PositionObservation,
  PromptCategory,
  PromptIntentType,
  PromptVariable,
} from "@/features/ai-intelligence/domain/types";

// Zod Enums based on your domain types to ensure runtime type-safety
const PromptCategoryEnum = z.enum([
  "Brand Discovery",
  "Product/Service Discovery",
  "Category",
  "Recommendation",
  "Comparison",
  "Problem/Solution",
  "Local/Geographic",
  "Entity",
  "Informational",
  "Transactional",
  "Navigational",
]);

const PromptIntentTypeEnum = z.enum([
  "Discovery",
  "Comparison",
  "Recommendation",
  "Purchase",
  "Research",
  "Authority",
  "Informational",
  "Transactional",
  "Navigational",
]);


// Schema validations
const createDefSchema = z.object({
  brandId: z.string().uuid("شناسه برند معتبر نیست"),
  name: z.string().min(1, "نام الگو الزامی است"),
  promptTemplate: z.string().min(1, "متن قالب الزامی است"),
  category: PromptCategoryEnum,
  intent: PromptIntentTypeEnum,
  locale: z.string().min(1, "زبان الزامی است"),
  variables: z.array(
    z.object({
      name: z.string(),
      defaultValue: z.string(),
      description: z.string().optional(),
    }),
  ),
  competitors: z.array(z.string()),
  tags: z.array(z.string()),
  notes: z.string().optional(),
});

const updateDefSchema = z.object({
  id: z.string().uuid(),
  name: z.string().optional(),
  promptTemplate: z.string().optional(),
  category: PromptCategoryEnum.optional(),
  intent: PromptIntentTypeEnum.optional(),
  locale: z.string().optional(),
  variables: z
    .array(
      z.object({
        name: z.string(),
        defaultValue: z.string(),
        description: z.string().optional(),
      }),
    )
    .optional(),
  competitors: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

const executeSchema = z.object({
  promptId: z.string().uuid(),
  variablesValues: z.record(z.string(), z.string()),
  modelName: z.string(),
});

const compareSchema = z.object({
  promptId: z.string().uuid(),
  variablesValues: z.record(z.string(), z.string()),
  models: z.array(z.string()),
});

const scheduleSchema = z.object({
  promptId: z.string().uuid(),
  cronExpression: z.string(),
  timezone: z.string().default("UTC"),
});

const idSchema = z.object({
  promptId: z.string().uuid(),
});

/**
 * Creates a new prompt definition.
 */
export async function createPromptDefinitionAction(
  data: z.infer<typeof createDefSchema>,
) {
  const parsed = createDefSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      details: parsed.error.format(),
    };
  }

  let session;
  try {
    session = await requireSession();
    if (!session.user) throw new Error("Unauthorized");
    await requireWorkspaceMembership(session.user.id, session.user.workspaceId);
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? (err.message || "Unauthorized") : "Unauthorized" };
  }

  const tenantId = session.user.workspaceId;
  const userId = session.user.id;

  try {
    return await TenantContextManager.runWithTenantContext(
      tenantId,
      userId,
      "ctx-create-prompt",
      async () => {
        const service = new PromptIntelligenceService();
        const res = await service.createPromptDefinition(
          tenantId,
          parsed.data.brandId,
          parsed.data.name,
          parsed.data.promptTemplate,
          parsed.data.category,
          parsed.data.intent,
          parsed.data.locale,
          parsed.data.variables,
          parsed.data.competitors,
          parsed.data.tags,
          parsed.data.notes,
          userId,
        );
        return { success: true, result: res };
      },
    );
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Updates a prompt definition.
 */
export async function updatePromptDefinitionAction(
  data: z.infer<typeof updateDefSchema>,
) {
  const parsed = updateDefSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      details: parsed.error.format(),
    };
  }

  let session;
  try {
    session = await requireSession();
    if (!session.user) throw new Error("Unauthorized");
    await requireWorkspaceMembership(session.user.id, session.user.workspaceId);
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? (err.message || "Unauthorized") : "Unauthorized" };
  }

  const tenantId = session.user.workspaceId;
  const userId = session.user.id;

  try {
    return await TenantContextManager.runWithTenantContext(
      tenantId,
      userId,
      "ctx-update-prompt",
      async () => {
        const service = new PromptIntelligenceService();
        const res = await service.updatePromptDefinition(
          tenantId,
          parsed.data.id,
          {
            ...parsed.data,
          },
          userId,
        );
        return { success: true, result: res };
      },
    );
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Lists all prompt templates for a specific brand in the tenant context.
 */
export async function getPromptDefinitionsAction(brandId: string) {
  let session;
  try {
    session = await requireSession();
    if (!session.user) throw new Error("Unauthorized");
    await requireWorkspaceMembership(session.user.id, session.user.workspaceId);
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? (err.message || "Unauthorized") : "Unauthorized" };
  }

  const tenantId = session.user.workspaceId;
  const userId = session.user.id;

  try {
    return await TenantContextManager.runWithTenantContext(
      tenantId,
      userId,
      "ctx-get-prompts",
      async () => {
        const repo = new PromptIntelligenceRepository();
        const paginated = await repo.findDefinitionsByBrandId(
          tenantId,
          brandId,
        );

        // Seed default/baseline prompts if empty to ensure rich dashboard onboarding
        if (paginated.data.length === 0) {
          const service = new PromptIntelligenceService();
          const seeded = await service.createPromptDefinition(
            tenantId,
            brandId,
            "سهم صدای برند کلی (Brand Discovery)",
            "معرفی کامل برند {brand} به زبان فارسی چیست و چه مزیتی نسبت به رقبای سنتی دارد؟",
            "Brand Discovery",
            "Discovery",
            "fa",
            [
              {
                name: "brand",
                defaultValue: "رشا گستر",
                description: "نام برند تجاری",
              },
            ],
            ["CompetitorX"],
            ["discovery", "brand"],
            "پایش سهم صدای هویت برند به صورت پایه‌ای",
            userId,
          );
          return { success: true, result: [seeded] };
        }
        return { success: true, result: paginated.data };
      },
    );
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Retrieves a prompt template's execution logs, positions, and schedule details.
 */
export async function getPromptDetailsAction(promptId: string) {
  const parsed = idSchema.safeParse({ promptId });
  if (!parsed.success) {
    return { success: false, error: "Validation failed" };
  }

  let session;
  try {
    session = await requireSession();
    if (!session.user) throw new Error("Unauthorized");
    await requireWorkspaceMembership(session.user.id, session.user.workspaceId);
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? (err.message || "Unauthorized") : "Unauthorized" };
  }

  const tenantId = session.user.workspaceId;
  const userId = session.user.id;

  try {
    return await TenantContextManager.runWithTenantContext(
      tenantId,
      userId,
      "ctx-get-prompt-details",
      async () => {
        const repo = new PromptIntelligenceRepository();
        const prompt = await repo.findDefinitionById(
          tenantId,
          parsed.data.promptId,
        );
        if (!prompt) {
          throw new Error("Prompt definition not found");
        }

        const schedule = await repo.findScheduleByPromptId(
          tenantId,
          parsed.data.promptId,
        );
        const executionsPaginated = await repo.findExecutionsByPromptId(
          tenantId,
          parsed.data.promptId,
        );

        // Load position observations for the last execution if exists
        let positions: PositionObservation[] = [];
        const latestExec = executionsPaginated.data[0];
        if (latestExec) {
          positions = await repo.findPositionsByExecutionId(
            tenantId,
            latestExec.id,
          );
        }
        return {
          success: true,
          result: {
            prompt,
            schedule,
            executions: executionsPaginated.data,
            positions,
          },
        };
      },
    );
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Executes a single prompt template against a specific AI model.
 */
export async function executePromptAction(
  data: z.infer<typeof executeSchema>,
) {
  const parsed = executeSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      details: parsed.error.format(),
    };
  }

  let session;
  try {
    session = await requireSession();
    if (!session.user) throw new Error("Unauthorized");
    await requireWorkspaceMembership(session.user.id, session.user.workspaceId);
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? (err.message || "Unauthorized") : "Unauthorized" };
  }

  const tenantId = session.user.workspaceId;
  const userId = session.user.id;

  try {
    return await TenantContextManager.runWithTenantContext(
      tenantId,
      userId,
      "ctx-exec-prompt",
      async () => {
        const service = new PromptIntelligenceService();
        const exec = await service.executePrompt(
          tenantId,
          parsed.data.promptId,
          parsed.data.variablesValues as Record<string, string>,
          parsed.data.modelName,
          userId,
        );

        const repo = new PromptIntelligenceRepository();
        const positions = await repo.findPositionsByExecutionId(
          tenantId,
          exec.id,
        );
        return { success: true, result: { execution: exec, positions } };
      },
    );
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Compares model answers side-by-side for a specific parameterized prompt run.
 */
export async function executeModelComparisonAction(
  data: z.infer<typeof compareSchema>,
) {
  const parsed = compareSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      details: parsed.error.format(),
    };
  }

  let session;
  try {
    session = await requireSession();
    if (!session.user) throw new Error("Unauthorized");
    await requireWorkspaceMembership(session.user.id, session.user.workspaceId);
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? (err.message || "Unauthorized") : "Unauthorized" };
  }

  const tenantId = session.user.workspaceId;
  const userId = session.user.id;

  try {
    return await TenantContextManager.runWithTenantContext(
      tenantId,
      userId,
      "ctx-exec-compare",
      async () => {
        const service = new PromptIntelligenceService();
        const repo = new PromptIntelligenceRepository();

        const executions = await service.executeComparison(
          tenantId,
          parsed.data.promptId,
          parsed.data.variablesValues as Record<string, string>,
          parsed.data.models,
          userId,
        );
        const mappedPositions: Record<string, PositionObservation[]> = {};
        for (const exec of executions) {
          mappedPositions[exec.id] = await repo.findPositionsByExecutionId(
            tenantId,
            exec.id,
          );
        }
        return {
          success: true,
          result: { executions, positions: mappedPositions },
        };
      },
    );
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Enables and configures a schedule for the prompt.
 */
export async function schedulePromptAction(
  data: z.infer<typeof scheduleSchema>,
) {
  const parsed = scheduleSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      details: parsed.error.format(),
    };
  }

  let session;
  try {
    session = await requireSession();
    if (!session.user) throw new Error("Unauthorized");
    await requireWorkspaceMembership(session.user.id, session.user.workspaceId);
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? (err.message || "Unauthorized") : "Unauthorized" };
  }

  const tenantId = session.user.workspaceId;
  const userId = session.user.id;

  try {
    return await TenantContextManager.runWithTenantContext(
      tenantId,
      userId,
      "ctx-schedule-prompt",
      async () => {
        const service = new PromptIntelligenceService();
        const res = await service.schedulePrompt(
          tenantId,
          parsed.data.promptId,
          parsed.data.cronExpression,
          parsed.data.timezone,
          userId,
        );
        return { success: true, result: res };
      },
    );
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Disables an existing prompt schedule.
 */
export async function unschedulePromptAction(
  data: z.infer<typeof idSchema>,
) {
  const parsed = idSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Validation failed" };
  }

  let session;
  try {
    session = await requireSession();
    if (!session.user) throw new Error("Unauthorized");
    await requireWorkspaceMembership(session.user.id, session.user.workspaceId);
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? (err.message || "Unauthorized") : "Unauthorized" };
  }

  const tenantId = session.user.workspaceId;
  const userId = session.user.id;

  try {
    return await TenantContextManager.runWithTenantContext(
      tenantId,
      userId,
      "ctx-unschedule-prompt",
      async () => {
        const service = new PromptIntelligenceService();
        const success = await service.unschedulePrompt(
          tenantId,
          parsed.data.promptId
        );
        return { success };
      }
    );
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
