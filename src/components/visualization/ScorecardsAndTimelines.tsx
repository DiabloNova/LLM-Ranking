"use client";

import React, { useState } from "react";
import { ArrowUpRight, ArrowDownRight, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { TimelineEvent, ScorecardMetric } from "./contracts";

interface TimelineProps {
  dataset: { events: TimelineEvent[] };
}

interface ScorecardProps {
  metric: ScorecardMetric;
}

// Helper to resolve event status styles
const getStatusClasses = (status: string) => {
  switch (status) {
    case "success":
      return {
        bg: "bg-emerald-500/10 border-emerald-500/30",
        bullet: "bg-emerald-500",
        text: "text-emerald-500",
      };
    case "warning":
      return {
        bg: "bg-orange-500/10 border-orange-500/30",
        bullet: "bg-orange-500",
        text: "text-orange-500",
      };
    case "error":
      return {
        bg: "bg-red-500/10 border-red-500/30",
        bullet: "bg-red-500",
        text: "text-red-500",
      };
    case "info":
      return {
        bg: "bg-blue-500/10 border-blue-500/30",
        bullet: "bg-blue-500",
        text: "text-blue-500",
      };
    default:
      return {
        bg: "bg-slate-500/10 border-slate-500/30",
        bullet: "bg-slate-500",
        text: "text-slate-500",
      };
  }
};

// -------------------------------------------------------------------------
// 1. Interactive Timeline Primitive
// -------------------------------------------------------------------------
export const TimelinePrimitive: React.FC<TimelineProps> = ({ dataset }) => {
  const { language } = useTheme();
  const isRtl = language === "fa";
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Sort chronologically by default
  const sortedEvents = [...dataset.events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="relative pl-2 text-start" style={{ direction: isRtl ? "rtl" : "ltr" }}>
      {/* Absolute center timeline vertical bar line */}
      <div
        className="absolute top-2 bottom-2 w-0.5 bg-[var(--border)]"
        style={{
          insetInlineStart: "15px",
        }}
      />

      <div className="space-y-4">
        {sortedEvents.map((event) => {
          const isExpanded = expandedId === event.id;
          const statusStyle = getStatusClasses(event.status);

          return (
            <div
              key={event.id}
              className="relative flex gap-4 transition-all duration-300 group"
              style={{ paddingInlineStart: "28px" }}
            >
              {/* Event status outer ring & Bullet */}
              <div
                className="absolute top-1.5 flex items-center justify-center w-5 h-5 rounded-full border bg-[var(--card)] z-10 transition-transform group-hover:scale-110"
                style={{
                  insetInlineStart: "5px",
                  borderColor: statusStyle.bullet,
                }}
              >
                <span className={`w-2 h-2 rounded-full ${statusStyle.bullet}`} />
              </div>

              {/* Event content card */}
              <div className="flex-1 bg-[var(--card)]/40 border border-[var(--border)] rounded-xl p-3.5 hover:border-[var(--border-strong)] transition-all">
                <div className="flex items-center justify-between gap-2 flex-wrap md:flex-nowrap">
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-[var(--text-muted)]" />
                    <span className="font-display font-semibold text-[10px] text-[var(--text-muted)]">
                      {event.timestamp}
                    </span>
                    <span className="text-[10px] bg-[var(--border)]/70 text-[var(--text-muted)] px-1.5 py-0.5 rounded-md font-medium">
                      {isRtl ? event.categoryFa : event.categoryEn}
                    </span>
                  </div>

                  {/* Toggle Expand control button */}
                  <button
                    onClick={() => toggleExpand(event.id)}
                    className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors focus:outline-none"
                    aria-expanded={isExpanded}
                    aria-label={isRtl ? "توضیحات بیشتر" : "Toggle details view"}
                  >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                <h4 className="font-bold text-xs text-[var(--text-primary)] mt-1.5">
                  {isRtl ? event.titleFa : event.titleEn}
                </h4>

                <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">
                  {isRtl ? event.descriptionFa : event.descriptionEn}
                </p>

                {/* Animated expand area */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-[var(--border)] text-xs text-[var(--text-muted)] animate-slide-down space-y-2">
                    <p>{isRtl ? event.descriptionFa : event.descriptionEn}</p>
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div className="bg-[var(--background)] p-2 rounded-lg grid grid-cols-2 gap-2 mt-2 border border-[var(--border)]">
                        {Object.entries(event.metadata).map(([key, val]) => (
                          <div key={key} className="flex flex-col text-[10px]">
                            <span className="font-semibold text-[var(--text-primary)]">{key}</span>
                            <span className="font-display font-bold text-[#1F76F9]">{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// -------------------------------------------------------------------------
// 2. Scorecard Primitive with Sparkline Support
// -------------------------------------------------------------------------
export const ScorecardPrimitive: React.FC<ScorecardProps> = ({ metric }) => {
  const { language } = useTheme();
  const isRtl = language === "fa";

  const isUp = metric.trend === "up";
  const isDown = metric.trend === "down";

  // Map metric trend to colors
  const trendColorClass = isUp
    ? "text-emerald-500 bg-emerald-500/10"
    : isDown
    ? "text-red-500 bg-red-500/10"
    : "text-[var(--text-muted)] bg-[var(--border)]";

  // Parse sparkline format data point array
  const sparklineData = metric.sparklineData?.map((val, i) => ({ val, i })) || [];

  return (
    <div
      className="flex flex-col justify-between h-full p-5 bg-[var(--card)] border border-[var(--border)] rounded-2xl hover:border-[var(--border-strong)] transition-all text-start"
      style={{ direction: isRtl ? "rtl" : "ltr" }}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold text-[var(--text-muted)] truncate">
          {isRtl ? metric.labelFa : metric.labelEn}
        </span>

        {/* Delta change percentage indicator badge */}
        {metric.delta && (
          <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold font-display ${trendColorClass}`}>
            {isUp && <ArrowUpRight size={10} />}
            {isDown && <ArrowDownRight size={10} />}
            <span>{metric.delta}</span>
          </div>
        )}
      </div>

      <div className="mt-2.5 flex items-baseline gap-1.5 flex-wrap">
        <span className="text-2xl font-bold font-display text-[var(--text-primary)] tracking-tight">
          {metric.value}
        </span>
        {metric.unitEn && (
          <span className="text-xs text-[var(--text-muted)] font-medium">
            {isRtl ? metric.unitFa : metric.unitEn}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 gap-4 flex-wrap sm:flex-nowrap">
        {/* Comparison sub-text */}
        <span className="text-[10px] text-[var(--text-muted)] truncate">
          {isRtl ? metric.comparisonLabelFa : metric.comparisonLabelEn}
        </span>

        {/* Mini Inline Sparkline AreaChart */}
        {sparklineData.length > 0 && (
          <div className="w-16 h-8 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                <defs>
                  <linearGradient id={`sparkGrad-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={isUp ? "#10B981" : isDown ? "#EF4444" : "#1F76F9"}
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="95%"
                      stopColor={isUp ? "#10B981" : isDown ? "#EF4444" : "#1F76F9"}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="val"
                  stroke={isUp ? "#10B981" : isDown ? "#EF4444" : "#1F76F9"}
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill={`url(#sparkGrad-${metric.id})`}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
