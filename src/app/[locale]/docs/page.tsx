"use client";

import React, { use } from "react";
import Link from "next/link";
import { DOCS_INDEX } from "@/lib/docsIndex";
import { BookOpen, ShieldCheck, Cpu, Library, HelpCircle, ArrowRight, Server, Terminal, Lock, Box, Grid } from "lucide-react";

export default function DocsIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = use(params);
  const locale = resolvedParams.locale;
  const isFa = locale === "fa";

  const categoriesMap = DOCS_INDEX.reduce((acc, topic) => {
    if (!acc[topic.category]) acc[topic.category] = [];
    acc[topic.category].push(topic);
    return acc;
  }, {} as Record<string, typeof DOCS_INDEX>);

  const categories = Object.keys(categoriesMap).filter(c => c !== "project");

  const categoryIcons: Record<string, any> = {
    "product": <Box size={20} />,
    "user-guides": <Library size={20} />,
    "services": <Server size={20} />,
    "api": <Terminal size={20} />,
    "architecture": <Grid size={20} />,
    "security": <ShieldCheck size={20} />,
    "admin": <ShieldCheck size={20} />,
    "ai-intelligence": <Cpu size={20} />
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="p-8 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-950/80 backdrop-blur-md relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-1/4 w-32 h-32 bg-[var(--sky-blue-500)]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-[var(--orange-500)]/10 rounded-full blur-3xl" />

        <div className="space-y-4 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-[10px] font-black uppercase text-sky-400">
            <Library size={12} />
            <span>{isFa ? "مرکز راهنمای فنی" : "Developer & Architecture Center"}</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-display leading-snug">
            {isFa ? "مستندات پلتفرم seorchable.ir" : "seorchable.ir Core Documentation"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
            {isFa
              ? "به مرکز مستندات جامع سامانه خوش آمدید. در این بخش تمامی جنبه‌های پلتفرم از جمله معماری کلی، زیرساخت امنیتی، راهنماهای کاربری و مستندات سرویس‌ها به تفکیک گردآوری شده‌اند."
              : "Welcome to our technical knowledge hub. Dive deep into clean architecture specs, multi-tenant isolation layers, NLP/AEO crawlers, user guides, and API integration flows."}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {categories.map((categoryKey) => {
          const categoryTopics = categoriesMap[categoryKey];
          const firstTopic = categoryTopics[0];
          if (!firstTopic) return null;

          return (
            <div key={categoryKey} className="glass-panel p-6 rounded-2xl border border-white/10 bg-slate-900/20 hover:border-[var(--sky-blue-500)]/30 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  {categoryIcons[categoryKey] || <BookOpen size={20} />}
                </div>
                <h2 className="text-base font-black text-white font-display uppercase tracking-wider">
                  {isFa ? firstTopic.categoryFa : firstTopic.category.replace("-", " ")}
                </h2>
              </div>

              <div className="pt-6 border-t border-white/5 mt-6 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">{isFa ? "سرفصل‌ها:" : "Topics:"}</span>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {categoryTopics.slice(0, 4).map((topic) => (
                    <Link
                      key={topic.slug}
                      href={`/${locale}/docs/${topic.slug}`}
                      className="text-slate-400 hover:text-[var(--sky-blue-500)] truncate transition-colors"
                    >
                      • {isFa ? topic.titleFa : topic.titleEn}
                    </Link>
                  ))}
                  {categoryTopics.length > 4 && (
                    <span className="text-slate-500 font-bold">+{categoryTopics.length - 4} {isFa ? "موضوع دیگر" : "more"}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
