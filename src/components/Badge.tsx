import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "error" | "info" | "neutral";
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className = "",
  variant = "neutral",
  ...props
}) => {
  const styles = {
    neutral:
      "bg-[var(--muted-surface)] text-[var(--text-secondary)] border border-[var(--border)]",
    success:
      "bg-[var(--color-success-bg)] text-[var(--color-success)] border border-[color-mix(in_srgb,var(--color-success)_30%,transparent)]",
    warning:
      "bg-[var(--color-warning-bg)] text-[var(--color-warning)] border border-[color-mix(in_srgb,var(--color-warning)_30%,transparent)]",
    error:
      "bg-[var(--color-error-bg)] text-[var(--color-error)] border border-[color-mix(in_srgb,var(--color-error)_30%,transparent)]",
    info:
      "bg-[var(--color-info-bg)] text-[var(--color-info)] border border-[color-mix(in_srgb,var(--color-info)_30%,transparent)]",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-[var(--radius-full)] ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
