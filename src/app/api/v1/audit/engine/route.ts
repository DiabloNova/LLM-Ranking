import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { executeAudit } from "@/lib/audit-engine/builder";
import { TenantContextManager } from "@/core/database/tenant-context";
import { PostgresClient } from "@/features/admin/infrastructure/persistence/postgres";

// 1. Zod Request Schema
const requestSchema = z.object({
  url: z.string().url("لطفاً یک آدرس وب‌سایت معتبر همراه با پروتکل وارد کنید (مانند: https://example.com)"),
});

export async function POST(req: NextRequest) {
  try {
    // 2. Tenant Context Extraction and Authentication Check
    const tenantId = req.headers.get("x-tenant-id");
    const userId = req.headers.get("x-user-id") || "usr-engine-default";

    if (!tenantId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "شناسه مستأجر معتبر (x-tenant-id) ارسال نشده است. این ویژگی نیاز به حساب کاربری فعال دارد."
        },
        { status: 401 }
      );
    }

    // 3. Parse and Validate Body
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || "درخواست نامعتبر است.";
      return NextResponse.json(
        { error: "Bad Request", message: errorMsg },
        { status: 400 }
      );
    }

    const { url } = parsed.data;

    // 4. Run Within Tenant Isolation Boundary
    return await TenantContextManager.runWithTenantContext(tenantId, userId, "req-core-audit-engine", async () => {
      // Execute pipeline
      const auditId = `audit-${crypto.randomUUID().substring(0, 8)}`;
      const result = await executeAudit(url, tenantId, auditId);

      // Derive database-compatible fields to persist to 'premium_audits'
      const overallScore = result.scores.overall;
      let grade: "A" | "B" | "C" | "D" | "F" = "F";
      if (overallScore >= 90) grade = "A";
      else if (overallScore >= 80) grade = "B";
      else if (overallScore >= 70) grade = "C";
      else if (overallScore >= 60) grade = "D";

      const dbClient = PostgresClient.getInstance();

      const mappedIssues = result.recommendations.map(r => ({
        severity: r.priority === "high" ? "critical" : "warning",
        category: r.category === "technical" ? "technical" : r.category === "content" ? "content" : "structure",
        description: r.issue,
        recommendation: r.recommendation
      }));

      const sql = `
        INSERT INTO premium_audits (
          id, organization_id, url, score, grade, pages_analyzed, metrics, issues, recommendations, created_at, updated_at, created_by, updated_by, version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), 'system', 'system', 1);
      `;

      try {
        await dbClient.query(sql, [
          crypto.randomUUID(), // Unique id for table record
          tenantId,
          result.normalizedUrl,
          overallScore,
          grade,
          1, // Pages analyzed
          JSON.stringify(result.scores.breakdown),
          JSON.stringify(mappedIssues),
          JSON.stringify(result.recommendations)
        ]);
      } catch (dbErr: unknown) {
        console.error("[Database Save Core Audit Error]:", dbErr);
        // Do not block endpoint response if local offline fallback is active
      }

      return NextResponse.json(result);
    });

  } catch (error: unknown) {
    console.error("[Core Audit Engine API Route Error]:", error);
    const message = error instanceof Error ? error.message : "خطای ناشناخته در لایه موتور ارزیابی رخ داد.";
    return NextResponse.json(
      { error: "Internal Server Error", message },
      { status: 500 }
    );
  }
}
