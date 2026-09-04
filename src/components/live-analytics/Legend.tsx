import React from "react";
import { LegendItem } from "./types";

interface LegendProps {
  items: LegendItem[];
  onToggle: (id: string) => void;
  onHoverItem: (id: string | null) => void;
  language: "en" | "fa";
}

export const Legend: React.FC<LegendProps> = ({ items, onToggle, onHoverItem, language }) => {
  const isRtl = language === "fa";

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-4 py-4 px-6 border-t border-white/10 bg-[#0A1324]"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onToggle(item.id)}
          onMouseEnter={() => onHoverItem(item.id)}
          onMouseLeave={() => onHoverItem(null)}
          className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all duration-300 cursor-pointer ${
            item.visible
              ? "bg-[#1E293B]/40 border-white/10 text-[#FFFFFF] shadow-lg"
              : "bg-transparent border-white/5 text-[#64748B] line-through opacity-50"
          }`}
        >
          {/* Glowing Indicator Dot */}
          <span
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              item.visible ? "animate-pulse" : "opacity-40"
            }`}
            style={{
              backgroundColor: item.color,
              boxShadow: item.visible ? `0 0 8px ${item.color}` : "none",
            }}
          />

          {/* Metric Title */}
          <span className="font-medium transition-colors group-hover:text-white">
            {isRtl && item.nameFa ? item.nameFa : item.name}
          </span>

          {/* Live Value with Tabular Numbers (Eliminates CLS) */}
          {item.visible && (
            <span
              className="text-[11px] font-bold py-0.5 px-2 rounded bg-white/5 font-display tabular-nums"
              style={{ color: item.color }}
            >
              {item.value}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};
