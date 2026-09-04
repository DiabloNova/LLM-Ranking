"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import DashboardSidebar from "@/components/navigation/DashboardSidebar";
import DashboardTopbar from "@/components/navigation/DashboardTopbar";
import { HelpCircle, Mail, BookOpen, X } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { direction, language } = useTheme();
  const isRtl = language === "fa";

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // Load collapsed state from localStorage on mount (safe from hydration mismatches)
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(JSON.parse(saved));
    }
  }, []);

  const handleSetCollapsed = (val: boolean) => {
    setCollapsed(val);
    localStorage.setItem("sidebar-collapsed", JSON.stringify(val));
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex bg-[var(--background)] text-[var(--foreground)] relative overflow-hidden" dir={direction}>

        {/* Ambient Background orbs for premium enterprise look with Persian color palette */}
        <div className="fixed inset-0 -z-10 pointer-events-none bg-[var(--background)]">
          {/* Subtle geometric pattern overlay (SVG) */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
          {/* Deep Persian Blue / Turquoise / Gold Orbs */}
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#1A365D] dark:bg-[#0F172A] mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-70 animate-blob" />
          <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] rounded-full bg-[#008080] dark:bg-[#0D9488] mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-50 animate-blob animation-delay-2000" />
          <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] rounded-full bg-[#B8860B] dark:bg-[#D97706] mix-blend-multiply dark:mix-blend-screen filter blur-[150px] opacity-40 animate-blob animation-delay-4000" />
        </div>


        {/* Modular Sidebar */}
        <DashboardSidebar
          collapsed={collapsed}
          setCollapsed={handleSetCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          onHelpClick={() => setHelpOpen(true)}
        />

        {/* Main Workspace Frame */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen relative overflow-hidden">
          {/* Topbar */}
          <DashboardTopbar
            onMenuTrigger={() => setMobileOpen(true)}
            onHelpTrigger={() => setHelpOpen(true)}
          />

          {/* Page Content viewport container */}
          <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 max-w-[1600px] w-full mx-auto relative z-10">
            {children}
          </main>

          {/* Footer status row */}
          <footer className="h-11 border-t border-[var(--border)] bg-[rgba(15,23,42,0.15)] backdrop-blur-md flex items-center justify-between px-6 text-[10px] text-[var(--text-muted)] font-semibold select-none shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
              <span>{isRtl ? "کلیه سامانه‌ها عملیاتی هستند" : "All services operational"}</span>
            </div>
            <div className="hidden sm:flex items-center gap-5">
              <span>{isRtl ? "بروزرسانی شده: همین الان" : "Last synced: Just now"}</span>
              <span className="px-2 py-0.5 rounded bg-[var(--border)] text-[9px]">v3.0.0 (Shell)</span>
            </div>
          </footer>
        </div>

        {/* HELP OVERLAY PANEL */}
        <AnimatePresence>
          {helpOpen && (
            <div className="fixed inset-0 z-[120]">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setHelpOpen(false)}
              />

              {/* Slider Drawer Panel */}
              <motion.div
                initial={{ x: isRtl ? "-100%" : "100%" }}
                animate={{ x: 0 }}
                exit={{ x: isRtl ? "-100%" : "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                className={`absolute top-0 bottom-0 ${isRtl ? "left-0" : "right-0"} w-96 max-w-[90vw] bg-[var(--card)] border-[var(--border)] border-l border-r shadow-2xl flex flex-col overflow-hidden text-start`}
              >
                {/* Header */}
                <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="text-[var(--sky-blue-500)]" size={18} />
                    <span className="font-black text-sm text-[var(--text-primary)]">
                      {isRtl ? "راهنما و مستندات" : "Help & Workspace Guide"}
                    </span>
                  </div>
                  <button
                    onClick={() => setHelpOpen(false)}
                    className="p-1.5 rounded-full hover:bg-[var(--muted-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                    aria-label="Close help panel"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Guide Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider">
                      {isRtl ? "خوش آمدید به مرکز دانش" : "Knowledge Base Portal"}
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {isRtl
                        ? "سئورچبل به شما کمک می‌کند سهم صدای برند خود را در موتورهای پاسخ‌دهی مبتنی بر هوش مصنوعی (مانند جمینای، کلود و چت‌جی‌پی‌تی) پایش کرده و بهینه‌سازی کنید."
                        : "Seorchable helps you audit, protect and optimize your brand's prominence inside Generative Search engines (Gemini, ChatGPT, Claude) with precise metrics."}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider">
                      {isRtl ? "لینک‌های مفید" : "Useful Resources"}
                    </h4>

                    <div className="grid grid-cols-1 gap-2">
                      <a
                        href={`/${language}/docs`}
                        onClick={() => setHelpOpen(false)}
                        className="p-3 rounded-xl border border-[var(--border)] hover:border-[var(--sky-blue-500)]/40 hover:bg-[var(--muted-surface)]/20 transition-all flex items-center gap-3 group"
                      >
                        <BookOpen size={16} className="text-[var(--sky-blue-500)]" />
                        <div className="flex-1">
                          <p className="text-[11px] font-bold text-[var(--text-primary)] group-hover:text-[var(--sky-blue-500)]">
                            {isRtl ? "مستندات توسعه‌دهندگان" : "API Developer Docs"}
                          </p>
                          <span className="text-[9px] text-[var(--text-muted)]">{isRtl ? "اتصال از طریق پروتکل MCP" : "Integrate using MCP server guides"}</span>
                        </div>
                      </a>

                      <a
                        href={`/${language}/contact`}
                        onClick={() => setHelpOpen(false)}
                        className="p-3 rounded-xl border border-[var(--border)] hover:border-[var(--sky-blue-500)]/40 hover:bg-[var(--muted-surface)]/20 transition-all flex items-center gap-3 group"
                      >
                        <Mail size={16} className="text-[var(--orange-500)]" />
                        <div className="flex-1">
                          <p className="text-[11px] font-bold text-[var(--text-primary)] group-hover:text-[var(--orange-500)]">
                            {isRtl ? "پشتیبانی فنی و تیکت" : "Submit Support Request"}
                          </p>
                          <span className="text-[9px] text-[var(--text-muted)]">{isRtl ? "پاسخ‌گویی کمتر از ۲ ساعت" : "Response in under 2 hours"}</span>
                        </div>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Footer status info */}
                <div className="p-4 border-t border-[var(--border)] bg-[var(--background)]/20 text-center text-[10px] text-[var(--text-muted)] font-semibold shrink-0">
                  <span>{isRtl ? "پشتیبانی ۲۴ ساعته سئورچبل" : "Seorchable Support - 24/7 online"}</span>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
}
