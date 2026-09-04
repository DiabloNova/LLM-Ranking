import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { firecrawlApp } from "@/lib/firecrawl";

// Request validator schema
const requestSchema = z.object({
  url: z.string().url("لطفاً یک آدرس وب‌سایت معتبر وارد کنید (مثال: https://example.com)"),
});

// Response Interface for TypeScript absolute typing
export interface FreeAuditResponse {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  checks: {
    hasTitle: boolean;
    titleLength: "good" | "too_short" | "too_long" | "missing";
    hasMetaDescription: boolean;
    metaDescriptionLength: "good" | "too_short" | "too_long" | "missing";
    hasH1: boolean;
    isHttps: boolean;
    hasLanguage: boolean;
    isIndexable: boolean;
  };
  quickTips: Array<{
    issue: string;
    recommendation: string;
  }>;
  premiumUpsell: {
    locked: boolean;
    message: string;
    features: string[];
  };
}

export async function POST(req: NextRequest) {
  try {
    // 1. Parse and Validate Request Body
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

    const apiKey = process.env.FIRECRAWL_API_KEY || "";
    const isMockMode = !apiKey || apiKey === "" || apiKey.includes("your-api-key") || apiKey.startsWith("fc-your-");

    // 2. Perform Firecrawl scrape (or use rich offline mock fallback)
    let scrapeResult;

    if (isMockMode) {
      console.log(`[Free SEO Audit API] Firecrawl API key is missing or placeholder. Running in rich offline simulation mode for URL: ${url}`);
      // Simulate dynamic realistic crawl output based on the URL supplied
      const lowercaseUrl = url.toLowerCase();

      if (lowercaseUrl.includes("poor") || lowercaseUrl.startsWith("http://")) {
        scrapeResult = {
          success: true,
          markdown: "No header content at all.",
          metadata: {
            title: "",
            description: "",
            language: "",
            robots: "noindex, nofollow",
          }
        };
      } else {
        scrapeResult = {
          success: true,
          markdown: "# Welcome to Optimus AI\nThis is a beautiful page content and we optimize technical SEO structure.",
          metadata: {
            title: "تحلیل پیشرفته سئو معنایی و هوشمندسازی کسب‌وکار آنلاین", // 53 chars
            description: "تحلیل جامع ساختار سئو معنایی، پایش سلامت احساسات برند، استخراج تخصصی گراف دانش و بررسی بهینه‌سازی موتورهای پاسخ‌دهی هوشمند به زبان فارسی انجام می‌گردد.", // 152 chars
            language: "fa",
            robots: "index, follow",
          }
        };
      }
    } else {
      try {
        scrapeResult = await firecrawlApp.scrapeUrl(url, {
          formats: ["markdown"],
        });
      } catch (scrapeErr: unknown) {
        console.error("[Firecrawl Scrape Error]:", scrapeErr);
        return NextResponse.json(
          {
            error: "Scrape Failed",
            message: "امکان دسترسی به این وب‌سایت وجود ندارد. لطفاً آدرس را بررسی کنید و مجدداً تلاش فرمایید.",
          },
          { status: 500 }
        );
      }
    }

    if (!scrapeResult || ('success' in scrapeResult && !scrapeResult.success)) {
      return NextResponse.json(
        {
          error: "Scrape Unsuccessful",
          message: "خزش آدرس مورد نظر با شکست مواجه شد. لطفاً از صحت آدرس و عمومی بودن آن اطمینان حاصل کنید.",
        },
        { status: 400 }
      );
    }

    const metadata = scrapeResult.metadata || {};
    const markdown = scrapeResult.markdown || "";

    // 3. Heuristic checks and scoring
    let score = 0;

    // Title Check (20 Points)
    const title = metadata.title || "";
    const hasTitle = typeof title === "string" && title.trim().length > 0;
    let titleLength: "good" | "too_short" | "too_long" | "missing" = "missing";

    if (hasTitle) {
      const len = title.trim().length;
      if (len >= 50 && len <= 60) {
        titleLength = "good";
        score += 20;
      } else if (len < 50) {
        titleLength = "too_short";
        score += 10; // partial credit
      } else {
        titleLength = "too_long";
        score += 10; // partial credit
      }
    }

    // Description Check (20 Points)
    const desc = metadata.description || "";
    const hasMetaDescription = typeof desc === "string" && desc.trim().length > 0;
    let metaDescriptionLength: "good" | "too_short" | "too_long" | "missing" = "missing";

    if (hasMetaDescription) {
      const len = desc.trim().length;
      if (len >= 150 && len <= 160) {
        metaDescriptionLength = "good";
        score += 20;
      } else if (len < 150) {
        metaDescriptionLength = "too_short";
        score += 10; // partial credit
      } else {
        metaDescriptionLength = "too_long";
        score += 10; // partial credit
      }
    }

    // H1 Check (15 Points)
    // Matches markdown lines starting with '#' followed by one or more spaces and characters
    const h1Regex = /^#\s+.+$/m;
    const hasH1 = h1Regex.test(markdown);
    if (hasH1) {
      score += 15;
    }

    // HTTPS Check (10 Points)
    const isHttps = url.toLowerCase().startsWith("https://");
    if (isHttps) {
      score += 10;
    }

    // Language Check (10 Points)
    const lang = metadata.language || "";
    const hasLanguage = typeof lang === "string" && lang.trim().length > 0;
    if (hasLanguage) {
      score += 10;
    }

    // Robots Check (25 Points)
    const robots = (metadata.robots || "").toLowerCase();
    const isIndexable = !robots.includes("noindex") && !robots.includes("nofollow");
    if (isIndexable) {
      score += 25;
    }

    // 4. Assign Grade based on score
    let grade: "A" | "B" | "C" | "D" | "F" = "F";
    if (score >= 90) grade = "A";
    else if (score >= 75) grade = "B";
    else if (score >= 60) grade = "C";
    else if (score >= 45) grade = "D";

    // 5. Build Quick Tips in Persian based on failed checks
    const quickTips: Array<{ issue: string; recommendation: string }> = [];

    if (!hasTitle) {
      quickTips.push({
        issue: "تگ عنوان (Title) یافت نشد.",
        recommendation: "یک تگ عنوان جذاب و توصیفی بین ۵۰ تا ۶۰ کاراکتر برای وب‌سایت خود ایجاد کنید.",
      });
    } else if (titleLength === "too_short") {
      quickTips.push({
        issue: "تگ عنوان (Title) بسیار کوتاه است.",
        recommendation: "طول عنوان فعلی کمتر از ۵۰ کاراکتر است. کلمات کلیدی اصلی برند خود را اضافه کنید تا طول آن به ۵۰ الی ۶۰ کاراکتر برسد.",
      });
    } else if (titleLength === "too_long") {
      quickTips.push({
        issue: "تگ عنوان (Title) بسیار طولانی است.",
        recommendation: "طول عنوان فعلی بیش از ۶۰ کاراکتر است. عنوان را خلاصه کنید تا در صفحات نتایج موتورهای جستجو قطع نشود.",
      });
    }

    if (!hasMetaDescription) {
      quickTips.push({
        issue: "تگ توضیحات متاداده (Meta Description) یافت نشد.",
        recommendation: "یک متادیسکریپشن جذاب بین ۱۵۰ تا ۱۶۰ کاراکتر شامل کلمات کلیدی اصلی وب‌سایت بنویسید.",
      });
    } else if (metaDescriptionLength === "too_short") {
      quickTips.push({
        issue: "تگ توضیحات (Meta Description) بسیار کوتاه است.",
        recommendation: "توضیحات متاداده فعلی کمتر از ۱۵۰ کاراکتر است. اطلاعات بیشتری پیرامون مزیت‌های رقابتی خود اضافه کنید تا بهینه شود.",
      });
    } else if (metaDescriptionLength === "too_long") {
      quickTips.push({
        issue: "تگ توضیحات (Meta Description) بسیار طولانی است.",
        recommendation: "توضیحات فعلی بیش از ۱۶۰ کاراکتر است. بخش‌های اضافی را حذف کنید تا توضیحات به صورت کامل در نتایج جستجو نمایش داده شوند.",
      });
    }

    if (!hasH1) {
      quickTips.push({
        issue: "تگ سربرگ اصلی (H1) در صفحه وجود ندارد.",
        recommendation: "مطمئن شوید که صفحه شما دقیقاً یک تگ سربرگ سطح اول (H1) دارد که موضوع اصلی صفحه را توصیف می‌کند.",
      });
    }

    if (!isHttps) {
      quickTips.push({
        issue: "وب‌سایت شما از پروتکل امن HTTPS استفاده نمی‌کند.",
        recommendation: "امنیت کاربران و اعتبار موتورهای پاسخ‌گو نیازمند فعال‌سازی گواهی SSL و هدایت خودکار تمام درخواست‌ها به HTTPS است.",
      });
    }

    if (!hasLanguage) {
      quickTips.push({
        issue: "زبان وب‌سایت در ویژگی lang تگ html تعریف نشده است.",
        recommendation: "ویژگی lang (به عنوان مثال lang=\"fa\" برای زبان فارسی) را به تگ <html> صفحه خود اضافه کنید تا موتورها زبان شما را تشخیص دهند.",
      });
    }

    if (!isIndexable) {
      quickTips.push({
        issue: "دستورات فایل Robots یا متاتگ ربات‌ها مانع از ایندکس شدن صفحه می‌شود.",
        recommendation: "دستورالعمل‌های noindex یا nofollow را از متاتگ‌ها یا فایل robots.txt حذف کنید تا خزنده‌ها امکان اسکن ساختار معنایی را داشته باشند.",
      });
    }

    // If score is 100 or perfectly optimized (empty or 0/1 tips), provide general "Pro Tips" so the list is always premium and rich
    if (quickTips.length === 0) {
      quickTips.push({
        issue: "شاخص‌های اولیه سئو فنی سایت شما عالی است!",
        recommendation: "برای گام بعدی، ساختار معنایی پیشرفته و ارتباط میان موجودیت‌ها (Entity Graph) را به کمک نسخه ویژه تحلیل کنید.",
      });
      quickTips.push({
        issue: "آمادگی ساختاری برای بهینه‌سازی موتورهای پاسخ‌گو (AEO)",
        recommendation: "توصیه می‌شود داده‌های ساختاریافته (JSON-LD Schema) را در صفحات محصولات و مقالات فعال کنید تا موتورهای پاسخ‌گو بهتر شما را درک کنند.",
      });
    } else if (quickTips.length < 3) {
      // Pad to have at least 2 tips for premium UI density
      quickTips.push({
        issue: "بهینه‌سازی برای موتورهای پاسخ‌گو (AEO)",
        recommendation: "برای ارتقای رتبه در موتورهای مبتنی بر هوش مصنوعی نظیر Perplexity، سعی کنید پاسخ سوالات متداول حوزه خود را به صورت صریح و خلاصه در سایت قرار دهید.",
      });
    }

    const responsePayload: FreeAuditResponse = {
      score,
      grade,
      checks: {
        hasTitle,
        titleLength,
        hasMetaDescription,
        metaDescriptionLength,
        hasH1,
        isHttps,
        hasLanguage,
        isIndexable,
      },
      quickTips: quickTips.slice(0, 3), // return exactly 2-3 top tips
      premiumUpsell: {
        locked: true,
        message: "برای تحلیل عمیق معنایی، بررسی گراف دانش، تحلیل احساسات رقبا و پیشنهادات هوش مصنوعی، نسخه پریمیوم را فعال کنید.",
        features: [
          "تحلیل گراف دانش و روابط معنایی برند",
          "پیشنهادات کاملاً شخصی‌سازی شده مبتنی بر هوش مصنوعی",
          "تحلیل احساسات برند و سلامت نظرات در مدل‌های زبانی",
          "پایش سهم صدای رقبا در Perplexity و ChatGPT",
        ],
      },
    };

    return NextResponse.json(responsePayload);
  } catch (error: unknown) {
    console.error("[Free SEO Audit API Route Error]:", error);
    const message = error instanceof Error ? error.message : "خطای ناشناخته رخ داده است.";
    return NextResponse.json(
      { error: "Internal Server Error", message },
      { status: 500 }
    );
  }
}
