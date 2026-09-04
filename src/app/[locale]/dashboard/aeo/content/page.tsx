"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";
import {
  BookOpen,
  RefreshCw,
  Award,
  HelpCircle,
  AlertTriangle,
  CheckCircle,
  FileText,
  HelpCircle as QuestionIcon,
  Link2,
  List,
  GitBranch,
  Network,
  Compass,
  ArrowLeftRight,
  TrendingUp,
  Clock,
  Sparkles
} from "lucide-react";
import {
  getAeoContentDashboardDataAction,
  runAeoAnalysisForPageAction
} from "@/app/actions/aeo-content-intelligence";
import { Page, AeoAnalysis, FaqOpportunity, KgAlignment } from "@/features/ai-intelligence/domain/types";

export default function AeoContentIntelligenceDashboard() {
  const { language } = useTheme();
  const isRtl = language === "fa";

  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string>("");
  const [analyses, setAnalyses] = useState<AeoAnalysis[]>([]);
  const [faqOpportunities, setFaqOpportunities] = useState<FaqOpportunity[]>([]);
  const [kgAlignments, setKgAlignments] = useState<KgAlignment[]>([]);
  const [signals, setSignals] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load Dashboard Data on Mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await getAeoContentDashboardDataAction();
      if (res.success && "result" in res && res.result) {
        const { pages: pgs, analyses: anas, faqOpportunities: faqs, kgAlignments: kgs, recommendationSignals: sigs } = res.result;
        setPages(pgs);
        setAnalyses(anas);
        setFaqOpportunities(faqs);
        setKgAlignments(kgs);
        setSignals(sigs);

        if (pgs.length > 0) {
          setSelectedPageId(pgs[0].id);
        }
      } else {
        const errorVal = res.success === false ? (res as any).error : null;
        setErrorMsg(errorVal || (isRtl ? "خطا در بارگذاری اطلاعات هوشمندی محتوا" : "Failed to load AEO Content Intelligence data"));
      }
      setIsLoading(false);
    }
    loadData();
  }, [isRtl]);

  const activePage = pages.find(p => p.id === selectedPageId);
  const activeAnalysis = analyses.find(a => a.pageId === selectedPageId);

  const handlePageChange = (pageId: string) => {
    setSelectedPageId(pageId);
    setErrorMsg(null);
  };

  const handleRunAnalysis = () => {
    if (!selectedPageId) return;
    setErrorMsg(null);

    startTransition(async () => {
      const res = await runAeoAnalysisForPageAction(selectedPageId);
      if (res.success && "result" in res && res.result) {
        const updatedAnalysis = res.result;
        setAnalyses(prev => prev.map(a => a.pageId === selectedPageId ? updatedAnalysis : a));

        // Reload dashboard to refresh opportunities and KG alignments
        const dashboardRes = await getAeoContentDashboardDataAction();
        if (dashboardRes.success && "result" in dashboardRes && dashboardRes.result) {
          setFaqOpportunities(dashboardRes.result.faqOpportunities);
          setKgAlignments(dashboardRes.result.kgAlignments);
          setSignals(dashboardRes.result.recommendationSignals);
        }
      } else {
        const errorVal = res.success === false ? (res as any).error : null;
        setErrorMsg(errorVal || (isRtl ? "اجرای تحلیل محتوا با خطا مواجه شد." : "AEO Content analysis failed."));
      }
    });
  };

  const getLetterGrade = (score: number | null): string => {
    if (score === null) return "-";
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  };

  const getGradeColor = (score: number | null): string => {
    if (score === null) return "text-[var(--text-muted)]";
    if (score >= 85) return "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20";
    if (score >= 70) return "text-[var(--sky-blue-500)] bg-[var(--sky-blue-500)]/10";
    return "text-amber-500 bg-amber-50 dark:bg-amber-950/20";
  };

  return (
    <div className="space-y-6 animate-fade-in text-start">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-primary)] font-display flex items-center gap-2.5">
            <BookOpen className="text-[var(--sky-blue-500)]" size={24} />
            <span>{isRtl ? "هوشمندی محتوای AEO" : "AEO Content Intelligence"}</span>
            <span className="px-2.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-[var(--sky-blue-500)] to-blue-600 text-white rounded-full uppercase tracking-wider">
              Task 5.4 Active
            </span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-2xl leading-relaxed">
            {isRtl
              ? "پلتفرم پیشرفته تحلیل و ارزیابی آمادگی محتوای وب‌سایت برای هوش مصنوعی. بررسی قابلیت پاسخ‌دهی، جفت‌سازی سوالات، ساختاریافتگی، همترازی گراف دانش و فرصت‌های FAQ."
              : "Enterprise-grade suite designed to measure page answerability, semantic structures, entity coverage, and Knowledge Graph alignments."}
          </p>
        </div>

        {/* Page Selector & Action Trigger */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1">
              {isRtl ? "انتخاب صفحه" : "Select Page"}
            </label>
            <select
              value={selectedPageId}
              onChange={(e) => handlePageChange(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--sky-blue-500)] font-semibold"
              disabled={isLoading || isPending}
            >
              {pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.path} ({p.title ? p.title.substring(0, 20) : p.url})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleRunAnalysis}
            disabled={isLoading || isPending || !selectedPageId}
            className="flex items-center gap-2 px-4 py-2 mt-4 bg-[var(--sky-blue-500)] hover:bg-[var(--sky-blue-600)] disabled:opacity-50 text-white rounded-lg text-xs font-black shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
            <span>{isRtl ? "تحلیل مجدد محتوا" : "Re-run Content Analysis"}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg text-xs text-red-600 flex items-center gap-2 font-medium">
          <AlertTriangle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Loading Placeholder */}
      {isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="lg:col-span-1 h-80 bg-[var(--border)]/30 rounded-xl"></div>
          <div className="lg:col-span-2 h-80 bg-[var(--border)]/30 rounded-xl"></div>
        </div>
      )}

      {/* Main Content Layout */}
      {!isLoading && activePage && activeAnalysis && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Column: Overall AEO Score and Action Engine Alerts */}
            <div className="space-y-6">
              <Card className="border border-[var(--border)] bg-[var(--card)] rounded-xl">
                <CardHeader className="border-b border-[var(--border)]/50 pb-4">
                  <CardTitle className="text-sm font-black text-[var(--text-primary)] flex items-center gap-2">
                    <Award size={16} className="text-[var(--sky-blue-500)]" />
                    <span>{isRtl ? "نمره آمادگی AEO محتوا" : "AEO Content Readiness Score"}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-6 flex flex-col items-center justify-center space-y-4">
                  <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-4 border-[var(--border)]">
                    <div className="text-center">
                      <span className="text-3xl font-black text-[var(--text-primary)]">
                        {activeAnalysis.overallScore}%
                      </span>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] mt-0.5">
                        {isRtl ? "نمره کیفیت" : "Readiness"}
                      </div>
                    </div>
                    <span className={`absolute -bottom-2 px-3 py-0.5 text-[10px] font-black rounded-full border border-[var(--border)] shadow-sm ${getGradeColor(activeAnalysis.overallScore)}`}>
                      {isRtl ? "رتبه " : "Grade "}
                      {getLetterGrade(activeAnalysis.overallScore)}
                    </span>
                  </div>

                  <div className="text-center max-w-xs text-[11px] text-[var(--text-secondary)] leading-relaxed">
                    {isRtl
                      ? "این نمره بیانگر انطباق همه‌جانبه ساختارهای محتوایی با مدل‌های تحلیل هوش مصنوعی است."
                      : "Aggregated using deterministic rules for answerability, entities, semantic concepts, and citations."}
                  </div>
                </CardContent>
              </Card>

              {/* Task 4.4 Recommendations Integration Signals */}
              <Card className="border border-[var(--border)] bg-[var(--card)] rounded-xl">
                <CardHeader className="border-b border-[var(--border)]/50 pb-4">
                  <CardTitle className="text-sm font-black text-[var(--text-primary)] flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-500" />
                    <span>{isRtl ? "سیگنال‌های موتور پیشنهادها (Task 4.4)" : "Action Engine Alert Signals"}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-4 space-y-3">
                  {signals.filter(s => s.pageId === selectedPageId).length > 0 ? (
                    signals.filter(s => s.pageId === selectedPageId).map((sig, idx) => (
                      <div key={idx} className="p-3 bg-[var(--border)]/20 border border-[var(--border)] rounded-lg space-y-1">
                        <div className="flex justify-between items-center text-[10px] uppercase font-bold">
                          <span className={sig.level === "warning" ? "text-amber-500" : "text-[var(--sky-blue-500)]"}>
                            {sig.level === "warning" ? (isRtl ? "هشدار فنی" : "Warning") : (isRtl ? "فرصت ارتقا" : "Opportunity")}
                          </span>
                          <span className="font-mono text-[9px] text-[var(--text-muted)]">{sig.code}</span>
                        </div>
                        <p className="text-[11px] text-[var(--text-primary)] leading-relaxed font-semibold">
                          {sig.message}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-xs text-[var(--text-muted)] italic">
                      {isRtl ? "هیچ سیگنال هشداردهنده‌ای ثبت نشده است. همه‌چیز عالی است!" : "No critical alert signals detected."}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Detailed Breakdown (Answerability, Entities, FAQ, KG, etc) */}
            <div className="lg:col-span-2 space-y-6">

              {/* Answerability Card */}
              <Card className="border border-[var(--border)] bg-[var(--card)] rounded-xl">
                <CardHeader className="border-b border-[var(--border)]/50 pb-4">
                  <CardTitle className="text-sm font-black text-[var(--text-primary)] flex items-center gap-2">
                    <FileText size={16} className="text-[var(--sky-blue-500)]" />
                    <span>{isRtl ? "قابلیت پاسخ‌دهی کلامی (Answerability)" : "Conversational Answerability"}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-4 space-y-3 text-xs">
                  <div className="flex justify-between items-center p-2.5 bg-[var(--border)]/30 rounded-lg">
                    <span className="font-bold text-[var(--text-primary)]">{isRtl ? "سطح پاسخ‌دهی محتوا:" : "Answerability level:"}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[var(--sky-blue-500)]/10 text-[var(--sky-blue-500)]">
                      {activeAnalysis.answerability.level.replace("_", " ")}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-emerald-500">{isRtl ? "ابعاد پوشش داده شده:" : "Covered dimensions:"}</span>
                      <span className="font-bold text-red-500">{isRtl ? "ابعاد مفقود شده:" : "Missing dimensions:"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-lg space-y-1">
                        {activeAnalysis.answerability.coveredDimensions.length > 0 ? (
                          activeAnalysis.answerability.coveredDimensions.map((d, i) => (
                            <div key={i} className="flex items-center gap-1">
                              <CheckCircle size={10} className="text-emerald-500" />
                              <span>{d}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-[var(--text-muted)] italic">{isRtl ? "هیچ بعدی" : "none"}</div>
                        )}
                      </div>
                      <div className="p-2 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 rounded-lg space-y-1">
                        {activeAnalysis.answerability.missingDimensions.length > 0 ? (
                          activeAnalysis.answerability.missingDimensions.map((d, i) => (
                            <div key={i} className="flex items-center gap-1">
                              <AlertTriangle size={10} className="text-red-500 animate-pulse" />
                              <span>{d}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-[var(--text-muted)] italic">{isRtl ? "بدون مورد مفقودی" : "none"}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-2 bg-[var(--border)]/10 border border-[var(--border)] rounded-lg text-[var(--text-secondary)] font-mono text-[11px] leading-relaxed">
                    <strong>{isRtl ? "شواهد متنی:" : "Evidence excerpt:"}</strong> {activeAnalysis.answerability.evidence}
                  </div>
                </CardContent>
              </Card>

              {/* Semantic Concept Coverage (Anti-shortcut proof) */}
              <Card className="border border-[var(--border)] bg-[var(--card)] rounded-xl">
                <CardHeader className="border-b border-[var(--border)]/50 pb-4">
                  <CardTitle className="text-sm font-black text-[var(--text-primary)] flex items-center gap-2">
                    <GitBranch size={16} className="text-[var(--sky-blue-500)]" />
                    <span>{isRtl ? "پوشش مفاهیم معنایی (Semantic Coverage)" : "Semantic Coverage (Anti-Spam Proof)"}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-4 space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[var(--text-primary)]">{isRtl ? "امتیاز غنای مفهومی:" : "Conceptual score:"}</span>
                    <span className="font-black text-sm text-[var(--sky-blue-500)]">{activeAnalysis.semanticCoverage.score}%</span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="font-bold text-[var(--text-primary)]">{isRtl ? "مفاهیم معنایی کشف شده:" : "Concepts fully expressed in sentences:"}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeAnalysis.semanticCoverage.conceptsCovered.map((c, i) => (
                        <span key={i} className="px-2 py-0.5 bg-[var(--border)] border border-[var(--border)] rounded text-[10px] font-mono text-[var(--text-primary)]">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {activeAnalysis.semanticCoverage.gapsIdentified.length > 0 && (
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 text-amber-700 dark:text-amber-300 rounded-lg space-y-1">
                      <strong className="block text-[11px]">{isRtl ? "شکاف‌های مفهومی شناسایی شده:" : "Identified Semantic Gaps:"}</strong>
                      <ul className="list-disc list-inside text-[10px] space-y-0.5 pl-1 font-mono">
                        {activeAnalysis.semanticCoverage.gapsIdentified.map((g, i) => (
                          <li key={i}>{g}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Entity Coverage */}
              <Card className="border border-[var(--border)] bg-[var(--card)] rounded-xl">
                <CardHeader className="border-b border-[var(--border)]/50 pb-4">
                  <CardTitle className="text-sm font-black text-[var(--text-primary)] flex items-center gap-2">
                    <Network size={16} className="text-[var(--sky-blue-500)]" />
                    <span>{isRtl ? "پوشش موجودیت‌های معنایی (Entity Coverage)" : "Entity Coverage"}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-4 space-y-3 text-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="border-b border-[var(--border)] text-[var(--text-muted)] font-bold">
                          <th className="py-2">{isRtl ? "موجودیت" : "Entity"}</th>
                          <th className="py-2">{isRtl ? "نوع" : "Type"}</th>
                          <th className="py-2">{isRtl ? "وضعیت پوشش" : "Status"}</th>
                          <th className="py-2">{isRtl ? "شواهد و تمایز" : "Detailed Evidence"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeAnalysis.entityCoverage.map((ent, idx) => (
                          <tr key={idx} className="border-b border-[var(--border)]/30 hover:bg-[var(--border)]/10">
                            <td className="py-2 font-bold text-[var(--text-primary)]">{ent.name}</td>
                            <td className="py-2 font-mono text-[10px]">{ent.type}</td>
                            <td className="py-2">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                ent.status === "covered" ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500" :
                                ent.status === "partially_covered" ? "bg-blue-50 dark:bg-blue-950/20 text-blue-500" :
                                ent.status === "mentioned_only" ? "bg-amber-50 dark:bg-amber-950/20 text-amber-500" :
                                "bg-red-50 dark:bg-red-950/20 text-red-500"
                              }`}>
                                {ent.status.replace("_", " ")}
                              </span>
                            </td>
                            <td className="py-2 text-[var(--text-secondary)] italic text-[10px]">{ent.evidence}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Question Coverage */}
              <Card className="border border-[var(--border)] bg-[var(--card)] rounded-xl">
                <CardHeader className="border-b border-[var(--border)]/50 pb-4">
                  <CardTitle className="text-sm font-black text-[var(--text-primary)] flex items-center gap-2">
                    <QuestionIcon size={16} className="text-[var(--sky-blue-500)]" />
                    <span>{isRtl ? "پوشش سوالات شبیه‌سازی شده (Question Coverage)" : "Prompt & Question Coverage"}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-4 space-y-3 text-xs">
                  <div className="flex justify-between items-center text-[11px] p-2 bg-[var(--border)]/20 rounded">
                    <span>{isRtl ? "منبع پرسش‌ها:" : "Question universe source:"}</span>
                    <span className="font-mono font-bold text-[var(--text-primary)]">{activeAnalysis.questionCoverage.questionUniverseType}</span>
                  </div>

                  <div className="space-y-2">
                    {activeAnalysis.questionCoverage.items.map((item, i) => (
                      <div key={i} className="p-2.5 bg-[var(--card)] border border-[var(--border)] rounded-lg space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[var(--text-primary)]">{item.question}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                            item.status === "answered" ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500" : "bg-red-50 dark:bg-red-950/20 text-red-500"
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-[var(--text-secondary)] italic leading-relaxed">
                          {item.evidence}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Citation Readiness */}
              <Card className="border border-[var(--border)] bg-[var(--card)] rounded-xl">
                <CardHeader className="border-b border-[var(--border)]/50 pb-4">
                  <CardTitle className="text-sm font-black text-[var(--text-primary)] flex items-center gap-2">
                    <Link2 size={16} className="text-[var(--sky-blue-500)]" />
                    <span>{isRtl ? "قابلیت و آمادگی ارجاع استنادی (Citation Readiness)" : "Citation Readiness Characteristics"}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-4 space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[var(--text-primary)]">{isRtl ? "سطح آمادگی استناد:" : "Citation potential level:"}</span>
                    <span className="px-2 py-0.5 bg-[var(--sky-blue-500)]/10 text-[var(--sky-blue-500)] font-black rounded uppercase text-[10px]">
                      {activeAnalysis.citationReadiness.level}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-[10px] font-semibold">
                    {[
                      { label: isRtl ? "ادعاهای فکچوال و واقعی" : "Factual claims", ok: activeAnalysis.citationReadiness.hasFactualClaims },
                      { label: isRtl ? "پاسخ‌های صریح و خلاصه" : "Concise answers", ok: activeAnalysis.citationReadiness.hasConciseAnswerBlock },
                      { label: isRtl ? "انتساب صریح منبع" : "Source attribution", ok: activeAnalysis.citationReadiness.hasSourceAttribution },
                      { label: isRtl ? "نام نویسنده/کارشناس" : "Author info", ok: activeAnalysis.citationReadiness.hasAuthorInfo },
                      { label: isRtl ? "تاریخ بروزرسانی" : "Publication date", ok: activeAnalysis.citationReadiness.hasPublicationDate },
                      { label: isRtl ? "آدرس اینترنتی یکتا" : "Canonical URL", ok: activeAnalysis.citationReadiness.hasCanonicalUrl }
                    ].map((item, idx) => (
                      <div key={idx} className={`p-2 border rounded-lg flex items-center gap-1.5 ${item.ok ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200" : "bg-[var(--border)]/20 border-[var(--border)]"}`}>
                        <span className={item.ok ? "text-emerald-500" : "text-[var(--text-muted)]"}>
                          {item.ok ? "✓" : "✗"}
                        </span>
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>

                  <p className="p-2.5 bg-[var(--border)]/10 border border-[var(--border)] rounded-lg italic text-[11px] text-[var(--text-secondary)] font-mono">
                    {activeAnalysis.citationReadiness.evidence}
                  </p>
                </CardContent>
              </Card>

              {/* Structured Answer Quality */}
              <Card className="border border-[var(--border)] bg-[var(--card)] rounded-xl">
                <CardHeader className="border-b border-[var(--border)]/50 pb-4">
                  <CardTitle className="text-sm font-black text-[var(--text-primary)] flex items-center gap-2">
                    <List size={16} className="text-[var(--sky-blue-500)]" />
                    <span>{isRtl ? "کیفیت ساختار محتوایی (Structured Answers)" : "Semantic HTML & Structured Answers"}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-4 space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[var(--text-primary)]">{isRtl ? "امتیاز کیفیت ساختار:" : "Structure score:"}</span>
                    <span className="font-black text-[var(--sky-blue-500)]">{activeAnalysis.structuredAnswerQuality.score}%</span>
                  </div>

                  <div className="space-y-1.5">
                    {[
                      { label: isRtl ? "رعایت تگ‌های سلسله‌مراتبی عناوین" : "Heading tags ok", ok: activeAnalysis.structuredAnswerQuality.headingHierarchyOk, text: activeAnalysis.structuredAnswerQuality.findings.headingStructure },
                      { label: isRtl ? "پاسخ مستقیم کلامی" : "Direct answers ok", ok: activeAnalysis.structuredAnswerQuality.hasDirectAnswerParagraphs, text: activeAnalysis.structuredAnswerQuality.findings.answerDirectness },
                      { label: isRtl ? "بهره‌گیری از لیست‌های بالت‌دار" : "List structure", ok: activeAnalysis.structuredAnswerQuality.hasLists, text: activeAnalysis.structuredAnswerQuality.findings.listQuality },
                      { label: isRtl ? "بهره‌گیری از جداول داده" : "Tables present", ok: activeAnalysis.structuredAnswerQuality.hasTables, text: activeAnalysis.structuredAnswerQuality.findings.tableQuality },
                      { label: isRtl ? "تعاریف صریح و واژه‌نامه" : "Definitions present", ok: activeAnalysis.structuredAnswerQuality.hasDefinitions, text: activeAnalysis.structuredAnswerQuality.findings.definitionQuality },
                      { label: isRtl ? "ساختار جفت‌سازی سوال و پاسخ (FAQ)" : "FAQ Q&A structure", ok: activeAnalysis.structuredAnswerQuality.hasFAQStructure, text: activeAnalysis.structuredAnswerQuality.findings.questionAnswerPairing }
                    ].map((item, idx) => (
                      <div key={idx} className="p-2 border border-[var(--border)]/40 rounded-lg space-y-0.5">
                        <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
                          <span className={item.ok ? "text-emerald-500" : "text-amber-500"}>
                            {item.ok ? "✓" : "!"}
                          </span>
                          <span>{item.label}</span>
                        </div>
                        <p className="text-[10px] text-[var(--text-secondary)] pl-4">
                          {item.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Bidirectional Knowledge Graph Alignment */}
              <Card className="border border-[var(--border)] bg-[var(--card)] rounded-xl">
                <CardHeader className="border-b border-[var(--border)]/50 pb-4">
                  <CardTitle className="text-sm font-black text-[var(--text-primary)] flex items-center gap-2">
                    <ArrowLeftRight size={16} className="text-[var(--sky-blue-500)]" />
                    <span>{isRtl ? "همترازی دوطرفه گراف دانش (Knowledge Graph Alignment)" : "Bidirectional Knowledge Graph Alignment"}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-4 space-y-3 text-xs">
                  <div className="flex justify-between items-center text-[11px] p-2 bg-[var(--border)]/20 rounded">
                    <span>{isRtl ? "امتیاز انطباق با گراف دانش:" : "KG alignment score:"}</span>
                    <span className="font-bold text-[var(--sky-blue-500)]">{activeAnalysis.kgAlignment.score}%</span>
                  </div>

                  <div className="space-y-2">
                    {activeAnalysis.kgAlignment.items.map((item, i) => (
                      <div key={i} className="p-2.5 bg-[var(--card)] border border-[var(--border)] rounded-lg space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[var(--text-primary)]">
                            {item.alignmentType === "kg_to_content" ? (isRtl ? "گراف دانش ← محتوا" : "Knowledge Graph → Content") : (isRtl ? "محتوا ← گراف دانش" : "Content → Knowledge Graph")}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                            item.status === "aligned" ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500" : "bg-red-50 dark:bg-red-950/20 text-red-500"
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        <div className="text-[10px] text-[var(--text-secondary)] space-y-1">
                          <div className="flex justify-between">
                            <span>{isRtl ? "موجودیت معنایی:" : "Entity Name:"}</span>
                            <span className="font-bold font-mono">{item.entityName}</span>
                          </div>
                          <p className="italic pt-1 border-t border-[var(--border)]/30 mt-1 font-mono">
                            {item.evidence}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* FAQ Opportunities Portfolio */}
              <Card className="border border-[var(--border)] bg-[var(--card)] rounded-xl">
                <CardHeader className="border-b border-[var(--border)]/50 pb-4">
                  <CardTitle className="text-sm font-black text-[var(--text-primary)] flex items-center gap-2">
                    <Clock size={16} className="text-[var(--sky-blue-500)]" />
                    <span>{isRtl ? "فرصت‌های استخراج شده سوالات متداول (FAQ Opportunities)" : "FAQ Opportunities Portfolio"}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-4 space-y-3 text-xs">
                  {faqOpportunities.filter(f => f.pageId === selectedPageId).length > 0 ? (
                    faqOpportunities.filter(f => f.pageId === selectedPageId).map((faq, i) => (
                      <div key={i} className="p-3 bg-[var(--border)]/20 border border-[var(--border)] rounded-lg space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[var(--text-primary)]">{faq.question}</span>
                          <span className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 text-[8px] font-bold rounded uppercase">
                            {faq.priority}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px] text-[var(--text-secondary)] font-mono">
                          <span>{isRtl ? "منبع:" : "Source:"} {faq.sourceType.replace("_", " ")}</span>
                          <span>{isRtl ? "تاثیر پیش‌بینی شده:" : "Impact lift:"} +{faq.impactScore}%</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-[var(--text-muted)] italic">
                      {isRtl ? "هیچ فرصتی کشف نشده است." : "No FAQ opportunities found."}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Traceable Evidence Tree Panel */}
              <Card className="border border-[var(--border)] bg-[var(--card)] rounded-xl">
                <CardHeader className="border-b border-[var(--border)]/50 pb-4">
                  <CardTitle className="text-sm font-black text-[var(--text-primary)] flex items-center gap-2">
                    <GitBranch size={16} className="text-[var(--sky-blue-500)]" />
                    <span>{isRtl ? "شجره‌نامه ارزیابی و مراجع استنادی (Traceable Evidence)" : "Traceable Evidence Tree"}</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {isRtl ? "«چرا این صفحه این نمره را دریافت کرد؟» - رهگیری از نمره نهایی تا شواهد کلامی" : "\"Why did this page receive this score?\" - audit trail tracing contributing parameters"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-4 space-y-3 text-xs leading-relaxed font-mono">
                  <div className="space-y-2 border-l-2 border-dashed border-[var(--sky-blue-500)] pl-4 ml-2">
                    <div className="space-y-1">
                      <span className="font-bold text-[var(--text-primary)]">
                        [Level 1] Final Aggregate AEO Score: {activeAnalysis.overallScore}%
                      </span>
                      <p className="text-[10px] text-[var(--text-secondary)]">
                        Calculated using deterministic mathematical weight normalization: 20% Answerability + 15% Entity Coverage + 15% Semantic Coverage + 15% Question Coverage + 15% Citation Readiness + 10% Structured Answer Quality + 10% KG Alignment.
                      </p>
                    </div>

                    <div className="space-y-1 mt-3">
                      <span className="font-bold text-[var(--text-primary)]">
                        [Level 2] Component Level Evaluation:
                      </span>
                      <ul className="list-disc list-inside text-[10px] text-[var(--text-secondary)] space-y-0.5">
                        <li>Answerability Level: {activeAnalysis.answerability.level}</li>
                        <li>Entity Coverage (Tenant Count): {activeAnalysis.entityCoverage.length} active</li>
                        <li>Semantic Richness Score: {activeAnalysis.semanticCoverage.score}%</li>
                        <li>Question Coverage answered count: {activeAnalysis.questionCoverage.answeredCount}/{activeAnalysis.questionCoverage.totalQuestions}</li>
                        <li>Citation Potential: {activeAnalysis.citationReadiness.level} ({activeAnalysis.citationReadiness.score}%)</li>
                        <li>Structured HTML score: {activeAnalysis.structuredAnswerQuality.score}%</li>
                        <li>Bidirectional KG Match: {activeAnalysis.kgAlignment.score}%</li>
                      </ul>
                    </div>

                    <div className="space-y-1 mt-3">
                      <span className="font-bold text-[var(--text-primary)]">
                        [Level 3] Verbatim Observed Evidence & Source Provenance:
                      </span>
                      <div className="p-2.5 bg-[var(--border)]/15 border border-[var(--border)]/40 rounded-lg text-[10px] space-y-1 text-[var(--text-secondary)] leading-normal">
                        <div><strong>Timestamp:</strong> {activeAnalysis.provenance.timestamp}</div>
                        <div><strong>Engine/Model:</strong> {activeAnalysis.provenance.provider} ({activeAnalysis.provenance.model})</div>
                        <div><strong>Latent calculation:</strong> {activeAnalysis.provenance.latencyMs}ms</div>
                        <div><strong>Semantic text excerpt:</strong> {activeAnalysis.answerability.evidence}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
