import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { DocumentIngestionService } from "@/services/ingestion/document-ingestion";
import { TenantContextManager } from "@/core/database/tenant-context";
import { authorizeApiRequest } from "@/services/auth/authorization";

// Request body validation schema
const requestSchema = z.object({
  text: z.string().min(1, "Text to ingest must be provided"),
  metadata: z.record(z.string(), z.any()).optional().default(() => ({})),
  chunkingOptions: z
    .object({
      maxChunkSize: z.number().int().positive().optional(),
      overlap: z.number().int().nonnegative().optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Authoritative API identity resolution (session overrides client headers)
    let userId: string;
    let tenantId: string;

    try {
      const auth = await authorizeApiRequest(req);
      userId = auth.userId;
      tenantId = auth.tenantId;
    } catch (err: unknown) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message:
            err instanceof Error ? err.message : "Authentication failed",
        },
        {
          status: (err as { statusCode?: number }).statusCode || 401,
        }
      );
    }

    // 2. Parse and validate JSON request body
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Bad Request", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { text, metadata, chunkingOptions } = parsed.data;

    // 3. Initialize the Ingestion Service
    const ingestionService = new DocumentIngestionService();

    // 4. Secure the execution inside a transactional Tenant Context
    const requestId =
      req.headers.get("x-request-id") || `req-ingest-${Date.now()}`;

    const result = await TenantContextManager.runWithTenantContext(
      tenantId,
      userId,
      requestId,
      async () => {
        return await ingestionService.ingestDocument(
          text,
          metadata,
          chunkingOptions
        );
      }
    );

    // 5. Check if all chunks failed to process
    if (result.totalChunks > 0 && result.processedChunks === 0) {
      return NextResponse.json(
        {
          success: false,
          totalChunks: result.totalChunks,
          processedChunks: result.processedChunks,
          failedChunks: result.failedChunks,
          errors: result.errors,
        },
        { status: 500 }
      );
    }

    // 6. Return successful (including partial success) response
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    console.error("[API Document Ingestion Route Error]:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Internal Server Error", message },
      { status: 500 }
    );
  }
}