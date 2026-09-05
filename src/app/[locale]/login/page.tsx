"use client";

import React, { useState, use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";
import { SeorchableLogo } from "@/components/marketing/SeorchableLogo";
import { AlertCircle, ArrowLeft, ArrowRight, LogIn, Mail, ShieldAlert } from "lucide-react";
import { readCheckoutIntent, normalizePlan, clearCheckoutIntent } from "@/lib/checkout-intent";

export default function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = use(params);
  const locale = resolvedParams.locale;
  const isFa = locale === "fa";
  const router = useRouter();
  const { login, session } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<string | null>(null);

  useEffect(() => {
    const plan = normalizePlan(new URLSearchParams(window.location.search).get("plan")) || readCheckoutIntent()?.plan;
    setCheckoutPlan(plan ?? null);
  }, []);

  // Strings translations
  const strings = {
    title: isFa ? "ورود به سیستم هوشمند" : "Sign In to Seorchable",
    desc: isFa ? "برای دسترسی به پیشخوان تحلیل دیده‌شدن برند خود وارد شوید." : "Access your B2B enterprise AI visibility dashboard.",
    emailLabel: isFa ? "آدرس ایمیل سازمانی" : "Enterprise Email Address",
    emailPlaceholder: isFa ? "name@company.com" : "name@company.com",
    passwordLabel: isFa ? "رمز عبور" : "Password",
    passwordPlaceholder: isFa ? "••••••••" : "••••••••",
    loginBtn: isFa ? "ورود به حساب کاربری" : "Sign In to Account",
    loading: isFa ? "در حال اعتبارسنجی..." : "Authenticating...",
    forgotPassword: isFa ? "رمز عبور را فراموش کرده‌اید؟" : "Forgot your password?",
    noAccount: isFa ? "هنوز ثبت‌نام نکرده‌اید؟" : "New to the platform?",
    registerLink: isFa ? "ایجاد حساب کاربری سازمانی" : "Create enterprise account",
    orOAuth: isFa ? "یا استفاده از ورود یکپارچه (OAuth)" : "Or connect via Single Sign-On",
    oauthGoogle: isFa ? "ورود یکپارچه با گوگل (Google)" : "Continue with Google Workspace",
    oauthMicrosoft: isFa ? "ورود یکپارچه با مایکروسافت" : "Continue with Microsoft Entra",
    validationEmailInvalid: isFa ? "لطفاً یک ایمیل معتبر وارد کنید." : "Please enter a valid email address.",
    validationPasswordRequired: isFa ? "وارد کردن رمز عبور الزامی است." : "Password is required.",
    validationPasswordLength: isFa ? "رمز عبور باید حداقل ۶ کاراکتر باشد." : "Password must be at least 6 characters.",
    backToHome: isFa ? "بازگشت به صفحه اصلی" : "Back to landing page",
  };

  const validateForm = () => {
    let isValid = true;

    // Email validation
    if (!email) {
      setEmailError(isFa ? "وارد کردن ایمیل الزامی است." : "Email is required.");
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError(strings.validationEmailInvalid);
      isValid = false;
    } else {
      setEmailError("");
    }

    // Password validation
    if (!password) {
      setPasswordError(strings.validationPasswordRequired);
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError(strings.validationPasswordLength);
      isValid = false;
    } else {
      setPasswordError("");
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await login(email, password);
      const intent = readCheckoutIntent();
      if (checkoutPlan && intent?.plan === checkoutPlan) {
        clearCheckoutIntent();
        router.push(`/${locale}/invoice?plan=${checkoutPlan}`);
      } else {
        router.push(`/${locale}/dashboard`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSubmitError(isFa ? "آدرس ایمیل یا رمز عبور نامعتبر است." : "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // OAuth integration placeholder triggers
  const handleOAuthClick = (provider: string) => {
    // Under active architecture - OAuth will link directly to backend SSO redirect
    alert(isFa
      ? `لایه اتصال یکپارچه ${provider} آماده است. در فاز بعدی به سرویس بک‌اند متصل خواهد شد.`
      : `${provider} SSO integration layer ready. Connecting to backend identity service in the next phase.`
    );
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-[var(--background)] relative overflow-hidden" style={{ direction: isFa ? "rtl" : "ltr" }}>
      {/* Decorative Signature Gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--sky-blue-500)]/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--orange-500)]/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute inset-0 grid-backdrop opacity-[0.2] pointer-events-none -z-10" />

      {/* Main Container */}
      <div className="w-full max-w-[460px] space-y-6">
        {/* Brand Logo & Heading */}
        <div className="flex flex-col items-center text-center space-y-3">
          <Link href={`/${locale}`} className="flex items-center gap-2 group cursor-pointer">
            <SeorchableLogo className="w-10 h-10 group-hover:scale-105 transition-transform duration-300" glow={true} />
            <span className="font-display font-black text-xl bg-gradient-to-r from-[var(--sky-blue-500)] to-[var(--orange-500)] bg-clip-text text-transparent">
              {isFa ? "سئورچبل" : "seorchable.ir"}
            </span>
          </Link>
        </div>

        {/* Card */}
        <Card className="glass-panel border border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-2xl rounded-3xl p-2 sm:p-4">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-black font-display text-[var(--text-primary)]">{strings.title}</CardTitle>
            <CardDescription className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed mt-1">
              {strings.desc}
            </CardDescription>
          </CardHeader>
          <CardContent>
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

              {/* Password Input */}
              <div className="space-y-1">
                <Input
                  type="password"
                  label={strings.passwordLabel}
                  placeholder={strings.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={passwordError}
                  disabled={isLoading}
                  required
                />
                <div className="flex justify-end pt-1">
                  <Link
                    href={`/${locale}/forgot-password`}
                    className="text-xs text-[var(--text-muted)] hover:text-[var(--sky-blue-500)] transition-colors font-semibold"
                  >
                    {strings.forgotPassword}
                  </Link>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
                className="w-full py-3 mt-2 rounded-xl text-xs font-black shadow-lg shadow-sky-500/10 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>{strings.loading}</span>
                  </>
                ) : (
                  <>
                    <LogIn size={15} />
                    <span>{strings.loginBtn}</span>
                  </>
                )}
              </Button>
            </form>

            {/* SSO / OAuth Separation Layer */}
            <div className="mt-6 space-y-4">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--border)]" />
                </div>
                <span className="relative px-3 text-[10px] font-bold uppercase tracking-widest bg-[var(--background)] text-[var(--text-muted)]">
                  {strings.orOAuth}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {/* Google Button */}
                <button
                  onClick={() => handleOAuthClick("Google")}
                  type="button"
                  className="w-full py-2.5 px-4 rounded-xl border border-[var(--border)] hover:border-[var(--sky-blue-500)]/50 bg-[var(--muted-surface)] hover:bg-[var(--background)] text-xs font-bold text-[var(--text-primary)] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  <span>{strings.oauthGoogle}</span>
                </button>

                {/* Microsoft Button */}
                <button
                  onClick={() => handleOAuthClick("Microsoft")}
                  type="button"
                  className="w-full py-2.5 px-4 rounded-xl border border-[var(--border)] hover:border-[var(--sky-blue-500)]/50 bg-[var(--muted-surface)] hover:bg-[var(--background)] text-xs font-bold text-[var(--text-primary)] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  {/* Custom Microsoft Icon representation */}
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="11" height="11" fill="#F25022"/>
                    <rect x="12" width="11" height="11" fill="#7FBA00"/>
                    <rect y="12" width="11" height="11" fill="#00A1F1"/>
                    <rect x="12" y="12" width="11" height="11" fill="#FFB900"/>
                  </svg>
                  <span>{strings.oauthMicrosoft}</span>
                </button>
              </div>
            </div>

            {/* Register redirection option */}
            <div className="mt-6 pt-4 border-t border-[var(--border)] text-center text-xs font-bold">
              <span className="text-[var(--text-muted)] mr-1">{strings.noAccount}</span>
              <Link
                href={`/${locale}/register${checkoutPlan ? `?plan=${checkoutPlan}&next=invoice` : ""}`}
                className="text-[var(--sky-blue-500)] hover:text-[var(--orange-500)] hover:underline transition-colors"
              >
                {strings.registerLink}
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home CTA */}
        <div className="text-center">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors font-bold cursor-pointer"
          >
            {isFa ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
            <span>{strings.backToHome}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
