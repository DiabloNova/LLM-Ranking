import React from "react";
import { ServicePageData } from "@/types/services";
import { ArrowRight, Sparkles } from "lucide-react";

interface ServiceCTAProps {
  data: ServicePageData;
  isFa: boolean;
}

export const ServiceCTA: React.FC<ServiceCTAProps> = ({ data, isFa }) => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="glass-panel p-8 sm:p-12 md:p-16 rounded-[2.5rem] border border-[var(--glass-border)] bg-[var(--glass-bg)] text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#38bdf8]/10 to-transparent rounded-bl-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-[#f97316]/10 to-transparent rounded-tr-full pointer-events-none" />

          <div className="relative z-10 space-y-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 mb-2">
              <Sparkles size={32} />
            </div>
            <div className="space-y-4">
              <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-gradient-brand">
                {isFa ? data.ctaTitle.fa : data.ctaTitle.en}
              </h2>
              <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto font-medium">
                {isFa ? data.ctaSubtitle.fa : data.ctaSubtitle.en}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
               <button className="h-14 px-8 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-sky-500/25 flex items-center gap-2 w-full sm:w-auto justify-center group">
                 {isFa ? data.ctaButtonText.fa : data.ctaButtonText.en}
                 <ArrowRight size={18} className={`transition-transform ${isFa ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1"}`} />
               </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
