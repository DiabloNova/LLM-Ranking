"use client";

import React from "react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";
import { useTheme } from "@/components/ThemeProvider";

/**
 * Renders the localized Entity Explorer page with knowledge graph information and a visualizer placeholder.
 */
export default function EntitiesPage() {
  const { language } = useTheme();

  const breadcrumbItems = [
    { label: language === "fa" ? "داشبورد" : "Dashboard", href: "/dashboard" },
    { label: language === "fa" ? "کاوشگر موجودیت‌ها" : "Entity Explorer" },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={breadcrumbItems} />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {language === "fa" ? "کاوشگر موجودیت‌ها" : "Entity Explorer"}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {language === "fa"
              ? "مدیریت ارتباطات گراف دانش و چگونگی پیوند برند شما با مفاهیم کلیدی سیستم‌های هوش مصنوعی."
              : "Manage knowledge graph associations and how your brand links with key AI concept schemas."}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{language === "fa" ? "نقشه‌برداری ارتباطات گراف دانش" : "Knowledge Graph Connection Map"}</CardTitle>
            <CardDescription>
              {language === "fa"
                ? "ارزیابی ردپای هویت دیجیتال شما در ویکی‌دیتا و پایگاه داده‌های گراف معنایی برداری."
                : "Evaluation of your digital identity footprint on Wikidata and semantic vector graph databases."}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center border border-dashed border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--background)]">
            <span className="text-sm text-[var(--text-muted)]">
              {language === "fa" ? "ماژول پایگاه دانش و گراف موجودیت (به زودی در فازهای بعدی)" : "Knowledge Graph Visualizer (Coming in future phases)"}
            </span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
