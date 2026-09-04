"use server";

import { z } from "zod";
import { DocumentIngestionService } from "@/services/ingestion/document-ingestion";
import { TenantContextManager } from "@/core/database/tenant-context";
import { requireSession } from "@/services/auth/session";
import { requireWorkspaceMembership } from "@/services/auth/authorization";

const ingestSchema = z.object({
  text: z.string().min(1, "Text to ingest must be provided"),
  metadata: z.record(z.string(), z.unknown()).optional().default(() => ({})),
  chunkingOptions: z
    .object({
      maxChunkSize: z.number().int().positive().optional(),
      overlap: z.number().int().nonnegative().optional(),
    })
    .optional(),
});

export async function ingestDocumentAction(data: {
  text: string;
  metadata?: Record<string, unknown>;
  chunkingOptions?: { maxChunkSize?: number; overlap?: number };
}) {
  const parsed = ingestSchema.safeParse(data);
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
    const ingestionService = new DocumentIngestionService();
    const requestId = `req-act-ingest-${Date.now()}`;

    const result = await TenantContextManager.runWithTenantContext(
      tenantId,
      userId,
      requestId,
      async () => {
        return await ingestionService.ingestDocument(
          parsed.data.text,
          parsed.data.metadata,
          parsed.data.chunkingOptions
        );
      }
    );

    return { success: true, result };
  } catch (err: unknown) {
    console.error("[ingestDocumentAction Error]:", err);
    return { success: false, error: err instanceof Error ? err.message : "Internal Server Error" };
  }
}
