"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSessionContext } from "@/context/SessionContext";
function OnboardingRouterContent() {
  const { session, loading, refresh } = useSessionContext();
  const router = useRouter();
  const pathname = usePathname();
  const hasRefreshed = useRef(false);

  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.push("/login?returnTo=/onboarding");
      return;
    }

    async function routeToOnboarding() {
      // CRITICAL FIX: Refresh session ONCE to get latest onboarding completion status
      // This prevents infinite "Loading onboarding..." when user has completed onboarding
      // but the session context has stale data
      if (!hasRefreshed.current) {
        hasRefreshed.current = true;
        await refresh();
        // After refresh, the useEffect will re-run with fresh session data
        // so we return here to let it re-run
        return;
      }
      // TypeScript guard: session is checked above, but we need to assert it here
      if (!session) {
        router.push("/login?returnTo=/onboarding");
        return;
      }

      const subscriptionStatus = session.subscription?.status;
      const planCategory = session.subscription?.planCategory;
      const pendingPlanCode = session.pendingPlanCode;
      const role = session.role;

      // ROLE SECURITY: Admins and Super Admins should NEVER see onboarding
      if (role === "ADMIN" || role === "SUPER_ADMIN") {
        console.log("[OnboardingRouter] Admin role detected, redirecting to /admin");
        router.push("/admin");
        return;
      }

      // Log plan resolution for debugging
      console.log("[OnboardingRouter] Plan resolution:", {
        subscriptionStatus,
        planCategory,
        pendingPlanCode,
        hasSubscription: !!session.subscription,
      });

      // CRITICAL: If user has INCOMPLETE subscription or pendingPlanCode without active subscription,
      // they need to complete checkout first - redirect to checkout, NOT onboarding
      if (
        subscriptionStatus === "INCOMPLETE" ||
        (pendingPlanCode &&
          subscriptionStatus !== "ACTIVE" &&
          subscriptionStatus !== "TRIALING")
      ) {
        const planCodeToCheckout =
          session.subscription?.planCode || pendingPlanCode;
        if (planCodeToCheckout) {
          console.log(
            "[OnboardingRouter] Payment required, redirecting to checkout:",
            planCodeToCheckout,
          );
          // Redirect to checkout
          const origin =
            typeof window !== "undefined" ? window.location.origin : "";
          fetch("/api/billing/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              planCode: planCodeToCheckout,
              successUrl: `${origin}/billing/success`,
              cancelUrl: `${origin}/billing/cancel`,
            }),
            credentials: "include",
          })
            .then(async (res) => {
              if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                console.error("[OnboardingRouter] Checkout API error:", {
                  status: res.status,
                  statusText: res.statusText,
                  error: errorData,
                  planCode: planCodeToCheckout,
                });

                // Show user-friendly error message
                if (errorData.error?.includes("Plan not found")) {
                  alert(
                    `The plan "${planCodeToCheckout}" hasn't been set up in Stripe yet.\n\n` +
                      `Please ask the administrator to create this plan in Stripe.\n\n` +
                      `Redirecting you to the pricing page to select another plan.`,
                  );
                } else {
                  alert(
                    `Unable to start checkout: ${errorData.error || "Unknown error"}\n\n` +
                      `Please try again or contact support.`,
                  );
                }

                router.push("/pricing");
                return null;
              }
              return res.json();
            })
            .then((data) => {
              if (!data) return; // Already handled error above

              if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
              } else if (data.redirectUrl) {
                // Some responses might have redirectUrl instead
                window.location.href = data.redirectUrl;
              } else {
                console.error("[OnboardingRouter] Checkout failed:", data);
                alert(
                  `Checkout session created but no redirect URL provided.\n\n` +
                    `Message: ${data.message || "Unknown error"}\n\n` +
                    `Please try again or contact support.`,
                );
                router.push("/pricing");
              }
            })
            .catch((err) => {
              console.error("[OnboardingRouter] Checkout error:", err);
              alert(
                `Failed to connect to checkout service.\n\n` +
                  `Error: ${err.message}\n\n` +
                  `Please check your internet connection and try again.`,
              );
              router.push("/pricing");
            });
          return;
        }
      }

      // Route to onboarding based on planCategory from subscription OR pendingPlanCode
      // The backend resolves planCategory from pendingPlanCode when subscription status is INCOMPLETE
      // So we should use the planCategory from the session, which should be resolved correctly

      // If no planCategory is available and no pendingPlanCode, redirect to pricing
      if (!planCategory && !pendingPlanCode) {
        console.log(
          "[OnboardingRouter] No plan category and no pending plan code, redirecting to pricing",
        );
        router.push("/pricing");
        return;
      }

      // If we have a planCategory (from subscription or resolved from pendingPlanCode), route accordingly
      // Note: Users with INCOMPLETE subscriptions should have planCategory resolved from pendingPlanCode
      if (!planCategory) {
        // This shouldn't happen if backend is working correctly, but as a safety fallback
        console.log(
          "[OnboardingRouter] No plan category resolved, redirecting to pricing",
        );
        router.push("/pricing");
        return;
      }

      // Route to plan-specific onboarding using canonical mapping
      const { getOnboardingRouteForPlanCategory } =
        await import("@/lib/onboarding-routes");
      const onboardingRoute = getOnboardingRouteForPlanCategory(planCategory);

      if (onboardingRoute) {
        if (onboardingRoute === pathname) {
          return;
        }
        // Check if onboarding already completed for this plan category
        const isCompleted =
          ((planCategory === "CALENDAR_ONLY" ||
            planCategory === "VISUAL_CALENDAR" ||
            planCategory === "JEWELRY_CALENDAR_ONLY") &&
            session.calendarOnboardingCompleted) ||
          ((planCategory === "VISUAL_ADD_ON" ||
            planCategory === "REGULAR_VISUAL" ||
            planCategory === "JEWELRY_VISUAL") &&
            session.visualOnboardingCompleted) ||
          ((planCategory === "FULL_MANAGEMENT" ||
            planCategory === "JEWELRY_FULL_MANAGEMENT") &&
            session.fullManagementOnboardingCompleted);

        if (isCompleted) {
          router.push("/dashboard");
        } else {
          router.push(onboardingRoute);
        }
      } else {
        // Unknown plan category - redirect to pricing (never default to Calendar)
        console.log("[OnboardingRouter] Unknown plan category:", planCategory);
        router.push("/pricing");
      }
    }

    routeToOnboarding();
  }, [session, loading, router, pathname, refresh]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center space-y-3">
        <div className="h-8 w-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-300">Loading onboarding...</p>
      </div>
    </div>
  );
}

export default function OnboardingRouterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
          <div className="text-center space-y-3">
            <div className="h-8 w-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-300">Loading...</p>
          </div>
        </div>
      }
    >
      <OnboardingRouterContent />
    </Suspense>
  );
}
