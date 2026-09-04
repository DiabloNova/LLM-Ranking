"use client";

import React from "react";
import { useTheme } from "@/components/ThemeProvider";
import { BrandLogo } from "./BrandLogo";

const platforms = [
  { slug: "openai", label: "OpenAI · ChatGPT" },
  { slug: "google-gemini", label: "Google Gemini" },
  { slug: "claude", label: "Anthropic Claude" },
  { slug: "perplexity", label: "Perplexity" },
  { slug: "anthropic", label: "Anthropic" },
];

/**
 * Trust strip: a paused-on-hover marquee of the AI engines the platform
 * monitors, rendered as uniform monochrome marks.
 */
export function PlatformsSection() {
  const { language } = useTheme();
  const isFa = language === "fa";
  const loop = [...platforms, ...platforms];

  return (
    <section id="platforms" className="py-14 md:py-16 border-y border-[var(--border)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)] mb-8">
          {isFa
            ? "پایش برند شما در موتورهای پیشرو هوش مصنوعی"
            : "Monitoring your brand across the leading AI engines"}
        </p>

        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          <div className="marquee-track py-2" dir="ltr">
            {loop.map((p, i) => (
              <span
                key={`${p.slug}-${i}`}
                className="mx-7 flex items-center gap-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0"
              >
                <BrandLogo slug={p.slug} label={p.label} className="h-7 w-7" />
                <span className="text-sm font-semibold whitespace-nowrap">{p.label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
