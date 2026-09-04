"use client";

import React, { use, useState } from "react";
import { Header } from "@/components/marketing/Header";
import { LandingFooter } from "@/components/marketing/LandingFooter";
import AppSidebar from "@/components/navigation/AppSidebar";
import { Sparkles, Mail, MapPin, Phone, Send } from "lucide-react";

export default function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = use(params);
  const locale = resolvedParams.locale;
  const isFa = locale === "fa";

  const [formState, setFormState] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setFormState({ name: "", email: "", message: "" });
    }, 4000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--text-primary)]" style={{ direction: isFa ? "rtl" : "ltr" }}>
      <AppSidebar />
      <Header />

      <main className="flex-1 pt-32 pb-24 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-1/4 right-1/4 w-[35vw] h-[35vw] bg-gradient-to-br from-[#38bdf8]/15 to-[#f97316]/5 rounded-full blur-[100px] pointer-events-none -z-10" />
        <div className="absolute inset-0 grid-backdrop opacity-[0.25] pointer-events-none -z-10" />

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
          <div className="text-center space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-xs font-bold text-sky-400">
              <Sparkles size={12} className="animate-pulse" />
              <span>{isFa ? "تماس با ما" : "Contact Us"}</span>
            </span>
            <h1 className="font-display font-black text-4xl sm:text-5xl text-gradient-brand">
              {isFa ? "با کارشناسان ما گفتگو کنید" : "Get in Touch"}
            </h1>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto">
              {isFa
                ? "برای دریافت مشاوره‌ی تخصصی درباره‌ی نحوه‌ی ارتقای رتبه و سهم صدای برند خود در هوش مصنوعی، با ما در تماس باشید."
                : "Questions about Answer Engine Optimization? Reach out to our specialist team for customized support."}
            </p>
          </div>

          <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-8 pt-6">
            {/* Contact Form */}
            <div className="glass-panel p-8 rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-xl">
              <h3 className="text-xl font-bold mb-6 font-display">{isFa ? "ارسال پیام مستقیم" : "Send a Direct Message"}</h3>
              {sent ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold text-center">
                  {isFa ? "پیام شما با موفقیت ارسال شد. به زودی با شما تماس می‌گیریم!" : "Your message has been successfully sent. We'll reply soon!"}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">{isFa ? "نام کامل" : "Full Name"}</label>
                    <input
                      type="text"
                      required
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--muted-surface)]/20 text-xs text-white focus:outline-none focus:border-[#38bdf8] transition-colors"
                      placeholder={isFa ? "مثال: علی محمدی" : "e.g. John Doe"}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">{isFa ? "پست الکترونیک" : "Email Address"}</label>
                    <input
                      type="email"
                      required
                      value={formState.email}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--muted-surface)]/20 text-xs text-white focus:outline-none focus:border-[#38bdf8] transition-colors"
                      placeholder="name@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">{isFa ? "متن پیام شما" : "Your Message"}</label>
                    <textarea
                      rows={4}
                      required
                      value={formState.message}
                      onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--muted-surface)]/20 text-xs text-white focus:outline-none focus:border-[#38bdf8] transition-colors resize-none"
                      placeholder={isFa ? "پیام خود را بنویسید..." : "Write your message here..."}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#f97316] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <Send size={14} className="rtl:-scale-x-100" />
                    <span>{isFa ? "ارسال پیام" : "Send Message"}</span>
                  </button>
                </form>
              )}
            </div>

            {/* Side Coordinates */}
            <div className="space-y-6">
              <div className="glass-panel p-6 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] space-y-4">
                <h4 className="text-md font-bold font-display">{isFa ? "راه‌های ارتباطی" : "Contact Details"}</h4>
                <div className="space-y-4 text-xs font-bold">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#38bdf8]/10 border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8]">
                      <Mail size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)]">{isFa ? "ایمیل رسمی" : "Official Email"}</p>
                      <p className="text-[var(--text-primary)]">support@seorchable.ir</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#f97316]/10 border border-[#f97316]/30 flex items-center justify-center text-[#f97316]">
                      <Phone size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)]">{isFa ? "تلفن پشتیبانی" : "Support Hotline"}</p>
                      <p className="text-[var(--text-primary)]" dir="ltr">+۹۸ (۲۱) ۸۸۸۸-۹۹۹۹</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)]">{isFa ? "نشانی مرکز" : "Our Office"}</p>
                      <p className="text-[var(--text-primary)] leading-normal">
                        {isFa ? "تهران، پارک فناوری، ساختمان سئورچبل" : "seorchable Building, Tech Park, Tehran, Iran"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
