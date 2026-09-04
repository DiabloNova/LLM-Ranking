"use client";

import React from "react";
import dynamic from "next/dynamic"
const LlmAnalyticsPanel = dynamic(() => import("@/components/features/analytics/LlmAnalyticsPanel").then((m) => ({ default: m.LlmAnalyticsPanel })), { loading: () => <div className="h-96 w-full animate-pulse rounded-xl bg-[var(--muted-surface)]" aria-label="Loading analytics" /> });
import { GlassCard } from "@/components/GlassCard";
import { useTheme } from "@/components/ThemeProvider";
import { Bot } from "lucide-react";

export default function LlmAnalyticsPage() {
  const { language } = useTheme();
  const isRtl = language === "fa";

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)] font-display flex items-center gap-2.5">
          <Bot className="text-[var(--orange-500)]" size={24} />
          <span>{isRtl ? "تحلیل مدل‌های زبانی بزرگ" : "LLM Semantic & Bias Analytics"}</span>
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1.5 max-w-3xl leading-relaxed">
          {isRtl
            ? "پایش الگوها، شاخص‌های معنایی، و تحلیل جهت‌گیری پاسخ‌ها در مدل‌های زبانی پیشرو."
            : "Monitor response biases, token representation indexes, and query metrics across conversational models."}
        </p>
      </div>

      {/* Wrapped Panel in Premium Glassmorphic Container */}
      <GlassCard hoverable={false} className="p-6">
        <LlmAnalyticsPanel />
      </GlassCard>
    </div>
  );
}
