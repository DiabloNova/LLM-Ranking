import React from "react";

interface SeorchableLogoProps {
  className?: string;
  glow?: boolean;
  monochrome?: boolean;
}

/**
 * High-fidelity, custom SVG rendering of the seorchable.ir signature logo.
 * Modeled after the hand-drawn, asymmetrical, sharp-pointed tapered star in the reference image.
 * Updated to be professional dark gray (grayish-black) with a completely transparent background.
 */
export function SeorchableLogo({
  className = "w-9 h-9",
  glow = false, // Background is completely transparent by default
  monochrome = true, // Force monochrome to dark-grayish-black
}: SeorchableLogoProps) {
  // We use a professional grayish-black/dark gray color: #2d3139
  const darkGrayColor = "#2d3139";

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      {/* Background Glow is completely disabled or transparent */}
      {glow && (
        <div className="absolute inset-0 bg-transparent rounded-full pointer-events-none scale-110" />
      )}

      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 transition-transform duration-500 hover:rotate-12 cursor-pointer"
      >
        {/* Hand-drawn Asymmetrical 6-Point Tapered Star Path with professional grayish-black fill */}
        <path
          d="M 48 39
             L 18 14
             L 42 38
             L 46.5 21
             L 50 39
             L 84 19
             L 53 43
             L 46 86
             L 44 45
             L 9 52
             Z"
          fill={darkGrayColor}
          stroke={darkGrayColor}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Decorative small dot in matching grayish-black */}
        <circle cx="91" cy="23" r="1.5" fill={darkGrayColor} />
      </svg>
    </div>
  );
}
