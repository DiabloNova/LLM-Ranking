import React from "react";
import { WorkflowStep } from "@/types/services";


interface ServiceWorkflowProps {
  workflow: WorkflowStep[];
  isFa: boolean;
}

export const ServiceWorkflow: React.FC<ServiceWorkflowProps> = ({ workflow, isFa }) => {
  return (
    <section className="py-24 bg-[var(--background)] relative overflow-hidden">
       <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display font-black text-3xl sm:text-4xl text-[var(--text-primary)]">
               {isFa ? "فرآیند اجرا" : "How It Works"}
            </h2>
          </div>
          <div className="space-y-6 max-w-3xl mx-auto">
            {workflow.sort((a,b)=>a.order - b.order).map((step) => (
               <div key={step.id} className="glass-panel p-6 sm:p-8 rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-bg)] flex items-start gap-4 sm:gap-6 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-bl-full pointer-events-none" />
                   <div className="shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-sky-500/25">
                     {step.order}
                   </div>
                   <div className="space-y-2">
                       <h3 className="text-xl font-bold font-display text-[var(--text-primary)]">
                         {isFa ? step.title.fa : step.title.en}
                       </h3>
                       <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-medium">
                         {isFa ? step.description.fa : step.description.en}
                       </p>
                   </div>
               </div>
            ))}
          </div>
       </div>
    </section>
  );
};
