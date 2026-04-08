/**
 * Plan → Onboarding Route Mapping
 * 
 * Single source of truth for mapping plan categories to onboarding routes.
 * This ensures consistent routing across the app.
 */

import type { PlanCategory } from "../types/plan-category";

export type OnboardingRoute =
  | "/onboarding/calendar"
  | "/onboarding/visual"
  | "/onboarding/full-management";

/**
 * Maps plan category to the correct onboarding route
 */
export function getOnboardingRouteForPlanCategory(
  planCategory: PlanCategory | string | null | undefined
): OnboardingRoute | null {
  if (!planCategory) return null;

  const category = planCategory.toUpperCase();

  switch (category) {
    case "CALENDAR_ONLY":
    case "JEWELRY_CALENDAR_ONLY":
    case "VISUAL_CALENDAR":
      return "/onboarding/calendar";

    case "VISUAL_ADD_ON":
    case "REGULAR_VISUAL":
    case "JEWELRY_VISUAL":
      return "/onboarding/visual";

    case "FULL_MANAGEMENT":
    case "JEWELRY_FULL_MANAGEMENT":
      return "/onboarding/full-management";

    default:
      return null;
  }
}

/**
 * Maps plan code to onboarding route by looking up the plan's category
 * This is a fallback when we only have the plan code
 */
export async function getOnboardingRouteForPlanCode(
  planCode: string
): Promise<OnboardingRoute | null> {
  try {
    const res = await fetch("/api/billing/plans", { cache: "no-store" });
    if (!res.ok) return null;

    const plans = await res.json();
    const plan = plans.find((p: { code: string }) => p.code === planCode);
    if (!plan) return null;

    return getOnboardingRouteForPlanCategory(plan.category);
  } catch (err) {
    console.error("Failed to lookup plan category:", err);
    return null;
  }
}

/**
 * Determines if a plan requires payment
 * Plans with priceStandardCents > 0 are considered paid
 */
export function isPlanPaid(plan: {
  priceStandardCents?: number;
  priceFounderCents?: number;
}): boolean {
  const standardPrice = plan.priceStandardCents || 0;
  const founderPrice = plan.priceFounderCents || 0;
  // Consider paid if either price is > 0
  return standardPrice > 0 || founderPrice > 0;
}
