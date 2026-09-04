import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { firecrawlApp } from "@/lib/firecrawl";
import { getLLMClient } from "@/services/ai/llm-client";
import { TenantContextManager } from "@/core/database/tenant-context";
import { PostgresClient } from "@/features/admin/infrastructure/persistence/postgres";
import { authorizeApiRequest, AuthorizationError } from "@/services/auth/authorization";
import { enforceRateLimit, rateLimitHeaders, RateLimitError, RATE_LIMIT_RULES } from "@/lib/rate-limit";

/**
 * POST /api/v1/audit/premium
 *
 * Paid, tenant-scoped deep audit. Crawls the target site via Firecrawl, runs an LLM
 * semantic-gap analysis, computes heuristic scores, and persists the result.
 *
 * Hardening applied to this route:
 * 1. Identity comes from authorizeApiRequest() only. The raw `x-tenant-id` header is
 *    never treated as authorization.
 * 2. Rate limited per verified tenant; the limiter fails closed.
 * 3. NO FABRICATED RESULTS. If Firecrawl is unconfigured or fails, the route returns
 *    502/503 instead of inventing crawl pages. If the LLM fails, the semantic section
 *    is reported as unavailable rather than replaced with invented Persian copy.
 * 4. Persistence failures are surfaced as 500, not swallowed. A stored audit is part of
 *    the paid deliverable, so a silent write loss is a correctness bug, not a warning.
 */
const requestSchema = z.object({
  url: z.string().url("لطفاً یک آدرس وب‌سایت معتبر وارد کنید"),
  depth: z.number().min(1).max(50).optional().default(10),
});

export interface PremiumAuditIssue {
  severity: "critical" | "warning" | "info";
  category: "technical" | "content" | "structure";
  description: string;
  recommendation: string;
}

export interface PremiumAuditRecommendation {
  priority: "high" | "medium" | "low";
  insight: string;
  estimatedImpact: string;
}

export interface PremiumAuditResponse {
  auditId: string;
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  pagesAnalyzed: number;
  metrics: {
    contentQuality: number;
    technicalHealth: number;
    internalLinking: number;
    semanticCoverage: number;
  };
  issues: PremiumAuditIssue[];
  recommendations: PremiumAuditRecommendation[];
  /**
   * Present and true when the semantic/LLM portion of the audit could not be produced.
   * The frontend MUST surface this instead of presenting a partial audit as complete.
   */
  semanticAnalysisUnavailable?: boolean;
}

interface CrawledPage {
  url: string;
  markdown?: string;
  metadata?: { title?: string; description?: string };
}

const RECOMMENDATION_PRIORITIES = new Set(["high", "medium", "low"]);

function isConfiguredApiKey(key: string | undefined): boolean {
  if (!key || key.trim() === "") return false;
  const normalized = key.trim().toLowerCase();
  return !normalized.includes("your-api-key") && !normalized.startsWith("fc-your-");
}

