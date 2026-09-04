"use client";

import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  animateOnLoad?: boolean;
  delayClass?: string; // e.g. 'delay-100', 'delay-200'
}

/**
 * Enterprise Premium Glassmorphic Card.
 * Fully theme-aware and responsive.
 * Uses pure CSS/Tailwind transitions for high-performance fluid hover lift.
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = "",
  hoverable = true,
  animateOnLoad = true,
  delayClass = "",
  ...props
}) => {
  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl
        backdrop-blur-[var(--glass-blur)]
        bg-[var(--glass-bg)]
        border border-[var(--glass-border)]
        shadow-[var(--glass-shadow)]
        transition-all duration-300 ease-in-out
        ${animateOnLoad ? `animate-fade-in-up ${delayClass}` : ""}
        ${hoverable ? "hover:-translate-y-1 hover:border-[var(--sky-blue-500)]/35 hover:shadow-[0_20px_40px_rgba(56,189,248,0.15)]" : ""}
        ${className}
      `}
      {...props}
    >
      {/* Subtle brand gradient overlay on hover */}
      {hoverable && (
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--sky-blue-500)] to-[var(--orange-500)] opacity-0 hover:opacity-5 transition-opacity duration-300 pointer-events-none" />
      )}

      {/* Content wrapper to guarantee relative positioning above the overlay */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};
