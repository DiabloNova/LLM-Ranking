"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend,
} from "recharts";
import { useTheme } from "@/components/ThemeProvider";
import { useReducedMotion } from "./Charts";
import { RadarDataset, HeatmapDataset, HeatmapCell } from "./contracts";

interface RadarProps {
  dataset: RadarDataset;
  height?: number | string;
}

interface HeatmapProps {
  dataset: HeatmapDataset;
}

// -------------------------------------------------------------------------
// 1. Radar Chart Primitive
// -------------------------------------------------------------------------
export const RadarChartPrimitive: React.FC<RadarProps> = ({ dataset, height = 260 }) => {
  const { language } = useTheme();
  const isRtl = language === "fa";
  const reducedMotion = useReducedMotion();

  // Recharts Radar requires data item structured as { subject, series1, series2 }
  const formattedData = dataset.dimensions.map((dim) => {
    const item: Record<string, unknown> = {
      subject: isRtl ? dim.labelFa : dim.labelEn,
    };
    dataset.data.forEach((d) => {
      if (d.dimensionKey === dim.key) {
        dataset.series.forEach((s) => {
          item[s.key] = d[s.key];
        });
      }
    });
    return item;
  });

  return (
    <div className="w-full flex items-center justify-center" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={formattedData}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "var(--text-muted)", fontSize: 10, fontWeight: 500 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: "var(--text-muted)", fontSize: 8 }}
            axisLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-[var(--card)] backdrop-blur-md border border-[var(--glass-border)] p-2.5 rounded-xl shadow-lg text-xs space-y-1 text-start">
                    <p className="font-bold text-[var(--text-primary)] mb-1">
                      {payload[0].payload.subject}
                    </p>
                    {payload.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                        <span className="text-[var(--text-muted)]">{p.name}:</span>
                        <span className="font-display font-bold text-[var(--text-primary)] ms-auto">{p.value}</span>
                      </div>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />
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
            <Radar
              key={series.key}
              name={isRtl ? series.nameFa : series.nameEn}
              dataKey={series.key}
              stroke={series.color || `hsl(var(--primary-h, 215), 90%, ${45 + idx * 15}%)`}
              fill={series.color || `hsl(var(--primary-h, 215), 90%, ${45 + idx * 15}%)`}
              fillOpacity={0.25}
              isAnimationActive={!reducedMotion}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

// -------------------------------------------------------------------------
// 2. Heatmap Grid Primitive
// -------------------------------------------------------------------------
export const HeatmapPrimitive: React.FC<HeatmapProps> = ({ dataset }) => {
  const { language } = useTheme();
  const isRtl = language === "fa";
  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null);

  const xLabels = isRtl ? dataset.xLabelsFa : dataset.xLabelsEn;
  const yLabels = isRtl ? dataset.yLabelsFa : dataset.yLabelsEn;

  // Helper to interpolate colors between gradient steps (min to max)
  const getCellColor = (value: number) => {
    const ratio = (value - dataset.minVal) / (dataset.maxVal - dataset.minVal || 1);
    const clampedRatio = Math.max(0, Math.min(1, ratio));

    // Return CSS color variables or rgba color blends
    return `rgba(31, 118, 249, ${0.15 + clampedRatio * 0.85})`;
  };

  return (
    <div className="w-full flex flex-col space-y-4" style={{ direction: isRtl ? "rtl" : "ltr" }}>
      {/* Scrollable Heatmap Container for Mobile/Responsive Safeguard */}
      <div className="overflow-x-auto pb-2 border border-[var(--border)] rounded-xl p-4 bg-[var(--background)]/30">
        <div className="min-w-[480px] grid" style={{ gridTemplateColumns: `100px repeat(${xLabels.length}, minmax(0, 1fr))` }}>
          {/* Top Corner cell */}
          <div className="h-8" />

          {/* X Axis Labels */}
          {xLabels.map((x, colIdx) => (
            <div
              key={colIdx}
              className="text-center font-semibold text-[10px] text-[var(--text-muted)] truncate px-1 h-8 flex items-center justify-center border-b border-[var(--border)]"
            >
              {x}
            </div>
          ))}

          {/* Grid rows mapping Y axis and inner Cells */}
          {yLabels.map((y, rowIdx) => {
            const rawYLabel = isRtl ? dataset.yLabelsFa[rowIdx] : dataset.yLabelsEn[rowIdx];
            return (
              <React.Fragment key={rowIdx}>
                {/* Y Axis Label */}
                <div className="flex items-center text-start font-semibold text-[10px] text-[var(--text-muted)] pr-2 truncate h-11 border-r border-[var(--border)]">
                  {y}
                </div>

                {/* Grid cells across X columns */}
                {xLabels.map((x, colIdx) => {
                  const rawXLabel = isRtl ? dataset.xLabelsFa[colIdx] : dataset.xLabelsEn[colIdx];
                  // Find cell matching row (yLabel) and column (xLabel) using key mappings
                  const cell = dataset.cells.find(
                    (c) =>
                      (c.yLabel === dataset.yLabelsEn[rowIdx] || c.yLabel === dataset.yLabelsFa[rowIdx]) &&
                      (c.xLabel === dataset.xLabelsEn[colIdx] || c.xLabel === dataset.xLabelsFa[colIdx])
                  ) || { xLabel: rawXLabel, yLabel: rawYLabel, value: 0 };

                  const cellColor = getCellColor(cell.value);

                  return (
                    <button
                      key={colIdx}
                      onClick={() => setSelectedCell(cell)}
                      style={{ backgroundColor: cellColor }}
                      className="h-11 m-0.5 rounded-lg transition-all duration-200 hover:scale-[1.05] hover:ring-2 hover:ring-[var(--border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--border-strong)] text-center flex flex-col items-center justify-center cursor-pointer group relative"
                      aria-label={`${y} x ${x}: ${cell.displayValue || cell.value}`}
                    >
                      <span className="font-display font-bold text-xs text-white group-hover:scale-105 drop-shadow">
                        {cell.displayValue || cell.value}
                      </span>

                      {/* Hover Tooltip Overlay */}
                      <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition-all z-20 bg-[var(--card)] border border-[var(--glass-border)] px-2 py-1 rounded text-[10px] text-[var(--text-primary)] shadow-lg whitespace-nowrap">
                        {y} : {x} = {cell.displayValue || cell.value}
                      </span>
                    </button>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Selected Cell Detail Info bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between text-xs text-[var(--text-muted)] border-t border-[var(--border)] pt-3 gap-2">
        <div className="flex items-center gap-3">
          <span>{isRtl ? "شدت مقادیر:" : "Value Intensity:"}</span>
          <div className="flex items-center gap-1">
            <span className="text-[10px]">{isRtl ? "کم" : "Low"}</span>
            <div className="h-2.5 w-24 rounded-full bg-gradient-to-r from-[#1F76F9]/20 to-[#1F76F9]" />
            <span className="text-[10px]">{isRtl ? "زیاد" : "High"}</span>
          </div>
        </div>

        {selectedCell && (
          <div className="bg-[var(--card)]/50 border border-[var(--border)] px-3 py-1.5 rounded-xl flex items-center gap-2">
            <span className="font-semibold text-[var(--text-primary)]">
              {selectedCell.yLabel} × {selectedCell.xLabel}:
            </span>
            <span className="font-display font-bold text-[#1F76F9]">
              {selectedCell.displayValue || selectedCell.value}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
