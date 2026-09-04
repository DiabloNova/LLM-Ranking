/**
 * Bilingual (fa / en) copy for the marketing landing page.
 * Farsi is the primary experience; English mirrors it for the LTR locale.
 */

export type Lang = "fa" | "en";

export const marketingContent = {
  brand: {
    fa: "seorchable.ir",
    en: "seorchable.ir",
  },
  nav: {
    features: { fa: "قابلیت‌ها", en: "Features" },
    platforms: { fa: "موتورها", en: "Engines" },
    process: { fa: "فرآیند", en: "How it works" },
    metrics: { fa: "دستاوردها", en: "Impact" },
  },
  cta: {
    workspace: { fa: "ورود به میز کار", en: "Go to Workspace" },
    console: { fa: "ورود به پیشخوان کاربری", en: "Enter Console" },
    demo: { fa: "درخواست دمو", en: "Request a demo" },
  },
} as const;
