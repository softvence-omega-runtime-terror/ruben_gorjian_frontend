"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import Navbar from "@/components/navbar";
import heroImage from "@/components/assets/new_img.png";
import whiskImage from "@/components/assets/whisk.png";
import contentCalendarImage from "@/components/assets/Content_1.png";
import FooterSecondary from "@/components/footer-secondary";
import {
  Calendar,
  Camera,
  CameraIcon,
  ImageDown,
  MessageCircle,
} from "lucide-react";
import { getPlanByLookupKey } from "@/lib/pricing-catalog";
import { PLAN_KEYS, type PlanKey } from "@/lib/pricing-comparison";
import { persistPlanSelection } from "@/lib/plan-selection";
import { useUiStore } from "@/store/uiStore";
import { Tooltip } from "react-tooltip";
import {ScanFace, Sparkles} from 'lucide-react'
import { Button } from "@/components/ui/button";

type BillingCycle = "monthly" | "yearly";

const PLAN_SUBTITLES: Record<PlanKey, string> = {
  "FMP-20": "Complete done-for-you posting",
  "FMP-35": "More content. Broader reach.",
  "FM-70": "Your dedicated digital marketing team",
};

const PLAN_BADGES: Partial<Record<PlanKey, string>> = {
  "FMP-35": "Most Popular",
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

const capabilityRows = [
  ["Brand profile + guidelines", "Yes", "Yes", "Yes"],
  ["AI caption variants", "Yes", "Yes", "Yes"],
  ["Visual production support", "Yes", "Yes", "Yes"],
  ["Who publishes posts", "Talexia", "Talexia", "Talexia"],
  ["Platform limit", "1", "2 (IG & FB)", "3 (IG, FB & TikTok)"],
  ["Monthly posts", "Up to 12", "Up to 16", "Up to 20"],
];

type ProductionIntensive = {
  title: string;
  price: string;
  features: string[];
  link: string;
};

export default function HomePage() {
  const productionIntensives: ProductionIntensive[] = [
    {
      title: "Half-Day Intensive",
      price: "$1,650",
      features: [
        "✓ 4 Hours On-Site Production",
        "✓ Edited Visual Assets (Images and/or Video)",
        "✓ Photo or Video choice based on your needs",
        "✓ Professional Lighting & Setup",
        "✓ Full Creative Direction",
        "✓ 100% High-Resolution Delivery",
        "✓ Best for seasonal menu launches",
      ],
      link: "https://www.rubengorjian.com/book-a-production-consultation",
    },
    {
      title: "FULL-DAY COMMERCIAL",
      price: "$2,750",
      features: [
        "✓ 8 Hours On-Site Production",
        "✓ Edited Visual Assets (Images and/or Video)",
        "✓ Photo or Video choice based on your needs",
        "✓ Strategic Creative Direction",
        "✓ Advanced Professional Lighting & Setup",
        "✓ 100% High-Resolution Delivery",
        "✓ Best for Grand Openings & Rebranding",
      ],
      link: "https://www.rubengorjian.com/book-a-production-consultation",
    },
  ];
  const howItWorks = [
    {
      icon: <Camera className="w-6 h-6 text-white" />,
      title: "Professional Food & Vibe Shoots",
      description:
        "High-quality photos and video reels that make your menu and atmosphere look irresistible.",
    },
    {
      icon: <MessageCircle className="w-6 h-6 text-white" />,
      title: "Done-For-You Captions",
      description:
        "Engaging captions written for your brand. Stop staring at a blank screen and say goodbye to random posting.",
    },
    {
      icon: <Calendar className="w-6 h-6 text-white" />,
      title: "Automated Scheduling",
      description:
        "Set it and forget it. Your posts go live automatically, exactly when they should, even during your busiest dinner rushes.",
    },
    {
      icon: <ScanFace className="w-6 h-6 text-white" />,
      title: "Multi-Platform Presence",
      description:
        "Reach your customers everywhere they scroll. Instagram, Facebook, LinkedIn and TikTok, all handled in one place.",
    },
  ];
  const howItWorks2 = [
    {
      icon: <ImageDown className="h-6 w-6" />,
      title: "Ready-to-Go Captions",
      description:
        "Every post is written for you in advance. No random posting. No last-minute writing. No staring at a blank screen.",
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: "Hands-Off Publishing",
      description:
        "Your posts are pre-scheduled across all platforms on a simple monthly calendar. You approve the plan. It runs.",
    },
    {
      icon: <CameraIcon className="h-6 w-6" />,
      title: "Monthly Photo Shoots",
      description:
        "We come to you to capture stunning photos and videos that perfectly match your restaurant's unique vibe.",
    },
  ];

  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });
        setIsAuthenticated(res.ok);
      } catch {
        setIsAuthenticated(false);
      }
    }
    checkAuth();
  }, []);

  const plans = useMemo(() => {
    return PLAN_KEYS.map((key) => {
      const plan = getPlanByLookupKey(key);
      if (!plan) return null;
      const monthly = plan.priceStandard;
      const yearlyMonthlyEquivalent = Math.round(monthly * 0.8);
      const active =
        billingCycle === "monthly" ? monthly : yearlyMonthlyEquivalent;
      return {
        key,
        plan,
        displayPrice: active,
        billingNote:
          billingCycle === "monthly"
            ? "Per month"
            : `Billed annually (${formatPrice(yearlyMonthlyEquivalent * 12)}/year)`,
      };
    }).filter(Boolean) as Array<{
      key: PlanKey;
      plan: NonNullable<ReturnType<typeof getPlanByLookupKey>>;
      displayPrice: number;
      billingNote: string;
    }>;
  }, [billingCycle]);

  const handleSelectPlan = async (planKey: PlanKey) => {
    const plan = getPlanByLookupKey(planKey);
    if (!plan) return;
    const category = "full";
    persistPlanSelection(plan.lookupKey, {
      master: "regular",
      category,
      planName: plan.name,
      planSlug: plan.lookupKey,
    });
    useUiStore.setState({
      selectedPlanId: plan.lookupKey,
      selectedPlanMeta: {
        master: "regular",
        category,
        planName: plan.name,
        planSlug: plan.lookupKey,
      },
    });
    if (!isAuthenticated) {
      router.push(`/signup?plan=${plan.lookupKey}&cycle=${billingCycle}`);
      return;
    }
    // Redirect to checkout page so user can add addons and coupons
    router.push(`/billing/checkout?plan=${plan.lookupKey}&cycle=${billingCycle}`);
  };

  return (
    <main className="min-h-screen bg-white text-[#1f2230]">
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>
      <section className="px-4 pb-16 pt-14 sm:pt-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <h1 className="mt-3 text-4xl font-bold sm:text-[2.9rem] font-sora leading-normal text-primary">
              We Shoot the Food. <br />
              We Post the Content. <br />
              You Run the Restaurant. <br />{" "}
            </h1>

            <p className="mt-5 max-w-xl text-base text-secondary sm:text-lg">
              No chaos. No freelancers. No inconsistency.
              <br />
              We Shoot the photos. <br />
              You Approve the plan. <br />
              We Run Your Social Media Postings. <br />
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button
                asChild
                size="lg"
                variant="shiny"
                className="rounded-full px-8"
              >
                <Link href="/pricing">Signup</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full px-8"
              >
                <Link href="/case-studies">Case Studies</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full px-8"
              >
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
          <div>
            <Image
              src={heroImage}
              alt="Talexia landing visual"
              className="h-auto w-full object-cover"
              priority
            />
          </div>
        </div>
      </section>
      <section id="features" className="px-4 py-16 bg-primary">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div className="flex flex-col items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white">
                  On-brand operations
                </p>
                <h2 className="mt-3 text-white text-3xl font-bold leading-tight sm:text-4xl font-sora">
                  How the Talexia System Works For You{" "}
                </h2>
                <p className="mt-4 text-white">
                  Replace disconnected tools with one workflow that carries plan
                  limits, brand profile context, and publishing rules from start
                  to finish.
                </p>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-1">
                <div className="mt-6 rounded-2xl border border-[#f1d7cc] bg-[#fff3ec]/70 p-2">
                  <Image
                    src={whiskImage}
                    alt="Talexia feature"
                    width={550}
                    height={450}
                    className="h-auto w-full rounded-xl"
                  />
                </div>
              </div>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-1 md:mt-0">
              {howItWorks.map((step, index) => (
                <div
                  key={step.title}
                  className="flex flex-row items-start gap-2"
                >
                  <div className="flex flex-col items-center gap-2">
                    {step.icon}
                    {index !== howItWorks.length - 1 && (
                      <div className="text-white h-[60px] w-[1px] bg-white/90 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex flex-col items-start gap-2">
                    <h3 className="text-2xl font-semibold text-white">
                      {step.title}
                    </h3>
                    <p className="text-sm text-white">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section id="how-it-works" className="px-4 mt-10">
        <div className="mx-auto max-w-6xl rounded-3xl border border-[#dfe2ec] bg-white p-6 sm:p-8 space-y-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#777b86]">
            How Talexia Works
          </p>

          <div className="mt-6 gap-4">
            <article className="w-full md:w-1/2 space-y-5 text-primary">
              <h2 className="text-3xl font-bold sm:text-4xl font-sora">
                From Shoot to Scheduled, Without the Chaos
              </h2>
              <p className="text-sm text-secondary">
                We replace scattered, last-minute posting with a reliable system
                that runs your social media on autopilot.
              </p>
            </article>
          </div>
          <div className="flex md:flex-row flex-col items-start gap-2 mt-6 text-primary">
            {howItWorks2.map((step, index) => (
              <div key={index} className="flex flex-col items-start space-y-5">
                <div>{step.icon}</div>
                <h3 className="text-3xl font-semibold md:w-2/3 w-full font-sora">
                  {step.title}
                </h3>
                <p className="text-sm text-secondary md:w-2/3 w-full">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <article className="rounded-2xl border border-[#dde1ee] bg-white p-6 mt-10 space-y-10 text-primary">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#777b86]">
              Your Content Calendar
            </p>
            <h2 className="text-4xl font-bold w-full md:w-1/2 font-sora text-primary">
              What Your Content Looks Like When It Runs with Talexia
            </h2>
            <p className="mt-2 text-sm text-secondary w-full md:w-1/2">
              See exactly what’s going live, weeks in advance. No more
              scrambling for daily posts.
            </p>

            <Image
              src={contentCalendarImage}
              alt="Content Calendar"
              className="h-auto w-full rounded-xl"
            />
          </article>
        </div>
      </section>
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-6xl rounded-3xl border border-[#dfe2ec] bg-white p-6 sm:p-8 space-y-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-10">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#777b86]">
                Plan capability snapshot
              </p>
              <h2 className="mt-2 text-2xl font-bold text-xxl sm:text-4xl font-sora text-primary">
                What each Talexia plan includes
              </h2>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/pricing">View full pricing</Link>
            </Button>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <caption className="sr-only">
                Comparison of Full Management plan features
              </caption>
              <thead>
                <tr className="border-b border-[#e5e8f0] text-secondary">
                  <th scope="col" className="py-3 pr-4 font-semibold">
                    Feature
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Full Management
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Full Management Plus
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Full Management Premium
                  </th>
                </tr>
              </thead>
              <tbody>
                {capabilityRows.map(([label, calendar, visual, full]) => (
                  <tr key={label} className="border-b border-[#edf0f6]">
                    <td className="py-3 pr-4 font-medium text-primary border-r-2 border-[#e5e8f0]">
                      {label}
                    </td>
                    <td className="px-3 py-3 text-primary">{calendar}</td>
                    <td className="px-3 py-3 text-primary">{visual}</td>
                    <td className="px-3 py-3 text-primary">{full}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-5xl rounded-3xl border border-indigo-800/10 bg-indigo-800/5 p-7 text-center sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Your brand in good hands
          </p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl font-sora text-primary">
            Plan smarter, post faster, and stay consistently on-brand.
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-[#545969]">
            Talexia centralizes your workflow from brand profile to scheduled
            posts, so teams can deliver consistent output for every client.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" variant="shiny" className="rounded-full px-8">
              <Link href="/pricing">Choose your plan</Link>
            </Button>
            {/* <Button asChild size="lg" variant="outline" className="rounded-full px-8">
              <a href="/contact">Talk to sales</a>
            </Button> */}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="px-4 text-center pb-16">
        <div className="mx-auto max-w-6xl rounded-3xl border border-[#dfe2ec] bg-white p-6 sm:p-8 space-y-10 text-center">
          <div className="mt-6 gap-4 text-center">
            <article className="w-full space-y-5 text-primary">
              <h2 className="text-3xl font-bold sm:text-4xl font-sora">
                For Restaurants Ready to Graduate to Professional Marketing
              </h2>
              <p className="text-sm text-secondary">
                Built for established restaurants that know their online
                presence is just as important as their menu.
              </p>
            </article>

            <article className="w-full space-y-5 text-primary">
              <h3 className="text-3xl font-bold sm:text-4xl font-sora">
                You already generate consistent revenue
              </h3>
              <p className="text-sm text-secondary">
                Now you need a professional social media presence that runs
                itself.
              </p>
            </article>
            <article className="w-full space-y-5 text-primary">
              <h3 className="text-3xl font-bold sm:text-4xl font-sora">
                What Life With Talexia Looks Like.
              </h3>
              <ul className="text-sm text-secondary list-style-none mx-auto">
                <li className="">✓ Consistent weekly posts</li>
                <li className="">✓ No last-minute posting</li>
                <li className="">✓ Stunning photos of your food & vibe</li>
              </ul>
            </article>
          </div>
          <div className="flex flex-row items-start gap-2 mt-6 text-primary"></div>
        </div>
      </section>

      {/* Pricing Plan Start */}
      <section className="px-4 pb-16">
        <div className="space-y-10">
          <div className="mx-auto flex w-full max-w-4xl flex-row items-center justify-center">
            <div className="inline-flex items-center rounded-full border-2 border-primary bg-primary p-1 gap-1 shadow-lg">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={cn(
                  "rounded-full px-7 py-2 text-sm font-bold transition-all duration-300 select-none",
                  billingCycle === "monthly"
                    ? "bg-white text-primary shadow-md"
                    : "bg-transparent text-white hover:bg-white/10"
                )}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={cn(
                  "rounded-full px-7 py-2 text-sm font-bold transition-all duration-300 select-none",
                  billingCycle === "yearly"
                    ? "bg-white text-primary shadow-md"
                    : "bg-transparent text-white hover:bg-white/10"
                )}
              >
                Yearly
                {billingCycle !== "yearly" && (
                  <span className="ml-2 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    Save 20%
                  </span>
                )}
              </button>
            </div>
          </div>
          <div
            className="mx-auto max-w-6xl pt-10 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 lg:overflow-visible lg:snap-none"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <div className="flex gap-4 lg:grid lg:grid-cols-3">
              {plans.map(({ key, plan, displayPrice, billingNote }) => {
                const isHighlighted = key === "FMP-35";
                return (
                  <article
                    key={key}
                    className={`flex-shrink-0 w-[85vw] max-w-[340px] snap-start rounded-2xl border p-5 shadow-sm lg:w-auto lg:max-w-none ${
                      isHighlighted
                        ? "border-primary bg-primary/10"
                        : "border-[#d7d8df] bg-white"
                    }`}
                  >
                    <div className="min-h-[52px]">
                      {PLAN_BADGES[key] ? (
                        <span className="inline-flex rounded-full bg-[#111827] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                          {PLAN_BADGES[key]}
                        </span>
                      ) : null}
                    </div>
                    <h2 className="mt-3 text-lg font-semibold">{plan.name}</h2>
                    <p className="mt-2 text-sm text-[#5d6170]">
                      {PLAN_SUBTITLES[key]}
                    </p>
                    <p className="mt-5 text-4xl font-semibold leading-none">
                      {formatPrice(displayPrice)}
                    </p>
                    <p className="mt-2 text-xs text-[#6c6f7d]">{billingNote}</p>
                    <button
                      onClick={() => handleSelectPlan(key)}
                      className={`mt-5 w-full rounded-full px-4 py-3 text-sm font-bold transition-all duration-200 ${
                        isHighlighted
                          ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.02] active:scale-[0.98]"
                          : "bg-primary text-white hover:bg-primary/85 hover:shadow-md hover:scale-[1.01] active:scale-[0.99]"
                      }`}
                    >
                      {isAuthenticated ? "Choose Plan" : "Sign Up"}
                    </button>
                    <ul className="mt-5 space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li
                          key={feature.label + String(idx)}
                          {...(feature.tooltip
                            ? {
                                "data-tooltip-id": `pricing-tooltip-${key}`,
                                "data-tooltip-content": feature.tooltip,
                              }
                            : {})}
                          className="flex items-start gap-2 text-sm text-[#4f5160]"
                        >
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#4a5dff]" />
                          <span>{feature.label}</span>
                        </li>
                      ))}
                    </ul>
                    <Tooltip
                      id={`pricing-tooltip-${key}`}
                      className="max-w-xs"
                    />
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>
      {/* Pricing Plan End */}
      <section
        id="production"
        className="px-4 pb-16"
        aria-labelledby="production-heading"
      >
        <div className="mx-auto grid max-w-6xl gap-6 rounded-3xl border border-[#dfe2ec] bg-white p-6 sm:p-8 lg:grid-cols-1 ">
          <div className="text-center space-y-10">
            {/* <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#777b86]">
              Production
            </p> */}
            <h2
              id="production-heading"
              className="mt-2 text-3xl sm:text-4l font-bold w-1/3 mx-auto font-sora text-primary"
            >
              High-Impact Production Intensives
            </h2>
            <p className="mt-3 text-sm text-[#55596a]">
              Designed for established brands that need a total visual overhaul,
              a seasonal menu launch, or a professional grand opening campaign.
            </p>
            <div className="mx-auto flex w-full flex-col items-center justify-around gap-6 p-6 sm:p-8 lg:flex-row">
              {productionIntensives.map((item, index) => (
                <div
                  key={index}
                  className="w-full md:w-1/2 space-y-5 rounded-xl border border-primary p-6 text-center"
                >
                   <div className="w-full rounded-lg bg-primary p-4 text-center text-2xl font-bold uppercase text-white font-sora shadow-lg">
                    {item.title}
                  </div>
                  <p className="text-xl font-bold font-sora">{item.price}</p>
                  <ul className="list-inside list-style-none text-left">
                    {item.features.map((feature, index) => (
                      <li key={index} className="text-sm text-[#55596a]">
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-8 space-y-4 px-6 pb-6 text-center mx-auto">
              <Button
                size="lg"
                className="w-full max-w-[450px] mx-auto rounded-xl bg-[#1c2231] px-8 py-4 text-xl font-bold font-sora text-white transition-all duration-300 hover:bg-[#1c2231]/95 hover:shadow-xl active:scale-[0.98] h-auto"
                onClick={() => {
                  window.location.href =
                    "https://rgp.17hats.com/p#/lcf/vgbbgkzhtwtrvdpzdxdnvpxcszpwwbkk";
                }}
              >
                Book a Production Consultation
              </Button>
              <div className="space-y-1">
                <p className="text-xl font-bold text-[#1c2231] font-sora">
                  Limited availability per month. Secure your date 4 weeks in advance
                </p>
                <p className="text-base text-[#1c2231]/80 font-poppins">
                  Redirecting to the Ruben Gorjian Photography secure booking portal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <FooterSecondary />
    </main>
  );
}
