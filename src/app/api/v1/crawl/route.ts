import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { TenantContextManager } from "@/core/database/tenant-context";
import { CrawlError } from "@/features/acquisition/domain/errors";
import { CrawlOrchestrator } from "@/features/acquisition/application/orchestrator";
import { CrawlJobRepository } from "@/features/acquisition/infrastructure/persistence/postgres";
import { getSession } from "@/services/auth/session";

const requestSchema = z.object({
  requestedUrl: z.string().min(1),
  policy: z
    .object({
      maxPages: z.number().int().optional(),
      maxDepth: z.number().int().optional(),
      maxDurationMs: z.number().int().optional(),
      maxResponseBytes: z.number().int().optional(),
      maxRedirects: z.number().int().optional(),
      maxConcurrency: z.number().int().optional(),
      requestTimeoutMs: z.number().int().optional(),
      connectTimeoutMs: z.number().int().optional(),
      maxAttempts: z.number().int().optional(),
      retryBaseDelayMs: z.number().int().optional(),
      retryMaxDelayMs: z.number().int().optional(),
      allowedSchemes: z.array(z.string()).optional(),
      allowedContentTypes: z.array(z.string()).optional(),
      robotsPolicy: z.enum(["respect", "ignore"]).optional(),
      perHostRequestsPerSecond: z.number().int().optional(),
      stripTrackingParams: z.boolean().optional(),
      cacheTtlMs: z.number().int().optional(),
      followRedirects: z.boolean().optional()
    })
    .partial()
    .optional(),
  priority: z.number().int().optional(),
  correlationId: z.string().optional(),
  traceId: z.string().optional(),
  bypassCache: z.boolean().optional()
});

function errorResponse(error: unknown): NextResponse {
  if (error instanceof CrawlError) {
    const status =
      error.code === "AUTHENTICATION_ERROR"
        ? 401
        : error.code === "INVALID_URL" ||
            error.code === "SSRF_BLOCKED" ||
            error.code === "POLICY_VIOLATION"
          ? 400
          : error.code === "RATE_LIMITED"
            ? 429
          : error.code === "CANCELLED"
            ? 409
            : 500;
    return NextResponse.json({ error: error.toPublicError() }, { status });
  }
  return NextResponse.json(
    { error: { code: "UNKNOWN", message: "The crawl could not be completed." } },
    { status: 500 }
  );
}

function notFoundResponse(): NextResponse {
  return NextResponse.json(
    { error: { code: "NOT_FOUND", message: "Crawl job was not found." } },
    { status: 404 }
  );
}

async function requireRealSession(): Promise<{
  userId: string;
  tenantId: string;
}> {
  const session = await getSession();
  if (!session?.user) {
    throw new CrawlError("AUTHENTICATION_ERROR", "A real session is required");
  }
  return {
    userId: session.user.id,
    tenantId: session.user.workspaceId
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const identity = await requireRealSession();
    const body = requestSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json(
        { error: { code: "INVALID_URL", message: "Invalid crawl request." } },
        { status: 400 }
      );
    }
    const requestId = request.headers.get("x-request-id") ?? randomUUID();
    const orchestrator = new CrawlOrchestrator();
    const submission = await TenantContextManager.runWithTenantContext(
      identity.tenantId,
      identity.userId,
      requestId,
      () =>
        orchestrator.submit(
          identity.tenantId,
          body.data.requestedUrl,
          body.data.policy ?? {},
          body.data.priority ?? 0,
          requestId,
          body.data.correlationId,
          body.data.traceId,
          body.data.bypassCache ?? false
        )
    );
    return NextResponse.json(
      {
        jobId: submission.job?.id ?? null,
        status: submission.job?.status ?? "SUCCEEDED",
        cacheOutcome: submission.cacheOutcome,
        result: submission.result
      },
      { status: submission.job ? 202 : 200 }
    );
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const identity = await requireRealSession();
    const id = request.nextUrl.searchParams.get("jobId");
    if (!id) {
      return NextResponse.json(
        { error: { code: "POLICY_VIOLATION", message: "jobId is required." } },
        { status: 400 }
      );
    }
    const job = await TenantContextManager.runWithTenantContext(
      identity.tenantId,
      identity.userId,
      request.headers.get("x-request-id") ?? randomUUID(),
      () => new CrawlJobRepository().getById(id)
    );
    return job
      ? NextResponse.json({ job })
      : notFoundResponse();
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const identity = await requireRealSession();
    const body = z
      .object({ jobId: z.string().min(1), reason: z.string().optional() })
      .safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json(
        { error: { code: "POLICY_VIOLATION", message: "jobId is required." } },
        { status: 400 }
      );
    }
    const cancelled = await TenantContextManager.runWithTenantContext(
      identity.tenantId,
      identity.userId,
      request.headers.get("x-request-id") ?? randomUUID(),
      async () => {
        const repository = new CrawlJobRepository();
        const job = await repository.getById(body.data.jobId);
        if (!job) {
          return null;
        }
        return repository.cancel(
          job.id,
          job.status,
          job.version,
          body.data.reason ?? "Cancelled by user",
          identity.userId
        );
      }
    );
    return cancelled
      ? NextResponse.json({ job: cancelled })
      : notFoundResponse();
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
