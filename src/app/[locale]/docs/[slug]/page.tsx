"use client";

import React, { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DOCS_INDEX } from "@/lib/docsIndex";
import { ArrowLeft, Clock, Tag, Copy, Check } from "lucide-react";
import Link from "next/link";
import DOMPurify from 'dompurify';

interface DocDetailPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default function DocDetailPage({ params }: DocDetailPageProps) {
  const resolvedParams = use(params);
  const locale = resolvedParams.locale;
  const slug = resolvedParams.slug;
  const router = useRouter();
  const isFa = locale === "fa";

  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const topicMeta = DOCS_INDEX.find((t) => t.slug === slug);

  useEffect(() => {
    async function loadContent() {
      try {
        let fetchSlug = slug;
        let domain = "";

        // Handle README specially if needed
        if (slug === 'product' || slug === 'user-guides' || slug === 'services' || slug === 'api' || slug === 'architecture' || slug === 'security') {
           fetchSlug = "README";
           domain = slug;
        } else if (slug === 'README') {
           domain = "root";
        }

        const res = await fetch(`/api/v1/docs?slug=${fetchSlug}&domain=${domain}`);
        if (!res.ok) {
          setContent(null);
        } else {
          const data = await res.json();
          setContent(data.content);
        }
      } catch (e) {
        setContent(null);
      } finally {
        setLoading(false);
      }
    }
    loadContent();
  }, [slug]);

  if (loading) {
    return <div className="p-10 animate-pulse bg-white/5 rounded-3xl h-64"></div>;
  }

