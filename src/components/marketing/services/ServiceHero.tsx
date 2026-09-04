import React from "react";
import { Hero } from "@/types/services";
import { Sparkles, ArrowRight } from "lucide-react";

interface ServiceHeroProps {
  data: Hero;
  isFa: boolean;
}

export const ServiceHero: React.FC<ServiceHeroProps> = ({ data, isFa }) => {
  return (
    <section className="relative pt-32 pb-24 overflow-hidden">
      <div className="absolute top-1/4 right-1/4 w-[35vw] h-[35vw] bg-gradient-to-br from-[#38bdf8]/15 to-[#f97316]/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute inset-0 grid-backdrop opacity-[0.25] pointer-events-none -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 relative z-10 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-xs font-bold text-sky-400">
          <Sparkles size={12} className="animate-pulse" />
          <span>{isFa ? "خدمات سئورچبل" : "Seorchable Services"}</span>
        </span>
        <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl text-gradient-brand">
          {isFa ? data.title.fa : data.title.en}
        </h1>
        <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto">
          {isFa ? data.subtitle.fa : data.subtitle.en}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <button className="h-12 px-8 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-sky-500/25 flex items-center gap-2 w-full sm:w-auto justify-center group">
            {isFa ? data.ctaText.fa : data.ctaText.en}
            <ArrowRight size={16} className={`transition-transform ${isFa ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1"}`} />
          </button>
        </div>

        <div className="mt-16 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-3xl p-8 flex items-center justify-center min-h-[300px]">
           <span className="text-[var(--text-muted)] text-xl font-medium">{data.visualPlaceholder}</span>
        </div>
      </div>
    </section>
  );
};
