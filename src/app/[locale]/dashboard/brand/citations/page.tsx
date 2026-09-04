"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";
import {
  Sparkles,
  Link2,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Share2,
  List,
  Layers,
  ChevronRight,
  TrendingDown,
  ArrowUpRight,
  ShieldCheck,
  Percent,
  Receipt
} from "lucide-react";
import { getCitationsDashboardDataAction } from "@/app/actions/citation-intelligence";
import { CitationSource, CitationOccurrence } from "@/features/ai-intelligence/domain/types";

export default function AeoCitationsPage() {
  const { language } = useTheme();
  const isRtl = language === "fa";

  const [sources, setSources] = useState<CitationSource[]>([]);
  const [occurrences, setOccurrences] = useState<CitationOccurrence[]>([]);
  const [share, setShare] = useState<{ brandShare: number; competitorShare: number; otherShare: number } | null>(null);
  const [gaps, setGaps] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);

  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load citation data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setErrorMsg(null);

      const res = await getCitationsDashboardDataAction();
      if (res.success && (res as any).result) {
        setSources((res as any).result.sources);
        setOccurrences((res as any).result.occurrences);
        setShare((res as any).result.share);
        setGaps((res as any).result.gaps);
        setTrends((res as any).result.trends);
      } else {
        setErrorMsg(isRtl ? "خطا در بارگذاری پایگاه داده استنادات." : "Failed to load citation intelligence database.");
      }
      setIsLoading(false);
    }
    loadData();
  }, [isRtl]);

  const getClassificationBadge = (classification: string): string => {
    switch (classification) {
      case "owned":
        return "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200";
      case "competitor":
        return "text-red-500 bg-red-50 dark:bg-red-950/20 border-red-200";
      case "government":
        return "text-blue-500 bg-blue-50 dark:bg-blue-950/20 border-blue-200";
      case "academic_research":
        return "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200";
      case "reference_encyclopedia":
        return "text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-200";
      default:
        return "text-[var(--text-muted)] bg-[var(--border)] border-[var(--border)]";
    }
  };

  const getClassificationLabel = (classification: string): string => {
    if (isRtl) {
      switch (classification) {
        case "owned": return "سایت ما (Owned)";
        case "competitor": return "رقیب (Competitor)";
        case "government": return "دولتی (Gov)";
        case "academic_research": return "دانشگاهی (Edu)";
        case "reference_encyclopedia": return "مرجع علمی (Wiki)";
        default: return "ثالث (Third-Party)";
      }
    }
    return classification.replace("_", " ");
  };

  return (
    <div className="space-y-6 animate-fade-in text-start pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-primary)] font-display flex items-center gap-2.5">
            <Link2 className="text-[var(--sky-blue-500)]" size={24} />
            <span>{isRtl ? "داشبورد هوشمندی استنادات (Citation Intelligence)" : "Citation Intelligence Dashboard"}</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-2xl leading-relaxed">
            {isRtl
              ? "تحلیل دامنه‌های مرجع استناد شده، بررسی ارزش و نمره کیفیت مراجع، محاسبه خودکار سهم استنادات برند شما و شناسایی شکاف‌های رقابتی."
              : "Enterprise citation engine to discover, classify, evaluate quality, and track domain authority trends across conversational answers."}
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

          {/* Top Panel: Citation Share and Gap Recommendations (Task 4.4) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Citation Share Gauge */}
            <Card className="border border-[var(--border)] bg-[var(--card)] rounded-xl flex flex-col justify-between">
              <CardHeader className="border-b border-[var(--border)]/50 pb-3">
                <CardTitle className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                  <Percent size={14} className="text-[var(--sky-blue-500)]" />
                  <span>{isRtl ? "سهم استنادات (Citation Share)" : "Citation Share Matrix"}</span>
                </CardTitle>
                <CardDescription className="text-[10px]">
                  {isRtl ? "سهم مراجع متعلق به برند ما در مقایسه با رقبا" : "Share of voice calculated across total cited URLs"}
                </CardDescription>
              </CardHeader>
              <CardContent className="py-6 flex flex-col justify-center items-center flex-grow space-y-4">
                {share && (
                  <div className="w-full space-y-3.5">
                    {[
                      { label: isRtl ? "سهم برند ما" : "Owned Brand Share", percent: share.brandShare, color: "bg-emerald-500" },
                      { label: isRtl ? "سهم رقبا" : "Competitor Share", percent: share.competitorShare, color: "bg-red-500" },
                      { label: isRtl ? "دامنه‌های ثالث" : "Third Party Share", percent: share.otherShare, color: "bg-[var(--sky-blue-500)]" }
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>{item.label}</span>
                          <span className="font-bold">{item.percent}%</span>
                        </div>
                        <div className="w-full bg-[var(--border)]/50 rounded-full h-1.5 overflow-hidden">
                          <div className={`${item.color} h-1.5 rounded-full`} style={{ width: `${item.percent}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Citation Gaps Recommendations Panel (Task 4.4 integration point) */}
            <Card className="lg:col-span-2 border border-[var(--border)] bg-[var(--card)] rounded-xl flex flex-col justify-between">
              <CardHeader className="border-b border-[var(--border)]/50 pb-3">
                <CardTitle className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2 text-amber-500">
                  <AlertTriangle size={14} />
                  <span>{isRtl ? "شکاف‌های استنادی رقابتی (Citation Gaps - Task 4.4)" : "Actionable Citation Gaps"}</span>
                </CardTitle>
                <CardDescription className="text-[10px]">
                  {isRtl ? "سیگنال‌های استخراج شده برای موتور پیشنهادها" : "High-authority sources citing competitors but omitting our owned brand"}
                </CardDescription>
              </CardHeader>
              <CardContent className="py-4 flex-grow text-xs space-y-3 overflow-y-auto max-h-60 text-start">
                {gaps.length === 0 ? (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-lg font-semibold">
                    <CheckCircle size={16} />
                    <span>{isRtl ? "عالی! هیچ شکاف استنادی بحرانی با مراجع رقیب یافت نشد." : "Great! No critical citation gaps detected with competitors."}</span>
                  </div>
                ) : (
                  gaps.map((gap, gIdx) => (
                    <div key={gIdx} className="p-3 bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900 rounded-xl flex items-start gap-3">
                      <ShieldCheck className="text-amber-500 shrink-0 mt-0.5" size={16} />
                      <div className="space-y-1">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <span className="font-bold text-[var(--text-primary)] font-mono">{gap.domain}</span>
                          <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded text-[8px] font-black uppercase font-mono">
                            {isRtl ? "اعتبار: " : "Authority: "}{gap.authorityScore}
                          </span>
                        </div>
                        <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                          {isRtl
                            ? `مرجع با اعتبار بالا رقیب (${gap.competitorName}) را ذکر کرده اما وب‌سایت شما فاقد ارجاع در آن است.`
                            : `Competitor (${gap.competitorName}) is cited on this high-authority source while your brand lacks any coverage.`}
                        </p>
                        <p className="text-[9px] text-[var(--text-muted)] italic font-mono pt-1 border-t border-[var(--border)]/10">
                          "{gap.evidenceSnippet}"
                        </p>
                      </div>
                    </div>
                  ))
                )}

                {/* Integration with Task 4.4 alert */}
                <div className="p-2.5 bg-[var(--border)]/20 rounded-lg flex items-center justify-between text-[10px] font-semibold text-[var(--text-secondary)]">
                  <span>
                    {isRtl ? "سیگنال خلاها به صورت مستقیم به موتور پیشنهادها پمپاژ می‌شود." : "Signals are actively fed into Recommendation Engine."}
                  </span>
                  <ArrowUpRight size={14} className="text-[var(--text-muted)]" />
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Citation Source Matrix Table */}
          <Card className="border border-[var(--border)] bg-[var(--card)] rounded-xl">
            <CardHeader className="border-b border-[var(--border)]/50 pb-3.5">
              <CardTitle className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                <List size={14} className="text-[var(--sky-blue-500)]" />
                <span>{isRtl ? "جدول جامع مراجع استنادی پایش شده" : "Citation Sources Matrix"}</span>
              </CardTitle>
              <CardDescription className="text-[10px]">
                {isRtl ? "کل دامنه‌های استخراج شده به همراه نمره‌های ارزش‌گذاری مستقل" : "Normalized unique cited domains with independently evaluated Quality and Authority metrics"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto text-start">
              <table className="w-full text-left border-collapse text-xs font-semibold">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--border)]/10 text-[var(--text-muted)] font-bold">
                    <th className="p-3 font-mono">{isRtl ? "دامنه مرجع" : "Domain"}</th>
                    <th className="p-3">{isRtl ? "دسته‌بندی مرجع" : "Classification"}</th>
                    <th className="p-3 text-center">{isRtl ? "کیفیت استناد" : "Quality Score"}</th>
                    <th className="p-3 text-center">{isRtl ? "اعتبار دامنه" : "Internal Authority"}</th>
                    <th className="p-3 text-center">{isRtl ? "تعداد تکرار" : "Appearances"}</th>
                    <th className="p-3 text-right">{isRtl ? "آخرین پایش" : "Last Seen"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]/40 font-medium">
                  {sources.map((src) => (
                    <tr key={src.id} className="hover:bg-[var(--border)]/10 transition-colors">
                      <td className="p-3 font-mono text-[var(--text-primary)] font-bold">{src.domain}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] border font-bold capitalize ${getClassificationBadge(src.classification)}`}>
                          {getClassificationLabel(src.classification)}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold text-[var(--text-primary)]">{src.qualityScore}%</td>
                      <td className="p-3 text-center font-bold text-[var(--text-primary)]">{src.authorityScore}/100</td>
                      <td className="p-3 text-center font-black text-[var(--sky-blue-500)]">{src.occurrenceCount}</td>
                      <td className="p-3 text-right text-[10px] text-[var(--text-muted)] font-mono">
                        {new Date(src.lastSeenAt).toLocaleDateString(isRtl ? "fa-IR" : "en-US")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Citation Trends Line Overviews */}
          <Card className="border border-[var(--border)] bg-[var(--card)] rounded-xl">
            <CardHeader className="border-b border-[var(--border)]/50 pb-3">
              <CardTitle className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                <TrendingUp size={14} className="text-[var(--sky-blue-500)]" />
                <span>{isRtl ? "روند تغییرات تکرار استنادات (۷ روز گذشته)" : "Temporal Citation Appearance Trends (Last 7 Days)"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="py-6 text-start">
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {trends.map((t, idx) => (
                  <div key={idx} className="p-3 bg-[var(--border)]/20 border border-[var(--border)]/40 rounded-xl text-center space-y-1.5 flex flex-col justify-between">
                    <div className="text-[10px] font-bold text-[var(--text-muted)] font-mono">{t.date}</div>
                    <div className="space-y-1">
                      <div className="text-lg font-black text-[var(--text-primary)]">{t.total}</div>
                      <div className="flex justify-center gap-2 text-[8px] font-mono font-bold">
                        <span className="text-emerald-500">{isRtl ? "ما:" : "Owned:"}{t.owned}</span>
                        <span className="text-red-500">{isRtl ? "رقبا:" : "Comp:"}{t.competitor}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  );
}
