export const CHECKOUT_INTENT_KEY = "seorchable.checkout.intent";
export const CHECKOUT_INTENT_MAX_AGE_MS = 30 * 60 * 1000;

export type CheckoutPlan = "free" | "professional" | "enterprise";
export type CheckoutIntent = { plan: CheckoutPlan; returnPath: string; createdAt: number };

export function normalizePlan(value: string | null | undefined): CheckoutPlan | null {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "free") return "free";
  if (normalized === "professional" || normalized === "pro") return "professional";
  if (normalized === "enterprise") return "enterprise";
  return null;
}

export function saveCheckoutIntent(plan: CheckoutPlan, returnPath: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(CHECKOUT_INTENT_KEY, JSON.stringify({ plan, returnPath, createdAt: Date.now() }));
}

export function readCheckoutIntent(): CheckoutIntent | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(CHECKOUT_INTENT_KEY) || "null") as Partial<CheckoutIntent> | null;
    if (!parsed || !normalizePlan(parsed.plan) || typeof parsed.returnPath !== "string" || typeof parsed.createdAt !== "number") return null;
    if (Date.now() - parsed.createdAt > CHECKOUT_INTENT_MAX_AGE_MS) {
      clearCheckoutIntent();
      return null;
    }
    return { plan: normalizePlan(parsed.plan)!, returnPath: parsed.returnPath, createdAt: parsed.createdAt };
  } catch {
    clearCheckoutIntent();
    return null;
  }
}

export function clearCheckoutIntent() {
  if (typeof window !== "undefined") window.sessionStorage.removeItem(CHECKOUT_INTENT_KEY);
}