  if (!content) {
    return (
      <div className="text-center py-20 space-y-4 animate-fade-in">
        <h1 className="text-2xl font-black text-white font-display">
          {isFa ? "مستند مورد نظر پیدا نشد" : "Documentation Topic Not Found"}
        </h1>
        <p className="text-xs text-slate-400">
          {isFa
            ? "متأسفانه سرفصل درخواستی در لیست مستندات معتبر سامانه وجود ندارد."
            : "The requested slug does not exist in our system."}
        </p>
        <Link
          href={`/${locale}/docs`}
          className="inline-flex px-5 py-2.5 rounded-xl bg-slate-900 text-xs font-bold text-slate-300 hover:text-white transition-all border border-white/10"
        >
          {isFa ? "بازگشت به صفحه مستندات" : "Back to Documentation Index"}
        </Link>
      </div>
    );
  }

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const renderRichContent = (text: string) => {
    const lines = text.split("\n");
    let inCodeBlock = false;
    let codeContent: string[] = [];
    let codeLang = "";
    const rendered = [];

    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      const trimmed = line.trim();

      if (trimmed.startsWith("```")) {
        if (inCodeBlock) {
          inCodeBlock = false;
          const content = codeContent.join("\n");
          const blockIdx = idx;
          rendered.push(
            <div key={`code-${idx}`} className="relative group my-6" dir="ltr">
              <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                  onClick={() => handleCopy(content, blockIdx)}
                  className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10"
                  title="Copy code"
                >
                  {copiedIndex === blockIdx ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                </button>
              </div>
              {codeLang && (
                <div className="absolute top-0 left-0 px-3 py-1 bg-white/5 rounded-br-lg text-[10px] text-slate-400 font-mono border-b border-r border-white/5 uppercase">
                  {codeLang}
                </div>
              )}
              <pre className="p-4 pt-8 rounded-xl bg-[#0d1117] border border-white/10 font-mono text-[13px] text-[#c9d1d9] overflow-x-auto shadow-inner leading-relaxed">
                <code>{content}</code>
              </pre>
            </div>
          );
          codeContent = [];
          codeLang = "";
        } else {
          inCodeBlock = true;
          codeLang = trimmed.substring(3).trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeContent.push(line);
        continue;
      }

      if (!trimmed) {
        rendered.push(<div key={idx} className="h-2" />);
        continue;
      }

      if (trimmed.startsWith("# ")) {
        rendered.push(
          <h1 key={idx} className="text-2xl sm:text-3xl font-black text-white font-display border-b border-white/10 pb-4 mb-6 mt-2">
            {trimmed.substring(2)}
          </h1>
        );
      } else if (trimmed.startsWith("## ")) {
        rendered.push(
          <h2 key={idx} className="text-xl font-extrabold text-[var(--sky-blue-500)] font-display mt-8 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--sky-blue-500)]" />
            <span>{trimmed.substring(3)}</span>
          </h2>
        );
      } else if (trimmed.startsWith("### ")) {
         rendered.push(
          <h3 key={idx} className="text-lg font-bold text-slate-200 mt-6 mb-3">
            {trimmed.substring(4)}
          </h3>
        );
      } else if (trimmed === "---") {
        rendered.push(<hr key={idx} className="border-white/10 my-6" />);
      } else if (trimmed.startsWith("- ")) {
        rendered.push(
          <li key={idx} className="list-none flex items-start gap-2.5 text-[13px] text-slate-300 leading-relaxed my-2.5 ps-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--orange-500)] shrink-0 mt-2" />
            <span dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(trimmed.substring(2)) }} />
          </li>
        );
      } else {
        rendered.push(
          <p key={idx} className="text-[13px] sm:text-sm text-slate-300 leading-relaxed my-3.5 text-justify"
             dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(trimmed) }} />
        );
      }
    }
    return rendered;
  };

  const parseInlineMarkdown = (text: string) => {
    // Basic bold
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
    // Basic inline code
    text = text.replace(/`(.*?)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-[11px] font-mono text-[var(--sky-blue-500)] border border-white/5">$1</code>');
    // Basic links
    text = text.replace(/\[(.*?)\]\((.*?)\)/g, `<a href="$2" class="text-[var(--sky-blue-500)] hover:underline decoration-white/30 underline-offset-4 transition-all">$1</a>`);
    return DOMPurify.sanitize(text, { USE_PROFILES: { html: true } });
  };

  return (
    <article className="space-y-6 animate-fade-in text-start pb-20">
      <div className="flex flex-wrap items-center gap-3 text-[10px] sm:text-xs text-slate-500 font-bold">
        <Link href={`/${locale}/docs`} className="hover:text-white transition-colors">
          {isFa ? "مستندات" : "Docs"}
        </Link>
        <span>/</span>
        <span className="text-slate-400 uppercase tracking-wider">{topicMeta ? (isFa ? topicMeta.categoryFa : topicMeta.category.replace("-", " ")) : "..."}</span>
        <span>/</span>
        <span className="text-slate-300 font-black">{topicMeta ? (isFa ? topicMeta.titleFa : topicMeta.titleEn) : slug}</span>
      </div>

      <div className="p-6 sm:p-10 rounded-3xl border border-white/10 bg-slate-900/10 backdrop-blur-md shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-40 h-40 bg-[var(--sky-blue-500)]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-40 h-40 bg-[var(--orange-500)]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 mb-8 text-slate-400 gap-4">
          <div className="flex items-center gap-4 text-[10px] sm:text-xs font-mono">
            {topicMeta && (
              <span className="flex items-center gap-1">
                <Tag size={12} className="text-[var(--sky-blue-500)]" />
                <span>{topicMeta.category.toUpperCase()}</span>
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={12} className="text-[var(--orange-500)]" />
              <span>{isFa ? "خواندن: مستند" : "Read: Document"}</span>
            </span>
          </div>

          <Link
            href={`/${locale}/docs`}
            className="flex items-center gap-1.5 text-xs font-bold hover:text-white transition-all border border-white/5 bg-white/[0.02] px-3.5 py-1.5 rounded-xl hover:border-white/10 self-start sm:self-auto"
          >
            <ArrowLeft size={14} className="rtl:rotate-180" />
            <span>{isFa ? "فهرست مستندات" : "Back to Index"}</span>
          </Link>
        </div>

        <div className="space-y-2 text-white/90">
          {renderRichContent(content)}
        </div>
      </div>
    </article>
  );
}
