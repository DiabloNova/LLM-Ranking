"use server";

import { z } from "zod";
import { answerQuestion } from "@/services/rag/query-service";
import { TenantContextManager } from "@/core/database/tenant-context";
import { requireSession } from "@/services/auth/session";
import { requireWorkspaceMembership } from "@/services/auth/authorization";

const querySchema = z.object({
  question: z.string().min(1, "Question must be provided"),
  limit: z.number().int().positive().optional().default(5),
});

export async function queryKnowledgeGraphAction(data: {
  question: string;
  limit?: number;
}) {
  const parsed = querySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", details: parsed.error.format() };
  }

  let session;
  try {
    session = await requireSession();
    if (!session.user) {
      throw new Error("Unauthorized: Active user not resolved from secure session.");
    }
    // Validate workspace membership at the server action boundary
    await requireWorkspaceMembership(session.user.id, session.user.workspaceId);
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unauthorized: Missing or invalid secure session on server."
    };
  }

  const tenantId = session.user.workspaceId;
  const userId = session.user.id;

  try {
    const requestId = `req-act-query-${Date.now()}`;

    const result = await TenantContextManager.runWithTenantContext(
      tenantId,
      userId,
      requestId,
      async () => {
        return await answerQuestion(parsed.data.question, tenantId, parsed.data.limit);
      }
    );

    return { success: true, result };
  } catch (err: unknown) {
    console.error("[queryKnowledgeGraphAction Error]:", err);
    return { success: false, error: err instanceof Error ? err.message : "Internal Server Error" };
  }
}
