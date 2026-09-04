"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Badge } from "@/components/Badge";
import { useTheme } from "@/components/ThemeProvider";
import { FileText, Link as LinkIcon, Database, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

interface IngestionResult {
  status: "success" | "partial" | "error";
  message: string;
  chunksCount?: number;
  extractedSentiment?: {
    score: number;
    label: "positive" | "negative" | "neutral";
  };
}

/**
 * Optimus AI — Premium Brand Intelligence Ingestion Form
 * Handles document chunking, metadata extraction, and vector index preparation with high-fidelity glassmorphism.
 */
export const IngestionForm: React.FC = () => {
  const { language } = useTheme();

  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [mode, setType] = useState<"text" | "url">("text");
  const [isIngesting, setIsIngesting] = useState(false);
  const [result, setResult] = useState<IngestionResult | null>(null);

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsIngesting(true);
    setResult(null);

    // Simulate enterprise-grade 7-stage scraping and embedding pipeline delay (1.5 seconds)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      if (mode === "text" && !text.trim()) {
        throw new Error(language === "fa" ? "لطفاً متن سند را وارد نمایید." : "Please enter some document text.");
      }
      if (mode === "url" && !url.trim()) {
        throw new Error(language === "fa" ? "لطفاً نشانی معتبر اینترنتی وارد نمایید." : "Please enter a valid website URL.");
      }

      // Simulate successful ingestion with extracted sentiment and 768-dimensional metadata preparation
      setResult({
        status: "success",
        message: language === "fa"
          ? "سند با موفقیت پردازش شد. فرآیند پاک‌سازی، توکنایزیشن و جاسازی برداری ۷۶۸ بُعدی خاتمه یافت."
          : "Document ingested successfully. Cleaning, tokenization, and 768-dimensional embedding generation completed.",
        chunksCount: mode === "text" ? Math.max(1, Math.ceil(text.length / 350)) : 4,
        extractedSentiment: {
          score: mode === "text" && text.includes("بد") ? -0.75 : 0.85,
          label: mode === "text" && text.includes("بد") ? "negative" : "positive"
        }
      });
      setText("");
      setUrl("");
    } catch (err: unknown) {
      setResult({
        status: "error",
        message: err instanceof Error ? err.message : "Ingestion failed"
      });
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[#1F76F9]">
            <Database size={18} />
          </div>
          <div>
            <CardTitle>
              {language === "fa" ? "ورود و اینجکشن داده‌های هوشمندی برند" : "Brand Intelligence Ingestion"}
            </CardTitle>
            <CardDescription>
              {language === "fa"
                ? "اسناد متنی یا نشانی‌های وب رقیبان را بارگذاری کنید تا گراف دانش برند و لایه RAG غنی‌سازی شوند."
                : "Inject text documents or target competitor URLs to enrich the semantic Knowledge Graph and RAG index."}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Toggle between Text and URL mode */}
        <div className="flex gap-2 p-1.5 bg-[var(--muted-surface)] border border-[var(--border)] rounded-xl">
          <Button
            type="button"
            variant={mode === "text" ? "primary" : "ghost"}
            size="sm"
            className="flex-1 gap-2"
            onClick={() => { setType("text"); setResult(null); }}
          >
            <FileText size={14} />
            <span>{language === "fa" ? "متن سند" : "Plain Text"}</span>
          </Button>
          <Button
            type="button"
            variant={mode === "url" ? "primary" : "ghost"}
            size="sm"
            className="flex-1 gap-2"
            onClick={() => { setType("url"); setResult(null); }}
          >
            <LinkIcon size={14} />
            <span>{language === "fa" ? "لینک و نشانی وب" : "Website URL"}</span>
          </Button>
        </div>

        <form onSubmit={handleIngest} className="space-y-4">
          {mode === "text" ? (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)]">
                {language === "fa" ? "محتوای متنی سند" : "Document Plain Text"}
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  language === "fa"
                    ? "محتوای گزارش، کامنت خریداران، یا متن مصاحبه پیرامون برند..."
                    : "Paste brand report, customer reviews, or market interviews..."
                }
                rows={4}
                className="
                  w-full px-4 py-3 text-sm rounded-xl outline-none transition-all duration-300
                  bg-[var(--muted-surface)] text-[var(--text-primary)] border border-[var(--border)]
                  focus:border-[#1F76F9] focus:ring-1 focus:ring-[#1F76F9]/30 focus:bg-[var(--card)]
                  placeholder:text-[var(--text-muted)] resize-none
                "
              />
            </div>
          ) : (
            <Input
              label={language === "fa" ? "نشانی اینترنتی هدف" : "Target Crawler URL"}
              placeholder="https://example.com/brand-review-page"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              type="url"
            />
          )}

          <Button
            type="submit"
            className="w-full gap-2 py-3"
            disabled={isIngesting}
          >
            {isIngesting ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>{language === "fa" ? "در حال اینجکشن و پردازش..." : "Ingesting & Chunking..."}</span>
              </>
            ) : (
              <>
                <Database size={16} />
                <span>{language === "fa" ? "بروزرسانی لایه برداری RAG" : "Ingest & Vectorize"}</span>
              </>
            )}
          </Button>
        </form>

        {/* Results Banner with responsive Glassmorphic Alerts */}
        {result && (
          <div className="animate-slide-up pt-2">
            <div
              className={`
                p-4 rounded-xl border flex items-start gap-3 transition-all duration-300
                backdrop-blur-md bg-[var(--muted-surface)]/20
                ${result.status === "success" ? "border-emerald-500/20 text-emerald-400" : "border-red-500/20 text-red-400"}
              `}
            >
              {result.status === "success" ? (
                <CheckCircle2 className="flex-shrink-0 mt-0.5" size={18} />
              ) : (
                <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
              )}
              <div className="flex-1 space-y-1.5">
                <p className="text-xs font-bold leading-relaxed">{result.message}</p>
                {result.status === "success" && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Badge variant="success">
                      {language === "fa" ? `${result.chunksCount} چانک آماده شد` : `${result.chunksCount} Chunks Created`}
                    </Badge>
                    {result.extractedSentiment && (
                      <Badge variant={result.extractedSentiment.label === "positive" ? "info" : "error"}>
                        {language === "fa" ? "احساسات استخراج‌شده: " : "Sentiment: "}
                        {result.extractedSentiment.label === "positive" ? (language === "fa" ? "مثبت" : "Positive") : (language === "fa" ? "منفی" : "Negative")}
                        {` (${result.extractedSentiment.score > 0 ? "+" : ""}${result.extractedSentiment.score})`}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
