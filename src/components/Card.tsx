import React from "react";
import { GlassCard } from "./GlassCard";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  hoverable = false,
  ...props
}) => {
  return (
    <GlassCard
      className={`p-5 ${className}`}
      hoverable={hoverable}
      {...props}
    >
      {children}
    </GlassCard>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = "", ...props }) => (
  <div className={`mb-4 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className = "", ...props }) => (
  <h3 className={`text-lg font-bold tracking-tight text-[var(--text-primary)] font-display ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ children, className = "", ...props }) => (
  <p className={`text-xs text-[var(--text-secondary)] mt-1 ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = "", ...props }) => (
  <div className={`${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = "", ...props }) => (
  <div className={`mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-end ${className}`} {...props}>
    {children}
  </div>
);
