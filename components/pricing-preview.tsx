"use client";
import { useEffect, useMemo, useState } from "react";
import { CircleCheckBig } from "lucide-react";
import Link from "next/link";

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

type Tier = {
  title: string;
  subtitle: string;
  slug: string;
  description: { text: string }[];
  plans: Plan[];
};

export default function PricingPreview() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPlans() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/billing/plans", { cache: "no-store" });
        const data = await res.json();
        console.log("Plans", data);
        if (!res.ok) {
          throw new Error(data?.error || "Unable to load plans.");
        }
        setPlans(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        console.error(err);
        const message =
          err instanceof Error ? err.message : "Unable to load plans.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }
    loadPlans();
  }, []);

  const tiers: Tier[] = useMemo(() => {
    const grouped: Record<string, Plan[]> = {
      CALENDAR_ONLY: [],
      VISUAL_ADD_ON: [],
      VISUAL_CALENDAR: [],
      FULL_MANAGEMENT: [],
    };
    plans.forEach((plan) => {
      if (grouped[plan.category]) grouped[plan.category].push(plan);
    });

    // Only Full Management tier is offered; Calendar and Visual plans removed.
    const fullManagementTier = {
      title: "Full Management",
      subtitle: "Full Social Media Management",
      slug: "Done-for-you engine",
      description: [
        { text: "All services inclusive, Talexia handles everything" },
        { text: "planning, AI visuals, captions" },
        { text: "hashtags, scheduling, and publishing" },
        { text: "plus monthly optimization" },
        { text: "Your professional auto-social media department" },
        { text: "Focus on running your business" },
        { text: "While Talexia grows your online presence" },
      ],
      plans: grouped.FULL_MANAGEMENT,
    };

    return [fullManagementTier];
  }, [plans]);

  return (
    <section
      id="pricing"
      className="border-t bg-gradient-to-b from-indigo-950 to-slate-950 border-slate-800"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <header className="mb-10 max-w-3xl">
          <h2 className="font-stack_sans_notch text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-[2.65rem] lg:leading-[1.1]">
            Simple packages for growing brands
          </h2>
          <p className="mt-3 font-poppins leading-relaxed text-base leading-relaxed text-slate-300 sm:text-lg">
            Choose how hands-off you want to be. Start light with planning only,
            or let Talexia run your entire social media engine.
          </p>
        </header>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-lime-400 border-r-transparent"></div>
            <p className="mt-4 text-slate-400">Loading plans...</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-800 bg-red-950/50 p-6 text-center">
            <p className="text-red-400 font-semibold mb-2">
              Unable to load pricing plans
            </p>
            <p className="text-slate-400 text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-full bg-lime-400 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-lime-300"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <div>
            <div className="grid gap-6 md:grid-cols-3 font-poppins">
              {tiers.map((tier) => (
                <div
                  key={tier.title}
                  className="flex h-full gap-6 flex-col rounded-2xl border border-slate-800 bg-slate-950/70 p-5"
                >
                  <div className="flex justify-between">
                    <h3 className="font-stack_sans_notch  text-base md:text-md lg:text-2xl font-semibold text-slate-50">
                      {tier.title}
                    </h3>
                    <span className="text-lime-300 bg-lime-400/10 border border-lime-400/60 hover:bg-lime-300/60 hover:text-slate-900  rounded-full h-10 text-xs font-light shadow-sm flex items-center justify-center px-4 py-2">
                      {tier.slug}
                    </span>
                  </div>
                  <p className="text-lime-300 font-semibold">
                    What&apos;s included
                  </p>
                  <div className="text-sm text-slate-300 flex flex-col gap-3">
                    {tier?.description?.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-start gap-3 capitalize"
                      >
                        <CircleCheckBig className="text-slate-300 h-4 w-4" />
                        <p className="flex flex-grow">{item?.text}</p>
                      </div>
                    ))}
                  </div>

                  <Link
                    href={`/pricing/${tier.title === "Calendar" ? "calendar" : tier.title === "Visuals" ? "visual" : "full"}`}
                    className="flex items-center justify-center rounded-full bg-lime-400 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow hover:bg-lime-300"
                  >
                    View Prices
                  </Link>
                </div>
              ))}
            </div>

            {/* <div className="mt-8 max-w-xl space-y-4 text-sm text-slate-300 font-poppins">
            <p className="text-md">
              We’re currently in private beta. Share a few details about your
              business and we’ll recommend the best plan.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center rounded-full bg-lime-400 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow hover:bg-lime-300"
            >
              Talk to Talexia
            </a>
          </div> */}
          </div>
        )}
      </div>
    </section>
  );
}
