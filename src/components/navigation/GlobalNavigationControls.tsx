"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUp, Home } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export default function GlobalNavigationControls() {
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useTheme();
  const isFa = language === "fa";

  const [showBackToTop, setShowBackToTop] = useState(false);

  // Scroll event listener to show/hide "Back to Top" button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Condition: Hide "Back to Previous Page / Home" button when on the homepage
  // Homepages can be "/", "/fa", "/en", "/fa/", "/en/"
  const isHomepage =
    pathname === "/" ||
    pathname === "/fa" ||
    pathname === "/en" ||
    pathname === "/fa/" ||
    pathname === "/en/";

  const handleBack = () => {
    // Attempt to go back, otherwise fall back to home page
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(`/${language}`);
    }
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      className={`fixed bottom-6 z-[900] flex flex-col gap-3.5 ${
        isFa ? "left-6" : "right-6"
      }`}
    >
      {/* Back to Previous Page / Home Button */}
      {!isHomepage && (
        <button
          onClick={handleBack}
          aria-label={isFa ? "بازگشت به صفحه قبل" : "Back to Previous Page / Home"}
          className="flex items-center justify-center w-12 h-12 rounded-full border border-[var(--glass-border)] bg-slate-950/80 backdrop-blur-2xl text-slate-300 hover:text-white hover:border-[var(--sky-blue-500)]/60 shadow-xl transition-all duration-300 hover:scale-110 active:scale-90 cursor-pointer group"
          style={{
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 0 10px rgba(56, 189, 248, 0.1)",
          }}
        >
          {isFa ? (
            <ArrowRight size={20} className="transition-transform duration-300 group-hover:translate-x-1" />
          ) : (
            <ArrowLeft size={20} className="transition-transform duration-300 group-hover:-translate-x-1" />
          )}
        </button>
      )}

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={handleScrollToTop}
          aria-label={isFa ? "بازگشت به بالا" : "Back to Top"}
          className="flex items-center justify-center w-12 h-12 rounded-full border border-[var(--glass-border)] bg-slate-950/80 backdrop-blur-2xl text-slate-300 hover:text-white hover:border-[var(--orange-500)]/60 shadow-xl transition-all duration-300 hover:scale-110 active:scale-90 cursor-pointer group"
          style={{
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 0 10px rgba(249, 115, 22, 0.1)",
          }}
        >
          <ArrowUp size={20} className="transition-transform duration-300 group-hover:-translate-y-1" />
        </button>
      )}
    </div>
  );
}
