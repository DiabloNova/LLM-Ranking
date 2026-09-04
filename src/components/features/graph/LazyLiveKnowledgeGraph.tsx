"use client";

import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import { Info, Loader2 } from "lucide-react";

const LiveKnowledgeGraph = lazy(() => import("./LiveKnowledgeGraph").then((module) => ({ default: module.LiveKnowledgeGraph })));

export function LazyLiveKnowledgeGraph() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShouldLoad(true);
        observer.disconnect();
      }
    }, { rootMargin: "240px 0px" });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={hostRef} className="relative" aria-label="Illustrative knowledge graph">
      <div className="absolute top-0 end-0 z-20 inline-flex items-center gap-1.5 rounded-full border border-sky-400/25 bg-sky-400/10 px-3 py-1 text-[10px] font-bold text-sky-200" title="This visualization uses a curated, non-production dataset.">
        <Info size={12} aria-hidden="true" />
        <span>Illustrative sample data</span>
      </div>
      {!shouldLoad ? (
        <div className="min-h-[380px] rounded-3xl border border-white/10 bg-slate-950/70 flex items-center justify-center text-slate-400 text-xs" role="status">
          <span className="inline-flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Graph loads when visible</span>
        </div>
      ) : (
        <Suspense fallback={<div className="min-h-[380px] rounded-3xl bg-slate-950/70" role="status" />}>
          <LiveKnowledgeGraph />
        </Suspense>
      )}
    </div>
  );
}
