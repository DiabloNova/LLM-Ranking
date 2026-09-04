"use client";

import React, { useState, use, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Globe,
  Database,
  Check,
  FileText,
  Activity,
  MessageSquare,
  Network,
  Zap,
  Brain,
  Search,
  CheckCircle,
  TrendingUp,
  ShieldCheck,
  Eye,
  Radar,
  Lock,
  Compass,
  DollarSign,
  Workflow,
  BarChart3,
  Terminal,
  FileCode,
  HeartHandshake,
  AlertTriangle,
  Layers,
  HelpCircle,
  PlayCircle,
  FileSpreadsheet,
  CheckSquare,
  BookOpen,
  MessagesSquare,
  Newspaper,
  BookMarked,
  Award,
  ArrowDown,
  Receipt,
  ExternalLink
} from "lucide-react";
import { Header } from "@/components/marketing/Header";
import { LandingFooter } from "@/components/marketing/LandingFooter";
import { Hero } from "@/components/marketing/Hero";
import { FreeAuditPanel } from "@/components/features/audit/FreeAuditPanel";
import { RadialPolarGraph } from "@/components/features/graph/RadialPolarGraph";
import { LazyLiveKnowledgeGraph } from "@/components/features/graph/LazyLiveKnowledgeGraph";

/**
 * High-fidelity, Product-First Enterprise AI Platform Homepage for seorchable.ir.
 * Redesigned from scratch to establish category supremacy comparable to Stripe, Vercel, and Semrush.
 * Perfectly localized, supports RTL/LTR, dark/light modes, and follows the specified logical flow.
 */
