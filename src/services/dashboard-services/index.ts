import { LucideIcon } from "lucide-react";
import {
  Settings,
  Sparkles,
  BookOpen,
  BarChart3,
  Award,
  Network,
  LineChart
} from "lucide-react";

export type ServiceCategory =
  | "seo"
  | "aeo"
  | "content"
  | "competitors"
  | "brand"
  | "entities"
  | "analytics";

export type ServiceAvailability =
  | "AVAILABLE"
  | "PREMIUM"
  | "LOCKED"
  | "COMING_SOON"
  | "UNAVAILABLE";

export interface ServiceFeature {
  id: string;
  nameEn: string;
  nameFa: string;
}

export interface ServiceDefinition {
  id: string;
  slug: string;
  nameEn: string;
  nameFa: string;
  descEn: string;
  descFa: string;
  category: ServiceCategory;
  route: string;
  features: ServiceFeature[];
  pricingTier: "free" | "professional" | "enterprise" | "custom";
}

export interface ServiceEntitlement {
  serviceId: string;
  status: ServiceAvailability;
  reasonEn: string;
  reasonFa: string;
}

export interface ServiceUsage {
  serviceId: string;
  used: number;
  limit: number | null; // null for unlimited
  percentage: number;
}

export interface MarketplaceItem {
  service: ServiceDefinition;
  entitlement: ServiceEntitlement;
  usage?: ServiceUsage;
}

export const CATEGORIES: { id: ServiceCategory; labelEn: string; labelFa: string }[] = [
  { id: "seo", labelEn: "SEO Tools", labelFa: "ابزارهای سئو" },
  { id: "aeo", labelEn: "AI Visibility Tools", labelFa: "ابزارهای رویت‌پذیری هوش مصنوعی" },
  { id: "content", labelEn: "Content Tools", labelFa: "ابزارهای محتوایی" },
  { id: "competitors", labelEn: "Competitive Intelligence", labelFa: "ابزارهای رقابتی" },
  { id: "brand", labelEn: "Brand & Citation", labelFa: "ابزارهای برند و استناد" },
  { id: "entities", labelEn: "Knowledge & Entities", labelFa: "ابزارهای دانش و موجودیت‌ها" },
  { id: "analytics", labelEn: "Analytics & Reporting", labelFa: "تحلیل‌ها و گزارش‌دهی" }
];

