"use client";

import React, { useEffect } from "react";
import { Button } from "./Button";

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Content Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="relative bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] w-full max-w-lg overflow-hidden animate-in fade-in-50 duration-150 z-10"
      >
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 id="dialog-title" className="text-lg font-bold text-[var(--text-primary)]">{title}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1 hover:bg-[var(--card)]"
            aria-label="Close dialog"
          >
            ✕
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {children}
        </div>
      </div>
    </div>
  );
};
