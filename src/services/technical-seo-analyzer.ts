import { SeoSignals, StructuredDataBlock, LinkItem } from "@/types/seo-signals";
import { DiagnosticFinding, AuditMetadata, DiagnosticCategory } from "@/features/ai-intelligence/domain/types";
import { TenantContextManager } from "@/core/database/tenant-context";

/**
 * Strongly-typed internal Analyzer finding representation,
 * perfectly compatible with DiagnosticFinding properties.
 */
export interface AnalyzerFinding {
  code: string;
  category: DiagnosticCategory;
  title: string;
  explanation: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: "low" | "medium" | "high";
  affectedResource: string;
  evidence: Record<string, unknown>;
}

/**
 * Deterministic mapping from finding code/category/severity to Persian and English recommendations.
 */
export interface RecommendedAction {
  title: string;
  description: string;
  impactScore: number;
}

export function getDeterministicRecommendation(finding: AnalyzerFinding, lang: "en" | "fa" = "en"): RecommendedAction {
  const isRtl = lang === "fa";
  const code = finding.code;

  const faMap: Record<string, RecommendedAction> = {
    ERR_STRUCT_SCHEMA_MISSING: {
      title: "افزودن کدهای ساختاریافته (Structured Data)",
      description: "برای کمک به فهم معنایی بات‌های هوش مصنوعی و گوگل، تگ‌های JSON-LD (نوع Article یا WebSite) را به هدر وب‌سایت اضافه کنید.",
      impactScore: 15
    },
    ERR_STRUCT_JSONLD_MALFORMED: {
      title: "اصلاح فرمت JSON-LD",
      description: "فرمت تگ ld+json متناقض یا خراب است. لطفا با استفاده از ابزار سنجش نحو کدهای ساختاریافته، خطای ساختاری را رفع کنید.",
      impactScore: 25
    },
    ERR_STRUCT_REQUIRED_PROPERTY_MISSING: {
      title: "تکمیل فیلدهای الزامی اسکیما",
      description: "بعضی از ویژگی‌های کلیدی در بدنه داده ساختاریافته وجود ندارد. مقادیر گم‌شده را به کد JSON-LD تزریق نمایید.",
      impactScore: 12
    },
    ERR_STRUCT_DUPLICATE_BLOCK: {
      title: "حذف کدهای اسکیما تکراری",
      description: "وجود چندین بلوک اسکیمای هم‌نوع روی یک صفحه ممکن است موجب سردرگمی کراولرها شود. آن‌ها را ادغام یا یکپارچه کنید.",
      impactScore: 5
    },
    ERR_CRAWL_HTTP_ERROR: {
      title: "رفع خطای پاسخ سرور (HTTP Status)",
      description: "صفحه خطای دسترسی شبکه یا سرور بازمی‌گرداند. ریشه‌ی خطا را در کدهای بک‌اند یا تنظیمات سرور وب بررسی کنید.",
      impactScore: 35
    },
    ERR_CRAWL_REDIRECT_ISSUE: {
      title: "اصلاح زنجیره یا حلقه ریدایرکت",
      description: "ریدایرکت‌های تو در تو سرعت خزیدن را کاهش داده و ربات‌ها را مسدود می‌کنند. ریدایرکت مستقیم به آدرس مقصد نهایی قرار دهید.",
      impactScore: 20
    },
    ERR_INDEX_NOINDEX: {
      title: "حذف تگ نوایندکس (noindex)",
      description: "تگ meta robots یا X-Robots-Tag دسترسی کاوشگرهای هوشمند را قطع کرده است. در صورت نیاز به ایندکس، این محدودیت را بردارید.",
      impactScore: 40
    },
    ERR_INDEX_BLOCKED_BY_ROBOTS: {
      title: "اصلاح فایل robots.txt",
      description: "مسیر این صفحه در فایل robots.txt مسدود شده است. قوانین Disallow مربوطه را بازنگری و اصلاح کنید.",
      impactScore: 40
    },
    ERR_INDEX_CANONICAL_MISMATCH: {
      title: "اصلاح تگ کانونیکال متناقض",
      description: "تگ کانونیکال به آدرس دیگری اشاره دارد. اطمینان حاصل کنید که این آدرس با آدرس واقعی صفحه همخوانی داشته باشد.",
      impactScore: 18
    },
    ERR_INDEX_CONFLICTING_SIGNALS: {
      title: "رفع تناقض در سیگنال‌های ایندکس",
      description: "وجود سیگنال‌های متضاد (مانند کانونیکال خود-ارجاع همزمان با نوایندکس) مانع تصمیم‌گیری شفاف کراولر می‌شود. تگ نوایندکس را حذف یا کانونیکال را اصلاح کنید.",
      impactScore: 22
    },
    ERR_LINK_ORPHAN_PAGE: {
      title: "ایجاد لینک‌های داخلی خروجی/ورودی",
      description: "این صفحه هیچ لینک ورودی از صفحات دیگر وب‌سایت ندارد. لینک‌های متنی و منوهای مرتبط را به این صفحه متصل کنید.",
      impactScore: 15
    },
    ERR_LINK_EMPTY_ANCHOR: {
      title: "افزودن متن لنگر (Anchor Text)",
      description: "لینک‌های داخلی فاقد متن توصیفی مناسب هستند. مطمئن شوید که تمام لینک‌ها دارای متن لنگر خوانا و معنایی باشند.",
      impactScore: 8
    },
    ERR_LINK_BROKEN_TARGET: {
      title: "تعمیر لینک‌های داخلی خراب (شکسته)",
      description: "این صفحه به آدرسی لینک داده که خطای HTTP می‌دهد یا وجود ندارد. آدرس لینک را ویرایش یا حذف کنید.",
      impactScore: 18
    },
    ERR_SITEMAP_MISSING: {
      title: "ساخت و معرفی نقشه سایت (Sitemap)",
      description: "فایل sitemap.xml یافت نشد. یک نقشه سایت استاندارد ساخته و آدرس آن را در گوگل سرچ کنسول و فایل robots.txt معرفی کنید.",
      impactScore: 20
    },
    ERR_SITEMAP_FETCH_ERROR: {
      title: "رفع خطای دسترسی به نقشه سایت",
      description: "امکان بارگذاری نقشه سایت وجود ندارد. مطمئن شوید آدرس نقشه سایت زنده بوده و وضعیت ۲۰۰ بازمی‌گرداند.",
      impactScore: 25
    },
    ERR_SITEMAP_URL_ERROR: {
      title: "پاکسازی آدرس‌های خراب از نقشه سایت",
      description: "نقشه سایت حاوی آدرس‌های نامعتبر یا دارای خطای HTTP است. آدرس‌های خراب را از فایل sitemap.xml حذف کنید.",
      impactScore: 15
    },
    ERR_SITEMAP_CANONICAL_MISMATCH: {
      title: "تطابق آدرس‌های نقشه سایت با کانونیکال",
      description: "آدرس‌های موجود در نقشه سایت باید دقیقا نسخه‌های کانونیکال باشند. آدرس‌های فرعی را با نسخه اصلی جایگزین کنید.",
      impactScore: 12
    },
    ERR_SITEMAP_DUPLICATE_URLS: {
      title: "حذف آدرس‌های تکراری در نقشه سایت",
      description: "آدرس‌های تکراری در نقشه سایت فضا و بودجه‌ی خزش ربات‌ها را هدر می‌دهند. آدرس‌های تکراری را فیلتر کنید.",
      impactScore: 5
    },
    ERR_CANONICAL_MISSING: {
      title: "افزودن تگ کانونیکال اصلی",
      description: "صفحه فاقد تگ کانونیکال است. تگ کانونیکال خود-ارجاعی قرار دهید تا از جریمه‌ی محتوای تکراری جلوگیری شود.",
      impactScore: 15
    },
    ERR_CANONICAL_INVALID: {
      title: "اصلاح فرمت تگ کانونیکال",
      description: "آدرس وارد شده در تگ کانونیکال نامعتبر یا دارای سینتکس خراب است. آدرس مطلق معتبر در آن قرار دهید.",
      impactScore: 25
    },
    ERR_CANONICAL_MULTIPLE: {
      title: "یکپارچه‌سازی تگ‌های کانونیکال",
      description: "بیش از یک تگ کانونیکال در صفحه پیدا شد. تمام تگ‌های کانونیکال اضافی را حذف کرده و فقط یک تگ اصلی باقی بگذارید.",
      impactScore: 20
    },
    ERR_CANONICAL_TO_ERROR: {
      title: "تغییر مقصد تگ کانونیکال خراب",
      description: "تگ کانونیکال به صفحه‌ای اشاره می‌کند که دارای خطای شبکه است. مقصد کانونیکال را به یک صفحه زنده با کد ۲۰۰ تغییر دهید.",
      impactScore: 18
    },
    ERR_CANONICAL_CHAIN: {
      title: "شکستن زنجیره‌ی تگ‌های کانونیکال",
      description: "یک زنجیره کانونیکال تودرتو شناسایی شد. تگ کانونیکال را مستقیما به مقصد نهایی صفحه ارجاع دهید.",
      impactScore: 15
    },
    ERR_ROBOTS_DIRECTIVES_CONFLICT: {
      title: "رفع تضاد دستورات ربات‌ها (Robots Directives)",
      description: "بین دستورات تگ‌های متا ربات و کانونیکال تضاد وجود دارد. رفتار خزنده را یکپارچه و تضاد را برطرف کنید.",
      impactScore: 20
    },
    ERR_CWV_INSUFFICIENT_EVIDENCE: {
      title: "فعالسازی ابزار سنجش کارایی صفحه",
      description: "شواهد کافی برای تحلیل سرعت و کارایی صفحه وجود ندارد. تست‌های زنده سنجش پاسخ‌دهی سرور را بررسی یا فعال کنید.",
      impactScore: 5
    },
    ERR_CWV_SLOW_RESPONSE: {
      title: "بهینه‌سازی زمان پاسخ‌دهی سرور (TTFB)",
      description: "زمان پاسخ‌دهی اولیه سرور بالا است. از کش سرور استفاده کنید، پایگاه داده را بهینه کرده و منابع هاستینگ را ارتقا دهید.",
      impactScore: 18
    },
    ERR_CWV_LARGE_PAGE: {
      title: "کاهش حجم کدهای صفحه و رسانه‌ها",
      description: "حجم کلی کدهای HTML و اسکریپت‌های بارگذاری شده بالا است. تصاویر را فشرده کرده و از تکنیک Minify استفاده کنید.",
      impactScore: 10
    }
  };

  const enMap: Record<string, RecommendedAction> = {
    ERR_STRUCT_SCHEMA_MISSING: {
      title: "Add Semantic Structured Data",
      description: "Inject JSON-LD schemas (such as Article, Organization, or WebSite) to assist AI engines and crawlers in semantic interpretation.",
      impactScore: 15
    },
    ERR_STRUCT_JSONLD_MALFORMED: {
      title: "Fix Malformed JSON-LD Syntax",
      description: "One or more script blocks contain malformed JSON structure or syntax errors. Validate your schema using a parser to resolve formatting issues.",
      impactScore: 25
    },
    ERR_STRUCT_REQUIRED_PROPERTY_MISSING: {
      title: "Inject Missing Required Schema Properties",
      description: "Required properties are missing for the detected schema type. Populate missing properties to ensure complete machine readability.",
      impactScore: 12
    },
    ERR_STRUCT_DUPLICATE_BLOCK: {
      title: "De-duplicate Multiple Schema Blocks",
      description: "Multiple instances of the same schema type exist on a single page, creating conflicting signals. Consolidated them into one coherent object.",
      impactScore: 5
    },
    ERR_CRAWL_HTTP_ERROR: {
      title: "Resolve HTTP Server Error Code",
      description: "The page returns a non-success HTTP status. Inspect server configurations or backend code to ensure a healthy 200 OK response.",
      impactScore: 35
    },
    ERR_CRAWL_REDIRECT_ISSUE: {
      title: "Optimize Long Redirect Chain or Loop",
      description: "Redirect chains slow down crawlers and degrade page performance. Route directly to the final landing URL instead.",
      impactScore: 20
    },
    ERR_INDEX_NOINDEX: {
      title: "Remove Explicit Noindex Directives",
      description: "A robots metadata tag or X-Robots-Tag header is explicitly preventing indexing. Remove this block if the page should be crawled.",
      impactScore: 40
    },
    ERR_INDEX_BLOCKED_BY_ROBOTS: {
      title: "Update Robots.txt Rules",
      description: "Robots.txt contains matching Disallow directives blocking this page. Refine the disallow rules to allow safe bot access.",
      impactScore: 40
    },
    ERR_INDEX_CANONICAL_MISMATCH: {
      title: "Align Non-Matching Canonical Tags",
      description: "The canonical URL mismatches the actual page URL. Verify the self-canonical refers to the authoritative, crawled address.",
      impactScore: 18
    },
    ERR_INDEX_CONFLICTING_SIGNALS: {
      title: "Resolve Conflicting Indexability Directives",
      description: "Conflicting directives (e.g. self-canonical mixed with a noindex tag) confuse crawlers. Remove the noindex tag or correct the canonical target.",
      impactScore: 22
    },
    ERR_LINK_ORPHAN_PAGE: {
      title: "Establish Internal Link Architecture",
      description: "This page has zero inbound internal links and is considered an orphan page. Link to it from related contextual content and navigational menus.",
      impactScore: 15
    },
    ERR_LINK_EMPTY_ANCHOR: {
      title: "Provide Descriptive Anchor Text",
      description: "Some internal links contain empty or generic anchor texts. Populate them with descriptive, relevant keywords for better semantic search.",
      impactScore: 8
    },
    ERR_LINK_BROKEN_TARGET: {
      title: "Fix Broken Internal Links",
      description: "The page references internal links that return non-200 status codes. Remove or update those href endpoints.",
      impactScore: 18
    },
    ERR_SITEMAP_MISSING: {
      title: "Generate and Declare Sitemap XML",
      description: "No sitemap.xml file was discovered. Generate a standard sitemap and register its URL inside your robots.txt and search engines.",
      impactScore: 20
    },
    ERR_SITEMAP_FETCH_ERROR: {
      title: "Fix Sitemap XML Retrieval Failures",
      description: "The sitemap file returned a non-success status code during retrieval. Ensure the sitemap URL is live and returning 200 OK.",
      impactScore: 25
    },
    ERR_SITEMAP_URL_ERROR: {
      title: "Purge Broken Pages from Sitemap",
      description: "Sitemap contains URLs that return error status codes. Remove deleted or non-existent URLs from your sitemap.xml file.",
      impactScore: 15
    },
    ERR_SITEMAP_CANONICAL_MISMATCH: {
      title: "Sitemap URLs Must Match Canonical Copies",
      description: "Non-canonical URLs were found in your sitemap. Ensure only canonical copies are declared in sitemap.xml to avoid duplicate indexing.",
      impactScore: 12
    },
    ERR_SITEMAP_DUPLICATE_URLS: {
      title: "De-duplicate Sitemap XML Entries",
      description: "Duplicate URLs are listed in the sitemap, wasting crawl budgets. Remove redundant entries.",
      impactScore: 5
    },
    ERR_CANONICAL_MISSING: {
      title: "Provide a Canonical Link Tag",
      description: "The page lacks a canonical reference. Set up a self-referencing canonical tag to define the primary URL of this resource.",
      impactScore: 15
    },
    ERR_CANONICAL_INVALID: {
      title: "Fix Malformed Canonical URL Syntax",
      description: "The canonical href contains syntax errors or relative paths. Ensure it is a valid, absolute URL.",
      impactScore: 25
    },
    ERR_CANONICAL_MULTIPLE: {
      title: "Consolidate Multiple Canonical Tags",
      description: "More than one canonical link tag was discovered in the head. Remove duplicate tags and keep only one primary target.",
      impactScore: 20
    },
    ERR_CANONICAL_TO_ERROR: {
      title: "Point Canonical Tag to a Valid, Active Page",
      description: "The canonical tag points to an error page. Re-route the canonical destination to an active page returning a 200 response.",
      impactScore: 18
    },
    ERR_CANONICAL_CHAIN: {
      title: "Break Canonical Redirection Chains",
      description: "A nested canonical chain was detected. Re-route the canonical tags to point directly to the final landing URL.",
      impactScore: 15
    },
    ERR_ROBOTS_DIRECTIVES_CONFLICT: {
      title: "Resolve Contradictory Robots Directives",
      description: "Conflicts exist between different robot meta rules and X-Robots headers. Standardize crawl and index rules.",
      impactScore: 20
    },
    ERR_CWV_INSUFFICIENT_EVIDENCE: {
      title: "Gather Performance Benchmarks",
      description: "No performance signals are measured on this page. Trigger a live crawl or load tests to capture speed metrics.",
      impactScore: 5
    },
    ERR_CWV_SLOW_RESPONSE: {
      title: "Optimize Time to First Byte (TTFB)",
      description: "Initial server response latency is high. Enable page caching, optimize backend queries, and review server infrastructure.",
      impactScore: 18
    },
    ERR_CWV_LARGE_PAGE: {
      title: "Reduce Page Payload and Code Bloat",
      description: "The overall response size exceeds recommended limits. Minify source HTML/CSS/JS files and optimize heavy image media.",
      impactScore: 10
    }
  };

  const map = isRtl ? faMap : enMap;
  return map[code] || {
    title: isRtl ? "بهینه‌سازی سئوی تکنیکال" : "Optimize Technical SEO Component",
    description: finding.explanation,
    impactScore: finding.severity === "critical" ? 30 : finding.severity === "high" ? 20 : finding.severity === "medium" ? 10 : 5
  };
}

