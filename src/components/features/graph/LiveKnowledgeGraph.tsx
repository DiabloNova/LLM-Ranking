"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Sparkles,
  Clock,
  ArrowUpRight,
  Info,
  Shield,
  Zap,
  Globe,
  Radio
} from "lucide-react";

interface MetricConfig {
  id: string;
  nameEn: string;
  nameFa: string;
  basePct: number;
  trend: string;
  trendUp: boolean;
  color: string;
}

const METRICS: MetricConfig[] = [
  {
    id: "google-ao",
    nameEn: "Google AI Overviews Search Citation",
    nameFa: "شاخص استناد جستجوی Google AI Overviews",
    basePct: 91.8,
    trend: "+8.7%",
    trendUp: true,
    color: "#3b82f6", // Blue
  },
  {
    id: "chatgpt",
    nameEn: "ChatGPT-4o Semantic Visibility Score",
    nameFa: "امتیاز دیده‌شدن معنایی ChatGPT-4o",
    basePct: 88.5,
    trend: "+4.2%",
    trendUp: true,
    color: "#06b6d4", // Cyan
  },
  {
    id: "perplexity",
    nameEn: "Perplexity AI Recommendation Index",
    nameFa: "شاخص معرفی هوشمند Perplexity AI",
    basePct: 84.1,
    trend: "+5.4%",
    trendUp: true,
    color: "#10b981", // Emerald
  },
  {
    id: "claude",
    nameEn: "Claude 3.5 Sonnet Citation Density",
    nameFa: "چگالی استنادات Claude 3.5 Sonnet",
    basePct: 79.2,
    trend: "+3.2%",
    trendUp: true,
    color: "#a855f7", // Purple
  },
  {
    id: "gemini",
    nameEn: "Google Gemini Contextual Share of Voice",
    nameFa: "سهم صدای متنی Google Gemini",
    basePct: 73.6,
    trend: "+2.4%",
    trendUp: true,
    color: "#f97316", // Orange
  }
];

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatFaNumber(num: number | string): string {
  const faDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return num.toString().replace(/\d/g, (d) => faDigits[parseInt(d)]);
}

