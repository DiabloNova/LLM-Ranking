"use client";

import React, { useState, use } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, CreditCard, Receipt, ShieldCheck, Download, Printer, Wallet } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { normalizePlan } from "@/lib/checkout-intent";

export default function InvoicePaymentPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = use(params);
  const locale = resolvedParams.locale;
  const { theme } = useTheme();
  const isFa = locale === "fa";
  const searchParams = useSearchParams();
  const selectedPlan = normalizePlan(searchParams.get("plan"));

  // Simulated active invoice state
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bank" | "crypto">("card");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Simulated Invoice details
  const invoiceData = {
    id: "INV-2025-089",
    date: isFa ? "۱۴۰۳/۱۲/۱۵" : "March 5, 2025",
    dueDate: isFa ? "۱۴۰۳/۱۲/۲۹" : "March 19, 2025",
    amount: 1450, // in USD
    amountFa: "۷۲,۵۰۰,۰۰۰ تومان", // in Tomans
    tax: 130.5,
    taxFa: "۶,۵۲۵,۰۰۰ تومان",
    discount: 50,
    discountFa: "۲,۵۰۰,۰۰۰ تومان",
    total: 1530.5,
    totalFa: "۷۶,۵۲۵,۰۰۰ تومان",
    plan: selectedPlan === "professional"
      ? (isFa ? "طرح حرفه‌ای (Professional)" : "Professional Plan")
      : selectedPlan === "free"
        ? (isFa ? "طرح رایگان" : "Free Plan")
        : (isFa ? "طرح سازمانی (Enterprise)" : "Enterprise Plan"),
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    // Simulate transaction delay
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);
    }, 1800);
  };

  return (
    <div
      className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      dir={isFa ? "rtl" : "ltr"}
    >
      {/* Background gradients */}
      <div className="absolute top-0 right-1/4 w-[40vw] h-[40vw] bg-gradient-to-br from-[#38bdf8]/10 to-[#f97316]/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-1/4 w-[35vw] h-[35vw] bg-gradient-to-tr from-[#f97316]/10 to-[#38bdf8]/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto z-10 relative">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <Link
            href={`/${locale}/dashboard`}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors border border-white/10 px-4 py-2 rounded-xl bg-slate-900/30 backdrop-blur-md"
          >
            <ArrowLeft size={16} className="rtl:rotate-180" />
            <span>{isFa ? "بازگشت به پیشخوان" : "Back to Workspace"}</span>
          </Link>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isFa ? "درگاه پرداخت امن" : "Secure Payment Gateway"}</span>
          </div>
        </div>

        {!paymentSuccess ? (
          <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-8">
            {/* Invoice Payment Form */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 bg-slate-950/75 shadow-2xl flex flex-col justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-black font-display text-gradient-brand mb-2">
                  {isFa ? "تکمیل و پرداخت صورتحساب" : "Secure Invoice Payment"}
                </h1>
                <p className="text-xs text-[var(--text-muted)] mb-6 leading-relaxed">
                  {isFa
                    ? "لطفاً روش پرداخت ترجیحی خود را انتخاب کرده و مراحل پرداخت امن را تکمیل کنید."
                    : "Please choose your preferred method and fulfill your platform invoice subscription."}
                </p>

                {/* Payment Methods Tabs */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { id: "card", label: isFa ? "کارت شتاب" : "Credit Card", icon: CreditCard },
                    { id: "bank", label: isFa ? "حواله پایا" : "Bank Transfer", icon: Receipt },
                    { id: "crypto", label: isFa ? "رمزارز" : "Crypto Wallet", icon: Wallet },
                  ].map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                          paymentMethod === method.id
                            ? "border-[var(--sky-blue-500)] bg-[var(--sky-blue-500)]/10 text-white shadow-lg shadow-sky-500/5"
                            : "border-white/10 hover:border-white/20 text-slate-400"
                        }`}
                      >
                        <Icon size={18} className={paymentMethod === method.id ? "text-[var(--sky-blue-500)]" : ""} />
                        <span className="text-[10px] font-bold">{method.label}</span>
                      </button>
                    );
                  })}
                </div>

                <form onSubmit={handlePayment} className="space-y-4">
                  {paymentMethod === "card" && (
                    <div className="space-y-4 animate-fade-in">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                          {isFa ? "شماره ۱۶ رقمی کارت" : "Card Number"}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="6104-3377-xxxx-xxxx"
                          className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 focus:border-[var(--sky-blue-500)]/50 focus:bg-white/[0.05] outline-none text-xs font-bold text-white tracking-widest"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            {isFa ? "تاریخ انقضا (ماه/سال)" : "Expiration Date"}
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="05 / 28"
                            className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 focus:border-[var(--sky-blue-500)]/50 focus:bg-white/[0.05] outline-none text-xs text-center font-mono text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            CVV2
                          </label>
                          <input
                            type="password"
                            required
                            placeholder="•••"
                            className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 focus:border-[var(--sky-blue-500)]/50 focus:bg-white/[0.05] outline-none text-xs text-center font-mono text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                          {isFa ? "رمز اینترنتی (پویا)" : "Internet Password / OTP"}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            placeholder="••••••"
                            className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 focus:border-[var(--sky-blue-500)]/50 focus:bg-white/[0.05] outline-none text-xs font-mono text-white"
                          />
                          <button
                            type="button"
                            className="absolute end-2 top-1.5 px-3 py-1.5 rounded-lg bg-[var(--sky-blue-500)]/20 hover:bg-[var(--sky-blue-500)]/30 text-[var(--sky-blue-500)] text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            {isFa ? "درخواست رمز پویا" : "Request OTP"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "bank" && (
                    <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-3 animate-fade-in text-xs leading-relaxed text-slate-300">
                      <p className="font-bold text-[var(--sky-blue-500)]">
                        {isFa ? "حساب بانکی مقصد جهت حواله پایا/ساتنا:" : "Destination Corporate Bank Account:"}
                      </p>
                      <div className="space-y-1.5 font-mono">
                        <p>{isFa ? "بانک: بانک سامان" : "Bank: Saman Bank"}</p>
                        <p>{isFa ? "شماره شبا: IR98-0560-0012-3456-7890-1234-56" : "IBAN: IR98-0560-0012-3456-7890-1234-56"}</p>
                        <p>{isFa ? "نام صاحب حساب: هلدینگ سئورچبل (پارس وب)" : "Beneficiary: seorchable.ir Technologies Ltd."}</p>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        {isFa
                          ? "پس از واریز، شناسه رهگیری را ثبت کنید تا اشتراک شما حداکثر ظرف ۱ ساعت فعال شود."
                          : "Upload or specify transaction ID below for manual confirmation."}
                      </p>
                      <input
                        type="text"
                        placeholder={isFa ? "شماره فیش / شناسه رهگیری پرداخت" : "Transaction Ref ID"}
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 focus:border-[var(--sky-blue-500)]/50 focus:bg-white/[0.05] outline-none text-xs text-white"
                      />
                    </div>
                  )}

                  {paymentMethod === "crypto" && (
                    <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-4 animate-fade-in text-xs leading-relaxed text-slate-300">
                      <p className="font-bold text-[var(--orange-500)]">
                        {isFa ? "پرداخت امن با رمزارز (USDT-TRC20):" : "Secure USDT-TRC20 Wallet Address:"}
                      </p>
                      <div className="p-3 rounded-lg bg-black/40 border border-white/10 font-mono break-all text-center text-[10px] select-all text-orange-400">
                        TX89aBv7XmP11h87qWzL2oQ9kR33tP55yZ
                      </div>
                      <p className="text-[10px] text-slate-500">
                        {isFa
                          ? "معادل دقیق صورتحساب را به آدرس بالا ارسال کرده و هش تراکنش (TxHash) را وارد نمایید."
                          : "Transfer exact USDT amount to wallet above and insert TxHash below."}
                      </p>
                      <input
                        type="text"
                        placeholder="TxHash / Transaction ID"
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 focus:border-[var(--sky-blue-500)]/50 focus:bg-white/[0.05] outline-none text-xs text-white font-mono"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-3.5 mt-4 rounded-xl font-bold text-sm bg-gradient-to-r from-[#38bdf8] to-[#f97316] text-white shadow-xl shadow-sky-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        <span>{isFa ? "در حال پردازش تراکنش..." : "Processing Transaction..."}</span>
                      </span>
                    ) : (
                      <span>
                        {isFa
                          ? `پرداخت نهایی ${isFa ? invoiceData.totalFa : `$${invoiceData.total}`}`
                          : `Pay Invoice Total: $${invoiceData.total}`}
                      </span>
                    )}
                  </button>
                </form>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 text-[10px] text-slate-500">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>
                  {isFa
                    ? "تمام تراکنش‌ها تحت پروتکل SSL ۲۵۶ بیتی به طور کامل رمزنگاری می‌شوند."
                    : "Transactions secured with AES-256 bit corporate-grade encryption."}
                </span>
              </div>
            </div>

            {/* Invoice Bill Statement Card */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-md shadow-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                  <div className="flex items-center gap-2">
                    <Receipt size={20} className="text-[var(--sky-blue-500)]" />
                    <span className="font-extrabold text-xs tracking-wider uppercase">{isFa ? "صورتحساب رسمی" : "STATEMENT OF ACCOUNT"}</span>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded bg-[#f97316]/10 text-[#f97316] font-bold">
                    {isFa ? "در انتظار پرداخت" : "UNPAID"}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 text-xs">
                    <span className="text-slate-400">{isFa ? "شناسه صورتحساب:" : "Invoice ID:"}</span>
                    <span className="font-mono font-bold text-end text-white">{invoiceData.id}</span>
                  </div>
                  <div className="grid grid-cols-2 text-xs">
                    <span className="text-slate-400">{isFa ? "تاریخ صدور:" : "Issue Date:"}</span>
                    <span className="text-end text-white">{invoiceData.date}</span>
                  </div>
                  <div className="grid grid-cols-2 text-xs">
                    <span className="text-slate-400">{isFa ? "مهلت پرداخت:" : "Due Date:"}</span>
                    <span className="text-end text-rose-400 font-bold">{invoiceData.dueDate}</span>
                  </div>

                  <div className="h-px bg-white/10 my-4" />

                  <div className="space-y-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{isFa ? "شرح اشتراک" : "Description of Services"}</span>
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                      <p className="text-xs font-bold text-white">{invoiceData.plan}</p>
                      <p className="text-[10px] text-slate-400">
                        {isFa
                          ? "دسترسی نامحدود سالانه به ابزارهای تحلیل AEO، GEO و رصد رقابتی"
                          : "Annual unlimited license to AEO tools, entity graphs, and competitor radar."}
                      </p>
                    </div>
                  </div>

                  <div className="h-px bg-white/10 my-4" />

                  {/* Pricing calculations */}
                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-2">
                      <span className="text-slate-400">{isFa ? "مبلغ اولیه:" : "Subtotal:"}</span>
                      <span className="text-end text-white font-mono">{isFa ? invoiceData.amountFa : `$${invoiceData.amount}`}</span>
                    </div>
                    <div className="grid grid-cols-2 text-rose-400">
                      <span className="text-rose-400">{isFa ? "تخفیف طرح:" : "Plan Discount:"}</span>
                      <span className="text-end font-mono">-{isFa ? invoiceData.discountFa : `$${invoiceData.discount}`}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-slate-400">{isFa ? "مالیات بر ارزش افزوده (۹٪):" : "Tax (9%):"}</span>
                      <span className="text-end text-white font-mono">{isFa ? invoiceData.taxFa : `$${invoiceData.tax}`}</span>
                    </div>
                    <div className="h-px bg-white/10 my-2" />
                    <div className="grid grid-cols-2 text-sm font-black text-white">
                      <span className="text-[var(--sky-blue-500)]">{isFa ? "مبلغ قابل پرداخت:" : "Total Amount Due:"}</span>
                      <span className="text-end text-gradient-brand font-mono">{isFa ? invoiceData.totalFa : `$${invoiceData.total}`}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-[9px] text-slate-500 text-center leading-normal">
                {isFa
                  ? "پرداخت‌های سالانه شامل گارانتی ۱۰۰٪ بازگشت وجه به مدت ۱۴ روز در صورت انصراف می‌باشد."
                  : "Annual corporate subscriptions include a 14-day hassle-free full money-back guarantee."}
              </div>
            </div>
          </div>
        ) : (
          /* Payment Success View */
          <div className="glass-panel max-w-xl mx-auto p-8 rounded-3xl border border-emerald-500/20 bg-slate-950/85 shadow-2xl text-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-2">
              <CheckCircle2 size={36} />
            </div>

            <h1 className="text-2xl font-black text-white font-display">
              {isFa ? "پرداخت با موفقیت انجام شد!" : "Payment Successfully Processed!"}
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
              {isFa
                ? "تراکنش مالی شما تأیید شد و صورتحساب با موفقیت پرداخت گردید. لایسنس کاربری شما به مدت ۱ سال تمدید شد."
                : "Your transaction has been approved. The system successfully updated your platform subscription status."}
            </p>

            {/* Invoice Details Sheet */}
            <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] text-xs space-y-3 font-medium text-start">
              <div className="grid grid-cols-2 pb-2 border-b border-white/5">
                <span className="text-slate-400">{isFa ? "شناسه تراکنش:" : "Transaction Hash:"}</span>
                <span className="text-end font-mono text-white text-[10px] break-all">tx_88a91c0ffae991b1ad90011c778faef</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-slate-400">{isFa ? "صورتحساب مرجع:" : "Invoice Reference:"}</span>
                <span className="text-end text-white font-mono">{invoiceData.id}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-slate-400">{isFa ? "مبلغ نهایی پرداخت شده:" : "Paid Amount:"}</span>
                <span className="text-end text-emerald-400 font-bold font-mono">{isFa ? invoiceData.totalFa : `$${invoiceData.total}`}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-slate-400">{isFa ? "روش پرداخت:" : "Method:"}</span>
                <span className="text-end text-white font-bold">
                  {paymentMethod === "card" && (isFa ? "کارت شتاب" : "Credit Card")}
                  {paymentMethod === "bank" && (isFa ? "حواله پایا" : "Bank Transfer")}
                  {paymentMethod === "crypto" && (isFa ? "USDT (TRC20)" : "Crypto")}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 justify-center pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer bg-slate-900/50"
              >
                <Printer size={14} />
                <span>{isFa ? "چاپ رسید" : "Print Receipt"}</span>
              </button>
              <button
                onClick={() => {}}
                className="px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer bg-slate-900/50"
              >
                <Download size={14} />
                <span>{isFa ? "دانلود PDF" : "Download PDF"}</span>
              </button>
            </div>

            <div className="pt-4 border-t border-white/10 mt-6">
              <Link
                href={`/${locale}/dashboard`}
                className="inline-flex items-center gap-2 text-xs font-bold px-6 py-3 rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#f97316] text-white hover:opacity-95 shadow-lg shadow-sky-500/10 cursor-pointer"
              >
                <span>{isFa ? "ورود به پیشخوان کاربری" : "Enter Console Dashboard"}</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