/**
 * 1. Structured Data Analyzer
 */
export function analyzeStructuredData(signals: SeoSignals): AnalyzerFinding[] {
  const findings: AnalyzerFinding[] = [];
  const affectedResource = signals.page.normalizedUrl;

  const sd = signals.structuredData;
  if (!sd) return findings;

  // Rule: Missing Structured Data completely
  if (!sd.hasJsonLd && (!sd.microdata || sd.microdata.length === 0)) {
    findings.push({
      code: "ERR_STRUCT_SCHEMA_MISSING",
      category: "entity",
      title: "فقدان داده‌های ساختاریافته معنایی",
      explanation: "هیچ‌گونه کدهای ساختاریافته معتبر (میکرودیتا یا JSON-LD) روی صفحه پیدا نشد. این مسئله فهم معنایی محتوا را برای موتورهای جستجو و الگوهای زبانی دشوار می‌کند.",
      severity: "medium",
      confidence: "high",
      affectedResource,
      evidence: { hasJsonLd: false, microdataCount: 0 }
    });
    return findings;
  }

  // Rule: Malformed Structured Data
  if (sd.blocks) {
    const malformed = sd.blocks.filter(b => !b.isParsed);
    if (malformed.length > 0) {
      findings.push({
        code: "ERR_STRUCT_JSONLD_MALFORMED",
        category: "technical",
        title: "کد JSON-LD دارای ساختار خراب یا نامعتبر",
        explanation: `تعداد ${malformed.length} بلوک کد ساختاریافته دارای خطای نحو (syntax error) است و قابل پارس نیست.`,
        severity: "high",
        confidence: "high",
        affectedResource,
        evidence: { malformedBlocks: malformed.map(m => m.parseError) }
      });
    }
  }

  // Rule: Missing Required Properties for common types
  if (sd.blocks) {
    sd.blocks.forEach((block, idx) => {
      if (!block.isParsed || !block.type || !block.payload) return;
      const type = block.type.toLowerCase();
      const payload = block.payload as Record<string, unknown>;

      const missing: string[] = [];
      if (type === "article" || type === "newsarticle" || type === "blogposting") {
        ["headline", "author", "publisher", "datePublished"].forEach(p => {
          if (!payload[p]) missing.push(p);
        });
      } else if (type === "product") {
        ["name", "offers", "review", "aggregateRating"].forEach(p => {
          if (!payload[p]) missing.push(p);
        });
      } else if (type === "localbusiness" || type === "organization") {
        ["name", "logo", "address"].forEach(p => {
          if (!payload[p]) missing.push(p);
        });
      }

      if (missing.length > 0) {
        findings.push({
          code: "ERR_STRUCT_REQUIRED_PROPERTY_MISSING",
          category: "entity",
          title: `سیگنال اسکیما (${block.type}) فاقد ویژگی‌های الزامی`,
          explanation: `داده ساختاریافته نوع ${block.type} فاقد فیلدهای کلیدی روبرو است: [${missing.join(", ")}]. این مسئله از شناسایی کامل موجودیت‌ها ممانعت می‌کند.`,
          severity: "medium",
          confidence: "high",
          affectedResource,
          evidence: { blockType: block.type, blockIndex: idx, missingProperties: missing }
        });
      }
    });
  }

  // Rule: Duplicate Same-Type Blocks
  if (sd.schemaTypes && sd.schemaTypes.length > 0) {
    const occurrences: Record<string, number> = {};
    if (sd.blocks) {
      sd.blocks.forEach(b => {
        if (b.type) {
          occurrences[b.type] = (occurrences[b.type] || 0) + 1;
        }
      });
    }
    const duplicates = Object.entries(occurrences).filter(([_, count]) => count > 1);
    if (duplicates.length > 0) {
      findings.push({
        code: "ERR_STRUCT_DUPLICATE_BLOCK",
        category: "technical",
        title: "بلوک‌های اسکیمای تکراری متناقض روی صفحه",
        explanation: `چندین بلوک داده ساختاریافته مجزا برای نوع اسکیمای ${duplicates.map(([t]) => t).join(", ")} روی صفحه یافت شد که می‌تواند سیگنال متناقض ایجاد کند.`,
        severity: "low",
        confidence: "high",
        affectedResource,
        evidence: { duplicateTypes: duplicates }
      });
    }
  }

  return findings;
}

