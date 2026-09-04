"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";
import {
  Settings,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  RefreshCw,
  Code,
  Globe,
  FileCode,
  Link,
  MapPin,
  Bot,
  Zap,
  ShieldCheck,
  ArrowUpRight
} from "lucide-react";
import { getTechnicalSeoDashboardAction } from "@/app/actions/technical-seo";

interface FindingItem {
  id: string;
  category: string;
  code: string;
  title: string;
  explanation: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: string;
  affectedResource: string;
  evidence: Record<string, any>;
}

interface RecommendationItem {
  findingId: string;
  findingCode: string;
  affectedResource: string;
  severity: string;
  fa: { title: string; description: string; impactScore: number };
  en: { title: string; description: string; impactScore: number };
}

export default function TechnicalSeoPage() {
  const { language } = useTheme();
  const isRtl = language === "fa";

  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState<any[]>([]);
  const [findings, setFindings] = useState<FindingItem[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getTechnicalSeoDashboardAction();
      if (res.success && "result" in res && res.result) {
        setPages(res.result.pages || []);
        setFindings(res.result.findings || []);
        setRecommendations(res.result.recommendations || []);
      }
    } catch (err) {
      console.error("Failed to load Technical SEO dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const criticalCount = findings.filter(f => f.severity === "critical").length;
  const highCount = findings.filter(f => f.severity === "high").length;
  const mediumCount = findings.filter(f => f.severity === "medium").length;
  const lowCount = findings.filter(f => f.severity === "low").length;

  const filterCategoryMap: Record<string, string[]> = {
    all: [],
    structured_data: ["ERR_STRUCT_SCHEMA_MISSING", "ERR_STRUCT_JSONLD_MALFORMED", "ERR_STRUCT_REQUIRED_PROPERTY_MISSING", "ERR_STRUCT_DUPLICATE_BLOCK"],
    crawlability: ["ERR_CRAWL_HTTP_ERROR", "ERR_CRAWL_REDIRECT_ISSUE", "ERR_TECH_HTTP_FAILED", "ERR_TECH_REDIRECT_LOOP"],
    indexability: ["ERR_INDEX_NOINDEX", "ERR_INDEX_BLOCKED_BY_ROBOTS", "ERR_INDEX_CANONICAL_MISMATCH", "ERR_INDEX_CONFLICTING_SIGNALS"],
    internal_linking: ["ERR_LINK_ORPHAN_PAGE", "ERR_LINK_EMPTY_ANCHOR", "ERR_LINK_BROKEN_TARGET", "ERR_SEO_ORPHAN_PAGE"],
    sitemap: ["ERR_SITEMAP_MISSING", "ERR_SITEMAP_FETCH_ERROR", "ERR_SITEMAP_URL_ERROR", "ERR_SITEMAP_CANONICAL_MISMATCH", "ERR_SITEMAP_DUPLICATE_URLS"],
    canonical: ["ERR_CANONICAL_MISSING", "ERR_CANONICAL_INVALID", "ERR_CANONICAL_MULTIPLE", "ERR_CANONICAL_TO_ERROR", "ERR_CANONICAL_CHAIN", "ERR_TECH_CANONICAL_INVALID", "ERR_TECH_CANONICAL_MULTIPLE"],
    robots: ["ERR_ROBOTS_DIRECTIVES_CONFLICT", "ERR_SEO_ROBOTS_BLOCKED"],
    core_web_vitals: ["ERR_CWV_INSUFFICIENT_EVIDENCE", "ERR_CWV_SLOW_RESPONSE", "ERR_CWV_LARGE_PAGE"]
  };

  const filteredFindings = findings.filter(f => {
    if (selectedCategory === "all") return true;
    const allowedCodes = filterCategoryMap[selectedCategory] || [];
    return allowedCodes.includes(f.code);
  });

  const categories = [
    { id: "all", labelFa: "همه موارد", labelEn: "All Audit Items", icon: Settings },
    { id: "structured_data", labelFa: "داده‌های ساختاریافته (Schema)", labelEn: "Structured Data", icon: Code },
    { id: "crawlability", labelFa: "قابلیت خزش (Crawlability)", labelEn: "Crawlability", icon: Globe },
    { id: "indexability", labelFa: "قابلیت ایندکس (Indexability)", labelEn: "Indexability", icon: FileCode },
    { id: "internal_linking", labelFa: "لینک‌سازی داخلی", labelEn: "Internal Linking", icon: Link },
    { id: "sitemap", labelFa: "نقشه سایت (Sitemap)", labelEn: "Sitemap XML", icon: MapPin },
    { id: "canonical", labelFa: "تگ‌های کانونیکال", labelEn: "Canonical Tags", icon: ShieldCheck },
    { id: "robots", labelFa: "دستورات ربات‌ها (Robots)", labelEn: "Robots Directives", icon: Bot },
    { id: "core_web_vitals", labelFa: "کارایی و سرعت (CWV)", labelEn: "Core Web Vitals", icon: Zap }
  ];

  return (
    <div className="space-y-6 animate-fade-in text-start">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-primary)] font-display flex items-center gap-2.5">
            <Settings className="text-[var(--sky-blue-500)]" size={26} />
            <span>{isRtl ? "ابزارهای سئوی تکنیکال" : "Selective Technical SEO Toolkit"}</span>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-[var(--sky-blue-500)] text-white rounded-full">
              Phase 4 Powered
            </span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-2xl">
            {isRtl
              ? "پایش قطعی، تحلیل داده‌های ساختاریافته، قابلیت خزش، ایندکس‌پذیری، نقشه سایت، کانونیکال و سرعت اولیه سرور بر پایه سیگنال‌های کانونی."
              : "Deterministic audit layer evaluating Structured Data, Crawlability, Indexability, Internal Links, Sitemap, Canonical, Robots, and CWV performance."}
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-[var(--card)] hover:bg-[var(--sky-blue-500)]/10 text-[var(--text-primary)] border border-[var(--border)] rounded-lg transition-colors duration-150 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-[var(--sky-blue-500)]" : ""} />
          <span>{isRtl ? "ارزیابی مجدد تکنیکال" : "Re-run Technical Audit"}</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border border-[var(--border)] bg-[var(--card)]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-red-500/10 text-red-500">
              <XCircle size={20} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-[var(--text-secondary)]">
                {isRtl ? "خطاهای بحرانی" : "Critical Issues"}
              </p>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mt-0.5">{criticalCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[var(--border)] bg-[var(--card)]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-[var(--text-secondary)]">
                {isRtl ? "مخاطرات با اولویت بالا" : "High Priority Risks"}
              </p>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mt-0.5">{highCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[var(--border)] bg-[var(--card)]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
              <Info size={20} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-[var(--text-secondary)]">
                {isRtl ? "هشدارها و توصیه‌ها" : "Medium & Low Alerts"}
              </p>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mt-0.5">{mediumCount + lowCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[var(--border)] bg-[var(--card)]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-[var(--text-secondary)]">
                {isRtl ? "صفحات ارزیابی‌شده" : "Audited Pages"}
              </p>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mt-0.5">{pages.length}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Selection Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-[var(--border)]">
        {categories.map(cat => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors duration-150 cursor-pointer ${
                isActive
                  ? "bg-[var(--sky-blue-500)] text-white font-semibold"
                  : "bg-[var(--card)] text-[var(--text-secondary)] hover:bg-[var(--border)] border border-[var(--border)]"
              }`}
            >
              <Icon size={14} />
              <span>{isRtl ? cat.labelFa : cat.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* Findings & Detailed List Section */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-[var(--text-secondary)] flex flex-col items-center gap-2">
            <RefreshCw size={24} className="animate-spin text-[var(--sky-blue-500)]" />
            <span>{isRtl ? "در حال اجرای ارزیابی قطعی سئوی تکنیکال..." : "Evaluating Technical SEO Signals..."}</span>
          </div>
        ) : filteredFindings.length === 0 ? (
          <Card className="border border-[var(--border)] bg-[var(--card)]">
            <CardContent className="py-12 text-center text-xs text-[var(--text-secondary)] space-y-2">
              <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-1" />
              <p className="font-semibold text-sm text-[var(--text-primary)]">
                {isRtl ? "هیچ اختلال تکنیکال در این دسته‌بندی یافت نشد" : "No Technical Issues Found in this Category"}
              </p>
              <p className="text-[11px] max-w-md mx-auto">
                {isRtl
                  ? "تمام سیگنال‌های کانونی ارزیابی‌شده در وضعیت مطلوب و سالم قرار دارند."
                  : "All evaluated canonical signals passed validation cleanly with zero errors."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredFindings.map(finding => {
            const rec = recommendations.find(r => r.findingId === finding.id || r.findingCode === finding.code);
            const recData = isRtl ? rec?.fa : rec?.en;

            const severityBadge =
              finding.severity === "critical"
                ? "bg-red-500/10 text-red-500 border-red-500/20"
                : finding.severity === "high"
                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                : finding.severity === "medium"
                ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                : "bg-slate-500/10 text-slate-400 border-slate-500/20";

            return (
              <Card key={finding.id} className="border border-[var(--border)] bg-[var(--card)] hover:border-[var(--sky-blue-500)]/40 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase border ${severityBadge}`}>
                        {finding.severity}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--border)]/50 px-1.5 py-0.5 rounded">
                        {finding.code}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-[var(--text-secondary)] truncate max-w-md dir-ltr text-start">
                      {finding.affectedResource}
                    </span>
                  </div>
                  <CardTitle className="text-sm font-bold text-[var(--text-primary)] mt-2">
                    {finding.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-[var(--text-secondary)] leading-relaxed mt-1">
                    {finding.explanation}
                  </CardDescription>
                </CardHeader>

                <CardContent className="text-xs space-y-3 border-t border-[var(--border)]/60 pt-3">
                  {/* Evidence Display Bag */}
                  {finding.evidence && Object.keys(finding.evidence).length > 0 && (
                    <div className="p-2.5 rounded bg-[var(--border)]/20 border border-[var(--border)] font-mono text-[11px] text-[var(--text-secondary)] space-y-1">
                      <span className="font-semibold text-[10px] uppercase text-[var(--text-muted)] block font-sans">
                        {isRtl ? "شواهد قطعی سیگنال (Evidence):" : "Deterministic Evidence:"}
                      </span>
                      <pre className="whitespace-pre-wrap break-all text-[10px] dir-ltr text-start text-[var(--text-primary)]">
                        {JSON.stringify(finding.evidence, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Deterministic Action Recommendation */}
                  {recData && (
                    <div className="p-3 rounded-lg bg-[var(--sky-blue-500)]/5 border border-[var(--sky-blue-500)]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--sky-blue-500)]">
                          <ArrowUpRight size={14} />
                          <span>{recData.title}</span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                          {recData.description}
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center gap-1 bg-[var(--sky-blue-500)]/10 text-[var(--sky-blue-500)] px-2.5 py-1 rounded text-[10px] font-bold self-start sm:self-auto">
                        <span>{isRtl ? "پیش‌بینی تاثیر:" : "Predicted Lift:"}</span>
                        <span>+{recData.impactScore}%</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
