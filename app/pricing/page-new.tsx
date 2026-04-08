"use client";

import { Suspense, useState } from "react";
import dynamicImport from "next/dynamic";
import { Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getPlanGroupsByType,
  type MasterPlanType,
  type PlanCategory,
  type PricingPlan,
  type PlanGroup,
} from "@/lib/pricing-data";

const Navbar = dynamicImport(() => import("@/components/navbar"), {
  ssr: false,
});

const FooterSecondary = dynamicImport(
  () => import("@/components/footer-secondary"),
  {
    ssr: false,
  }
);

export default function PricingPage() {
  const [masterPlan, setMasterPlan] = useState<MasterPlanType>("regular");
  const [ctaLoading, setCtaLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleStartTrial = async (
    plan: PricingPlan,
    category: PlanCategory,
    masterType: MasterPlanType
  ) => {
    const planIdentifier = `${masterType}_${category}_${plan.displayName.replace(/\s+/g, "_").toLowerCase()}`;
    setCtaLoading(planIdentifier);

    try {
      // Store selection in localStorage and query params
      const selectionData = {
        master: masterType,
        category,
        planName: plan.displayName,
        price: plan.price,
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("pending_plan_selection", JSON.stringify(selectionData));
      }

      // Redirect to signup with selection params
      const params = new URLSearchParams({
        master: masterType,
        category,
        plan: plan.displayName,
      });
      
      router.push(`/signup?${params.toString()}`);
    } catch (err) {
      console.error("Failed to persist plan selection:", err);
    } finally {
      setCtaLoading(null);
    }
  };

  const currentPlanGroups = getPlanGroupsByType(masterPlan);

  return (
    <div className="min-h-screen bg-slate-950">
      <Suspense fallback={<div className="h-16" />}>
        <Navbar />
      </Suspense>

      {/* STEP 2: Page Header */}
      <section className="pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto text-center pt-24 lg:pt-32">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Simple Pricing for Automated Social Media
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto">
            Choose how hands-off you want to be — from planning only, to AI
            visuals, to full social media management.
          </p>
        </div>
      </section>

      {/* STEP 1: Master Plan Toggle (Regular vs Jewelry) */}
      <section className="pb-8 px-4">
        <div className="max-w-7xl mx-auto flex justify-center">
          <Tabs
            defaultValue="regular"
            value={masterPlan}
            onValueChange={(value) => setMasterPlan(value as MasterPlanType)}
            className="w-full max-w-md"
          >
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="regular">Regular Businesses</TabsTrigger>
              <TabsTrigger value="jewelry">Jewelry Brands</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </section>

      {/* STEP 3: Founder Pricing Banner */}
      <section className="pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-lime-400/20 to-lime-600/20 border-2 border-lime-400/50 rounded-2xl p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-lime-400/5 via-transparent to-lime-400/5 animate-pulse" />
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Sparkles className="w-6 h-6 text-lime-400" />
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  🎉 Founder Pricing Available
                </h2>
                <Sparkles className="w-6 h-6 text-lime-400" />
              </div>
              <p className="text-lg text-slate-200 mb-4 max-w-2xl mx-auto">
                First 25 customers lock in{" "}
                <strong className="text-lime-400">30% OFF for life</strong>
                <br />
                <span className="text-slate-300">Ends June 30th, 2026</span>
              </p>
              <Link
                href="/signup"
                className="inline-block bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold px-8 py-4 rounded-full transition-all transform hover:scale-105 shadow-lg mb-3"
              >
                👉 Claim Founder Pricing
              </Link>
              <div>
                <Link
                  href="#founder-terms"
                  className="text-sm text-lime-300 hover:text-lime-200 underline"
                >
                  Founder Pricing Terms & Conditions
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STEP 4-7: Plan Groups with Cross-fade Animation */}
      <div className="relative">
        <TabsContent
          value="regular"
          className={`transition-opacity duration-500 ${masterPlan === "regular" ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none"}`}
        >
          <PlanGroupsDisplay
            planGroups={currentPlanGroups}
            masterType="regular"
            onStartTrial={handleStartTrial}
            ctaLoading={ctaLoading}
          />
        </TabsContent>

        <TabsContent
          value="jewelry"
          className={`transition-opacity duration-500 ${masterPlan === "jewelry" ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none"}`}
        >
          <PlanGroupsDisplay
            planGroups={currentPlanGroups}
            masterType="jewelry"
            onStartTrial={handleStartTrial}
            ctaLoading={ctaLoading}
          />
        </TabsContent>
      </div>

      {/* STEP 8: Global Reassurance Strip */}
      <ReassuranceStrip />

      {/* STEP 9: FAQ Section */}
      <FAQSection />

      <Suspense fallback={<div className="h-64" />}>
        <FooterSecondary />
      </Suspense>
    </div>
  );
}