/**
 * 2. Crawlability Analyzer
 */
export function analyzeCrawlability(signals: SeoSignals): AnalyzerFinding[] {
  const findings: AnalyzerFinding[] = [];
  const affectedResource = signals.page.normalizedUrl;

  // Rule: Blocked / Error HTTP response
  if (signals.http && !signals.http.isSuccess) {
    findings.push({
      code: "ERR_CRAWL_HTTP_ERROR",
      category: "technical",
      title: "خطای پاسخ کلاینت یا سرور (HTTP Client/Server Error)",
      explanation: `این صفحه کد پاسخ ${signals.http.statusCode} را بازگرداند که نشان‌دهنده بن‌بست دسترسی یا خرابی زیرساخت است.`,
      severity: signals.http.isServerError ? "critical" : "high",
      confidence: "high",
      affectedResource,
      evidence: { statusCode: signals.http.statusCode, isServerError: signals.http.isServerError }
    });
  }

  // Rule: Redirect loop or excessive redirects
  if (signals.redirects && (signals.redirects.isLoop || signals.redirects.excessiveCount)) {
    findings.push({
      code: "ERR_CRAWL_REDIRECT_ISSUE",
      category: "technical",
      title: "اختلال ریدایرکت (حلقه یا زنجیره طولانی ریدایرکت)",
      explanation: signals.redirects.isLoop
        ? "یک حلقه ریدایرکت بی‌انتها شناسایی شد که مانع از به نتیجه رسیدن خزیدن توسط کراولرها می‌گردد."
        : `زنجیره ریدایرکت نامناسب به طول ${signals.redirects.redirectCount} جهش، بودجه خزش را فرسوده می‌کند.`,
      severity: "high",
      confidence: "high",
      affectedResource,
      evidence: {
        isLoop: signals.redirects.isLoop,
        redirectCount: signals.redirects.redirectCount,
        redirectChain: signals.redirects.redirectChain
      }
    });
  }

  return findings;
}

