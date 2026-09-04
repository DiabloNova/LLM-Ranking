"use client";

import React from "react";
import { GlassCard } from "@/components/GlassCard";
import { useTheme } from "@/components/ThemeProvider";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  const { language } = useTheme();
  const isRtl = language === "fa";

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)] font-display flex items-center gap-2.5">
          <Settings className="text-[var(--sky-blue-500)]" size={24} />
          <span>{isRtl ? "تنظیمات سیستم" : "System Settings"}</span>
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1.5 max-w-3xl leading-relaxed">
          {isRtl
            ? "پیکربندی هویت برند، مدیریت حریم خصوصی، و دسترسی به کلیدهای API."
            : "Configure brand settings, integrate crawl sources, and manage developer tokens."}
        </p>
      </div>

      <GlassCard hoverable={false} className="p-8 text-center min-h-[300px] flex flex-col items-center justify-center">
        <Settings size={48} className="text-[var(--text-muted)] mb-4 animate-spin" style={{ animationDuration: "8s" }} />
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">
          {isRtl ? "بخش تنظیمات در دست توسعه" : "Settings Module Under Development"}
        </h3>
        <p className="text-xs text-[var(--text-muted)] max-w-md">
          {isRtl
            ? "پیکربندی‌های امنیتی و مراجع خزش در به‌روزرسانی‌های بعدی در دسترس خواهد بود."
            : "Security parameters and vector partition controls will be live in upcoming version releases."}
        </p>
      </GlassCard>
    </div>
  );
}
