import React from "react";
import { Capability } from "@/types/services";
import * as Icons from "lucide-react";

interface ServiceCapabilitiesProps {
  capabilities: Capability[];
  isFa: boolean;
}

export const ServiceCapabilities: React.FC<ServiceCapabilitiesProps> = ({ capabilities, isFa }) => {
  return (
    <section className="py-24 bg-[var(--background)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-display font-black text-3xl sm:text-4xl text-[var(--text-primary)]">
             {isFa ? "قابلیت‌های کلیدی" : "Key Capabilities"}
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((cap) => {
            const Icon = ((Icons as unknown) as Record<string, React.ElementType>)[cap.iconName] || Icons.CheckCircle;
            return (
              <div key={cap.id} className="glass-panel p-6 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] space-y-4 hover:border-sky-500/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Icon size={24} />
                </div>
                <h3 className="text-lg font-bold font-display text-[var(--text-primary)]">
                  {isFa ? cap.title.fa : cap.title.en}
                </h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed font-medium">
                  {isFa ? cap.description.fa : cap.description.en}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