/**
 * 3. Indexability Analyzer
 */
export function analyzeIndexability(signals: SeoSignals): AnalyzerFinding[] {
  const findings: AnalyzerFinding[] = [];
  const affectedResource = signals.page.normalizedUrl;

  const indexability = signals.indexability;
  if (!indexability) return findings;

  // Rule: Explicit Noindex tag
  if (indexability.status === "noindex" || indexability.evidence.hasNoIndexDirective) {
    findings.push({
      code: "ERR_INDEX_NOINDEX",
      category: "seo",
      title: "وجود تگ مسدودساز نوایندکس (noindex)",
      explanation: "این صفحه دارای دستور صریح noindex در بدنه هدر یا متادیتا است که از حضور آن در نتایج جستجو و پایگاه‌های دانش هوش مصنوعی به طور کامل ممانعت می‌کند.",
      severity: "high",
      confidence: "high",
      affectedResource,
      evidence: { directives: signals.robots?.directives || [] }
    });
  }

  // Rule: Blocked by robots.txt
  if (indexability.status === "blocked_by_robots" || !indexability.evidence.robotsIndexAllowed) {
    findings.push({
      code: "ERR_INDEX_BLOCKED_BY_ROBOTS",
      category: "seo",
      title: "مسدودسازی ایندکس توسط فایل robots.txt",
      explanation: "فایل قوانین robots.txt دسترسی خزنده به این بخش از سایت را مسدود نموده است.",
      severity: "critical",
      confidence: "high",
      affectedResource,
      evidence: { metaDirectives: signals.robots?.metaDirectives || [], headerDirectives: signals.robots?.headerDirectives || [] }
    });
  }

  // Rule: Canonical Mismatch
  if (indexability.status === "canonical_mismatch" || (signals.canonical?.present && !signals.canonical?.matchesPageUrl)) {
    findings.push({
      code: "ERR_INDEX_CANONICAL_MISMATCH",
      category: "seo",
      title: "سیگنال کانونیکال متناقض با آدرس جاری",
      explanation: `این صفحه کانونیکال خود را روی آدرس دیگری (${signals.canonical?.url}) تنظیم کرده است. این بدین معنی است که وزن ایندکس به آدرس مقصد منتقل می‌گردد.`,
      severity: "medium",
      confidence: "high",
      affectedResource,
      evidence: { canonicalUrl: signals.canonical?.url, matchesPageUrl: false }
    });
  }

  // Rule: Conflicting signals (e.g. self-canonical and noindex present simultaneously)
  if (signals.canonical?.present && signals.canonical?.matchesPageUrl && indexability.evidence.hasNoIndexDirective) {
    findings.push({
      code: "ERR_INDEX_CONFLICTING_SIGNALS",
      category: "seo",
      title: "تعارض شدید در تگ‌های کانونیکال و نوایندکس",
      explanation: "صفحه همزمان دارای تگ کانونیکال خود-ارجاع و دستور نوایندکس است. این دو سیگنال متضاد موجب سردرگمی و کج‌فهمی خزنده‌ها در تشخیص اصالت صفحه می‌شود.",
      severity: "high",
      confidence: "high",
      affectedResource,
      evidence: { matchesPageUrl: true, hasNoIndex: true }
    });
  }

  return findings;
}

