"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Dialog } from "@/components/Dialog";
import {
  MessageSquare, Search, Plus, AlertCircle, Loader2, Trash2
} from "lucide-react";
import { getPromptsAction, addPromptAction, deletePromptAction } from "@/app/actions/prompts";

type PromptRecord = {
  id: string;
  queryText: string;
  brandName: string | null;
  category: string;
  buyingIntent: string;
  createdAt: Date;
};

export default function PromptsPage() {
  const { language, direction } = useTheme();
  const isRtl = language === "fa";

  const [prompts, setPrompts] = useState<PromptRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewPromptOpen, setIsNewPromptOpen] = useState(false);
  const [newQuery, setNewQuery] = useState("");
  const [newQueryError, setNewQueryError] = useState("");

  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  const fetchPrompts = async () => {
    try {
      const response = await getPromptsAction();

      if (Array.isArray(response)) {
        setPrompts(response as PromptRecord[]);
      } else if (response && typeof response === 'object' && 'result' in response && Array.isArray((response as {result: unknown}).result)) {
        setPrompts((response as {result: unknown}).result as PromptRecord[]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  const filteredPrompts = prompts.filter(p =>
    p.queryText.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewQueryError("");
    const trimmed = newQuery.trim();

    if (!trimmed) {
      setNewQueryError(isRtl ? "متن پرسش نمی‌تواند خالی باشد." : "Prompt query cannot be empty.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await addPromptAction({ query: trimmed });
        if (result && typeof result === 'object' && 'id' in result) {
          setIsNewPromptOpen(false);
          setNewQuery("");
          // Graceful update without full reload spinner
          const newPrompt = result as unknown as PromptRecord;
          if (!newPrompt.brandName) {
            newPrompt.brandName = "New Brand";
          }
          setPrompts(prev => [newPrompt, ...prev]);
        } else if (result && typeof result === 'object' && 'success' in result && (result as { success: boolean }).success && 'result' in result) {
          setIsNewPromptOpen(false);
          setNewQuery("");
          const newPrompt = (result as { result: unknown }).result as PromptRecord;
          setPrompts(prev => [newPrompt, ...prev]);
        } else {
          const err = result && typeof result === 'object' && 'error' in result ? String((result as { error: unknown }).error) : "";
          setNewQueryError(err || (isRtl ? "خطا در افزودن پرسش." : "Error creating prompt."));
        }
      } catch (error) {
        console.error(error);
        setNewQueryError(isRtl ? "خطا در افزودن پرسش." : "Error creating prompt.");
      }
    });
  };

  const handleDeletePrompt = (id: string) => {
    if (!window.confirm(isRtl ? "آیا از حذف این پرسش مطمئن هستید؟" : "Are you sure you want to delete this prompt?")) {
      return;
    }

    startTransition(async () => {
      try {
        const response = await deletePromptAction({ promptId: id });
        if (response && typeof response === 'object' && 'id' in response) {
          setPrompts(prev => prev.filter(p => p.id !== id));
        } else if (response && typeof response === 'object' && 'success' in response && (response as { success: boolean }).success) {
          setPrompts(prev => prev.filter(p => p.id !== id));
        } else {
          const err = response && typeof response === 'object' && 'error' in response ? String((response as { error: unknown }).error) : "";
          alert(err || "Failed to delete prompt");
        }
      } catch (err) {
        console.error(err);
      }
    });
  };

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    if (isRtl) {
      return d.toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });
    }
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-6 animate-fade-in" dir={direction}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-primary)] font-display">
            {isRtl ? "مدیریت پرسش‌های پایش شده" : "AI Visibility Tracked Prompts"}
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {isRtl
              ? "پرسش‌های هدف خود را اضافه و پایش کنید تا رویت‌پذیری برند در موتورهای هوش مصنوعی اندازه‌گیری شود."
              : "Manage, track, and organize target queries to measure brand visibility across AI response engines."}
          </p>
        </div>

        <Button onClick={() => setIsNewPromptOpen(true)} className="flex items-center gap-2 self-start sm:self-auto cursor-pointer" disabled={isPending}>
          <Plus size={16} />
          <span>{isRtl ? "افزودن پرسش جدید" : "Add New Prompt"}</span>
        </Button>
      </div>

      {/* Filter and search controls */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className={`absolute top-1/2 -translate-y-1/2 text-[var(--text-muted)] ${isRtl ? "right-3.5" : "left-3.5"}`} />
          <input
            type="text"
            placeholder={isRtl ? "جستجوی پرسش..." : "Filter by prompt query..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full py-2.5 text-xs rounded-xl outline-none border border-[var(--border)] bg-[var(--muted-surface)]/30 text-[var(--text-primary)] transition-colors ${isRtl ? "pr-10 pl-4" : "pl-10 pr-4"}`}
          />
        </div>
      </div>

      {/* Prompts Data Table */}
      {isLoading ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center space-y-4 border border-[var(--border)] bg-[var(--card)]">
          <Loader2 size={36} className="text-[var(--sky-blue-500)] animate-spin" />
          <p className="text-xs text-[var(--text-secondary)]">
            {isRtl ? "در حال دریافت اطلاعات..." : "Loading prompts..."}
          </p>
        </Card>
      ) : filteredPrompts.length === 0 ? (
        <Card className="p-8 text-center flex flex-col items-center justify-center space-y-4 border border-[var(--border)] bg-[var(--card)]">
          <div className="p-4 bg-[var(--muted-surface)] rounded-full text-[var(--text-muted)]">
            <MessageSquare size={36} />
          </div>
          <div className="max-w-xs space-y-1">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              {isRtl ? "هیچ پرسشی یافت نشد" : "No Prompts Found"}
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              {isRtl
                ? "پرسشی با این مشخصات یافت نشد یا هنوز پرسشی ثبت نکرده‌اید."
                : "No historical prompts match your query. Try adding a new target prompt."}
            </p>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden border border-[var(--border)] bg-[var(--card)]">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs text-[var(--text-secondary)]">
              <thead className="bg-[var(--muted-surface)]/50 text-[10px] uppercase text-[var(--text-muted)] border-b border-[var(--border)]">
                <tr>
                  <th className="px-6 py-3 font-bold">{isRtl ? "متن پرسش" : "Prompt Text"}</th>
                  <th className="px-6 py-3 font-bold">{isRtl ? "برند هدف" : "Target Brand"}</th>
                  <th className="px-6 py-3 font-bold">{isRtl ? "تاریخ ثبت" : "Created At"}</th>
                  <th className="px-6 py-3 font-bold w-24">{isRtl ? "عملیات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredPrompts.map((prompt) => (
                  <tr key={prompt.id} className="hover:bg-[var(--muted-surface)]/20 transition-colors">
                    <td className="px-6 py-4 font-black text-[var(--text-primary)] truncate max-w-sm" title={prompt.queryText}>
                      {prompt.queryText}
                    </td>
                    <td className="px-6 py-4">
                      {prompt.brandName || (isRtl ? "برند ناشناس" : "Unknown Brand")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDate(prompt.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDeletePrompt(prompt.id)}
                        disabled={isPending}
                        className="p-1.5 rounded-md text-rose-500 hover:bg-rose-500/10 transition-colors disabled:opacity-50 cursor-pointer"
                        aria-label={isRtl ? "حذف پرسش" : "Delete Prompt"}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* NEW PROMPT DIALOG */}
      <Dialog
        isOpen={isNewPromptOpen}
        onClose={() => setIsNewPromptOpen(false)}
        title={isRtl ? "افزودن پرسش جدید" : "Create New Prompt"}
      >
        <form onSubmit={handleAddPrompt} className="space-y-4">
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {isRtl
              ? "پرس‌وجو جستجوی کاربران را وارد کنید. سئورچبل به صورت مداوم جایگاه برند شما را در نتایج تولید شده توسط مدل‌های زبانی هوش مصنوعی رصد خواهد کرد."
              : "Enter the user query/prompt you want to track. Seorchable will continually measure your brand presence inside generative AI responses."}
          </p>

          <Input
            label={isRtl ? "متن پرسش (Query Text)" : "Prompt Query Text"}
            placeholder={isRtl ? "کاربردی نرم افزار حسابداری..." : "e.g. Best accounting software for startups..."}
            value={newQuery}
            onChange={(e) => setNewQuery(e.target.value)}
            disabled={isPending}
            required
            aria-invalid={!!newQueryError}
            aria-describedby={newQueryError ? "new-query-error" : undefined}
          />

          {newQueryError && (
            <div id="new-query-error" role="alert" className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span className="font-bold">{newQueryError}</span>
            </div>
          )}

          <div className="flex items-center gap-3 justify-end pt-4 border-t border-[var(--border)]">
            <Button variant="outline" type="button" onClick={() => setIsNewPromptOpen(false)} disabled={isPending} className="cursor-pointer">
              {isRtl ? "انصراف" : "Cancel"}
            </Button>
            <Button variant="primary" type="submit" disabled={isPending || !newQuery.trim()} className="cursor-pointer">
              {isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-1.5" />
                  <span>{isRtl ? "در حال ثبت..." : "Saving..."}</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>{isRtl ? "افزودن به لیست" : "Add to Tracker"}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
