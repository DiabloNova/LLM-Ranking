"use client";

import React, { useState, useEffect, useRef } from "react";
import { Maximize2, Minimize2, Table, LineChart, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/components/ThemeProvider";

export interface VisualizationContainerProps {
  id: string;
  titleEn: string;
  titleFa: string;
  descriptionEn?: string;
  descriptionFa?: string;
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessageEn?: string;
  emptyMessageFa?: string;
  onRetry?: () => void;
  /**
   * Optional custom tabular view data mapping.
   * If provided, users can toggle between Graphical and Tabular representation.
   */
  tabularData?: {
    headersEn: string[];
    headersFa: string[];
    rows: (string | number)[][];
  };
  children: React.ReactNode;
}

export const VisualizationContainer: React.FC<VisualizationContainerProps> = ({
  id,
  titleEn,
  titleFa,
  descriptionEn,
  descriptionFa,
  loading = false,
  error = null,
  empty = false,
  emptyMessageEn = "No data available to render.",
  emptyMessageFa = "هیچ داده‌ای برای نمایش موجود نیست.",
  onRetry,
  tabularData,
  children,
}) => {
  const { language } = useTheme();
  const isRtl = language === "fa";
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<"graphic" | "tabular">("graphic");
  const containerRef = useRef<HTMLDivElement>(null);

  // Esc keyboard handler for exiting fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  // Accessibility summary
  const accessLabel = isRtl
    ? `نمودار ${titleFa}. برای دیدن داده‌ها به شکل جدول از کلیدهای ناوبری استفاده کنید.`
    : `Visualization of ${titleEn}. Use the tabular view switch button to access the raw data representation for accessibility.`;

  return (
    <div
      ref={containerRef}
      className={`relative transition-all duration-300 ${
        isFullscreen
          ? "fixed inset-0 z-50 bg-[var(--background)] p-8 flex flex-col justify-between overflow-y-auto"
          : "h-full"
      }`}
      style={{
        direction: isRtl ? "rtl" : "ltr",
      }}
      aria-label={accessLabel}
    >
      <Card className={`flex flex-col justify-between h-full border border-[var(--border)] bg-[var(--card)] rounded-2xl ${isFullscreen ? "shadow-2xl border-[var(--border-strong)] min-h-full" : ""}`}>
        {/* Container Header */}
        <CardHeader className="flex flex-row items-start justify-between border-b border-[var(--border)] pb-4">
          <div className="space-y-1">
            <CardTitle className="text-base font-bold text-[var(--text-primary)]">
              {isRtl ? titleFa : titleEn}
            </CardTitle>
            {(descriptionEn || descriptionFa) && (
              <CardDescription className="text-xs text-[var(--text-muted)]">
                {isRtl ? descriptionFa : descriptionEn}
              </CardDescription>
            )}
          </div>

          {/* Action toolbar */}
          <div className="flex items-center gap-2" style={{ direction: isRtl ? "rtl" : "ltr" }}>
            {tabularData && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode((prev) => (prev === "graphic" ? "tabular" : "graphic"))}
                aria-label={isRtl ? "تغییر حالت نمایش" : "Toggle data view representation"}
                className="h-8 px-2 flex items-center gap-1.5 text-xs text-[var(--text-primary)] border-[var(--border)] hover:bg-[var(--background)]"
              >
                {viewMode === "graphic" ? (
                  <>
                    <Table size={14} />
                    <span>{isRtl ? "نمایش جدول" : "Show Table"}</span>
                  </>
                ) : (
                  <>
                    <LineChart size={14} />
                    <span>{isRtl ? "نمایش نمودار" : "Show Chart"}</span>
                  </>
                )}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              aria-label={
                isFullscreen
                  ? isRtl ? "خروج از تمام‌صفحه" : "Exit Fullscreen"
                  : isRtl ? "نمایش تمام‌صفحه" : "View Fullscreen"
              }
              className="h-8 w-8 p-0 flex items-center justify-center text-[var(--text-primary)] border-[var(--border)] hover:bg-[var(--background)]"
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </Button>
          </div>
        </CardHeader>

        {/* Content Area */}
        <CardContent className="flex-1 min-h-[220px] p-6 relative flex flex-col justify-center">
          {loading ? (
            /* Layout Skeleton with approximate geometry to prevent cumulative layout shifts (CLS) */
            <div className="space-y-4 animate-pulse w-full h-full flex flex-col justify-center" aria-busy="true">
              <div className="h-4 bg-[var(--border)] rounded w-1/3" />
              <div className="flex-1 min-h-[140px] bg-[var(--border)]/40 rounded-xl w-full flex items-center justify-center">
                <RefreshCw size={24} className="animate-spin text-[var(--text-muted)]" />
              </div>
              <div className="h-3 bg-[var(--border)] rounded w-2/3" />
            </div>
          ) : error ? (
            /* Error Panel with retry mechanism */
            <div className="flex flex-col items-center justify-center text-center space-y-4 py-8" role="alert">
              <div className="p-3 bg-red-500/10 text-red-500 rounded-full">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-[var(--text-primary)]">
                  {isRtl ? "خطا در بارگذاری نمودار" : "Failed to Load Visualization"}
                </h4>
                <p className="text-xs text-[var(--text-muted)] max-w-sm">
                  {error}
                </p>
              </div>
              {onRetry && (
                <Button variant="outline" size="sm" onClick={onRetry} className="h-8 text-xs border-[var(--border)]">
                  {isRtl ? "تلاش مجدد" : "Retry"}
                </Button>
              )}
            </div>
          ) : empty ? (
            /* Empty Data State Panel */
            <div className="flex flex-col items-center justify-center text-center space-y-3 py-12">
              <div className="p-3 bg-[var(--border)]/50 text-[var(--text-muted)] rounded-full">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V4a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-xs text-[var(--text-muted)] max-w-xs">
                {isRtl ? emptyMessageFa : emptyMessageEn}
              </p>
            </div>
          ) : viewMode === "tabular" && tabularData ? (
            /* Tabular representation of values (highly WCAG-compliant fallback for screen readers) */
            <div className="overflow-x-auto w-full h-full max-h-[300px] border border-[var(--border)] rounded-xl bg-[var(--background)]">
              <table className="min-w-full divide-y divide-[var(--border)] text-xs text-start">
                <thead className="bg-[var(--card)] sticky top-0">
                  <tr>
                    {(isRtl ? tabularData.headersFa : tabularData.headersEn).map((h, i) => (
                      <th
                        key={i}
                        scope="col"
                        className="px-4 py-3 font-semibold text-[var(--text-primary)] text-start select-none"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] bg-[var(--card)]/30">
                  {tabularData.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-[var(--border)]/10 transition-colors">
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="px-4 py-2.5 text-[var(--text-primary)] font-medium text-start font-display"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Graphical Child Node Render (Main Visual Element) */
            <div className="w-full h-full animate-fade-in">
              {children}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