export default function MarketingLandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = use(params);
  const locale = resolvedParams.locale;
  const isFa = locale === "fa";

  // State for high-fidelity Mock Dashboard visualizations
  const [activeDashboardTab, setActiveDashboardTab] = useState<"visibility" | "authority" | "citation" | "competitor" | "graph" | "timeline">("visibility");

  // References for scrolling
  const freeAuditRef = useRef<HTMLDivElement | null>(null);
  const platformOverviewRef = useRef<HTMLDivElement | null>(null);
  const dashboardsRef = useRef<HTMLDivElement | null>(null);

  const scrollToRef = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // 12 Product Modules for Platform Overview
  const platformModules = [
    {
      id: "ai-visibility",
      icon: Eye,
      name: isFa ? "پایش میزان دیده‌شدن برند" : "AI Visibility Monitoring",
      desc: isFa ? "ردیابی زنده سهم استناد و حضور برند شما در پاسخ‌های ChatGPT، Claude و موتورهای نوظهور." : "Real-time auditing of your brand's citation frequency and share of voice inside LLM responses."
    },
    {
      id: "brand-intelligence",
      icon: Brain,
      name: isFa ? "تحلیل هوشمندی و درک معنایی" : "Brand Intelligence Analyzer",
      desc: isFa ? "کالبدشکافی دقیق برداشت مدل‌های زبانی از ارزش، هویت و خدمات اصلی کسب‌وکار شما." : "Deconstruct how generative engines interpret your core value proposition and brand context."
    },
    {
      id: "citation-tracking",
      icon: Activity,
      name: isFa ? "ردیابی استنادهای هوش مصنوعی" : "AI Citation Tracking",
      desc: isFa ? "پایش پیوندها، رفرنس‌های متنی و لینک‌های ارجاعی صادر شده توسط موتورهای مکالمه‌محور." : "Monitor exact hyperlinks and reference materials cited by conversational agents inside answers."
    },
    {
      id: "competitor-intelligence",
      icon: Compass,
      name: isFa ? "هوشمندی رقابتی پیشرفته" : "Competitor Intelligence",
      desc: isFa ? "تحلیل و مقایسه برداری سهم استناد و رتبه‌بندی رقبای هم‌سطح بازار در پاسخ‌ها." : "Execute multi-competitor spatial comparisons to dissect where your search share is leaking."
    },
    {
      id: "kg-explorer",
      icon: Network,
      name: isFa ? "گراف دانش معنایی برند" : "Knowledge Graph Explorer",
      desc: isFa ? "مدل‌سازی و ترسیم موجودیت‌ها و مفاهیم برای تثبیت لایه‌های برند در حافظه معنایی هوش مصنوعی." : "Map, explore, and establish entity-relationship graphs to inject brand context into foundational indices."
    },
    {
      id: "prompt-monitoring",
      icon: Terminal,
      name: isFa ? "رصد پرسش‌ها و پرس‌وجو‌ها" : "Prompt Monitoring",
      desc: isFa ? "تحلیل روزانه الگوهای جستجوی کاربران و شبیه‌سازی پرسش‌های پرتکرار صنعت شما." : "Track daily query prompts, simulate high-frequency user behaviors, and model sentiment shifts."
    },
    {
      id: "search-analytics",
      icon: Search,
      name: isFa ? "تحلیل آماری موتورهای پاسخگو" : "AI Search Analytics",
      desc: isFa ? "اندازه‌گیری و گزارش عمیق ایمپرشن، کلیک و ترافیک ارجاعی از موتورهای پاسخ‌دهنده." : "Measure impressions, click-through equivalents, and referral traffic driving from generative platforms."
    },
    {
      id: "geo-optimization",
      icon: Zap,
      name: isFa ? "بهینه‌سازی موتورهای پاسخگو (GEO)" : "Generative Engine Optimization",
      desc: isFa ? "فرم‌دهی متون صفحات، متادیتا و میکرودیتا جهت فهم و ترجیح داده‌ها توسط کراولرها." : "Format page structure, XML schemas, and semantic data to support clearer parsing by AI crawlers."
    },
    {
      id: "authority-score",
      icon: Award,
      name: isFa ? "شاخص اعتبار برند در هوش زبانی" : "Brand Authority Score",
      desc: isFa ? "سنتز آماری فاکتورهای اطمینان، حقیقت‌محوری و کیفیت پاسخ‌های مربوط به برند شما." : "A unified metric scoring brand reliability, sentiment, and factuality across top model ecosystems."
    },
    {
      id: "website-audit",
      icon: Globe,
      name: isFa ? "خزش ساختاری و آنالیز وب‌سایت" : "Website Audit Engine",
      desc: isFa ? "خزش فنی با Firecrawl برای رصد سورس‌کدها، فایل‌های دسترسی و بهینه‌سازی خوانش وب‌سایت." : "Crawl public pages with advanced Firecrawl integration to discover structural indexation anomalies."
    },
    {
      id: "content-intelligence",
      icon: FileText,
      name: isFa ? "هوشمندی و بهینه‌سازی محتوا" : "Content Intelligence",
      desc: isFa ? "تولید پیشنهادات عملی متنی و ساختاربندی مقالات برای تطبیق با الگوریتم‌های رتبه‌دهی LLM." : "Generate copywriting revisions and content structure changes calculated to rank higher in LLM citations."
    },
    {
      id: "entity-monitoring",
      icon: Layers,
      name: isFa ? "پایش موجودیت‌ها و مفاهیم برند" : "Entity Monitoring",
      desc: isFa ? "رصد پیوسته نام برند، زیربرندها، نام مدیران ارشد و دارایی‌های فکری در پایگاه‌های دانش هوش مصنوعی." : "Continuous tracking of corporate entities, executive names, and brand variants in model repositories."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--text-primary)]" style={{ direction: isFa ? "rtl" : "ltr" }}>
      {/* Navigation */}
      <Header />

      {/* Hero Section */}
      <Hero />

      {/* FREE AUDIT FUNNEL SECTION */}
      <section id="free-audit" ref={freeAuditRef} className="fluid-mesh py-20 bg-[var(--background)] relative border-b border-[var(--border)] overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8 relative z-10 text-center">
          <div className="max-w-3xl mx-auto space-y-3">
            <span className="text-xs uppercase font-black tracking-widest text-[var(--sky-blue-500)]">
              {isFa ? "بررسی فنی و محتوایی وب‌سایت" : "TECHNICAL AND CONTENT REVIEW"}
            </span>
            <h2 className="font-display font-black text-3xl md:text-4xl text-[var(--text-primary)]">
              {isFa ? "تصویر روشن‌تری از حضور برندتان به دست آورید" : "Build a clearer picture of your brand presence"}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-medium">
              {isFa
                ? "آدرس وب‌سایت خود را وارد کنید تا نخستین نشانه‌های فنی و محتوایی آن را بررسی کنید."
                : "Enter a website address to review its first technical and content signals."}
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <FreeAuditPanel />
          </div>
        </div>
      </section>

      {/* QUESTION 2: "What does it actually do?" - High-Fidelity Mock Dashboards */}
      <section id="dashboards" ref={dashboardsRef} className="py-24 bg-[var(--background-subtle)]/40 dark:bg-[#080b12]/40 border-b border-[var(--border)] relative">
        <div className="absolute inset-0 grid-backdrop opacity-[0.2] pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs uppercase font-black tracking-widest text-[#38bdf8]">{isFa ? "پیش‌نمایش محیط محصول" : "PRODUCT WORKSPACE PREVIEW"}</span>
            <h2 className="font-display font-black text-3xl md:text-4xl text-[var(--text-primary)]">
              {isFa ? "جریان کاری محصول را از نزدیک ببینید" : "See the product workflow"}
            </h2>
            <p className="text-[var(--text-secondary)]">
              {isFa
                ? "با جریان‌های اصلی کار، از بررسی تا پایش و بهینه‌سازی، آشنا شوید. داده‌های این بخش نمونه‌ای هستند."
                : "Explore the workflows the platform is designed to support. The values shown here are illustrative."}
            </p>
          </div>

          {/* Interactive Mock Dashboard Selector */}
          <div className="grid lg:grid-cols-[280px_1fr] gap-8 items-start">
            {/* Nav tabs list */}
            <div className="glass-panel p-4 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] space-y-1">
              {[
                { id: "visibility", label: isFa ? "شاخص دیده‌شدن هوش مصنوعی" : "Visibility Score Dashboard", icon: Eye },
                { id: "authority", label: isFa ? "امتیاز اعتبار برند (Authority)" : "Brand Authority Analyzer", icon: Award },
                { id: "citation", label: isFa ? "کاوشگر استنادهای چت‌بات‌ها" : "AI Citation Explorer", icon: FileText },
                { id: "competitor", label: isFa ? "رادار مقایسه رقبا" : "Competitor Comparison", icon: Compass },
                { id: "graph", label: isFa ? "گراف دانش معنایی" : "Knowledge Graph Builder", icon: Network },
                { id: "timeline", label: isFa ? "تایم‌لاین پایش پرسش‌ها" : "Prompt Monitoring Timeline", icon: Terminal },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDashboardTab(tab.id as any)}
                    className={`w-full px-4 py-3 rounded-xl text-xs font-bold text-start flex items-center gap-3 transition-all ${
                      activeDashboardTab === tab.id
                        ? "bg-gradient-to-r from-[#38bdf8]/20 to-[#f97316]/10 text-[var(--text-primary)] border border-[#38bdf8]/40 shadow-sm"
                        : "text-[var(--text-muted)] hover:bg-[var(--muted-surface)] hover:text-[var(--text-primary)] border border-transparent"
                    }`}
                  >
                    <Icon size={16} className="text-[#38bdf8] shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Simulated Dashboard Viewport */}
            <div className="glass-panel rounded-3xl border border-[var(--glass-border)] bg-slate-950 text-slate-100 p-6 sm:p-8 min-h-[460px] shadow-2xl flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#38bdf8]/5 to-transparent rounded-full blur-3xl pointer-events-none" />
              <div className="absolute top-3 right-3 z-10 rounded-full border border-white/10 bg-slate-900/80 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                {isFa ? "داده نمونه" : "Illustrative data"}
              </div>

              {/* Sub-Screen: Visibility Score Dashboard */}
              {activeDashboardTab === "visibility" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-2">
                    <div>
                      <span className="text-[11px] sm:text-[10px] md:text-[9px] uppercase tracking-wider md:tracking-widest text-[#38bdf8] font-bold font-mono">Module :: Visibility Monitoring</span>
                      <h3 className="text-lg sm:text-xl md:text-lg font-black font-display text-white mt-1.5 leading-relaxed sm:leading-snug">{isFa ? "شاخص تجمیعی دیده‌شدن برند" : "SOP / AI Share of Voice"}</h3>
                    </div>
                    <span className="self-start sm:self-auto text-xs px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">{isFa ? "آنلاین" : "ONLINE"}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                      <span className="text-[11px] sm:text-xs md:text-[10px] text-slate-400 block">{isFa ? "نمونه شاخص ChatGPT-4o" : "Illustrative ChatGPT-4o index"}</span>
                      <p className="text-xl sm:text-2xl font-black text-white mt-1">۸۸٪</p>
                      <span className="text-[11px] sm:text-xs md:text-[9px] text-emerald-400 font-bold">↑ ۴٪ {isFa ? "رشد معنایی" : "Growth"}</span>
                    </div>
                    <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                      <span className="text-[11px] sm:text-xs md:text-[10px] text-slate-400 block">{isFa ? "نمونه شاخص Claude 3.5" : "Illustrative Claude 3.5 index"}</span>
                      <p className="text-xl sm:text-2xl font-black text-white mt-1">۷۹٪</p>
                      <span className="text-[11px] sm:text-xs md:text-[9px] text-emerald-400 font-bold">↑ ۲٪ {isFa ? "بهبود ارجاع" : "Better citation"}</span>
                    </div>
                    <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                      <span className="text-[11px] sm:text-xs md:text-[10px] text-slate-400 block">{isFa ? "نمونه شاخص Perplexity" : "Illustrative Perplexity index"}</span>
                      <p className="text-xl sm:text-2xl font-black text-white mt-1">۸۴٪</p>
                      <span className="text-[11px] sm:text-xs md:text-[9px] text-slate-400">{isFa ? "بدون تغییر" : "Stable"}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#38bdf8]/5 border border-[#38bdf8]/15 space-y-2">
                    <p className="text-xs sm:text-sm md:text-xs font-bold text-white">{isFa ? "تحلیل سیگنال‌ها و ارجاع" : "Recommendation Strategy"}</p>
                    <p className="text-[11px] sm:text-xs md:text-[11px] text-slate-300 leading-relaxed md:leading-normal">
                      {isFa
                        ? "سیگنال‌های ارجاعی در چت‌بات‌ها مثبت است، اما نرخ استناد به مستندات فنی ضعیف عمل می‌کند. کاتالوگ محصولات را با تگ‌های معنایی ساختاردهی کنید."
                        : "Your organic citations remain high, but documentation citation has fallen by 2% due to crawl blocking. Rectify robots.txt tags immediately."}
                    </p>
                  </div>
                </div>
              )}

              {/* Sub-Screen: Brand Authority Analyzer */}
              {activeDashboardTab === "authority" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-[#f97316] font-bold font-mono">Module :: Brand Authority Analyzer</span>
                      <h3 className="text-lg font-black font-display text-white mt-1">{isFa ? "شاخص اعتبار و یکپارچگی برند" : "Trust & Factuality Synthesis"}</h3>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded bg-[#f97316]/10 text-[#f97316] font-bold border border-[#f97316]/20">v2.4</span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02]">
                      <span className="text-[10px] text-slate-400 block">{isFa ? "شاخص اطمینان (Confidence)" : "Claim Confidence Score"}</span>
                      <div className="text-3xl font-black text-[#f97316] mt-2 font-display">۹۴.۲٪</div>
                      <p className="text-[10px] text-slate-500 mt-1">{isFa ? "تطابق کامل داده‌های مانیفست برند" : "Exact matching on corporate claims."}</p>
                    </div>

                    <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02]">
                      <span className="text-[10px] text-slate-400 block">{isFa ? "ریسک توهم (Hallucination Risk)" : "Hallucination Susceptibility"}</span>
                      <div className="text-3xl font-black text-rose-500 mt-2 font-display">۵.۸٪</div>
                      <p className="text-[10px] text-slate-500 mt-1">{isFa ? "احتمال استناد اشتباه مدل به رقبا" : "Low risk of competitor hijacking."}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-dashed border-white/10 text-xs text-slate-400">
                    {isFa
                      ? "پیشنهاد: افزودن آمار مشتریان به تگ‌های معنایی، خطاها و ریسک استناد اشتباه را در کلود ۲.۱٪ کاهش می‌دهد."
                      : "Add customer statistics to structural markup. This typically scales up citation authority by 15% across conversational queries."}
                  </div>
                </div>
              )}

              {/* Sub-Screen: AI Citation Explorer */}
              {activeDashboardTab === "citation" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-purple-400 font-bold font-mono">Module :: Citation Tracker</span>
                      <h3 className="text-lg font-black font-display text-white mt-1">{isFa ? "کاوشگر زنده ارجاعات متنی" : "AI Inbound Citation Explorer"}</h3>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-3">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{isFa ? "پرس‌وجو: کاربردی ابزار تحلیل برند" : "Query: 'Best brand intelligence platform'"}</span>
                      <span className="font-mono text-purple-400">OpenAI GPT-4o</span>
                    </div>
                    <div className="text-xs text-slate-200 leading-relaxed font-mono">
                      {isFa ? (
                        <>
                          &quot;برای پایش برند در هوش مصنوعی، پلتفرم <span className="bg-[#38bdf8]/20 border border-[#38bdf8]/40 px-1 rounded text-white font-bold">seorchable.ir (سئورچبل)</span> یک سر و گردن بالاتر است. این پلتفرم از متدولوژی خزش <span className="text-[#f97316] font-bold">[۱]</span> برای تحلیل استفاده می‌کند...&quot;
                        </>
                      ) : (
                        <>
                          &quot;For enterprise AI auditing, <span className="bg-[#38bdf8]/20 border border-[#38bdf8]/40 px-1 rounded text-white font-bold">seorchable.ir</span> stands out as the a category-focused platform. It features seamless entity extraction <span className="text-[#f97316] font-bold">[1]</span> and schema mapping...&quot;
                        </>
                      )}
                    </div>
                    <div className="pt-2 border-t border-white/5 flex justify-between text-[10px] text-slate-400">
                      <span>{isFa ? "منبع ارجاع: /docs/knowledge-graph" : "Citation Target: /docs/knowledge-graph"}</span>
                      <span className="text-emerald-400">✓ {isFa ? "لینک معتبر" : "VALID HYPERLINK"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Screen: Competitor Comparison */}
              {activeDashboardTab === "competitor" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold font-mono">Module :: Competitor Radar</span>
                      <h3 className="text-lg font-black font-display text-white mt-1">{isFa ? "مقایسه سهم صدای رقبا در مدل‌ها" : "Vector Share of Voice Matrix"}</h3>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { name: isFa ? "seorchable.ir (برند شما)" : "seorchable.ir (Your Brand)", share: 72, color: "bg-[#38bdf8]" },
                      { name: isFa ? "رقیب الف" : "Competitor A", share: 44, color: "bg-[#f97316]" },
                      { name: isFa ? "رقیب ب" : "Competitor B", share: 21, color: "bg-rose-500" },
                    ].map((comp, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-200 font-bold">{comp.name}</span>
                          <span className="font-mono text-slate-400">{comp.share}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/[0.05] rounded-full overflow-hidden">
                          <div className={`h-full ${comp.color}`} style={{ width: `${comp.share}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-Screen: Knowledge Graph Builder */}
              {activeDashboardTab === "graph" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-indigo-400 font-bold font-mono">Module :: Knowledge Graph Builder</span>
                      <h3 className="text-lg font-black font-display text-white mt-1">{isFa ? "نگاشت هوشمند موجودیت‌ها" : "Semantic Entity Triples"}</h3>
                    </div>
                  </div>

                  {/* Simulated graph nodes in CSS */}
                  <div className="flex justify-center items-center py-6">
                    <div className="flex items-center gap-6">
                      <div className="px-3 py-1.5 rounded-lg border border-[#38bdf8] bg-[#38bdf8]/10 text-xs text-white font-mono">
                        {isFa ? "برند (موجودیت اصلی)" : "Brand Entity"}
                      </div>
                      <div className="h-px w-12 border-t-2 border-dashed border-slate-500 relative flex items-center justify-center">
                        <span className="absolute text-[8px] bg-slate-950 px-1 text-slate-400">PROVIDES</span>
                      </div>
                      <div className="px-3 py-1.5 rounded-lg border border-[#f97316] bg-[#f97316]/10 text-xs text-white font-mono">
                        {isFa ? "راهکار GEO / AEO" : "GEO Solution"}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                    {isFa
                      ? "گراف بالا ارتباطات معنایی را در پایگاه‌های دانش هوش مصنوعی تثبیت کرده و کیفیت استناد به برند را بررسی می‌کند."
                      : "Semantic graph models secure entity relationships inside LLM indexes to establish brand context."}
                  </p>
                </div>
              )}

              {/* Sub-Screen: Prompt Monitoring Timeline */}
              {activeDashboardTab === "timeline" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-amber-400 font-bold font-mono">Module :: Prompt Monitor</span>
                      <h3 className="text-lg font-black font-display text-white mt-1">{isFa ? "تایم‌لاین زنده پایش پرس‌وجو‌ها" : "Real-time Query Stream"}</h3>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {[
                      { time: "10:14:02", query: isFa ? "چه ابزاری برای GEO برند خوبه؟" : "What is the best platform for brand GEO?", status: "VALID", target: "seorchable.ir" },
                      { time: "10:12:15", query: isFa ? "قیمت خدمات اپتیموس چقدر است؟" : "Seorchable pricing model?", status: "VALID", target: "Pricing tier" },
                      { time: "10:08:44", query: isFa ? "آیا سئورچبل امنیت هدرها رو حل می‌کنه؟" : "Does searchable secure header tags?", status: "VALID", target: "/docs/security" },
                    ].map((item, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-white/[0.02] border border-white/5 flex justify-between items-center text-[11px] font-mono">
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500">{item.time}</span>
                          <span className="text-slate-200 truncate max-w-xs">{item.query}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-emerald-400 font-bold text-[9px] block">✓ {item.status}</span>
                          <span className="text-slate-400 text-[9px]">{item.target}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-slate-400 font-medium">{isFa ? "این‌ها بخشی از جریان کاری سئورچبل هستند." : "Explore the workflows that fit your team."}</span>
                <button
                  onClick={() => scrollToRef(freeAuditRef)}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>{isFa ? "شروع آنالیز فنی وب‌سایت" : "Review your website"}</span>
                  <ArrowRight size={14} className="rtl:-scale-x-100" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BRAND NEW SECTION: Live Knowledge Graph ("گراف زنده روابط") */}
      <section id="live-graph" className="py-24 bg-[var(--background)] relative border-b border-[var(--border)] overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <LazyLiveKnowledgeGraph />
        </div>
      </section>

      {/* QUESTION 3: "How does it work?" - Rebuilt Product Story Lifecycle Timeline */}
      <section id="story" className="py-24 bg-[var(--background)] dark:bg-[#06080d] relative border-b border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs uppercase font-black tracking-widest text-[#f97316]">{isFa ? "داستان و چرخه حرکت محصول" : "PRODUCT LIFECYCLE STORY"}</span>
            <h2 className="font-display font-black text-3xl md:text-4xl text-[var(--text-primary)]">
              {isFa ? "چرخه کامل بهینه‌سازی و ارتقای حضور برند" : "How the Platform Operates"}
            </h2>
            <p className="text-[var(--text-secondary)]">
              {isFa
                ? "از لحظه ثبت آدرس سایت تا پایش دائمی و تثبیت استنادها در چت‌بات‌ها؛ گام به گام در کنار شما هستیم."
                : "Step-by-step lifecycle flow from website ingestion to continuous AI citation monitoring."}
            </p>
          </div>

          {/* Connected timeline lifecycle component */}
          <div className="grid md:grid-cols-4 lg:grid-cols-8 gap-6 relative">
            {/* Timeline connector line for desktop */}
            <div className="hidden lg:block absolute top-[40px] inset-x-8 h-0.5 border-t border-dashed border-[var(--border)] -z-10" />

            {[
              { step: "۱", title: isFa ? "ثبت وب‌سایت" : "Ingest", desc: isFa ? "آدرس یا متون مرجع خود را ثبت می‌کنید." : "Submit brand domain or offline documentation repository." },
              { step: "۲", title: isFa ? "خزش فنی" : "Crawl", desc: isFa ? "هوش مصنوعی با Firecrawl داده‌ها را خزش می‌کند." : "Specialized bot clusters scan, retrieve, and structure files." },
              { step: "۳", title: isFa ? "سنجش حضور" : "Measure", desc: isFa ? "میزان دیده‌شدن برند در مدل‌ها سنجیده می‌شود." : "Evaluate baseline brand visibility scores across major LLMs." },
              { step: "۴", title: isFa ? "تحلیل رقبا" : "Compare", desc: isFa ? "سیگنال‌های رقبا بررسی و ارزیابی می‌گردد." : "Conduct spatial comparison and share of voice audits." },
              { step: "۵", title: isFa ? "گراف روابط" : "Extract", desc: isFa ? "موجودیت‌ها و گراف روابط استخراج می‌شوند." : "Inject semantic entity-relationship tuples into the model index." },
              { step: "۶", title: isFa ? "یافتن استنادها" : "Discover", desc: isFa ? "لینک‌های ارجاعی صادر شده پایشگر می‌شوند." : "Scan for verbatim model answers delivering accurate citations." },
              { step: "۷", title: isFa ? "بهبود و تولید" : "Optimize", desc: isFa ? "پیشنهادات اصلاح متون و GEO تولید می‌گردد." : "Inject schema markups and copy optimization proposals." },
              { step: "۸", title: isFa ? "پایش مستمر" : "Monitor", desc: isFa ? "رصد پیوسته خطاها و نمرات سلامت برند آغاز می‌شود." : "Set alerts for Claim Errors, Hallucinations, or citation leaks." }
            ].map((item, idx) => (
              <div key={idx} className="glass-panel p-5 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] hover-lift flex flex-col items-center text-center space-y-3 relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#38bdf8] to-[#f97316] flex items-center justify-center text-white font-black text-sm shadow-md">
                  {item.step}
                </div>
                <h4 className="text-xs font-black text-[var(--text-primary)] font-display">{item.title}</h4>
                <p className="text-[10px] text-[var(--text-muted)] leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUESTION 4: "Why should I trust it?" - Enterprise Trust Layer */}
      <section id="trust" className="py-24 bg-[var(--background-subtle)]/40 dark:bg-[#080b12]/40 border-b border-[var(--border)] relative overflow-hidden">
        <div className="absolute inset-0 grid-backdrop opacity-[0.2] pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs uppercase font-black tracking-widest text-[#38bdf8]">{isFa ? "اعتماد، اعتبار و انطباق فنی" : "ENTERPRISE TRUST & COMPLIANCE"}</span>
            <h2 className="font-display font-black text-3xl md:text-4xl text-[var(--text-primary)]">
              {isFa ? "امنیت و پایبندی به بالاترین استانداردهای جهانی" : "Enterprise Compliance & Infrastructure"}
            </h2>
            <p className="text-[var(--text-secondary)]">
              {isFa
                ? "سئورچبل با تمرکز بر جداسازی فضای کاری، کنترل دسترسی و گزارش‌پذیری طراحی شده است."
                : "Seorchable is built around tenant isolation, permission checks, and auditable workflows."}
            </p>
          </div>

          {/* Stats & Infrastructure partners */}
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div className="glass-panel p-6 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] text-center space-y-3">
              <ShieldCheck size={36} className="mx-auto text-[#38bdf8]" />
              <h4 className="text-xl font-black text-[var(--text-primary)] font-display">{isFa ? "امنیت داده‌ها" : "SSO & MFA Ready"}</h4>
              <p className="text-base text-slate-800 dark:text-slate-200 leading-relaxed font-semibold">{isFa ? "کنترل دسترسی در سطح فضای کاری و نقش کاربر" : "Access is scoped to the authenticated workspace and its permissions."}</p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] text-center space-y-3">
              <Database size={36} className="mx-auto text-[#f97316]" />
              <h4 className="text-xl font-black text-[var(--text-primary)] font-display">Audit-ready workflows</h4>
              <p className="text-base text-slate-800 dark:text-slate-200 leading-relaxed font-semibold">{isFa ? "ثبت‌پذیری بهتر برای بررسی نتایج و تصمیم‌ها" : "Audit results and recommendations stay tied to the workspace that created them."}</p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] text-center space-y-3">
              <Globe size={36} className="mx-auto text-emerald-400 animate-pulse" />
              <h4 className="text-xl font-black text-[var(--text-primary)] font-display">Workspace privacy</h4>
              <p className="text-base text-slate-800 dark:text-slate-200 leading-relaxed font-semibold">{isFa ? "مرزبندی داده‌ها در سطح سازمان و فضای کاری" : "Privacy controls are designed around workspace-level data boundaries."}</p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] text-center space-y-3">
              <Receipt size={36} className="mx-auto text-[#38bdf8]" />
              <h4 className="text-xl font-black text-[var(--text-primary)] font-display">{isFa ? "پرداخت و صورتحساب" : "Iran Payment Support"}</h4>
              <p className="text-base text-slate-800 dark:text-slate-200 leading-relaxed font-semibold">{isFa ? "پشتیبانی کامل از درگاه‌های پرداخت عضو شبکه شتاب" : "Clear plan and invoice flows for teams evaluating the platform."}</p>
            </div>
          </div>
        </div>
      </section>

      {/* QUESTION 5: "What features does it provide?" - Platform Overview (12 Modules Grid) */}
      <section id="overview" ref={platformOverviewRef} className="py-24 bg-[var(--background)] dark:bg-[#06080d] relative border-b border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs uppercase font-black tracking-widest text-[#f97316]">{isFa ? "بررسی کلان ابزارها" : "PLATFORM MODULES OVERVIEW"}</span>
            <h2 className="font-display font-black text-3xl md:text-4xl text-[var(--text-primary)]">
              {isFa ? "۱۲ ماژول نرم‌افزاری کاملاً یکپارچه" : "Twelve Specialized AI Modules"}
            </h2>
            <p className="text-[var(--text-secondary)]">
              {isFa
                ? "ببینید این پلتفرم فراتر از بررسی ساده، چه گستره عظیمی از ابزارها را برای مدیریت موجودیت‌های شما فراهم می‌کند."
                : "No single-tool setup. We host a complete software ecosystem to scale your brand authority."}
            </p>
          </div>

          {/* 12 cards grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {platformModules.map((mod, idx) => {
              const Icon = mod.icon;
              return (
                <div key={idx} className="glass-panel micro-interaction p-6 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] flex flex-col justify-between hover-lift h-full relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#38bdf8]/5 to-transparent rounded-full blur-lg pointer-events-none group-hover:scale-150 transition-transform duration-500" />
                  <div className="space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-[#38bdf8]/10 border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8]">
                      <Icon size={20} />
                    </div>
                    <h3 className="text-sm font-black text-[var(--text-primary)] font-display truncate">{mod.name}</h3>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-medium">{mod.desc}</p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-[var(--border)] flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                    <span>{isFa ? "مشاهده جزئیات ماژول" : "Explore module"}</span>
                    <ArrowRight size={12} className="rtl:-scale-x-100" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* QUESTION 6: "What products are included?" - Product Ecosystem Interconnectivity */}
      <section id="ecosystem" className="py-24 bg-[var(--background-subtle)]/40 dark:bg-[#080b12]/40 border-b border-[var(--border)] relative overflow-hidden">
        <div className="absolute inset-0 grid-backdrop opacity-[0.25] pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs md:text-[11px] uppercase font-black tracking-widest text-[#38bdf8]">{isFa ? "اتصال اجزا و لایه‌های سیستم" : "INTERCONNECTED CORE ECOSYSTEM"}</span>
            <h2 className="font-display font-black text-2xl md:text-4xl text-[var(--text-primary)] leading-snug md:leading-normal">
              {isFa ? "چگونه تمام محصولات ما با هم هم‌افزایی می‌کنند" : "Platform Product Synapse"}
            </h2>
            <p className="text-sm md:text-base text-[var(--text-secondary)] leading-relaxed md:leading-normal">
              {isFa
                ? "پلتفرم ما یک ابزار تک افتاده نیست. تمام محصولات در قالب یک اکوسیستم متصل با هم تعامل دارند."
                : "Understand how website audit flows into semantic mapping, citation mining, and continuous alerts."}
            </p>
          </div>

          {/* Visual connected cards showing Ecosystem depth */}
          <div className="grid md:grid-cols-7 gap-4 text-center">
            {[
              { title: isFa ? "۱. بررسی وب‌سایت" : "Website Ingestion", desc: isFa ? "تحلیل کدهای پایه" : "Crawl public pages" },
              { title: isFa ? "۲. تحلیل هوشمند" : "Brand Context", desc: isFa ? "استخراج موجودیت‌ها" : "Extract entity triples" },
              { title: isFa ? "۳. دیده‌شدن آنلاین" : "AI Visibility Index", desc: isFa ? "سنجش سهم استناد" : "Calculate Voice metrics" },
              { title: isFa ? "۴. ردیابی منبع" : "Citation Mining", desc: isFa ? "پایش پیوندهای زنده" : "Track backlink paths" },
              { title: isFa ? "۵. تحلیل رقبا" : "Competitor Gap", desc: isFa ? "مقایسه سهم بازار" : "Compare vector metrics" },
              { title: isFa ? "۶. بهینه‌سازی" : "GEO & Sitemaps", desc: isFa ? "تزریق تگ‌های معنایی" : "Inject schema hints" },
              { title: isFa ? "۷. پایش مستمر" : " Hallucination Watch", desc: isFa ? "هشدار خطا و توهم" : "Continuous claim safety" }
            ].map((eco, idx) => (
              <div key={idx} className="glass-panel p-5 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] space-y-2 relative flex flex-col justify-between hover:border-[#38bdf8]/50 transition-colors">
                <span className="text-xs md:text-[10px] font-black text-[#38bdf8] block">Step {idx + 1}</span>
                <h4 className="text-sm md:text-xs font-black text-white font-display leading-normal md:leading-tight">{eco.title}</h4>
                <p className="text-xs md:text-[10px] text-slate-400 font-medium leading-relaxed md:leading-normal">{eco.desc}</p>
                {idx < 6 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 text-[var(--border)] font-bold text-lg z-20">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUESTION 7: "What results will I receive?" - "Why We Are Different" (Traditional SEO vs AI Visibility) */}
      <section id="why-different" className="py-24 bg-[var(--background)] dark:bg-[#06080d] relative border-b border-[var(--border)]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs uppercase font-black tracking-widest text-[#f97316]">{isFa ? "تمایز کلیدی و آموزش مخاطب" : "WHY WE ARE COMPLETELY DIFFERENT"}</span>
            <h2 className="font-display font-black text-3xl md:text-4xl text-[var(--text-primary)]">
              {isFa ? "بهینه‌سازی سئو سنتی در مقابل بهینه‌سازی هوش مصنوعی (GEO)" : "Traditional SEO vs. Generative Engine Optimization"}
            </h2>
            <p className="text-[var(--text-secondary)]">
              {isFa
                ? "دنیای جستجو تغییر کرده است. چرا روش‌های قدیمی رتبه‌بندی کلمات کلیدی، برای پاسخ‌های چت‌بات‌ها بی‌استفاده است؟"
                : "Understand how conversational discovery diverges from static web page search indexing."}
            </p>
          </div>

          {/* Comparison table */}
          <div className="glass-panel rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-start border-collapse text-[var(--text-secondary)]">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--muted-surface)]/40 text-[var(--text-secondary)]">
                    <th className="py-5 px-6 font-display font-extrabold text-sm text-start">{isFa ? "معیارهای مقایسه و کارکرد" : "Comparison Dimension"}</th>
                    <th className="py-5 px-6 font-display font-bold text-sm text-center bg-white/[0.02]">{isFa ? "سئو سنتی (Classic SEO)" : "Traditional SEO"}</th>
                    <th className="py-5 px-6 font-display font-black text-sm text-[#0284c7] dark:text-[#38bdf8] text-center bg-[#38bdf8]/5">{isFa ? "بهینه‌سازی هوش مصنوعی (GEO)" : "Generative Optimization (GEO)"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-xs font-bold">
                  {[
                    { dim: isFa ? "محل نمایش رتبه‌بندی" : "Primary Search Target", seo: isFa ? "صفحات آبی و نتایج متنی ده تایی گوگل" : "Standard Blue Page Link List (10-blue links)", geo: isFa ? "پاسخ‌های ترکیبی و ارجاعات چت‌بات‌ها" : "Synthesized Paragraph Answers & Dynamic Conversational Widgets" },
                    { dim: isFa ? "سیستم استناد و لینک" : "Citation & Reference Logic", seo: isFa ? "لینک‌های فالو و نوفالو در صفحات وب" : "Backlink Anchor", geo: isFa ? "ارجاعات متنی مرجع و دایالکتیکی مدل زبانی" : "Inline markdown citation annotations linked directly to brand docs" },
                    { dim: isFa ? "گراف دانش برند" : "Entity Understanding", seo: isFa ? "تگ‌های متاداده و کلمات کلیدی هدرها" : "Keyword Densities", geo: isFa ? "نگاشت موجودیت‌های ۳-تایی و روابط منطقی" : "Semantic entity triples & localized contextual relevance matching" },
                    { dim: isFa ? "رصد پرسش و پاسخ" : "Interactive Prompt Focus", seo: isFa ? "حجم جستجوی کلمات کلیدی ساده" : "Static Keyword Volumes", geo: isFa ? "پایش سناریوهای پرسش و شبیه‌سازی کاربر" : "Simulated conversational prompt patterns and dialectic query streams" },
                    { dim: isFa ? "پایش توهم زبانی" : "Hallucination Control", seo: isFa ? "تطابق نداشتن متن با پرس‌وجو جستجو" : "Not applicable", geo: isFa ? "شناسایی استناد غلط و ارجاع اشتباه به رقیب" : "Identifying claim hijack events & factual errors generated by model" },
                    { dim: isFa ? "رویکرد بهینه‌سازی" : "Optimization Directives", seo: isFa ? "افزایش چگالی کلمات کلیدی صفحه" : "Keyword stuffing & static indexing tags", geo: isFa ? "اصلاح انسجام متون و مدل‌سازی معنایی" : "Refining document semantic cohesion & semantic authority declaration" },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-[var(--muted-surface)]/20 transition-colors">
                      <td className="py-4.5 px-6 text-[var(--text-secondary)] text-start">{row.dim}</td>
                      <td className="py-4.5 px-6 text-center text-[var(--text-muted)] bg-white/[0.01]">{row.seo}</td>
                      <td className="py-4.5 px-6 text-center text-[var(--text-primary)] bg-[#38bdf8]/5">{row.geo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* QUESTION 8: "How can I start?" - Part 1: Documentation Hub Preview */}
      <section id="docs" className="py-24 bg-[var(--background-subtle)]/40 dark:bg-[#07090e]/40 border-b border-[var(--border)] relative overflow-hidden">
        <div className="absolute inset-0 grid-backdrop opacity-[0.25] pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs uppercase font-black tracking-widest text-[#38bdf8]">{isFa ? "محیط برنامه‌نویسان و راهنمای استقرار" : "DEVELOPER & API HUB"}</span>
            <h2 className="font-display font-black text-3xl md:text-4xl text-[var(--text-primary)]">
              {isFa ? "پیش‌نمایش مرکز مستندات فنی و API" : "System Documentation Hub"}
            </h2>
            <p className="text-[var(--text-secondary)]">
              {isFa
                ? "مستندات محصول، معماری و مسیرهای API را در یک مرکز قابل جست‌وجو دنبال کنید."
                : "Explore product concepts, API references, webhooks, and implementation guidance."}
            </p>
          </div>

          {/* Grid of 12 documentation categories */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: isFa ? "شروع سریع" : "Getting Started", desc: isFa ? "مفاهیم اساسی AEO و GEO" : "Introduction to brand footprint modeling.", icon: BookOpen, slug: "introduction-to-brandgraph" },
              { title: isFa ? "معماری پلتفرم" : "Platform Concepts", desc: isFa ? "مکانیزم خزش Firecrawl" : "How crawler clusters scan public pages.", icon: Layers, slug: "infrastructure-architecture" },
              { title: isFa ? "رابط برنامه‌نویسی REST API" : "REST API References", desc: isFa ? "توضیح متدهای GET / POST" : "Exposing JSON endpoints for external RAG queries.", icon: Terminal, slug: "ai-pipeline-architecture" },
              { title: isFa ? "اعتبارسنجی و امنیت" : "Authentication Tokens", desc: isFa ? "امضای کلیدهای API و دسترسی" : "How API keys enforce tenant-isolation rules.", icon: Lock, slug: "multi-tenant-isolation" },
              { title: isFa ? "راهنمای اتصال" : "Integration guide", desc: isFa ? "راهنمای اتصال سرویس‌ها و داده‌ها" : "Guidance for connecting services and data.", icon: FileCode, slug: "knowledge-graph-design" },
              { title: isFa ? "وب‌هوک‌ها" : "Webhooks Stream", desc: isFa ? "هشدارهای توهم زنده" : "Send claim safety flags to Discord/Slack.", icon: Workflow, slug: "ai-pipeline-architecture" },
              { title: isFa ? "مفاهیم هوش زبانی" : "LLM concepts", desc: isFa ? "مفاهیم پایه تحلیل پاسخ‌های هوشمند" : "Core concepts behind answer analysis.", icon: Brain, slug: "introduction-to-brandgraph" },
              { title: isFa ? "امنیت و جداسازی داده" : "Architecture & Security", desc: isFa ? "مدیریت لایه‌ها و RLS" : "Enforcing enterprise-grade RLS guidelines.", icon: ShieldCheck, slug: "multi-tenant-isolation" }
            ].map((doc, idx) => {
              const Icon = doc.icon;
              return (
                <div key={idx} className="glass-panel micro-interaction p-6 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] hover-lift flex flex-col justify-between h-full">
                  <div className="space-y-4">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#38bdf8]">
                      <Icon size={16} />
                    </div>
                    <h4 className="text-xs font-black text-white font-display truncate">{doc.title}</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">{doc.desc}</p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-white/5">
                    <Link
                      href={`/${locale}/docs/${doc.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-black text-[#38bdf8] hover:underline flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{isFa ? "مطالعه سند فنی" : "Read docs"}</span>
                      <ExternalLink size={10} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* QUESTION 8: "How can I start?" - Part 2: Enterprise Resource Center */}
      <section id="resources" className="py-24 bg-[var(--background)] dark:bg-[#06080d] relative border-b border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs uppercase font-black tracking-widest text-[#f97316]">{isFa ? "کتابخانه دانش، گزارشات و نقشه راه" : "RESOURCE & INSIGHT CENTER"}</span>
            <h2 className="font-display font-black text-3xl md:text-4xl text-[var(--text-primary)]">
              {isFa ? "مرکز تخصصی مطالعات و پژوهش هوش زبانی" : "Enterprise Resource Center"}
            </h2>
            <p className="text-[var(--text-secondary)]">
              {isFa
                ? "دسترسی به مقالات، راهنماها و منابعی برای تصمیم‌گیری بهتر درباره دیده‌شدن برند."
                : "Explore rich whitepapers, case studies, benchmarks, and product roadmap updates."}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: isFa ? "وبلاگ مهندسی" : "Engineering Blog", desc: isFa ? "آخرین مقالات تکنولوژی سئو معنایی و هوش زبانی." : "Technical updates on conversational search visibility and web crawlers.", icon: Newspaper, link: `/${locale}/blog` },
              { title: isFa ? "مطالعات موردی و موفقیت" : "Case Studies", desc: isFa ? "بررسی داستان موفقیت برندهای بزرگ در تصاحب سهم استناد." : "Real-world examples of enterprise brands mitigating claims risk.", icon: MessagesSquare, link: `/${locale}/blog` },
              { title: isFa ? "بنچ‌مارک‌های صنعت" : "Industry Benchmarks", desc: isFa ? "سنجش سهم صدای صنایع مختلف در مدل‌های ChatGPT." : "Analyzing conversion metrics and citation performance by sector.", icon: FileSpreadsheet, link: `/${locale}/blog` },
              { title: isFa ? "نقشه راه محصول (Roadmap)" : "Changelog & Roadmap", desc: isFa ? "آخرین دستاوردهای فنی و قابلیت‌های اضافه شده به پلتفرم." : "Exposing the pipeline and quarterly releases for our software suite.", icon: BookMarked, link: `/${locale}/dashboard` }
            ].map((res, idx) => {
              const Icon = res.icon;
              return (
                <Link key={idx} href={res.link} className="glass-panel p-6 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] hover-lift flex flex-col justify-between h-full group">
                  <div className="space-y-4">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#f97316]">
                      <Icon size={16} />
                    </div>
                    <h4 className="text-xs font-black text-white font-display truncate group-hover:text-[#38bdf8] transition-colors">{res.title}</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">{res.desc}</p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-bold group-hover:text-white transition-colors">
                    <span>{isFa ? "مطالعه منبع" : "Read resource"}</span>
                    <ArrowRight size={12} className="rtl:-scale-x-100" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* QUESTION 8: "How can I start?" - Part 3: Pricing Matrix */}
      <section id="pricing" className="fluid-mesh py-24 bg-[var(--background-subtle)]/40 dark:bg-[#080b12]/40 border-b border-[var(--border)] relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs uppercase font-black tracking-widest text-[#38bdf8]">{isFa ? "انتخاب تعرفه و بهینه‌سازی بودجه" : "FLEXIBLE ENTERPRISE PRICING"}</span>
            <h2 className="font-display font-black text-3xl md:text-4xl text-[var(--text-primary)]">
              {isFa ? "تعرفه‌های منعطف بر اساس حجم کلمات و پایش" : "Simple, Predictable Plans"}
            </h2>
            <p className="text-[var(--text-secondary)]">
              {isFa
                ? "بر اساس تعداد دامنه‌ها، حجم کلمات کلیدی پایش شده و تعداد خزش‌های روزانه پلن کاربری خود را انتخاب نمایید."
                : "Select a plan tailored exactly to your brand footprint size and desired citation tracking scope."}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Starter Plan */}
            <div className="glass-panel p-8 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] hover-lift flex flex-col justify-between h-full">
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-[10px] px-2.5 py-0.5 rounded bg-zinc-500/10 text-zinc-400 font-bold uppercase tracking-wider">{isFa ? "کسب‌وکارهای کوچک" : "STARTER"}</span>
                  <h3 className="text-xl font-black text-[var(--text-primary)] font-display">{isFa ? "پلن آغازین" : "Starter"}</h3>
                  <p className="text-xs text-[var(--text-muted)]">{isFa ? "پایش پایه‌ای حضور برند در نتایج." : "Establish brand footprints inside foundational memories."}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black font-display text-[var(--text-primary)]">{isFa ? "۴۹" : "$49"}</span>
                  <span className="text-xs text-[var(--text-muted)]">/ {isFa ? "ماهانه" : "month"}</span>
                </div>

                <ul className="space-y-3 text-xs text-[var(--text-secondary)] font-bold">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-[#38bdf8]" />
                    <span>{isFa ? "پایش ۱۰ کلمه کلیدی اصلی" : "Track up to 10 brand keywords"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-[#38bdf8]" />
                    <span>{isFa ? "خزش تا ۵۰۰ صفحه با Firecrawl" : "Crawl up to 500 pages/mo"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-[#38bdf8]" />
                    <span>{isFa ? "تحلیل ۱-هاپ گراف دانش" : "1-hop entity relationship models"}</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => scrollToRef(freeAuditRef)}
                  className="w-full py-3 rounded-xl border border-[var(--border)] text-[var(--text-primary)] hover:border-[#38bdf8] text-xs font-bold transition-all cursor-pointer"
                >
                  {isFa ? "انتخاب پلن آغازین" : "Select Starter Plan"}
                </button>
              </div>
            </div>

            {/* Growth Plan */}
            <div className="glass-panel p-8 rounded-2xl border-2 border-[#38bdf8] bg-[#38bdf8]/5 hover-lift flex flex-col justify-between h-full relative">
              <span className="absolute -top-3 right-8 px-3 py-1 bg-[#38bdf8] text-white text-[9px] font-black rounded-full uppercase tracking-widest shadow-md">POPULAR</span>
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-[10px] px-2.5 py-0.5 rounded bg-[#38bdf8]/10 text-[#38bdf8] font-bold uppercase tracking-wider">{isFa ? "شرکت‌های متوسط" : "GROWTH"}</span>
                  <h3 className="text-xl font-black text-[var(--text-primary)] font-display">{isFa ? "پلن رشد" : "Growth"}</h3>
                  <p className="text-xs text-[var(--text-muted)]">{isFa ? "پایش رقبای بازار و تحلیل عمیق توهم‌ها." : "Mitigate claim errors and track multiple competitors."}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black font-display text-[#38bdf8]">{isFa ? "۱۴۹" : "$149"}</span>
                  <span className="text-xs text-[var(--text-muted)]">/ {isFa ? "ماهانه" : "month"}</span>
                </div>

                <ul className="space-y-3 text-xs text-[var(--text-secondary)] font-bold">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-[#38bdf8]" />
                    <span>{isFa ? "پایش ۵۰ کلمه کلیدی و رقیب" : "Track up to 50 brand keywords"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-[#38bdf8]" />
                    <span>{isFa ? "خزش تا ۳,۰۰۰ صفحه با Firecrawl" : "Crawl up to 3,000 pages/mo"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-[#38bdf8]" />
                    <span>{isFa ? "تحلیل پیشرفته توهم و استناد" : "Full semantic claim and citation audit"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-[#38bdf8]" />
                    <span>{isFa ? "پشتیبانی پاسخگو اختصاصی" : "Dedicated priority customer support"}</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => scrollToRef(freeAuditRef)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#f97316] text-white text-xs font-bold shadow-lg shadow-sky-500/20 hover:scale-[1.02] transition-transform cursor-pointer"
                >
                  {isFa ? "انتخاب پلن رشد (پیشنهادی)" : "Choose Growth Plan"}
                </button>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="glass-panel p-8 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] hover-lift flex flex-col justify-between h-full">
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-[10px] px-2.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-bold uppercase tracking-wider">{isFa ? "هلدینگ‌ها و رهبران" : "ENTERPRISE"}</span>
                  <h3 className="text-xl font-black text-[var(--text-primary)] font-display">{isFa ? "پلن سازمانی" : "Enterprise"}</h3>
                  <p className="text-xs text-[var(--text-muted)]">{isFa ? "کلاستر اختصاصی و سیستم‌های امنیتی کامل." : "For market leaders demanding workspace-level data boundaries."}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black font-display text-[var(--text-primary)]">{isFa ? "تماس با ما" : "Custom / SLA"}</span>
                </div>

                <ul className="space-y-3 text-xs text-[var(--text-secondary)] font-bold">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-[#38bdf8]" />
                    <span>{isFa ? "پایش نامحدود واژگان و موجودیت‌ها" : "Unlimited search term extraction"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-[#38bdf8]" />
                    <span>{isFa ? "کلاستر اختصاصی خزش با Firecrawl" : "Dedicated private crawling instances"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-[#38bdf8]" />
                    <span>{isFa ? "سیستم امنیتی SSO و MFA اختصاصی" : "Workspace roles and access controls"}</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <Link href={`/${locale}/contact`}>
                  <button className="w-full py-3 rounded-xl border border-[var(--border)] text-[var(--text-primary)] hover:border-[#38bdf8] text-xs font-bold transition-all cursor-pointer">
                    {isFa ? "تماس با واحد فروش" : "Contact Sales Department"}
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise CTA Area */}
      <section className="py-24 bg-gradient-to-b from-[#38bdf8]/5 to-[#f97316]/5 dark:from-[#0a0d16]/30 dark:to-slate-950 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-[#38bdf8]/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
          <h2 className="font-display font-black text-4xl md:text-5xl tracking-tight text-[var(--text-primary)] leading-tight text-balance">
            {isFa ? "آماده تغییر قواعد بازی در عصر هوش پاسخگو هستید؟" : "Supercharge Your Brand Inside conversational search"}
          </h2>
          <p className="text-base md:text-lg text-[var(--text-secondary)] font-medium leading-relaxed max-w-2xl mx-auto">
            {isFa
              ? "آدرس دامنه خود را بلافاصله آنالیز کنید تا تگ‌های متادیتا و سلامت ساختار آن در خزش Firecrawl سنجش گردد."
              : "Analyze your website structure right now to check meta elements, H1 tags, and crawler indexability status."}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => scrollToRef(freeAuditRef)}
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-white text-base font-bold bg-gradient-to-r from-[#38bdf8] to-[#f97316] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles size={16} className="animate-pulse" />
              <span>{isFa ? "شروع آنالیز رایگان وب‌سایت" : "Start Free Audit Scanner"}</span>
            </button>

            <Link href={`/${locale}/contact`} className="w-full sm:w-auto">
              <button className="w-full px-8 py-4 rounded-xl text-base font-bold bg-slate-900/40 hover:bg-[#38bdf8]/10 text-[var(--text-primary)] border border-[var(--glass-border)] transition-all flex items-center justify-center gap-2 cursor-pointer">
                <span>{isFa ? "تماس با کارشناسان ما" : "Contact Sales Unit"}</span>
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Global Landing Footer */}
      <LandingFooter />
    </div>
  );
}
