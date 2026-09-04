"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";
import { SeorchableLogo } from "@/components/marketing/SeorchableLogo";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle, Mail, KeyRound } from "lucide-react";

export default function ForgotPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = use(params);
  const locale = resolvedParams.locale;
  const isFa = locale === "fa";

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const strings = {
    title: isFa ? "بازیابی رمز عبور" : "Reset Your Password",
    desc: isFa ? "ایمیل سازمانی خود را وارد کنید تا لینک بازیابی رمز عبور برای شما ارسال شود." : "Enter your corporate email to receive security reset instructions.",
    emailLabel: isFa ? "آدرس ایمیل ثبت‌نام شده" : "Registered Email Address",
    emailPlaceholder: isFa ? "name@company.com" : "name@company.com",
    submitBtn: isFa ? "ارسال لینک بازیابی" : "Send Reset Instructions",
    loading: isFa ? "در حال ارسال ایمیل..." : "Sending email...",
    backToLogin: isFa ? "بازگشت به صفحه ورود" : "Back to sign in",
    successTitle: isFa ? "ایمیل بازیابی ارسال شد" : "Reset Link Sent",
    successDesc: isFa
      ? `اگر ایمیل ${email} در سیستم ثبت شده باشد، دستورالعمل‌های بازیابی رمز عبور را ظرف چند دقیقه دریافت خواهید کرد.`
      : `If ${email} is registered with us, a secure password recovery message has been sent.`,
    checkSpam: isFa ? "لطفاً پوشه Spam یا Junk ایمیل خود را نیز بررسی کنید." : "Be sure to check your spam/junk folder if it doesn't arrive.",
  };

  const validateForm = () => {
    if (!email) {
      setEmailError(isFa ? "وارد کردن ایمیل الزامی است." : "Email is required.");
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError(isFa ? "لطفاً یک ایمیل معتبر وارد کنید." : "Please enter a valid email address.");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Simulate backend reset call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsSuccess(true);
    } catch (err: unknown) {
      setSubmitError(isFa ? "خطایی رخ داد. مجدداً تلاش کنید." : "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-[var(--background)] relative overflow-hidden" style={{ direction: isFa ? "rtl" : "ltr" }}>
      {/* Decorative Gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--sky-blue-500)]/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--orange-500)]/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute inset-0 grid-backdrop opacity-[0.2] pointer-events-none -z-10" />

      {/* Main Container */}
      <div className="w-full max-w-[460px] space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center text-center">
          <Link href={`/${locale}`} className="flex items-center gap-2 group cursor-pointer">
            <SeorchableLogo className="w-10 h-10 group-hover:scale-105 transition-transform duration-300" />
            <span className="font-display font-black text-xl bg-gradient-to-r from-[var(--sky-blue-500)] to-[var(--orange-500)] bg-clip-text text-transparent">
              {isFa ? "سئورچبل" : "seorchable.ir"}
            </span>
          </Link>
        </div>

        {/* Card */}
        <Card className="glass-panel border border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-2xl rounded-3xl p-2 sm:p-4 animate-fade-in">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-black font-display text-[var(--text-primary)]">
              {isSuccess ? strings.successTitle : strings.title}
            </CardTitle>
            <CardDescription className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed mt-1">
              {isSuccess ? strings.successDesc : strings.desc}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="space-y-6 pt-4 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                  <CheckCircle size={28} />
                </div>
                <p className="text-[11px] text-[var(--text-muted)] font-medium bg-white/5 p-3 rounded-xl border border-white/5">
                  {strings.checkSpam}
                </p>
                <div className="pt-2 border-t border-[var(--border)]">
                  <Link href={`/${locale}/login`} className="w-full">
                    <Button variant="secondary" className="w-full text-xs py-2.5">
                      {strings.backToLogin}
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {submitError && (
                  <div className="p-3.5 rounded-xl border border-[var(--color-error)]/25 bg-[var(--color-error)]/10 text-[var(--color-error)] text-xs flex items-start gap-2 animate-shake">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <p className="font-bold">{submitError}</p>
                  </div>
                )}

                {/* Email Input */}
                <Input
                  type="email"
                  label={strings.emailLabel}
                  placeholder={strings.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={emailError}
                  disabled={isLoading}
                  required
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading}
                  className="w-full py-3 mt-2 rounded-xl text-xs font-black flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>{strings.loading}</span>
                    </>
                  ) : (
                    <>
                      <KeyRound size={15} />
                      <span>{strings.submitBtn}</span>
                    </>
                  )}
                </Button>

                {/* Return to Login */}
                <div className="pt-4 border-t border-[var(--border)] text-center">
                  <Link
                    href={`/${locale}/login`}
                    className="text-xs text-[var(--sky-blue-500)] hover:text-[var(--orange-500)] transition-colors font-bold"
                  >
                    {strings.backToLogin}
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
