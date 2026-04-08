"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUiStore } from "@/store/uiStore";

type Plan = {
  code: string;
  name: string;
  category: string;
  isJewelry: boolean;
  platformLimit: number | null;
  baseVisualQuota: number | null;
  basePostQuota: number | null;
  priceStandardCents: number;
  priceFounderCents: number;
};

const categoryMeta: Record<string, { title: string; description: string }> = {
  CALENDAR_ONLY: {
    title: "Calendar Plans",
    description:
      "Smart social media calendar for organizing and scheduling posts",
  },
  VISUAL_ADD_ON: {
    title: "Visual Add-On Plans",
    description: "AI-powered visual creation and enhancement",
  },
  FULL_MANAGEMENT: {
    title: "Full Management Plans",
    description: "Complete social media management service",
  },
};

export default function PricingCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const category = (params?.category as string)?.toUpperCase();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const setSelectedPlanId = useUiStore((state) => state.setSelectedPlanId);

  const handleCheckout = useCallback(
    async (planCode: string) => {
      // Find the plan to get its category and determine if it's paid
      // Persist plan selection before redirecting
      if (typeof window !== "undefined") {
        const { persistPlanSelection } = await import("@/lib/plan-selection");
        persistPlanSelection(planCode);
      }
      setSelectedPlanId(planCode);

      if (!isAuthenticated) {
        // Redirect to signup with plan in query params
        router.push(`/signup?plan=${planCode}`);
        return;
      }

      try {
        const origin = window.location.origin;
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
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error("[CategoryPage] Checkout API error:", {
            status: res.status,
            statusText: res.statusText,
            error: errorData,
            planCode
          });
          
          // Show user-friendly error message
          if (errorData.error?.includes("Plan not found")) {
            alert(
              `⚠️ Plan Not Set Up in Stripe\n\n` +
              `The plan "${planCode}" hasn't been created in Stripe yet.\n\n` +
              `Please contact support or try a different plan.\n\n` +
              `For administrators: Run the setup script to create all Stripe products.`
            );
          } else if (errorData.error?.includes("already subscribed")) {
            alert(
              `You are already subscribed to this plan.\n\n` +
              `Please go to your dashboard to manage your subscription.`
            );
            router.push("/dashboard");
          } else {
            alert(
              `Unable to start checkout\n\n` +
              `Error: ${errorData.error || errorData.message || "Unknown error"}\n\n` +
              `Please try again or contact support.`
            );
          }
          return;
        }
        
        const data = await res.json();
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        } else {
          alert(data.message || "Checkout session created");
        }
      } catch (error) {
        console.error("[CategoryPage] Checkout error:", error);
        alert(
          `Failed to connect to checkout service.\n\n` +
          `Error: ${error instanceof Error ? error.message : "Unknown error"}\n\n` +
          `Please check your internet connection and try again.`
        );
      }
    },
    [isAuthenticated, router, setSelectedPlanId]
  );

  useEffect(() => {
    async function load() {
      try {
        const [plansRes, authRes] = await Promise.all([
          fetch("/api/billing/plans", { cache: "no-store" }),
          fetch("/api/auth/me", { cache: "no-store", credentials: "include" }),
        ]);

        if (plansRes.ok) {
          const data = await plansRes.json();
          const filtered = data
            .filter((p: Plan) => p.category === category)
            .sort(
              (a: Plan, b: Plan) => a.priceStandardCents - b.priceStandardCents
            );
          setPlans(filtered);
        }

        const authenticated = authRes.ok;
        setIsAuthenticated(authenticated);

        // Check if there's a plan selection from before login
        if (authenticated && typeof window !== "undefined") {
          const { getPlanSelection, clearPlanSelection } =
            await import("@/lib/plan-selection");
          const selection = getPlanSelection();
          if (selection && selection.planCode) {
            clearPlanSelection();
            // Trigger checkout after a short delay to ensure page is loaded
            setTimeout(() => handleCheckout(selection.planCode!), 500);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [category, handleCheckout]);

  const meta = categoryMeta[category] || { title: "Plans", description: "" };
  const regularPlans = plans.filter((p) => !p.isJewelry);
  const jewelryPlans = plans.filter((p) => p.isJewelry);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Loading plans...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <button
          onClick={() => router.push("/#pricing")}
          className="mb-8 text-lime-400 hover:text-lime-300 flex items-center gap-2"
        >
          ← Back to overview
        </button>

        <header className="mb-12">
          <h1 className="font-stack_sans_notch text-4xl font-bold text-white mb-3">
            {meta.title}
          </h1>
          <p className="text-slate-300 text-lg">{meta.description}</p>
        </header>

        {regularPlans.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-6">
              Standard Plans
            </h2>
            <PricingTable plans={regularPlans} onCheckout={handleCheckout} />
          </section>
        )}

        {jewelryPlans.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold text-white mb-6">
              Jewelry Plans
            </h2>
            <PricingTable plans={jewelryPlans} onCheckout={handleCheckout} />
          </section>
        )}
      </div>
    </div>
  );
}

function PricingTable({
  plans,
  onCheckout,
}: {
  plans: Plan[];
  onCheckout: (code: string) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-800 hover:bg-slate-900/50">
            <TableHead className="text-slate-300 font-semibold">Plan</TableHead>
            <TableHead className="text-slate-300 font-semibold">
              Platforms
            </TableHead>
            <TableHead className="text-slate-300 font-semibold">
              Visuals
            </TableHead>
            <TableHead className="text-slate-300 font-semibold">
              Posts
            </TableHead>
            <TableHead className="text-slate-300 font-semibold">
              Standard Price
            </TableHead>
            <TableHead className="text-slate-300 font-semibold">
              Founder Price
            </TableHead>
            <TableHead className="text-slate-300 font-semibold"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((plan) => (
            <TableRow
              key={plan.code}
              className="border-slate-800 hover:bg-slate-900/50"
            >
              <TableCell className="font-medium text-white">
                {plan.name}
              </TableCell>
              <TableCell className="text-slate-300">
                {plan.platformLimit || "—"}
              </TableCell>
              <TableCell className="text-slate-300">
                {plan.baseVisualQuota || "—"}
              </TableCell>
              <TableCell className="text-slate-300">
                {plan.basePostQuota || "—"}
              </TableCell>
              <TableCell className="text-white font-semibold">
                ${(plan.priceStandardCents / 100).toFixed(0)}/mo
              </TableCell>
              <TableCell className="text-lime-400 font-semibold">
                ${(plan.priceFounderCents / 100).toFixed(0)}/mo
              </TableCell>
              <TableCell>
                <button
                  onClick={() => onCheckout(plan.code)}
                  className="rounded-full bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-lime-300 transition"
                >
                  Get Started
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
