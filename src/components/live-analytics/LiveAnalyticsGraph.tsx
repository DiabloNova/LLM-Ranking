"use client";

import React, { useEffect, useRef, useState } from "react";
import { LiveDataAdapter, IDataAdapter } from "./DataAdapter";
import { GraphEngine } from "./GraphEngine";
import { CanvasRenderer } from "./CanvasRenderer";
import { Legend } from "./Legend";
import { Tooltip } from "./Tooltip";
import { MetricSeries, TooltipState, LegendItem } from "./types";

interface LiveAnalyticsGraphProps {
  language?: "en" | "fa";
}

export const LiveAnalyticsGraph: React.FC<LiveAnalyticsGraphProps> = ({
  language = "fa",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Instantiated engines/adapters preserved across renders
  const engineRef = useRef<GraphEngine | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const adapterRef = useRef<IDataAdapter | null>(null);

  // Use refs for streaming series to prevent React re-renders on every tick
  const seriesRef = useRef<MetricSeries[]>([]);
  const [legendItems, setLegendItems] = useState<LegendItem[]>([]);
  const [tooltip, setTooltip] = useState<TooltipState>({
    active: false,
    x: 0,
    y: 0,
    label: "",
    values: [],
  });

  // Keep track of active legend hover series state to trigger smooth canvas dimming highlights
  const [hoveredSeriesId, setHoveredSeriesId] = useState<string | null>(null);

  // Keep track of visibility states in state for Legend rendering
  const [visibility, setVisibility] = useState<Record<string, boolean>>({
    visibility: true,
    authority: true,
    sentiment: true,
    responseRate: true,
    trustScore: true,
  });

  // Respect prefers-reduced-motion media query
  // Initialize lazily to prevent synchronous state setting in useEffect
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  // Track hover state without triggering re-renders inside frame loop
  const hoverPosRef = useRef<{ x: number; y: number } | null>(null);

  // Keeps mutable refs of states to prevent tearing down the data adapter
  const visibilityRef = useRef(visibility);
  const languageRef = useRef(language);
  const hoveredSeriesIdRef = useRef(hoveredSeriesId);
  const reducedMotionRef = useRef(reducedMotion);

  // Keep refs synchronized on every render
  useEffect(() => {
    visibilityRef.current = visibility;
  }, [visibility]);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    hoveredSeriesIdRef.current = hoveredSeriesId;
  }, [hoveredSeriesId]);

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);

  // Detect prefers-reduced-motion media query modifications
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const listener = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // 1. Initialize logic units
    const engine = new GraphEngine();
    engineRef.current = engine;

    const renderer = new CanvasRenderer(canvas, engine);
    rendererRef.current = renderer;

    const adapter = new LiveDataAdapter();
    adapterRef.current = adapter;

    // 2. Subscribe to streaming data
    const unsubscribe = adapter.subscribe((latestSeries) => {
      seriesRef.current = latestSeries;

      // Sync legend state on initial and subsequent loads with live values
      setLegendItems(() => {
        return latestSeries.map((s) => ({
          id: s.id,
          name: s.name,
          nameFa: s.nameFa,
          color: s.color,
          visible: visibilityRef.current[s.id] ?? true,
          value: s.currentValue,
        }));
      });
    });

    // 3. Setup Responsive Sync & HiDPI scaling with ResizeObserver
    let containerWidth = container.clientWidth || 500;
    let containerHeight = container.clientHeight || 300;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      containerWidth = width || 500;
      containerHeight = height || 300;

      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      renderer.resize(containerWidth, containerHeight, dpr);
    });
    resizeObserver.observe(container);

    // Initial resize call
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    renderer.resize(containerWidth, containerHeight, dpr);

    // 4. Setup periodic updates only if prefers-reduced-motion is NOT active
    const dataUpdateInterval = setInterval(() => {
      if (!reducedMotionRef.current) {
        adapter.updateData(Date.now());
      }
    }, 1000);

    // 5. Start high-performance RAF loop (60+ FPS, Delta-Time Driven)
    let animationId: number;

    const renderLoop = (timestamp: number) => {
      // Calculate delta-time (dt) - tracking loop speed smoothly
      engine.calculateDeltaTime(timestamp);

      // Draw background and clear the canvas
      renderer.drawBackground(containerWidth, containerHeight);

      const currentVisibility = visibilityRef.current;
      const currentLanguage = languageRef.current;
      const currentHoveredId = hoveredSeriesIdRef.current;

      // Apply current visibility toggle states to seriesRef data
      const activeSeries = seriesRef.current.map((s) => ({
        ...s,
        visible: currentVisibility[s.id] ?? true,
      }));

      // Calculate min/max data limits
      const { minTime, maxTime, minValue, maxValue } = engine.getLimits(
        activeSeries.filter((s) => s.visible)
      );

      // Render theme-aware Grid
      renderer.renderGrid(
        containerWidth,
        containerHeight,
        minTime,
        maxTime,
        minValue,
        maxValue,
        currentLanguage === "fa"
      );

      // Render each visible curve with hover dimming controls
      activeSeries.forEach((series) => {
        renderer.renderSeries(
          containerWidth,
          containerHeight,
          series,
          minTime,
          maxTime,
          minValue,
          maxValue,
          currentHoveredId
        );
      });

      // Handle interactive hover point mapping & overlay tooltip calculations
      const hoverPos = hoverPosRef.current;
      if (hoverPos && activeSeries.some((s) => s.visible)) {
        const padding = { top: 30, right: 35, bottom: 40, left: 55 };
        const chartWidth = containerWidth - padding.left - padding.right;

        // Find normalized X ratio of hover position inside chart plot area
        const hoverXRatio = (hoverPos.x - padding.left) / chartWidth;

        if (hoverXRatio >= 0 && hoverXRatio <= 1) {
          const targetTime = minTime + (maxTime - minTime) * hoverXRatio;

          // Find closest data points
          let closestPtIdx = -1;
          let minDiff = Infinity;

          // Use the first visible series to locate index of closest timestamp
          const refSeries = activeSeries.find((s) => s.visible);
          if (refSeries && refSeries.points.length > 0) {
            refSeries.points.forEach((pt, idx) => {
              const diff = Math.abs(pt.timestamp - targetTime);
              if (diff < minDiff) {
                minDiff = diff;
                closestPtIdx = idx;
              }
            });
          }

          if (closestPtIdx !== -1) {
            const samplePoint = refSeries!.points[closestPtIdx];

            // Format precise timestamp: include milliseconds for enterprise precision
            const date = new Date(samplePoint.timestamp);
            const formattedTime = date.toLocaleTimeString(currentLanguage === "fa" ? "fa-IR" : "en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit"
            });
            const milliseconds = (date.getMilliseconds() / 10).toFixed(0).padStart(2, "0");
            const label = `${formattedTime}.${milliseconds}`;

            const values = activeSeries
              .filter((s) => s.visible)
              .map((s) => {
                const pt = s.points[closestPtIdx] || s.points[s.points.length - 1];
                return {
                  id: s.id,
                  name: s.name,
                  nameFa: s.nameFa,
                  value: pt.value,
                  color: s.color,
                  trend: s.trend,
                };
              });

            // Map sample point X position to chart area
            const mappedPos = engine.mapToPixel(
              samplePoint.timestamp,
              samplePoint.value,
              minTime,
              maxTime,
              minValue,
              maxValue,
              containerWidth,
              containerHeight,
              padding
            );

            // Draw interactive vertical crosshairs at snapped coordinate
            renderer.renderCrosshair(containerWidth, containerHeight, mappedPos.x);

            // Update tooltip coordinates (relative to the container)
            setTooltip({
              active: true,
              x: mappedPos.x,
              y: mappedPos.y,
              label,
              values,
            });
          }
        }
      } else {
        setTooltip((prev) => (prev.active ? { ...prev, active: false } : prev));
      }

      animationId = requestAnimationFrame(renderLoop);
    };

    // Begin the animation frame loop
    animationId = requestAnimationFrame(renderLoop);

    // Clean up lifecycle observers to avoid memory leaks
    return () => {
      cancelAnimationFrame(animationId);
      clearInterval(dataUpdateInterval);
      resizeObserver.disconnect();
      unsubscribe();
      if (adapter.destroy) adapter.destroy();
    };
  }, []); // Static dependency array prevents recreating the adapter/loop!

  // Handle Legend item toggles
  const handleToggle = (id: string) => {
    setVisibility((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      // Sync legend state immediately
      setLegendItems((items) =>
        items.map((item) => (item.id === id ? { ...item, visible: !item.visible } : item))
      );
      return updated;
    });
  };

  // Canvas Mouse interaction handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    hoverPosRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseLeave = () => {
    hoverPosRef.current = null;
  };

  return (
    <div
      className="flex flex-col w-full rounded-2xl border border-white/8 backdrop-blur-md shadow-2xl overflow-hidden animate-fade-in bg-[#0A1324]/80"
      style={{
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
      }}
      dir={language === "fa" ? "rtl" : "ltr"}
    >
      {/* Header section */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0A1324]">
        <div>
          <h3 className="text-sm font-bold text-[#FFFFFF]">
            {language === "fa" ? "پایش زنده آمارهای برند" : "Live Search Engine & Brand Analytics"}
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {language === "fa"
              ? "تحلیل بلادرنگ کانال‌های پایش پاسخ‌های هوش مصنوعی."
              : "Real-time generative search engine metrics visualization."}
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full text-[9px] font-bold border border-emerald-500/10">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{reducedMotion ? (language === "fa" ? "ایستا" : "STATIC") : (language === "fa" ? "اتصال زنده" : "LIVE FEED")}</span>
        </div>
      </div>

      {/* Canvas container wrapper */}
      <div ref={containerRef} className="relative w-full h-80 bg-[#0A1324]">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        {/* Tooltip component absolute overlay */}
        <Tooltip state={tooltip} language={language} />
      </div>

      {/* Interactive Legend component with active hovering highlighting */}
      <Legend
        items={legendItems}
        onToggle={handleToggle}
        onHoverItem={setHoveredSeriesId}
        language={language}
      />
    </div>
  );
};
