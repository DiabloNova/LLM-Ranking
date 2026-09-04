"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Dialog } from "@/components/Dialog";
import { Check, Shield, Award, Sparkles, Building, ChevronRight, AlertCircle } from "lucide-react";
import { normalizePlan, saveCheckoutIntent, type CheckoutPlan } from "@/lib/checkout-intent";

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, direction } = useTheme();
  const { session, register } = useAuth();
  const isRtl = language === "fa";

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [targetDomain, setTargetDomain] = useState("");
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

  // Authentication gate states for non-registered users in the pricing conversion flow
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [intentRestored, setIntentRestored] = useState(false);

  // Check if there was a pre-selected plan in the query params (e.g. from landing page)
  useEffect(() => {
    if (intentRestored) return;
    const plan = normalizePlan(searchParams?.get("plan"));
    if (plan) handlePlanSelection(plan);
    setIntentRestored(true);
  }, [searchParams, intentRestored]);

  const handlePlanSelection = (planName: string) => {
    const plan = normalizePlan(planName);
    if (!plan) return;
    setSelectedPlan(plan);
    saveCheckoutIntent(plan, `/${language}/invoice?plan=${plan}`);
    if (session.status === "unauthenticated") {
      router.push(`/${language}/register?plan=${plan}&next=invoice`);
    } else if (plan === "free") {
      router.push(`/${language}/dashboard`);
    } else {
      router.push(`/${language}/invoice?plan=${plan}`);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsAuthLoading(true);

    try {
      if (!authName.trim() || !authEmail.trim() || !authPassword.trim()) {
        throw new Error(isRtl ? "لطفاً تمام فیلدها را پر کنید." : "Please fill in all details.");
      }

      await register(authName, authEmail, authPassword);

      // Successfully authenticated, close auth modal and open Workspace Creation modal!
      setIsAuthOpen(false);
      setIsWorkspaceOpen(true);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setAuthError(errMsg);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleWorkspaceCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim() || !targetDomain.trim()) return;

    setIsCreatingWorkspace(true);

    // Simulate workspace provision and dispatch pricing viewed/subscription started events
    setTimeout(() => {
      setIsCreatingWorkspace(false);
      setIsWorkspaceOpen(false);

      // Track analytics conversion event if defined
      if (typeof window !== "undefined" && (window as any).dataLayer) {
        (window as any).dataLayer.push({
          event: "subscription_started",
          plan: selectedPlan,
          domain: targetDomain
        });
      }

      // Route the user directly to the new workspace dashboard
      router.push(`/${language}/dashboard?workspace=${encodeURIComponent(workspaceName)}`);
    }, 1500);
  };

  const strings = {
    title: isRtl ? "طرح‌های اشتراک و تعرفه‌ها" : "Enterprise Grade Pricing",
    subtitle: isRtl
      ? "پیکربندی هوشمند و بررسی دیده‌شدن برند خود در مدل‌های زبانی با پلن‌های متناسب با مقیاس کسب‌وکار شما."
      : "Start measuring and optimizing your LLM footprint. Choose the subscription matching your scale.",

    // Plans Copy
    freeTitle: isRtl ? "پلن رایگان (Free)" : "Free",
    freePrice: "0",
    freeDesc: isRtl ? "برای آزمایش اولیه ساختار و خزش فرضی" : "Perfect for initial audit evaluations",
    freeFeatures: isRtl
      ? ["بررسی دامنه‌های محدود", "شاخص دیده‌شدن پایه", "خلاصه گزارش‌های آماری"]
      : ["Limited brand audits", "Basic visibility scoring", "Historical overview summaries"],

    proTitle: isRtl ? "پلن حرفه‌ای (Professional)" : "Professional",
    proPrice: isRtl ? "۱,۵۰۰,۰۰۰" : "49",
    proDesc: isRtl ? "برای رشد مستمر و پایش دائم دیده‌شدن" : "For growing startups & active brands",
    proFeatures: isRtl
      ? ["پایش مداوم و خودکار", "گزارش‌های پیشرفته PDF", "تحلیل عمیق بر مبنای جمنی", "دسترسی به ۲ فضای کاری مجزا"]
      : ["Continuous brand monitoring", "Advanced PDF export reports", "Google Gemini insights access", "Up to 2 active brand workspaces"],

    entTitle: isRtl ? "پلن سازمانی (Enterprise)" : "Enterprise",
    entPrice: isRtl ? "تماس بگیرید" : "Custom",
    entDesc: isRtl ? "برای برندهای بزرگ سازمانی و هلدینگ‌ها" : "For large scale holding groups & agencies",
    entFeatures: isRtl
      ? ["تعداد نامحدود فضاهای کاری", "دسترسی کامل اعضای تیم", "دسترسی تام به REST API و MCP", "پشتیبانی ۲۴ ساعته اختصاصی"]
      : ["Unlimited active brands", "Multi-seat team workspace access", "Full REST API & MCP Server access", "Dedicated priority support agent"],

    currency: isRtl ? "تومان / ماه" : "$ / mo",
    ctaFree: isRtl ? "شروع رایگان" : "Start Free Trial",
    ctaPro: isRtl ? "ارتقا به حرفه‌ای" : "Upgrade to Pro",
    ctaEnt: isRtl ? "ارتباط با پشتیبانی" : "Contact Sales",

    // Modals
    registerTitle: isRtl ? "🔐 ثبت‌نام و فعال‌سازی اشتراک" : "🔐 Register to Activate Plan",
    registerDesc: isRtl
      ? "لطفاً ابتدا حساب کاربری سازمانی خود را برای اعمال تغییرات لایسنس فعال فرمایید."
      : "Please create your corporate account first to activate your selected billing license.",
    registerBtn: isRtl ? "ثبت‌نام و ادامه خرید" : "Create Account & Continue",

    workspaceTitle: isRtl ? "⚡ راه‌اندازی فوری فضای کاری جدید" : "⚡ Setup Your Premium Workspace",
    workspaceDesc: isRtl
      ? "مشخصات و دامنه وب‌سایت اصلی سازمان خود را برای شروع پایش دائم سیستم وارد کنید."
      : "Input your primary audited domain and brand name to launch your dedicated monitoring space.",
    workspaceNameLabel: isRtl ? "نام تجاری فضای کاری" : "Workspace / Brand Name",
    targetDomainLabel: isRtl ? "آدرس وب‌سایت سازمان (دامنه)" : "Target Web Domain URL",
    workspaceBtn: isRtl ? "ایجاد فضا و ورود به داشبورد" : "Provision Workspace & Enter Dashboard"
  };

  return (
    <div className="min-h-screen relative overflow-hidden text-[var(--foreground)] py-12 px-4 sm:px-6 lg:px-8" dir={direction}>
      {/* Ambient background spheres */}
      <div className="ambient-bg fixed inset-0 -z-10">
        <div className="ambient-orb orb-1" />
        <div className="ambient-orb orb-2" />
      </div>

      <div className="max-w-5xl mx-auto space-y-12 animate-fade-in text-center">
        {/* Header Title */}
        <div className="space-y-4 max-w-2xl mx-auto">
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-[var(--sky-blue-500)] border border-[var(--sky-blue-500)]/20 bg-[var(--sky-blue-500)]/5 inline-block">
            {isRtl ? "تعرفه‌ها" : "PRICING PLANS"}
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-gradient-brand leading-none font-display">
            {strings.title}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            {strings.subtitle}
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* FREE PLAN */}
          <Card className="border border-[var(--border)] bg-[var(--card)] backdrop-blur-md hover:border-sky-500/20 transition-all duration-300 flex flex-col justify-between text-start">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-black text-[var(--text-primary)]">{strings.freeTitle}</CardTitle>
              <CardDescription className="text-xs">{strings.freeDesc}</CardDescription>
              <div className="pt-4 flex items-baseline gap-1">
                <span className="text-4xl font-black text-[var(--text-primary)] font-display">{strings.freePrice}</span>
                <span className="text-xs text-[var(--text-muted)] font-bold">{strings.currency}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-0 flex-1 flex flex-col justify-between">
              <ul className="space-y-2.5 text-xs text-[var(--text-secondary)] font-semibold border-t border-[var(--border)] pt-4">
                {strings.freeFeatures.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                onClick={() => handlePlanSelection("Free")}
                className="w-full mt-6 py-3 rounded-xl text-xs font-black gap-2 flex items-center justify-center cursor-pointer hover:bg-white/5"
              >
                <span>{strings.ctaFree}</span>
                <ChevronRight size={13} className={isRtl ? "rotate-180" : ""} />
              </Button>
            </CardContent>
          </Card>

          {/* PROFESSIONAL PLAN (Popular Gradient Border) */}
          <div className="relative rounded-3xl p-[2px] bg-gradient-to-br from-[var(--sky-blue-500)] to-[var(--orange-500)] shadow-xl transform md:-translate-y-2">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[var(--sky-blue-500)] to-[var(--orange-500)] text-white text-[9px] font-black rounded-full uppercase tracking-widest shadow-md">
              {isRtl ? "محبوب‌ترین پلن" : "MOST POPULAR"}
            </span>
            <Card className="h-full border-none bg-slate-950/95 backdrop-blur-md rounded-[22px] flex flex-col justify-between text-start">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-black text-white">{strings.proTitle}</CardTitle>
                <CardDescription className="text-xs text-slate-300">{strings.proDesc}</CardDescription>
                <div className="pt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white font-display">{strings.proPrice}</span>
                  <span className="text-xs text-slate-400 font-bold">{strings.currency}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-0 flex-1 flex flex-col justify-between">
                <ul className="space-y-2.5 text-xs text-slate-200 font-semibold border-t border-white/10 pt-4">
                  {strings.proFeatures.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check size={14} className="text-[var(--sky-blue-500)] shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant="primary"
                  onClick={() => handlePlanSelection("Professional")}
                  className="w-full mt-6 py-3.5 rounded-xl text-xs font-black gap-2 flex items-center justify-center cursor-pointer bg-gradient-to-r from-[var(--sky-blue-500)] to-[var(--orange-500)] border-none text-white shadow-lg"
                >
                  <Sparkles size={14} className="animate-pulse" />
                  <span>{strings.ctaPro}</span>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* ENTERPRISE PLAN */}
          <Card className="border border-[var(--border)] bg-[var(--card)] backdrop-blur-md hover:border-orange-500/20 transition-all duration-300 flex flex-col justify-between text-start">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-black text-[var(--text-primary)]">{strings.entTitle}</CardTitle>
              <CardDescription className="text-xs">{strings.entDesc}</CardDescription>
              <div className="pt-4 flex items-baseline gap-1">
                <span className="text-4xl font-black text-[var(--text-primary)] font-display">{strings.entPrice}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-0 flex-1 flex flex-col justify-between">
              <ul className="space-y-2.5 text-xs text-[var(--text-secondary)] font-semibold border-t border-[var(--border)] pt-4">
                {strings.entFeatures.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Check size={14} className="text-orange-400 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                onClick={() => handlePlanSelection("Enterprise")}
                className="w-full mt-6 py-3 rounded-xl text-xs font-black gap-2 flex items-center justify-center cursor-pointer hover:bg-white/5"
              >
                <span>{strings.ctaEnt}</span>
                <ChevronRight size={13} className={isRtl ? "rotate-180" : ""} />
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* 1. AUTHENTICATION GATE MODAL */}
      <Dialog isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} title={strings.registerTitle}>
        <form onSubmit={handleAuthSubmit} className="space-y-4">
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {strings.registerDesc}
          </p>

          {authError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span className="font-bold">{authError}</span>
            </div>
          )}

          <Input
            label={isRtl ? "نام و نام خانوادگی" : "Full Name"}
            placeholder="e.g. Seyed"
            value={authName}
            onChange={(e) => setAuthName(e.target.value)}
            disabled={isAuthLoading}
            required
          />

          <Input
            type="email"
            label={isRtl ? "ایمیل سازمانی" : "Enterprise Email"}
            placeholder="e.g. business@company.com"
            value={authEmail}
            onChange={(e) => setAuthEmail(e.target.value)}
            disabled={isAuthLoading}
            required
          />

          <Input
            type="password"
            label={isRtl ? "رمز عبور" : "Password"}
            placeholder="••••••••"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            disabled={isAuthLoading}
            required
          />

          <div className="flex items-center gap-3 justify-end pt-4 border-t border-[var(--border)]">
            <Button variant="outline" type="button" onClick={() => setIsAuthOpen(false)} disabled={isAuthLoading}>
              {isRtl ? "انصراف" : "Cancel"}
            </Button>
            <Button variant="primary" type="submit" disabled={isAuthLoading}>
              {isAuthLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-1.5" />
                  <span>{isRtl ? "در حال ثبت‌نام..." : "Creating..."}</span>
                </>
              ) : (
                <span>{strings.registerBtn}</span>
              )}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* 2. WORKSPACE CREATION MODAL */}
      <Dialog isOpen={isWorkspaceOpen} onClose={() => setIsWorkspaceOpen(false)} title={strings.workspaceTitle}>
        <form onSubmit={handleWorkspaceCreate} className="space-y-4">
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {strings.workspaceDesc}
          </p>

          <Input
            label={strings.workspaceNameLabel}
            placeholder={isRtl ? "مثال: هلدینگ دیجی‌کالا" : "e.g., Digikala Group Workspace"}
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            disabled={isCreatingWorkspace}
            required
          />

          <Input
            label={strings.targetDomainLabel}
            placeholder="e.g. company.com"
            value={targetDomain}
            onChange={(e) => setTargetDomain(e.target.value)}
            disabled={isCreatingWorkspace}
            required
          />

          <div className="flex items-center gap-3 justify-end pt-4 border-t border-[var(--border)]">
            <Button variant="outline" type="button" onClick={() => setIsWorkspaceOpen(false)} disabled={isCreatingWorkspace}>
              {isRtl ? "انصراف" : "Cancel"}
            </Button>
            <Button variant="primary" type="submit" disabled={isCreatingWorkspace || !workspaceName.trim() || !targetDomain.trim()}>
              {isCreatingWorkspace ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-1.5" />
                  <span>{isRtl ? "در حال راه‌اندازی فضا..." : "Provisioning Workspace..."}</span>
                </>
              ) : (
                <span>{strings.workspaceBtn}</span>
              )}
            </Button>
          </div>
        </form>
      </Dialog>

    </div>
  );
}
