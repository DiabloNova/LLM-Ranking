"use client";

import React, { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";
import { Button } from "@/components/Button";
import {
  Receipt, CreditCard, Award, Shield, CheckCircle2, DollarSign, Calendar, ArrowRight, ArrowLeft
} from "lucide-react";

export default function BillingPage() {
  const { language, direction } = useTheme();
  const isRtl = language === "fa";

  const [activePlan, setActivePlan] = useState("Professional");

  const invoices = [
    {
      id: "INV-2024-003",
      amount: isRtl ? "۱,۵۰۰,۰۰۰ تومان" : "$49.00",
      date: "2024-11-28",
      status: "paid"
    },
    {
      id: "INV-2024-002",
      amount: isRtl ? "۱,۵۰۰,۰۰۰ تومان" : "$49.00",
      date: "2024-10-28",
      status: "paid"
    }
  ];

  const strings = {
    title: isRtl ? "اشتراک و پرداخت‌های سازمانی" : "Billing & Enterprise Subscriptions",
    desc: isRtl
      ? "مدیریت صورت‌حساب‌ها، فاکتورهای رسمی، ارتقای پلن‌های اشتراک و بررسی آمار مصرف ترافیک کراولر."
      : "Manage plans upgrade, track active crawl ingestion quotas, review enterprise transaction history, and configure corporate payments.",
    activeTier: isRtl ? "پلن فعال فعلی شما" : "Your Active Plan",
    activeTierDesc: isRtl ? "پک بهینه‌سازی حرفه‌ای با پایش‌های مداوم" : "Professional optimization workspace",
    changePlanBtn: isRtl ? "تغییر یا ارتقای اشتراک" : "Upgrade Subscription",
    quotaTitle: isRtl ? "ترافیک خزش معنایی مصرف‌شده" : "Conversational Scrapes Limit Balance",
    quotaDetails: isRtl ? "۸,۴۲۰ از ۱۰,۰۰۰ پرس‌وجو مجاز در ماه" : "8,420 / 10,000 crawls allowed per month",
    historyTitle: isRtl ? "تاریخچه صورت‌حساب‌های مالی" : "Invoice Settlement History",
    historyColId: isRtl ? "شماره فاکتور" : "Invoice No",
    historyColAmount: isRtl ? "مبلغ پرداختی" : "Total Paid",
    historyColDate: isRtl ? "تاریخ تسویه" : "Date Settled",
    historyColStatus: isRtl ? "وضعیت" : "Status",
    statusPaid: isRtl ? "پرداخت شده" : "Paid"
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

        {/* Tier Details */}
        <Card className="lg:col-span-2 border border-[var(--border)] bg-[var(--card)] text-start flex flex-col justify-between">
          <CardHeader>
            <div className="flex justify-between items-start gap-3">
              <div>
                <CardTitle className="text-sm font-black flex items-center gap-2 text-[var(--sky-blue-500)]">
                  <Award size={16} />
                  <span>{strings.activeTier}</span>
                </CardTitle>
                <CardDescription className="text-xs mt-1">{strings.activeTierDesc}</CardDescription>
              </div>

              <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-gradient-to-r from-[var(--sky-blue-500)] to-[var(--orange-500)] text-white shadow-sm border border-white/5 uppercase">
                {activePlan}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Quota slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-[var(--text-secondary)]">
                <span>{strings.quotaTitle}</span>
                <span>۸۴.۲٪</span>
              </div>
              <div className="h-2 w-full bg-[var(--border)] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[var(--sky-blue-500)] to-[var(--orange-500)] rounded-full" style={{ width: "84.2%" }} />
              </div>
              <p className="text-[10px] text-[var(--text-muted)] font-semibold">{strings.quotaDetails}</p>
            </div>

            <div className="pt-4 border-t border-[var(--border)] flex justify-end">
              <Button variant="outline" className="text-xs font-bold gap-2 px-5 py-2.5 cursor-pointer">
                <span>{strings.changePlanBtn}</span>
                {isRtl ? <ArrowLeft size={13} /> : <ArrowRight size={13} />}
              </Button>
            </div>

          </CardContent>
        </Card>

        {/* Financial Transactions */}
        <Card className="border border-[var(--border)] bg-[var(--card)] text-start">
          <CardHeader className="border-b border-[var(--border)] pb-3">
            <CardTitle className="text-sm font-black flex items-center gap-2 text-[var(--orange-500)]">
              <Receipt size={16} />
              <span>{strings.historyTitle}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 px-0">
            <table className="w-full text-start border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted-surface)] text-[var(--text-secondary)] font-bold">
                  <th className="py-2.5 px-4 text-start">{strings.historyColId}</th>
                  <th className="py-2.5 px-4 text-center">{strings.historyColAmount}</th>
                  <th className="py-2.5 px-4 text-center">{strings.historyColStatus}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[11px] font-semibold">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[var(--muted-surface)]/20 transition-colors">
                    <td className="py-3 px-4 text-start text-[var(--text-primary)] font-mono">{inv.id}</td>
                    <td className="py-3 px-4 text-center text-[var(--text-secondary)] font-mono">{inv.amount}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase">
                        {strings.statusPaid}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
