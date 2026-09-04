"use client";

import React, { useState, useTransition, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip
} from "recharts";
import {
  Sparkles,
  Flame,
  AlertTriangle,
  Lightbulb,
  Search,
  RefreshCw,
  Cpu,
  Bookmark,
  TrendingUp,
  XCircle,
  FileText
} from "lucide-react";

interface AuditMetric {
  entityDensity: number;
  relationshipClarity: number;
  sentimentHealth: number;
}

interface Recommendation {
  priority: "high" | "medium" | "low";
  category: "content" | "structure" | "reputation";
  insight: string;
}

interface AuditResult {
  aeoScore: number;
  metrics: AuditMetric;
  recommendations: Recommendation[];
}

interface RadarData {
  subject: string;
  value: number;
}

export const AeoAuditPanel: React.FC = () => {
  const { language, direction } = useTheme();
  const { session } = useAuth();
  const isRtl = language === "fa";

  const [targetBrand, setTargetBrand] = useState("");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [mounted, setMounted] = useState(false);

  // Defer render setup to ensure flawless Hydration
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const strings = {
    panelTitle: isRtl ? "تحلیل عمیق و بهینه‌سازی معنایی برند (AEO)" : "Semantic AEO & SEO Brand Audit",
    panelDesc: isRtl
      ? "تراکم مفاهیم، شبکه ارتباطات گراف معنایی و سلامت احساسات را ارزیابی کرده و نسخه‌های بهینه‌سازی موتورهای پاسخ‌گو را دریافت نمایید."
      : "Audit entity density, relationship clarity, and sentiment scores. Receive automated AEO recommendations.",
    inputPlaceholder: isRtl ? "نام برند یا شرکت خود را وارد کنید (مثال: دیجی کالا)..." : "Enter brand or entity name (e.g., Optimus)...",
    btnAnalyze: isRtl ? "شروع تحلیل معنایی" : "Run Semantic Audit",
    btnAnalyzing: isRtl ? "در حال پایش گراف دانش..." : "Auditing Semantic Graph...",
    scoreGaugeTitle: isRtl ? "شاخص آمادگی موتور پاسخ‌گو" : "AEO Readiness Index",
    scoreGaugeDesc: isRtl ? "امتیاز کلی حضور شما در مدل‌های زبانی بزرگ" : "Synthesized weight across semantic components",
    metricsTitle: isRtl ? "شاخص‌های سه‌گانه حضور معنایی" : "Three Semantic Diagnostic Pillars",
    recommendationsTitle: isRtl ? "توصیه‌های استراتژیک هوش مصنوعی" : "AI Generated Strategic Insights",
    recsDesc: isRtl
      ? "راهکارهای خودکار برای برطرف‌سازی نقص‌های معنایی در موتورهای پاسخ‌دهی:"
      : "Automated steps to secure citation anchors and fix model representation gaps:",
    priorityHigh: isRtl ? "اولویت حیاتی" : "High Priority",
    priorityMedium: isRtl ? "اولویت متوسط" : "Medium Priority",
    priorityLow: isRtl ? "اولویت عادی" : "Low Priority",
    categoryContent: isRtl ? "محتوا" : "Content",
    categoryStructure: isRtl ? "ساختار" : "Structure",
    categoryReputation: isRtl ? "اعتبار" : "Reputation",
    validationError: isRtl ? "لطفاً نام برند مورد نظر را وارد نمایید." : "Please enter a brand or company name to audit.",
    apiError: isRtl ? "خطا در بازیابی اطلاعات تحلیل. مطمئن شوید پایگاه داده فعال است." : "Failed to retrieve semantic audit payload. Check database connectivity.",
    emptyResultTitle: isRtl ? "درگاه آزمایش سئو معنایی" : "Semantic SEO Diagnostic Center",
    emptyResultDesc: isRtl
      ? "برای ارزیابی و استخراج اتوماتیک نقشه بهینه‌سازی، نام برند مورد نظر را جستجو کنید."
      : "Enter your company name to scan database relationships and compile direct GEO/AEO recommendations.",
    entityDensityLabel: isRtl ? "تراکم موجودیت" : "Entity Density",
    relationshipClarityLabel: isRtl ? "وضوح روابط" : "Relationship Clarity",
    sentimentHealthLabel: isRtl ? "سلامت احساسات" : "Sentiment Health",
    radarScore: isRtl ? "امتیاز" : "Score"
  };

  const handleAudit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = targetBrand.trim();

    if (!trimmed) {
      setError(strings.validationError);
      return;
    }

    setError(null);
    setResult(null);

    startTransition(async () => {
      try {
        const workspaceId = session.user?.workspaceId || "ws-tehran";

        const res = await fetch("/api/v1/audit/aeo-insight", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": workspaceId,
            "x-user-id": session.user?.id || "usr-1001",
          },
          body: JSON.stringify({ targetBrandOrEntity: trimmed })
        });

        if (!res.ok) {
          throw new Error(strings.apiError);
        }

        const data: AuditResult = await res.json();
        setResult(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : strings.apiError);
      }
    });
  };

  if (!mounted) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-4 w-48 bg-[var(--muted-surface)] rounded mb-2" />
          <div className="h-3 w-80 bg-[var(--muted-surface)] rounded" />
        </CardHeader>
        <CardContent className="h-64 bg-[var(--muted-surface)] rounded-xl" />
      </Card>
    );
  }

  // Define color scales for circular gauge based on AEO Score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "stroke-emerald-500 text-emerald-400";
    if (score >= 50) return "stroke-amber-500 text-amber-400";
    return "stroke-red-500 text-red-400";
  };

  const getPriorityBadge = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high":
        return (
          <Badge variant="error" className="gap-1 px-2 py-0.5 text-[9px] font-bold">
            <Flame size={10} />
            <span>{strings.priorityHigh}</span>
          </Badge>
        );
      case "medium":
        return (
          <Badge variant="warning" className="gap-1 px-2 py-0.5 text-[9px] font-bold text-amber-400">
            <AlertTriangle size={10} />
            <span>{strings.priorityMedium}</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="info" className="gap-1 px-2 py-0.5 text-[9px] font-bold text-sky-400">
            <Lightbulb size={10} />
            <span>{strings.priorityLow}</span>
          </Badge>
        );
    }
  };

  const getCategoryLabel = (category: "content" | "structure" | "reputation") => {
    switch (category) {
      case "content":
        return strings.categoryContent;
      case "structure":
        return strings.categoryStructure;
      default:
        return strings.categoryReputation;
    }
  };

  const radarData: RadarData[] = result
    ? [
        { subject: strings.entityDensityLabel, value: result.metrics.entityDensity },
        { subject: strings.relationshipClarityLabel, value: result.metrics.relationshipClarity },
        { subject: strings.sentimentHealthLabel, value: result.metrics.sentimentHealth }
      ]
    : [];

  return (
    <div className="space-y-6 animate-fade-in" dir={direction}>
      {/* Title Card */}
      <Card className="backdrop-blur-md shadow-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[#1F76F9]">
              <Sparkles size={18} />
            </div>
            <div>
              <CardTitle>{strings.panelTitle}</CardTitle>
              <CardDescription>{strings.panelDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search input Form */}
          <form onSubmit={handleAudit} className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className={`absolute top-1/2 -translate-y-1/2 text-[var(--text-muted)] ${isRtl ? "right-4" : "left-4"}`} />
              <input
                type="text"
                value={targetBrand}
                onChange={(e) => setTargetBrand(e.target.value)}
                placeholder={strings.inputPlaceholder}
                className={`
                  w-full py-2.5 text-xs rounded-xl outline-none transition-all duration-300
                  bg-[var(--muted-surface)] text-[var(--text-primary)] border border-[var(--border)]
                  focus:border-[#1F76F9] focus:ring-1 focus:ring-[#1F76F9]/30 focus:bg-[var(--card)]
                  placeholder:text-[var(--text-muted)]
                  ${isRtl ? "pr-11 pl-4" : "pl-11 pr-4"}
                `}
                disabled={isPending}
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              disabled={isPending || !targetBrand.trim()}
              className="gap-2 px-5 py-2.5 font-bold rounded-xl"
            >
              {isPending ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>{strings.btnAnalyzing}</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>{strings.btnAnalyze}</span>
                </>
              )}
            </Button>
          </form>

          {/* Validation or API Error Alerts */}
          {error && (
            <div className="p-3.5 mt-4 rounded-xl border border-red-500/10 bg-red-500/5 text-red-400 text-xs flex items-start gap-2 animate-shake">
              <XCircle size={14} className="flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {!result ? (
        /* Empty Sandbox Diagnostic State */
        <Card className="backdrop-blur-md p-10 text-center flex flex-col items-center justify-center min-h-[300px]">
          <div className="p-4 rounded-full bg-[var(--muted-surface)]/40 border border-[var(--border)] text-[var(--text-muted)]/25 mb-4 animate-pulse-glow">
            <Cpu size={32} className="text-[#1F76F9]" />
          </div>
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1.5">{strings.emptyResultTitle}</h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-md leading-relaxed">{strings.emptyResultDesc}</p>
        </Card>
      ) : (
        /* Dynamic Audit Results */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Circular Gauge Score Column */}
          <Card className="flex flex-col justify-between shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent-600)] flex items-center gap-1.5">
                <TrendingUp size={12} />
                <span>{strings.scoreGaugeTitle}</span>
              </CardTitle>
              <CardDescription className="text-[10px]">
                {strings.scoreGaugeDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6 flex-1">
              <div className="relative flex items-center justify-center">
                {/* SVG Radial progress circle */}
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="52"
                    className="stroke-[var(--border)]"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="52"
                    className={`transition-all duration-1000 ${getScoreColor(result.aeoScore)}`}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 52}
                    strokeDashoffset={2 * Math.PI * 52 * (1 - result.aeoScore / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                {/* Score digits absolute center */}
                <div className="absolute flex flex-col items-center justify-center">
                  <span className={`text-4xl font-black font-display leading-none ${result.aeoScore >= 80 ? 'text-emerald-400' : result.aeoScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                    {result.aeoScore}
                  </span>
                  <span className="text-[10px] font-bold text-[var(--text-muted)] mt-1 tracking-widest uppercase">
                    / 100
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recharts RadarChart Pillar Column */}
          <Card className="shadow-lg">
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent-600)] flex items-center gap-1.5">
                <Cpu size={12} />
                <span>{strings.metricsTitle}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[210px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    stroke="var(--text-muted)"
                    fontSize={10}
                    tickLine={false}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    stroke="var(--border-strong)"
                    fontSize={8}
                    tickLine={false}
                  />
                  <Radar
                    name={strings.radarScore}
                    dataKey="value"
                    stroke="#1F76F9"
                    fill="#1F76F9"
                    fillOpacity={0.25}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      borderRadius: "8px",
                      fontSize: "11px",
                      color: "var(--text-primary)"
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recommendations List Column */}
          <Card className="lg:col-span-3 shadow-lg">
            <CardHeader className="border-b border-[var(--border)] pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Sparkles size={16} className="text-[#1F76F9]" />
                <span>{strings.recommendationsTitle}</span>
              </CardTitle>
              <CardDescription className="text-xs">
                {strings.recsDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 max-h-[380px] overflow-y-auto pr-1">
              {result.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="
                    p-4 rounded-xl border border-[var(--border)] bg-[var(--muted-surface)]/20 backdrop-blur-sm
                    hover:border-[var(--sky-blue-500)]/45 transition-all duration-200 flex flex-col sm:flex-row sm:items-start gap-3.5
                  "
                >
                  {/* Priority icon badge left */}
                  <div className="flex-shrink-0">
                    {getPriorityBadge(rec.priority)}
                  </div>

                  {/* Recommendation core content */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[var(--text-muted)]">
                        {strings.radarScore} {index + 1} • {getCategoryLabel(rec.category)}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
                      {rec.insight}
                    </p>
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
