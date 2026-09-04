"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";
import {
  Globe, Zap, Shield, Sparkles, Loader2, Award,
  RefreshCw, Layers, Layout, Download, Eye, Plus,
  Trash2, AlertTriangle, Trophy, Users, CheckCircle,
  TrendingUp, ShieldAlert, ChevronDown, BarChart3, ChevronUp
} from "lucide-react";
import {
  ResponsiveContainer, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip
} from "recharts";

import { CompetitiveAnalysisResponse } from "@/app/api/v1/analysis/competitive/route";

export const CompetitiveAnalysisPanel: React.FC = () => {
  const { language } = useTheme();
  const { session } = useAuth();
  const isRtl = language === "fa";

  const [mounted, setMounted] = useState(false);
  const [userUrl, setUserUrl] = useState("");
  const [competitorUrls, setCompetitorUrls] = useState<string[]>([""]);
  const [analysisDepth, setAnalysisDepth] = useState<"quick" | "standard" | "deep">("standard");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CompetitiveAnalysisResponse | null>(null);
  const [expandedGap, setExpandedGap] = useState<number | null>(null);

  // Stepper phrases
  const steps = [
    { label: isRtl ? "در حال خزش سایت شما و رقبا..." : "Crawling your site and competitors...", icon: Globe },
    { label: isRtl ? "تحلیل محتوایی و فنی..." : "Analyzing content and technical structure...", icon: Zap },
    { label: isRtl ? "مقایسه رقبا و شناسایی مزیت‌ها..." : "Pairwise comparison and advantage discovery...", icon: Trophy },
    { label: isRtl ? "تولید پیشنهادات استراتژیک..." : "Generating strategic recommendations...", icon: Sparkles },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

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
      }, 3000);
    } else {
      setCurrentStep(0);
    }
    return () => clearInterval(timer);
  }, [isLoading]);

  const handleAddCompetitor = () => {
    if (competitorUrls.length < 5) {
      setCompetitorUrls([...competitorUrls, ""]);
    }
  };

  const handleRemoveCompetitor = (idx: number) => {
    const updated = [...competitorUrls];
    updated.splice(idx, 1);
    setCompetitorUrls(updated.length === 0 ? [""] : updated);
  };

  const handleCompetitorUrlChange = (idx: number, val: string) => {
    const updated = [...competitorUrls];
    updated[idx] = val;
    setCompetitorUrls(updated);
  };

  const handleStartAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userUrl.trim()) return;

    // Filter out blank competitor URLs
    const filteredCompetitors = competitorUrls.filter(url => url.trim() !== "");
    if (filteredCompetitors.length === 0) {
      setError(isRtl ? "وارد کردن حداقل یک رقیب الزامی است." : "At least one competitor is required.");
      return;
    }

    setIsLoading(true);
    setCurrentStep(0);
    setError(null);
    setData(null);

    try {
      const workspaceId = session.user?.workspaceId || "ws-tehran";
      const response = await fetch("/api/v1/analysis/competitive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": workspaceId,
          "x-user-id": session.user?.id || "usr-1001"
        },
        body: JSON.stringify({
          userUrl,
          competitorUrls: filteredCompetitors,
          analysisDepth,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || "خطایی در انجام تحلیل رقابتی رخ داد.");
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

  // Convert chart data dynamically for RadarChart
  const getRadarData = () => {
    if (!data) return [];
    const fields = [
      { key: "content", label: isRtl ? "محتوا" : "Content" },
      { key: "technical", label: isRtl ? "فنی" : "Technical" },
      { key: "seo", label: isRtl ? "سئو" : "SEO" },
      { key: "brand", label: isRtl ? "برند" : "Brand" },
    ];

    return fields.map((f) => {
      const item: any = { subject: f.label };
      item[isRtl ? "شما" : "User"] = data.competitorComparison[0]?.headToHead[f.key as "content" | "technical" | "seo" | "brand"].user || 80;
      data.competitorComparison.forEach((comp) => {
        item[comp.competitorName] = comp.headToHead[f.key as "content" | "technical" | "seo" | "brand"].competitor;
      });
      return item;
    });
  };

  const getMarketPositionLabel = (pos: CompetitiveAnalysisResponse["marketPosition"]) => {
    const mapping = {
      leader: { fa: "رهبر بازار (Leader)", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" },
      challenger: { fa: "چالش‌گر بازار (Challenger)", color: "text-[var(--sky-blue-500)] bg-[var(--sky-blue-500)]/10 border-[var(--sky-blue-500)]/30" },
      follower: { fa: "دنبال‌کننده (Follower)", color: "text-[var(--orange-500)] bg-[var(--orange-500)]/10 border-[var(--orange-500)]/30" },
      niche: { fa: "بازیگر تخصصی (Niche Player)", color: "text-purple-500 bg-purple-500/10 border-purple-500/30" }
    };
    return mapping[pos] || { fa: pos, color: "text-[var(--text-primary)] bg-[var(--muted-surface)]" };
  };

  return (
    <div className="space-y-6">
      {/* Configuration & Inputs Form */}
      <GlassCard hoverable={false} className="p-5">
        <form onSubmit={handleStartAnalysis} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* User URL Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
                <Globe size={14} className="text-[var(--sky-blue-500)]" />
                <span>{isRtl ? "آدرس وب‌سایت شما" : "Your Website URL"}</span>
              </label>
              <input
                type="url"
                required
                placeholder="https://mybrand.com"
                value={userUrl}
                onChange={(e) => setUserUrl(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3 text-xs rounded-xl outline-none transition-all duration-300
                         bg-[var(--muted-surface)] text-[var(--text-primary)] border border-[var(--border)]
                         focus:border-[var(--sky-blue-500)] focus:ring-1 focus:ring-[var(--sky-blue-500)]/30"
              />
            </div>

            {/* Depth Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
                <Layers size={14} className="text-[var(--orange-500)]" />
                <span>{isRtl ? "عمق تحلیل صفحات" : "Analysis Crawl Depth"}</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["quick", "standard", "deep"] as const).map((depth) => (
                  <button
                    key={depth}
                    type="button"
                    onClick={() => setAnalysisDepth(depth)}
                    disabled={isLoading}
                    className={`px-3 py-3 text-xs rounded-xl border font-bold transition-all ${
                      analysisDepth === depth
                        ? "bg-gradient-to-r from-[var(--sky-blue-500)] to-[var(--orange-500)] text-white border-transparent"
                        : "bg-[var(--muted-surface)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--background-subtle)]"
                    }`}
                  >
                    {depth === "quick" && (isRtl ? "سریع (۵ صفحه)" : "Quick (5 pages)")}
                    {depth === "standard" && (isRtl ? "استاندارد (۱۰ صفحه)" : "Standard (10 pages)")}
                    {depth === "deep" && (isRtl ? "عمیق (۲۵ صفحه)" : "Deep (25 pages)")}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Competitors List Inputs */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
                <Users size={14} className="text-purple-400" />
                <span>{isRtl ? "آدرس وب‌سایت رقبای اصلی (تا ۵ رقیب)" : "Competitor Website URLs (Up to 5)"}</span>
              </label>
              {competitorUrls.length < 5 && (
                <button
                  type="button"
                  onClick={handleAddCompetitor}
                  disabled={isLoading}
                  className="text-[10px] text-[var(--sky-blue-500)] hover:text-[var(--text-primary)] flex items-center gap-1 font-bold"
                >
                  <Plus size={12} />
                  <span>{isRtl ? "افزودن رقیب جدید" : "Add Competitor"}</span>
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {competitorUrls.map((compUrl, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <span className="text-[10px] text-slate-500 font-bold w-6 text-center">#{idx + 1}</span>
                  <input
                    type="url"
                    required
                    placeholder="https://competitor.com"
                    value={compUrl}
                    onChange={(e) => handleCompetitorUrlChange(idx, e.target.value)}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2.5 text-xs rounded-xl outline-none transition-all duration-300
                             bg-[var(--muted-surface)] text-[var(--text-primary)] border border-[var(--border)]
                             focus:border-purple-400 focus:ring-1 focus:ring-purple-400/30"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveCompetitor(idx)}
                    disabled={isLoading}
                    className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={isLoading || !userUrl.trim()}
              className="w-full md:w-auto px-8 py-3.5 text-xs font-black rounded-xl text-white cursor-pointer
                       bg-gradient-to-r from-[var(--sky-blue-500)] to-[var(--orange-500)]
                       hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-all duration-300
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="animate-spin" size={14} />
                  <span>{isRtl ? "تحلیل عمیق رقابتی آغاز شد..." : "Analyzing Competitors..."}</span>
                </>
              ) : (
                <>
                  <Zap size={14} className="animate-pulse" />
                  <span>{isRtl ? "شروع تحلیل رقابتی هوشمند" : "Run AI Competitive Intelligence"}</span>
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
              <h4 className="text-xs font-bold text-red-400">{isRtl ? "خطا در پردازش تحلیل رقابتی" : "Competitive Pipeline Error"}</h4>
              <p className="text-[11px] text-red-300/80 mt-1 leading-relaxed">{error}</p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Loading State */}
      {isLoading && (
        <GlassCard hoverable={false} className="p-8 space-y-6">
          <div className="text-center space-y-2 mb-4">
            <div className="relative flex items-center justify-center mx-auto w-16 h-16">
              <div className="absolute w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
              <Users className="text-purple-400 animate-pulse" size={24} />
            </div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] mt-3">
              {isRtl ? "سیستم در حال ارزیابی هوشمند و تحلیل رقبای شماست" : "Competitive Scraping & Benchmarking"}
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] max-w-sm mx-auto">
              {isRtl
                ? "خزش کدهای HTML، ساختار محتوایی و بک‌لینک‌های رقبا به صورت موازی در حال انجام است."
                : "Crawling competitors, matching text embeddings, and generating opportunity maps."}
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
                    isActive ? 'bg-purple-500/20 border border-purple-500/40' :
                    isCompleted ? 'bg-[var(--color-success)]/10 border border-[var(--color-success)]/20' :
                    'bg-[var(--muted-surface)]/30 border border-transparent'
                  }`}
                >
                  <Icon size={18} className={isCompleted ? 'text-[var(--color-success)]' : isActive ? 'text-purple-400' : 'text-[var(--text-muted)]'} />
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

      {/* Results State */}
      {data && mounted && (
        <div className="space-y-6 animate-slide-up print:text-black print:bg-white">

          {/* Row 1: Market Position Card & Recharts Radar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Market Position Card */}
            <GlassCard hoverable={false} className="p-6 flex flex-col justify-between items-center text-center">
              <div className="w-full text-start">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent-600)] flex items-center gap-1.5">
                  <Award size={14} />
                  <span>{isRtl ? "موقعیت برند شما در بازار" : "Your Market Standing"}</span>
                </h3>
              </div>

              <div className="my-6 space-y-4">
                <div className="relative flex items-center justify-center">
                  <div className="w-36 h-36 rounded-full border-4 border-dashed border-purple-500/20 flex flex-col items-center justify-center">
                    <span className="text-5xl font-black bg-gradient-to-br from-white to-purple-400 bg-clip-text text-transparent">
                      {data.overallScore}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-bold mt-1 uppercase tracking-widest">
                      {isRtl ? "امتیاز کل رقابت" : "Overall Index"}
                    </span>
                  </div>
                </div>

                <div className={`px-4 py-1.5 rounded-full border text-xs font-bold inline-block ${getMarketPositionLabel(data.marketPosition).color}`}>
                  {getMarketPositionLabel(data.marketPosition).fa}
                </div>
              </div>

              <div className="space-y-2 w-full border-t border-[var(--border)] pt-4 text-xs text-[var(--text-secondary)]">
                <div className="flex justify-between">
                  <span>{isRtl ? "تعداد رقبای تحلیل شده:" : "Competitors Analyzed:"}</span>
                  <span className="font-bold text-[var(--text-primary)]">{data.marketInsights.totalCompetitorsAnalyzed}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isRtl ? "رتبه تقریبی شما در صنف:" : "Estimated Rank:"}</span>
                  <span className="font-bold text-[var(--sky-blue-500)]">{isRtl ? `رتبه ${data.marketInsights.userRanking} بین رفقا` : `#${data.marketInsights.userRanking} overall`}</span>
                </div>
              </div>
            </GlassCard>

            {/* Radar Chart Card */}
            <GlassCard hoverable={false} className="lg:col-span-2 p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent-600)] flex items-center gap-1.5">
                  <BarChart3 size={14} />
                  <span>{isRtl ? "نمودار چندبعدی مقایسه برند و رقبا" : "Multi-Dimensional Brand Radar"}</span>
                </h3>
                <Button variant="ghost" size="sm" onClick={handleExportPDF} className="text-[10px] flex items-center gap-1 cursor-pointer">
                  <Download size={12} />
                  <span>{isRtl ? "دانلود گزارش استراتژی" : "Export PDF Report"}</span>
                </Button>
              </div>

              {/* Chart container */}
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={getRadarData()}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "var(--text-secondary)", fontSize: 8 }} />
                    <Radar
                      name={isRtl ? "برند شما" : "Your Brand"}
                      dataKey={isRtl ? "شما" : "User"}
                      stroke="var(--sky-blue-500)"
                      fill="var(--sky-blue-500)"
                      fillOpacity={0.25}
                    />
                    {data.competitorComparison.map((comp, idx) => {
                      const colors = ["var(--orange-500)", "#10b981", "#a855f7", "#ec4899"];
                      const color = colors[idx % colors.length];
                      return (
                        <Radar
                          key={comp.competitorUrl}
                          name={comp.competitorName}
                          dataKey={comp.competitorName}
                          stroke={color}
                          fill={color}
                          fillOpacity={0.15}
                        />
                      );
                    })}
                    <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "8px", fontSize: "11px" }} />
                    <Legend wrapperStyle={{ fontSize: "9px" }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

          </div>

          {/* Row 2: Head-to-Head Comparison Table */}
          <GlassCard hoverable={false} className="p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent-600)] flex items-center gap-1.5 mb-4">
              <TrendingUp size={14} />
              <span>{isRtl ? "جدول مقایسه مستقیم سر‌به‌سر" : "Head-to-Head Comparison Metrics"}</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right text-[var(--text-secondary)] border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                    <th className="pb-3 pt-1 text-right font-bold">{isRtl ? "رقیب / برند" : "Competitor / Brand"}</th>
                    <th className="pb-3 pt-1 text-center font-bold">{isRtl ? "شاخص کلی" : "Overall score"}</th>
                    <th className="pb-3 pt-1 text-center font-bold">{isRtl ? "محتوا" : "Content"}</th>
                    <th className="pb-3 pt-1 text-center font-bold">{isRtl ? "سئو فنی" : "Technical"}</th>
                    <th className="pb-3 pt-1 text-center font-bold">{isRtl ? "سئو خارجی" : "SEO"}</th>
                    <th className="pb-3 pt-1 text-center font-bold">{isRtl ? "قدرت برند" : "Brand presence"}</th>
                    <th className="pb-3 pt-1 text-center font-bold">{isRtl ? "احتمال پیشی گرفتن" : "Win probability"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {/* Row for user */}
                  <tr className="bg-[var(--muted-surface)]/40">
                    <td className="py-3 font-bold text-[var(--text-primary)] flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[var(--sky-blue-500)]" />
                      <span>{isRtl ? "برند شما (شما)" : "Your Brand"}</span>
                    </td>
                    <td className="py-3 text-center font-black text-[var(--sky-blue-500)]">{data.overallScore}</td>
                    <td className="py-3 text-center">{data.competitorComparison[0]?.headToHead.content.user || 80}</td>
                    <td className="py-3 text-center">{data.competitorComparison[0]?.headToHead.technical.user || 80}</td>
                    <td className="py-3 text-center">{data.competitorComparison[0]?.headToHead.seo.user || 80}</td>
                    <td className="py-3 text-center">{data.competitorComparison[0]?.headToHead.brand.user || 80}</td>
                    <td className="py-3 text-center">-</td>
                  </tr>

                  {/* Competitor Rows */}
                  {data.competitorComparison.map((comp, idx) => {
                    const colors = ["bg-orange-500", "bg-emerald-500", "bg-purple-500", "bg-pink-500"];
                    const color = colors[idx % colors.length];
                    return (
                      <tr key={comp.competitorUrl} className="hover:bg-[var(--muted-surface)]/20">
                        <td className="py-3 font-bold text-[var(--text-secondary)] flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${color}`} />
                          <span className="truncate max-w-[150px]">{comp.competitorName}</span>
                        </td>
                        <td className="py-3 text-center font-bold text-[var(--text-primary)]">{comp.overallScore}</td>
                        <td className="py-3 text-center">{comp.headToHead.content.competitor}</td>
                        <td className="py-3 text-center">{comp.headToHead.technical.competitor}</td>
                        <td className="py-3 text-center">{comp.headToHead.seo.competitor}</td>
                        <td className="py-3 text-center">{comp.headToHead.brand.competitor}</td>
                        <td className="py-3 text-center font-bold text-emerald-400">{comp.winProbability}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* Pairwise Competitor Details Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.competitorComparison.map((comp) => (
              <GlassCard key={comp.competitorUrl} hoverable={false} className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                  <h4 className="text-xs font-black text-[var(--text-primary)]">{isRtl ? `جزئیات تقابل با: ${comp.competitorName}` : `H2H: ${comp.competitorName}`}</h4>
                  <Badge variant="success" className="text-[9px]">
                    {isRtl ? `شانس غلبه: ${comp.winProbability}%` : `Win Prob: ${comp.winProbability}%`}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-emerald-400 block">{isRtl ? "نقاط قوت رقیب (ضعف شما):" : "Competitor Strengths:"}</span>
                    <ul className="space-y-1.5">
                      {comp.strengths.map((str, sIdx) => (
                        <li key={sIdx} className="text-[11px] text-[var(--text-secondary)] leading-relaxed list-disc list-inside">
                          {str}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-red-400 block">{isRtl ? "نقاط ضعف رقیب (برتری شما):" : "Competitor Weaknesses:"}</span>
                    <ul className="space-y-1.5">
                      {comp.weaknesses.map((weak, wIdx) => (
                        <li key={wIdx} className="text-[11px] text-[var(--text-secondary)] leading-relaxed list-disc list-inside">
                          {weak}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          {/* Competitive Advantages & Strategic Opportunities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Competitive Advantages */}
            <GlassCard hoverable={false} className="p-5 border-emerald-500/10 bg-emerald-500/[0.005] space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <CheckCircle size={14} />
                <span>{isRtl ? "مزیت‌های رقابتی شما (Competitive Advantages)" : "Competitive Advantages"}</span>
              </h3>

              <div className="space-y-3">
                {data.competitiveAdvantages.map((adv, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.02] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-400">{adv.category}</span>
                      <Badge variant="info" className="text-[9px]">
                        {isRtl ? `تأثیر: ${adv.impact === "high" ? "زیاد" : "متوسط"}` : `Impact: ${adv.impact}`}
                      </Badge>
                    </div>
                    <h4 className="text-xs font-bold text-[var(--text-primary)] leading-normal">{adv.advantage}</h4>
                    <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                      <strong>{isRtl ? "چگونگی بکارگیری:" : "How to Leverage:"} </strong>{adv.howToLeverage}
                    </p>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Strategic Opportunities */}
            <GlassCard hoverable={false} className="p-5 border-[var(--sky-blue-500)]/10 bg-[var(--sky-blue-500)]/[0.005] space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--sky-blue-500)] flex items-center gap-1.5">
                <Sparkles size={14} />
                <span>{isRtl ? "فرصت‌های استراتژیک و نوظهور (Strategic Opportunities)" : "Strategic Opportunities"}</span>
              </h3>

              <div className="space-y-3">
                {data.strategicOpportunities.map((opp, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-[var(--sky-blue-500)]/15 bg-[var(--sky-blue-500)]/[0.02] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[var(--text-primary)] leading-normal">{opp.opportunity}</h4>
                      <Badge variant="warning" className="text-[9px]">
                        {isRtl ? `پتانسیل: ${opp.potential === "high" ? "بالا" : "متوسط"}` : `Potential: ${opp.potential}`}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                      <strong>{isRtl ? "طرح اجرایی:" : "Action Plan:"} </strong>{opp.actionPlan}
                    </p>
                    <span className="text-[9px] text-[var(--sky-blue-500)]/80 block font-bold">
                      {isRtl ? `زمان اثرگذاری: ${opp.timeToImpact}` : `Time to Impact: ${opp.timeToImpact}`}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>

          </div>

          {/* Gap Analysis Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
              <AlertTriangle size={14} />
              <span>{isRtl ? "شکاف‌های رقبایی و اقدامات اصلاحی (Gap Analysis)" : "Gap Analysis"}</span>
            </h3>

            <div className="space-y-3">
              {data.gapAnalysis.map((gap, idx) => {
                const isExpanded = expandedGap === idx;
                return (
                  <div key={idx} className="glass-card rounded-xl border border-[var(--glass-border)] overflow-hidden transition-all duration-300">
                    <div
                      onClick={() => setExpandedGap(isExpanded ? null : idx)}
                      className="p-4 cursor-pointer hover:bg-[var(--muted-surface)] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AlertTriangle size={20} className="text-red-500" />
                          <h4 className="font-medium text-[var(--text-primary)] text-xs">{gap.gap}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-[10px] rounded-full font-semibold ${gap.severity === 'critical' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                            {gap.severity === 'critical' ? (isRtl ? 'بحرانی' : 'Critical') : (isRtl ? 'هشدار' : 'Warning')}
                          </span>
                          <ChevronDown size={16} className={`transition-transform ${isExpanded ? 'rotate-180' : ''} text-[var(--text-muted)]`} />
                        </div>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
                        {isRtl ? `دسته‌بندی شکاف: ${gap.category}` : `Category: ${gap.category}`}
                      </span>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-[var(--glass-border)] bg-[var(--muted-surface)]/30"
                        >
                          <div className="p-4 space-y-3">
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                              <strong>{isRtl ? "اقدام پیشنهادی اصلاحی:" : "Recommended Corrective Action:"} </strong>
                              {gap.recommendedAction}
                            </p>
                            <div className="flex items-center gap-4 text-[10px] text-[var(--text-muted)] font-bold">
                              <span>
                                {isRtl ? `میزان تلاش: ${gap.estimatedEffort === 'easy' ? 'آسان' : gap.estimatedEffort === 'medium' ? 'متوسط' : 'سخت'}` : `Effort: ${gap.estimatedEffort}`}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Market Insights Dashboard */}
          <GlassCard hoverable={false} className="p-5 border-purple-500/10 bg-purple-500/[0.01]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5 mb-3">
              <TrendingUp size={14} />
              <span>{isRtl ? "بینش بازار و ترندهای صنف" : "Market Insights & Industry Trends"}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-[var(--muted-surface)] border border-[var(--border)] rounded-xl">
                <span className="text-[10px] text-[var(--text-muted)] block mb-1.5 font-bold">{isRtl ? "روند کلی صنعت:" : "Industry Averages:"}</span>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {isRtl
                    ? `میانگین امتیاز رقابتی صنف شما ${data.marketInsights.avgIndustryScore} از ۱۰۰ است. برند شما با شاخص ${data.overallScore} در رتبه برتر صنف قرار می‌گیرد.`
                    : `Average industry index is ${data.marketInsights.avgIndustryScore} / 100.`}
                </p>
              </div>

              <div className="p-3 bg-[var(--muted-surface)] border border-[var(--border)] rounded-xl space-y-2">
                <span className="text-[10px] text-[var(--text-muted)] block font-bold">{isRtl ? "سه ترند برتر صنف:" : "Top Industry Trends:"}</span>
                <ul className="space-y-1">
                  {data.marketInsights.topIndustryTrends.map((trend, tIdx) => (
                    <li key={tIdx} className="text-xs text-[var(--text-secondary)] leading-relaxed flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      <span>{trend}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </GlassCard>

        </div>
      )}
    </div>
  );
};
