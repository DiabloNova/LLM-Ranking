"use client";

import React, { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import {
  Settings, Key, Shield, Building, Sparkles, CheckCircle2, AlertCircle
} from "lucide-react";

export default function SettingsPage() {
  const { language, direction } = useTheme();
  const { session } = useAuth();
  const isRtl = language === "fa";

  const [companyName, setCompanyName] = useState(isRtl ? "توسعه تجارت دیجیتال" : "Digital Trade Corp");
  const [workspaceDomain, setWorkspaceDomain] = useState("company.com");
  const [apiKey, setApiKey] = useState("sc_live_f893a0bde56f91ac8972e77b10ac");
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setIsSaved(false);

    setTimeout(() => {
      setIsSaving(false);
      setIsSaved(true);
    }, 1000);
  };

  const strings = {
    title: isRtl ? "تنظیمات فضای کاری و سازمان" : "Workspace & API Settings",
    desc: isRtl
      ? "پیکربندی هویت سازمان، مدیریت دامنه‌های تحت پایش، کلیدهای دسترسی API و تنظیمات عمومی پلتفرم."
      : "Manage corporate workspace profiles, fetch programmatical API Keys, configure authorization rules and crawler targets.",
    companyLabel: isRtl ? "نام رسمی سازمان" : "Official Organization Name",
    domainLabel: isRtl ? "دامنه اختصاصی فضا" : "Primary Audited Root Domain",
    apiKeyLabel: isRtl ? "کلید دسترسی معتبر (API Token)" : "Secret Integration API Key",
    apiKeyDesc: isRtl
      ? "از این کلید اختصاصی برای ادغام ربات‌های خزش معنایی در پروتکل زمینه مدل (MCP) خود استفاده کنید."
      : "Use this token to authenticate programmatic crawling pipelines inside your LLMs via our MCP server context.",
    saveBtn: isRtl ? "ذخیره تغییرات پیکربندی" : "Save Workspace Changes",
    successMsg: isRtl ? "تنظیمات فضای کاری با موفقیت به‌روزرسانی شد." : "Workspace configuration parameters updated successfully."
  };

  return (
    <div className="space-y-6 animate-fade-in" dir={direction}>
      {/* Header */}
      <div className="text-start">
        <h1 className="text-2xl font-black text-[var(--text-primary)] font-display">
          {strings.title}
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          {strings.desc}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <Card className="lg:col-span-2 border border-[var(--border)] bg-[var(--card)] text-start">
          <CardHeader>
            <CardTitle className="text-sm font-black flex items-center gap-2 text-[var(--sky-blue-500)]">
              <Building size={16} />
              <span>{isRtl ? "مشخصات عمومی سازمان" : "Official Organization Identity"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveSettings} className="space-y-5">

              {isSaved && (
                <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs flex items-center gap-2 font-bold animate-fade-in">
                  <CheckCircle2 size={15} />
                  <span>{strings.successMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={strings.companyLabel}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={isSaving}
                  required
                />
                <Input
                  label={strings.domainLabel}
                  value={workspaceDomain}
                  onChange={(e) => setWorkspaceDomain(e.target.value)}
                  disabled={isSaving}
                  required
                />
              </div>

              <div className="pt-4 border-t border-[var(--border)] flex justify-end">
                <Button type="submit" variant="primary" disabled={isSaving} className="px-6 py-3 text-xs font-bold rounded-xl">
                  {isSaving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-1.5" />
                      <span>{isRtl ? "در حال ذخیره‌سازی..." : "Saving..."}</span>
                    </>
                  ) : (
                    <span>{strings.saveBtn}</span>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* API Tokens */}
        <Card className="border border-[var(--border)] bg-[var(--card)] text-start flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-[var(--border)]">
            <CardTitle className="text-sm font-black flex items-center gap-2 text-[var(--orange-500)]">
              <Key size={16} />
              <span>{isRtl ? "کلیدهای دسترسی API" : "Developer Credentials"}</span>
            </CardTitle>
            <CardDescription className="text-xs">{strings.apiKeyDesc}</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)]">{strings.apiKeyLabel}</label>
              <input
                type="text"
                readOnly
                value={apiKey}
                className="w-full font-mono text-xs px-3.5 py-3.5 rounded-xl bg-[var(--muted-surface)] text-[var(--text-primary)] border border-[var(--border)] select-all focus:outline-none"
              />
            </div>

            <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-[var(--text-secondary)] text-[10px] leading-relaxed flex items-start gap-2.5 font-medium">
              <Shield size={14} className="text-amber-400 shrink-0 mt-0.5" />
              <span>
                {isRtl
                  ? "کلید دسترسی خود را هرگز در کلاینت‌های عمومی به اشتراک نگذارید. خزش‌های برنامه‌ریزی‌شده مجهز به این توکن مستقیماً روی پلن فعال محاسبه خواهند شد."
                  : "Keep this secret secure. All REST calls and MCP queries performed via this token are charged directly on your active billing workspace balance."}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
