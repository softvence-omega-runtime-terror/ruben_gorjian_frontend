"use client";

import { useEffect } from "react";
import { useSessionContext } from "@/context/SessionContext";
import { needsPayment, getPlanCodeForPayment, redirectToCheckout } from "@/lib/payment-guard";
import { useRouter } from "next/navigation";

/**
 * Payment Guard Component
 * 
 * Checks if user needs to complete payment and redirects them to checkout
 * if they have a pending plan but no active subscription.
 */
export function PaymentGuard() {
  const { session, loading } = useSessionContext();
  const router = useRouter();

  useEffect(() => {
    if (loading || !session) return;

    // Check if user needs payment
    if (needsPayment(session)) {
      const planCode = getPlanCodeForPayment(session);
      if (planCode) {
        // Redirect to checkout
        redirectToCheckout(planCode).catch((err) => {
          console.error("Payment guard redirect failed:", err);
          router.push("/pricing");
        });
      } else {
        // No plan selected, redirect to pricing
        router.push("/pricing");
      }
    }
  }, [session, loading, router]);

  return null;
}