export const SERVICE_CATALOG: ServiceDefinition[] = [
  {
    id: "tech-seo",
    slug: "seo-technical",
    nameEn: "Technical SEO",
    nameFa: "سئوی تکنیکال",
    descEn: "Inspect underlying technical parameters, SSL validation, response size, and Core Web Vitals.",
    descFa: "بررسی پارامترهای فنی زیرساختی دامنه، اعتبار گواهی SSL، حجم پاسخ و سلامت Core Web Vitals.",
    category: "seo",
    route: "/dashboard/seo/technical",
    pricingTier: "free",
    features: [
      { id: "crawl-depth", nameEn: "Deep URL Normalization", nameFa: "نرمال‌سازی پیشرفته آدرس‌ها" },
      { id: "security-ssrf", nameEn: "SSRF & Private IP Sanitization", nameFa: "جلوگیری از حملات SSRF و امنیت IP" },
      { id: "seo-score", nameEn: "Deterministic SEO Scoring", nameFa: "امتیازدهی قطعی سئو" }
    ]
  },
  {
    id: "schema-metadata",
    slug: "seo-schema",
    nameEn: "Schema & Metadata",
    nameFa: "طرح‌واره و متادیتا",
    descEn: "Scan search-oriented tags, verify JSON-LD schemas, OpenGraph meta properties, and micro-formats.",
    descFa: "پایش برچسب‌های موتور جستجو، راستی‌آزمایی ساختارهای JSON-LD، تگ‌های OpenGraph و ساختارهای میکرودیتا.",
    category: "seo",
    route: "/dashboard/seo/schema",
    pricingTier: "free",
    features: [
      { id: "json-ld", nameEn: "JSON-LD Structuring Validation", nameFa: "تایید ساختار نحوی JSON-LD" },
      { id: "og-meta", nameEn: "OpenGraph Tag Verification", nameFa: "اعتبارسنجی تگ‌های شبکه‌های اجتماعی" }
    ]
  },
  {
    id: "ai-visibility",
    slug: "aeo-audits",
    nameEn: "AI Visibility Audits",
    nameFa: "سنجش رویت‌پذیری هوش مصنوعی",
    descEn: "Benchmark conversational engine discoverability across Google Gemini, ChatGPT, and other LLMs.",
    descFa: "ارزیابی سهم رویت‌پذیری برند و شانس معرفی در مدل‌های زبانی بزرگ از جمله جمینای و چت‌جی‌پی‌تی.",
    category: "aeo",
    route: "/dashboard/aeo/audits",
    pricingTier: "professional",
    features: [
      { id: "model-prominence", nameEn: "Multi-Model Prominence Scoring", nameFa: "امتیازدهی سهم حضور چندمدله" },
      { id: "citation-mapping", nameEn: "AI In-text Citation Analysis", nameFa: "تحلیل لینک‌های استنادی درون‌متنی" }
    ]
  },
  {
    id: "ai-playground",
    slug: "aeo-playground",
    nameEn: "AI Playground",
    nameFa: "محیط اجرای هوش مصنوعی",
    descEn: "Live prompting playground to query enterprise LLM engines with real-time response synthesis.",
    descFa: "محیط زنده ارسال پرسش و دریافت پاسخ‌های تلفیقی همراه با دیباگ زنجیره استنادی RAG.",
    category: "aeo",
    route: "/dashboard/aeo/playground",
    pricingTier: "professional",
    features: [
      { id: "rag-debugger", nameEn: "RAG Diagnostic Playground", nameFa: "محیط خطایابی پیشرفته زنجیره RAG" },
      { id: "prompt-audit", nameEn: "Automatic Prompt Invariant Checks", nameFa: "اعتبارسنجی خودکار انطباق پرسش" }
    ]
  },
  {
    id: "content-studio",
    slug: "content-studio",
    nameEn: "Content Studio",
    nameFa: "استودیوی محتوا",
    descEn: "Create model-optimized semantic copy with integrated keyword injections and readability adjustments.",
    descFa: "ایجاد و بازنویسی محتوای بهینه‌شده معنایی برای افزایش شانس بازیابی توسط پایپ‌لاین‌های هوش مصنوعی.",
    category: "content",
    route: "/dashboard/content/studio",
    pricingTier: "professional",
    features: [
      { id: "semantic-rewrite", nameEn: "Semantic Copywriting Assistant", nameFa: "دستیار نگارش و بازنویسی معنایی" },
      { id: "keyword-inject", nameEn: "Entity & Keyword Optimizer", nameFa: "تزریق‌کننده کلمات کلیدی و موجودیت‌ها" }
    ]
  },
  {
    id: "content-ingestion",
    slug: "content-ingestion",
    nameEn: "Content Ingestion",
    nameFa: "بارگذاری محتوا و مستندات",
    descEn: "Ingest PDFs or markdown files with automatic chunking and vector embeddings mapping.",
    descFa: "بارگذاری اسناد متنی و فایل‌های PDF برای قطعه‌بندی خودکار و تبدیل به بردار جهت سیستم RAG.",
    category: "content",
    route: "/dashboard/content/ingestion",
    pricingTier: "professional",
    features: [
      { id: "pdf-extractor", nameEn: "Intelligent PDF Text Extraction", nameFa: "استخراج هوشمند متن از پی‌دی‌اف" },
      { id: "chunking", nameEn: "Overlapping Text Chunking", nameFa: "تکه‌تکه‌سازی متون با همپوشانی لغوی" }
    ]
  },
  {
    id: "competitor-radar",
    slug: "competitors-radar",
    nameEn: "Competitor Radar",
    nameFa: "رادار رقیبان",
    descEn: "Analyze benchmark metrics of competitive products and track AI recommendations.",
    descFa: "رصد همه‌جانبه رتبه و سهم حضور رقبا در پاسخ‌های هوش مصنوعی و مقایسه ماتریس قوت و ضعف.",
    category: "competitors",
    route: "/dashboard/competitors/radar",
    pricingTier: "professional",
    features: [
      { id: "sov", nameEn: "Competitive Share of Voice", nameFa: "سهم صدای برندها در چت‌بات‌ها" },
      { id: "diff-matrix", nameEn: "Multi-Competitor Difference Matrix", nameFa: "ماتریس تفاوت‌های کیفی چندرقیبی" }
    ]
  },
  {
    id: "brand-citations",
    slug: "brand-citations",
    nameEn: "Citation Explorer",
    nameFa: "کاوشگر استنادها",
    descEn: "Track external citations, references, and backlink authority profiles supporting your brand name.",
    descFa: "پایش ارجاعات خارجی، اشاره‌ها و اعتبار دامنه‌های معرفی‌کننده نام تجاری شما.",
    category: "brand",
    route: "/dashboard/brand/citations",
    pricingTier: "professional",
    features: [
      { id: "mention-alert", nameEn: "Real-time Citation Alert Stream", nameFa: "جریان هوشمند اعلام اشاره‌های استنادی" },
      { id: "link-health", nameEn: "Referral Backlink Health Monitor", nameFa: "پایش سلامت لینک‌های ارجاعی خارجی" }
    ]
  },
  {
    id: "knowledge-graph",
    slug: "entities-graph",
    nameEn: "Live Knowledge Graph",
    nameFa: "نمودار زنده دانش",
    descEn: "Interactive visual entity charts showing how search engines and LLMs organize your brand's metadata.",
    descFa: "نمایش تعاملی پیوند میان موجودیت‌ها، افراد و برند شما بر اساس تحلیل گراف دانش مدل‌های هوشمند.",
    category: "entities",
    route: "/dashboard/entities/graph",
    pricingTier: "enterprise",
    features: [
      { id: "entity-extraction", nameEn: "Automatic Entity & Relation Extraction", nameFa: "استخراج خودکار روابط و موجودیت‌ها" },
      { id: "spider-chart", nameEn: "High-DPI Radar/Spider Visualizer", nameFa: "گراف رادار تعاملی با رزولوشن بالا" }
    ]
  },
  {
    id: "llm-bias",
    slug: "analytics-llm-bias",
    nameEn: "LLM Response Share & Bias",
    nameFa: "سهم پاسخ و انحراف مدل‌ها",
    descEn: "Uncover model biases, conversational inclinations, and political or brand sentiment disparities.",
    descFa: "تحلیل جهت‌گیری مدل‌ها، گرایش‌های زبانی و انحراف در تحلیل لحن درباره نام تجاری شما.",
    category: "analytics",
    route: "/dashboard/analytics/llm-bias",
    pricingTier: "custom",
    features: [
      { id: "bias-vectors", nameEn: "Bias Vector Coordinate Calculations", nameFa: "محاسبه مختصات جهت‌گیری و ترجیحات" },
      { id: "sentiment-drift", nameEn: "Sentiment Drift Tracking over time", nameFa: "رصد انحراف لحن پاسخ در بازه زمانی" }
    ]
  }
];

