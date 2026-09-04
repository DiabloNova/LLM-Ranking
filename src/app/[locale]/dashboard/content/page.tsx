"use client";

import React from "react";
import { ContentStudio } from "@/components/features/content/ContentStudio";
import { GlassCard } from "@/components/GlassCard";
import { useTheme } from "@/components/ThemeProvider";
import { FileText } from "lucide-react";

export default function ContentStudioPage() {
  const { language } = useTheme();
  const isRtl = language === "fa";

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)] font-display flex items-center gap-2.5">
          <FileText className="text-[var(--sky-blue-500)]" size={24} />
          <span>{isRtl ? "استودیو محتوای هوش برند" : "Content Creation Studio"}</span>
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1.5 max-w-3xl leading-relaxed">
          {isRtl
            ? "بستر یکپارچه تولید و بهینه‌سازی محتوا بر اساس دانش عمیق زبانی و داده‌های پایش شده."
            : "Synthesize and optimize brand-aligned literature enriched by real-time conversational retrieval statistics."}
        </p>
      </div>

      {/* Wrapped Panel in Premium Glassmorphic Container */}
      <GlassCard hoverable={false} className="p-6">
        <ContentStudio />
      </GlassCard>
    </div>
  );
}
