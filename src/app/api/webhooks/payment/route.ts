import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { TenantContextManager } from "@/core/database/tenant-context";
import { subscriptionService } from "@/features/billing/services/subscription-service";

/**
 * POST /api/webhooks/payment
 *
 * Hardening applied to this route:
 * 1. Secret comparison uses `crypto.timingSafeEqual` instead of `!==`, so a byte-by-byte
 *    guess cannot be distinguished by response timing.
 * 2. The payload is fully validated with Zod, including a sane upper bound on `amount`,
 *    so a malformed or malicious payload cannot mint an unbounded number of credits.
 * 3. Processing is idempotent: every event must carry a unique `eventId`, inserted into
 *    `processed_webhook_events` (insert-before-process ledger) before any credit is
 *    applied. A duplicate delivery of the same event (payment providers generally
 *    deliver at-least-once) is acknowledged without crediting twice.
 * 4. Credits are applied via `subscriptionService.allocateCredits()`, which atomically
 *    updates the real, migrated `tenant_quotas.credits_balance` column and records a
 *    `credit_transactions` (tenant_id-scoped) row. A previous version of this route
 *    called `addCredits()` from `src/lib/credits.ts`, which read/wrote a `credits` table
 *    that was never migrated into the database and a `credit_transactions` shape
 *    (`organization_id`, `feature`) that does not match the real, migrated
 *    `credit_transactions` table (`tenant_id`, `transaction_type`). That path could not
 *    have worked in production; it has been removed rather than patched, and the two
 *    orphaned schema files it depended on (`database/schema/credits.ts`,
 *    `database/schema/credit-transactions.ts`) have been deleted for the same reason.
 */

const MAX_SINGLE_TOPUP_CREDITS = 1_000_000;

const webhookPayloadSchema = z.object({
  eventId: z.string().min(1, "eventId is required for idempotent processing"),
  workspaceId: z.string().uuid("workspaceId must be a valid UUID"),
  amount: z
    .number()
    .int("amount must be an integer number of credits")
    .positive("amount must be greater than zero")
    .max(MAX_SINGLE_TOPUP_CREDITS, `amount may not exceed ${MAX_SINGLE_TOPUP_CREDITS} credits per event`),
  event: z.enum(["payment_success", "payment_failed", "payment_refunded"]),
});

/**
 * Constant-time secret comparison. Buffers of different lengths are never passed to
 * `timingSafeEqual` (it throws on length mismatch); instead we still perform a
 * same-length dummy comparison so the two code paths (matching length vs not) take a
 * comparable amount of time, and always return `false` on any length mismatch.
 */
function secretsMatch(provided: string, expected: string): boolean {
  const providedBuf = Buffer.from(provided, "utf8");
  const expectedBuf = Buffer.from(expected, "utf8");

  if (providedBuf.length !== expectedBuf.length) {
    timingSafeEqual(providedBuf, providedBuf);
    return false;
  }

  return timingSafeEqual(providedBuf, expectedBuf);
}

function hashPayload(raw: unknown): string {
  return createHash("sha256").update(JSON.stringify(raw)).digest("hex");
}

/** True when `err` is a PostgreSQL unique-violation (SQLSTATE 23505). */
function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "23505";
}

export async function POST(request: Request) {
  try {
    const configuredSecret = process.env.PAYMENT_WEBHOOK_SECRET;
    if (!configuredSecret || configuredSecret.trim() === "") {
      console.error("[Payment Webhook] PAYMENT_WEBHOOK_SECRET is not configured. Refusing all webhook traffic.");
      return NextResponse.json({ error: "Service Unavailable" }, { status: 503 });
    }

    const providedSecret = request.headers.get("x-webhook-secret") ?? "";
    if (providedSecret === "" || !secretsMatch(providedSecret, configuredSecret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const parsed = webhookPayloadSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload format", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { eventId, workspaceId, amount, event } = parsed.data;

    // Insert-before-process: record the event id first. A unique-violation means this
    // exact event was already handled, so we acknowledge it without re-applying credits.
    const alreadyProcessed = await TenantContextManager.runWithSystemContext(
      null,
      `sys-webhook-payment-${eventId}`,
      async () => {
        const client = TenantContextManager.getDbClient();
        if (!client) {
          throw new Error("Failed to get DB client in system context");
        }

        try {
          await client.query(
            `INSERT INTO processed_webhook_events (event_id, provider, event_type, payload_hash)
             VALUES ($1, $2, $3, $4)`,
            [eventId, "payment", event, hashPayload(rawBody)]
          );
          return false;
        } catch (err: unknown) {
          if (isUniqueViolation(err)) {
            return true;
          }
          throw err;
        }
      }
    );

    if (alreadyProcessed) {
      return NextResponse.json({ success: true, message: "Event already processed" }, { status: 200 });
    }

    if (event !== "payment_success") {
      // Non-crediting events are now durably recorded above; nothing further to do.
      return NextResponse.json({ message: "Event acknowledged, no action required" }, { status: 200 });
    }

    try {
      await TenantContextManager.runWithTenantContext(
        workspaceId,
        null,
        `req-webhook-payment-${eventId}`,
        async () => {
          await subscriptionService.allocateCredits(amount, "Credits added via payment webhook", eventId);
        }
      );
    } catch (creditErr: unknown) {
      console.error("[Payment Webhook] Failed to allocate credits:", creditErr);
      return NextResponse.json({ error: "Failed to add credits" }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Payment webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