const workspacePlans = new Map<string, "free" | "professional" | "enterprise">();

// Seed default authoritative workspaces
workspacePlans.set("ws-tehran", "professional");
workspacePlans.set("Tehran HQ Workspace", "professional");
workspacePlans.set("ws-pro-tenant", "professional");
workspacePlans.set("ws-enterprise", "enterprise");
workspacePlans.set("ws-enterprise-organization", "enterprise");
workspacePlans.set("org-enterprise-rag-01", "enterprise");

export function registerWorkspacePlan(workspaceId: string, plan: "free" | "professional" | "enterprise"): void {
  workspacePlans.set(workspaceId, plan);
}

export function clearWorkspacePlans(): void {
  workspacePlans.clear();
  // Re-seed default authoritative workspaces
  workspacePlans.set("ws-tehran", "professional");
  workspacePlans.set("Tehran HQ Workspace", "professional");
  workspacePlans.set("ws-pro-tenant", "professional");
  workspacePlans.set("ws-enterprise", "enterprise");
  workspacePlans.set("ws-enterprise-organization", "enterprise");
  workspacePlans.set("org-enterprise-rag-01", "enterprise");
}

export function getWorkspacePlan(workspaceId: string): "free" | "professional" | "enterprise" {
  return workspacePlans.get(workspaceId) || "free";
}

