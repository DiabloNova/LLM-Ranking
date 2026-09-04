"use client";

import React, { useId } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  className = "",
  label,
  error,
  type = "text",
  id,
  ...props
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;

  const errorId = `${inputId}-error`;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[var(--text-secondary)]"
        >
          {label}
        </label>
      )}
      <input
        type={type}
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={`
          w-full px-3 py-2 text-sm rounded-[var(--radius-md)] outline-none
          bg-[var(--card)] text-[var(--text-primary)] border transition-all duration-200
          placeholder:text-[var(--text-muted)]
          ${
            error
              ? "border-[var(--color-error)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-error)_30%,transparent)]"
              : "border-[var(--border)] focus:border-[var(--color-primary-600)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary-600)_25%,transparent)]"
          }
          ${className}
        `}
        {...props}
      />
      {error && (
        <span
          id={errorId}
          role="alert"
          className="text-xs text-[var(--color-error)] font-medium mt-0.5"
        >
          {error}
        </span>
      )}
    </div>
  );
};