export async function POST(req: NextRequest) {
  let limitHeaders: Record<string, string> = {};

  try {
    // 1. Authoritative identity resolution. Paid feature: fails closed.
    const { userId, tenantId } = await authorizeApiRequest(req);

    // 2. Spend protection (Firecrawl crawl + LLM tokens), keyed by verified tenant.
    const { rejection, result } = await enforceRateLimit(RATE_LIMIT_RULES.auditPremium, tenantId);
    limitHeaders = rateLimitHeaders(result);
    if (rejection) {
      return rejection;
    }

    // 3. Validate the request body.
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Bad Request", message: "ساختار درخواست نامعتبر است." },
        { status: 400, headers: limitHeaders }
      );
    }

    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || "درخواست نامعتبر است.";
      return NextResponse.json(
        { error: "Bad Request", message: errorMsg },
        { status: 400, headers: limitHeaders }
      );
    }

    const { url, depth } = parsed.data;

    // 4. Refuse to run a paid audit without a real crawl provider. No mock data path.
    if (!isConfiguredApiKey(process.env.FIRECRAWL_API_KEY)) {
      console.error("[Premium Audit] FIRECRAWL_API_KEY is not configured. Refusing to serve a paid audit.");
      return NextResponse.json(
        {
          error: "Service Unavailable",
          message: "سرویس خزش وب در حال حاضر در دسترس نیست. لطفاً بعداً تلاش کنید.",
        },
        { status: 503, headers: limitHeaders }
      );
    }

    return await TenantContextManager.runWithTenantContext(
      tenantId,
      userId,
      `req-premium-audit-${randomUUID()}`,
      async () => {
        // 5. Real crawl. A failure here is an upstream failure and is reported as such.
        let crawlResults: CrawledPage[] = [];
        try {
          const crawlResponse = await firecrawlApp.crawlUrl(url, {
            limit: depth,
            scrapeOptions: { formats: ["markdown"] },
          });

          if (
            crawlResponse &&
            typeof crawlResponse === "object" &&
            "success" in crawlResponse &&
            (crawlResponse as { success: boolean }).success &&
            "data" in crawlResponse
          ) {
            const rawDocuments = ((crawlResponse as unknown) as { data?: unknown[] }).data ?? [];
            crawlResults = rawDocuments.flatMap((document): CrawledPage[] => {
              if (!document || typeof document !== "object") return [];
              const record = document as Record<string, unknown>;
              const metadata = record.metadata && typeof record.metadata === "object"
                ? record.metadata as Record<string, unknown>
                : undefined;
              const documentUrl = typeof record.url === "string"
                ? record.url
                : typeof metadata?.sourceURL === "string"
                  ? metadata.sourceURL
                  : typeof metadata?.url === "string"
                    ? metadata.url
                    : null;
              if (!documentUrl) return [];
              return [{
                url: documentUrl,
                markdown: typeof record.markdown === "string" ? record.markdown : undefined,
                metadata: metadata
                  ? {
                      title: typeof metadata.title === "string" ? metadata.title : undefined,
                      description: typeof metadata.description === "string" ? metadata.description : undefined,
                    }
                  : undefined,
              }];
            });
          } else {
            console.error("[Premium Audit] Firecrawl returned an unsuccessful or incomplete response for", url);
            return NextResponse.json(
              {
                error: "Bad Gateway",
                message: "خزش وب‌سایت هدف تکمیل نشد. لطفاً آدرس را بررسی و دوباره تلاش کنید.",
              },
              { status: 502, headers: limitHeaders }
            );
          }
        } catch (crawlErr: unknown) {
          console.error("[Premium Audit] Firecrawl crawl error:", crawlErr);
          return NextResponse.json(
            {
              error: "Bad Gateway",
              message: "ارتباط با سرویس خزش وب برقرار نشد. اعتبار مصرف نشد؛ لطفاً دوباره تلاش کنید.",
            },
            { status: 502, headers: limitHeaders }
          );
        }

        if (crawlResults.length === 0) {
          return NextResponse.json(
            {
              error: "Unprocessable Entity",
              message: "هیچ صفحه‌ی قابل تحلیلی در آدرس ارسالی یافت نشد.",
            },
            { status: 422, headers: limitHeaders }
          );
        }

        const pagesAnalyzed = Math.min(crawlResults.length, depth);

        // 6. LLM semantic analysis. Failure degrades the response explicitly; it never fabricates.
        let semanticAnalysisUnavailable = false;
        let llmRecommendations: PremiumAuditRecommendation[] = [];
        let gapAnalysis: string | null = null;

        const prompt = `
        You are an expert SEO Specialist.
        Analyze the following crawled pages markdown data from website "${url}":
        ${crawlResults
          .map(
            (p) =>
              `Page: ${p.url}\nMetadata: ${JSON.stringify(p.metadata ?? {})}\nContent Snippet: ${
                p.markdown?.substring(0, 500) ?? ""
              }\n---`
          )
          .join("\n")}

        Generate a premium semantic gap analysis and content recommendations in professional fluent Persian.
        Format the response strictly as a JSON object containing two fields:
        "gapAnalysis": "A string describing semantic topic gaps and industry opportunities."
        "recommendations": Array of objects: { "priority": "high"|"medium"|"low", "insight": "Actionable content strategy in Persian", "estimatedImpact": "e.g., +25% visibility" }

        Return raw JSON only. No markdown code fences, no conversational text.
      `;

        try {
          const raw = await getLLMClient().generateText(prompt, {
            temperature: 0.2,
            systemPrompt:
              "You always return output strictly as valid JSON with keys gapAnalysis and recommendations in Persian.",
          });

          let cleanJson = (raw ?? "").trim();
          if (cleanJson.startsWith("```")) {
            cleanJson = cleanJson.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
          }

          const parsedLlm = JSON.parse(cleanJson) as {
            gapAnalysis?: unknown;
            recommendations?: unknown;
          };

          if (typeof parsedLlm.gapAnalysis === "string" && parsedLlm.gapAnalysis.trim() !== "") {
            gapAnalysis = parsedLlm.gapAnalysis;
          }

          if (Array.isArray(parsedLlm.recommendations)) {
            llmRecommendations = parsedLlm.recommendations
              .filter((r): r is PremiumAuditRecommendation => {
                if (!r || typeof r !== "object") return false;
                const candidate = r as Record<string, unknown>;
                return (
                  typeof candidate.priority === "string" &&
                  RECOMMENDATION_PRIORITIES.has(candidate.priority) &&
                  typeof candidate.insight === "string" &&
                  typeof candidate.estimatedImpact === "string"
                );
              })
              .slice(0, 20);
          }

          if (!gapAnalysis || llmRecommendations.length === 0) {
            semanticAnalysisUnavailable = true;
          }
        } catch (llmErr: unknown) {
          console.error("[Premium Audit] LLM semantic analysis failed:", llmErr);
          semanticAnalysisUnavailable = true;
          gapAnalysis = null;
          llmRecommendations = [];
        }

        // 7. Deterministic heuristic scoring over the real crawl output.
        const missingDescriptions = crawlResults.filter(
          (p) => !p.metadata?.description || p.metadata.description.trim() === ""
        ).length;

        let contentQuality = 85;
        if (missingDescriptions > 0) {
          contentQuality -= Math.min(missingDescriptions * 10, 20);
        }

        const isHttps = url.toLowerCase().startsWith("https://");
        let technicalHealth = 90;
        if (!isHttps) {
          technicalHealth -= 30;
        }

        const totalMarkdownLength = crawlResults.reduce((acc, p) => acc + (p.markdown?.length ?? 0), 0);
        let internalLinking = 80;
        if (totalMarkdownLength < 1000) {
          internalLinking -= 15;
        }

        // Semantic coverage is only scored when a real semantic analysis exists.
        const semanticCoverage = gapAnalysis ? 75 : 0;

        const weightedSum = contentQuality * 0.3 + technicalHealth * 0.25 + internalLinking * 0.2;
        // When the semantic component is unavailable, renormalise over the available
        // weights instead of scoring the missing component as zero.
        const score = gapAnalysis
          ? Math.round(weightedSum + semanticCoverage * 0.25)
          : Math.round(weightedSum / 0.75);

        let grade: PremiumAuditResponse["grade"] = "F";
        if (score >= 90) grade = "A";
        else if (score >= 80) grade = "B";
        else if (score >= 70) grade = "C";
        else if (score >= 60) grade = "D";

        const issues: PremiumAuditIssue[] = [];
        if (!isHttps) {
          issues.push({
            severity: "critical",
            category: "technical",
            description: "عدم استفاده از پروتکل امن HTTPS برای ارتباطات رمزنگاری شده.",
            recommendation: "یک گواهی SSL معتبر بر روی دامنه نصب کرده و ریدایرکت ۳۰۱ را به HTTPS فعال کنید.",
          });
        }
        if (missingDescriptions > 0) {
          issues.push({
            severity: "warning",
            category: "content",
            description: `تعداد ${missingDescriptions} صفحه فاقد تگ توضیحات متاداده (Meta Description) مناسب هستند.`,
            recommendation: "برای تمامی صفحات شناسایی شده، توضیحات منحصربه‌فرد بین ۱۵۰ تا ۱۶۰ کاراکتر بنویسید.",
          });
        }
        if (totalMarkdownLength < 500) {
          issues.push({
            severity: "info",
            category: "structure",
            description: "حجم محتوای شناسایی‌شده وب‌سایت شما پایین‌تر از حد استاندارد است.",
            recommendation: "محتوای غنی و منطبق با گراف دانش برای صفحات خدمات یا بلاگ تولید کنید.",
          });
        }

        const metrics = { contentQuality, technicalHealth, internalLinking, semanticCoverage };
        const auditId = randomUUID();

        // 8. Persistence. A failure here fails the request: the stored audit is part of
        //    the paid deliverable and must not be silently lost.
        const insertSql = `
        INSERT INTO premium_audits (
          id, organization_id, url, score, grade, pages_analyzed, metrics, issues, recommendations,
          created_at, updated_at, created_by, updated_by, version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), $10, $10, 1);
      `;

        try {
          await PostgresClient.getInstance().query(insertSql, [
            auditId,
            tenantId,
            url,
            score,
            grade,
            pagesAnalyzed,
            JSON.stringify(metrics),
            JSON.stringify(issues),
            JSON.stringify(llmRecommendations),
            userId,
          ]);
        } catch (dbErr: unknown) {
          console.error("[Premium Audit] Failed to persist audit result:", dbErr);
          return NextResponse.json(
            {
              error: "Internal Server Error",
              message: "نتیجه ارزیابی ذخیره نشد. لطفاً دوباره تلاش کنید.",
            },
            { status: 500, headers: limitHeaders }
          );
        }

        const responsePayload: PremiumAuditResponse = {
          auditId,
          score,
          grade,
          pagesAnalyzed,
          metrics,
          issues,
          recommendations: llmRecommendations,
          ...(semanticAnalysisUnavailable ? { semanticAnalysisUnavailable: true } : {}),
        };

        return NextResponse.json(responsePayload, { status: 200, headers: limitHeaders });
      }
    );
  } catch (error: unknown) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.statusCode === 401 ? "Unauthorized" : "Forbidden", message: error.message },
        { status: error.statusCode, headers: limitHeaders }
      );
    }

    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: "Service Unavailable", message: error.message },
        { status: error.statusCode, headers: limitHeaders }
      );
    }

    console.error("[Premium SEO Audit Route Error]:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "خطای ناشناخته در ارزیابی پریمیوم رخ داد." },
      { status: 500, headers: limitHeaders }
    );
  }
}