/**
 * 4. Internal Linking Analyzer
 */
export function analyzeInternalLinking(signals: SeoSignals, allSignalsInCrawl?: SeoSignals[]): AnalyzerFinding[] {
  const findings: AnalyzerFinding[] = [];
  const affectedResource = signals.page.normalizedUrl;

  const links = signals.internalLinks;
  if (!links) return findings;

  // Rule: Orphan Page candidate
  if (links.internalCount === 0) {
    findings.push({
      code: "ERR_LINK_ORPHAN_PAGE",
      category: "seo",
      title: "صفحه فاقد لینک‌دهی داخلی خروجی (یا یتیم)",
      explanation: "این صفحه هیچ‌گونه لینک خروجی داخلی به صفحات دیگر سایت ندارد. این مسئله خزش ساختاریافته‌ی سایت را مختل می‌سازد.",
      severity: "medium",
      confidence: "high",
      affectedResource,
      evidence: { internalCount: 0 }
    });
  }

  // Rule: Empty Anchor Texts
  if (links.links && links.links.length > 0) {
    const emptyAnchors = links.links.filter(l => !l.isExternal && !l.isFragmentOnly && !l.anchorText.trim());
    if (emptyAnchors.length > 0) {
      findings.push({
        code: "ERR_LINK_EMPTY_ANCHOR",
        category: "seo",
        title: "لینک‌های داخلی فاقد متن لنگر (Anchor Text)",
        explanation: `تعداد ${emptyAnchors.length} لینک داخلی در این صفحه یافت شد که فاقد متن لنگر توصیفی هستند. این مسئله انتقال وزن معنایی صفحه را ضعیف می‌کند.`,
        severity: "low",
        confidence: "high",
        affectedResource,
        evidence: { count: emptyAnchors.length, targets: emptyAnchors.slice(0, 5).map(e => e.normalizedTargetUrl) }
      });
    }
  }

  // Rule: Broken Internal Link targets within crawl scope
  if (allSignalsInCrawl && links.links && links.links.length > 0) {
    const brokenLinks: Array<{ source: string; target: string; code: number }> = [];
    links.links.forEach(link => {
      if (link.isExternal || link.isFragmentOnly) return;
      const targetPage = allSignalsInCrawl.find(s => s.page.normalizedUrl === link.normalizedTargetUrl);
      if (targetPage && targetPage.http && !targetPage.http.isSuccess) {
        brokenLinks.push({
          source: affectedResource,
          target: link.normalizedTargetUrl,
          code: targetPage.http.statusCode
        });
      }
    });

    if (brokenLinks.length > 0) {
      findings.push({
        code: "ERR_LINK_BROKEN_TARGET",
        category: "seo",
        title: "ارجاع به لینک‌های داخلی شکسته (خراب)",
        explanation: `این صفحه به آدرس‌هایی لینک داده است که در طول کراول با خطای شبکه مواجه شدند. (مانند ${brokenLinks.map(b => `${b.target} [${b.code}]`).join(", ")})`,
        severity: "high",
        confidence: "high",
        affectedResource,
        evidence: { brokenCount: brokenLinks.length, brokenLinks }
      });
    }
  }

  return findings;
}

