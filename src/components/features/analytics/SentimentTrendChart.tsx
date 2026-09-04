"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useTheme } from "@/components/ThemeProvider";

interface TrendData {
  date: string;
  score: number;
}

interface SentimentTrendChartProps {
  data: TrendData[];
  loading?: boolean;
}

interface CustomTooltipPayloadItem {
  value: number | string;
  payload?: TrendData;
  [key: string]: unknown;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: CustomTooltipPayloadItem[];
  label?: string;
  isRtl?: boolean;
}

// Custom tooltips with glassmorphism styling declared outside the render block
const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, isRtl }) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const formattedValue = typeof value === "number" ? value.toFixed(2) : value;

    return (
      <div className="bg-[var(--card)] backdrop-blur-md border border-[var(--glass-border)] p-3 rounded-xl shadow-lg text-xs space-y-1">
        <p className="font-bold text-[var(--text-primary)]">{label}</p>
        <p className="text-[#1F76F9] font-semibold">
          {isRtl ? "شاخص رضایت: " : "Sentiment Score: "}
          <span className="font-display font-bold">
            {formattedValue}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

/**
 * Premium glassmorphic Sentiment Trend chart.
 * Uses Recharts AreaChart with custom gradients, tooltips, and localization supports.
 */
export const SentimentTrendChart: React.FC<SentimentTrendChartProps> = ({
  data,
  loading = false,
}) => {
  const { language } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (loading || !mounted) {
    return (
      <Card className="h-full min-h-[350px] flex flex-col justify-between">
        <CardHeader>
          <div className="h-4 w-48 bg-white/5 rounded animate-pulse mb-2" />
          <div className="h-3 w-80 bg-white/5 rounded animate-pulse" />
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <div className="h-full w-full bg-white/5 rounded-xl animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const isRtl = language === "fa";

  return (
    <Card className="h-full min-h-[350px] flex flex-col justify-between">
      <CardHeader>
        <CardTitle>
          {isRtl ? "روند تغییرات شاخص احساسات" : "Sentiment Trend Index"}
        </CardTitle>
        <CardDescription>
          {isRtl
            ? "تحلیل روند کیفی بازخوردهای ثبت شده در هفت روز گذشته."
            : "Analytical time-series trend of tracked sentiment over the past 7 days."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 mt-4">
        {/* Set fixed height parent for the responsive container */}
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: isRtl ? 10 : 20, left: isRtl ? 20 : 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1F76F9" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#1F76F9" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke="var(--text-muted)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                reversed={isRtl}
              />
              <YAxis
                stroke="var(--text-muted)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                domain={[-1, 1]}
                tickFormatter={(val) => val.toFixed(1)}
                orientation={isRtl ? "right" : "left"}
              />
              <Tooltip content={<CustomTooltip isRtl={isRtl} />} cursor={{ stroke: "var(--border-strong)" }} />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#1F76F9"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorScore)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
