"use client";

import React from "react";
import { useTheme } from "@/components/ThemeProvider";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";
import { Network, CheckCircle2 } from "lucide-react";

export default function EntitiesGraphPage() {
  const { language } = useTheme();
  const isRtl = language === "fa";

  return (
    <div className="space-y-6 animate-fade-in text-start">
      <div>
        <h1 className="text-2xl font-black text-[var(--text-primary)] font-display flex items-center gap-2.5">
          <Network className="text-[var(--sky-blue-500)]" size={24} />
          <span>{isRtl ? "نمودار زنده دانش" : "Live Knowledge Graph"}</span>
          <span className="px-2 py-0.5 text-[10px] font-bold bg-[var(--sky-blue-500)] text-white rounded-full">
            Shell Verified
          </span>
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-2xl">
          {isRtl
            ? "ترسیم زنده ارتباط معنایی برند شما، تحلیل موجودیت‌های کلیدی در گراف دانش، و میزان قرابت موضوعی با رقبا."
            : "Visualize your semantic knowledge map, brand authority entity coordinates, and relationships."}
        </p>
      </div>

      <Card className="border border-[var(--border)] bg-[var(--card)]">
        <CardHeader>
          <CardTitle className="text-sm font-black text-[var(--text-primary)] flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[var(--sky-blue-500)]" />
            <span>{isRtl ? "پیکربندی موفقیت‌آمیز پوسته" : "Shell Architecture Success"}</span>
          </CardTitle>
          <CardDescription className="text-xs">
            {isRtl
              ? "پوسته یکپارچه داشبورد با موفقیت بر روی این مسیر بارگذاری شده است."
              : "The unified Dashboard Shell is actively rendering this route context with proper navigation parameters."}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-xs text-[var(--text-secondary)] leading-relaxed space-y-2">
          <p>
            {isRtl
              ? "مسیر فعال سایدبار: ابزارهای دانش و موجودیت‌ها > نمودار زنده دانش"
              : "Active Sidebar Navigation State: Knowledge & Entity Tools > Live Knowledge Graph"}
          </p>
          <p className="text-[10px] text-[var(--text-muted)] font-mono">
            Route: /dashboard/entities/graph
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
