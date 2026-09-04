"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";
import {
  Zap, AlertTriangle, ShieldAlert, CheckCircle,
  Settings, Award, RefreshCw, Layers, Layout,
  Cpu, FileText, Download, Smartphone, Eye,
  Globe, Accessibility, Shield, Sparkles, Loader2,
  ChevronDown
} from "lucide-react";

interface Category {
  score: number;
  issues: number;
}

interface CriticalIssue {
  category: string;
  issue: string;
  affectedPages: number;
  impact: "high" | "medium" | "low";
  effort: "easy" | "medium" | "hard";
  recommendation: string;
  codeExample?: string;
}

interface QuickWin {
  issue: string;
  fix: string;
  estimatedTime: string;
}

interface PerformanceMetrics {
  avgLoadTime: string;
  largestContentfulPaint: string;
  cumulativeLayoutShift: string;
  totalPageSize: string;
  imageOptimizationScore: number;
}

interface TechnicalAuditData {
  technicalScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
  pagesAnalyzed: number;
  categories: {
    performance: Category;
    accessibility: Category;
    mobile: Category;
    security: Category;
    technicalSeo: Category;
  };
  criticalIssues: CriticalIssue[];
  quickWins: QuickWin[];
  performanceMetrics: PerformanceMetrics;
}

