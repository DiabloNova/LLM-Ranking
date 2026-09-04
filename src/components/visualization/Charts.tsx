"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { useTheme } from "@/components/ThemeProvider";
import { ChartDataset } from "./contracts";

// Hook to detect user reduced-motion preference
export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const listener = (e: MediaQueryListEvent) => {
      setReduced(e.matches);
    };
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);
  return reduced;
}

interface PrimitiveProps {
  dataset: ChartDataset;
  height?: number | string;
}

// -------------------------------------------------------------------------
// Glassmorphic Custom Tooltip Component
// -------------------------------------------------------------------------
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    color?: string;
    fill?: string;
    name?: string;
    value?: number | string;
  }>;
  label?: string;
  isRtl: boolean;
  valueSuffix?: string;
}

const ChartCustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  isRtl,
  valueSuffix = "",
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--card)] backdrop-blur-md border border-[var(--glass-border)] p-3 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[120px]">
        <p className="font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-1 mb-1">
          {label}
        </p>
        <div className="space-y-1 text-start">
          {payload.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color || item.fill }}
              />
              <span className="text-[var(--text-muted)]">
                {isRtl ? item.name : item.name}
              </span>
              <span className="ms-auto font-display font-bold text-[var(--text-primary)]">
                {item.value}
                <span className="text-[10px] text-[var(--text-muted)] ms-0.5">
                  {valueSuffix}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// -------------------------------------------------------------------------
