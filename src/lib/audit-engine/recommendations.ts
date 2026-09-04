import { ScoreStructure, CoreRecommendation, NormalizedIntelligenceFeatures, RawWebsiteSignals } from "@/types/audit";

/**
 * Translates negative scoring factors into structured action recommendations.
 */
export function generateRecommendations(
  scores: ScoreStructure,
  features: NormalizedIntelligenceFeatures,
  signals: RawWebsiteSignals
): CoreRecommendation[] {
  const recommendations: CoreRecommendation[] = [];

  // Filter out negative contributors
  const negativeContributors = scores.contributors.filter(c => !c.isPositive);

  negativeContributors.forEach((c, idx) => {
    let category: "technical" | "content" | "entity" | "structured_data" = "technical";
    let priority: "high" | "medium" | "low" = "medium";
    let recommendationText = "";
    let issueText = c.description;

    // Map Category & Priorities
    if (c.name.toLowerCase().includes("technical")) {
      category = "technical";
      priority = c.points >= 30 ? "high" : "medium";
      recommendationText = `فعال‌سازی و کانفیگ پروتکل امن و رفع خطاهای لود به منظور جلب اعتماد موتورهای پاسخ‌گو.`;
      if (issueText.includes("HTTPS")) {
        recommendationText = "نصب گواهی SSL و هدایت خودکار تمام ریدایرکت‌های HTTP به HTTPS برای تأمین امنیت تبادل داده.";
      } else if (issueText.includes("robots.txt")) {
        recommendationText = "ایجاد فایل استاندارد robots.txt در مسیر ریشه سایت و باز گذاشتن دسترسی خزنده‌های هوش مصنوعی نظیر GPTBot و PerplexityBot.";
      } else if (issueText.includes("Sitemap")) {
        recommendationText = "ساخت نقشه سایت XML و ثبت آدرس آن در پنل گوگل سرچ کنسول و فایل robots.txt جهت ایندکس شدن سریع ساختار معنایی.";
      } else if (issueText.includes("latency")) {
        recommendationText = "بهینه‌سازی زمان پاسخ سرور، استفاده از CDN معتبر و فشرده‌سازی منابع برای کاهش مدت زمان لود صفحه به زیر ۱ ثانیه.";
      }
    } else if (c.name.toLowerCase().includes("content")) {
      category = "content";
      priority = c.points >= 20 ? "high" : "medium";
      recommendationText = `غنی‌سازی محتوای متنی و رعایت ساختار تگ‌های هدینگ صفحات وبلاگ و لندینگ پیج.`;
      if (issueText.includes("Title")) {
        recommendationText = "ویرایش تگ عنوان صفحه اصلی به طول ۵۰ الی ۶۰ کاراکتر حاوی نام تجاری و کلمات کلیدی توصیفی.";
      } else if (issueText.includes("Description")) {
        recommendationText = "نگارش متادیسکریپشن جامع بین ۱۵۰ تا ۱۶۰ کاراکتر برای افزایش نرخ کلیک طبیعی در دستیارها.";
      } else if (issueText.includes("H1")) {
        recommendationText = "تکمیل تگ سربرگ اول (H1) منطبق با موضوعیت و گراف برند بر روی لندینگ پیج اصلی.";
      } else if (issueText.includes("word count")) {
        recommendationText = "توسعه محتوای متنی صفحه به بالای ۵۰۰ کلمه غنی و پاسخ به سوالات متداول کاربران به صورت صریح.";
      } else if (issueText.includes("ALT")) {
        recommendationText = "افزودن ویژگی توصیفی Alt به تمامی تصاویر موجود برای شناسایی بهتر موضوعات توسط خزنده‌های تصویری هوش مصنوعی.";
      }
    } else if (c.name.toLowerCase().includes("entities")) {
      category = "entity";
      priority = "medium";
      recommendationText = `بهینه‌سازی چگالی کلمات کلیدی و اتصال مفاهیم متن به موجودیت‌های شناخته‌شده.`;
      if (issueText.includes("brand entity")) {
        recommendationText = "درج صریح نام تجاری در پاراگراف‌های اول لندینگ پیج به همراه تعریف ارزش‌های کلیدی برند.";
      } else if (issueText.includes("diversity")) {
        recommendationText = "استفاده از اصطلاحات تخصصی، اسامی خاص حوزه فعالیت و واژگان کلیدی پرسرچ در متن.";
      } else if (issueText.includes("author")) {
        recommendationText = "تعریف پروفایل نویسنده، بیوگرافی تخصصی و لینک شبکه‌های اجتماعی برای افزایش اعتبار و فاکتور E-E-A-T سایت.";
      } else if (issueText.includes("date")) {
        recommendationText = "درج تاریخ انتشار و به‌روزرسانی محتواها جهت اثبات تازگی اطلاعات به الگوریتم‌های بازیابی اطلاعات.";
      }
    } else if (c.name.toLowerCase().includes("structureddata")) {
      category = "structured_data";
      priority = "high";
      recommendationText = `پیاده‌سازی متادیتاهای ساختاریافته در قالب اسکریپت‌های JSON-LD.`;
      if (issueText.includes("JSON-LD")) {
        recommendationText = "طراحی و افزودن کدهای استاندارد اسکیما نوع Organization و WebSite برای تسهیل درک ماهیت برند.";
      } else if (issueText.includes("schemas")) {
        recommendationText = "اضافه کردن کدهای نشانه گذاری ساختاریافته استاندارد نظیر Product ،FAQPage یا Article بر اساس نوع صفحه.";
      } else if (issueText.includes("Malformed")) {
        recommendationText = "بررسی کدهای اسکیما موجود با ابزارهای تست اسکیما و رفع ارورهای سینتکس و براکت‌های باز کدهای JSON.";
      }
    }

    recommendations.push({
      id: `rec-${category}-${idx + 1}`,
      category,
      priority,
      impactScore: Math.round(c.points * 1.5),
      issue: issueText,
      recommendation: recommendationText
    });
  });

  // If recommendations list is empty (fully optimized site), provide high-value strategic pro tips
  if (recommendations.length === 0) {
    recommendations.push({
      id: "rec-strategic-1",
      category: "entity",
      priority: "medium",
      impactScore: 20,
      issue: "سایت شما شاخص‌های سئو فنی و ساختاری اولیه را به طور کامل پاس کرده است.",
      recommendation: "پیوند دادن گراف دانش محلی به گراف‌های مرجع جهانی (نظیر ویکی‌دیتا) جهت استحکام برند در مدل‌های زبانی."
    });
    recommendations.push({
      id: "rec-strategic-2",
      category: "structured_data",
      priority: "high",
      impactScore: 35,
      issue: "افزایش آمادگی برای کدهای پاسخگو هوش مصنوعی (AEO).",
      recommendation: "پیاده‌سازی الگوهای پرسش و پاسخ صریح (FAQ Schema) در لندینگ پیج‌ها برای افزایش شانس دریافت citation در Perplexity."
    });
  }

  return recommendations;
}

