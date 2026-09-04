"use client";

import React, { useState, useTransition, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";
import { PremiumAuditResponse } from "@/app/api/v1/audit/premium/route";
import {
  Sparkles,
  Search,
  CheckCircle2,
  XCircle,
  Lock,
  Globe,
  AlertCircle,
  Flame,
  Check,
  Shield,
  Layers,
  FileCode,
  Gauge,
  Workflow,
  Sparkle,
  FileDown,
  ArrowLeft,
  CircleDot
} from "lucide-react";

export const PremiumAuditPanel: React.FC = () => {
  const { language, direction } = useTheme();
  const { session } = useAuth();

  const isRtl = language === "fa";

  const [url, setUrl] = useState("");
  const [depth, setDepth] = useState<number>(10);
  const [result, setResult] = useState<PremiumAuditResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Multi-step progress states
  const [loadingStep, setLoadingStep] = useState(0);

  const [animatedScore, setAnimatedScore] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate loading steps during crawl transition
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPending) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => {
          if (prev < 2) return prev + 1;
          return prev;
        });
      }, 4000);
    } else {
      setLoadingStep(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPending]);

  useEffect(() => {
    if (result) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      let start = 0;
      const end = result.score;
      if (start === end) {
        const t = setTimeout(() => {
          setAnimatedScore(end);
        }, 0);
        return () => clearTimeout(t);
      }
      const duration = 1200;
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
    title: isRtl ? "تحلیل عمیق و ارزیابی معنایی پریمیوم" : "Premium Deep Semantic SEO Audit",
    desc: isRtl
      ? "پایش کامل تا سقف ۵۰ صفحه وب‌سایت با موتور خزنده‌ی هوشمند Firecrawl، استخراج شکاف‌های معنایی با هوش مصنوعی و بهینه‌سازی گراف دانش"
      : "Complete crawl of up to 50 pages, semantic gap identification via LLM, and structured Knowledge Graph optimization.",
    placeholder: isRtl ? "آدرس کامل وب‌سایت (مثال: https://example.com)" : "Root website URL (e.g. https://example.com)",
    depthLabel: isRtl ? "تعداد صفحات مورد پایش:" : "Crawl Depth Limit:",
    btnAnalyze: isRtl ? "شروع تحلیل عمیق پریمیوم" : "Start Premium Audit",
    step1: isRtl ? "در حال خزش همزمان تمامی صفحات با Firecrawl..." : "Crawling and mapping site links via Firecrawl...",
    step2: isRtl ? "در حال تحلیل معنایی تگ‌ها و شکاف‌های محتوایی با هوش مصنوعی..." : "Analyzing semantic content and entity gaps via LLM...",
    step3: isRtl ? "در حال استخراج گراف دانش و ساخت تابلوی پیشنهادات هوشمند..." : "Synthesizing and mapping strategic recommendations...",
    scoreGaugeTitle: isRtl ? "شاخص جامع سئو معنایی" : "Synthesized SEO Score",
    scoreGaugeDesc: isRtl ? "امتیاز کلی سلامت محتوایی، ساختار فنی و پیوندهای داخلی" : "Composite rating across semantic pillars",
    pagesAnalyzedLabel: isRtl ? "صفحات تحلیل شده:" : "Pages Scanned:",
    gradeLabel: isRtl ? "رتبه سئو:" : "Overall Grade:",
    metricsTitle: isRtl ? "امتیاز پایه‌های سئو پریمیوم" : "SEO Pillar Scores",
    contentQualityLabel: isRtl ? "کیفیت محتوا" : "Content Quality",
    technicalHealthLabel: isRtl ? "سلامت فنی" : "Technical Health",
    internalLinkingLabel: isRtl ? "پیوندهای داخلی" : "Internal Linking",
    semanticCoverageLabel: isRtl ? "پوشش معنایی" : "Semantic Coverage",
    issuesTitle: isRtl ? "خطاها و چالش‌های فنی و معنایی شناسایی‌شده" : "Detected Technical & Semantic Gaps",
    recsTitle: isRtl ? "توصیه‌های محتوایی و استراتژی رشد هوش مصنوعی" : "AI Content & Brand Representation Recommendations",
    priorityHigh: isRtl ? "حیاتی" : "High",
    priorityMedium: isRtl ? "متوسط" : "Medium",
    priorityLow: isRtl ? "عادی" : "Low",
    downloadPdf: isRtl ? "دریافت گزارش PDF ارزیابی معنایی" : "Download PDF Report",
    downloadPdfProgress: isRtl ? "دانلود به زودی فعال خواهد شد..." : "PDF report downloader is launching soon",
    comparisonTitle: isRtl ? "مقایسه سهم صدای برند با رقبا و شاخص صنعت" : "Share of Voice & Competitor Comparison",
    competitorYourSite: isRtl ? "سایت شما" : "Your Site",
    competitorAverage: isRtl ? "میانگین صنعت" : "Industry Average",
    competitorTop: isRtl ? "رقیب اصلی" : "Top Competitor",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();

    if (!trimmed) {
      setError(isRtl ? "لطفاً آدرس وب‌سایت را وارد کنید." : "Please enter a valid website URL.");
      return;
    }

    setError(null);
    setResult(null);

    startTransition(async () => {
      try {
        const workspaceId = session?.user?.workspaceId || "ws-tehran";

        const response = await fetch("/api/v1/audit/premium", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": workspaceId,
            "x-user-id": session?.user?.id || "usr-premium-default",
          },
          body: JSON.stringify({ url: trimmed, depth }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || (isRtl ? "خطا در پردازش تحلیل معنایی پریمیوم." : "An error occurred during Premium Audit."));
        }

        setResult(data);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setError(errMsg);
      }
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "stroke-emerald-500 text-emerald-400";
    if (score >= 80) return "stroke-teal-500 text-teal-400";
    if (score >= 70) return "stroke-amber-500 text-amber-400";
    if (score >= 60) return "stroke-orange-500 text-orange-400";
    return "stroke-red-500 text-red-400";
  };

  const getMetricColor = (score: number) => {
    if (score >= 85) return "bg-emerald-500 text-emerald-400";
    if (score >= 70) return "bg-amber-500 text-amber-400";
    return "bg-red-500 text-red-400";
  };

  const getGradeBg = (grade: string) => {
    switch (grade) {
      case "A": return "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
      case "B": return "bg-teal-500/10 border-teal-500/30 text-teal-400";
      case "C": return "bg-amber-500/10 border-amber-500/30 text-amber-400";
      case "D": return "bg-orange-500/10 border-orange-500/30 text-orange-400";
      default: return "bg-red-500/10 border-red-500/30 text-red-400";
    }
  };

  const getSeverityIcon = (severity: "critical" | "warning" | "info") => {
    switch (severity) {
      case "critical": return "🔴";
      case "warning": return "🟡";
      default: return "🔵";
    }
  };

  const getPriorityBadge = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high":
        return <Badge variant="error" className="text-[10px] px-2.5 py-0.5 font-bold">{strings.priorityHigh}</Badge>;
      case "medium":
        return <Badge variant="warning" className="text-[10px] px-2.5 py-0.5 font-bold text-amber-400">{strings.priorityMedium}</Badge>;
      default:
        return <Badge variant="info" className="text-[10px] px-2.5 py-0.5 font-bold text-sky-400">{strings.priorityLow}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" dir={direction}>
      {/* Search & URL Input Card */}
      <Card className="backdrop-blur-md shadow-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-orange-500 border border-orange-500/30 rounded-xl text-white shadow-lg shadow-orange-950/20">
              <Sparkles size={18} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>{strings.title}</CardTitle>
                <span className="px-2 py-0.5 text-[9px] font-black rounded bg-gradient-to-r from-amber-500 to-orange-500 text-white uppercase tracking-wider">Pro</span>
              </div>
              <CardDescription>{strings.desc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className={`absolute top-1/2 -translate-y-1/2 text-[var(--text-muted)] ${isRtl ? "right-4" : "left-4"}`} />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={strings.placeholder}
                  className={`
                    w-full py-3 text-xs rounded-xl outline-none transition-all duration-300
                    bg-[var(--muted-surface)] text-[var(--text-primary)] border border-[var(--border)]
                    focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 focus:bg-[var(--card)]
                    placeholder:text-[var(--text-muted)]
                    ${isRtl ? "pr-11 pl-4" : "pl-11 pr-4"}
                  `}
                  disabled={isPending}
                />
              </div>

              {/* Depth Limits */}
              <div className="flex items-center gap-2 bg-[var(--muted-surface)] px-4 py-2 border border-[var(--border)] rounded-xl">
                <span className="text-[11px] font-bold text-[var(--text-muted)] whitespace-nowrap">{strings.depthLabel}</span>
                <select
                  value={depth}
                  onChange={(e) => setDepth(Number(e.target.value))}
                  className="bg-transparent text-xs font-bold text-[var(--text-primary)] outline-none border-none cursor-pointer pr-1"
                  disabled={isPending}
                >
                  <option value={10} className="bg-[var(--card)] text-[var(--text-primary)]">۱۰ {isRtl ? "صفحه" : "Pages"}</option>
                  <option value={25} className="bg-[var(--card)] text-[var(--text-primary)]">۲۵ {isRtl ? "صفحه" : "Pages"}</option>
                  <option value={50} className="bg-[var(--card)] text-[var(--text-primary)]">۵۰ {isRtl ? "صفحه" : "Pages"}</option>
                </select>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={isPending || !url.trim()}
                className="gap-2 px-6 py-3 font-black rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 border-none text-white shadow-lg shadow-orange-950/20 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300"
              >
                {isPending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                    <span>{isRtl ? "در حال ارزیابی..." : "Analyzing Premium..."}</span>
                  </>
                ) : (
                  <>
                    <Gauge size={14} />
                    <span>{strings.btnAnalyze}</span>
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Stepper Progress bar */}
          {isPending && (
            <div className="mt-6 space-y-4 p-5 rounded-2xl border border-orange-500/15 bg-orange-500/5 animate-pulse">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className={`flex items-center gap-2.5 font-bold ${loadingStep === 0 ? "text-amber-400" : "text-[var(--text-muted)]"}`}>
                  <CircleDot size={14} className={loadingStep === 0 ? "animate-spin text-amber-400" : ""} />
                  <span>{strings.step1}</span>
                </div>
                <div className={`flex items-center gap-2.5 font-bold ${loadingStep === 1 ? "text-amber-400" : "text-[var(--text-muted)]"}`}>
                  <CircleDot size={14} className={loadingStep === 1 ? "animate-spin text-amber-400" : ""} />
                  <span>{strings.step2}</span>
                </div>
                <div className={`flex items-center gap-2.5 font-bold ${loadingStep === 2 ? "text-amber-400" : "text-[var(--text-muted)]"}`}>
                  <CircleDot size={14} className={loadingStep === 2 ? "animate-spin text-amber-400" : ""} />
                  <span>{strings.step3}</span>
                </div>
              </div>

              {/* Progress Bar Line */}
              <div className="w-full h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000 ease-out"
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

      {/* Results Display */}
      {result && !isPending && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Main Gauges row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Score Ring Gauge */}
            <Card className="shadow-lg flex flex-col justify-between">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                  <Gauge size={12} />
                  <span>{strings.scoreGaugeTitle}</span>
                </CardTitle>
                <CardDescription className="text-[10px]">
                  {strings.scoreGaugeDesc}
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
                      className={`transition-all duration-1000 ${getScoreColor(result.score)}`}
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 58}
                      strokeDashoffset={2 * Math.PI * 58 * (1 - animatedScore / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className={`text-5xl font-black font-display leading-none tracking-tight ${getScoreColor(result.score)}`}>
                      {animatedScore}
                    </span>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] mt-1 tracking-widest uppercase">
                      / 100
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`px-4 py-1.5 rounded-full border text-xs font-bold flex items-center gap-2 ${getGradeBg(result.grade)}`}>
                    <span>{strings.gradeLabel}</span>
                    <span className="text-sm font-black">{result.grade}</span>
                  </div>
                  <div className="px-3.5 py-1.5 rounded-full border border-[var(--border)] bg-[var(--muted-surface)]/20 text-xs font-bold text-[var(--text-secondary)]">
                    <span>{strings.pagesAnalyzedLabel}</span>
                    <span className="text-xs font-black text-[var(--text-primary)] pr-1.5">{result.pagesAnalyzed}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Metrics cards grid */}
            <Card className="md:col-span-2 shadow-lg">
              <CardHeader className="pb-3 border-b border-[var(--border)]">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                  <Layers size={12} />
                  <span>{strings.metricsTitle}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-2 gap-4">
                {/* Metric 1 */}
                <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--muted-surface)]/20">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-[var(--text-secondary)] font-semibold">{strings.contentQualityLabel}</span>
                    <span className="text-xs font-black text-emerald-500">{result.metrics.contentQuality}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${result.metrics.contentQuality}%` }} />
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--muted-surface)]/20">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-[var(--text-secondary)] font-semibold">{strings.technicalHealthLabel}</span>
                    <span className="text-xs font-black text-amber-500">{result.metrics.technicalHealth}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${result.metrics.technicalHealth}%` }} />
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--muted-surface)]/20">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-[var(--text-secondary)] font-semibold">{strings.internalLinkingLabel}</span>
                    <span className="text-xs font-black text-emerald-500">{result.metrics.internalLinking}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${result.metrics.internalLinking}%` }} />
                  </div>
                </div>

                {/* Metric 4 */}
                <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--muted-surface)]/20">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-[var(--text-secondary)] font-semibold">{strings.semanticCoverageLabel}</span>
                    <span className="text-xs font-black text-teal-400">{result.metrics.semanticCoverage}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500" style={{ width: `${result.metrics.semanticCoverage}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Issues & Recommendations grid row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Issues List */}
            <Card className="shadow-lg">
              <CardHeader className="pb-3 border-b border-[var(--border)]">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                  <Workflow size={12} />
                  <span>{strings.issuesTitle}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                {result.issues.length === 0 ? (
                  <div className="p-4 text-center text-[var(--text-muted)] text-xs font-medium">هیچ خطا یا نقص جدی شناسایی نشد.</div>
                ) : (
                  result.issues.map((issue, i) => (
                    <div key={i} className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--muted-surface)]/15 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span>{getSeverityIcon(issue.severity)}</span>
                          <span className="font-bold text-[var(--text-primary)]">{issue.description}</span>
                        </div>
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-[var(--muted-surface)] border border-[var(--border)] uppercase tracking-widest text-[var(--text-muted)]">{issue.category}</span>
                      </div>
                      <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed font-medium">
                        🔧 {issue.recommendation}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Right: AI Content recommendations list */}
            <Card className="shadow-lg">
              <CardHeader className="pb-3 border-b border-[var(--border)]">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                  <Sparkle size={12} />
                  <span>{strings.recsTitle}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                {result.recommendations.map((rec, i) => (
                  <div key={i} className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--muted-surface)]/15 flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">{getPriorityBadge(rec.priority)}</div>
                    <div className="flex-1 space-y-1">
                      <p className="text-xs text-[var(--text-primary)] leading-relaxed font-bold">{rec.insight}</p>
                      <div className="text-[9px] font-bold text-emerald-500">📈 {rec.estimatedImpact}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Comparison data is not part of the verified premium audit contract. */}
          <Card className="shadow-lg">
            <CardHeader className="pb-3 border-b border-[var(--border)]">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                <Globe size={12} />
                <span>{strings.comparisonTitle}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {isRtl
                  ? "مقایسه رقابتی پس از جمع‌آوری داده معتبر از رقبا در دسترس خواهد بود."
                  : "Competitive comparison will appear after verified competitor data is collected."}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