export const TechnicalOptimizationPanel: React.FC = () => {
  const { language } = useTheme();
  const { session } = useAuth();
  const isRtl = language === "fa";

  const [url, setUrl] = useState("");
  const [pagesToAnalyze, setPagesToAnalyze] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TechnicalAuditData | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  // Multi-step loading phrases
  const steps = [
    { label: isRtl ? "در حال خزش صفحات سایت..." : "Crawling website pages...", icon: Globe },
    { label: isRtl ? "تحلیل عملکرد و سرعت..." : "Analyzing performance and speed...", icon: Zap },
    { label: isRtl ? "بررسی دسترسی‌پذیری..." : "Checking accessibility...", icon: Accessibility },
    { label: isRtl ? "ارزیابی امنیت و سئو فنی..." : "Assessing security and technical SEO...", icon: Shield },
    { label: isRtl ? "تولید پیشنهادات بهینه‌سازی..." : "Generating optimization suggestions...", icon: Sparkles },
  ];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < steps.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 2500);
    } else {
      setCurrentStep(0);
    }
    return () => clearInterval(timer);
  }, [isLoading]);

  const handleStartAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setCurrentStep(0);
    setError(null);
    setData(null);
    setExpanded(null);

    try {
      const workspaceId = session.user?.workspaceId || "ws-tehran";
      const response = await fetch("/api/v1/optimization/technical", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": workspaceId,
          "x-user-id": session.user?.id || "usr-1001"
        },
        body: JSON.stringify({ url, pagesToAnalyze }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || "خطایی در انجام پایش فنی وب‌سایت رخ داد.");
      }

      const resData = await response.json();
      setData(resData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "خطایی در برقراری ارتباط با سرور رخ داد.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Search & Config GlassCard */}
      <GlassCard hoverable={false} className="p-5">
        <form onSubmit={handleStartAnalysis} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            {/* URL Input */}
            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
                <Layout size={14} className="text-[var(--sky-blue-500)]" />
                <span>{isRtl ? "آدرس وب‌سایت هدف" : "Target Website URL"}</span>
              </label>
              <input
                type="url"
                required
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3 text-xs rounded-xl outline-none transition-all duration-300
                         bg-[var(--muted-surface)] text-[var(--text-primary)] border border-[var(--border)]
                         focus:border-[var(--sky-blue-500)] focus:ring-1 focus:ring-[var(--sky-blue-500)]/30 focus:bg-[var(--card)]"
              />
            </div>

            {/* Pages Selector */}
            <div className="w-full md:w-48 space-y-2">
              <label className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
                <Layers size={14} className="text-[var(--orange-500)]" />
                <span>{isRtl ? "تعداد صفحات پایش" : "Pages to Crawl"}</span>
              </label>
              <select
                value={pagesToAnalyze}
                onChange={(e) => setPagesToAnalyze(Number(e.target.value))}
                disabled={isLoading}
                className="w-full px-4 py-3 text-xs rounded-xl outline-none transition-all duration-300
                         bg-[var(--muted-surface)] text-[var(--text-primary)] border border-[var(--border)] cursor-pointer
                         focus:border-[var(--sky-blue-500)]"
              >
                <option value={5}>{isRtl ? "۵ صفحه" : "5 pages"}</option>
                <option value={10}>{isRtl ? "۱۰ صفحه" : "10 pages"}</option>
                <option value={25}>{isRtl ? "۲۵ صفحه" : "25 pages"}</option>
                <option value={50}>{isRtl ? "۵۰ صفحه" : "50 pages"}</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="w-full md:w-auto px-6 py-3 text-xs font-bold rounded-xl text-white cursor-pointer
                       bg-gradient-to-r from-[var(--sky-blue-500)] to-[var(--orange-500)]
                       hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-all duration-300
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="animate-spin" size={14} />
                  <span>{isRtl ? "در حال اجرای پایش..." : "Running Scan..."}</span>
                </>
              ) : (
                <>
                  <Zap size={14} className="animate-pulse" />
                  <span>{isRtl ? "شروع آنالیز فنی سئو" : "Start Technical Analysis"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </GlassCard>

      {/* Error State */}
      {error && (
        <GlassCard hoverable={false} className="p-4 border-red-500/20 bg-red-500/[0.02]">
          <div className="flex gap-3 items-start">
            <ShieldAlert className="text-red-400 mt-0.5" size={18} />
            <div>
              <h4 className="text-xs font-bold text-red-400">{isRtl ? "خطا در فرآیند پایش" : "Audit Pipeline Failed"}</h4>
              <p className="text-[11px] text-red-300/80 mt-1 leading-relaxed">{error}</p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Enhanced Loading State with Multi-Step Animated Progress Indicators */}
      {isLoading && (
        <GlassCard hoverable={false} className="p-8 space-y-6">
          <div className="text-center space-y-2 mb-4">
            <div className="relative flex items-center justify-center mx-auto w-16 h-16">
              <div className="absolute w-16 h-16 border-4 border-[var(--sky-blue-500)]/20 border-t-[var(--sky-blue-500)] rounded-full animate-spin" />
              <Cpu className="text-[var(--sky-blue-500)] animate-pulse" size={24} />
            </div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] mt-3">
              {isRtl ? "پایش فنی و معنایی وب‌سایت در حال اجراست" : "Deep Site Crawl & Semantics In Progress"}
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] max-w-sm mx-auto">
              {isRtl
                ? "فرآیند خزش عمیق و تحلیل کدهای وب‌سایت در حال انجام است. لطفاً منتظر بمانید."
                : "Parsing HTML structures, auditing mobile rendering configurations, and generating solutions."}
            </p>
          </div>

          <div className="space-y-3 max-w-md mx-auto">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = idx === currentStep;
              const isCompleted = idx < currentStep;

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    isActive ? 'bg-[var(--sky-blue-500)]/20 border border-[var(--sky-blue-500)]/40' :
                    isCompleted ? 'bg-[var(--color-success)]/10 border border-[var(--color-success)]/20' :
                    'bg-[var(--muted-surface)]/30 border border-transparent'
                  }`}
                >
                  <Icon size={18} className={isCompleted ? 'text-[var(--color-success)]' : isActive ? 'text-[var(--sky-blue-500)]' : 'text-[var(--text-muted)]'} />
                  <span className={`text-xs ${isCompleted ? 'text-[var(--color-success)]' : isActive ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-muted)]'}`}>
                    {step.label}
                  </span>
                  {isActive && <Loader2 size={16} className="animate-spin ml-auto" />}
                </motion.div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* Result State */}
      {data && (
        <div className="space-y-6 animate-slide-up print:text-black print:bg-white">
          {/* Row 1: Overall score & Grade card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GlassCard hoverable={false} className="p-6 flex flex-col justify-between items-center text-center">
              <div className="w-full text-start mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent-600)] flex items-center gap-1.5">
                  <Award size={14} />
                  <span>{isRtl ? "امتیاز کل بهینه‌سازی فنی" : "Overall Technical Score"}</span>
                </h3>
              </div>

              <div className="relative flex items-center justify-center my-6">
                <div className="w-36 h-36 rounded-full border-4 border-dashed border-[var(--border-strong)] flex flex-col items-center justify-center">
                  <span className="text-5xl font-black text-[var(--text-primary)]">
                    {data.technicalScore}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] font-bold mt-1 uppercase tracking-widest">
                    GRADE {data.grade}
                  </span>
                </div>
              </div>

              <div className="space-y-1 w-full border-t border-[var(--border)] pt-4">
                <p className="text-xs text-[var(--text-secondary)]">
                  {isRtl
                    ? `تعداد کل صفحات پایش شده: ${data.pagesAnalyzed} صفحه`
                    : `Total Pages Crawled: ${data.pagesAnalyzed}`}
                </p>
              </div>
            </GlassCard>

            {/* Performance Metrics Dashboard */}
            <GlassCard hoverable={false} className="lg:col-span-2 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent-600)] flex items-center gap-1.5">
                  <Zap size={14} />
                  <span>{isRtl ? "داشبورد آماری لود و کارایی" : "Speed & Loading Telemetry"}</span>
                </h3>
                <Button variant="ghost" size="sm" onClick={handleExportPDF} className="text-[10px] flex items-center gap-1 cursor-pointer">
                  <Download size={12} />
                  <span>{isRtl ? "خروجی PDF گزارش" : "Export PDF"}</span>
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-[var(--muted-surface)]/40 border border-[var(--border)] rounded-xl text-center">
                  <span className="text-[10px] text-[var(--text-muted)] block mb-1">{isRtl ? "میانگین لود" : "Avg Load Time"}</span>
                  <span className="text-sm font-black text-[var(--text-primary)]">{data.performanceMetrics.avgLoadTime}</span>
                </div>
                <div className="p-3 bg-[var(--muted-surface)]/40 border border-[var(--border)] rounded-xl text-center">
                  <span className="text-[10px] text-[var(--text-muted)] block mb-1">Largest Contentful Paint (LCP)</span>
                  <span className="text-sm font-black text-[var(--orange-500)]">{data.performanceMetrics.largestContentfulPaint}</span>
                </div>
                <div className="p-3 bg-[var(--muted-surface)]/40 border border-[var(--border)] rounded-xl text-center">
                  <span className="text-[10px] text-[var(--text-muted)] block mb-1">Cumulative Layout Shift (CLS)</span>
                  <span className="text-sm font-black text-emerald-400">{data.performanceMetrics.cumulativeLayoutShift}</span>
                </div>
                <div className="p-3 bg-[var(--muted-surface)]/40 border border-[var(--border)] rounded-xl text-center">
                  <span className="text-[10px] text-[var(--text-muted)] block mb-1">{isRtl ? "مجموع حجم صفحه" : "Total Page Size"}</span>
                  <span className="text-sm font-black text-[var(--text-primary)]">{data.performanceMetrics.totalPageSize}</span>
                </div>
              </div>

              {/* Progress Slider image optimization */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] text-[var(--text-muted)]">{isRtl ? "امتیاز فشرده‌سازی و بهینه‌سازی تصاویر" : "Image Compression Score"}</span>
                  <span className="font-black text-emerald-400">{data.performanceMetrics.imageOptimizationScore} / 100</span>
                </div>
                <div className="h-1.5 w-full bg-[var(--border)] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${data.performanceMetrics.imageOptimizationScore}%` }} />
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Enhanced Category Cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              {isRtl ? "تفکیک جزئیات پایش براساس دسته‌بندی‌ها" : "Category Breakdown"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              {[
                {
                  key: "performance",
                  label: isRtl ? "عملکرد" : "Performance",
                  icon: Zap,
                  score: data.categories.performance.score,
                  issuesCount: data.categories.performance.issues,
                },
                {
                  key: "accessibility",
                  label: isRtl ? "دسترسی‌پذیری" : "Accessibility",
                  icon: Accessibility,
                  score: data.categories.accessibility.score,
                  issuesCount: data.categories.accessibility.issues,
                },
                {
                  key: "mobile",
                  label: isRtl ? "سازگاری موبایل" : "Mobile",
                  icon: Smartphone,
                  score: data.categories.mobile.score,
                  issuesCount: data.categories.mobile.issues,
                },
                {
                  key: "security",
                  label: isRtl ? "امنیت" : "Security",
                  icon: Shield,
                  score: data.categories.security.score,
                  issuesCount: data.categories.security.issues,
                },
                {
                  key: "technicalSeo",
                  label: isRtl ? "سئو فنی" : "Technical SEO",
                  icon: FileText,
                  score: data.categories.technicalSeo.score,
                  issuesCount: data.categories.technicalSeo.issues,
                }
              ].map((cat) => {
                const Icon = cat.icon;
                const score = cat.score;
                const issuesCount = cat.issuesCount;

                return (
                  <div
                    key={cat.key}
                    className="glass-card p-6 rounded-2xl hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(56,189,248,0.15)] transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl ${score >= 80 ? 'bg-green-500/20' : score >= 60 ? 'bg-yellow-500/20' : 'bg-red-500/20'}`}>
                        <Icon size={24} className={score >= 80 ? 'text-green-500' : score >= 60 ? 'text-yellow-500' : 'text-red-500'} />
                      </div>
                      <span className="text-3xl font-bold">{score}</span>
                    </div>
                    <h3 className="text-sm font-medium text-[var(--text-muted)] mb-2">{cat.label}</h3>
                    <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[var(--sky-blue-500)] to-[var(--orange-500)] rounded-full transition-all duration-500"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-2">
                      {isRtl
                        ? `${issuesCount} مورد نیاز به بهبود`
                        : `${issuesCount} issues found`}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Wins Section */}
          <GlassCard hoverable={false} className="p-5 border-emerald-500/10 bg-emerald-500/[0.01]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-4">
              <CheckCircle size={14} />
              <span>{isRtl ? "پیشنهادات بهبود فوری (Quick Wins)" : "Quick Wins"}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.quickWins.map((win, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.02] flex items-start gap-3">
                  <Zap className="text-emerald-400 flex-shrink-0 mt-0.5 animate-pulse" size={16} />
                  <div>
                    <h4 className="text-xs font-bold text-[var(--text-primary)] leading-normal">{win.issue}</h4>
                    <p className="text-[10px] text-emerald-300/80 mt-1 leading-relaxed">{win.fix}</p>
                    <span className="text-[9px] text-emerald-400/60 block mt-1.5 font-bold">{isRtl ? `زمان تخمینی: ${win.estimatedTime}` : `Estimated Time: ${win.estimatedTime}`}</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Expandable Critical Issues Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
              <AlertTriangle size={14} />
              <span>{isRtl ? "خطاهای بحرانی و نیاز به توجه (Critical Issues)" : "Critical Issues"}</span>
            </h3>

            <div className="space-y-3">
              {data.criticalIssues.map((issue, idx) => (
                <div key={idx} className="glass-card rounded-xl border border-[var(--glass-border)] overflow-hidden transition-all duration-300">
                  <div
                    onClick={() => setExpanded(expanded === idx ? null : idx)}
                    className="p-4 cursor-pointer hover:bg-[var(--muted-surface)] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertTriangle size={20} className="text-red-500" />
                        <h4 className="font-medium text-[var(--text-primary)] text-sm">{issue.issue}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[10px] rounded-full font-semibold ${issue.impact === 'high' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                          {issue.impact === 'high' ? (isRtl ? 'بحرانی' : 'Critical') : (isRtl ? 'هشدار' : 'Warning')}
                        </span>
                        <ChevronDown size={16} className={`transition-transform ${expanded === idx ? 'rotate-180' : ''} text-[var(--text-muted)]`} />
                      </div>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-2">
                      {isRtl
                        ? `${issue.affectedPages} صفحه تحت تأثیر`
                        : `${issue.affectedPages} pages affected`}
                    </p>
                  </div>

                  <AnimatePresence>
                    {expanded === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-[var(--glass-border)] bg-[var(--muted-surface)]/30"
                      >
                        <div className="p-4 space-y-3">
                          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{issue.recommendation}</p>
                          {issue.codeExample && (
                            <pre className="bg-[var(--bg-secondary)] p-3 rounded-lg overflow-x-auto text-[10px] text-[var(--text-primary)] font-mono leading-normal whitespace-pre">
                              <code>{issue.codeExample}</code>
                            </pre>
                          )}
                          <div className="flex items-center gap-4 text-[10px] text-[var(--text-muted)] font-bold">
                            <span>
                              {isRtl ? `تأثیر: ${issue.impact === 'high' ? 'زیاد' : issue.impact === 'medium' ? 'متوسط' : 'کم'}` : `Impact: ${issue.impact}`}
                            </span>
                            <span>
                              {isRtl ? `تلاش: ${issue.effort === 'easy' ? 'آسان' : issue.effort === 'medium' ? 'متوسط' : 'سخت'}` : `Effort: ${issue.effort}`}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
