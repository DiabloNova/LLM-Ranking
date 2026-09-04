"use client";

import React, { useState, useTransition, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";
import { ContentStudioResponse } from "@/app/api/v1/content/studio/route";
import {
  Sparkles,
  Search,
  CheckCircle2,
  XCircle,
  Sparkle,
  PenTool,
  Bookmark,
  TrendingUp,
  X,
  Plus,
  RefreshCw,
  Copy,
  ChevronLeft,
  Check,
  Languages,
  Activity,
  Smile,
  AlertCircle
} from "lucide-react";

export const ContentStudio: React.FC = () => {
  const { language, direction } = useTheme();
  const { session } = useAuth();
  const isRtl = language === "fa";

  const [url, setUrl] = useState("");
  const [brandVoice, setBrandVoice] = useState("رسمی");
  const [keywordInput, setTargetKeywordInput] = useState("");
  const [keywords, setKeywords] = useState<string[]>(["سئو معنایی", "گراف دانش"]);
  const [result, setResult] = useState<ContentStudioResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Loading stepper
  const [loadingStep, setLoadingStep] = useState(0);

  const [animatedScore, setAnimatedScore] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Copied text notification
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // Terminology replacements tracking
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<number>>(new Set());

  // Simulate progress steps
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPending) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => {
          if (prev < 2) return prev + 1;
          return prev;
        });
      }, 3500);
    } else {
      setLoadingStep(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPending]);

  // Score counter animation
  useEffect(() => {
    if (result) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      let start = 0;
      const end = result.semanticHealthScore;
      if (start === end) {
        const t = setTimeout(() => {
          setAnimatedScore(end);
        }, 0);
        return () => clearTimeout(t);
      }
      const duration = 1000;
      const increment = end / (duration / 16);

      const interval = setInterval(() => {
        start += increment;
        if (start >= end) {
          clearInterval(interval);
          setAnimatedScore(end);
        } else {
          setAnimatedScore(Math.floor(start));
        }
      }, 16);

      timerRef.current = interval;

      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      const t = setTimeout(() => {
        setAnimatedScore(0);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [result]);

  const strings = {
    title: isRtl ? "استودیو خلاق تولید و بهینه‌سازی محتوا" : "AI Content Studio & Semantic Optimizer",
    desc: isRtl
      ? "لحن و واژگان سایت خود را تحلیل کرده، اصطلاحات خشن یا منفی را پاکسازی کنید، و پیش‌نویس‌های بهینه تولید نمایید."
      : "Audit brand terminology, optimize harsh expressions into positive/premium copy, and generate highly indexable AEO drafts.",
    urlLabel: isRtl ? "آدرس وب‌سایت هدف (اختیاری):" : "Target Website URL (Optional):",
    placeholderUrl: isRtl ? "آدرس صفحه وب‌سایت خود را وارد کنید..." : "e.g. https://example.com/product",
    voiceLabel: isRtl ? "لحن برند:" : "Brand Voice:",
    keywordsLabel: isRtl ? "کلمات کلیدی هدف:" : "Target Keywords (Press Enter to Add):",
    keywordsPlaceholder: isRtl ? "کلمه کلیدی جدید..." : "Add keyword...",
    btnAction: isRtl ? "شروع تحلیل معنایی و تولید محتوا" : "Run Optimization & Generate Content",
    step1: isRtl ? "در حال بررسی لحن، واژگان و اصطلاحات صفحات..." : "Checking tone, terminology and semantic vocabulary...",
    step2: isRtl ? "در حال بهینه‌سازی کلمات کلیدی برای موتورهای پاسخ (AEO)..." : "Optimizing semantic layout structures for Answer Engines...",
    step3: isRtl ? "در حال نگارش پیش‌نویس‌های هوشمند در استودیو محتوا..." : "Drafting smart SEO outlines and copy variants...",
    healthTitle: isRtl ? "شاخص سلامت واژگان" : "Semantic Health Index",
    healthDesc: isRtl ? "سنجش میران سازنده و حرفه‌ای بودن اصطلاحات محتوا" : "Synthesized score of positive and professional tone representation",
    suggestionsTitle: isRtl ? "پیشنهادات بهینه‌سازی و اصلاح کلمات خشن" : "Harsh & Negative Terminology Improvements",
    originalLabel: isRtl ? "واژه فعلی" : "Current harsh",
    suggestedLabel: isRtl ? "اصطلاح پیشنهادی جدید" : "Premium suggestion",
    btnApply: isRtl ? "تایید و اعمال" : "Apply Fix",
    btnApplied: isRtl ? "اعمال شد" : "Applied",
    outlineTitle: isRtl ? "طرح‌های محتوایی پیشنهادی سئو معنایی (AEO)" : "AI Generated Content & Answer Outlines",
    btnCopy: isRtl ? "کپی کردن متن" : "Copy Content",
    btnCopied: isRtl ? "کپی شد!" : "Copied!",
    voice1: isRtl ? "رسمی و شرکتی" : "Formal & Enterprise",
    voice2: isRtl ? "دوستانه و صمیمی" : "Friendly & Conversational",
    voice3: isRtl ? "تخصصی و علمی" : "Scientific & Highly Technical"
  };

  const handleAddKeyword = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = keywordInput.trim();
      if (val && !keywords.includes(val)) {
        setKeywords([...keywords, val]);
        setTargetKeywordInput("");
      }
    }
  };

  const handleRemoveKeyword = (index: number) => {
    setKeywords(keywords.filter((_, idx) => idx !== index));
  };

  const handleAction = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setAppliedSuggestions(new Set());

    startTransition(async () => {
      try {
        const workspaceId = session?.user?.workspaceId || "ws-tehran";

        const response = await fetch("/api/v1/content/studio", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": workspaceId,
            "x-user-id": session?.user?.id || "usr-studio-default",
          },
          body: JSON.stringify({ url, brandVoice, targetKeywords: keywords }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || (isRtl ? "خطا در پردازش اطلاعات استودیو محتوا." : "Studio processing failed."));
        }

        setResult(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => {
      setCopiedIdx(null);
    }, 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "stroke-emerald-500 text-emerald-400";
    if (score >= 75) return "stroke-teal-500 text-teal-400";
    if (score >= 60) return "stroke-amber-500 text-amber-400";
    return "stroke-red-500 text-red-400";
  };

  return (
    <div className="space-y-6 animate-fade-in" dir={direction}>
      {/* Input settings Panel */}
      <Card className="backdrop-blur-md shadow-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-sky-500 to-blue-500 border border-sky-500/20 rounded-xl text-white">
              <PenTool size={18} />
            </div>
            <div>
              <CardTitle>{strings.title}</CardTitle>
              <CardDescription>{strings.desc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAction} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* URL/Text target */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[var(--text-muted)]">{strings.urlLabel}</label>
                <div className="relative">
                  <Search size={14} className={`absolute top-1/2 -translate-y-1/2 text-[var(--text-muted)] ${isRtl ? "right-3.5" : "left-4"}`} />
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={strings.placeholderUrl}
                    className={`
                      w-full py-2.5 text-xs rounded-xl outline-none transition-all duration-300
                      bg-[var(--muted-surface)] text-[var(--text-primary)] border border-[var(--border)]
                      focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30 focus:bg-[var(--card)]
                      placeholder:text-[var(--text-muted)]
                      ${isRtl ? "pr-10 pl-4" : "pl-10 pr-4"}
                    `}
                    disabled={isPending}
                  />
                </div>
              </div>

              {/* Brand Voice Dropdown */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[var(--text-muted)]">{strings.voiceLabel}</label>
                <select
                  value={brandVoice}
                  onChange={(e) => setBrandVoice(e.target.value)}
                  className="w-full py-2.5 px-4 text-xs font-bold text-[var(--text-primary)] bg-[var(--muted-surface)] border border-[var(--border)] rounded-xl outline-none cursor-pointer focus:border-sky-400"
                  disabled={isPending}
                >
                  <option value="رسمی" className="bg-[var(--card)] text-[var(--text-primary)]">{strings.voice1}</option>
                  <option value="دوستانه" className="bg-[var(--card)] text-[var(--text-primary)]">{strings.voice2}</option>
                  <option value="تخصصی" className="bg-[var(--card)] text-[var(--text-primary)]">{strings.voice3}</option>
                </select>
              </div>

              {/* Tag Keywords list */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold text-[var(--text-muted)]">{strings.keywordsLabel}</label>
                <div className="flex flex-wrap gap-2 p-2 bg-[var(--muted-surface)] border border-[var(--border)] rounded-xl min-h-[42px] items-center">
                  {keywords.map((kw, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-lg bg-sky-500/10 border border-sky-500/25 text-sky-400 animate-fade-in">
                      <span>{kw}</span>
                      <button type="button" onClick={() => handleRemoveKeyword(i)} className="hover:text-red-400 transition-colors">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setTargetKeywordInput(e.target.value)}
                    onKeyDown={handleAddKeyword}
                    placeholder={strings.keywordsPlaceholder}
                    className="flex-1 bg-transparent text-xs text-[var(--text-primary)] outline-none border-none py-1 px-1 placeholder:text-[var(--text-muted)] min-w-[120px]"
                    disabled={isPending}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                disabled={isPending}
                className="gap-2 px-6 py-3 font-bold rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 border-none text-white shadow-lg shadow-sky-950/20 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300"
              >
                {isPending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                    <span>{isRtl ? "در حال بهینه‌سازی..." : "Generating..."}</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>{strings.btnAction}</span>
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Progress bar Stepper */}
          {isPending && (
            <div className="mt-6 space-y-4 p-5 rounded-2xl border border-sky-500/15 bg-sky-500/5 animate-pulse">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className={`flex items-center gap-2.5 font-bold ${loadingStep === 0 ? "text-sky-400" : "text-[var(--text-muted)]"}`}>
                  <Activity size={14} className={loadingStep === 0 ? "animate-spin text-sky-400" : ""} />
                  <span>{strings.step1}</span>
                </div>
                <div className={`flex items-center gap-2.5 font-bold ${loadingStep === 1 ? "text-sky-400" : "text-[var(--text-muted)]"}`}>
                  <Activity size={14} className={loadingStep === 1 ? "animate-spin text-sky-400" : ""} />
                  <span>{strings.step2}</span>
                </div>
                <div className={`flex items-center gap-2.5 font-bold ${loadingStep === 2 ? "text-sky-400" : "text-[var(--text-muted)]"}`}>
                  <Activity size={14} className={loadingStep === 2 ? "animate-spin text-sky-400" : ""} />
                  <span>{strings.step3}</span>
                </div>
              </div>

              <div className="w-full h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-blue-500 transition-all duration-1000 ease-out"
                  style={{ width: `${(loadingStep + 1) * 33.3}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 mt-4 rounded-xl border border-red-500/10 bg-red-500/5 text-red-400 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Result Cards Display */}
      {result && !isPending && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
          {/* Circular Score Ring */}
          <Card className="shadow-lg flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <Smile size={12} />
                <span>{strings.healthTitle}</span>
              </CardTitle>
              <CardDescription className="text-[10px]">
                {strings.healthDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6 flex-1 space-y-4">
              <div className="relative flex items-center justify-center">
                <svg className="w-36 h-36 transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="58"
                    className="stroke-[var(--border)]"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="58"
                    className={`transition-all duration-1000 ${getScoreColor(result.semanticHealthScore)}`}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 58}
                    strokeDashoffset={2 * Math.PI * 58 * (1 - animatedScore / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className={`text-5xl font-black font-display leading-none tracking-tight ${getScoreColor(result.semanticHealthScore)}`}>
                    {animatedScore}
                  </span>
                  <span className="text-[10px] font-bold text-[var(--text-muted)] mt-1 tracking-widest uppercase">
                    / 100
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terminology Suggestion improvements */}
          <Card className="lg:col-span-2 shadow-lg">
            <CardHeader className="pb-3 border-b border-[var(--border)]">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <Languages size={12} />
                <span>{strings.suggestionsTitle}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {result.terminologySuggestions.map((sug, idx) => {
                const isApplied = appliedSuggestions.has(idx);
                return (
                  <div key={idx} className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--muted-surface)]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
                    <div className="space-y-1.5">
                      <div className="flex items-center flex-wrap gap-2.5 text-xs font-bold">
                        <span className="line-through text-red-500 bg-red-500/10 border border-red-500/25 px-2 py-0.5 rounded">{sug.originalWord}</span>
                        <ChevronLeft size={12} className="text-[var(--text-muted)] rtl:rotate-180" />
                        <span className="text-emerald-500 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded">{sug.suggestedWord}</span>
                      </div>
                      <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed font-medium">💡 {sug.reason}</p>
                      <p className="text-[9px] text-[var(--text-muted)] italic font-mono">&ldquo;{sug.context}&rdquo;</p>
                    </div>

                    <Button
                      onClick={() => {
                        const next = new Set(appliedSuggestions);
                        if (next.has(idx)) {
                          next.delete(idx);
                        } else {
                          next.add(idx);
                        }
                        setAppliedSuggestions(next);
                      }}
                      variant="outline"
                      size="sm"
                      className={`gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
                        isApplied
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                          : "border-[var(--border)] hover:bg-[var(--muted-surface)]"
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <Check size={10} strokeWidth={3} />
                          <span>{strings.btnApplied}</span>
                        </>
                      ) : (
                        <>
                          <Sparkle size={10} />
                          <span>{strings.btnApply}</span>
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* AI Content drafts list */}
          <Card className="lg:col-span-3 shadow-lg">
            <CardHeader className="pb-3 border-b border-[var(--border)]">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-sky-400">
                <Bookmark size={15} />
                <span>{strings.outlineTitle}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
              {result.generatedContent.map((item, idx) => {
                const isCopied = copiedIdx === idx;
                const draftText = `Title: ${item.title}\n\nOutline:\n${item.outline.map(o => `- ${o}`).join("\n")}`;
                return (
                  <div key={idx} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--muted-surface)]/10 space-y-4 flex flex-col justify-between hover:border-[var(--sky-blue-500)]/40 transition-all duration-200">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 font-mono">SEO: {item.seoScore}%</span>
                        <span className="text-[10px] text-[var(--text-muted)] font-bold">پیش‌نویس {idx + 1}</span>
                      </div>
                      <h4 className="text-xs font-black text-[var(--text-primary)] leading-relaxed">{item.title}</h4>
                      <ul className="space-y-1.5 pr-2 border-r border-[var(--border)]">
                        {item.outline.map((o, oIdx) => (
                          <li key={oIdx} className="text-[10px] text-[var(--text-secondary)] leading-relaxed list-none flex items-start gap-1.5 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 flex-shrink-0" />
                            <span>{o}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button
                      onClick={() => handleCopy(draftText, idx)}
                      className={`w-full mt-3 gap-1.5 text-[10px] font-bold py-2 rounded-lg border transition-all ${
                        isCopied
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                          : "border-[var(--border)] bg-[var(--muted-surface)] hover:bg-[var(--background-subtle)] text-[var(--text-primary)]"
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check size={12} strokeWidth={3} />
                          <span>{strings.btnCopied}</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>{strings.btnCopy}</span>
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