/**
 * 5. Sitemap Analyzer
 */
export function analyzeSitemap(signals: SeoSignals, allSignalsInCrawl?: SeoSignals[]): AnalyzerFinding[] {
  const findings: AnalyzerFinding[] = [];
  const affectedResource = signals.page.normalizedUrl;

  const sitemap = signals.sitemap;
  if (!sitemap) return findings;

  // Rule: Missing Sitemap XML
  if (!sitemap.discovered) {
    findings.push({
      code: "ERR_SITEMAP_MISSING",
      category: "technical",
      title: "فقدان یا عدم اعلام فایل نقشه سایت (Sitemap.xml)",
      explanation: "فایل نقشه سایت sitemap.xml یافت نشد یا در محل استاندارد آدرس‌دهی نشده است. این موضوع مانع کشف سریع آدرس‌های کانونیکال توسط موتورهای جستجو و کراولرهای GEO می‌گردد.",
      severity: "medium",
      confidence: "high",
      affectedResource,
      evidence: { sitemapUrl: sitemap.url }
    });
    return findings;
  }

  // Rule: Sitemap fetch/parsing errors
  if (!sitemap.parsedSuccessfully) {
    findings.push({
      code: "ERR_SITEMAP_FETCH_ERROR",
      category: "technical",
      title: "بروز خطا در بازیابی یا پارس فایل نقشه سایت",
      explanation: `آدرس نقشه سایت وجود دارد ولی بازیابی یا پردازش آن با خطا روبرو شد: ${sitemap.parseError}`,
      severity: "high",
      confidence: "high",
      affectedResource,
      evidence: { status: sitemap.status, parseError: sitemap.parseError }
    });
    return findings;
  }

  // Rule: Duplicate entries in sitemap
  if (sitemap.entries && sitemap.entries.length > 0) {
    const duplicates = sitemap.entries.filter((item, index) => sitemap.entries.indexOf(item) !== index);
    if (duplicates.length > 0) {
      findings.push({
        code: "ERR_SITEMAP_DUPLICATE_URLS",
        category: "technical",
        title: "وجود آدرس‌های تکراری در نقشه سایت",
        explanation: `تعداد ${duplicates.length} آدرس تکراری در فایل sitemap.xml وجود دارد که مایه هدررفت ظرفیت پردازش کراولر می‌گردد.`,
        severity: "low",
        confidence: "high",
        affectedResource,
        evidence: { duplicateCount: duplicates.length, duplicates: Array.from(new Set(duplicates)).slice(0, 5) }
      });
    }
  }

  // Cross-page validation rules if all signals crawl are supplied
  if (allSignalsInCrawl && sitemap.entries && sitemap.entries.length > 0) {
    const errorUrls: Array<{ url: string; status: number }> = [];
    const canonicalMismatches: Array<{ url: string; canonical: string }> = [];

    sitemap.entries.forEach(entryUrl => {
      const pageSignal = allSignalsInCrawl.find(s => s.page.normalizedUrl === entryUrl || s.page.url === entryUrl);
      if (pageSignal) {
        if (pageSignal.http && !pageSignal.http.isSuccess) {
          errorUrls.push({ url: entryUrl, status: pageSignal.http.statusCode });
        }
        if (pageSignal.canonical?.present && pageSignal.canonical?.url && pageSignal.canonical?.url !== entryUrl) {
          canonicalMismatches.push({ url: entryUrl, canonical: pageSignal.canonical.url });
        }
      }
    });

    if (errorUrls.length > 0) {
      findings.push({
        code: "ERR_SITEMAP_URL_ERROR",
        category: "technical",
        title: "وجود آدرس‌های خراب در فایل نقشه سایت",
        explanation: `نقشه سایت حاوی آدرس‌های خرابی است که پاسخ غیر ۲۰۰ بازمی‌گردانند. تعداد آدرس‌های خراب شناسایی شده: ${errorUrls.length}.`,
        severity: "high",
        confidence: "high",
        affectedResource,
        evidence: { count: errorUrls.length, errorUrls: errorUrls.slice(0, 5) }
      });
    }

    if (canonicalMismatches.length > 0) {
      findings.push({
        code: "ERR_SITEMAP_CANONICAL_MISMATCH",
        category: "technical",
        title: "عدم تطابق آدرس کانونیکال با آدرس نقشه سایت",
        explanation: "نقشه سایت حاوی آدرس‌های غیرکانونیکال است. تمام آدرس‌های اعلامی در sitemap.xml باید آدرس‌های کانونیکال خود-ارجاعی باشند.",
        severity: "medium",
        confidence: "high",
        affectedResource,
        evidence: { mismatchCount: canonicalMismatches.length, canonicalMismatches: canonicalMismatches.slice(0, 5) }
      });
    }
  }

  return findings;
}

