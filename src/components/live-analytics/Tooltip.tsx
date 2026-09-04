import React, { useRef, useState, useEffect } from "react";
import { TooltipState } from "./types";

interface TooltipProps {
  state: TooltipState;
  language: "en" | "fa";
}

export const Tooltip: React.FC<TooltipProps> = ({ state, language }) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [styleOffset, setStyleOffset] = useState({ xOffset: 0, yOffset: 0 });

  useEffect(() => {
    if (!state.active || !tooltipRef.current) return;

    const el = tooltipRef.current;
    const parent = el.parentElement;
    if (!parent) return;

    const rect = el.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();

    let xOff = 0;
    let yOff = 0;

    // Left boundary edge detection
    if (state.x - rect.width / 2 < 0) {
      xOff = rect.width / 2 - state.x + 12;
    }
    // Right boundary edge detection
    if (state.x + rect.width / 2 > parentRect.width) {
      xOff = parentRect.width - (state.x + rect.width / 2) - 12;
    }
    // Top boundary edge detection (flip to bottom of pointer if clipping top)
    if (state.y - rect.height - 16 < 0) {
      yOff = rect.height + 32; // position below
    }

    setStyleOffset({ xOffset: xOff, yOffset: yOff });
  }, [state.active, state.x, state.y]);

  if (!state.active) return null;

  const isRtl = language === "fa";

  // Position tooltip based on calculated safe offsets to prevent viewport clipping
  const finalX = state.x + styleOffset.xOffset;
  const isFlipped = styleOffset.yOffset > 0;
  const finalY = state.y + styleOffset.yOffset;

  return (
    <div
      ref={tooltipRef}
      className="absolute z-30 pointer-events-none p-4 rounded-2xl border border-white/10 bg-slate-950/85 backdrop-blur-md shadow-2xl text-xs space-y-2 transition-all duration-150 ease-out animate-fade-in"
      style={{
        left: `${finalX}px`,
        top: `${finalY}px`,
        transform: isFlipped ? "translate(-50%, 12px)" : "translate(-50%, -100%)",
        marginTop: isFlipped ? undefined : "-16px",
      }}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Tooltip Header (Timestamp) */}
      <div className="flex items-center justify-between gap-6 border-b border-white/10 pb-1.5 mb-1 text-[10px] text-slate-400 font-mono tabular-nums">
        <span className="font-semibold uppercase tracking-wider">
          {isRtl ? "زمان پاسخ" : "TIMESTAMP"}
        </span>
        <span>{state.label}</span>
      </div>

      {/* Metric list with values and variance trends */}
      <div className="space-y-1.5 min-w-[140px]">
        {state.values.map((v) => {
          const isPositive = v.trend >= 0;
          const trendColor = isPositive ? "text-emerald-400" : "text-rose-400";
          const trendSign = isPositive ? "+" : "";

          return (
            <div key={v.id} className="flex items-center justify-between gap-4 py-0.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: v.color }} />
                <span className="text-slate-300 font-medium">
                  {isRtl && v.nameFa ? v.nameFa : v.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-right font-mono tabular-nums">
                <span className="font-bold text-white font-display">
                  {v.value}
                </span>
                <span className={`text-[10px] font-black ${trendColor}`}>
                  ({trendSign}{v.trend}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
