import React from "react";
import { KPICard } from "@/components/features/analytics/KPICard";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import {
  ShieldAlert,
  Sparkles,
  Award,
  Link2,
  Cpu,
  FileSpreadsheet,
  TrendingUp,
  ArrowRight,
  ArrowLeft
} from "lucide-react";

interface DashboardKpiGridProps {
  seoHealth: number | "N/A";
  aiVisibility: number | "N/A";
  brandAuthority: number | "N/A";
  citationVisibility: number | "N/A";
  technicalHealth: number | "N/A";
  contentHealth: number | "N/A";
  competitivePosition: string | "N/A";
  loading?: boolean;
}

export const DashboardKpiGrid: React.FC<DashboardKpiGridProps> = ({
  seoHealth,
  aiVisibility,
  brandAuthority,
  citationVisibility,
  technicalHealth,
  contentHealth,
  competitivePosition,
  loading = false,
}) => {
  const router = useRouter();
  const { language } = useTheme();
  const isRtl = language === "fa";

  const navigateTo = (path: string) => {
    router.push(`/${language}${path}`);
  };

  const getScoreChangeType = (score: number | "N/A"): "success" | "error" | "warning" | "info" => {
    if (score === "N/A") return "info";
    if (score >= 85) return "success";
    if (score >= 70) return "warning";
    return "error";
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-fade-in">
      {/* 1. SEO Health Score */}
      <div className="cursor-pointer group relative" onClick={() => navigateTo("/dashboard/audits")}>
        <KPICard
          title={isRtl ? "شاخص سلامت سئو (SEO Health)" : "SEO Health Score"}
          value={seoHealth !== "N/A" ? `${seoHealth}%` : "N/A"}
          change={seoHealth !== "N/A" ? (isRtl ? "پایش فعال" : "Active Audited") : (isRtl ? "بدون داده" : "No Data")}
          changeType={getScoreChangeType(seoHealth)}
          description={isRtl ? "میانگین وزنی پارامترهای موتور جستجو" : "Overall crawled performance weight"}
          icon={ShieldAlert}
          loading={loading}
        />
        <div className={`absolute bottom-3 ${isRtl ? "left-3" : "right-3"} opacity-0 group-hover:opacity-100 transition-opacity`}>
          {isRtl ? <ArrowLeft size={14} className="text-[var(--sky-blue-500)]" /> : <ArrowRight size={14} className="text-[var(--sky-blue-500)]" />}
        </div>
      </div>

      {/* 2. AI Visibility Score */}
      <div className="cursor-pointer group relative" onClick={() => navigateTo("/dashboard/aeo/audits")}>
        <KPICard
          title={isRtl ? "میزان دیده‌شدن هوش مصنوعی (AEO)" : "AI Visibility Score"}
          value={aiVisibility !== "N/A" ? `${aiVisibility}%` : "N/A"}
          change={aiVisibility !== "N/A" ? (isRtl ? "بهینه‌شده" : "Optimized") : (isRtl ? "غیرفعال" : "Unavailable")}
          changeType={getScoreChangeType(aiVisibility)}
          description={isRtl ? "سهم پاسخ در چت‌بات‌های بزرگ" : "Synthesized conversational share"}
          icon={Sparkles}
          loading={loading}
        />
        <div className={`absolute bottom-3 ${isRtl ? "left-3" : "right-3"} opacity-0 group-hover:opacity-100 transition-opacity`}>
          {isRtl ? <ArrowLeft size={14} className="text-[var(--sky-blue-500)]" /> : <ArrowRight size={14} className="text-[var(--sky-blue-500)]" />}
        </div>
      </div>

      {/* 3. Brand Authority */}
      <div className="cursor-pointer group relative" onClick={() => navigateTo("/dashboard/brand/citations")}>
        <KPICard
          title={isRtl ? "اعتبار برند (Brand Authority)" : "Brand Authority"}
          value={brandAuthority !== "N/A" ? brandAuthority : "N/A"}
          change={isRtl ? "غیرفعال" : "Inactive"}
          changeType="info"
          description={isRtl ? "بررسی حضور معنایی در گراف" : "Semantic authority index"}
          icon={Award}
          loading={loading}
        />
        <div className={`absolute bottom-3 ${isRtl ? "left-3" : "right-3"} opacity-0 group-hover:opacity-100 transition-opacity`}>
          {isRtl ? <ArrowLeft size={14} className="text-[var(--sky-blue-500)]" /> : <ArrowRight size={14} className="text-[var(--sky-blue-500)]" />}
        </div>
      </div>

      {/* 4. Citation Visibility */}
      <div className="cursor-pointer group relative" onClick={() => navigateTo("/dashboard/brand/citations")}>
        <KPICard
          title={isRtl ? "استناد به مراجع (Citations)" : "Citation Visibility"}
          value={citationVisibility !== "N/A" ? citationVisibility : "N/A"}
          change={isRtl ? "اتصال وب‌سرور" : "Disconnected"}
          changeType="info"
          description={isRtl ? "مجموع پیوندهای استناد شده" : "Inbound reference citations count"}
          icon={Link2}
          loading={loading}
        />
        <div className={`absolute bottom-3 ${isRtl ? "left-3" : "right-3"} opacity-0 group-hover:opacity-100 transition-opacity`}>
          {isRtl ? <ArrowLeft size={14} className="text-[var(--sky-blue-500)]" /> : <ArrowRight size={14} className="text-[var(--sky-blue-500)]" />}
        </div>
      </div>

      {/* 5. Technical Health */}
      <div className="cursor-pointer group relative" onClick={() => navigateTo("/dashboard/seo/technical")}>
        <KPICard
          title={isRtl ? "سلامت فنی (Technical SEO)" : "Technical Health"}
          value={technicalHealth !== "N/A" ? `${technicalHealth}%` : "N/A"}
          change={technicalHealth !== "N/A" ? (isRtl ? "تطبیق کامل" : "Compliant") : (isRtl ? "نیاز به اسکن" : "Needs Scan")}
          changeType={getScoreChangeType(technicalHealth)}
          description={isRtl ? "سرعت، متادیتا و لایه‌های امنیتی" : "Performance, SSL & structured meta tags"}
          icon={Cpu}
          loading={loading}
        />
        <div className={`absolute bottom-3 ${isRtl ? "left-3" : "right-3"} opacity-0 group-hover:opacity-100 transition-opacity`}>
          {isRtl ? <ArrowLeft size={14} className="text-[var(--sky-blue-500)]" /> : <ArrowRight size={14} className="text-[var(--sky-blue-500)]" />}
        </div>
      </div>

      {/* 6. Content Health */}
      <div className="cursor-pointer group relative" onClick={() => navigateTo("/dashboard/content/studio")}>
        <KPICard
          title={isRtl ? "سلامت محتوا (Content Quality)" : "Content Health"}
          value={contentHealth !== "N/A" ? `${contentHealth}%` : "N/A"}
          change={contentHealth !== "N/A" ? (isRtl ? "کلاستر غنی" : "Rich Cluster") : (isRtl ? "بدون داده" : "Empty")}
          changeType={getScoreChangeType(contentHealth)}
          description={isRtl ? "خوانایی معنایی و هم‌پوشانی" : "Semantic completeness and reading ease"}
          icon={FileSpreadsheet}
          loading={loading}
        />
        <div className={`absolute bottom-3 ${isRtl ? "left-3" : "right-3"} opacity-0 group-hover:opacity-100 transition-opacity`}>
          {isRtl ? <ArrowLeft size={14} className="text-[var(--sky-blue-500)]" /> : <ArrowRight size={14} className="text-[var(--sky-blue-500)]" />}
        </div>
      </div>

      {/* 7. Competitive Position */}
      <div className="cursor-pointer group relative sm:col-span-2" onClick={() => navigateTo("/dashboard/competitors/radar")}>
        <KPICard
          title={isRtl ? "موقعیت رقابتی (Competitive Rank)" : "Competitive Position"}
          value={competitivePosition !== "N/A" ? competitivePosition : (isRtl ? "موجود نیست" : "Unavailable")}
          change={isRtl ? "نیاز به پایش" : "Unmonitored"}
          changeType="warning"
          description={isRtl ? "شاخص برتری برند نسبت به رقبا" : "Performance baseline vs key competitors"}
          icon={TrendingUp}
          loading={loading}
        />
        <div className={`absolute bottom-3 ${isRtl ? "left-3" : "right-3"} opacity-0 group-hover:opacity-100 transition-opacity`}>
          {isRtl ? <ArrowLeft size={14} className="text-[var(--sky-blue-500)]" /> : <ArrowRight size={14} className="text-[var(--sky-blue-500)]" />}
        </div>
      </div>
    </div>
  );
};
