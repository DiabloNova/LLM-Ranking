"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { queryKnowledgeGraphAction } from "@/app/actions/query";
import {
  Search,
  BookOpen,
  Cpu,
  History,
  Trash2,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  Sparkles,
  ArrowRightLeft
} from "lucide-react";

interface RetrievedSource {
  id: string;
  content: string;
  similarityScore: number;
  sentiment?: {
    score: number;
    label: "positive" | "negative" | "neutral";
    confidence?: number;
  } | null;
}

interface QueryResultStats {
  answer: string;
  sources: RetrievedSource[];
  confidence: number;
}

interface HistoryItem {
  id: string;
  question: string;
  timestamp: string;
}

export default function RAGQueryPage() {
  const { language, direction } = useTheme();
  const isRtl = language === "fa";

  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeResult, setActiveResult] = useState<QueryResultStats | null>(null);

  const [isPending, startTransition] = useTransition();
  const [queryError, setQueryError] = useState<string | null>(null);

  // Load history from localStorage on mount - defer via setTimeout to avoid synchronous setState triggers
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const stored = localStorage.getItem("optimus_rag_query_history");
        if (stored) {
          setHistory(JSON.parse(stored) as HistoryItem[]);
        }
      } catch (err) {
        console.error("Failed to load query history:", err);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Save history to localStorage
  const saveHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem("optimus_rag_query_history", JSON.stringify(newHistory));
    } catch (err) {
      console.error("Failed to save query history:", err);
    }
  };

  const strings = {
    title: isRtl ? "جستجوی معنایی و عیب‌یابی RAG" : "Semantic Search & RAG Diagnostics",
    description: isRtl
      ? "در گراف دانش و بانک برداری مستأجر خود به صورت همزمان جستجو کنید، قطعات متنی مرجع را بازیابی کرده و پاسخ‌های غنی‌شده را بررسی نمایید."
      : "Query your isolated tenant vector store. Retrieve matching semantic context chunks and inspect synthesized RAG diagnostics.",
    inputPlaceholder: isRtl
      ? "سوال برندی یا رقابتی خود را وارد کنید (مثال: رقبای ما در بازار مشهد چه کسانی هستند؟)..."
      : "Ask a brand or competitive question (e.g., 'What are the main criticisms of our pricing?')...",
    searchBtn: isRtl ? "پرس‌وجو" : "Query Engine",
    searchBtnActive: isRtl ? "در حال بازیابی بردارها..." : "Retrieving Vectors...",
    historyTitle: isRtl ? "تاریخچه تشخیص‌های اخیر" : "Recent Diagnostics",
    clearHistory: isRtl ? "پاک‌سازی تاریخچه" : "Clear History",
    noHistory: isRtl ? "تاریخچه‌ای وجود ندارد" : "No recent queries found",
    leftColTitle: isRtl ? "محتوا و مراجع استخراج‌شده" : "Retrieved Context Chunks",
    leftColDesc: isRtl
      ? "چانک‌های متنی بازیابی‌شده از پایگاه داده برداری به ترتیب میزان همبستگی معنایی:"
      : "Relevant text fragments retrieved from PostgreSQL vector store sorted by cosine similarity:",
    rightColTitle: isRtl ? "پاسخ همبسته هوش مصنوعی" : "AI Synthesized Response",
    rightColDesc: isRtl
      ? "پاسخ مبتنی بر فکت‌ها و بدون توهم مدل با تحلیل منحصربه‌فرد مراجع:"
      : "Fact-aligned model output constructed purely on retrieved context to block hallucinations:",
    alignment: isRtl ? "میزان انطباق معنایی" : "RAG Alignment Score",
    similarity: isRtl ? "شباهت" : "Similarity",
    sourceChunk: isRtl ? "چانک مرجع" : "Source Chunk",
    emptyStateTitle: isRtl ? "درگاه آزمایش و تشخیص RAG" : "RAG Diagnostic Sandbox",
    emptyStateDesc: isRtl
      ? "برای شروع بازیابی معنایی و ارزیابی فرآیند سنتز، پرسش خود را در کادر بالا بنویسید."
      : "Enter a question in the search bar above to trigger multi-tenant semantic retrieval and examine the RAG pipeline output.",
    errorTitle: isRtl ? "خطا در پرس‌وجوی معنایی" : "Query Pipeline Execution Failure",
    validationError: isRtl ? "لطفاً سوال خود را بنویسید." : "Please enter a valid query string before executing.",
    id: isRtl ? "شناسه" : "ID",
  };

  const handleQuery = (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed) {
      setQueryError(strings.validationError);
      return;
    }

    setQueryError(null);
    setQuestion(trimmed);

    startTransition(async () => {
      const response = await queryKnowledgeGraphAction({ question: trimmed, limit: 5 });

      if (!response.success) {
        setQueryError(response.error || strings.errorTitle);
      } else if (response.result) {
        setActiveResult(response.result);

        // Add to history
        const newHistoryItem: HistoryItem = {
          id: `hist-${Date.now()}`,
          question: trimmed,
          timestamp: new Date().toLocaleTimeString(isRtl ? "fa-IR" : "en-US", {
            hour: "2-digit",
            minute: "2-digit"
          })
        };

        // Prevent duplicates in recent history
        const filtered = history.filter(item => item.question !== trimmed);
        saveHistory([newHistoryItem, ...filtered].slice(0, 8));
      }
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleQuery(question);
  };

  const handleClearHistory = () => {
    saveHistory([]);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in" dir={direction}>
      {/* Title block */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)] font-display flex items-center gap-2.5">
          <Search className="text-[var(--color-primary-600)]" size={24} />
          <span>{strings.title}</span>
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1.5 max-w-3xl leading-relaxed">
          {strings.description}
        </p>
      </div>

      {/* Query Bar */}
      <form onSubmit={handleFormSubmit} className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className={`absolute top-1/2 -translate-y-1/2 text-[var(--text-muted)] ${isRtl ? "right-4" : "left-4"}`} />
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={strings.inputPlaceholder}
            className={`
              w-full py-3.5 text-xs rounded-[var(--radius-lg)] outline-none transition-all duration-300
              glass-panel text-[var(--text-primary)]
              focus:border-[var(--color-primary-600)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary-600)_25%,transparent)]
              placeholder:text-[var(--text-muted)] leading-normal
              ${isRtl ? "pr-11 pl-4" : "pl-11 pr-4"}
            `}
            disabled={isPending}
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          className="px-6 py-3.5 font-bold rounded-2xl flex-shrink-0 flex items-center gap-2"
          disabled={isPending || !question.trim()}
        >
          {isPending ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              <span>{strings.searchBtnActive}</span>
            </>
          ) : (
            <>
              <Search size={14} />
              <span>{strings.searchBtn}</span>
            </>
          )}
        </Button>
      </form>

      {/* Query Error Box */}
      {queryError && (
        <Card className="border-[color-mix(in_srgb,var(--color-error)_35%,transparent)] bg-[var(--color-error-bg)] shadow-lg animate-shake">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-[var(--color-error)] flex items-center gap-2">
              <AlertCircle size={14} />
              <span>{strings.errorTitle}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-1">
            <p className="text-xs text-[var(--color-error)] italic">
              {queryError}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Main Content Split: History Sidebar vs. Content Results */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Sidebar History */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="glass-panel shadow-md !p-0">
            <CardHeader className="pb-3 border-b border-[var(--border)] flex flex-row items-center justify-between space-y-0 p-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent-600)] flex items-center gap-1.5">
                <History size={12} />
                <span>{strings.historyTitle}</span>
              </CardTitle>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="text-[10px] text-[var(--color-error)] hover:opacity-80 transition-opacity flex items-center gap-1"
                >
                  <Trash2 size={10} />
                  <span>{strings.clearHistory}</span>
                </button>
              )}
            </CardHeader>
            <CardContent className="p-2">
              {history.length === 0 ? (
                <div className="py-8 px-4 text-center text-[10px] text-[var(--text-muted)] italic">
                  {strings.noHistory}
                </div>
              ) : (
                <div className="space-y-1">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setQuestion(item.question);
                        handleQuery(item.question);
                      }}
                      className="
                        w-full text-start p-2.5 rounded-[var(--radius-md)] text-[11px] transition-all duration-200
                        hover:bg-[var(--muted-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-start gap-2 min-w-0
                      "
                    >
                      <MessageSquare size={12} className="mt-0.5 text-[var(--text-muted)] flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate leading-normal">{item.question}</p>
                        <span className="text-[9px] text-[var(--text-muted)] mt-0.5 block">{item.timestamp}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Content Results Panel */}
        <div className="lg:col-span-3">
          {!activeResult ? (
            /* Empty State */
            <Card className="gradient-border glass-panel p-10 text-center flex flex-col items-center justify-center min-h-[350px]">
              <div className="p-4 rounded-full bg-[var(--color-info-bg)] border border-[color-mix(in_srgb,var(--color-primary-600)_25%,transparent)] mb-4 animate-pulse-glow">
                <Sparkles size={36} className="text-[var(--color-primary-600)]" />
              </div>
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1.5">{strings.emptyStateTitle}</h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-md leading-relaxed">{strings.emptyStateDesc}</p>
            </Card>
          ) : (
            /* Results Grid */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

              {/* Left Column: Retrieved Context */}
              <Card className="border border-white/[0.06] bg-white/[0.01] backdrop-blur-md shadow-lg min-h-[380px]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-bold text-[#FF6F41] flex items-center gap-1.5 uppercase tracking-wide">
                      <BookOpen size={14} />
                      <span>{strings.leftColTitle}</span>
                    </CardTitle>
                    <Badge variant="info">
                      K={activeResult.sources.length}
                    </Badge>
                  </div>
                  <CardDescription className="text-[10px] leading-relaxed">
                    {strings.leftColDesc}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                  {activeResult.sources.length === 0 ? (
                    <div className="text-center py-10 text-[11px] text-[var(--text-muted)] italic">
                      {isRtl ? "هیچ سندی بازیابی نشد." : "No semantic chunks retrieved."}
                    </div>
                  ) : (
                    activeResult.sources.map((src, index) => (
                      <div key={src.id} className="p-3 rounded-xl border border-white/5 bg-white/[0.01] space-y-2">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-[#FF6F41]">
                            {strings.sourceChunk} {index + 1}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-white/40 font-mono text-[9px]">
                              ID: {src.id.substring(0, 8)}...
                            </span>
                            <Badge variant="neutral" className="font-mono text-[9px] px-1.5 py-0">
                              {(src.similarityScore * 100).toFixed(0)}% {strings.similarity}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-[11px] text-white/80 leading-relaxed italic">
                          &ldquo;{src.content}&rdquo;
                        </p>
                        {src.sentiment && (
                          <div className="flex gap-2 pt-1 border-t border-white/[0.03] items-center">
                            <span className="text-[9px] text-white/30">{isRtl ? "احساسات:" : "Sentiment:"}</span>
                            <Badge variant={src.sentiment.label === "positive" ? "success" : src.sentiment.label === "negative" ? "error" : "neutral"} className="text-[8px] py-0 px-1.5">
                              {src.sentiment.label}
                            </Badge>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Right Column: AI Response */}
              <Card className="border border-white/[0.06] bg-white/[0.01] backdrop-blur-md shadow-lg min-h-[380px]">
                <CardHeader className="border-b border-white/5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wide">
                      <Sparkles size={14} />
                      <span>{strings.rightColTitle}</span>
                    </CardTitle>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] text-[var(--text-muted)]">{strings.alignment}</span>
                      <span className="text-xs font-black text-[#79ADFB] mt-0.5">{(activeResult.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <CardDescription className="text-[10px] leading-relaxed pt-1">
                    {strings.rightColDesc}
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-4 space-y-4">
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs leading-relaxed text-white/90 space-y-3 whitespace-pre-line">
                    <p>{activeResult.answer}</p>
                  </div>

                  <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex items-start gap-2.5 text-[10px] text-[var(--text-muted)] leading-relaxed">
                    <Cpu size={14} className="text-[#1F76F9] mt-0.5 flex-shrink-0" />
                    <p>
                      {isRtl
                        ? "سنتز پاسخ به صورت بلادرنگ با دما (Temperature) ۰.۱ و تحلیل چندوجهی جهت بررسی عدم انحراف فکتی انجام شده است."
                        : "RAG generation completed at temperature 0.1, analyzing verified sources to map factual statements precisely."}
                    </p>
                  </div>
                </CardContent>
              </Card>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