/**
 * Derived, simulated AI Visibility calculation.
 * Explicitly described as simulated/derived, based deterministically on signals.
 */
export function simulateAiVisibility(features: NormalizedIntelligenceFeatures, signals: RawWebsiteSignals) {
  const schemaWeight = features.structuredDataSignals.score * 0.35;
  const entityWeight = features.entitySignals.score * 0.35;
  const contentWeight = features.contentQuality.score * 0.20;
  const techWeight = features.technicalHealth.score * 0.10;

  const estimatedVisibility = Math.round(schemaWeight + entityWeight + contentWeight + techWeight);

  const visibilityFactors: string[] = [];

  if (features.structuredDataSignals.score >= 80) {
    visibilityFactors.push("داده‌های ساختاریافته غنی به موتورهای بازیابی اطلاعات (RAG) کمک می‌کنند برند شما را به راحتی استخراج کنند.");
  } else {
    visibilityFactors.push("فقدان کدهای اسکیما باعث کاهش شدید شانس خوانده شدن دقیق مشخصات توسط مدل‌های زبانی بزرگ می‌شود.");
  }

  if (features.entitySignals.score >= 75) {
    visibilityFactors.push("تراکم مناسب موجودیت‌های معنایی، سایت شما را به عنوان مرجع اصلی حوزه فعالیت معرفی می‌کند.");
  } else {
    visibilityFactors.push("تراکم پایین موجودیت‌ها احتمال قرارگیری برند شما در پاسخ‌های مقایسه‌ای چت‌بات‌ها را کاهش می‌دهد.");
  }

  if (signals.technical.isHttps) {
    visibilityFactors.push("بهره‌مندی از پروتکل امن HTTPS امتیاز سلامت فنی کراولر را افزایش داده است.");
  } else {
    visibilityFactors.push("عدم استفاده از HTTPS ریسک امنیتی برای خزنده‌های اتوماتیک دارد و نمره ارزیابی موتورها را کاهش می‌دهد.");
  }

  return {
    estimatedVisibility,
    visibilityFactors
  };
}
