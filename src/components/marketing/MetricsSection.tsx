"use client";

import React from "react";
import { useTheme } from "@/components/ThemeProvider";

/**
 * Impact metrics rendered on neumorphic tiles for a tactile, premium feel.
 */
export function MetricsSection() {
  const { language } = useTheme();
  const isFa = language === "fa";

  const metrics = [
    { value: "۳٫۸×", valueEn: "3.8×", fa: "رشد ارجاع در مدل‌ها", en: "growth in model citations" },
    { value: "۴", valueEn: "4", fa: "موتور هوش مصنوعی متصل", en: "AI engines connected" },
    { value: "٪۹۲", valueEn: "92%", fa: "دقت کشف توهم", en: "hallucination detection accuracy" },
    { value: "<۶۰ث", valueEn: "<60s", fa: "زمان هشدار لحظه‌ای", en: "real-time alert latency" },
  ];

  return (
    <section id="metrics" className="py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="neu-surface rounded-[var(--radius-xl)] p-8 md:p-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {metrics.map((m, i) => (
              <div key={i} className="text-center space-y-2">
                <div className="font-display font-black text-4xl md:text-5xl text-gradient-brand leading-none">
                  {isFa ? m.value : m.valueEn}
                </div>
                <p className="text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed text-balance">
                  {isFa ? m.fa : m.en}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
