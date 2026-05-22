"use client";

import { Suspense, useEffect, useState } from "react";
import dynamicImport from "next/dynamic";
import { Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUiStore } from "@/store/uiStore";

// Dynamically import components that use client-side hooks to prevent SSR issues
const Navbar = dynamicImport(() => import("@/components/navbar"), {
  ssr: false,
});

const FooterSecondary = dynamicImport(
  () => import("@/components/footer-secondary"),
  {
    ssr: false,
  }
);

type Plan = {
  code: string;
  name: string;
  description: string;
  category: string;
  isJewelry: boolean;
  platformLimit: number | null;
  baseVisualQuota: number | null;
  basePostQuota: number | null;
  priceStandardCents: number;
  priceFounderCents: number;
};

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPlanCode, setCurrentPlanCode] = useState<string | null>(null);
  const [ctaLoading, setCtaLoading] = useState<string | null>(null);
  const [ctaError, setCtaError] = useState<string | null>(null);
  const router = useRouter();
  const setSelectedPlanId = useUiStore((state) => state.setSelectedPlanId);

  useEffect(() => {
    async function loadPlans() {
      try {
        const res = await fetch("/api/billing/plans", { cache: "no-store" });
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          setPlans(data);
        }
      } catch (err) {
        console.error("Failed to load plans:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPlans();
  }, []);

  useEffect(() => {
    async function loadCurrentPlan() {
      try {
        const res = await fetch("/api/billing/summary", {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.currentPlan?.code) {
          setCurrentPlanCode(data.currentPlan.code);
        }
      } catch {
        // ignore summary load errors
      }
    }
    loadCurrentPlan();
  }, []);

  const handleStartCheckout = async (planCode: string) => {
    setCtaError(null);
    setCtaLoading(planCode);
    try {
      // Find the plan to get its category and determine if it's paid
      // Persist plan selection before redirecting
      if (typeof window !== "undefined") {
        const { persistPlanSelection } = await import("@/lib/plan-selection");
        persistPlanSelection(planCode);
      }
      setSelectedPlanId(planCode);

      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planCode }),
      });
      if (res.status === 401) {
        // Redirect to signup/login with plan in query params
        router.push(`/signup?plan=${planCode}`);
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || "Unable to start checkout");
      }
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setCtaError(
        err instanceof Error ? err.message : "Unable to start checkout"
      );
    } finally {
      setCtaLoading(null);
    }
  };

  const sorted = [...plans].sort(
    (a, b) => a.priceStandardCents - b.priceStandardCents
  );

  const calendarPlans = sorted.filter(
    (p) => !p.isJewelry && p.category === "CALENDAR_ONLY"
  );
  const visualPlans = sorted.filter(
    (p) =>
      !p.isJewelry &&
      (p.category === "VISUAL_ADD_ON" || p.category === "REGULAR_VISUAL")
  );
  const fullPlans = sorted.filter(
    (p) => !p.isJewelry && p.category === "FULL_MANAGEMENT"
  );

  const jewelryCalendarPlans = sorted.filter(
    (p) => p.isJewelry && p.category === "JEWELRY_CALENDAR_ONLY"
  );
  const jewelryVisualPlans = sorted.filter(
    (p) => p.isJewelry && p.category === "JEWELRY_VISUAL"
  );
  const jewelryFullPlans = sorted.filter(
    (p) => p.isJewelry && p.category === "JEWELRY_FULL_MANAGEMENT"
  );

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(0)}`;

  return (
    <div className="min-h-screen bg-slate-950">
      <Suspense fallback={<div className="h-16" />}>
        <Navbar />
      </Suspense>

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto text-center pt-24 lg:pt-32">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Simple pricing for growing brands
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto">
            Choose how hands-off you want to be. Start light with planning only,
            or let Talexia run your entire social media engine.
          </p>
        </div>
      </section>

      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-lime-400 border-r-transparent"></div>
          <p className="mt-4 text-slate-400">Loading plans...</p>
        </div>
      ) : (
        <>
          {ctaError && (
            <div className="max-w-3xl mx-auto px-4">
              <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                {ctaError}
              </div>
            </div>
          )}
          {/* Calendar Plans */}
          <section className="py-12 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-3">
                  Calendar Plans
                </h2>
                <p className="text-slate-300">
                  Perfect for businesses that create their own content but need
                  structure and scheduling.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {calendarPlans.map((plan) => (
                  <div
                    key={plan.code}
                    className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-lime-400/50 transition-all"
                  >
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {plan?.description}
                    </h3>
                    <h3 className="text-md font-semibold text-slate-400 mb-2">
                      {plan.name}
                    </h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-lime-400">
                        {formatPrice(plan.priceStandardCents)}
                      </span>
                      <span className="text-slate-400">/month</span>
                    </div>
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-start gap-2 text-slate-300">
                        <Check className="w-5 h-5 text-lime-400 flex-shrink-0 mt-0.5" />
                        <span>
                          {plan.platformLimit} social account
                          {plan.platformLimit !== 1 ? "s" : ""}
                        </span>
                      </li>
                      <li className="flex items-start gap-2 text-slate-300">
                        <Check className="w-5 h-5 text-lime-400 flex-shrink-0 mt-0.5" />
                        <span>Content scheduling & calendar</span>
                      </li>
                      <li className="flex items-start gap-2 text-slate-300">
                        <Check className="w-5 h-5 text-lime-400 flex-shrink-0 mt-0.5" />
                        <span>Automated posting</span>
                      </li>
                    </ul>
                    <button
                      onClick={() => handleStartCheckout(plan.code)}
                      disabled={ctaLoading === plan.code}
                      className="block w-full text-center bg-lime-400 hover:bg-lime-300 text-slate-950 font-semibold py-3 rounded-full transition-colors disabled:opacity-60"
                    >
                      {currentPlanCode === plan.code
                        ? "Current Plan"
                        : ctaLoading === plan.code
                          ? "Redirecting..."
                          : "Get Started"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Visual Add-On Plans */}
          <section className="py-12 px-4 bg-slate-900/30">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-3">
                  Visual Add-Ons
                </h2>
                <p className="text-slate-300">
                  AI-enhanced visuals to elevate your brand without the full
                  management package.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {visualPlans.map((plan) => (
                  <div
                    key={plan.code}
                    className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-lime-400/50 transition-all"
                  >
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {plan?.description}
                    </h3>
                    <h3 className="text-md font-semibold text-slate-400 mb-2">
                      {plan.name}
                    </h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-lime-400">
                        {formatPrice(plan.priceStandardCents)}
                      </span>
                      <span className="text-slate-400">/month</span>
                    </div>
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-start gap-2 text-slate-300">
                        <Check className="w-5 h-5 text-lime-400 flex-shrink-0 mt-0.5" />
                        <span>{plan.baseVisualQuota} enhanced visuals</span>
                      </li>
                      <li className="flex items-start gap-2 text-slate-300">
                        <Check className="w-5 h-5 text-lime-400 flex-shrink-0 mt-0.5" />
                        <span>1 revision per visual</span>
                      </li>
                      <li className="flex items-start gap-2 text-slate-300">
                        <Check className="w-5 h-5 text-lime-400 flex-shrink-0 mt-0.5" />
                        <span>AI-powered enhancement</span>
                      </li>
                    </ul>
                    <button
                      onClick={() => handleStartCheckout(plan.code)}
                      disabled={ctaLoading === plan.code}
                      className="block w-full text-center bg-lime-400 hover:bg-lime-300 text-slate-950 font-semibold py-3 rounded-full transition-colors disabled:opacity-60"
                    >
                      {currentPlanCode === plan.code
                        ? "Current Plan"
                        : ctaLoading === plan.code
                          ? "Redirecting..."
                          : "Get Started"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Full Management Plans */}
          <section className="py-12 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-3">
                  Full Management
                </h2>
                <p className="text-slate-300">
                  Complete social media management with AI visuals, captions,
                  and automated posting.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {fullPlans.map((plan, idx) => (
                  <div
                    key={plan.code}
                    className={`bg-slate-900/60 border rounded-2xl p-6 hover:border-lime-400/50 transition-all relative ${
                      idx === 1
                        ? "border-lime-400 shadow-lg shadow-lime-400/20"
                        : "border-slate-800"
                    }`}
                  >
                    {idx === 1 && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-lime-400 text-slate-950 px-4 py-1 rounded-full text-sm font-semibold">
                        Most Popular
                      </div>
                    )}
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {plan?.description}
                    </h3>
                    <h3 className="text-md font-semibold text-slate-400 mb-2">
                      {plan.name}
                    </h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-lime-400">
                        {formatPrice(plan.priceStandardCents)}
                      </span>
                      <span className="text-slate-400">/month</span>
                    </div>
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-start gap-2 text-slate-300">
                        <Check className="w-5 h-5 text-lime-400 flex-shrink-0 mt-0.5" />
                        <span>
                          {plan.platformLimit} social account
                          {plan.platformLimit !== 1 ? "s" : ""}
                        </span>
                      </li>
                      <li className="flex items-start gap-2 text-slate-300">
                        <Check className="w-5 h-5 text-lime-400 flex-shrink-0 mt-0.5" />
                        <span>{plan.baseVisualQuota} enhanced visuals</span>
                      </li>
                      <li className="flex items-start gap-2 text-slate-300">
                        <Check className="w-5 h-5 text-lime-400 flex-shrink-0 mt-0.5" />
                        <span>{plan.basePostQuota} posts per month</span>
                      </li>
                      <li className="flex items-start gap-2 text-slate-300">
                        <Check className="w-5 h-5 text-lime-400 flex-shrink-0 mt-0.5" />
                        <span>AI captions & hashtags</span>
                      </li>
                      <li className="flex items-start gap-2 text-slate-300">
                        <Check className="w-5 h-5 text-lime-400 flex-shrink-0 mt-0.5" />
                        <span>Automated scheduling</span>
                      </li>
                    </ul>
                    <button
                      onClick={() => handleStartCheckout(plan.code)}
                      disabled={ctaLoading === plan.code}
                      className={`block w-full text-center font-semibold py-3 rounded-full transition-colors disabled:opacity-60 ${
                        idx === 1
                          ? "bg-lime-400 hover:bg-lime-300 text-slate-950"
                          : "bg-slate-800 hover:bg-slate-700 text-white"
                      }`}
                    >
                      {currentPlanCode === plan.code
                        ? "Current Plan"
                        : ctaLoading === plan.code
                          ? "Redirecting..."
                          : "Get Started"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Jewelry Plans */}
          <section className="py-12 px-4 bg-slate-900/30">
            <div className="max-w-7xl mx-auto space-y-12">
              <div>
                <h2 className="text-3xl font-bold text-white mb-3">
                  Jewelry Plans
                </h2>
                <p className="text-slate-300">
                  Purpose-built tiers for jewelry brands and retailers, sorted
                  from lowest to highest.
                </p>
              </div>

              {/* Jewelry Calendar */}
              {jewelryCalendarPlans.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Calendar Only
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {jewelryCalendarPlans.map((plan) => (
                      <div
                        key={plan.name}
                        className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-lime-400/50 transition-all"
                      >
                        <h4 className="text-lg font-semibold text-white mb-2">
                          {plan.description}
                        </h4>
                        <p className="text-sm text-slate-400 mb-3">
                          {plan.name}
                        </p>
                        <div className="mb-4">
                          <span className="text-3xl font-bold text-lime-400">
                            {formatPrice(plan.priceStandardCents)}
                          </span>
                          <span className="text-slate-400">/month</span>
                        </div>
                        <ul className="space-y-3 mb-6 text-slate-300 text-sm">
                          <li className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-lime-400 flex-shrink-0 mt-0.5" />
                            <span>{plan.platformLimit} platforms</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-lime-400 flex-shrink-0 mt-0.5" />
                            <span>Calendar & scheduling</span>
                          </li>
                        </ul>
                        <button
                          onClick={() => handleStartCheckout(plan.code)}
                          disabled={ctaLoading === plan.code}
                          className="block w-full text-center bg-lime-400 hover:bg-lime-300 text-slate-950 font-semibold py-3 rounded-full transition-colors disabled:opacity-60"
                        >
                          {currentPlanCode === plan.code
                            ? "Current Plan"
                            : ctaLoading === plan.code
                              ? "Redirecting..."
                              : "Get Started"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Jewelry Visual */}
              {jewelryVisualPlans.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Visual Add-Ons
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {jewelryVisualPlans.map((plan) => (
                      <div
                        key={plan.code}
                        className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-lime-400/50 transition-all"
                      >
                        <h4 className="text-lg font-semibold text-white mb-2">
                          {plan.description}
                        </h4>
                        <p className="text-sm text-slate-400 mb-3">
                          {plan.name}
                        </p>
                        <div className="mb-4">
                          <span className="text-3xl font-bold text-lime-400">
                            {formatPrice(plan.priceStandardCents)}
                          </span>
                          <span className="text-slate-400">/month</span>
                        </div>
                        <ul className="space-y-3 mb-6 text-slate-300 text-sm">
                          <li className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-lime-400 flex-shrink-0 mt-0.5" />
                            <span>{plan.baseVisualQuota} enhanced visuals</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-lime-400 flex-shrink-0 mt-0.5" />
                            <span>Jewelry-focused edits & polish</span>
                          </li>
                        </ul>
                        <button
                          onClick={() => handleStartCheckout(plan.code)}
                          disabled={ctaLoading === plan.code}
                          className="block w-full text-center bg-lime-400 hover:bg-lime-300 text-slate-950 font-semibold py-3 rounded-full transition-colors disabled:opacity-60"
                        >
                          {currentPlanCode === plan.code
                            ? "Current Plan"
                            : ctaLoading === plan.code
                              ? "Redirecting..."
                              : "Get Started"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Jewelry Full Management */}
              {jewelryFullPlans.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Full Management
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {jewelryFullPlans.map((plan, idx) => (
                      <div
                        key={plan.code}
                        className={`bg-slate-900/60 border rounded-2xl p-6 hover:border-lime-400/50 transition-all relative ${
                          idx === 1
                            ? "border-lime-400 shadow-lg shadow-lime-400/20"
                            : "border-slate-800"
                        }`}
                      >
                        {idx === 1 && (
                          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-lime-400 text-slate-950 px-4 py-1 rounded-full text-sm font-semibold">
                            Most Popular
                          </div>
                        )}
                        <h4 className="text-lg font-semibold text-white mb-2">
                          {plan.description}
                        </h4>
                        <p className="text-sm text-slate-400 mb-3">
                          {plan.name}
                        </p>
                        <div className="mb-4">
                          <span className="text-3xl font-bold text-lime-400">
                            {formatPrice(plan.priceStandardCents)}
                          </span>
                          <span className="text-slate-400">/month</span>
                        </div>
                        <ul className="space-y-3 mb-6 text-slate-300 text-sm">
                          <li className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-lime-400 flex-shrink-0 mt-0.5" />
                            <span>{plan.platformLimit} platforms</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-lime-400 flex-shrink-0 mt-0.5" />
                            <span>{plan.basePostQuota} posts / month</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-lime-400 flex-shrink-0 mt-0.5" />
                            <span>{plan.baseVisualQuota} enhanced visuals</span>
                          </li>
                        </ul>
                        <button
                          onClick={() => handleStartCheckout(plan.code)}
                          disabled={ctaLoading === plan.code}
                          className="block w-full text-center bg-lime-400 hover:bg-lime-300 text-slate-950 font-semibold py-3 rounded-full transition-colors disabled:opacity-60"
                        >
                          {currentPlanCode === plan.code
                            ? "Current Plan"
                            : ctaLoading === plan.code
                              ? "Redirecting..."
                              : "Get Started"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
          {/* Founder Pricing Banner */}
          <section className="py-12 px-4">
            <div className="max-w-4xl mx-auto bg-gradient-to-r from-lime-400/10 to-lime-600/10 border border-lime-400/30 rounded-2xl p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-3">
                Founder Pricing Available
              </h3>
              <p className="text-slate-300 mb-4">
                Be one of the first 25 customers and get{" "}
                <strong className="text-lime-400">30% off forever</strong>. Lock
                in founder pricing now—once you cancel, it&apos;s gone for good.
              </p>
              <Link
                href="/signup"
                className="inline-block bg-lime-400 hover:bg-lime-300 text-slate-950 font-semibold px-8 py-3 rounded-full transition-colors"
              >
                Claim Founder Pricing
              </Link>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="py-16 px-4 bg-slate-900/30">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">
                Frequently Asked Questions
              </h2>
              <div className="space-y-6">
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    What plan is best for me?
                  </h3>
                  <p className="text-slate-300">
                    <strong>Calendar-Only:</strong> If you create your own
                    content and just need scheduling.
                    <br />
                    <strong>Visual Add-Ons:</strong> If you need AI-enhanced
                    visuals but handle posting yourself.
                    <br />
                    <strong>Full Management:</strong> If you want complete
                    hands-off social media management.
                  </p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Can I cancel anytime?
                  </h3>
                  <p className="text-slate-300">
                    Yes! You can cancel your subscription at any time.
                    You&apos;ll retain access until the end of your billing
                    period. Note: Cancelling founder pricing means you lose the
                    discount permanently.
                  </p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    What platforms do you support?
                  </h3>
                  <p className="text-slate-300">
                    We currently support Instagram, Facebook, and LinkedIn. More
                    platforms coming soon!
                  </p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Do you offer refunds?
                  </h3>
                  <p className="text-slate-300">
                    All subscriptions are non-refundable due to the immediate
                    activation of digital services. See our{" "}
                    <Link
                      href="/refund-policy"
                      className="text-lime-400 hover:text-lime-300"
                    >
                      Refund Policy
                    </Link>{" "}
                    for details.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      <Suspense fallback={<div className="h-64" />}>
        <FooterSecondary />
      </Suspense>
    </div>
  );
}
