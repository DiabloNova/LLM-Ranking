"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { useTheme } from "@/components/ThemeProvider";
import { Sparkles, TrendingUp, HelpCircle } from "lucide-react";
import { Button } from "@/components/Button";
import { useRouter } from "next/navigation";

interface TrendData {
  date: string;
  seo: number;
  ai: number;
}

interface VisibilityTrendChartProps {
  data: TrendData[];
  loading?: boolean;
}

interface CustomTooltipPayloadItem {
  value: number | string;
  name: string;
  stroke?: string;
  fill?: string;
  payload?: TrendData;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: CustomTooltipPayloadItem[];
  label?: string;
  isRtl?: boolean;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, isRtl }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--card)] backdrop-blur-md border border-[var(--glass-border)] p-3 rounded-xl shadow-lg text-xs space-y-1.5 text-start">
        <p className="font-bold text-[var(--text-primary)]">{label}</p>
        {payload.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.stroke }} />
            <span className="text-[var(--text-secondary)] font-semibold">
              {item.name}:
            </span>
            <span className="font-display font-bold text-[var(--text-primary)]">
              {typeof item.value === "number" ? `${item.value}%` : item.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const VisibilityTrendChart: React.FC<VisibilityTrendChartProps> = ({
  data = [],
  loading = false,
}) => {
  const { language } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isRtl = language === "fa";

  if (loading || !mounted) {
    return (
      <Card className="min-h-[350px] flex flex-col justify-between border border-[var(--border)]">
        <CardHeader>
          <div className="h-4 w-48 bg-[var(--muted-surface)] rounded animate-pulse mb-2" />
          <div className="h-3 w-80 bg-[var(--muted-surface)] rounded animate-pulse" />
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <div className="h-full w-full bg-[var(--muted-surface)]/40 rounded-xl animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  // Handle empty state beautifully
  if (data.length === 0) {
    return (
      <Card className="min-h-[350px] flex flex-col justify-center items-center p-8 border border-[var(--border)] bg-[var(--card)] text-center space-y-4">
        <div className="p-4 bg-[var(--color-info-bg)] border border-[var(--border)] text-[var(--color-primary-600)] rounded-full">
          <TrendingUp size={36} className="rtl:-scale-x-100" />
        </div>
        <div className="max-w-md space-y-2">
          <h3 className="text-base font-black text-[var(--text-primary)] font-display tracking-normal">
            {isRtl ? "نمودار هوشمندی روند حضور و سئو وب‌سایت" : "Search & AI Visibility Historical Trends"}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {isRtl
              ? "هنوز هیچ گزارش بررسی یا اسکن دامنه‌ای ثبت نشده است. برای ترسیم نمودارهای تحلیلی و مقایسه‌ای بین سئو فنی و سهم دیده‌شدن هوش مصنوعی، اولین پایش را همین امروز اجرا کنید."
              : "No historical audit metrics found for your workspace. Initiate a technical crawl on your website to begin tracking multi-model search trends."}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => router.push(`/${language}/dashboard/audits`)}
          className="flex items-center gap-2"
        >
          <Sparkles size={14} />
          <span>{isRtl ? "شروع اولین پایش برند" : "Initiate First Brand Audit"}</span>
        </Button>
      </Card>
    );
  }

  return (
    <Card className="min-h-[380px] flex flex-col justify-between border border-[var(--border)] bg-[var(--card)]">
      <CardHeader className="text-start">
        <CardTitle className="text-base font-black flex items-center gap-2 text-[var(--text-primary)] font-display">
          <TrendingUp size={18} className="text-[var(--sky-blue-500)]" />
          <span>{isRtl ? "روند تغییرات حضور معنایی و سئو" : "Search & AI Visibility Trends"}</span>
        </CardTitle>
        <CardDescription className="text-xs text-[var(--text-secondary)]">
          {isRtl
            ? "مقایسه تاریخی رتبه بهینه‌سازی فنی موتورهای جستجو با سهم توصیه‌های هوش مصنوعی (AEO)"
            : "Chronological benchmark comparing technical SEO health against multi-model conversational prominence."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 mt-2">
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: isRtl ? 10 : 20, left: isRtl ? 20 : 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorSeo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1F76F9" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#1F76F9" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorAi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
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
                domain={[0, 100]}
                tickFormatter={(val) => `${val}%`}
                orientation={isRtl ? "right" : "left"}
              />
              <Tooltip content={<CustomTooltip isRtl={isRtl} />} cursor={{ stroke: "var(--border-strong)" }} />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: 11 }}
                align={isRtl ? "right" : "left"}
              />
              <Area
                type="monotone"
                dataKey="seo"
                name={isRtl ? "سلامت سئو فنی" : "Technical SEO Health"}
                stroke="#1F76F9"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorSeo)"
              />
              <Area
                type="monotone"
                dataKey="ai"
                name={isRtl ? "سهم دیده‌شدن هوش مصنوعی" : "AI Visibility Index"}
                stroke="#F59E0B"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorAi)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
