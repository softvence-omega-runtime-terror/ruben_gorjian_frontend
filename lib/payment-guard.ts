/**
 * Payment Guard Utilities
 * 
 * Functions to check if a user has access to paid features
 * and redirect them to payment if needed.
 */

import type { Session } from "@/context/SessionContext";

/**
 * Check if user has an active paid subscription
 */
export function hasActiveSubscription(session: Session | null): boolean {
  if (!session) return false;
  
  const status = session.subscription?.status;
  return status === "ACTIVE" || status === "TRIALING";
}

/**
 * Check if user needs to complete payment
 */
export function needsPayment(session: Session | null): boolean {
  if (!session) return true;
  
  const status = session.subscription?.status;
  const pendingPlanCode = session.pendingPlanCode;
  
  // User needs payment if:
  // 1. Has INCOMPLETE subscription, OR
  // 2. Has pendingPlanCode but no active subscription
  if (status === "INCOMPLETE") {
    return true;
  }
  
  if (pendingPlanCode) {
    return status !== "ACTIVE" && status !== "TRIALING";
  }
  
  return false;
}

/**
 * Get the plan code that needs payment
 */
export function getPlanCodeForPayment(session: Session | null): string | null {
  if (!session) return null;
  
  return session.subscription?.planCode || session.pendingPlanCode || null;
}

/**
 * Redirect user to checkout for their selected plan
 */
export async function redirectToCheckout(planCode: string): Promise<void> {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  
  try {
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planCode,
        successUrl: `${origin}/billing/success`,
        cancelUrl: `${origin}/billing/cancel`,
      }),
      credentials: "include",
    });
    
    const data = await res.json();
    if (data.checkoutUrl && typeof window !== "undefined") {
      window.location.href = data.checkoutUrl;
    } else {
      throw new Error(data.error || "Failed to create checkout session");
    }
  } catch (err) {
    console.error("Failed to redirect to checkout:", err);
    if (typeof window !== "undefined") {
      window.location.href = "/pricing";
    }
  }
}