export function LiveKnowledgeGraph() {
  const { language } = useTheme();
  const isFa = language === "fa";

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [hoveredCurveIndex, setHoveredCurveIndex] = useState<number | null>(null);
  const [liveValues, setLiveValues] = useState<number[]>(METRICS.map(m => m.basePct));
  const [reducedMotion, setReducedMotion] = useState(false);

  // Tooltip State
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    metricName: string;
    value: string;
    trend: string;
    trendUp: boolean;
    color: string;
  }>({
    visible: false,
    x: 0,
    y: 0,
    metricName: "",
    value: "",
    trend: "",
    trendUp: true,
    color: "",
  });

  // Time tracker for animation
  const timeRef = useRef(0);

  // Check prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  // Fluctuating metric values slightly for real-time dashboard terminal feel
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveValues(prev => prev.map((val, idx) => {
        const base = METRICS[idx].basePct;
        const diff = (Math.random() - 0.5) * 0.3; // fluctuate by max +/- 0.15%
        const newVal = val + diff;
        // clamp to +/- 1.2% of base to prevent stray overlaps
        const minVal = base - 1.2;
        const maxVal = base + 1.2;
        return Math.max(minVal, Math.min(maxVal, newVal));
      }));
    }, 900);
    return () => clearInterval(timer);
  }, []);

  // Set up 60 FPS Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      // Advance time variable for wave progression
      if (!reducedMotion) {
        timeRef.current += 0.008;
      }

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Update canvas resolution dynamically for crisp drawing
      const width = rect.width;
      const height = rect.height;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);

      // Dimensions & Padding settings
      const paddingLeft = 70;
      const paddingRight = 30;
      const paddingTop = 40;
      const paddingBottom = 40;
      const chartWidth = width - paddingLeft - paddingRight;
      const chartHeight = height - paddingTop - paddingBottom;

      // 1. Draw Subtle Background Grid (opacity 10-15%)
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);

      // Horizontal lines at 0%, 25%, 50%, 75%, 100%
      for (let i = 0; i <= 4; i++) {
        const yGrid = paddingTop + chartHeight * (i / 4);
        ctx.beginPath();
        ctx.moveTo(paddingLeft, yGrid);
        ctx.lineTo(width - paddingRight, yGrid);
        ctx.stroke();
      }

      // Vertical grid lines
      const verticalLinesCount = 6;
      for (let i = 0; i < verticalLinesCount; i++) {
        const pct = i / (verticalLinesCount - 1);
        const xGrid = paddingLeft + pct * chartWidth;
        ctx.beginPath();
        ctx.moveTo(xGrid, paddingTop);
        ctx.lineTo(xGrid, height - paddingBottom);
        ctx.stroke();
      }
      ctx.restore();

      // 2. Minimal Axis Labels (very subtle, high contrast typography)
      ctx.save();
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "medium 10px var(--font-mono, monospace)";
      ctx.textBaseline = "middle";
      ctx.textAlign = isFa ? "right" : "left";

      // Left Axis: 0% to 100% labels
      for (let i = 0; i <= 4; i++) {
        const pctLabel = 100 - i * 25;
        const yGrid = paddingTop + chartHeight * (i / 4);
        const labelText = isFa ? formatFaNumber(pctLabel) + "٪" : pctLabel + "%";
        // Place labels slightly to the left of chart area boundary
        ctx.fillText(labelText, isFa ? width - 20 : 15, yGrid);
      }

      // Bottom Axis: Time labels
      ctx.textAlign = "center";
      const markers = isFa
        ? ["۵دقیقه پیش", "۴دقیقه پیش", "۳دقیقه پیش", "۲دقیقه پیش", "۱دقیقه پیش", "زنده"]
        : ["-5m", "-4m", "-3m", "-2m", "-1m", "Live"];
      for (let i = 0; i < markers.length; i++) {
        const pct = i / (markers.length - 1);
        const xGrid = paddingLeft + pct * chartWidth;
        ctx.fillText(markers[i], xGrid, height - 15);
      }
      ctx.restore();

      // 3. Draw Spline Curves
      METRICS.forEach((metric, idx) => {
        const isHovered = hoveredCurveIndex === idx;
        const anyHovered = hoveredCurveIndex !== null;

        // Set opacity based on hover focus
        let opacity = 0.75;
        if (anyHovered) {
          opacity = isHovered ? 1.0 : 0.15;
        }

        // Draw curve lines using sample points for Catmull-Rom/quadratic spline interpolation
        const samples = 45;
        const points: { x: number; y: number }[] = [];

        for (let s = 0; s <= samples; s++) {
          const pct = s / samples;
          const x = paddingLeft + pct * chartWidth;

          // Organic mathematical progression formula
          const basePct = liveValues[idx];
          const baselineY = paddingTop + chartHeight * (1 - basePct / 100);

          const speed1 = 1.0 + idx * 0.15;
          const speed2 = 1.8 - idx * 0.1;
          const amp1 = chartHeight * 0.035;
          const amp2 = chartHeight * 0.015;

          const wave1 = Math.sin(timeRef.current * speed1 + pct * 6.0 + idx * 1.8) * amp1;
          const wave2 = Math.cos(timeRef.current * speed2 - pct * 3.5 + idx * 1.1) * amp2;

          const y = baselineY + wave1 + wave2;
          points.push({ x, y });
        }

        // Render Spline path
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 0; i < points.length - 1; i++) {
          const xc = (points[i].x + points[i + 1].x) / 2;
          const yc = (points[i].y + points[i + 1].y) / 2;
          ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }

        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);

        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.lineWidth = isHovered ? 4.5 : 2.5;

        // Apply premium glowing drop shadow
        ctx.shadowBlur = isHovered ? 25 : 10;
        ctx.shadowColor = metric.color;
        ctx.strokeStyle = hexToRgba(metric.color, opacity);
        ctx.stroke();

        // Draw glowing circular tip at the leading edge
        const lastPt = points[points.length - 1];
        ctx.beginPath();
        ctx.arc(lastPt.x, lastPt.y, isHovered ? 5.5 : 3.5, 0, Math.PI * 2);
        ctx.fillStyle = metric.color;
        ctx.shadowBlur = isHovered ? 20 : 8;
        ctx.shadowColor = metric.color;
        ctx.fill();

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [hoveredCurveIndex, liveValues, reducedMotion, isFa]);

  // High-performance Hover coordinate checking
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const paddingLeft = 70;
    const paddingRight = 30;
    const paddingTop = 40;
    const paddingBottom = 40;
    const chartWidth = rect.width - paddingLeft - paddingRight;
    const chartHeight = rect.height - paddingTop - paddingBottom;

    const chartX = x - paddingLeft;
    const pct = chartX / chartWidth;

    if (pct >= 0 && pct <= 1) {
      let closestIdx = -1;
      let minDistance = Infinity;
      let closestVal = 0;

      METRICS.forEach((metric, idx) => {
        const basePct = liveValues[idx];
        const baselineY = paddingTop + chartHeight * (1 - basePct / 100);

        const speed1 = 1.0 + idx * 0.15;
        const speed2 = 1.8 - idx * 0.1;
        const amp1 = chartHeight * 0.035;
        const amp2 = chartHeight * 0.015;

        const wave1 = Math.sin(timeRef.current * speed1 + pct * 6.0 + idx * 1.8) * amp1;
        const wave2 = Math.cos(timeRef.current * speed2 - pct * 3.5 + idx * 1.1) * amp2;

        const curveY = baselineY + wave1 + wave2;
        const dist = Math.abs(y - curveY);

        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = idx;
          // Calculate dynamic percentage at the mouse coordinate
          closestVal = 100 - ((curveY - paddingTop) / chartHeight) * 100;
        }
      });

      // Show Tooltip if hover is close enough to any curve (within 35 pixels)
      if (minDistance < 35) {
        setHoveredCurveIndex(closestIdx);
        setTooltip({
          visible: true,
          x: x + 15,
          y: y - 20,
          metricName: isFa ? METRICS[closestIdx].nameFa : METRICS[closestIdx].nameEn,
          value: closestVal.toFixed(1) + "%",
          trend: METRICS[closestIdx].trend,
          trendUp: METRICS[closestIdx].trendUp,
          color: METRICS[closestIdx].color,
        });
      } else {
        setHoveredCurveIndex(null);
        setTooltip(t => ({ ...t, visible: false }));
      }
    } else {
      setHoveredCurveIndex(null);
      setTooltip(t => ({ ...t, visible: false }));
    }
  };

  const handleMouseLeave = () => {
    setHoveredCurveIndex(null);
    setTooltip(t => ({ ...t, visible: false }));
  };

  return (
    <div className="space-y-8" dir={isFa ? "rtl" : "ltr"}>
      {/* 1. Brand New Enterprise Title Headers */}
      <div className="text-center max-w-4xl mx-auto space-y-4">
        <span className="inline-flex items-center gap-1.5 text-[11px] uppercase font-black tracking-widest text-sky-400 bg-sky-500/10 px-4 py-1.5 rounded-full border border-sky-500/15">
          <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
          {isFa ? "گراف زنده روابط و پوشش معنایی" : "REAL-TIME SEMANTIC VISIBILITY ENGINE"}
        </span>
        <h2 className="font-display font-black text-3xl md:text-5xl text-white">
          {isFa ? "گراف زنده روابط" : "Live Semantic Discovery"}
        </h2>
        <p className="text-slate-400 leading-relaxed text-sm md:text-base font-medium max-w-2xl mx-auto">
          {isFa
            ? "پایش تعاملی و پایش زنده ارتباط برند «راشا گستر» با منابع مرجع، نهادهای بازار و مدل‌های هوش مصنوعی بزرگ به موازات استنادات ورودی."
            : "Enterprise-grade real-time analytics visualization tracking brand citations and context coverage across leading AI engines."}
        </p>
      </div>

      {/* 2. Premium Dark Card Container */}
      <div className="bg-[#08111F] border border-white/[0.08] rounded-[2rem] shadow-[0_24px_60px_rgba(0,0,0,0.8)] backdrop-blur-3xl p-6 md:p-8 relative overflow-hidden">

        {/* Subtle background gradients */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-sky-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Real-Time Live Status Badge bar */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-5 mb-5 relative z-10">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div className="space-y-0.5">
              <span className="text-xs uppercase font-extrabold tracking-wider text-white">
                {isFa ? "جریان داده‌های زنده" : "LIVE TELEMETRY STREAM"}
              </span>
              <p className="text-[10px] text-slate-400 font-medium">
                {isFa ? "فرکانس پایش: ۶۰ فریم بر ثانیه | همگام‌سازی ابری" : "60 FPS rendering | Real-time continuous analysis synced"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] bg-sky-500/10 text-sky-400 font-extrabold px-3 py-1 rounded-lg border border-sky-500/15">
            <Clock className="w-3.5 h-3.5" />
            <span>{isFa ? "بروزرسانی همزمان" : "REAL-TIME"}</span>
          </div>
        </div>

        {/* 3. The Canvas Chart Area */}
        <div className="relative w-full h-[280px] sm:h-[400px] z-10" ref={containerRef}>
          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="w-full h-full cursor-crosshair block"
          />

          {/* 4. Elegant Glassmorphic Tooltip */}
          <AnimatePresence>
            {tooltip.visible && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.12 }}
                style={{
                  position: "absolute",
                  left: tooltip.x,
                  top: tooltip.y,
                }}
                className="bg-slate-950/85 border border-white/10 rounded-2xl p-4 shadow-2xl pointer-events-none backdrop-blur-md z-30 min-w-[220px]"
                dir={isFa ? "rtl" : "ltr"}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: tooltip.color,
                      boxShadow: `0 0 0 4px ${hexToRgba(tooltip.color, 0.2)}`,
                    }}
                  />
                  <span className="text-xs font-bold text-slate-400 block truncate max-w-[160px]">
                    {tooltip.metricName}
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-4 border-t border-white/[0.06] pt-2">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-500 font-bold uppercase block">
                      {isFa ? "شاخص آنلاین" : "LIVE VALUE"}
                    </span>
                    <span className="text-xl font-black font-mono text-white tracking-tight">
                      {isFa ? formatFaNumber(tooltip.value) : tooltip.value}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] text-slate-500 font-bold uppercase block">
                      {isFa ? "روند تغییر" : "TREND"}
                    </span>
                    <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${
                      tooltip.trendUp ? "text-emerald-400" : "text-sky-400"
                    }`}>
                      {tooltip.trendUp ? <TrendingUp className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                      <span className="font-mono">{isFa ? formatFaNumber(tooltip.trend) : tooltip.trend}</span>
                    </span>
                  </div>
                </div>

                <div className="text-[9px] text-slate-500 font-bold flex items-center gap-1 mt-2.5 pt-2.5 border-t border-white/[0.04]">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{isFa ? "همگام با مدل زنده" : "Synchronized Live with Model"}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 5. Compact Horizontal Legend */}
        <div className="border-t border-white/[0.06] pt-6 mt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              {isFa ? "راهنمای شاخص‌های پایشگر شده" : "MONITORED METRIC SERIES"}
            </span>

            {/* Hover Legend flex grid */}
            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-x-6 gap-y-3 w-full md:w-auto">
              {METRICS.map((metric, idx) => {
                const isHovered = hoveredCurveIndex === idx;
                const anyHovered = hoveredCurveIndex !== null;

                return (
                  <div
                    key={metric.id}
                    onMouseEnter={() => setHoveredCurveIndex(idx)}
                    onMouseLeave={() => setHoveredCurveIndex(null)}
                    className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border transition-all duration-300 cursor-pointer w-full sm:w-auto ${
                      isHovered
                        ? "bg-white/[0.04] border-white/10 shadow-lg shadow-black/40 scale-[1.03]"
                        : anyHovered
                        ? "opacity-30 border-transparent scale-[0.98]"
                        : "bg-transparent border-transparent"
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0 transition-all"
                      style={{
                        backgroundColor: metric.color,
                        boxShadow: isHovered ? `0 0 12px ${metric.color}` : "none",
                      }}
                    />

                    <div className="text-right">
                      <span className="text-xs font-medium text-slate-300">
                        {isFa ? metric.nameFa : metric.nameEn}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-sm font-black font-mono text-white tracking-tight">
                          {isFa ? formatFaNumber(liveValues[idx].toFixed(1)) + "٪" : liveValues[idx].toFixed(1) + "%"}
                        </span>
                        <span className={`text-[9px] font-bold px-1 rounded ${
                          metric.trendUp ? "bg-emerald-500/10 text-emerald-400" : "bg-sky-500/10 text-sky-400"
                        }`}>
                          {isFa ? formatFaNumber(metric.trend) : metric.trend}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 6. Information Panel (Exactly as shown in reference structure) */}
        <div className="border-t border-white/[0.06] pt-6 mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/10 transition-all">
            <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
              {isFa ? "نام مرجع پایش" : "Brand Reference Hub"}
            </span>
            <span className="text-sm font-black text-white block">
              {isFa ? "راشا گستر (Rasha Gostar)" : "Rasha Gostar Anchor"}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/10 transition-all">
            <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
              {isFa ? "شاخص انطباق ایمنی" : "AI Readiness Standard"}
            </span>
            <span className="text-sm font-black text-[#10b981] flex items-center gap-1.5">
              <Shield className="w-4 h-4 shrink-0" />
              {isFa ? "سازگار و ایمن" : "Verified & Clean"}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/10 transition-all">
            <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
              {isFa ? "کانال‌های همگام" : "AI Sync Channels"}
            </span>
            <span className="text-sm font-black text-sky-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4 shrink-0" />
              {isFa ? "۵ موتور پیشتاز" : "5 Premium LLMs"}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/10 transition-all">
            <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
              {isFa ? "وضعیت پیوندهای وب" : "Web Index Integrity"}
            </span>
            <span className="text-sm font-black text-[#a855f7] flex items-center gap-1.5">
              <Globe className="w-4 h-4 shrink-0" />
              {isFa ? "سراسری / وب معنایی" : "Semantic Schema / OK"}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
