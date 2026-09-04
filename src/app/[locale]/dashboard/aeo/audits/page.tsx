"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  Award,
  Link2,
  Tag,
  AlertTriangle,
  CheckCircle,
  Clock,
  Compass,
  FileText,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Receipt,
  HelpCircle
} from "lucide-react";
import {
  createAndRunAuditAction,
  getAuditDetailsAction,
  getBrandsAction
} from "@/app/actions/ai-visibility-audit";
import { Brand, AIVisibilityAudit, AuditPrompt } from "@/features/ai-intelligence/domain/types";

export default function AeoAuditsPage() {
  const { language } = useTheme();
  const isRtl = language === "fa";

  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [activeAudit, setActiveAudit] = useState<AIVisibilityAudit | null>(null);
  const [prompts, setPrompts] = useState<AuditPrompt[]>([]);

  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPromptId, setExpandedPromptId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize and load brands
  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await getBrandsAction();
      if (res.success && res.result && res.result.length > 0) {
        setBrands(res.result);
        setSelectedBrandId(res.result[0].id);

        // Find existing audits if any
        const brandId = res.result[0].id;
        const detailsRes = await getAuditDetailsAction({ auditId: `audit-vis-dummy` }).catch(() => null);
        // If dummy fails, we fetch last saved in db or leave empty
      } else if (!res.success) {
        setErrorMsg(isRtl ? "خطا در بارگذاری برندهای متصل" : "Failed to load tenant brands");
      }
      setIsLoading(false);
    }
    loadInitialData();
  }, [isRtl]);

  // Load audit details when brand selection changes or upon triggering
  const handleBrandChange = async (brandId: string) => {
    setSelectedBrandId(brandId);
    setActiveAudit(null);
    setPrompts([]);
    setErrorMsg(null);
  };

  const triggerNewAudit = () => {
    if (!selectedBrandId) return;

    setErrorMsg(null);
    setActiveAudit({
      id: "temporary",
      organizationId: "",
      brandId: selectedBrandId,
      status: "RUNNING",
      overallScore: null,
      metrics: {},
      promptsCoverage: { total: 7, executed: 0, analyzed: 0, failed: 0, skipped: 0 },
      evidenceSummary: { mentions: [], citations: [], entityRecognition: [], answerInclusion: [] },
      scoringVersion: "1.0.0",
      analyzerVersion: "1.0.0",
      audit: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: "", updatedBy: "", version: 1 }
    });

    startTransition(async () => {
      const res = await createAndRunAuditAction({ brandId: selectedBrandId });
      if (res.success && res.result) {
        const auditData = res.result;
        setActiveAudit(auditData);

        // Fetch detailed prompts
        const promptsRes = await getAuditDetailsAction({ auditId: auditData.id });
        if (promptsRes.success && promptsRes.result) {
          setPrompts(promptsRes.result.prompts);
        }
      } else {
        setActiveAudit(null);
        setErrorMsg(res.error || (isRtl ? "سنجش با خطا مواجه شد." : "AI Visibility Audit execution failed."));
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
            <Sparkles className="text-[var(--sky-blue-500)] animate-pulse" size={24} />
            <span>{isRtl ? "سنجش رویت‌پذیری هوش مصنوعی" : "AI Visibility Audits"}</span>
            <span className="px-2.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-[var(--sky-blue-500)] to-blue-600 text-white rounded-full uppercase tracking-wider">
              Core Engine v1.0
            </span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-2xl leading-relaxed">
            {isRtl
              ? "پلتفرم پایش جامع سهم صدای برند و مراجع استنادی شما در مدل‌های پاسخ‌دهی زبان بزرگ (ChatGPT, Perplexity, Gemini). پیشنهادهای هدفمند به دست آمده به صورت قطعی و مستدل در پایگاه داده ثبت می‌شوند."
              : "Enterprise intelligence suite designed to monitor, track, and score brand discoverability, entity association, and citation authority across search models."}
          </p>
        </div>

        {/* Brand Selector & Trigger */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1">
              {isRtl ? "انتخاب برند" : "Select Brand"}
            </label>
            <select
              value={selectedBrandId}
              onChange={(e) => handleBrandChange(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--sky-blue-500)] font-semibold"
              disabled={isLoading || isPending}
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={triggerNewAudit}
            disabled={isLoading || isPending || !selectedBrandId}
            className="flex items-center gap-2 px-4 py-2 mt-4 bg-[var(--sky-blue-500)] hover:bg-[var(--sky-blue-600)] disabled:opacity-50 text-white rounded-lg text-xs font-black shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
            <span>{isRtl ? "اجرای پایش هوشمند جدید" : "Run AI Visibility Audit"}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg text-xs text-red-600 flex items-center gap-2 font-medium">
          <AlertTriangle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="lg:col-span-1 h-80 bg-[var(--border)]/30 rounded-xl"></div>
          <div className="lg:col-span-2 h-80 bg-[var(--border)]/30 rounded-xl"></div>
        </div>
      )}

      {/* Empty / Initial State */}
      {!isLoading && !activeAudit && (
        <Card className="border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center max-w-xl mx-auto rounded-xl">
          <div className="w-12 h-12 bg-[var(--border)]/30 rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--text-secondary)]">
            <Compass size={24} />
          </div>
          <h3 className="text-sm font-black text-[var(--text-primary)]">
            {isRtl ? "پایشی یافت نشد" : "No Audits Performed Yet"}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
            {isRtl
              ? "هیچ سابقه سنجش رویت‌پذیری هوش مصنوعی برای این برند وجود ندارد. پایش هوشمند را برای شروع استخراج مراجع اجرا کنید."
              : "Perform your first comprehensive AI visibility evaluation to construct semantic entity metrics and trace response citations."}
          </p>
          <button
            onClick={triggerNewAudit}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-[var(--sky-blue-500)] hover:bg-[var(--sky-blue-600)] text-white rounded-lg text-xs font-black transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isRtl ? "اولین سنجش را اجرا کنید" : "Begin Verification Process"}</span>
          </button>
        </Card>
      )}

      {/* Running / Analysing Overlay Indicator */}
      {!isLoading && activeAudit && activeAudit.status === "RUNNING" && (
        <Card className="border border-[var(--border)] bg-[var(--card)] p-12 text-center rounded-xl animate-pulse">
          <RefreshCw className="w-8 h-8 text-[var(--sky-blue-500)] animate-spin mx-auto mb-4" />
          <h3 className="text-sm font-black text-[var(--text-primary)]">
            {isRtl ? "پایش در حال انجام است..." : "Audit Running..."}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-md mx-auto leading-relaxed">
            {isRtl
              ? "موتور در حال ارسال ۷ پرسش کنترل شده به مدل‌ها، شبیه‌سازی مراجع استنادی، تحلیل داده‌های خروجی و وزن‌دهی به نتایج است. لطفاً منتظر بمانید..."
              : "Submitting prompt vectors, simulating conversational responses, analyzing brand mentions, and evaluating link authorities. Please wait..."}
          </p>
        </Card>
      )}

      {/* Core Audit Results Display */}
      {!isLoading && activeAudit && activeAudit.status !== "RUNNING" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Box: Overall Score & Metrics */}
            <Card className="border border-[var(--border)] bg-[var(--card)] rounded-xl flex flex-col justify-between">
              <CardHeader className="border-b border-[var(--border)]/50 pb-4">
                <CardTitle className="text-sm font-black text-[var(--text-primary)] flex items-center gap-2">
                  <Award size={16} className="text-[var(--sky-blue-500)]" />
                  <span>{isRtl ? "نمره رویت‌پذیری کلی" : "Composite Visibility"}</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {isRtl ? "ترکیب نمره‌های برند مپ شده" : "Weighted multi-factorial discovery index"}
                </CardDescription>
              </CardHeader>
              <CardContent className="py-6 flex flex-col items-center justify-center flex-grow space-y-4">
                {/* Circular Score representation */}
                <div className="relative w-36 h-36 flex items-center justify-center rounded-full border-4 border-[var(--border)]">
                  <div className="text-center">
                    <span className="text-4xl font-black text-[var(--text-primary)]">
                      {activeAudit.overallScore}%
                    </span>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] mt-0.5">
                      {isRtl ? "نمره برند" : "Score"}
                    </div>
                  </div>
                  {/* Grade Badge */}
                  <span className={`absolute -bottom-2 px-3 py-1 text-xs font-black rounded-full border border-[var(--border)] shadow-sm ${getGradeColor(activeAudit.overallScore)}`}>
                    {isRtl ? "رتبه " : "Grade "}
                    {getLetterGrade(activeAudit.overallScore)}
                  </span>
                </div>

                <div className="text-center max-w-xs px-2 pt-2">
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {isRtl
                      ? "این نمره نشان‌دهنده درصد کلی دیده شدن و انطباق برند شما در مدل‌های پاسخ‌دهی بر اساس استنادها و موجودیت‌ها است."
                      : "This metric indicates the overall visibility, recognition clarity, and index inclusion level resolved by conversational engine networks."}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Right Box: Scoring Breakdown Metrics */}
            <Card className="lg:col-span-2 border border-[var(--border)] bg-[var(--card)] rounded-xl">
              <CardHeader className="border-b border-[var(--border)]/50 pb-4">
                <CardTitle className="text-sm font-black text-[var(--text-primary)] flex items-center gap-2">
                  <TrendingUp size={16} className="text-[var(--sky-blue-500)]" />
                  <span>{isRtl ? "تفکیک و وزن‌دهی سنجه‌ها" : "Scoring Factors Breakdown"}</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {isRtl ? "وزن‌دهی و مقادیر قطعی محاسبه شده" : "Normalized deterministic weights assigned by core code"}
                </CardDescription>
              </CardHeader>
              <CardContent className="py-5 space-y-4">
                {[
                  {
                    name: isRtl ? "دیده شدن در پاسخ (Answer Visibility)" : "AI Answer Visibility",
                    score: activeAudit.metrics.answerVisibilityScore || 0,
                    weight: "20%",
                    desc: isRtl ? "سطح ذکر نام برند در پاسخ‌ها" : "Categorical level of brand mentions inside generative texts"
                  },
                  {
                    name: isRtl ? "تکرار ذکر نام برند (Brand Mentions)" : "Brand Mentions Strength",
                    score: activeAudit.metrics.brandMentionScore || 0,
                    weight: "15%",
                    desc: isRtl ? "تعداد دفعات شناسایی الگوهای متنی برند" : "Occurrences, variants, and Persians/English aliases matched"
                  },
                  {
                    name: isRtl ? "شناخت موجودیت معنایی (Entity Recognition)" : "Entity Recognition Status",
                    score: activeAudit.metrics.entityRecognitionScore || 0,
                    weight: "15%",
                    desc: isRtl ? "انطباق موجودیت برند با رده‌های گراف دانش" : "Association confidence mapped inside semantic knowledge indexes"
                  },
                  {
                    name: isRtl ? "حضور در ارجاعات استنادی (Citation Presence)" : "Citation Presence Rating",
                    score: activeAudit.metrics.citationPresenceScore || 0,
                    weight: "15%",
                    desc: isRtl ? "وجود لینک‌های مراجع و سایت برند در پاسخ" : "Verification of parsed URL references pointing to first/third parties"
                  },
                  {
                    name: isRtl ? "اعتبار مراجع استناد (Source Authority)" : "Source Authority Score",
                    score: activeAudit.metrics.sourceAuthorityScore || 0,
                    weight: "15%",
                    desc: isRtl ? "اعتبار دامنه‌های استناد داده شده (یا نامشخص)" : "Authority score of links, displaying 'unknown' for missing domain data",
                    isAuthority: true
                  },
                  {
                    name: isRtl ? "انضمام برند در پاسخ نهایی (Answer Inclusion)" : "Answer Inclusion Score",
                    score: activeAudit.metrics.answerInclusionScore || 0,
                    weight: "20%",
                    desc: isRtl ? "قرارگیری برند به عنوان راه‌حل اصلی پرسش کاربر" : "Determining whether target is an active candidate solution or side mention"
                  }
                ].map((factor, index) => (
                  <div key={index} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-[var(--text-primary)]">{factor.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">
                          {isRtl ? "وزن: " : "Weight: "}{factor.weight}
                        </span>
                        <span className="text-[var(--text-primary)] font-black">
                          {factor.isAuthority && factor.score === 0 ? (
                            <span className="text-amber-500 bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded text-[10px]">
                              {isRtl ? "نامشخص" : "unknown"}
                            </span>
                          ) : (
                            `${factor.score}%`
                          )}
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-[var(--border)]/50 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[var(--sky-blue-500)] h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${factor.score}%` }}
                      ></div>
                    </div>
                    <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                      {factor.desc}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Prompt Coverage and Partial Failures Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: isRtl ? "کل پرسش‌ها" : "Total Prompts", count: activeAudit.promptsCoverage.total, color: "text-[var(--text-primary)]" },
              { label: isRtl ? "اجرا شده" : "Executed count", count: activeAudit.promptsCoverage.executed, color: "text-[var(--sky-blue-500)]" },
              { label: isRtl ? "آنالیز شده" : "Analyzed Successful", count: activeAudit.promptsCoverage.analyzed, color: "text-emerald-500", icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-500 inline-block mr-1" /> },
              { label: isRtl ? "شکست خورده" : "Failed count", count: activeAudit.promptsCoverage.failed, color: "text-red-500", icon: activeAudit.promptsCoverage.failed > 0 ? <AlertTriangle className="w-3.5 h-3.5 text-red-500 inline-block mr-1 animate-bounce" /> : null }
            ].map((stat, idx) => (
              <Card key={idx} className="border border-[var(--border)] bg-[var(--card)] p-4 rounded-xl text-center">
                <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider mb-1">
                  {stat.label}
                </div>
                <div className={`text-xl font-black ${stat.color} flex items-center justify-center`}>
                  {stat.icon}
                  <span>{stat.count}</span>
                </div>
              </Card>
            ))}
          </div>

          {/* Interactive Prompt Execution Evidence Stream */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-[var(--text-primary)]">
              {isRtl ? "پرتفوی شواهد و نتایج پرسش‌ها" : "Auditable Prompt Evidence & Analysis"}
            </h3>

            <div className="space-y-3">
              {prompts.map((prompt) => (
                <Card
                  key={prompt.id}
                  className="border border-[var(--border)] bg-[var(--card)] rounded-xl overflow-hidden transition-all duration-300 hover:border-[var(--sky-blue-500)]/40"
                >
                  {/* Collapsed Header */}
                  <div
                    onClick={() => setExpandedPromptId(expandedPromptId === prompt.id ? null : prompt.id)}
                    className="p-4 flex justify-between items-center cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`p-1.5 rounded-lg ${prompt.status === "COMPLETED" ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500" : "bg-red-50 dark:bg-red-950/20 text-red-500"}`}>
                        {prompt.status === "COMPLETED" ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-[var(--text-primary)] leading-normal line-clamp-1">
                            {prompt.promptText}
                          </span>
                          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[var(--border)] text-[var(--text-muted)] rounded uppercase">
                            {prompt.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-[var(--text-secondary)] font-mono">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {prompt.latencyMs ? `${prompt.latencyMs}ms` : "-"}
                          </span>
                          <span className="uppercase">{prompt.locale}</span>
                          {prompt.status === "COMPLETED" && (
                            <span className="font-bold text-[var(--sky-blue-500)]">
                              {isRtl ? "سهم نمره: " : "Score Contrib: "}{prompt.analysis?.scoreContribution || 0}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {expandedPromptId === prompt.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>

                  {/* Expanded Detail Panel */}
                  {expandedPromptId === prompt.id && (
                    <div className="border-t border-[var(--border)]/50 bg-[var(--border)]/5 p-4 space-y-4 text-xs">
                      {prompt.status === "FAILED" && (
                        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg text-red-600 font-medium">
                          <strong>{isRtl ? "خطای اجرا: " : "Execution Error: "}</strong>
                          {prompt.errorMessage}
                        </div>
                      )}

                      {prompt.status === "COMPLETED" && (
                        <div className="space-y-4">
                          {/* Generated Response Box */}
                          <div className="space-y-1.5">
                            <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                              <FileText size={14} className="text-[var(--sky-blue-500)]" />
                              {isRtl ? "پاسخ شبیه‌سازی شده مدل" : "Conversational Model Response"}
                            </span>
                            <div className="p-3 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap select-all font-mono text-[11px]">
                              {prompt.responseText}
                            </div>
                          </div>

                          {/* Analysis Breakdown */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            {/* Answer Visibility & Mentions */}
                            <div className="p-3.5 bg-[var(--card)] border border-[var(--border)] rounded-lg space-y-3">
                              <div className="space-y-1">
                                <span className="font-bold text-[var(--text-primary)]">{isRtl ? "رویت‌پذیری کلامی" : "Answer Visibility"}</span>
                                <div className="flex justify-between items-center bg-[var(--border)]/30 p-2 rounded text-[11px]">
                                  <span className="capitalize text-[var(--sky-blue-500)] font-bold">{prompt.analysis.answerVisibility?.level}</span>
                                  <span className="text-[10px] text-[var(--text-muted)] font-mono">{prompt.analysis.answerVisibility?.confidence ? `Confidence: ${prompt.analysis.answerVisibility.confidence}` : ""}</span>
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <span className="font-bold text-[var(--text-primary)]">{isRtl ? "ذکر نام برند" : "Brand Mention Detected"}</span>
                                <div className="text-[11px] space-y-1 text-[var(--text-secondary)]">
                                  <div className="flex justify-between">
                                    <span>{isRtl ? "وضعیت کشف:" : "Mention state:"}</span>
                                    <span className="font-bold">{prompt.analysis.brandMentions?.detected ? (isRtl ? "بله" : "Yes") : (isRtl ? "خیر" : "No")}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>{isRtl ? "تعداد تکرار:" : "Mention Count:"}</span>
                                    <span className="font-bold">{prompt.analysis.brandMentions?.count || 0}</span>
                                  </div>
                                  <div className="mt-2 p-2 bg-[var(--border)]/20 rounded font-mono text-[10px] italic">
                                    {prompt.analysis.brandMentions?.evidence}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Entity Recognition & Inclusion */}
                            <div className="p-3.5 bg-[var(--card)] border border-[var(--border)] rounded-lg space-y-3">
                              <div className="space-y-1">
                                <span className="font-bold text-[var(--text-primary)]">{isRtl ? "شناخت معنایی موجودیت" : "Entity Recognition"}</span>
                                <div className="p-2 bg-[var(--border)]/30 rounded text-[11px] space-y-1 text-[var(--text-secondary)]">
                                  <div className="flex justify-between">
                                    <span>{isRtl ? "وضعیت انطباق:" : "Entity status:"}</span>
                                    <span className="capitalize font-bold text-[var(--sky-blue-500)]">{prompt.analysis.entityRecognition?.status}</span>
                                  </div>
                                  <p className="text-[10px] italic pt-1 border-t border-[var(--border)]/50 mt-1">
                                    {prompt.analysis.entityRecognition?.evidence}
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <span className="font-bold text-[var(--text-primary)]">{isRtl ? "سطح انضمام پاسخ" : "Answer Inclusion Level"}</span>
                                <div className="p-2 bg-[var(--border)]/30 rounded text-[11px] space-y-1 text-[var(--text-secondary)]">
                                  <div className="flex justify-between">
                                    <span>{isRtl ? "جایگاه در پاسخ:" : "Inclusion level:"}</span>
                                    <span className="capitalize font-bold text-[var(--sky-blue-500)]">{prompt.analysis.answerInclusion?.status}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Citations and links */}
                            <div className="md:col-span-2 p-3.5 bg-[var(--card)] border border-[var(--border)] rounded-lg space-y-2">
                              <span className="font-bold text-[var(--text-primary)] flex items-center gap-1">
                                <Link2 size={14} className="text-[var(--sky-blue-500)]" />
                                {isRtl ? "لینک‌ها و استنادهای استخراج شده" : "Extracted Citations & Domain Trust"}
                              </span>
                              {prompt.analysis.citationPresence?.present && prompt.analysis.citationPresence.citations.length > 0 ? (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left border-collapse text-[10px] font-mono">
                                    <thead>
                                      <tr className="border-b border-[var(--border)] text-[var(--text-muted)] font-bold">
                                        <th className="py-1">{isRtl ? "آدرس مرجع" : "URL"}</th>
                                        <th className="py-1">{isRtl ? "دامنه" : "Domain"}</th>
                                        <th className="py-1">{isRtl ? "مالکیت برند" : "Type"}</th>
                                        <th className="py-1 text-right">{isRtl ? "اعتبار دامنه" : "Domain Authority"}</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {prompt.analysis.citationPresence.citations.map((cit, cIdx) => (
                                        <tr key={cIdx} className="border-b border-[var(--border)]/30 hover:bg-[var(--border)]/10">
                                          <td className="py-1 text-[var(--sky-blue-500)] truncate max-w-xs">{cit.url}</td>
                                          <td className="py-1">{cit.domain}</td>
                                          <td className="py-1">
                                            {cit.isTargetDomain ? (
                                              <span className="text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded text-[8px]">
                                                {isRtl ? "دامنه اول" : "First-Party"}
                                              </span>
                                            ) : (
                                              <span className="text-[var(--text-muted)] font-bold bg-[var(--border)] px-1.5 py-0.5 rounded text-[8px]">
                                                {isRtl ? "ثالث" : "Third-Party"}
                                              </span>
                                            )}
                                          </td>
                                          <td className="py-1 text-right font-black">
                                            {typeof cit.authority === "number" ? (
                                              `${cit.authority}/100`
                                            ) : (
                                              <span className="text-amber-500 bg-amber-50 dark:bg-amber-950/20 px-1 py-0.5 rounded text-[8px]">
                                                {isRtl ? "نامشخص" : "unknown"}
                                              </span>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-[10px] text-[var(--text-muted)] italic">
                                  {isRtl ? "هیچ لینک استنادی در متن پاسخ یافت نشد." : "No citation links detected in response text."}
                                </p>
                              )}
                            </div>

                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