// Plan Groups Display Component
function PlanGroupsDisplay({
  planGroups,
  masterType,
  onStartTrial,
  ctaLoading,
}: {
  planGroups: PlanGroup[];
  masterType: MasterPlanType;
  onStartTrial: (
    plan: PricingPlan,
    category: PlanCategory,
    masterType: MasterPlanType
  ) => void;
  ctaLoading: string | null;
}) {
  return (
    <div className="space-y-16 pb-16">
      {planGroups.map((group, idx) => (
        <section
          key={group.id}
          className={`px-4 ${idx % 2 === 1 ? "bg-slate-900/30" : ""}`}
        >
          <div className="max-w-7xl mx-auto py-12">
            {/* Group Header */}
            <div className="mb-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <span className="text-4xl">{group.icon}</span>
                <h2 className="text-3xl sm:text-4xl font-bold text-white">
                  {group.title}
                </h2>
              </div>
              <p className="text-xl text-slate-300 mb-2">{group.subtitle}</p>
              <p className="text-sm text-lime-400 font-semibold">
                {group.positioning}
              </p>
            </div>

            {/* Plan Cards */}
            <div
              className={`grid gap-6 ${
                group.plans.length <= 3
                  ? "md:grid-cols-3"
                  : group.plans.length === 4
                    ? "md:grid-cols-2 lg:grid-cols-4"
                    : "md:grid-cols-2 lg:grid-cols-5"
              }`}
            >
              {group.plans.map((plan) => {
                const planIdentifier = `${masterType}_${group.id}_${plan.displayName.replace(/\s+/g, "_").toLowerCase()}`;
                const isLoading = ctaLoading === planIdentifier;

                return (
                  <div
                    key={plan.displayName}
                    className={`relative bg-slate-900/60 border rounded-2xl p-6 hover:border-lime-400/50 transition-all flex flex-col ${
                      plan.isPopular
                        ? "border-lime-400 shadow-lg shadow-lime-400/20 transform scale-105"
                        : "border-slate-800"
                    }`}
                  >
                    {plan.isPopular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-lime-400 text-slate-950 px-4 py-1 rounded-full text-sm font-semibold">
                        Most Popular
                      </div>
                    )}

                    {/* Plan Name */}
                    <h3 className="text-xl font-bold text-white mb-2">
                      {plan.displayName}
                    </h3>

                    {/* Price */}
                    <div className="mb-4">
                      {plan.price === 0 ? (
                        <span className="text-3xl font-bold text-lime-400">
                          Free Trial
                        </span>
                      ) : (
                        <>
                          <span className="text-3xl font-bold text-lime-400">
                            ${plan.price}
                          </span>
                          <span className="text-slate-400">/month</span>
                        </>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 mb-6 flex-grow">
                      {plan.features.map((feature, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-slate-300"
                        >
                          <Check className="w-5 h-5 text-lime-400 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Additional Info */}
                    {plan.additionalInfo && (
                      <p className="text-sm text-slate-400 mb-4">
                        {plan.additionalInfo}
                      </p>
                    )}

                    {/* CTA Button */}
                    <button
                      onClick={() =>
                        onStartTrial(plan, group.id, masterType)
                      }
                      disabled={isLoading}
                      className={`w-full font-semibold py-3 rounded-full transition-all disabled:opacity-60 ${
                        plan.isPopular
                          ? "bg-lime-400 hover:bg-lime-300 text-slate-950"
                          : "bg-slate-800 hover:bg-slate-700 text-white"
                      }`}
                    >
                      {isLoading ? "Loading..." : "Start 7-Day Free Trial"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

// Reassurance Strip Component
function ReassuranceStrip() {
  const reassurances = [
    "Start your 7-day free trial",
    "No credit card required",
    "Cancel anytime",
    "No long-term contracts",
    "Upgrade or downgrade anytime",
  ];

  return (
    <section className="py-12 px-4 bg-slate-900/50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8">
          {reassurances.map((text, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 text-slate-200"
            >
              <Check className="w-5 h-5 text-lime-400 flex-shrink-0" />
              <span className="text-sm md:text-base font-medium">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// FAQ Section Component
function FAQSection() {
  const faqs = [
    {
      question: "What happens when I start a free trial?",
      answer: "You get full access for 7 days.",
    },
    {
      question: "Do I need a credit card?",
      answer: "No credit card required.",
    },
    {
      question: "Can I cancel anytime?",
      answer: "Yes — one click cancellation.",
    },
    {
      question: "Can I upgrade or downgrade later?",
      answer: "Yes, plans are flexible.",
    },
    {
      question: "Is Founder Pricing permanent?",
      answer:
        "Yes — 30% off for life for the first 25 customers.",
    },
  ];

  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">
          Frequently Asked Questions
        </h2>
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, idx) => (
            <AccordionItem
              key={idx}
              value={`item-${idx}`}
              className="bg-slate-900/60 border border-slate-800 rounded-xl px-6"
            >
              <AccordionTrigger className="text-lg font-semibold text-white hover:text-lime-400">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-slate-300">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
