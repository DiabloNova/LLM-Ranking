"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";
import {
  Sparkles,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  ShieldCheck,
  Percent,
  Layers,
  Tag,
  Clock,
  Compass,
  Link2,
  ArrowUpRight,
  BookOpen,
  Eye,
  CheckSquare
} from "lucide-react";
import { getBrandIntelligenceOverviewAction } from "@/app/actions/brand-intelligence";
import { Brand, BrandAssociation } from "@/features/ai-intelligence/domain/types";

export default function BrandMonitoringPage() {
  const { language } = useTheme();
  const isRtl = language === "fa";

  const [brand, setBrand] = useState<Brand | null>(null);
  const [metrics, setMetrics] = useState<any | null>(null);
  const [associations, setAssociations] = useState<BrandAssociation[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load brand intelligence data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setErrorMsg(null);

      const res = await getBrandIntelligenceOverviewAction();
      if (res.success && (res as any).result) {
        setBrand((res as any).result.brand);
        setMetrics((res as any).result.authorityMetrics);
        setAssociations((res as any).result.associations);
        setAlerts((res as any).result.alerts);
      } else {
        setErrorMsg(isRtl ? "خطا در بارگذاری پایگاه داده پایش برند." : "Failed to load brand monitoring intelligence.");
      }
      setIsLoading(false);
    }
    loadData();
  }, [isRtl]);

  const getAssociationBadgeColor = (type: string): string => {
    switch (type) {
      case "industry_category":
        return "text-[var(--sky-blue-500)] bg-[var(--sky-blue-500)]/10 border-[var(--sky-blue-500)]/30";
      case "product":
        return "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200";
      case "location":
        return "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200";
      default:
        return "text-[var(--text-muted)] bg-[var(--border)] border-[var(--border)]";
    }
  };

  const getAssociationLabel = (type: string): string => {
    if (isRtl) {
      switch (type) {
        case "industry_category": return "رده صنعت / حوزه";
        case "product": return "محصول متصل";
        case "location": return "موقعیت جغرافیایی";
        default: return "مفهوم مرتبط";
      }
    }
    return type.replace("_", " ");
  };

  return (
    <div className="space-y-6 animate-fade-in text-start pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-primary)] font-display flex items-center gap-2.5">
            <Award className="text-[var(--sky-blue-500)] animate-pulse" size={24} />
            <span>{isRtl ? "مرکز هوشمندی برند (AI Brand Intelligence)" : "AI Brand Intelligence Center"}</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-2xl leading-relaxed">
            {isRtl
              ? "پلتفرم سنجش و ارزیابی عمیق نحوه معرفی هویت برند، ردیابی پایداری شناخت در موتورهای پاسخ‌گو، پایش میزان رضایت و شناخت مفاهیم مرتبط."
              : "Enterprise brand intelligence suite designed to monitor, track, and score brand reputation, semantic associations, and endorsement rates."}
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg text-xs text-red-600 flex items-center gap-2 font-semibold">
          <AlertTriangle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="h-60 bg-[var(--border)]/30 rounded-xl"></div>
          <div className="lg:col-span-2 h-60 bg-[var(--border)]/30 rounded-xl"></div>
        </div>
      ) : (
        <div className="space-y-6">

          {/* Top Panel: Brand Authority & Recommendations Integration */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* AI Brand Authority Score */}
            <Card className="border border-[var(--border)] bg-[var(--card)] rounded-xl flex flex-col justify-between overflow-hidden">
              <CardHeader className="border-b border-[var(--border)]/50 pb-3 bg-[var(--border)]/10">
                <CardTitle className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck size={14} className="text-[var(--sky-blue-500)]" />
                  <span>{isRtl ? "نشان اعتبار برند (AI Brand Authority)" : "AI Brand Authority"}</span>
                </CardTitle>
                <CardDescription className="text-[10px]">
                  {isRtl ? "شاخص کلی اعتبار برند بر اساس شواهد مدل‌ها" : "Composite reputation signal evaluated across search answers"}
                </CardDescription>
              </CardHeader>

              <CardContent className="py-6 flex flex-col items-center justify-center flex-grow space-y-4">
                {metrics && (
                  <div className="text-center space-y-3 w-full">
                    <div className="relative w-28 h-28 flex items-center justify-center rounded-full border-4 border-[var(--border)] mx-auto">
                      <div className="text-center">
                        <span className="text-3xl font-black text-[var(--text-primary)]">
                          {metrics.overallAuthorityScore}%
                        </span>
                        <div className="text-[8px] uppercase font-bold tracking-wider text-[var(--text-muted)] mt-0.5">
                          {isRtl ? "شاخص اعتبار" : "Rep Score"}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 max-w-xs mx-auto text-xs">
                      {[
                        { label: isRtl ? "پوشش ذکر نام (Prompts Coverage)" : "Mention Coverage", val: metrics.mentionCoverage },
                        { label: isRtl ? "انضمام در مراجع (Citation Backing)" : "Citation Backing", val: metrics.citationSupportScore },
                        { label: isRtl ? "پایداری پیشنهادها (Recommendations)" : "Recommendation Rate", val: metrics.recommendationPresenceScore }
                      ].map((sub, sIdx) => (
                        <div key={sIdx} className="space-y-1">
                          <div className="flex justify-between text-[10px] font-semibold text-[var(--text-secondary)]">
                            <span>{sub.label}</span>
                            <span className="font-bold">{sub.val}%</span>
                          </div>
                          <div className="w-full bg-[var(--border)]/50 rounded-full h-1 overflow-hidden">
                            <div className="bg-[var(--sky-blue-500)] h-1 rounded-full" style={{ width: `${sub.val}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Alert Center (Task 4.4 Recommendations mapping) */}
            <Card className="lg:col-span-2 border border-[var(--border)] bg-[var(--card)] rounded-xl flex flex-col justify-between">
              <CardHeader className="border-b border-[var(--border)]/50 pb-3">
                <CardTitle className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2 text-amber-500">
                  <AlertTriangle size={14} />
                  <span>{isRtl ? "سیگنال‌های اقدام و بهبود رتبه (Task 4.4 Alerts)" : "Actionable Reputation Signals"}</span>
                </CardTitle>
                <CardDescription className="text-[10px]">
                  {isRtl ? "پیشنهادهای استخراج شده برای موتور تصمیم‌گیری خودکار" : "Reputation gaps and boosting opportunities actively dispatched to Action Engine"}
                </CardDescription>
              </CardHeader>
              <CardContent className="py-4 flex-grow text-xs space-y-3 overflow-y-auto max-h-60 text-start">
                {alerts.length === 0 ? (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-lg font-semibold">
                    <CheckCircle size={16} />
                    <span>{isRtl ? "عالی! وضعیت پایداری و شهرت برند در بالاترین سطح بهینگی قرار دارد." : "Great! All brand authority indicators are stable."}</span>
                  </div>
                ) : (
                  alerts.map((alert, aIdx) => (
                    <div key={aIdx} className="p-3 bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900 rounded-xl flex items-start gap-3">
                      <Sparkles className="text-amber-500 shrink-0 mt-0.5" size={16} />
                      <div className="space-y-1">
                        <span className="font-bold text-[var(--text-primary)] block">
                          {alert.code === "ALERT_BRAND_AUTHORITY_DECLINE" ? (isRtl ? "سقوط شاخص اعتبار کلامی" : "Authority Decline Warning") : (isRtl ? "فرصت ارتقای کلامی" : "Optimization Opportunity")}
                        </span>
                        <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                          {alert.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}

                <div className="p-2.5 bg-[var(--border)]/20 rounded-lg flex items-center justify-between text-[10px] font-semibold text-[var(--text-secondary)]">
                  <span>
                    {isRtl ? "سیگنال‌های فوق به عنوان مراجع تغذیه تسک ۴.۴ موتور تصمیم‌گیری صادر می‌شوند." : "These metrics are actively integrated with Task 4.4 Decision Engine."}
                  </span>
                  <ArrowUpRight size={14} className="text-[var(--text-muted)]" />
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Semantic Brand Associations Grid */}
          <div className="space-y-4 text-start">
            <h3 className="text-sm font-black text-[var(--text-primary)] flex items-center gap-2">
              <Layers size={16} className="text-[var(--sky-blue-500)]" />
              <span>{isRtl ? "گراف مفاهیم و موجودیت‌های متصل برند" : "Semantic Brand Associations Matrix"}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {associations.map((assoc) => (
                <Card key={assoc.id} className="border border-[var(--border)] bg-[var(--card)] rounded-xl overflow-hidden hover:border-[var(--sky-blue-500)]/40 transition-all duration-300">
                  <div className="p-4 border-b border-[var(--border)]/50 bg-[var(--border)]/10 flex justify-between items-center text-xs font-black">
                    <span className="text-[var(--text-primary)] line-clamp-1">{assoc.entityName}</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black border ${getAssociationBadgeColor(assoc.relationshipType)}`}>
                      {getAssociationLabel(assoc.relationshipType)}
                    </span>
                  </div>
                  <CardContent className="p-4 space-y-3 text-xs">
                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed italic font-mono bg-[var(--border)]/10 p-2 rounded">
                      "{assoc.supportingContext}"
                    </p>
                    <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] font-mono">
                      <span>{isRtl ? "تکرار مراجع: " : "Appearances: "}<strong className="text-[var(--sky-blue-500)] font-black">{assoc.occurrenceCount}</strong></span>
                      <span>{isRtl ? "اعتماد: " : "Confidence: "}{assoc.confidence * 100}%</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
