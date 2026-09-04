import React from "react";
import { Insight } from "@/types/services";
import { TrendingUp } from "lucide-react";

interface ServiceInsightsProps {
  insights: Insight[];
  isFa: boolean;
}

export const ServiceInsights: React.FC<ServiceInsightsProps> = ({ insights, isFa }) => {
  if (!insights || insights.length === 0) return null;

  return (
    <section className="py-24 bg-[var(--background)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-display font-black text-3xl sm:text-4xl text-[var(--text-primary)]">
             {isFa ? "دستاوردها و بینش‌ها" : "Insights & Outcomes"}
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {insights.map((insight) => (
            <div key={insight.id} className="glass-panel p-6 sm:p-8 rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-bg)] space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                  <TrendingUp size={20} />
                </div>
                {insight.metric && (
                  <span className="text-xl font-black text-gradient-brand font-display">
                    {isFa ? insight.metric.fa : insight.metric.en}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold font-display text-[var(--text-primary)]">
                {isFa ? insight.title.fa : insight.title.en}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-medium">
                {isFa ? insight.description.fa : insight.description.en}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
