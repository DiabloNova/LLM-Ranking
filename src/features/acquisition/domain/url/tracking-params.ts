export const TRACKING_PARAM_NAMES = [
  "gclid",
  "fbclid",
  "msclkid",
  "mc_eid",
  "_ga",
  "yclid",
  "igshid",
  "dclid",
  "srsltid",
  "vero_id"
] as const;
export function isTrackingParameter(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.startsWith("utm_") || (TRACKING_PARAM_NAMES as readonly string[]).includes(lower);
}
