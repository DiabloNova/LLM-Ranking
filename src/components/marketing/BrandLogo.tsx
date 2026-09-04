import React from "react";

interface BrandLogoProps {
  /** File name (without extension) inside /public/logos */
  slug: string;
  label: string;
  className?: string;
}

/**
 * Renders a brand SVG as a uniformly-tinted monochrome mark using a CSS mask,
 * so every AI-engine logo shares one consistent color regardless of its
 * original fills. Color follows the surrounding `text-*` (currentColor).
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({ slug, label, className = "" }) => {
  const url = `/logos/${slug}.svg`;
  return (
    <span
      role="img"
      aria-label={label}
      className={`logo-mask ${className}`}
      style={{
        WebkitMaskImage: `url(${url})`,
        maskImage: `url(${url})`,
      }}
    />
  );
};
