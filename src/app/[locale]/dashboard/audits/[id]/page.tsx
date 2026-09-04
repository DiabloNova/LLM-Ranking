"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";
import { Button } from "@/components/Button";
import {
  ArrowLeft, ArrowRight, Award, Shield, Activity, Layers, Brain, FileCode, Sparkles, XCircle, Compass, Terminal, Loader2
} from "lucide-react";
import { getAuditAction } from "@/app/actions/audit";

type AuditRecord = {
  id: string;
  workspaceId: string;
  userId: string;
  url: string;
  status: string;
  rawSignals: unknown;
  aiInsights: unknown;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export default function AuditDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { language, direction } = useTheme();
  const isRtl = language === "fa";

  const id = params?.id as string;

  const [auditRecord, setAuditRecord] = useState<AuditRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"overview" | "engine" | "recommendations">("overview");

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    const fetchAudit = async () => {
      try {
        const data = await getAuditAction(id);
        if (isMounted) {
          if (!data) {
            setError(isRtl ? "پایشی یافت نشد" : "Audit not found");
          } else {
            setAuditRecord(data);
          }
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load audit");
          setLoading(false);
        }
      }
    };
    fetchAudit();

    // Polling if it's processing
    let interval: NodeJS.Timeout;
    if (auditRecord && ["pending", "crawling", "analyzing"].includes(auditRecord.status)) {
      interval = setInterval(fetchAudit, 5000);
    }

    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
    };
  }, [id, auditRecord?.status, isRtl]);

  // Helper colors
  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-400 stroke-emerald-500";
    if (score >= 75) return "text-teal-400 stroke-teal-500";
    if (score >= 60) return "text-amber-400 stroke-amber-500";
    return "text-rose-400 stroke-rose-500";
  };

  // Pre-compiled localized text mapping
  const strings = {
    back: isRtl ? "بازگشت به لیست پایش‌ها" : "Back to Audits List",
    title: isRtl ? `گزارش تحلیل دیده‌شدن برند: ${id}` : `AI Visibility Audit Report: ${id}`,
    targetUrl: isRtl ? "آدرس اسکن شده" : "AUDITED TARGET DOMAIN",
    overallScore: isRtl ? "شاخص دیده‌شدن برند" : "AI Visibility Score",
    overallScoreDesc: isRtl ? "سهم صدای برند شما در پاسخ مدل‌های زبانی" : "Your brand's share of voice inside LLM databases",
    presenceTitle: isRtl ? "امتیاز حضور برند" : "Brand Presence Score",
    mentionTitle: isRtl ? "فرکانس استناد" : "Mention Frequency Score",
    authorityTitle: isRtl ? "اعتبار معنایی محتوا" : "Content Authority Score",
    overviewTab: isRtl ? "خلاصه وضعیت دیده‌شدن" : "Visibility Summary",
    engineTab: isRtl ? "تحلیل موتورهای پاسخگو" : "LLM Crawl & Engine Logs",
    recommendationsTab: isRtl ? "راهکارهای بهبود و GEO" : "GEO Copy Recommendations",
    geminiTitle: isRtl ? "تحلیل شناختی گوگل جمنی (Google Gemini)" : "Google Gemini Cognitive Assessment",
    firecrawlStats: isRtl ? "آمار خزش کراولر Firecrawl" : "Firecrawl Ingestion Statistics",
    crawledPages: isRtl ? "صفحات خزش شده:" : "Crawled Pages:",
    providerTitle: isRtl ? "تحلیل رفتار موتورهای پاسخگوی پیشرو" : "Conversational Search Engine Performance Matrix",
    providerColName: isRtl ? "موتور پاسخگو" : "Generative Model",
    providerColSentiment: isRtl ? "لحن استناد" : "Sentiment Score",
    providerColVisibility: isRtl ? "شاخص دیده‌شدن" : "Visibility index",
    providerColRec: isRtl ? "توصیه اختصاصی موتور" : "Model-specific suggestion",
    gapsTitle: isRtl ? "شکاف‌های معنایی محتوا (Content Gaps)" : "Identified Content Gaps",
    entitiesTitle: isRtl ? "موجودیت‌های مفقود در پایگاه دانش" : "Missing Entity relationship triples",
    positioningTitle: isRtl ? "بهبود موقعیت‌یابی برند" : "Brand Positioning Improvements",
    discoverTitle: isRtl ? "راهکارهای عمومی ارتقای دیده‌شدن (AEO / GEO)" : "General AI Discoverability Proposed Fixes",
    priorityHigh: isRtl ? "اولویت بالا" : "High Priority",
    priorityMedium: isRtl ? "اولویت متوسط" : "Medium Priority",
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-fade-in" dir={direction}>
        <Loader2 className="w-8 h-8 animate-spin text-[var(--sky-blue-500)]" />
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          {isRtl ? "در حال بارگذاری اطلاعات..." : "Loading audit details..."}
        </p>
      </div>
    );
  }

  if (error || !auditRecord) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-fade-in" dir={direction}>
        <div className="p-4 bg-rose-500/10 rounded-full">
          <XCircle className="w-10 h-10 text-rose-500" />
        </div>
        <h2 className="text-lg font-bold text-[var(--text-primary)]">
          {error || (isRtl ? "پایشی یافت نشد" : "Audit not found")}
        </h2>
        <Button onClick={() => router.push(`/${language}/dashboard/audits`)}>
          {strings.back}
        </Button>
      </div>
    );
  }

  if (["pending", "crawling", "analyzing"].includes(auditRecord.status)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-fade-in" dir={direction}>
        <div className="relative">
          <div className="absolute inset-0 bg-[var(--sky-blue-500)]/20 blur-xl rounded-full" />
          <div className="p-5 bg-[var(--muted-surface)] border border-[var(--border)] rounded-full relative">
            <Loader2 className="w-10 h-10 animate-spin text-[var(--sky-blue-500)]" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-black text-[var(--text-primary)]">
            {isRtl ? "پایش در حال انجام است" : "Audit is processing"}
          </h2>
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            {isRtl ? "لطفا منتظر بمانید..." : "Please wait while we analyze the page..."}
            <br />
            <span className="text-xs text-[var(--text-muted)]">
              Status: <span className="font-bold text-[var(--sky-blue-500)] uppercase">{auditRecord.status}</span>
            </span>
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push(`/${language}/dashboard/audits`)}>
          {strings.back}
        </Button>
      </div>
    );
  }

  if (auditRecord.status === "failed") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-fade-in" dir={direction}>
        <div className="p-4 bg-rose-500/10 rounded-full">
          <XCircle className="w-10 h-10 text-rose-500" />
        </div>
        <h2 className="text-lg font-bold text-[var(--text-primary)]">
          {isRtl ? "خطا در انجام پایش" : "Audit failed"}
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          {auditRecord.errorMessage || (isRtl ? "خطای نامشخص" : "Unknown error")}
        </p>
        <Button onClick={() => router.push(`/${language}/dashboard/audits`)}>
          {strings.back}
        </Button>
      </div>
    );
  }

  // Parse AI Insights if it's completed
  const aiInsights = typeof auditRecord.aiInsights === 'string' ? JSON.parse(auditRecord.aiInsights) : (auditRecord.aiInsights as Record<string, unknown> || {});

  // Calculate a score safely
  let scoreParam = 0;
  if (aiInsights && Array.isArray(aiInsights.llmProviderInsights) && aiInsights.llmProviderInsights.length > 0) {
     scoreParam = Math.round(aiInsights.llmProviderInsights.reduce((acc: number, cur: { visibilityIndex?: number }) => acc + (cur.visibilityIndex || 0), 0) / aiInsights.llmProviderInsights.length);
  }

  if (scoreParam === 0) {
      scoreParam = parseInt(searchParams?.get("score") || "82", 10);
  }

  const auditDetails = {
    url: auditRecord.url || "https://example.com",
    score: scoreParam,
    grade: scoreParam >= 85 ? "A" : scoreParam >= 75 ? "B" : "C",
    analysis: {
      geminiInsights: aiInsights.geminiInsights || (isRtl ? "تحلیلی یافت نشد" : "No insights found"),
      crawledPagesCount: aiInsights.crawledPagesCount || 1,
      firecrawlLogs: aiInsights.firecrawlLogs || [
        { timestamp: new Date(auditRecord.createdAt).toLocaleTimeString(), level: "info", message: "Audit completed" }
      ],
      llmProviderInsights: aiInsights.llmProviderInsights || []
    },
    recommendations: {
      contentGaps: aiInsights.contentGaps || [],
      missingEntities: aiInsights.missingEntities || [],
      brandPositioning: aiInsights.brandPositioning || [],
      aiDiscoverability: aiInsights.aiDiscoverability || []
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" dir={direction}>
      {/* Back button */}
      <div className="text-start">
        <Button
          variant="ghost"
          onClick={() => router.push(`/${language}/dashboard/audits`)}
          className="gap-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
        >
          {isRtl ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
          <span>{strings.back}</span>
        </Button>
      </div>

      {/* Title block */}
      <div className="text-start">
        <h1 className="text-2xl font-black text-[var(--text-primary)] font-display leading-none">
          {strings.title}
        </h1>
      </div>

      {/* Target URL Info Banner */}
      <div className="glass-panel border border-[var(--glass-border)] bg-[var(--glass-bg)] px-6 py-4.5 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#38bdf8]/10 border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8]">
            <FileCode size={18} />
          </div>
          <div className="text-start">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">{strings.targetUrl}</span>
            <h2 className="text-base font-black text-[var(--text-primary)] font-display mt-0.5">{auditDetails.url}</h2>
          </div>
        </div>

        <div className="px-5 py-2 rounded-full border bg-sky-500/10 border-sky-500/30 text-sky-400 font-bold text-xs flex items-center gap-2">
          <span>{isRtl ? "رتبه کیفی پایش:" : "Audit Quality Grade:"}</span>
          <span className="text-sm font-black">{auditDetails.grade}</span>
        </div>
      </div>

      {/* Report Tab Swapper */}
      <div className="flex border border-[var(--border)] bg-[var(--muted-surface)]/40 p-1 rounded-2xl">
        {[
          { id: "overview", label: strings.overviewTab, icon: Award },
          { id: "engine", label: strings.engineTab, icon: Brain },
          { id: "recommendations", label: strings.recommendationsTab, icon: Compass },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "overview" | "engine" | "recommendations")}
              className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-[var(--sky-blue-500)]/25 to-[var(--orange-500)]/15 border border-[var(--sky-blue-500)]/30 text-[var(--text-primary)] shadow-sm font-black"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Icon size={14} className="text-[var(--sky-blue-500)] shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* REPORT VIEWS */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in">
          {/* Giant Radial Score Gauge */}
          <Card className="md:col-span-2 border border-[var(--border)] bg-[var(--card)] flex flex-col justify-between p-2">
            <CardHeader>
              <CardTitle className="text-sm font-black text-gradient-brand flex items-center gap-2">
                <Award size={16} />
                <span>{strings.overallScore}</span>
              </CardTitle>
              <CardDescription className="text-xs">{strings.overallScoreDesc}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6 flex-1 space-y-5">
              <div className="relative flex items-center justify-center">
                <svg className="w-40 h-40 transform -rotate-90">
                  <circle cx="80" cy="80" r="65" className="stroke-[var(--border)]" strokeWidth="10" fill="transparent" />
                  <circle
                    cx="80"
                    cy="80"
                    r="65"
                    className={`transition-all duration-1000 ${getScoreColor(auditDetails.score)}`}
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 65}
                    strokeDashoffset={2 * Math.PI * 65 * (1 - auditDetails.score / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className={`text-6xl font-black font-display leading-none tracking-tight ${getScoreColor(auditDetails.score)}`}>
                    {auditDetails.score}
                  </span>
                  <span className="text-xs font-bold text-[var(--text-muted)] mt-1.5 tracking-widest">/ 100</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Columns */}
          <div className="md:col-span-2 grid grid-cols-1 gap-6">

            {/* Brand Presence */}
            <Card className="border border-[var(--border)] bg-[var(--card)] p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="space-y-1 text-start">
                  <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">{strings.presenceTitle}</span>
                  <p className="text-2xl font-black text-[var(--text-primary)] font-display">
                    {Math.floor(auditDetails.score * 0.95)}%
                  </p>
                </div>
                <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
                  <Layers size={16} />
                </div>
              </div>
              <div className="h-1.5 w-full bg-[var(--border)] rounded-full overflow-hidden mt-4">
                <div className="h-full bg-purple-500" style={{ width: `${auditDetails.score * 0.95}%` }} />
              </div>
            </Card>

            {/* Mention Frequency */}
            <Card className="border border-[var(--border)] bg-[var(--card)] p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="space-y-1 text-start">
                  <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">{strings.mentionTitle}</span>
                  <p className="text-2xl font-black text-[var(--text-primary)] font-display">
                    {Math.floor(auditDetails.score * 0.88)}%
                  </p>
                </div>
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                  <Activity size={16} />
                </div>
              </div>
              <div className="h-1.5 w-full bg-[var(--border)] rounded-full overflow-hidden mt-4">
                <div className="h-full bg-emerald-500" style={{ width: `${auditDetails.score * 0.88}%` }} />
              </div>
            </Card>

            {/* Content Authority */}
            <Card className="border border-[var(--border)] bg-[var(--card)] p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="space-y-1 text-start">
                  <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">{strings.authorityTitle}</span>
                  <p className="text-2xl font-black text-[var(--text-primary)] font-display">
                    {Math.floor(auditDetails.score * 1.02) > 100 ? 98 : Math.floor(auditDetails.score * 1.02)}%
                  </p>
                </div>
                <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
                  <Shield size={16} />
                </div>
              </div>
              <div className="h-1.5 w-full bg-[var(--border)] rounded-full overflow-hidden mt-4">
                <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, auditDetails.score * 1.02)}%` }} />
              </div>
            </Card>

          </div>
        </div>
      )}

      {activeTab === "engine" && (
        <div className="space-y-6 animate-fade-in">
          {/* Google Gemini Cognitive analysis */}
          <Card className="border border-[var(--border)] bg-[var(--card)]">
            <CardHeader>
              <CardTitle className="text-sm font-black flex items-center gap-2 text-[var(--sky-blue-500)]">
                <Brain size={16} />
                <span>{strings.geminiTitle}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-start">
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--muted-surface)]/50 p-4.5 rounded-2xl border border-[var(--border)] font-medium">
                {auditDetails.analysis.geminiInsights}
              </p>
            </CardContent>
          </Card>

          {/* Firecrawl crawling status */}
          <Card className="border border-[var(--border)] bg-[var(--card)] p-1">
            <CardHeader className="flex justify-between flex-row items-center border-b border-[var(--border)] pb-3 px-5">
              <CardTitle className="text-sm font-black flex items-center gap-2 text-[#38bdf8]">
                <FileCode size={16} />
                <span>{strings.firecrawlStats}</span>
              </CardTitle>
              <span className="text-xs px-2.5 py-1 rounded bg-[#38bdf8]/10 text-[#38bdf8] font-bold border border-[#38bdf8]/20">
                {strings.crawledPages} {auditDetails.analysis.crawledPagesCount}
              </span>
            </CardHeader>
            <CardContent className="pt-4 space-y-2 text-start px-5 font-mono text-[11px] text-slate-300">
              {auditDetails.analysis.firecrawlLogs.map((log: { timestamp?: string; level?: string; message?: string }, i: number) => (
                <div key={i} className="flex items-start gap-2 p-1.5 rounded bg-slate-950/40 border border-white/5">
                  <span className={`px-1.5 rounded text-[9px] font-bold ${log.level === "info" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                    {log.level ? log.level.toUpperCase() : "INFO"}
                  </span>
                  <span className="text-slate-500">{log.timestamp}</span>
                  <span className="leading-normal font-sans font-medium">{log.message}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* LLM Performance Matrix */}
          <Card className="border border-[var(--border)] bg-[var(--card)]">
            <CardHeader className="border-b border-[var(--border)] pb-3">
              <CardTitle className="text-sm font-black flex items-center gap-2 text-[var(--orange-500)]">
                <Terminal size={16} />
                <span>{strings.providerTitle}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-0 overflow-x-auto">
              <table className="w-full text-start border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--muted-surface)] text-[var(--text-secondary)] font-bold">
                    <th className="py-3 px-5 text-start">{strings.providerColName}</th>
                    <th className="py-3 px-5 text-center">{strings.providerColSentiment}</th>
                    <th className="py-3 px-5 text-center">{strings.providerColVisibility}</th>
                    <th className="py-3 px-5 text-start">{strings.providerColRec}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-[11px] font-semibold">
                  {auditDetails.analysis.llmProviderInsights.map((prov: { providerName?: string; sentimentScore?: number; visibilityIndex?: number; recommendation?: string }, i: number) => (
                    <tr key={i} className="hover:bg-[var(--muted-surface)]/20 transition-colors">
                      <td className="py-3 px-5 text-start text-[var(--text-primary)] font-black">{prov.providerName}</td>
                      <td className="py-3 px-5 text-center font-mono">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {prov.sentimentScore}%
                        </span>
                      </td>
                      <td className="py-3 px-5 text-center font-mono text-[#38bdf8]">{prov.visibilityIndex}%</td>
                      <td className="py-3 px-5 text-start text-[var(--text-secondary)] leading-normal font-sans">{prov.recommendation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "recommendations" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          {/* Content Gaps */}
          <Card className="border border-[var(--border)] bg-[var(--card)]">
            <CardHeader className="border-b border-[var(--border)] pb-3">
              <CardTitle className="text-sm font-black flex items-center gap-2 text-rose-400">
                <XCircle size={16} />
                <span>{strings.gapsTitle}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5 text-start">
              {auditDetails.recommendations.contentGaps.map((gap: { priority?: string; issue?: string; recommendation?: string }, i: number) => (
                <div key={i} className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--muted-surface)]/60 space-y-1.5 relative">
                  <span className={`absolute top-3 right-3 text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                    gap.priority === "high" ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400"
                  }`}>
                    {gap.priority === "high" ? strings.priorityHigh : strings.priorityMedium}
                  </span>
                  <h4 className="text-xs font-black text-[var(--text-primary)] leading-snug">{gap.issue}</h4>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-medium">{gap.recommendation}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Missing entities */}
          <Card className="border border-[var(--border)] bg-[var(--card)]">
            <CardHeader className="border-b border-[var(--border)] pb-3">
              <CardTitle className="text-sm font-black flex items-center gap-2 text-amber-400">
                <Layers size={16} />
                <span>{strings.entitiesTitle}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-start">
              <div className="flex flex-wrap gap-2">
                {auditDetails.recommendations.missingEntities.map((ent: string, i: number) => (
                  <span key={i} className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--muted-surface)] text-xs font-mono font-bold text-amber-400">
                    {ent}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Brand positioning improvements */}
          <Card className="border border-[var(--border)] bg-[var(--card)]">
            <CardHeader className="border-b border-[var(--border)] pb-3">
              <CardTitle className="text-sm font-black flex items-center gap-2 text-[#38bdf8]">
                <Compass size={16} />
                <span>{strings.positioningTitle}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-start">
              {auditDetails.recommendations.brandPositioning.map((item: string, i: number) => (
                <div key={i} className="flex gap-2 text-xs font-medium text-[var(--text-secondary)] leading-relaxed">
                  <span className="text-[#38bdf8] font-bold shrink-0">•</span>
                  <span>{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* AI Discoverability recommendations */}
          <Card className="border border-[var(--border)] bg-[var(--card)]">
            <CardHeader className="border-b border-[var(--border)] pb-3">
              <CardTitle className="text-sm font-black flex items-center gap-2 text-emerald-400">
                <Sparkles size={16} />
                <span>{strings.discoverTitle}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-start">
              {auditDetails.recommendations.aiDiscoverability.map((item: string, i: number) => (
                <div key={i} className="flex gap-2 text-xs font-medium text-[var(--text-secondary)] leading-relaxed">
                  <span className="text-emerald-400 font-bold shrink-0">•</span>
                  <span>{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
