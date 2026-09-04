"use client";

import React from "react";
import { GlassCard } from "@/components/GlassCard";
import { useTheme } from "@/components/ThemeProvider";
import { User } from "lucide-react";

export default function ProfilePage() {
  const { language } = useTheme();
  const isRtl = language === "fa";

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)] font-display flex items-center gap-2.5">
          <User className="text-[var(--orange-500)]" size={24} />
          <span>{isRtl ? "پروفایل کاربری" : "User Profile"}</span>
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1.5 max-w-3xl leading-relaxed">
          {isRtl
            ? "اطلاعات حساب کاربری، جزئیات اشتراک سازمانی، و سهمیه پرس‌وجو مستأجر."
            : "Manage your user account identity, organizational workspace defaults, and billing tokens."}
        </p>
      </div>

      <GlassCard hoverable={false} className="p-8 text-center min-h-[300px] flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--sky-blue-500)] to-[var(--orange-500)] text-white flex items-center justify-center text-2xl font-bold mb-4">
          U
        </div>
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">User Admin</h3>
        <p className="text-xs text-[var(--text-secondary)] font-mono">tehran@brandgraph.ai</p>
        <span className="mt-4 px-3 py-1 bg-gradient-to-r from-[var(--sky-blue-500)]/20 to-[var(--orange-500)]/20 border border-[var(--sky-blue-500)]/30 text-xs font-semibold text-[var(--text-primary)] rounded-full">
          {isRtl ? "دسترسی مدیریت مستأجر" : "Tenant Admin Access"}
        </span>
      </GlassCard>
    </div>
  );
}
