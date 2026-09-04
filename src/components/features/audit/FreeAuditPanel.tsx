"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { AuditJob, AuditStatus } from "@/types/audit";
import { auditService } from "@/services/auditService";
import {
  Sparkles,
  Globe,
  AlertCircle,
  CheckCircle2,
  Terminal,
  FileCode,
  Shield,
  Layers,
  Brain,
  Compass,
  ArrowRight,
  ArrowLeft,
  XCircle,
  Activity,
  Award,
  Lock,
  LogIn,
  UserPlus
} from "lucide-react";

interface FreeAuditPanelProps {
  onUpgradeClick?: () => void;
}

interface AuditState {
  status: AuditStatus;
  job: AuditJob | null;
  error: string | null;
  logs: string[];
}

export const FreeAuditPanel: React.FC<FreeAuditPanelProps> = ({ onUpgradeClick }) => {
  const { language, direction } = useTheme();
  const { session, login, register } = useAuth();
  const isRtl = language === "fa";

  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);

  // Explicit centralized audit state model
  const [auditState, setAuditState] = useState<AuditState>({
    status: "idle",
    job: null,
    error: null,
    logs: [],
  });

  // Auth tabs inside the inline auth gate
  const [authTab, setAuthTab] = useState<"login" | "register">("register");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const consoleEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll the terminal logs
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [auditState.logs]);

  // If session changes from unauthenticated to authenticated, and we are in the auth-required state, immediately resume audit!
  useEffect(() => {
    if (session.status === "authenticated" && auditState.status === "auth-required") {
      runAudit();
    }
  }, [session.status]);

  const strings = {
    title: isRtl ? "موتور بهینه‌سازی و تحلیل رایگان برند" : "Free AI Visibility Ingestion Funnel",
    desc: isRtl
      ? "پایش حضور برند در چت‌بات‌ها و مدل‌های زبانی به کمک خزش Firecrawl و تحلیل زبانی گوگل جمنی."
      : "Verify your brand footprint in ChatGPT, Claude and Gemini with active web crawler ingestion.",
    placeholder: isRtl ? "آدرس وب‌سایت خود را وارد کنید (مثلاً: example.com)" : "Enter website URL (e.g. company.com)",
    btnAnalyze: isRtl ? "شروع تحلیل هوشمند" : "Analyze Brand Visibility",
    invalidUrl: isRtl ? "لطفاً یک آدرس وب‌سایت معتبر (مانند example.com) وارد کنید." : "Please enter a valid domain address (e.g. company.com).",

    // Auth Required Strings
    authRequiredTitle: isRtl ? "🔒 تایید هویت سازمانی الزامی است" : "🔒 Identity Verification Required",
    authRequiredDesc: isRtl
      ? "برای پایش و خزش کامل صفحات توسط Firecrawl و تولید گزارش جمنی، لطفاً یک حساب کاربری موقت ایجاد کنید یا وارد شوید."
      : "To run active crawling instances and generate structured AI report sheets, please authenticate.",
    loginTab: isRtl ? "ورود کاربران" : "Sign In",
    registerTab: isRtl ? "ایجاد حساب کاربری جدید" : "Register Workspace",
    authNameLabel: isRtl ? "نام و نام خانوادگی" : "Full Name",
    authEmailLabel: isRtl ? "ایمیل سازمانی" : "Enterprise Email Address",
    authPasswordLabel: isRtl ? "رمز عبور" : "Password",
    authBtnLogin: isRtl ? "ورود و شروع تحلیل" : "Authenticate & Run Audit",
    authBtnRegister: isRtl ? "ثبت‌نام و شروع تحلیل" : "Create Account & Run Audit",

    // Processing Strings
    processingTitle: isRtl ? "در حال اجرای فرآیند خزش معنایی..." : "Ingesting and Auditing Brand Footprint...",
    processingProgress: isRtl ? "این فرآیند حدود ۴ ثانیه زمان می‌برد." : "This multi-stage process takes approximately 4 seconds.",
    terminalTitle: isRtl ? "کنسول خزش Firecrawl و جمنی" : "Firecrawl & Gemini Core Telemetry Stream",

    // Report UI Strings
    overviewTab: isRtl ? "خلاصه وضعیت دیده‌شدن" : "Visibility Summary",
    engineTab: isRtl ? "تحلیل موتورهای پاسخگو" : "LLM Crawl & Engine Logs",
    recommendationsTab: isRtl ? "راهکارهای بهبود و GEO" : "GEO Copy Recommendations",
    scoreTitle: isRtl ? "شاخص دیده‌شدن برند" : "AI Visibility Score",
    scoreDesc: isRtl ? "سهم صدای برند شما در پاسخ مدل‌های زبانی" : "Your brand's share of voice inside LLM databases",
    presenceTitle: isRtl ? "امتیاز حضور برند" : "Brand Presence Score",
    mentionTitle: isRtl ? "فرکانس استناد" : "Mention Frequency Score",
    authorityTitle: isRtl ? "اعتبار معنایی محتوا" : "Content Authority Score",

    geminiTitle: isRtl ? "تحلیل شناختی گوگل جمنی (Google Gemini)" : "Google Gemini Cognitive Assessment",
    firecrawlStats: isRtl ? "آمار خزش کراولر Firecrawl" : "Firecrawl Ingestion Statistics",
    crawledPages: isRtl ? "صفحات خزش شده:" : "Crawled Pages:",
    providerTitle: isRtl ? "تحلیل رفتار موتورهای پاسخگوی پیشرو" : "Conversational Search Engine Performance Matrix",
    providerColName: isRtl ? "موتور پاسخگو" : "Generative Model",
    providerColSentiment: isRtl ? "لحن استناد" : "Sentiment Score",
    providerColVisibility: isRtl ? "شاخص دیده‌شدن" : "Visibility index",
    providerColRec: isRtl ? "توصیه اختصاصی موتور" : "Model-specific suggestion",

    gapsTitle: isRtl ? "شکاف‌های معنایی محتوا (Content Gaps)" : "Identified Content Gaps",
    entitiesTitle: isRtl ? "موجودیت‌های مفقود در پایگاه دانش" : "Missing Entity relationship triples",
    positioningTitle: isRtl ? "بهبود موقعیت‌یابی برند" : "Brand Positioning Improvements",
    discoverTitle: isRtl ? "راهکارهای عمومی ارتقای دیده‌شدن (AEO / GEO)" : "General AI Discoverability Proposed Fixes",
    priorityHigh: isRtl ? "اولویت بالا" : "High Priority",
    priorityMedium: isRtl ? "اولویت متوسط" : "Medium Priority",
    priorityLow: isRtl ? "اولویت کم" : "Low Priority",

    retryBtn: isRtl ? "شروع مجدد تحلیل" : "Analyze Another Website",
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError(null);

    const isValid = auditService.validateUrl(url);
    if (!isValid) {
      setUrlError(strings.invalidUrl);
      setAuditState((prev) => ({ ...prev, status: "invalid-url" }));
      return;
    }

    // Hand over to the next stage in the state machine
    if (session.status === "unauthenticated") {
      setAuditState({
        status: "auth-required",
        job: null,
        error: null,
        logs: [],
      });
    } else {
      runAudit();
    }
  };

  const runAudit = async () => {
    setAuditState({
      status: "processing",
      job: null,
      error: null,
      logs: [],
    });

    try {
      const initialJob = await auditService.provisionAuditJob(url);

      const completedJob = await auditService.simulateCrawlingAndAnalysis(
        initialJob,
        (logLine) => {
          setAuditState((prev) => ({
            ...prev,
            logs: [...prev.logs, logLine],
          }));
        }
      );

      setAuditState({
        status: "completed",
        job: completedJob,
        error: null,
        logs: completedJob.analysis.firecrawlLogs.map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`),
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setAuditState({
        status: "error",
        job: null,
        error: errMsg,
        logs: [],
      });
    }
  };

  const handleInlineAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthLoading(true);

    try {
      if (authTab === "login") {
        if (!authEmail.trim() || !authPassword.trim()) {
          throw new Error(isRtl ? "لطفاً تمام فیلدها را پر کنید." : "Please fill in all credentials.");
        }
        await login(authEmail, authPassword);
      } else {
        if (!authName.trim() || !authEmail.trim() || !authPassword.trim()) {
          throw new Error(isRtl ? "لطفاً تمام فیلدها را پر کنید." : "Please fill in all registration fields.");
        }
        await register(authName, authEmail, authPassword);
      }
      // Success will trigger the useEffect, resuming the audit!
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setAuthError(errMsg);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const resetAudit = () => {
    setUrl("");
    setUrlError(null);
    setAuditState({
      status: "idle",
      job: null,
      error: null,
      logs: [],
    });
  };

  // Helper colors
  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-400 stroke-emerald-500";
    if (score >= 75) return "text-teal-400 stroke-teal-500";
    if (score >= 60) return "text-amber-400 stroke-amber-500";
    return "text-rose-400 stroke-rose-500";
  };

  const [activeReportTab, setActiveReportTab] = useState<"overview" | "engine" | "recommendations">("overview");

  return (
    <div className="w-full space-y-6" dir={direction}>

      {/* 1. INPUT / IDLE STATE or INVALID URL STATE */}
      {(auditState.status === "idle" || auditState.status === "invalid-url") && (
        <Card className="border border-[var(--border)] bg-[var(--card)] backdrop-blur-md shadow-md animate-fade-in">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-[var(--sky-blue-500)] to-[var(--orange-500)] rounded-xl text-white">
                <Globe size={18} />
              </div>
              <div>
                <CardTitle>{strings.title}</CardTitle>
                <CardDescription>{strings.desc}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUrlSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Globe size={16} className={`absolute top-1/2 -translate-y-1/2 text-[var(--text-muted)] ${isRtl ? "right-4" : "left-4"}`} />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={strings.placeholder}
                  className={`
                    w-full py-3.5 text-xs rounded-xl outline-none transition-all duration-300
                    bg-[var(--muted-surface)] text-[var(--text-primary)] border border-[var(--border)]
                    focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30 focus:bg-[var(--card)]
                    placeholder:text-[var(--text-muted)]
                    ${isRtl ? "pr-11 pl-4" : "pl-11 pr-4"}
                  `}
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                disabled={!url.trim()}
                className="gap-2 px-6 py-3.5 font-bold rounded-xl"
              >
                <Sparkles size={14} className="animate-pulse" />
                <span>{strings.btnAnalyze}</span>
              </Button>
            </form>

            {urlError && (
              <div className="p-4 mt-4 rounded-xl border border-[var(--color-error)]/25 bg-[var(--color-error)]/10 text-[var(--color-error)] text-xs flex items-start gap-2.5 animate-shake">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed font-bold">{urlError}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 2. AUTHENTICATION REQUIRED STATE (Embedded Inline Auth Gate) */}
      {auditState.status === "auth-required" && (
        <Card className="border-2 border-[var(--sky-blue-500)]/40 bg-[var(--card)] backdrop-blur-md shadow-2xl animate-fade-in max-w-lg mx-auto overflow-hidden">
          <CardHeader className="border-b border-[var(--border)] bg-[var(--muted-surface)]/20 text-center pb-4">
            <div className="w-12 h-12 rounded-full bg-[var(--sky-blue-500)]/10 border border-[var(--sky-blue-500)]/30 flex items-center justify-center text-[var(--sky-blue-500)] mx-auto mb-2">
              <Lock size={20} className="animate-pulse" />
            </div>
            <CardTitle className="text-lg font-black font-display text-gradient-brand">{strings.authRequiredTitle}</CardTitle>
            <CardDescription className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-sm mx-auto mt-1">
              {strings.authRequiredDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">

            {/* Tab Swapper */}
            <div className="flex border border-[var(--border)] bg-[var(--muted-surface)] p-1 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => { setAuthTab("register"); setAuthError(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authTab === "register" ? "bg-slate-900 text-white shadow-sm border border-white/5" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
              >
                <UserPlus size={13} className="inline mr-1.5 shrink-0" />
                <span>{strings.registerTab}</span>
              </button>
              <button
                type="button"
                onClick={() => { setAuthTab("login"); setAuthError(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authTab === "login" ? "bg-slate-900 text-white shadow-sm border border-white/5" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
              >
                <LogIn size={13} className="inline mr-1.5 shrink-0" />
                <span>{strings.loginTab}</span>
              </button>
            </div>

            <form onSubmit={handleInlineAuth} className="space-y-4">
              {authError && (
                <div className="p-3.5 rounded-xl border border-[var(--color-error)]/20 bg-[var(--color-error)]/10 text-[var(--color-error)] text-xs flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <p className="font-bold">{authError}</p>
                </div>
              )}

              {authTab === "register" && (
                <Input
                  type="text"
                  label={strings.authNameLabel}
                  placeholder="e.g. Seyed"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  disabled={isAuthLoading}
                  required
                />
              )}

              <Input
                type="email"
                label={strings.authEmailLabel}
                placeholder="name@company.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                disabled={isAuthLoading}
                required
              />

              <Input
                type="password"
                label={strings.authPasswordLabel}
                placeholder="••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                disabled={isAuthLoading}
                required
              />

              <Button
                type="submit"
                variant="primary"
                disabled={isAuthLoading}
                className="w-full py-3 mt-4 rounded-xl text-xs font-black shadow-lg"
              >
                {isAuthLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-1.5" />
                    <span>{isRtl ? "در حال تایید هویت..." : "Authenticating..."}</span>
                  </>
                ) : (
                  <>
                    {authTab === "login" ? <LogIn size={14} /> : <UserPlus size={14} />}
                    <span>{authTab === "login" ? strings.authBtnLogin : strings.authBtnRegister}</span>
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 3. PROCESSING STATE */}
      {auditState.status === "processing" && (
        <Card className="border border-[var(--border)] bg-[var(--card)] backdrop-blur-md shadow-2xl animate-fade-in p-2">
          <CardHeader className="text-center pb-4">
            <div className="w-14 h-14 rounded-full bg-[var(--sky-blue-500)]/10 border border-[var(--sky-blue-500)]/30 flex items-center justify-center text-[var(--sky-blue-500)] mx-auto mb-2 animate-spin">
              <Activity size={24} />
            </div>
            <CardTitle className="text-lg font-black font-display text-[var(--text-primary)]">{strings.processingTitle}</CardTitle>
            <CardDescription className="text-xs text-[var(--text-muted)]">{strings.processingProgress}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Custom high fidelity progress bar */}
            <div className="space-y-2">
              <div className="h-2 w-full bg-[var(--border)] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[var(--sky-blue-500)] to-[var(--orange-500)] rounded-full animate-progress" style={{ width: "100%" }} />
              </div>
            </div>

            {/* Terminal Console Logs */}
            <div className="rounded-2xl border border-black/80 bg-slate-950 p-5 font-mono text-xs text-slate-300 shadow-inner flex flex-col space-y-2 max-h-64 overflow-y-auto">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-2">
                <Terminal size={14} className="text-[var(--sky-blue-500)]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{strings.terminalTitle}</span>
              </div>

              <div className="flex-1 space-y-1.5">
                {auditState.logs.map((log, i) => (
                  <div key={i} className="leading-relaxed animate-fade-in">
                    <span className="text-[var(--sky-blue-500)] font-bold mr-1">&gt;</span>
                    <span>{log}</span>
                  </div>
                ))}
                <div ref={consoleEndRef} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. COMPLETED STATE (The rich AI Report Dashboard UI) */}
      {auditState.status === "completed" && auditState.job && (
        <div className="space-y-6 animate-fade-in-up">

          {/* Target URL Info Banner */}
          <div className="glass-panel border border-[var(--glass-border)] bg-[var(--glass-bg)] px-6 py-4.5 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#38bdf8]/10 border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8]">
                <Globe size={18} />
              </div>
              <div className="text-start">
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">{isRtl ? "آدرس وب‌سایت اسکن شده" : "AUDITED TARGET DOMAIN"}</span>
                <h2 className="text-base font-black text-[var(--text-primary)] font-display mt-0.5">{auditState.job.url}</h2>
              </div>
            </div>

            <button
              onClick={resetAudit}
              className="px-5 py-2.5 rounded-xl border border-[var(--border)] hover:border-[var(--sky-blue-500)] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer bg-[var(--muted-surface)]"
            >
              <span>{strings.retryBtn}</span>
              {isRtl ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
            </button>
          </div>

          {/* Report Tab Swapper */}
          <div className="flex border border-[var(--border)] bg-[var(--muted-surface)]/40 p-1 rounded-2xl">
            {[
              { id: "overview", label: strings.overviewTab, icon: Award },
              { id: "engine", label: strings.engineTab, icon: Brain },
              { id: "recommendations", label: strings.recommendationsTab, icon: Compass },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveReportTab(tab.id as any)}
                  className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                    activeReportTab === tab.id
                      ? "bg-gradient-to-r from-[var(--sky-blue-500)]/25 to-[var(--orange-500)]/15 border border-[var(--sky-blue-500)]/30 text-[var(--text-primary)] shadow-sm font-black"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <Icon size={14} className="text-[var(--sky-blue-500)] shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* REPORT VIEWS */}
          {activeReportTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in">
              {/* Giant Radial Score Gauge */}
              <Card className="md:col-span-2 border border-[var(--border)] bg-[var(--card)] flex flex-col justify-between p-2">
                <CardHeader>
                  <CardTitle className="text-sm font-black text-gradient-brand flex items-center gap-2">
                    <Award size={16} />
                    <span>{strings.scoreTitle}</span>
                  </CardTitle>
                  <CardDescription className="text-xs">{strings.scoreDesc}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-6 flex-1 space-y-5">
                  <div className="relative flex items-center justify-center">
                    <svg className="w-40 h-40 transform -rotate-90">
                      <circle cx="80" cy="80" r="65" className="stroke-[var(--border)]" strokeWidth="10" fill="transparent" />
                      <circle
                        cx="80"
                        cy="80"
                        r="65"
                        className={`transition-all duration-1000 ${getScoreColor(auditState.job.score)}`}
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 65}
                        strokeDashoffset={2 * Math.PI * 65 * (1 - auditState.job.score / 100)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className={`text-6xl font-black font-display leading-none tracking-tight ${getScoreColor(auditState.job.score)}`}>
                        {auditState.job.score}
                      </span>
                      <span className="text-xs font-bold text-[var(--text-muted)] mt-1.5 tracking-widest">/ 100</span>
                    </div>
                  </div>

                  {/* Grade Badge */}
                  <div className="px-5 py-2 rounded-full border bg-sky-500/10 border-sky-500/30 text-sky-400 font-bold text-xs flex items-center gap-2">
                    <span>{isRtl ? "رتبه کیفی کلی:" : "Page AI Grade:"}</span>
                    <span className="text-sm font-black">{auditState.job.grade}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Columns */}
              <div className="md:col-span-2 grid grid-cols-1 gap-6">

                {/* Brand Presence */}
                <Card className="border border-[var(--border)] bg-[var(--card)] p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 text-start">
                      <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">{strings.presenceTitle}</span>
                      <p className="text-2xl font-black text-[var(--text-primary)] font-display">
                        {Math.floor(auditState.job.score * 0.95)}%
                      </p>
                    </div>
                    <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
                      <Layers size={16} />
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-[var(--border)] rounded-full overflow-hidden mt-4">
                    <div className="h-full bg-purple-500" style={{ width: `${auditState.job.score * 0.95}%` }} />
                  </div>
                </Card>

                {/* Mention Frequency */}
                <Card className="border border-[var(--border)] bg-[var(--card)] p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 text-start">
                      <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">{strings.mentionTitle}</span>
                      <p className="text-2xl font-black text-[var(--text-primary)] font-display">
                        {Math.floor(auditState.job.score * 0.88)}%
                      </p>
                    </div>
                    <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                      <Activity size={16} />
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-[var(--border)] rounded-full overflow-hidden mt-4">
                    <div className="h-full bg-emerald-500" style={{ width: `${auditState.job.score * 0.88}%` }} />
                  </div>
                </Card>

                {/* Content Authority */}
                <Card className="border border-[var(--border)] bg-[var(--card)] p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 text-start">
                      <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">{strings.authorityTitle}</span>
                      <p className="text-2xl font-black text-[var(--text-primary)] font-display">
                        {Math.floor(auditState.job.score * 1.02) > 100 ? 98 : Math.floor(auditState.job.score * 1.02)}%
                      </p>
                    </div>
                    <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
                      <Shield size={16} />
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-[var(--border)] rounded-full overflow-hidden mt-4">
                    <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, auditState.job.score * 1.02)}%` }} />
                  </div>
                </Card>

              </div>
            </div>
          )}

          {activeReportTab === "engine" && (
            <div className="space-y-6 animate-fade-in">
              {/* Google Gemini Cognitive analysis */}
              <Card className="border border-[var(--border)] bg-[var(--card)]">
                <CardHeader>
                  <CardTitle className="text-sm font-black flex items-center gap-2 text-[var(--sky-blue-500)]">
                    <Brain size={16} />
                    <span>{strings.geminiTitle}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-start">
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--muted-surface)]/50 p-4.5 rounded-2xl border border-[var(--border)] font-medium">
                    {auditState.job.analysis.geminiInsights}
                  </p>
                </CardContent>
              </Card>

              {/* Firecrawl crawling status */}
              <Card className="border border-[var(--border)] bg-[var(--card)] p-1">
                <CardHeader className="flex justify-between flex-row items-center border-b border-[var(--border)] pb-3 px-5">
                  <CardTitle className="text-sm font-black flex items-center gap-2 text-[#38bdf8]">
                    <FileCode size={16} />
                    <span>{strings.firecrawlStats}</span>
                  </CardTitle>
                  <span className="text-xs px-2.5 py-1 rounded bg-[#38bdf8]/10 text-[#38bdf8] font-bold border border-[#38bdf8]/20">
                    {strings.crawledPages} {auditState.job.analysis.firecrawlCrawledPagesCount}
                  </span>
                </CardHeader>
                <CardContent className="pt-4 space-y-2 text-start px-5 font-mono text-[11px] text-slate-300">
                  {auditState.job.analysis.firecrawlLogs.map((log, i) => (
                    <div key={i} className={`flex items-start gap-2 p-1.5 rounded bg-slate-950/40 border border-white/5`}>
                      <span className={`px-1.5 rounded text-[9px] font-bold ${log.level === "info" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                        {log.level.toUpperCase()}
                      </span>
                      <span className="text-slate-500">{log.timestamp}</span>
                      <span className="leading-normal font-sans font-medium">{log.message}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Future LLM Performance Matrix */}
              <Card className="border border-[var(--border)] bg-[var(--card)]">
                <CardHeader className="border-b border-[var(--border)] pb-3">
                  <CardTitle className="text-sm font-black flex items-center gap-2 text-[var(--orange-500)]">
                    <Terminal size={16} />
                    <span>{strings.providerTitle}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 px-0 overflow-x-auto">
                  <table className="w-full text-start border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--muted-surface)] text-[var(--text-secondary)] font-bold">
                        <th className="py-3 px-5 text-start">{strings.providerColName}</th>
                        <th className="py-3 px-5 text-center">{strings.providerColSentiment}</th>
                        <th className="py-3 px-5 text-center">{strings.providerColVisibility}</th>
                        <th className="py-3 px-5 text-start">{strings.providerColRec}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)] text-[11px] font-semibold">
                      {auditState.job.analysis.llmProviderInsights.map((prov, i) => (
                        <tr key={i} className="hover:bg-[var(--muted-surface)]/20 transition-colors">
                          <td className="py-3 px-5 text-start text-[var(--text-primary)] font-black">{prov.providerName}</td>
                          <td className="py-3 px-5 text-center font-mono">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {prov.sentimentScore}%
                            </span>
                          </td>
                          <td className="py-3 px-5 text-center font-mono text-[#38bdf8]">{prov.visibilityIndex}%</td>
                          <td className="py-3 px-5 text-start text-[var(--text-secondary)] leading-normal font-sans">{prov.recommendation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeReportTab === "recommendations" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              {/* Content Gaps */}
              <Card className="border border-[var(--border)] bg-[var(--card)]">
                <CardHeader className="border-b border-[var(--border)] pb-3">
                  <CardTitle className="text-sm font-black flex items-center gap-2 text-rose-400">
                    <XCircle size={16} />
                    <span>{strings.gapsTitle}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3.5 text-start">
                  {auditState.job.recommendations.contentGaps.map((gap, i) => (
                    <div key={i} className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--muted-surface)]/60 space-y-1.5 relative">
                      <span className={`absolute top-3 right-3 text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                        gap.priority === "high" ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400"
                      }`}>
                        {gap.priority === "high" ? strings.priorityHigh : strings.priorityMedium}
                      </span>
                      <h4 className="text-xs font-black text-[var(--text-primary)] leading-snug">{gap.issue}</h4>
                      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-medium">{gap.recommendation}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Missing entities */}
              <Card className="border border-[var(--border)] bg-[var(--card)]">
                <CardHeader className="border-b border-[var(--border)] pb-3">
                  <CardTitle className="text-sm font-black flex items-center gap-2 text-amber-400">
                    <Layers size={16} />
                    <span>{strings.entitiesTitle}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3 text-start">
                  <div className="flex flex-wrap gap-2">
                    {auditState.job.recommendations.missingEntities.map((ent, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--muted-surface)] text-xs font-mono font-bold text-amber-400">
                        {ent}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Brand positioning improvements */}
              <Card className="border border-[var(--border)] bg-[var(--card)]">
                <CardHeader className="border-b border-[var(--border)] pb-3">
                  <CardTitle className="text-sm font-black flex items-center gap-2 text-[#38bdf8]">
                    <Compass size={16} />
                    <span>{strings.positioningTitle}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3 text-start">
                  {auditState.job.recommendations.brandPositioningImprovements.map((item, i) => (
                    <div key={i} className="flex gap-2 text-xs font-medium text-[var(--text-secondary)] leading-relaxed">
                      <span className="text-[#38bdf8] font-bold shrink-0">•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* AI Discoverability recommendations */}
              <Card className="border border-[var(--border)] bg-[var(--card)]">
                <CardHeader className="border-b border-[var(--border)] pb-3">
                  <CardTitle className="text-sm font-black flex items-center gap-2 text-emerald-400">
                    <Sparkles size={16} />
                    <span>{strings.discoverTitle}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3 text-start">
                  {auditState.job.recommendations.aiDiscoverabilityRecommendations.map((item, i) => (
                    <div key={i} className="flex gap-2 text-xs font-medium text-[var(--text-secondary)] leading-relaxed">
                      <span className="text-emerald-400 font-bold shrink-0">•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      )}

      {/* 5. ERROR STATE */}
      {auditState.status === "error" && (
        <Card className="border border-[var(--border)] bg-[var(--card)] backdrop-blur-md shadow-lg animate-fade-in p-2">
          <CardHeader className="text-center pb-2">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto mb-2 animate-bounce">
              <AlertCircle size={24} />
            </div>
            <CardTitle className="text-lg font-black font-display text-[var(--text-primary)]">
              {isRtl ? "خطا در فرآیند تحلیل ساختار وب‌سایت" : "An Error Occurred During Audit Ingestion"}
            </CardTitle>
            <CardDescription className="text-xs">{auditState.error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center pt-4 border-t border-[var(--border)]">
            <Button variant="secondary" onClick={resetAudit} className="gap-2 text-xs py-2.5">
              <span>{isRtl ? "تلاش مجدد" : "Try Again"}</span>
              {isRtl ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
            </Button>
          </CardContent>
        </Card>
      )}

    </div>
  );
};
