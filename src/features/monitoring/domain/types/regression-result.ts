export interface RegressionResult {
  type: "technical" | "seo" | "content" | "availability";
  severity: "info" | "warning" | "critical";
  url: string | null;
  metric: string;
  previousValue: unknown;
  currentValue: unknown;
  message: string;
}
