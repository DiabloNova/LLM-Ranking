/**
 * Production-Grade Diagnostic Engine
 * Performs deterministic, evidence-driven multi-domain diagnostics,
 * root-cause analysis, severity/confidence separation, and historical regression checks.
 */

import {
  DiagnosticFinding,
  DiagnosticFindingRelationship,
  DiagnosticCategory,
  FindingSeverity,
  FindingConfidence,
  FindingStatus,
  Website,
  Page,
  Keyword,
  Topic,
  Competitor,
  HistoricalMetric,
  AIObservation
} from "../../features/ai-intelligence/domain/types";
import { SeoSignals } from "../../types/seo-signals";

export interface DiagnosticInputs {
  organizationId: string;
  websiteId: string;
  seoSignals?: SeoSignals;
  aiObservations?: AIObservation[];
  historicalMetrics?: HistoricalMetric[];
  competitors?: Competitor[];
  pastFindings?: DiagnosticFinding[];
}

export interface DiagnosticResult {
  findings: DiagnosticFinding[];
  relationships: DiagnosticFindingRelationship[];
  timestamp: string;
}

export class DiagnosticEngine {
  /**
   * Evaluates diagnostic rules over supplied multi-dimensional inputs,
   * constructs findings, performs root-cause mapping, and outputs results.
   */
  public async executeDiagnostics(inputs: DiagnosticInputs): Promise<DiagnosticResult> {
    const { organizationId, websiteId } = inputs;
    const findings: DiagnosticFinding[] = [];
    const relationships: DiagnosticFindingRelationship[] = [];
    const timestamp = new Date().toISOString();

    const createAudit = (version = 1) => ({
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: "diagnostic-engine",
      updatedBy: "diagnostic-engine",
      version
    });

    const createFinding = (params: {
      id: string;
      category: DiagnosticCategory;
      code: string;
      title: string;
      explanation: string;
      severity: FindingSeverity;
      confidence: FindingConfidence;
      affectedResource: string;
      evidence: Record<string, unknown>;
    }): DiagnosticFinding => ({
      id: params.id,
      organizationId,
      websiteId,
      category: params.category,
      code: params.code,
      title: params.title,
      explanation: params.explanation,
      severity: params.severity,
      confidence: params.confidence,
      status: "active",
      affectedResource: params.affectedResource,
      evidence: params.evidence,
      audit: createAudit()
    });

    // ----------------------------------------------------
    // 1. TECHNICAL DIAGNOSTICS (SeoSignals)
    // ----------------------------------------------------
    if (inputs.seoSignals) {
      const signals = inputs.seoSignals;

      // Rule T1: Unreachable/Error HTTP Status Codes
      if (signals.http && !signals.http.isSuccess) {
        findings.push(
          createFinding({
            id: `df-tech-http-${signals.page.url.replace(/[^a-zA-Z0-9]/g, "")}`,
            category: "technical",
            code: "ERR_TECH_HTTP_FAILED",
            title: "صفحه غیرقابل دسترس یا دارای خطای HTTP است",
            explanation: `این صفحه کد پاسخ ${signals.http.statusCode} را بازگرداند که نشان‌دهنده خطا در لایه شبکه یا سرور است.`,
            severity: signals.http.isServerError ? "critical" : "high",
            confidence: "high",
            affectedResource: signals.page.normalizedUrl,
            evidence: { statusCode: signals.http.statusCode, isServerError: signals.http.isServerError }
          })
        );
      }

      // Rule T2: Redirect Loops or Chains
      if (signals.redirects && (signals.redirects.isLoop || signals.redirects.excessiveCount)) {
        findings.push(
          createFinding({
            id: `df-tech-redir-${signals.page.url.replace(/[^a-zA-Z0-9]/g, "")}`,
            category: "technical",
            code: "ERR_TECH_REDIRECT_LOOP",
            title: "حلقه یا زنجیره ریدایرکت طولانی شناسایی شد",
            explanation: signals.redirects.isLoop
              ? "یک حلقه ریدایرکت بی‌پایان شناسایی شد که مانع از خزیدن صفحه توسط موتورهای جستجو و هوش مصنوعی می‌شود."
              : `یک زنجیره ریدایرکت بسیار طولانی شامل ${signals.redirects.redirectCount} جهش شناسایی شد.`,
            severity: "high",
            confidence: "high",
            affectedResource: signals.page.normalizedUrl,
            evidence: { redirectChain: signals.redirects.redirectChain, redirectCount: signals.redirects.redirectCount, isLoop: signals.redirects.isLoop }
          })
        );
      }

      // Rule T3: Canonical Inconsistencies
      if (signals.canonical && signals.canonical.present && !signals.canonical.isValid) {
        findings.push(
          createFinding({
            id: `df-tech-canonical-${signals.page.url.replace(/[^a-zA-Z0-9]/g, "")}`,
            category: "technical",
            code: "ERR_TECH_CANONICAL_INVALID",
            title: "آدرس کانونیکال نامعتبر است",
            explanation: `آدرس کانونیکال معرفی شده (${signals.canonical.url}) نامعتبر است یا فرمت URL صحیحی ندارد.`,
            severity: "medium",
            confidence: "high",
            affectedResource: signals.page.normalizedUrl,
            evidence: { canonicalUrl: signals.canonical.url, isValid: false }
          })
        );
      }

      // Rule T4: Multiple Canonical Declarations
      if (signals.canonical && signals.canonical.multiple) {
        findings.push(
          createFinding({
            id: `df-tech-canonical-mult-${signals.page.url.replace(/[^a-zA-Z0-9]/g, "")}`,
            category: "technical",
            code: "ERR_TECH_CANONICAL_MULTIPLE",
            title: "وجود چند تگ کانونیکال متناقض",
            explanation: `تعداد ${signals.canonical.occurrences.length} تگ کانونیکال متناقض در این صفحه یافت شد که موجب سردرگمی بات‌های هوش مصنوعی می‌شود.`,
            severity: "high",
            confidence: "high",
            affectedResource: signals.page.normalizedUrl,
            evidence: { occurrences: signals.canonical.occurrences }
          })
        );
      }

      // Rule T5: Duplicate Metadata Tags
      if (signals.metadata && (signals.metadata.title.count > 1 || signals.metadata.description.count > 1)) {
        findings.push(
          createFinding({
            id: `df-tech-metadata-dup-${signals.page.url.replace(/[^a-zA-Z0-9]/g, "")}`,
            category: "technical",
            code: "ERR_TECH_DUPLICATE_METADATA",
            title: "وجود تگ‌های متادیتای تکراری روی صفحه",
            explanation: `صفحه دارای ${signals.metadata.title.count} تگ عنوان و ${signals.metadata.description.count} تگ توضیحات است.`,
            severity: "low",
            confidence: "high",
            affectedResource: signals.page.normalizedUrl,
            evidence: { titleCount: signals.metadata.title.count, descriptionCount: signals.metadata.description.count }
          })
        );
      }
    }

    // ----------------------------------------------------
    // 2. CONTENT DIAGNOSTICS (SeoSignals)
    // ----------------------------------------------------
    if (inputs.seoSignals) {
      const signals = inputs.seoSignals;

      // Rule C1: Thin / Low Word Count Content
      if (signals.contentStructure && signals.contentStructure.wordCount < 150) {
        findings.push(
          createFinding({
            id: `df-cont-thin-${signals.page.url.replace(/[^a-zA-Z0-9]/g, "")}`,
            category: "content",
            code: "ERR_CONTENT_THIN",
            title: "محتوای بسیار کوتاه و ضعیف (Thin Content)",
            explanation: `تعداد کلمات محتوای اصلی صفحه (${signals.contentStructure.wordCount} کلمه) بسیار کم است و فاقد ارزش کافی برای ایندکس و یادگیری هوش مصنوعی است.`,
            severity: "high",
            confidence: "high",
            affectedResource: signals.page.normalizedUrl,
            evidence: { wordCount: signals.contentStructure.wordCount }
          })
        );
      }

      // Rule C2: Missing Title / Description Elements
      if (signals.metadata && (!signals.metadata.title.present || !signals.metadata.description.present)) {
        findings.push(
          createFinding({
            id: `df-cont-meta-missing-${signals.page.url.replace(/[^a-zA-Z0-9]/g, "")}`,
            category: "content",
            code: "ERR_CONTENT_METADATA_MISSING",
            title: "فقدان تگ‌های متادیتای ضروری عنوان یا توضیحات",
            explanation: "این صفحه فاقد تگ عنوان (title) یا توضیحات متای ضروری است که برای معرفی محتوا به الگوهای زبانی واجب است.",
            severity: "high",
            confidence: "high",
            affectedResource: signals.page.normalizedUrl,
            evidence: { titlePresent: signals.metadata.title.present, descriptionPresent: signals.metadata.description.present }
          })
        );
      }
    }

    // ----------------------------------------------------
    // 3. SEO DIAGNOSTICS (SeoSignals & Content)
    // ----------------------------------------------------
    if (inputs.seoSignals) {
      const signals = inputs.seoSignals;

      // Rule S1: Indexability Blocked by Robots Policies
      if (signals.robots && !signals.robots.indexAllowed) {
        findings.push(
          createFinding({
            id: `df-seo-block-robots-${signals.page.url.replace(/[^a-zA-Z0-9]/g, "")}`,
            category: "seo",
            code: "ERR_SEO_ROBOTS_BLOCKED",
            title: "دسترسی ایندکس توسط فایل robots.txt یا تگ نوایندکس مسدود شده است",
            explanation: "قوانین روبوت در هد یا بدنه مانع از ایندکس شدن و کاوش معنایی توسط بات‌های هوش مصنوعی Snapp/SnappSnapp شده است.",
            severity: "critical",
            confidence: "high",
            affectedResource: signals.page.normalizedUrl,
            evidence: { metaDirectives: signals.robots.metaDirectives, headerDirectives: signals.robots.headerDirectives }
          })
        );
      }

      // Rule S2: Internal Linking Weakness (Zero or extremely low internal links)
      if (signals.internalLinks && signals.internalLinks.internalCount === 0) {
        findings.push(
          createFinding({
            id: `df-seo-orphan-${signals.page.url.replace(/[^a-zA-Z0-9]/g, "")}`,
            category: "seo",
            code: "ERR_SEO_ORPHAN_PAGE",
            title: "صفحه یتیم بدون هیچ‌گونه لینک داخلی",
            explanation: "این صفحه دارای صفر لینک داخلی است و به عنوان یک صفحه یتیم در ساختار وب‌سایت شناخته می‌شود که دسترسی کاوشگر به آن را قطع می‌کند.",
            severity: "medium",
            confidence: "high",
            affectedResource: signals.page.normalizedUrl,
            evidence: { internalLinksCount: signals.internalLinks.internalCount }
          })
        );
      }
    }

    // ----------------------------------------------------
    // 4. AEO DIAGNOSTICS (AI Observations)
    // ----------------------------------------------------
    if (inputs.aiObservations && inputs.aiObservations.length > 0) {
      const obsList = inputs.aiObservations;

      // Rule A1: Brand Absence in AI Answers
      const totalObsCount = obsList.length;
      let brandMentionsCount = 0;
      obsList.forEach(obs => {
        // Simple search for Acme/Snapp/our brand name in response text to check presence
        if (/Acme SaaS|Snapp|رشا گستر/i.test(obs.responseText)) {
          brandMentionsCount++;
        }
      });

      const presenceRatio = brandMentionsCount / totalObsCount;
      if (presenceRatio === 0) {
        findings.push(
          createFinding({
            id: "df-aeo-brand-absent-01",
            category: "aeo",
            code: "ERR_AEO_BRAND_ABSENT",
            title: "عدم حضور نام برند در پاسخ‌های هوش مصنوعی",
            explanation: `برند شما در هیچ‌کدام از ${totalObsCount} ارزیابی و پرسش و پاسخ اخیر موتورهای جستجوی هوشمند پاسخ داده نشده و غایب کامل است.`,
            severity: "critical",
            confidence: "high",
            affectedResource: "Acme SaaS",
            evidence: { totalObservations: totalObsCount, presenceRatio: 0 }
          })
        );
      } else if (presenceRatio < 0.6) {
        findings.push(
          createFinding({
            id: "df-aeo-brand-weak-presence-01",
            category: "aeo",
            code: "ERR_AEO_WEAK_PRESENCE",
            title: "حضور بسیار ضعیف برند در نتایج پاسخ‌های هوشمند",
            explanation: `برند شما تنها در ${brandMentionsCount} مورد از ${totalObsCount} پرسش ارزیابی پاسخ داده شده حضور یافته است که نرخ حضور پایینی (${Math.round(presenceRatio * 100)}٪) است.`,
            severity: "high",
            confidence: "high",
            affectedResource: "Acme SaaS",
            evidence: { totalObservations: totalObsCount, presenceRatio }
          })
        );
      }
    } else {
      // Rule A2: Insufficient Evidence Negative Fallback
      findings.push(
        createFinding({
          id: "df-aeo-insufficient-evidence",
          category: "aeo",
          code: "ERR_AEO_INSUFFICIENT_EVIDENCE",
          title: "شواهد ارزیابی و مشاهدات AEO کافی نیست",
          explanation: "هیچ‌گونه مشاهده یا لاگ پرسش و پاسخی برای بررسی حضور برند یافت نشد. بنابراین تحلیل غیرممکن است.",
          severity: "low",
          confidence: "low",
          affectedResource: "AI Observation Stream",
          evidence: { aiObservationsCount: 0 }
        })
      );
    }

    // ----------------------------------------------------
    // 5. ENTITY DIAGNOSTICS (SeoSignals & Graph entities)
    // ----------------------------------------------------
    if (inputs.seoSignals) {
      const signals = inputs.seoSignals;

      // Rule E1: Missing Schema (JSON-LD or Microdata)
      if (signals.structuredData && !signals.structuredData.hasJsonLd) {
        findings.push(
          createFinding({
            id: `df-ent-schema-missing-${signals.page.url.replace(/[^a-zA-Z0-9]/g, "")}`,
            category: "entity",
            code: "ERR_ENTITY_SCHEMA_MISSING",
            title: "فقدان کدهای ساختاریافته معنایی (Structured Data)",
            explanation: "صفحه فاقد کدهای معنایی معتبر JSON-LD یا Microdata است که به موتورهای هوش مصنوعی در درک هویت برند کمک می‌کند.",
            severity: "high",
            confidence: "high",
            affectedResource: signals.page.normalizedUrl,
            evidence: { hasJsonLd: false, blocksCount: 0 }
          })
        );
      }
    }

    // ----------------------------------------------------
    // 6. CITATION DIAGNOSTICS (SeoSignals & AI citations)
    // ----------------------------------------------------
    if (inputs.aiObservations && inputs.aiObservations.length > 0) {
      // Check if we have cited resources in our signal structures
      // We can look at inputs.seoSignals.canonical to check citation alignments
      const signals = inputs.seoSignals;
      if (signals && signals.canonical && signals.canonical.present) {
        // If canonical is defined but points to a completely different domain/page, that represents citation mismatch
        if (!signals.canonical.matchesPageUrl) {
          findings.push(
            createFinding({
              id: `df-cit-mismatch-${signals.page.url.replace(/[^a-zA-Z0-9]/g, "")}`,
              category: "citation",
              code: "ERR_CITATION_URL_MISMATCH",
              title: "عدم انطباق آدرس ارجاع کانونیکال با آدرس صفحه اصلی",
              explanation: `آدرس کانونیکال صفحه به آدرس متفاوتی ارجاع داده است (${signals.canonical.url}) که موجب چندگانگی آدرس‌های استنادی در هوش مصنوعی می‌شود.`,
              severity: "medium",
              confidence: "high",
              affectedResource: signals.page.normalizedUrl,
              evidence: { canonicalUrl: signals.canonical.url, pageUrl: signals.page.url }
            })
          );
        }
      }
    }

    // ----------------------------------------------------
    // 7. COMPETITIVE DIAGNOSTICS (Competitors & Comparisons)
    // ----------------------------------------------------
    if (inputs.competitors && inputs.competitors.length > 0) {
      const rivals = inputs.competitors;

      // Rule CM1: Competitive Gap Detected (If competitor score or visibility is higher)
      // Check if competitors have visibilityScores or historical metrics showing advantage
      if (inputs.historicalMetrics && inputs.historicalMetrics.length > 0) {
        const metrics = inputs.historicalMetrics;
        // Check if there are metrics showing competitor visibility index advantage
        const compMetrics = metrics.filter(m => m.targetType === "competitor");
        const ownMetrics = metrics.filter(m => m.targetType === "website");

        if (compMetrics.length > 0 && ownMetrics.length > 0) {
          const avgComp = compMetrics.reduce((acc, c) => acc + c.metricValue, 0) / compMetrics.length;
          const avgOwn = ownMetrics.reduce((acc, o) => acc + o.metricValue, 0) / ownMetrics.length;

          if (avgComp > avgOwn) {
            findings.push(
              createFinding({
                id: "df-comp-gap-detected-01",
                category: "competitive",
                code: "ERR_COMP_VISIBILITY_GAP",
                title: "رقیب تجاری دارای مزیت و برتری در سهم حضور است",
                explanation: `میانگین شاخص دیده شدن رقیب (${avgComp}) از شاخص دیده شدن برند شما (${avgOwn}) بالاتر است.`,
                severity: "high",
                confidence: "high",
                affectedResource: rivals[0].domain,
                evidence: { competitorVisibility: avgComp, brandVisibility: avgOwn }
              })
            );
          }
        }
      }
    }

    // ----------------------------------------------------
    // 8. HISTORICAL DIAGNOSIS (Regressions / Trends)
    // ----------------------------------------------------
    if (inputs.historicalMetrics && inputs.historicalMetrics.length >= 2) {
      const metrics = inputs.historicalMetrics.filter(m => m.targetType === "website" && m.metricName === "visibility_index");
      if (metrics.length >= 2) {
        // Sort chronologically ascending to evaluate regression trend
        const sorted = [...metrics].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const oldest = sorted[0];
        const latest = sorted[sorted.length - 1];

        if (latest.metricValue < oldest.metricValue) {
          findings.push(
            createFinding({
              id: "df-hist-visibility-degradation",
              category: "aeo",
              code: "ERR_AEO_VISIBILITY_DEGRADATION",
              title: "افت و زوال تدریجی شاخص سهم حضور برند در هوش مصنوعی",
              explanation: `شاخص حضور برند شما از مقدار ${oldest.metricValue} به مقدار ${latest.metricValue} افت کرده است که نشان‌دهنده عقب‌نشینی تدریجی است.`,
              severity: "high",
              confidence: "high",
              affectedResource: "Acme Website",
              evidence: { oldestValue: oldest.metricValue, latestValue: latest.metricValue, oldestTime: oldest.timestamp, latestTime: latest.timestamp }
            })
          );
        }
      }
    }

    // ----------------------------------------------------
    // 9. ROOT-CAUSE ANALYSIS (RCA Dependency Model)
    // ----------------------------------------------------
    // Rule RCA1: "robots blocked indexability" (ERR_SEO_ROBOTS_BLOCKED) -> "reduced AI visibility/brand absent" (ERR_AEO_BRAND_ABSENT)
    const robotsBlockedFinding = findings.find(f => f.code === "ERR_SEO_ROBOTS_BLOCKED");
    const brandAbsentFinding = findings.find(f => f.code === "ERR_AEO_BRAND_ABSENT" || f.code === "ERR_AEO_WEAK_PRESENCE");

    if (robotsBlockedFinding && brandAbsentFinding) {
      relationships.push({
        organizationId,
        sourceFindingId: robotsBlockedFinding.id,
        targetFindingId: brandAbsentFinding.id,
        relationshipType: "caused_by",
        audit: createAudit()
      });
    }

    // Rule RCA2: "missing entity schemas" (ERR_ENTITY_SCHEMA_MISSING) -> "poor entity recognition / brand absent" (ERR_AEO_BRAND_ABSENT)
    const schemaMissingFinding = findings.find(f => f.code === "ERR_ENTITY_SCHEMA_MISSING");
    if (schemaMissingFinding && brandAbsentFinding) {
      relationships.push({
        organizationId,
        sourceFindingId: schemaMissingFinding.id,
        targetFindingId: brandAbsentFinding.id,
        relationshipType: "contributes_to",
        audit: createAudit()
      });
    }

    // Rule RCA3: "unreachable error HTTP status" (ERR_TECH_HTTP_FAILED) -> "robots blocked / index failure" (ERR_SEO_ROBOTS_BLOCKED)
    const httpFailedFinding = findings.find(f => f.code === "ERR_TECH_HTTP_FAILED");
    if (httpFailedFinding && robotsBlockedFinding) {
      relationships.push({
        organizationId,
        sourceFindingId: httpFailedFinding.id,
        targetFindingId: robotsBlockedFinding.id,
        relationshipType: "depends_on",
        audit: createAudit()
      });
    }

    return {
      findings,
      relationships,
      timestamp
    };
  }
}
export default DiagnosticEngine;
