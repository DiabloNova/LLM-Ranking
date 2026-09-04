"use client";

import React, { useState, useEffect, useTransition, useRef } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { LlmAnalyticsResponse } from "@/app/api/v1/analytics/llm/route";
import {
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  BrainCircuit,
  MessageSquare,
  ShieldCheck,
  ChevronLeft,
  Flame,
  ArrowRight,
  Plus,
  X,
  PieChartIcon,
  CircleDot
} from "lucide-react";

export const LlmAnalyticsPanel: React.FC = () => {
  const { language, direction } = useTheme();
  const { session } = useAuth();
  const isRtl = language === "fa";

  // Inputs
  const [brandName, setBrandName] = useState("خانه خلاق هوش مصنوعی");
  const [competitorInput, setCompetitorInput] = useState("");
  const [competitors, setCompetitors] = useState<string[]>(["دیجی‌کالا", "اسنپ"]);

  // Dynamic queries
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([
    "نقاط قوت و ضعف [برند] در مقایسه با رقبا چیست؟",
    "آیا [برند] جایگزین هوشمند و مناسبی برای کسب‌وکارهای آنلاین است؟"
  ]);
  const [customQuery, setCustomQuery] = useState("");

  // Results
  const [result, setResult] = useState<LlmAnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Multi-step loader states
  const [loadingStep, setLoadingStep] = useState(0);

  // Sentiment score animation
  const [animatedScore, setAnimatedScore] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Predefined templates available to click
  const templates = [
    "جایگزین‌های مناسب و هوشمند [برند] در بازار ایران کدامند؟",
    "نظرات و بازخوردهای کاربران درباره کیفیت خدمات [برند] چیست؟",
    "نقاط قوت و ضعف [برند] در مقایسه با رقبا چیست؟",
    "آیا [برند] جایگزین هوشمند و مناسبی برای کسب‌وکارهای آنلاین است؟"
  ];

  // Auto-advance loading steps during submission
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

  // Animate the sentiment gauge score once results load
  useEffect(() => {
    if (result) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      let start = 0;
      const end = result.sentimentScore;
      if (start === end) {
        setAnimatedScore(end);
        return;
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
      setAnimatedScore(0);
    }
  }, [result]);

  const addCompetitor = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = competitorInput.trim();
    if (trimmed && !competitors.includes(trimmed)) {
      setCompetitors([...competitors, trimmed]);
      setCompetitorInput("");
    }
  };

  const removeCompetitor = (name: string) => {
    setCompetitors(competitors.filter((c) => c !== name));
  };

  const toggleTemplate = (tpl: string) => {
    if (selectedTemplates.includes(tpl)) {
      setSelectedTemplates(selectedTemplates.filter((t) => t !== tpl));
    } else {
      setSelectedTemplates([...selectedTemplates, tpl]);
    }
  };

  const addCustomQuery = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customQuery.trim();
    if (trimmed && !selectedTemplates.includes(trimmed)) {
      setSelectedTemplates([...selectedTemplates, trimmed]);
      setCustomQuery("");
    }
  };

  const removeTemplate = (tpl: string) => {
    setSelectedTemplates(selectedTemplates.filter((t) => t !== tpl));
  };

  const handleStartAnalysis = () => {
    if (!brandName.trim()) {
      setError(isRtl ? "لطفاً نام برند خود را وارد کنید." : "Please enter your brand name.");
      return;
    }
    if (competitors.length === 0) {
      setError(isRtl ? "لطفاً حداقل نام یک رقیب را اضافه کنید." : "Please add at least one competitor.");
      return;
    }
    if (selectedTemplates.length === 0) {
      setError(isRtl ? "لطفاً حداقل یک پرس‌وجو برای تحلیل مشخص کنید." : "Please select or write at least one query.");
      return;
    }

    setError(null);
    setResult(null);

    // Resolve templates by replacing '[برند]' with actual brandName
    const finalQueries = selectedTemplates.map((q) => q.replace(/\[برند\]/g, brandName));

    startTransition(async () => {
      try {
        const workspaceId = session?.user?.workspaceId || "ws-tehran";

        const response = await fetch("/api/v1/analytics/llm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": workspaceId,
            "x-user-id": session?.user?.id || "usr-analytics-default",
          },
          body: JSON.stringify({
            brandName,
            competitorNames: competitors,
            queries: finalQueries,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || (isRtl ? "خطا در برقراری ارتباط با سرویس تحلیل مدل‌های زبانی." : "Failed to run LLM Analytics."));
        }

        setResult(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      }
    });
  };

  // Color mappings for Pie cells
  const COLORS = ["#1F76F9", "#FF6B00", "#FFC700", "#4F46E5", "#06B6D4", "#10B981"];

  // Prepare PieChart data
  const chartData = result
    ? [
        { name: isRtl ? "سهم برند شما" : "Your Brand", value: result.shareOfVoice.yourBrand },
        ...result.shareOfVoice.competitors.map((c) => ({
          name: c.name,
          value: c.percentage,
        })),
      ]
    : [];

  // Helper to highlight mentions in response text
  const highlightMentions = (text: string) => {
    if (!text) return "";
    let highlighted = text;

    // Highlight brandName in green
    const brandRegex = new RegExp(`(${brandName})`, "g");
    highlighted = highlighted.replace(
      brandRegex,
      `<span class="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/10">$1</span>`
    );

    // Highlight competitors in orange/amber
    competitors.forEach((comp) => {
      const compRegex = new RegExp(`(${comp})`, "g");
      highlighted = highlighted.replace(
        compRegex,
        `<span class="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/10">$1</span>`
      );
    });

    return <div dangerouslySetInnerHTML={{ __html: highlighted }} className="leading-relaxed" />;
  };

  return (
    <div className="space-y-6 animate-fade-in" dir={isRtl ? "rtl" : "ltr"}>
      {/* Configuration GlassCard */}
      <Card className="backdrop-blur-md shadow-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-sky-500 to-indigo-500 border border-sky-500/30 rounded-xl text-white shadow-lg shadow-sky-950/20">
              <BrainCircuit size={18} className="animate-pulse" />
            </div>
            <div>
              <CardTitle>{isRtl ? "پایش و تحلیل سهم صدا در مدل‌های زبانی" : "LLM Analytics & Share of Voice"}</CardTitle>
              <CardDescription dir={isRtl ? "rtl" : "ltr"}>
                {isRtl
                  ? "شبیه‌سازی و ارزیابی عمیق پرس‌وجو‌های مقایسه‌ای برند در ربات‌های پاسخ‌گو (ChatGPT, Claude) به همراه تحلیل احساسات و میزان سهم ارجاع هوش مصنوعی"
                  : "Simulate and analyze real queries across top conversational models to calculate brand mentions, LLM Share of Voice, and sentiment Index."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Right/Left Column: Brand & Competitors */}
            <div className="space-y-4">
              {/* Brand Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)]">
                  {isRtl ? "نام رسمی برند شما:" : "Your Brand Official Name:"}
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder={isRtl ? "مثال: خانه خلاق هوش مصنوعی" : "e.g., Optimus AI"}
                  className="w-full px-4 py-2.5 text-xs rounded-xl outline-none transition-all duration-300 bg-[var(--muted-surface)] text-[var(--text-primary)] border border-[var(--border)] focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 focus:bg-[var(--card)]"
                  disabled={isPending}
                />
              </div>

              {/* Competitors Tag input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)]">
                  {isRtl ? "نام برندهای رقیب:" : "Competitor Brands:"}
                </label>
                <form onSubmit={addCompetitor} className="flex gap-2">
                  <input
                    type="text"
                    value={competitorInput}
                    onChange={(e) => setCompetitorInput(e.target.value)}
                    placeholder={isRtl ? "نام رقیب جدید..." : "Add competitor brand name..."}
                    className="flex-1 px-4 py-2.5 text-xs rounded-xl outline-none transition-all duration-300 bg-[var(--muted-surface)] text-[var(--text-primary)] border border-[var(--border)] focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 focus:bg-[var(--card)]"
                    disabled={isPending}
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={isPending || !competitorInput.trim()}
                    className="p-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--muted-surface)] text-[var(--text-primary)]"
                  >
                    <Plus size={16} />
                  </Button>
                </form>

                {/* Tags container */}
                <div className="flex flex-wrap gap-2 pt-1.5">
                  {competitors.map((comp) => (
                    <div
                      key={comp}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded-lg border border-orange-500/25 bg-orange-500/10 text-orange-500 dark:text-orange-400"
                    >
                      <span>{comp}</span>
                      {!isPending && (
                        <button
                          type="button"
                          onClick={() => removeCompetitor(comp)}
                          className="hover:text-[var(--text-primary)] transition-colors"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                  {competitors.length === 0 && (
                    <span className="text-[10px] text-[var(--text-muted)] italic">
                      {isRtl ? "هیچ رقیبی ثبت نشده است" : "No competitors registered"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Left/Right Column: Query list */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)]">
                  {isRtl ? "پرس‌وجوهای مورد تحلیل (تمپلیت‌ها):" : "Selected Query Templates:"}
                </label>

                {/* Templates pre-selection */}
                <div className="space-y-2">
                  {templates.map((tpl, idx) => {
                    const isSelected = selectedTemplates.includes(tpl);
                    const resolvedText = tpl.replace(/\[برند\]/g, brandName);

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleTemplate(tpl)}
                        className={`w-full text-start p-2.5 text-[10px] rounded-xl border transition-all duration-300 flex items-start gap-2 ${
                          isSelected
                            ? "border-sky-500/30 bg-sky-500/10 text-sky-400 font-bold"
                            : "border-[var(--border)] bg-[var(--muted-surface)]/20 text-[var(--text-secondary)] hover:bg-[var(--muted-surface)]"
                        }`}
                        disabled={isPending}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${isSelected ? "bg-sky-400" : "bg-[var(--border-strong)]"}`} />
                        <span className="leading-relaxed">{resolvedText}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom template writer */}
              <form onSubmit={addCustomQuery} className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--text-muted)]">
                  {isRtl ? "افزودن پرس‌وجو دست‌نویس با الگوی [برند]:" : "Add custom template (use [brand] placeholder):"}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customQuery}
                    onChange={(e) => setCustomQuery(e.target.value)}
                    placeholder={isRtl ? "بهترین ویژگی کاربردی [برند] چیست؟" : "What is the best feature of [brand]?"}
                    className="flex-1 px-4 py-2 text-xs rounded-xl outline-none transition-all duration-300 bg-[var(--muted-surface)] text-[var(--text-primary)] border border-[var(--border)] focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30"
                    disabled={isPending}
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={isPending || !customQuery.trim()}
                    className="px-3 text-xs font-bold border border-[var(--border)] hover:bg-[var(--muted-surface)] text-[var(--text-primary)]"
                  >
                    {isRtl ? "ثبت" : "Add"}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Stepper Progress Indicator */}
          {isPending && (
            <div className="mt-6 space-y-4 p-5 rounded-2xl border border-sky-500/15 bg-sky-500/5 animate-pulse">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className={`flex items-center gap-2.5 font-bold ${loadingStep === 0 ? "text-sky-400" : "text-[var(--text-muted)]"}`}>
                  <CircleDot size={14} className={loadingStep === 0 ? "animate-spin text-sky-400" : ""} />
                  <span>{isRtl ? "شبیه‌سازی پرس‌وجو از مدل‌های زبانی..." : "Simulating queries from LLM models..."}</span>
                </div>
                <div className={`flex items-center gap-2.5 font-bold ${loadingStep === 1 ? "text-sky-400" : "text-[var(--text-muted)]"}`}>
                  <CircleDot size={14} className={loadingStep === 1 ? "animate-spin text-sky-400" : ""} />
                  <span>{isRtl ? "تحلیل احساسات و ذکر برند..." : "Analyzing sentiment and brand mention rate..."}</span>
                </div>
                <div className={`flex items-center gap-2.5 font-bold ${loadingStep === 2 ? "text-sky-400" : "text-[var(--text-muted)]"}`}>
                  <CircleDot size={14} className={loadingStep === 2 ? "animate-spin text-sky-400" : ""} />
                  <span>{isRtl ? "محاسبه سهم صدا..." : "Compiling brand Share of Voice..."}</span>
                </div>
              </div>

              <div className="w-full h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-1000 ease-out"
                  style={{ width: `${(loadingStep + 1) * 33.3}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl border border-red-500/10 bg-red-500/5 text-red-400 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">{error}</p>
            </div>
          )}

          {/* Action Trigger Button */}
          <div className="flex justify-end pt-4 border-t border-white/5">
            <Button
              onClick={handleStartAnalysis}
              disabled={isPending}
              className="gap-2 px-6 py-3 font-black rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 border-none text-white shadow-lg shadow-sky-950/20 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300"
            >
              <Sparkles size={14} className="animate-pulse" />
              <span>{isRtl ? "شروع تحلیل هوش مصنوعی" : "Analyze Share of Voice"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results View */}
      {result && !isPending && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* 1. Share of Voice Chart Card */}
            <Card className="shadow-lg flex flex-col justify-between">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                  <PieChartIcon size={12} />
                  <span>{isRtl ? "سهم صدا در مدل‌های زبانی (SOV)" : "LLM Share of Voice (SOV)"}</span>
                </CardTitle>
                <CardDescription className="text-[10px]">
                  {isRtl ? "میزان توصیه‌شدن برند شما در برابر رقبا" : "Recommendation frequency across LLM models"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col items-center justify-center py-4">
                <div className="h-44 w-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          border: "1px solid var(--border)",
                          color: "var(--text-primary)",
                          borderRadius: "10px",
                          fontSize: "10px"
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Central Text with SOV percentage */}
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-sky-400 font-display">
                      {result.shareOfVoice.yourBrand}%
                    </span>
                    <span className="text-[8px] text-[var(--text-muted)] tracking-wider">
                      {isRtl ? "برند شما" : "YOUR BRAND"}
                    </span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="w-full grid grid-cols-2 gap-2 mt-2">
                  {chartData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2 p-1.5 rounded bg-[var(--muted-surface)]/20 border border-[var(--border)]">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-[10px] font-bold text-[var(--text-secondary)] truncate flex-1">{item.name}</span>
                      <span className="text-[10px] font-black text-[var(--text-primary)]">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 2. Sentiment Gauge Card */}
            <Card className="shadow-lg flex flex-col justify-between">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                  <TrendingUp size={12} />
                  <span>{isRtl ? "شاخص کلی احساسات مدل‌ها" : "Overall AI Sentiment Index"}</span>
                </CardTitle>
                <CardDescription className="text-[10px]">
                  {isRtl ? "ارزیابی لحن پاسخ‌ها نسبت به برند شما" : "Average sentiment tone across simulated responses"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col items-center justify-center py-4">
                <div className="relative flex items-center justify-center h-40">
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
                      className="stroke-sky-500 transition-all duration-1000"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 58}
                      strokeDashoffset={2 * Math.PI * 58 * (1 - animatedScore / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-sky-400 font-display">
                      {animatedScore}
                    </span>
                    <span className="text-[9px] font-bold text-[var(--text-muted)] mt-0.5 uppercase tracking-widest">
                      / 100
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <Badge
                    variant={result.sentimentScore >= 75 ? "success" : result.sentimentScore >= 50 ? "info" : "error"}
                    className="font-bold text-[10px] px-3.5 py-1"
                  >
                    {result.sentimentScore >= 75
                      ? (isRtl ? "لحن کلی: کاملاً مثبت و همگرا" : "Overall Tone: Highly Positive")
                      : result.sentimentScore >= 50
                      ? (isRtl ? "لحن کلی: خنثی و مقایسه‌ای" : "Overall Tone: Neutral")
                      : (isRtl ? "لحن کلی: نیازمند توجه فوری" : "Overall Tone: Critical")}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* 3. Actionable Insights */}
            <Card className="shadow-lg flex flex-col justify-between">
              <CardHeader className="pb-3 border-b border-[var(--border)]">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                  <ShieldCheck size={12} />
                  <span>{isRtl ? "بینش‌ها و اقدامات استراتژیک" : "Brand Defense Insights"}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 py-4 space-y-3">
                {result.actionableInsights.map((insight, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-sky-500/10 bg-sky-500/5 flex items-start gap-2 text-xs"
                  >
                    <Flame size={14} className="text-orange-400 flex-shrink-0 mt-0.5 animate-pulse" />
                    <div className="space-y-1.5">
                      <p className="leading-relaxed font-bold text-[var(--text-primary)]">{insight}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Detailed query result response cards */}
          <Card className="shadow-lg">
            <CardHeader className="pb-3 border-b border-[var(--border)]">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <MessageSquare size={12} />
                <span>{isRtl ? "جزئیات شبیه‌سازی مدل زبانی و تحلیل پاسخ‌ها" : "Simulated AI Query Outputs & Semantic Analysis"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {result.queryResults.map((qr, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--muted-surface)]/10 space-y-3.5"
                >
                  {/* Query Header info */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs pb-3 border-b border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <HelpCircle size={14} className="text-sky-400" />
                      <span className="font-bold text-[var(--text-primary)]">« {qr.query} »</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Brand Mention Badge */}
                      <Badge variant={qr.brandMentioned ? "success" : "error"} className="text-[10px]">
                        {qr.brandMentioned
                          ? (isRtl ? "ذکر برند: بله" : "Brand Mentioned: Yes")
                          : (isRtl ? "ذکر برند: خیر" : "Brand Mentioned: No")}
                      </Badge>

                      {/* Sentiment Badge */}
                      <Badge variant={qr.sentiment === "positive" ? "success" : qr.sentiment === "neutral" ? "info" : "error"} className="text-[10px]">
                        {isRtl ? `احساسات: ${qr.sentiment === "positive" ? "مثبت" : qr.sentiment === "neutral" ? "خنثی" : "منفی"}` : `Sentiment: ${qr.sentiment}`}
                      </Badge>

                      {/* Hallucination Risk Badge */}
                      <Badge variant={qr.hallucinationRisk === "low" ? "success" : qr.hallucinationRisk === "medium" ? "warning" : "error"} className="text-[10px]">
                        {isRtl
                          ? `ریسک توهم: ${qr.hallucinationRisk === "low" ? "پایین" : qr.hallucinationRisk === "medium" ? "متوسط" : "بالا"}`
                          : `Hallucination: ${qr.hallucinationRisk}`}
                      </Badge>
                    </div>
                  </div>

                  {/* Simulated Response text with highlight */}
                  <div className="text-xs space-y-1.5 leading-relaxed bg-[var(--muted-surface)] p-3.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)]">
                    <div className="text-[10px] text-[var(--text-muted)] font-black mb-1 uppercase tracking-wider flex items-center gap-1">
                      <BrainCircuit size={10} />
                      <span>{isRtl ? "پاسخ مدل زبانی فرضی" : "Simulated AI Model Answer"}</span>
                    </div>
                    {highlightMentions(qr.simulatedResponse)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
