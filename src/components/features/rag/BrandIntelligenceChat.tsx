"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";
import { MessageSquare, Send, BookOpen, AlertCircle } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sources?: Array<{
    id: string;
    content: string;
    similarityScore: number;
    sentiment?: {
      score: number;
      label: "positive" | "negative" | "neutral";
    } | null;
  }>;
  confidence?: number;
}

/**
 * Optimus AI — Premium Brand Intelligence Chat & RAG Query Console
 * Implements a gorgeous conversational interface hooked directly into the real multi-tenant RAG query API.
 */
export const BrandIntelligenceChat: React.FC = () => {
  const { language } = useTheme();
  const { session } = useAuth();

  // Lazy initializer to set up initial greeting message
  const [messages, setMessages] = useState<Message[]>(() => {
    return [
      {
        id: "msg-greet",
        role: "assistant",
        content: "", // Content will be dynamically rendered based on the active UI language to avoid setState-in-effect
        timestamp: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })
      }
    ];
  });

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat smoothly on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-user-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString(language === "fa" ? "fa-IR" : "en-US", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const tenantId = session.user?.workspaceId || "org-enterprise-rag-01";
      const res = await fetch("/api/v1/rag/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
          "x-user-id": session.user?.id || "usr-1001"
        },
        body: JSON.stringify({ question: currentInput, limit: 5 })
      });

      if (!res.ok) {
        throw new Error(language === "fa" ? "خطا در برقراری ارتباط با موتور پاسخ دهی زبانی." : "Failed to obtain response from LLM Query Engine.");
      }

      const data = await res.json();

      const assistantMessage: Message = {
        id: `msg-ai-${Date.now()}`,
        role: "assistant",
        content: data.answer,
        sources: data.sources,
        confidence: data.confidence,
        timestamp: new Date().toLocaleTimeString(language === "fa" ? "fa-IR" : "en-US", { hour: "2-digit", minute: "2-digit" })
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error processing request");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-[520px] max-h-[520px] animate-fade-in overflow-hidden !p-0">
      <CardHeader className="border-b border-[var(--border)] p-4 bg-[var(--muted-surface)]/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[var(--color-info-bg)] border border-[color-mix(in_srgb,var(--color-primary-600)_25%,transparent)] rounded-[var(--radius-md)] text-[var(--color-primary-600)] animate-pulse-glow">
              <MessageSquare size={18} />
            </div>
            <div>
              <CardTitle className="text-sm">
                {language === "fa" ? "میز فرمان هوشمند و موتور پاسخ‌دهی RAG" : "Interactive RAG Query Terminal"}
              </CardTitle>
              <CardDescription className="text-[10px]">
                {language === "fa" ? "مکالمه هوشمند مبتنی بر پاسخ‌های بدون توهم مدل‌ها" : "AI conversational diagnostics with zero-hallucination guardrails"}
              </CardDescription>
            </div>
          </div>

          <Badge variant="success" className="text-[10px] gap-1 py-0.5">
            <span className="w-1.5 h-1.5 bg-[var(--color-success)] rounded-full animate-pulse" />
            <span>{language === "fa" ? "پایگاه داده زنده" : "Vector DB Connected"}</span>
          </Badge>
        </div>
      </CardHeader>

      {/* Chat Messages Feed Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          // Dynamic text content localization without setState triggers inside effects
          const content = msg.id === "msg-greet"
            ? (language === "fa"
              ? "درود بر شما. من دستیار هوشمندی برند Optimus AI هستم. بر مبنای اسناد و تحلیل‌های استخراج‌شده، هر سوالی در رابطه با وضعیت سهم صدای برند خود، رتبه‌بندی رقیبان، یا احساسات کاربران دارید بپرسید."
              : "Hello. I am your Optimus AI Brand Assistant. Ask me anything about your brand's presence, comparative rankings, or user sentiment metrics across AI model queries.")
            : msg.content;

          return (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[85%] animate-slide-up ${
                msg.role === "user" ? "ms-auto items-end" : "me-auto items-start"
              }`}
            >
              {/* Bubble */}
              <div
                className={`
                  px-4 py-3 rounded-2xl text-xs leading-relaxed transition-all duration-300
                  ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-[var(--color-primary-600)] to-[var(--color-primary-700)] text-white rounded-br-none shadow-[0_6px_20px_-4px_color-mix(in_srgb,var(--color-primary-600)_45%,transparent)]"
                      : "glass-panel text-[var(--text-primary)] rounded-bl-none"
                  }
                `}
              >
                <p className="whitespace-pre-line">{content}</p>
              </div>

              {/* Time / Metadata badge */}
              <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[var(--text-muted)] px-1">
                <span>{msg.timestamp}</span>
                {msg.confidence !== undefined && (
                  <>
                    <span>•</span>
                    <span className="font-bold text-[var(--color-primary-600)]">
                      {language === "fa" ? "میزان همبستگی: " : "RAG Alignment: "}
                      {(msg.confidence * 100).toFixed(0)}%
                    </span>
                  </>
                )}
              </div>

              {/* Source Citations collapsible widget */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="w-full mt-2 space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveSourceId(activeSourceId === msg.id ? null : msg.id)}
                    className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] transition-colors"
                  >
                    <BookOpen size={11} />
                    <span>
                      {language === "fa"
                        ? `${msg.sources.length} منبع و استناد استخراج‌شده`
                        : `${msg.sources.length} Verified Sources Cited`}
                    </span>
                  </button>

                  {activeSourceId === msg.id && (
                    <div className="grid grid-cols-1 gap-2 p-2.5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--muted-surface)]/50 backdrop-blur-md animate-fade-in">
                      {msg.sources.map((source, index) => (
                        <div
                          key={source.id}
                          className="p-2.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-[9px]">
                            <span className="font-bold text-[var(--color-accent)]">
                              {language === "fa" ? `[منبع ${index + 1}] شناسه: ${source.id.substring(0, 8)}...` : `[Source ${index + 1}] ID: ${source.id.substring(0, 8)}...`}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[var(--text-muted)]">
                                {language === "fa" ? "همبستگی معنایی:" : "Score:"}
                                {` ${(source.similarityScore * 100).toFixed(0)}%`}
                              </span>
                              {source.sentiment && (
                                <Badge
                                  variant={source.sentiment.label === "positive" ? "success" : "error"}
                                  className="text-[8px] px-1 py-0"
                                >
                                  {source.sentiment.label === "positive" ? "Positive" : "Negative"}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed italic">
                            &ldquo;{source.content}&rdquo;
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Pulse glowing loading indicator */}
        {isLoading && (
          <div className="flex flex-col max-w-[85%] me-auto items-start">
            <div className="px-4 py-3 rounded-2xl glass-panel text-[var(--text-secondary)] rounded-bl-none text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[var(--color-primary-600)] rounded-full animate-ping" />
              <span className="w-1.5 h-1.5 bg-[var(--color-primary-600)] rounded-full animate-ping" style={{ animationDelay: "0.2s" }} />
              <span className="w-1.5 h-1.5 bg-[var(--color-primary-600)] rounded-full animate-ping" style={{ animationDelay: "0.4s" }} />
              <span>{language === "fa" ? "در حال بازیابی اطلاعات و پردازش پاسخ..." : "Retrieving contexts..."}</span>
            </div>
          </div>
        )}

        {/* Local Error feedback */}
        {error && (
          <div className="p-3.5 rounded-[var(--radius-lg)] border border-[color-mix(in_srgb,var(--color-error)_30%,transparent)] bg-[var(--color-error-bg)] text-[var(--color-error)] text-xs flex items-start gap-2 animate-shake">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input query form */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 border-t border-[var(--border)] bg-[var(--muted-surface)]/40 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            language === "fa"
              ? "سوال خود را بنویسید (مثال: رتبه برند در Claude چطور است؟)..."
              : "Type your brand visibility question..."
          }
          className="
            flex-1 px-4 py-2.5 text-xs rounded-[var(--radius-md)] outline-none transition-all duration-300
            bg-[var(--card)] text-[var(--text-primary)] border border-[var(--border)]
            focus:border-[var(--color-primary-600)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary-600)_25%,transparent)]
            placeholder:text-[var(--text-muted)]
          "
          disabled={isLoading}
        />
        <Button
          type="submit"
          variant="primary"
          className="p-2.5 rounded-xl flex-shrink-0"
          disabled={!input.trim() || isLoading}
        >
          <Send size={14} className="rtl:-scale-x-100" />
        </Button>
      </form>
    </Card>
  );
};