export function getWorkspaceEntitlements(workspaceId: string): ServiceEntitlement[] {
  const plan = getWorkspacePlan(workspaceId);

  return SERVICE_CATALOG.map((service) => {
    let status: ServiceAvailability = "AVAILABLE";
    let reasonEn = "Available under your subscription tier.";
    let reasonFa = "این ابزار در اشتراک فعلی شما فعال و آماده استفاده است.";

    if (service.pricingTier === "custom") {
      status = "UNAVAILABLE";
      reasonEn = "Requires custom enterprise integration or activation.";
      reasonFa = "فعال‌سازی این ابزار نیاز به هماهنگی و یکپارچه‌سازی سفارشی دارد.";
    } else if (service.pricingTier === "enterprise") {
      if (plan !== "enterprise") {
        status = "LOCKED";
        reasonEn = "Requires Enterprise plan upgrade.";
        reasonFa = "دسترسی به این ابزار نیازمند ارتقا به پلن سازمانی (Enterprise) است.";
      }
    } else if (service.pricingTier === "professional") {
      if (plan === "free") {
        status = "PREMIUM";
        reasonEn = "Requires Professional plan upgrade.";
        reasonFa = "دسترسی به این ابزار نیازمند ارتقا به پلن حرفه‌ای (Professional) است.";
      }
    }

    return {
      serviceId: service.id,
      status,
      reasonEn,
      reasonFa
    };
  });
}

export function getWorkspaceUsage(workspaceId: string): ServiceUsage[] {
  const plan = getWorkspacePlan(workspaceId);

  return SERVICE_CATALOG.map((service) => {
    let used = 0;
    let limit: number | null = null;

    if (plan === "enterprise") {
      // Unlimited limits for enterprise plan
      used = service.pricingTier === "free" ? 42 : 15;
      limit = null;
    } else if (plan === "professional") {
      if (service.id === "tech-seo") {
        used = 35;
        limit = 100;
      } else if (service.id === "schema-metadata") {
        used = 8;
        limit = 50;
      } else if (service.id === "ai-visibility") {
        used = 7;
        limit = 20;
      } else if (service.id === "ai-playground") {
        used = 14;
        limit = 100;
      } else if (service.id === "content-studio") {
        used = 18;
        limit = 50;
      } else if (service.id === "content-ingestion") {
        used = 4;
        limit = 20;
      } else if (service.id === "competitor-radar") {
        used = 1;
        limit = 3;
      } else if (service.id === "brand-citations") {
        used = 120;
        limit = 500;
      } else {
        used = 0;
        limit = 0; // locked tools show 0 limit or 0 used
      }
    } else {
      // Free plan limits
      if (service.id === "tech-seo") {
        used = 15;
        limit = 50;
      } else if (service.id === "schema-metadata") {
        used = 2;
        limit = 10;
      } else {
        used = 0;
        limit = 0;
      }
    }

    const percentage = limit && limit > 0 ? Math.round((used / limit) * 100) : 0;

    return {
      serviceId: service.id,
      used,
      limit,
      percentage
    };
  });
}

export function getMarketplaceData(workspaceId: string): MarketplaceItem[] {
  const entitlements = getWorkspaceEntitlements(workspaceId);
  const usages = getWorkspaceUsage(workspaceId);

  return SERVICE_CATALOG.map((service) => {
    const entitlement = entitlements.find((e) => e.serviceId === service.id)!;
    const usage = usages.find((u) => u.serviceId === service.id);

    return {
      service,
      entitlement,
      usage
    };
  });
}

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  seo: Settings,
  aeo: Sparkles,
  content: BookOpen,
  competitors: BarChart3,
  brand: Award,
  entities: Network,
  analytics: LineChart
};
