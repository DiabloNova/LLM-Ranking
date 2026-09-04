/**
 * Single production typeface for the entire product surface.
 *
 * IranYekan (YekanBakhFaNum) is loaded locally so Persian glyphs, Latin labels,
 * numerals, dashboards, forms, marketing pages, and error states all share one
 * measurable family. Every shipped weight maps to a real font file. No Peyda,
 * BoxFace, Inter, Roboto, or other decorative font participates in the UI font stack.
 */
import localFont from "next/font/local";

export const persianPrimary = localFont({
  src: [
    { path: "../../public/fonts/YekanBakhFaNum-Light.woff2", weight: "300", style: "normal" },
    { path: "../../public/fonts/YekanBakhFaNum-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/YekanBakhFaNum-Regular.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/YekanBakhFaNum-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../../public/fonts/YekanBakhFaNum-SemiBold.woff2", weight: "700", style: "normal" },
    { path: "../../font/Yekan/YekanBakhFaNum-ExtraBold.woff", weight: "800", style: "normal" },
    { path: "../../font/Yekan/YekanBakhFaNum-Black.woff", weight: "900", style: "normal" },
  ],
  variable: "--font-persian-primary",
  display: "swap",
  preload: true,
  fallback: ["sans-serif"],
});