/**
 * 6. Canonical Analyzer
 */
export function analyzeCanonical(signals: SeoSignals, allSignalsInCrawl?: SeoSignals[]): AnalyzerFinding[] {
  const findings: AnalyzerFinding[] = [];
  const affectedResource = signals.page.normalizedUrl;

  const canon = signals.canonical;
  if (!canon) return findings;

  // Rule: Missing Canonical Tag
  if (!canon.present) {
    findings.push({
      code: "ERR_CANONICAL_MISSING",
      category: "seo",
      title: "فقدان تگ کانونیکال اصلی (Canonical Tag)",
      explanation: "این صفحه فاقد تگ معرفی آدرس اصلی کانونیکال است. فقدان این تگ ریسک ایندکس شدن آدرس‌های تکراری و جریمه خزش تکراری را دارد.",
      severity: "medium",
      confidence: "high",
      affectedResource,
      evidence: { present: false }
    });
    return findings;
  }

  // Rule: Invalid Canonical URL format
  if (!canon.isValid) {
    findings.push({
      code: "ERR_CANONICAL_INVALID",
      category: "technical",
      title: "فرمت آدرس کانونیکال نامعتبر است",
      explanation: `آدرس کانونیکال ارائه‌شده (${canon.url}) آدرس مطلق استاندارد و معتبری نیست.`,
      severity: "high",
      confidence: "high",
      affectedResource,
      evidence: { rawUrl: canon.url, isValid: false }
    });
  }

  // Rule: Multiple Canonical Tags
  if (canon.multiple) {
    findings.push({
      code: "ERR_CANONICAL_MULTIPLE",
      category: "technical",
      title: "وجود چند تگ کانونیکال متناقض روی صفحه",
      explanation: `تعداد ${canon.occurrences.length} تگ کانونیکال همزمان روی صفحه یافت شد. این موضوع تصمیم‌گیری برای کراولرها را ناممکن می‌سازد.`,
      severity: "high",
      confidence: "high",
      affectedResource,
      evidence: { occurrences: canon.occurrences }
    });
  }

  // Rules referencing crawled targets
  if (allSignalsInCrawl && canon.url && canon.isValid) {
    const targetNormalized = canon.normalizedUrl;
    const targetPage = allSignalsInCrawl.find(s => s.page.normalizedUrl === targetNormalized);

    if (targetPage) {
      // Canonical points to Error URL
      if (targetPage.http && !targetPage.http.isSuccess) {
        findings.push({
          code: "ERR_CANONICAL_TO_ERROR",
          category: "technical",
          title: "آدرس کانونیکال به صفحه خراب ارجاع می‌دهد",
          explanation: `تگ کانونیکال به آدرسی اشاره می‌کند که وضعیت غیر موفقیت‌آمیز ${targetPage.http.statusCode} بازمی‌گرداند.`,
          severity: "high",
          confidence: "high",
          affectedResource,
          evidence: { targetUrl: canon.url, targetStatusCode: targetPage.http.statusCode }
        });
      }

      // Canonical chain detection
      if (targetPage.canonical?.present && targetPage.canonical?.normalizedUrl && targetPage.canonical.normalizedUrl !== targetNormalized) {
        findings.push({
          code: "ERR_CANONICAL_CHAIN",
          category: "seo",
          title: "تشکیل زنجیره ریدایرکت کانونیکال (Canonical Chain)",
          explanation: `صفحه جاری به آدرس ${canon.url} کانونیکال شده است، در حالی که آن صفحه خود به آدرس دیگری (${targetPage.canonical.url}) کانونیکال دارد.`,
          severity: "medium",
          confidence: "high",
          affectedResource,
          evidence: { firstHop: canon.url, secondHop: targetPage.canonical.url }
        });
      }
    }
  }

  return findings;
}

/**
 * 7. Robots Analyzer
 */
export function analyzeRobots(signals: SeoSignals): AnalyzerFinding[] {
  const findings: AnalyzerFinding[] = [];
  const affectedResource = signals.page.normalizedUrl;

  const robots = signals.robots;
  if (!robots) return findings;

  // Rule: Conflict between robots directives
  const hasIndex = robots.directives.includes("index");
  const hasNoindex = robots.directives.includes("noindex");
  if (hasIndex && hasNoindex) {
    findings.push({
      code: "ERR_ROBOTS_DIRECTIVES_CONFLICT",
      category: "seo",
      title: "تضاد در دستورات فایل‌های ربات (Robots Directives Conflict)",
      explanation: "هر دو دستور متضاد index و noindex همزمان روی کدهای این صفحه شناسایی شدند که مانع پردازش شفاف خزنده می‌گردد.",
      severity: "high",
      confidence: "high",
      affectedResource,
      evidence: { directives: robots.directives }
    });
  }

  return findings;
}