// 1. Line Chart Primitive
// -------------------------------------------------------------------------
export const LineChartPrimitive: React.FC<PrimitiveProps> = ({ dataset, height = 240 }) => {
  const { language } = useTheme();
  const isRtl = language === "fa";
  const reducedMotion = useReducedMotion();

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={dataset.data}
          margin={{ top: 10, right: isRtl ? 10 : 25, left: isRtl ? 25 : 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey={dataset.xAxisKey}
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
            orientation={isRtl ? "right" : "left"}
            label={{
              value: isRtl ? dataset.yAxisLabelFa : dataset.yAxisLabelEn,
              angle: isRtl ? 90 : -90,
              position: "insideLeft",
              style: { fill: "var(--text-muted)", fontSize: 10 },
            }}
          />
          <Tooltip
            content={<ChartCustomTooltip isRtl={isRtl} valueSuffix={dataset.valueSuffix} />}
            cursor={{ stroke: "var(--border-strong)", strokeWidth: 1.5 }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            iconSize={8}
            formatter={(value, entry) => {
              const dataKey = (entry as { dataKey?: string }).dataKey;
              const series = dataset.series.find((s) => s.key === dataKey);
              return (
                <span className="text-[var(--text-muted)] text-xs font-medium hover:text-[var(--text-primary)] transition-colors">
                  {isRtl ? series?.nameFa || value : series?.nameEn || value}
                </span>
              );
            }}
          />
          {dataset.series.map((series, idx) => (
            <Line
              key={series.key}
              type="monotone"
              dataKey={series.key}
              name={isRtl ? series.nameFa : series.nameEn}
              stroke={series.color || `hsl(var(--primary-h, 215), 90%, ${50 + idx * 10}%)`}
              strokeWidth={2.5}
              activeDot={{ r: 6, strokeWidth: 0 }}
              dot={{ r: 3, strokeWidth: 1.5 }}
              isAnimationActive={!reducedMotion}
              animationDuration={500}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// -------------------------------------------------------------------------
// 2. Bar Chart Primitive
// -------------------------------------------------------------------------
export const BarChartPrimitive: React.FC<PrimitiveProps> = ({ dataset, height = 240 }) => {
  const { language } = useTheme();
  const isRtl = language === "fa";
  const reducedMotion = useReducedMotion();

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={dataset.data}
          margin={{ top: 10, right: isRtl ? 10 : 25, left: isRtl ? 25 : 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey={dataset.xAxisKey}
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
            orientation={isRtl ? "right" : "left"}
          />
          <Tooltip
            content={<ChartCustomTooltip isRtl={isRtl} valueSuffix={dataset.valueSuffix} />}
            cursor={{ fill: "var(--border)", opacity: 0.2 }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            iconSize={8}
            formatter={(value, entry) => {
              const dataKey = (entry as { dataKey?: string }).dataKey;
              const series = dataset.series.find((s) => s.key === dataKey);
              return (
                <span className="text-[var(--text-muted)] text-xs font-medium">
                  {isRtl ? series?.nameFa || value : series?.nameEn || value}
                </span>
              );
            }}
          />
          {dataset.series.map((series, idx) => (
            <Bar
              key={series.key}
              dataKey={series.key}
              name={isRtl ? series.nameFa : series.nameEn}
              fill={series.color || `hsl(var(--primary-h, 215), 90%, ${50 + idx * 10}%)`}
              radius={[4, 4, 0, 0]}
              isAnimationActive={!reducedMotion}
              animationDuration={500}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// -------------------------------------------------------------------------
// 3. Area Chart Primitive
// -------------------------------------------------------------------------
export const AreaChartPrimitive: React.FC<PrimitiveProps> = ({ dataset, height = 240 }) => {
  const { language } = useTheme();
  const isRtl = language === "fa";
  const reducedMotion = useReducedMotion();

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={dataset.data}
          margin={{ top: 10, right: isRtl ? 10 : 25, left: isRtl ? 25 : 10, bottom: 5 }}
        >
          <defs>
            {dataset.series.map((series, idx) => (
              <linearGradient key={series.key} id={`grad-${series.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={series.color || `hsl(var(--primary-h, 215), 90%, ${50 + idx * 10}%)`}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={series.color || `hsl(var(--primary-h, 215), 90%, ${50 + idx * 10}%)`}
                  stopOpacity={0}
                />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey={dataset.xAxisKey}
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
            orientation={isRtl ? "right" : "left"}
          />
          <Tooltip content={<ChartCustomTooltip isRtl={isRtl} valueSuffix={dataset.valueSuffix} />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            iconSize={8}
            formatter={(value, entry) => {
              const dataKey = (entry as { dataKey?: string }).dataKey;
              const series = dataset.series.find((s) => s.key === dataKey);
              return (
                <span className="text-[var(--text-muted)] text-xs font-medium">
                  {isRtl ? series?.nameFa || value : series?.nameEn || value}
                </span>
              );
            }}
          />
          {dataset.series.map((series, idx) => (
            <Area
              key={series.key}
              type="monotone"
              dataKey={series.key}
              name={isRtl ? series.nameFa : series.nameEn}
              stroke={series.color || `hsl(var(--primary-h, 215), 90%, ${50 + idx * 10}%)`}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#grad-${series.key})`}
              isAnimationActive={!reducedMotion}
              animationDuration={500}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// -------------------------------------------------------------------------
// 4. Scatter Chart Primitive
// -------------------------------------------------------------------------
export const ScatterChartPrimitive: React.FC<PrimitiveProps> = ({ dataset, height = 240 }) => {
  const { language } = useTheme();
  const isRtl = language === "fa";
  const reducedMotion = useReducedMotion();

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: isRtl ? 10 : 25, left: isRtl ? 25 : 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            type="number"
            dataKey={dataset.xAxisKey}
            stroke="var(--text-muted)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            reversed={isRtl}
          />
          <YAxis
            type="number"
            stroke="var(--text-muted)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            orientation={isRtl ? "right" : "left"}
          />
          <Tooltip content={<ChartCustomTooltip isRtl={isRtl} />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className="text-[var(--text-muted)] text-xs font-medium">{value}</span>
            )}
          />
          {dataset.series.map((series, idx) => (
            <Scatter
              key={series.key}
              name={isRtl ? series.nameFa : series.nameEn}
              data={dataset.data}
              fill={series.color || `hsl(var(--primary-h, 215), 90%, ${50 + idx * 10}%)`}
              isAnimationActive={!reducedMotion}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

// -------------------------------------------------------------------------
// 5. Donut / Pie Chart Primitive
// -------------------------------------------------------------------------
export const DonutChartPrimitive: React.FC<PrimitiveProps> = ({ dataset, height = 240 }) => {
  const { language } = useTheme();
  const isRtl = language === "fa";
  const reducedMotion = useReducedMotion();

  // Pie/Donut requires mapped data { name, value }
  const adaptedData = dataset.data.map((d) => {
    // Find matching series or fall back
    const valueKey = dataset.series[0]?.key || "value";
    return {
      name: d[dataset.xAxisKey] as string,
      value: d[valueKey] as number,
    };
  });

  const COLORS = [
    "#1F76F9", // Sky Blue / Primary
    "#F97316", // Orange
    "#10B981", // Emerald
    "#8B5CF6", // Purple
    "#EC4899", // Pink
  ];

  return (
    <div className="w-full flex flex-col md:flex-row items-center justify-center gap-6" style={{ height }}>
      <div className="flex-1 w-full h-full max-h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={adaptedData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={4}
              dataKey="value"
              isAnimationActive={!reducedMotion}
              animationDuration={500}
            >
              {adaptedData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={dataset.series[index]?.color || COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0];
                  return (
                    <div className="bg-[var(--card)] backdrop-blur-md border border-[var(--glass-border)] p-2.5 rounded-xl shadow-lg text-xs">
                      <p className="font-bold text-[var(--text-primary)]">{data.name}</p>
                      <p className="text-[var(--text-primary)] font-display font-bold mt-0.5">
                        {data.value}
                        <span className="text-[10px] text-[var(--text-muted)] ms-0.5">
                          {dataset.valueSuffix}
                        </span>
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Accessible Side Legend */}
      <div className="flex flex-col gap-2 min-w-[120px] text-start" dir={isRtl ? "rtl" : "ltr"}>
        {adaptedData.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: dataset.series[idx]?.color || COLORS[idx % COLORS.length] }}
            />
            <span className="text-[var(--text-primary)] font-medium">{item.name}</span>
            <span className="ms-auto font-display font-semibold text-[var(--text-muted)]">
              {item.value}
              {dataset.valueSuffix}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
