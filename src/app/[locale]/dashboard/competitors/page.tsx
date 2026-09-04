"use client";

import React from "react";
import dynamic from "next/dynamic"
import { Breadcrumb } from "@/components/Breadcrumb";
import { useTheme } from "@/components/ThemeProvider";
const CompetitiveAnalysisPanel = dynamic(() => import("@/components/features/analysis/CompetitiveAnalysisPanel").then((m) => ({ default: m.CompetitiveAnalysisPanel })), { loading: () => <div className="h-96 w-full animate-pulse rounded-xl bg-[var(--muted-surface)]" aria-label="Loading competitive analysis" /> });

/**
 * Beautiful dedicated page rendering our brand-new Competitive Analysis panel.
 */
export default function CompetitivePage() {
  const { language } = useTheme();
  const isRtl = language === "fa";

  const breadcrumbItems = [
    { label: isRtl ? "داشبورد" : "Dashboard", href: "/dashboard" },
    { label: isRtl ? "تحلیل رقابتی" : "Competitive Intelligence" },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={breadcrumbItems} />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)] font-display">
            {isRtl ? "تحلیل رقابتی هوشمند (Competitive Intel)" : "Competitive Intelligence"}
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {isRtl
              ? "پایش سهم صدای مدل‌های زبانی بزرگ، مقایسه شاخص‌های کلیدی محتوا و بهینه‌سازی فنی شما با ۵ رقیب اصلی."
              : "Compare brand metrics, content strategies, and SEO indicators directly with up to 5 competitors."}
          </p>
        </div>

        <CompetitiveAnalysisPanel />
      </div>
    </div>
  );
}