/**
 * 8. Core Web Vitals Analyzer (CWV)
 */
export function analyzeCoreWebVitals(signals: SeoSignals): AnalyzerFinding[] {
  const findings: AnalyzerFinding[] = [];
  const affectedResource = signals.page.normalizedUrl;

  const perf = signals.performance;
  if (!perf || !perf.isMeasured) {
    findings.push({
      code: "ERR_CWV_INSUFFICIENT_EVIDENCE",
      category: "technical",
      title: "شواهد ناکافی برای سنجش سرعت صفحه",
      explanation: "هیچ‌گونه اطلاعات عملکردی یا سیگنال‌های پاسخ‌دهی سرور برای این آدرس ثبت نشده است. بنابراین ارزیابی سرعت صفحه غیرممکن است.",
      severity: "low",
      confidence: "low",
      affectedResource,
      evidence: { isMeasured: false }
    });
    return findings;
  }

  // Rule: Slow initial server response time
  if (perf.responseTimeMs !== null) {
    if (perf.responseTimeMs > 2000) {
      findings.push({
        code: "ERR_CWV_SLOW_RESPONSE",
        category: "technical",
        title: "سرعت پاسخ‌دهی اولیه بسیار کند سرور (TTFB)",
        explanation: `زمان پاسخ‌دهی اولیه سرور به مقدار ${perf.responseTimeMs} میلی‌ثانیه اندازه‌گیری شد که از حد استاندارد بسیار طولانی‌تر است. این موضوع به خزش سریع آسیب می‌زند.`,
        severity: "high",
        confidence: "high",
        affectedResource,
        evidence: { responseTimeMs: perf.responseTimeMs }
      });
    } else if (perf.responseTimeMs > 800) {
      findings.push({
        code: "ERR_CWV_SLOW_RESPONSE",
        category: "technical",
        title: "پاسخ‌دهی نسبتاً کند سرور وب",
        explanation: `زمان پاسخ‌دهی اولیه سرور معادل ${perf.responseTimeMs} میلی‌ثانیه است که نیاز به بهبود دارد.`,
        severity: "medium",
        confidence: "high",
        affectedResource,
        evidence: { responseTimeMs: perf.responseTimeMs }
      });
    }
  }

  // Rule: Extremely heavy html payload
  if (perf.responseSize > 1500000) { // 1.5MB threshold
    findings.push({
      code: "ERR_CWV_LARGE_PAGE",
      category: "technical",
      title: "حجم بسیار بالای کدهای صفحه وب",
      explanation: `اندازه بدنه صفحه معادل ${(perf.responseSize / 1024 / 1024).toFixed(2)} مگابایت است. حجم بالای صفحه بودجه خزش و سرعت پردازش الگوهای معنایی را با کندی روبرو می‌سازد.`,
      severity: "low",
      confidence: "high",
      affectedResource,
      evidence: { responseSize: perf.responseSize }
    });
  }

  return findings;
}

/**
 * Cohesive aggregation service running all 8 individual analyzers.
 * Securely respects cross-tenant boundaries.
 */
export class TechnicalSeoAnalyzerService {
  /**
   * Run the full battery of deterministic technical SEO analyzers over the provided target page signals.
   * Securely maps individual outcomes directly to DiagnosticFinding-compatible structures.
   */
  public async executeTechnicalAudit(
    organizationId: string,
    websiteId: string,
    signals: SeoSignals,
    allSignalsInCrawl?: SeoSignals[]
  ): Promise<{ findings: DiagnosticFinding[] }> {
    // 1. Service boundary multi-tenant context verification
    const activeTenantId = TenantContextManager.getContext()?.tenantId;

    if (activeTenantId && activeTenantId !== organizationId) {
      throw new Error(`Security Violation: Cross-tenant operation blocked at Service Boundary. Target organization ${organizationId} does not match active context ${activeTenantId}.`);
    }

    const timestamp = new Date().toISOString();
    const createAudit = (version = 1): AuditMetadata => ({
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: "technical-seo-analyzer",
      updatedBy: "technical-seo-analyzer",
      version
    });

    const analyzerFindings: AnalyzerFinding[] = [
      ...analyzeStructuredData(signals),
      ...analyzeCrawlability(signals),
      ...analyzeIndexability(signals),
      ...analyzeInternalLinking(signals, allSignalsInCrawl),
      ...analyzeSitemap(signals, allSignalsInCrawl),
      ...analyzeCanonical(signals, allSignalsInCrawl),
      ...analyzeRobots(signals),
      ...analyzeCoreWebVitals(signals)
    ];

    // Convert AnalyzerFinding elements to DiagnosticFinding elements conforming with our strict enterprise schema.
    const findings: DiagnosticFinding[] = analyzerFindings.map((af, idx) => ({
      id: `df-p9-tech-${af.code.toLowerCase()}-${signals.page.url.replace(/[^a-zA-Z0-9]/g, "")}`,
      organizationId,
      websiteId,
      category: af.category,
      code: af.code,
      title: af.title,
      explanation: af.explanation,
      severity: af.severity,
      confidence: af.confidence,
      status: "active",
      affectedResource: af.affectedResource,
      evidence: af.evidence,
      audit: createAudit()
    }));

    return { findings };
  }
}
