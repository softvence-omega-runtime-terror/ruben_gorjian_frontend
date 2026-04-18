<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> xerox
"use client";

import { useMemo, useState, useEffect } from "react";
import {
  CreditCard,
  Receipt,
  Zap,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Calendar,
  XCircle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip } from "react-tooltip";
import { getCustomerPortalUrl } from "./utils";
import type { Invoice, Plan } from "./types";
import { apiGet, apiPost } from "@/lib/api";
import { PLAN_KEYS, type PlanKey } from "@/lib/pricing-comparison";
import { getPlanByLookupKey } from "@/lib/pricing-catalog";
import { cn } from "@/lib/utils";

const PLAN_SUBTITLES: Record<PlanKey, string> = {
  "FMP-20": "Complete done-for-you posting",
  "FMP-35": "More content. Broader reach.",
  "FM-70": "Your dedicated digital marketing team",
};

const PLAN_BADGES: Partial<Record<PlanKey, string>> = {
  "FMP-35": "Most Popular",
};

const PLANS_COLLAPSED_STORAGE_KEY = "talexia-billing-plans-collapsed";

function formatPlanPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

type UsageSummary = {
  postsUsed: number;
  postsLimit: number;
  visualsUsed: number;
  visualsLimit: number;
};

export default function BillingPage() {
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const [plan, setPlan] = useState<Plan | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [allPlans, setAllPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [plansExpanded, setPlansExpanded] = useState(true);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  // New states for subscription management
  const [schedulingPlan, setSchedulingPlan] = useState<PlanKey | null>(null);
  const [confirmCancelSub, setConfirmCancelSub] = useState(false);
  const [confirmCancelSchedule, setConfirmCancelSchedule] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PLANS_COLLAPSED_STORAGE_KEY);
      if (stored !== null) setPlansExpanded(stored !== "true");
    } catch {
      // ignore
    }
  }, []);

  const togglePlansExpanded = () => {
    setPlansExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(PLANS_COLLAPSED_STORAGE_KEY, String(!next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const usage: UsageSummary = useMemo(
    () => ({
      postsUsed: plan?.usage?.postsUsed || 0,
      postsLimit: plan?.postQuota || 0,
      visualsUsed: plan?.usage?.visualsUsed || 0,
      visualsLimit: plan?.visualQuota || 0,
    }),
    [plan],
  );

  const postLimitType = plan?.postLimitType || "NONE";

  // Fallback to pricing catalog when API returns plan code but missing name/price (e.g. plan relation not loaded)
  const currentPlanDisplay = useMemo(() => {
    if (!plan) return null;
    const catalogPlan = plan.code
      ? getPlanByLookupKey(plan.code as PlanKey)
      : null;
    
    // Exact price from plan object
    const priceCents = plan.price > 0 ? plan.price : 0;
    
    // If it's a yearly plan, we might want to show the monthly equivalent if the price is high
    const isYearly = plan.interval === "year";
    const displayPriceCents = isYearly && priceCents > 100000 
      ? Math.round(priceCents / 12) 
      : priceCents;

    const rawEnd = plan.current_period_end ?? plan.renewsAt;
    const renewalDate = rawEnd
      ? (() => {
          const d =
            typeof rawEnd === "number"
              ? new Date(rawEnd * 1000)
              : new Date(rawEnd);
          if (Number.isNaN(d.getTime())) return "—";
          return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
        })()
      : "—";
    return {
      name: catalogPlan?.name || plan.name || plan.code || "—",
      price: displayPriceCents,
      totalPrice: priceCents,
      currency: plan.currency || "usd",
      interval: plan.interval || "month",
      priceType: plan.priceType === "FOUNDER" ? "🎉 Founder" : "Standard",
      status: plan.status || "—",
      renewsAt: renewalDate,
    };
  }, [plan]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [summary, invoicesRes, plansRes] = await Promise.all([
        apiGet<{ 
          success: boolean;
          plan: any;
          subscription: any;
          scheduledChange?: any;
        }>("/api/billing/current-plan"),
        apiGet<{ items: Invoice[] }>("/api/billing/invoices"),
        apiGet<any[]>("/api/billing/plans"),
      ]);
      
      const plansList = Array.isArray(plansRes) ? plansRes : [];
      setAllPlans(plansList);
      
      if (summary.success && summary.plan) {
        const matchingPlan = plansList.find(p => p.code === summary.plan.code);
        const mappedPlan: Plan = {
          id: summary.subscription.id,
          name: summary.plan.name,
          code: summary.plan.code,
          price: matchingPlan ? 
            (summary.subscription.priceType === "FOUNDER" ? matchingPlan.priceFounderCents : matchingPlan.priceStandardCents) 
            : 0,
          currency: "usd",
          interval: summary.subscription.billingCycle.toLowerCase() as "month" | "year",
          current_period_end: summary.subscription.currentPeriodEnd,
          status: summary.subscription.status,
          priceType: summary.subscription.priceType,
          platformLimit: summary.plan.platformLimit,
          addonPlatformQty: summary.subscription.addonPlatformQty,
          videoAddonEnabled: summary.subscription.videoAddonEnabled,
          postLimitType: summary.plan.postLimitType,
          schedulerRole: summary.plan.schedulerRole,
          visualQuota: summary.plan.baseVisualQuota,
          postQuota: summary.plan.basePostQuota,
          cancelAtPeriodEnd: summary.subscription.cancelAtPeriodEnd,
          scheduledChange: summary.scheduledChange ? {
            targetPlanCode: summary.scheduledChange.targetPlanCode,
            targetBillingCycle: summary.scheduledChange.targetBillingCycle?.toLowerCase() || summary.subscription.billingCycle.toLowerCase(),
            effectiveAt: summary.scheduledChange.effectiveAt,
            scheduleId: summary.scheduledChange.scheduleId,
          } : null
        };
        setPlan(mappedPlan);
      } else {
        setPlan(null);
      }
      
      setInvoices(invoicesRes.items || []);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to load billing data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (loading) return;
    if (typeof window !== "undefined" && window.location.hash === "#plans") {
      document
        .getElementById("plans")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading]);

  async function startCheckout(planCode: string) {
    // If they already have a plan, show the scheduling modal instead of direct checkout
    if (plan && plan.code && plan.code !== planCode) {
      setSchedulingPlan(planCode as PlanKey);
      return;
    }

    setCheckoutError(null);
    setCheckoutLoading(planCode);
    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const res = await apiPost<{
        checkoutUrl?: string;
        redirectUrl?: string;
        error?: string;
      }>("/api/billing/checkout", {
        planCode,
        successUrl: `${origin}/billing/success`,
        cancelUrl: `${origin}/dashboard/billing`,
      });
      if (res.checkoutUrl) {
        window.location.assign(res.checkoutUrl);
        return;
      }
      if (res.redirectUrl) {
        window.location.assign(res.redirectUrl);
        return;
      }
      setCheckoutError(res.error || "Unable to start checkout.");
    } catch (err: unknown) {
      setCheckoutError(err instanceof Error ? err.message : "Checkout failed.");
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function schedulePlanChange(
    targetPlanCode: string,
    targetBillingCycle: "monthly" | "yearly",
  ) {
    setActionLoading(true);
    setCheckoutError(null);
    try {
      const res = await apiPost<{
        success: boolean;
        message: string;
        scheduleId?: string;
        effectiveAt?: string;
      }>("/api/billing/schedule-change", {
        targetPlanCode,
        targetBillingCycle,
      });
      setSuccessMessage(res.message || `Successfully scheduled plan change to ${targetPlanCode}.`);
      setSchedulingPlan(null);
      load(); // Refresh data
    } catch (err: unknown) {
      setCheckoutError(
        err instanceof Error ? err.message : "Scheduling plan change failed.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function cancelScheduledChange() {
    setActionLoading(true);
    setPortalError(null);
    try {
      const res = await apiPost<{
        success: boolean;
        message: string;
      }>("/api/billing/scheduled-change/cancel", {});
      setSuccessMessage(res.message || "Scheduled plan change has been canceled.");
      setConfirmCancelSchedule(false);
      load(); // Refresh data
    } catch (err: unknown) {
      setPortalError(
        err instanceof Error ? err.message : "Failed to cancel scheduled change.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function cancelSubscription() {
    setActionLoading(true);
    setPortalError(null);
    try {
      await apiPost("/api/billing/cancel", {});
      setSuccessMessage("Your subscription will be canceled at the end of the current period.");
      setConfirmCancelSub(false);
      load(); // Refresh data
    } catch (err: unknown) {
      setPortalError(
        err instanceof Error ? err.message : "Subscription cancellation failed.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <p className="text-slate-400">Loading billing information...</p>
        </div>
      </div>
    );
  }

  // Show no subscription state
  const noPlan = !plan && !loading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Billing
          </p>
          <h1 className="text-2xl font-semibold text-white">
            Subscription & Invoices
          </h1>
          <p className="text-sm text-slate-300">
            {/* Review your current plan and manage billing details. */}
          </p>
        </div>
      </div>
      {portalError && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          {portalError}
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg border border-lime-500/50 bg-lime-500/10 px-3 py-2 text-sm text-lime-100 flex items-center justify-between">
          <span>{successMessage}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-lime-500/20"
            onClick={() => setSuccessMessage(null)}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Card className="border-slate-800 bg-slate-900/40">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <CardTitle className="text-lg font-semibold text-white">Current Subscription</CardTitle>
            <p className="text-xs text-slate-400 mt-1">
              Manage your active plan and subscription settings.
            </p>
          </div>
          <div className="rounded-full bg-lime-400/10 p-2">
            <CreditCard className="h-5 w-5 text-lime-400" />
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {!plan ? (
            <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-slate-600" />
              </div>
              <p className="text-slate-400 font-medium">No active plan found</p>
              <p className="mt-2 text-sm text-slate-500 max-w-xs mx-auto">
                Subscribe to a plan below to start scheduling and managing your social content.
              </p>
              <Button 
                variant="outline" 
                className="mt-6 rounded-full border-slate-700 text-slate-300"
                onClick={() => {
                  document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                View Plans
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {currentPlanDisplay?.name ?? "—"}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-2xl font-bold text-lime-400">
                      {currentPlanDisplay && currentPlanDisplay.price >= 0
                        ? formatCurrency(currentPlanDisplay.price, currentPlanDisplay.currency)
                        : "—"}
                    </p>
                    <div className="flex flex-col">
                      <span className="text-sm text-slate-500">
                        per month {currentPlanDisplay?.interval === "year" ? "(billed yearly)" : ""}
                      </span>
                      {currentPlanDisplay?.interval === "year" && (
                        <span className="text-[10px] text-slate-600 font-medium">
                          {formatCurrency(currentPlanDisplay.totalPrice, currentPlanDisplay.currency)} total / year
                        </span>
                      )}
                    </div>
                    <Badge variant="outline" className="ml-2 border-lime-400/30 text-lime-400 bg-lime-400/5">
                      {currentPlanDisplay?.priceType ?? "Standard"}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    className="rounded-full bg-lime-500 hover:bg-lime-400 text-black px-6 font-bold"
                    disabled={portalLoading}
                    onClick={async () => {
                      setPortalLoading(true);
                      setPortalError(null);
                      try {
                        const url = await getCustomerPortalUrl();
                        if (url) window.location.href = url;
                        else setPortalError("Unable to open billing portal.");
                      } finally {
                        setPortalLoading(false);
                      }
                    }}
                  >
                    {portalLoading ? "Loading..." : "Manage Subscription"}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-800/50">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Status</p>
                  <div className="flex items-center gap-1.5">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      plan.status === "ACTIVE" ? "bg-green-500" : "bg-amber-500"
                    )} />
                    <span className="text-sm font-semibold text-slate-200 capitalize">
                      {plan.status.toLowerCase()}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">
                    {plan.cancelAtPeriodEnd ? "Expires On" : "Next Payment"}
                  </p>
                  <p className="text-sm font-semibold text-slate-200">
                    {currentPlanDisplay?.renewsAt ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Platforms</p>
                  <p className="text-sm font-semibold text-slate-200">
                    {(plan.platformLimit || 0) + (plan.addonPlatformQty || 0)} included
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Billing</p>
                  <p className="text-sm font-semibold text-slate-200 capitalize">
<<<<<<< HEAD
                    {currentPlanDisplay?.interval}ly
=======
                    {currentPlanDisplay?.interval === "year" ? "Yearly" : "Monthly"}
>>>>>>> xerox
                  </p>
                </div>
              </div>

              {plan.cancelAtPeriodEnd && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
                  <div className="rounded-full bg-amber-500/10 p-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-200">Subscription Cancellation Pending</p>
                    <p className="text-xs text-amber-400/80 mt-1 leading-relaxed">
                      Your subscription will automatically end on <span className="font-bold text-amber-300">{currentPlanDisplay?.renewsAt}</span>. 
                      You will continue to have full access to all features until this date.
                    </p>
                  </div>
                </div>
              )}

              {plan.scheduledChange && (
                <div className="rounded-xl border border-lime-500/30 bg-lime-500/5 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-lime-500/10 p-1.5 mt-0.5">
                      <Clock className="h-4 w-4 text-lime-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-lime-200">Scheduled Plan Change</p>
                      <p className="text-xs text-lime-400/80 mt-1 leading-relaxed">
                        Moving to <span className="font-bold text-lime-300">
                          {getPlanByLookupKey(plan.scheduledChange.targetPlanCode as PlanKey)?.name || plan.scheduledChange.targetPlanCode}
                        </span> ({plan.scheduledChange.targetBillingCycle}) effective <span className="font-bold text-lime-300">
                          {new Date(plan.scheduledChange.effectiveAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </span>.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-lime-500/30 text-lime-400 hover:bg-lime-500/20 bg-transparent h-8 px-4 text-xs font-bold uppercase tracking-wider"
                    onClick={() => setConfirmCancelSchedule(true)}
                  >
                    Cancel Change
                  </Button>
                </div>
              )}

              {plan && !plan.cancelAtPeriodEnd && (
                <div className="flex justify-start pt-2">
                  <Button
                    variant="ghost"
                    className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    onClick={() => setConfirmCancelSub(true)}
                  >
                    Cancel Subscription
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plans: same card design as pricing page, current plan highlighted and not selectable for resubscribe */}
      <Card id="plans">
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Plans</CardTitle>
            <p className="text-xs text-slate-400">
              {/* Choose or change your plan. Your current plan is highlighted; you
              cannot resubscribe to it. */}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-lime-300" />
            <div className="flex p-1 bg-slate-950 rounded-full border border-slate-800 mr-2">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={cn(
                  "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full transition",
                  billingCycle === "monthly"
                    ? "bg-lime-500 text-slate-900"
                    : "text-slate-400 hover:text-slate-200",
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={cn(
                  "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full transition",
                  billingCycle === "yearly"
                    ? "bg-lime-500 text-slate-900"
                    : "text-slate-400 hover:text-slate-200",
                )}
              >
                Yearly
              </button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={togglePlansExpanded}
              aria-expanded={plansExpanded}
              aria-label={plansExpanded ? "Collapse plans" : "Show plans"}
            >
              {plansExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {checkoutError && (
            <div className="mb-4 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
              {checkoutError}
            </div>
          )}
          {plansExpanded && (
            <div className="grid gap-4 max-w-7xl mx-auto sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
              {allPlans
                .filter((p) => p.category === "FULL_MANAGEMENT") // Only show main management plans
                .map((catalogPlan) => {
                  const planKey = catalogPlan.code as PlanKey;
                  const isCurrent = plan?.code === planKey;
                  
                  // Use the cents from the API response
                  const priceCents = catalogPlan.priceStandardCents;
                  
                  // If the price in cents is very high (e.g. > 100000), it's already a yearly price
                  const isAlreadyYearlyPrice = priceCents > 100000;
                  
                  let displayPrice: number;
                  let totalYearlyPrice: number;

                  if (billingCycle === "yearly") {
                    if (isAlreadyYearlyPrice) {
                      // It's already the discounted yearly price
                      // $9110.40 / 12 = $759.20
                      displayPrice = Math.round(priceCents / 1200);
                      totalYearlyPrice = priceCents / 100;
                    } else {
                      // Apply 20% discount to the monthly price
                      const monthlyPrice = priceCents / 100;
                      const discountedMonthly = Math.round(monthlyPrice * 0.8);
                      displayPrice = discountedMonthly;
                      totalYearlyPrice = discountedMonthly * 12;
                    }
                  } else {
                    // Monthly view
                    if (isAlreadyYearlyPrice) {
                      // Calculate original monthly price from discounted yearly price
                      // $9110.40 / 0.8 / 12 = $949
                      displayPrice = Math.round((priceCents / 0.8) / 1200);
                      totalYearlyPrice = priceCents / 100;
                    } else {
                      displayPrice = priceCents / 100;
                      totalYearlyPrice = Math.round(displayPrice * 12 * 0.8);
                    }
                  }

                  const billingNote = billingCycle === "yearly"
                    ? `Billed annually (${formatPlanPrice(totalYearlyPrice)}/year)`
                    : "Per month";

                  return (
                    <article
                      key={planKey}
                    className={cn(
                      "rounded-2xl border p-5 shadow-sm transition",
                      isCurrent
                        ? "border-lime-400/50 bg-lime-400/10"
                        : "border-slate-800 bg-slate-900/60 hover:border-slate-700",
                    )}
                  >
                    <div className="min-h-[52px]">
                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-lime-400/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-lime-300">
                          <Check className="h-3 w-3" />
                          Current plan
                        </span>
                      ) : PLAN_BADGES[planKey] ? (
                        <span className="inline-flex rounded-full bg-slate-700 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-200">
                          {PLAN_BADGES[planKey]}
                        </span>
                      ) : null}
                    </div>
                    <h2 className="mt-3 text-lg font-semibold text-white">
                      {catalogPlan?.name ?? planKey}
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                      {PLAN_SUBTITLES[planKey]}
                    </p>
                    <p className="mt-5 text-4xl font-semibold leading-none text-white">
                      {formatPlanPrice(displayPrice)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">{billingNote}</p>

                    {isCurrent ? (
                      <Button
                        className="mt-5 w-full rounded-full bg-lime-500 hover:bg-lime-400 text-slate-900"
                        disabled={portalLoading}
                        onClick={async () => {
                          setPortalLoading(true);
                          setPortalError(null);
                          try {
                            const url = await getCustomerPortalUrl();
                            if (url) window.location.href = url;
                            else
                              setPortalError("Unable to open billing portal.");
                          } finally {
                            setPortalLoading(false);
                          }
                        }}
                      >
                        {portalLoading ? "Loading..." : "Manage Subscription"}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="mt-5 w-full rounded-full bg-lime-500 text-black hover:bg-lime-400 font-bold"
                        disabled={checkoutLoading !== null}
                        onClick={() => startCheckout(planKey)}
                      >
                        {checkoutLoading === planKey
                          ? "Loading..."
                          : (getPlanByLookupKey(planKey)?.ctaLabel ?? "Choose Plan")}
                      </Button>
                    )}

                    {/* Features from catalog as fallback */}
                    {getPlanByLookupKey(planKey)?.features && (
                      <ul className="mt-5 space-y-2 text-left">
                        {getPlanByLookupKey(planKey)?.features.map((feature, idx) => {
                          const label = typeof feature === "string" ? feature : feature.label;
                          const tooltip = typeof feature === "string" ? null : feature.tooltip;
                          return (
                            <li
                              key={label + String(idx)}
                              {...(tooltip
                                ? {
                                    "data-tooltip-id": `pricing-tooltip-billing-${planKey}`,
                                    "data-tooltip-content": tooltip,
                                  }
                                : {})}
                              className="flex items-start gap-2 text-sm text-slate-300"
                            >
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#4a5dff]" />
                              <span>{label}</span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    <Tooltip
                      id={`pricing-tooltip-billing-${planKey}`}
                      className="!bg-slate-900 max-w-xs !text-slate-200 !border !border-slate-800 !rounded-xl !p-3 !text-xs !shadow-2xl !opacity-100 z-50"
                      noArrow={false}
                    />
                  </article>


                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {!noPlan && (
        <Card>
          <CardHeader>
            <CardTitle>Plan Limits</CardTitle>
            <p className="text-xs text-slate-400">
              {/* Your plan includes these features */}
            </p>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <PlanDetail
              label="Platforms"
              value={
                (plan?.platformLimit || 0) + (plan?.addonPlatformQty || 0) > 0
                  ? `${(plan?.platformLimit || 0) + (plan?.addonPlatformQty || 0)} platform${((plan?.platformLimit || 0) + (plan?.addonPlatformQty || 0)) > 1 ? "s" : ""}`
                  : "—"
              }
            />
            <PlanDetail
              label="Visuals/month"
              value={plan?.visualQuota ? `${plan.visualQuota}` : "Unlimited"}
            />
            <PlanDetail
              label="Posts/month"
              value={
                plan?.postQuota
                  ? `${plan.postQuota}${postLimitType === "SOFT" ? " (soft limit)" : ""}`
                  : "Unlimited"
              }
            />
          </CardContent>
        </Card>
      )}

      {!noPlan && (
        <Card>
          <CardHeader>
            <CardTitle>Usage This Month</CardTitle>
            <p className="text-xs text-slate-400">
              {/* Track your monthly usage */}
            </p>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <PlanDetail
              label="Posts"
              value={
                usage.postsLimit > 0
                  ? `${usage.postsUsed} / ${usage.postsLimit}${
                      usage.postsUsed >= usage.postsLimit
                        ? postLimitType === "SOFT"
                          ? " (Soft limit exceeded)"
                          : " (Limit reached)"
                        : ""
                    }`
                  : "Unlimited"
              }
            />
            <PlanDetail
              label="Visuals"
              value={
                usage.visualsLimit > 0
                  ? `${usage.visualsUsed} / ${usage.visualsLimit}${usage.visualsUsed >= usage.visualsLimit ? " (Limit reached)" : ""}`
                  : "Unlimited"
              }
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Invoices</CardTitle>
            <p className="text-xs text-slate-400">
              {/* Most recent invoices */}
            </p>
          </div>
          <Receipt className="h-5 w-5 text-lime-300" />
        </CardHeader>
        <CardContent>
          {invoices.length > 0 ? (
            <>
              {/* Desktop Table View - hidden on mobile */}
              <div className="hidden md:block overflow-x-auto">
                <div className="min-w-full">
                  <div className="grid grid-cols-5 gap-4 text-xs uppercase tracking-wide text-slate-400 pb-2 border-b border-slate-800">
                    <div>Invoice #</div>
                    <div>Amount</div>
                    <div>Status</div>
                    <div>Date</div>
                    <div className="text-right">Action</div>
                  </div>
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="grid grid-cols-5 gap-4 items-center py-3 border-b border-slate-800/50 last:border-0 text-sm"
                    >
                      <div className="font-mono text-xs text-slate-300 truncate">
                        {invoice.number || invoice.id.slice(-8)}
                      </div>
                      <div className="font-semibold text-white">
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </div>
                      <div>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            invoice.status === "paid"
                              ? "bg-green-500/20 text-green-300"
                              : invoice.status === "open"
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-slate-700/50 text-slate-300"
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {invoice.createdAt
                          ? new Date(invoice.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )
                          : "—"}
                      </div>
                      <div className="text-right">
                        {invoice.hostedInvoiceUrl ? (
                          <a
                            href={invoice.hostedInvoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-lime-400 hover:text-lime-300 hover:underline"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-xs text-slate-500">—</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Card View - shown on mobile only */}
              <div className="md:hidden space-y-3">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Invoice #</p>
                        <p className="text-sm font-mono text-white">
                          {invoice.number || invoice.id.slice(-8)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400 mb-1">Amount</p>
                        <p className="text-sm font-semibold text-white">
                          {formatCurrency(invoice.amount, invoice.currency)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Status</p>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            invoice.status === "paid"
                              ? "bg-green-500/20 text-green-300"
                              : invoice.status === "open"
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-slate-700/50 text-slate-300"
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400 mb-1">Date</p>
                        <p className="text-xs text-slate-300">
                          {invoice.createdAt
                            ? new Date(invoice.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )
                            : "—"}
                        </p>
                      </div>
                    </div>

                    {invoice.hostedInvoiceUrl && (
                      <div className="pt-2">
                        <a
                          href={invoice.hostedInvoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-full rounded-lg bg-lime-400/10 border border-lime-400/30 px-3 py-2 text-xs font-medium text-lime-300 hover:bg-lime-400/20 transition"
                        >
                          View Invoice
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-sm text-slate-300 py-4">No invoices yet.</div>
          )}
          {error && <p className="text-xs text-red-300 mt-4">{error}</p>}
        </CardContent>
      </Card>

      {/* Confirmation Dialogs */}
      <Dialog
        open={schedulingPlan !== null}
        onOpenChange={() => setSchedulingPlan(null)}
      >
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-lime-400" />
              Schedule Plan Change
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              You are about to schedule a plan change to{" "}
              <span className="font-bold text-white">
                {schedulingPlan ? getPlanByLookupKey(schedulingPlan)?.name : ""}
              </span>
              . This change will take effect at the end of your current billing
              period ({currentPlanDisplay?.renewsAt}).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="rounded-lg bg-slate-950/50 p-4 border border-slate-800">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">New Plan:</span>
                <span className="font-semibold">
                  {schedulingPlan
                    ? getPlanByLookupKey(schedulingPlan)?.name
                    : ""}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Effective Date:</span>
                <span className="font-semibold text-lime-400">
                  {currentPlanDisplay?.renewsAt}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              * Your current features will remain active until the change date.
              * You can cancel this scheduled change at any time before it
              takes effect.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="rounded-full border-slate-700"
              onClick={() => setSchedulingPlan(null)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              className="rounded-full bg-lime-500 hover:bg-lime-400 text-slate-900"
              onClick={() =>
                schedulingPlan && schedulePlanChange(schedulingPlan, billingCycle)
              }
              disabled={actionLoading}
            >
              {actionLoading ? "Scheduling..." : "Confirm Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmCancelSub}
        onOpenChange={() => setConfirmCancelSub(false)}
      >
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Cancel Subscription
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to cancel your subscription? You will
              maintain access to all features until{" "}
              <span className="font-bold text-white">
                {currentPlanDisplay?.renewsAt}
              </span>
              , after which your subscription will end.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-300">
              Once canceled, you will lose access to:
            </p>
            <ul className="mt-3 space-y-2">
              <li className="flex items-start gap-2 text-xs text-slate-400">
                <XCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>Automated scheduling & calendar management</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-slate-400">
                <XCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>AI-powered content generation</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-slate-400">
                <XCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>Platform management & analytics</span>
              </li>
            </ul>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="rounded-full border-slate-700"
              onClick={() => setConfirmCancelSub(false)}
              disabled={actionLoading}
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              className="rounded-full"
              onClick={cancelSubscription}
              disabled={actionLoading}
            >
              {actionLoading ? "Canceling..." : "Confirm Cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmCancelSchedule}
        onOpenChange={() => setConfirmCancelSchedule(false)}
      >
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-lime-400" />
              Cancel Scheduled Change
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to cancel the scheduled plan change? Your
              current plan will remain active and will renew normally on{" "}
              <span className="font-bold text-white">
                {currentPlanDisplay?.renewsAt}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              className="rounded-full border-slate-700"
              onClick={() => setConfirmCancelSchedule(false)}
              disabled={actionLoading}
            >
              No, Keep Scheduled Change
            </Button>
            <Button
              className="rounded-full bg-lime-500 hover:bg-lime-400 text-slate-900"
              onClick={cancelScheduledChange}
              disabled={actionLoading}
            >
              {actionLoading ? "Processing..." : "Yes, Cancel Change"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PlanDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(amount / 100);
  } catch {
    return `$${(amount / 100).toFixed(2)}`;
  }
}
<<<<<<< HEAD
=======
"use client";

import { useMemo, useState, useEffect } from "react";
import {
  CreditCard,
  Receipt,
  Zap,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Calendar,
  XCircle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getCustomerPortalUrl } from "./utils";
import type { Invoice, Plan } from "./types";
import { apiGet, apiPost } from "@/lib/api";
import { PLAN_KEYS, type PlanKey } from "@/lib/pricing-comparison";
import { getPlanByLookupKey } from "@/lib/pricing-catalog";
import { cn } from "@/lib/utils";

const PLAN_SUBTITLES: Record<PlanKey, string> = {
  "FMP-20": "Done-for-you management at starter volume.",
  "FMP-35": "Our most selected full management tier.",
  "FM-70": "High-output execution for multi-client agencies.",
};

const PLAN_BADGES: Partial<Record<PlanKey, string>> = {
  "FMP-35": "Most Popular",
};

const PLANS_COLLAPSED_STORAGE_KEY = "talexia-billing-plans-collapsed";

function formatPlanPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

type UsageSummary = {
  postsUsed: number;
  postsLimit: number;
  visualsUsed: number;
  visualsLimit: number;
};

export default function BillingPage() {
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const [plan, setPlan] = useState<Plan | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [allPlans, setAllPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [plansExpanded, setPlansExpanded] = useState(true);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  // New states for subscription management
  const [schedulingPlan, setSchedulingPlan] = useState<PlanKey | null>(null);
  const [confirmCancelSub, setConfirmCancelSub] = useState(false);
  const [confirmCancelSchedule, setConfirmCancelSchedule] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PLANS_COLLAPSED_STORAGE_KEY);
      if (stored !== null) setPlansExpanded(stored !== "true");
    } catch {
      // ignore
    }
  }, []);

  const togglePlansExpanded = () => {
    setPlansExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(PLANS_COLLAPSED_STORAGE_KEY, String(!next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const usage: UsageSummary = useMemo(
    () => ({
      postsUsed: plan?.usage?.postsUsed || 0,
      postsLimit: plan?.postQuota || 0,
      visualsUsed: plan?.usage?.visualsUsed || 0,
      visualsLimit: plan?.visualQuota || 0,
    }),
    [plan],
  );

  const postLimitType = plan?.postLimitType || "NONE";

  // Fallback to pricing catalog when API returns plan code but missing name/price (e.g. plan relation not loaded)
  const currentPlanDisplay = useMemo(() => {
    if (!plan) return null;
    const catalogPlan = plan.code
      ? getPlanByLookupKey(plan.code as PlanKey)
      : null;
    
    // Exact price from plan object
    let priceCents = plan.price > 0 ? plan.price : 0;
    
    // If it's a yearly plan, we might want to show the monthly equivalent if the price is high
    const isYearly = plan.interval === "year";
    const displayPriceCents = isYearly && priceCents > 100000 
      ? Math.round(priceCents / 12) 
      : priceCents;

    const rawEnd = plan.current_period_end ?? plan.renewsAt;
    const renewalDate = rawEnd
      ? (() => {
          const d =
            typeof rawEnd === "number"
              ? new Date(rawEnd * 1000)
              : new Date(rawEnd);
          if (Number.isNaN(d.getTime())) return "—";
          return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
        })()
      : "—";
    return {
      name: catalogPlan?.name || plan.name || plan.code || "—",
      price: displayPriceCents,
      totalPrice: priceCents,
      currency: plan.currency || "usd",
      interval: plan.interval || "month",
      priceType: plan.priceType === "FOUNDER" ? "🎉 Founder" : "Standard",
      status: plan.status || "—",
      renewsAt: renewalDate,
    };
  }, [plan]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [summary, invoicesRes, plansRes] = await Promise.all([
        apiGet<{ 
          success: boolean;
          plan: any;
          subscription: any;
          scheduledChange?: any;
        }>("/api/billing/current-plan"),
        apiGet<{ items: Invoice[] }>("/api/billing/invoices"),
        apiGet<any[]>("/api/billing/plans"),
      ]);
      
      const plansList = Array.isArray(plansRes) ? plansRes : [];
      setAllPlans(plansList);
      
      if (summary.success && summary.plan) {
        const matchingPlan = plansList.find(p => p.code === summary.plan.code);
        const mappedPlan: Plan = {
          id: summary.subscription.id,
          name: summary.plan.name,
          code: summary.plan.code,
          price: matchingPlan ? 
            (summary.subscription.priceType === "FOUNDER" ? matchingPlan.priceFounderCents : matchingPlan.priceStandardCents) 
            : 0,
          currency: "usd",
          interval: summary.subscription.billingCycle.toLowerCase() as "month" | "year",
          current_period_end: summary.subscription.currentPeriodEnd,
          status: summary.subscription.status,
          priceType: summary.subscription.priceType,
          platformLimit: summary.plan.platformLimit,
          addonPlatformQty: summary.subscription.addonPlatformQty,
          videoAddonEnabled: summary.subscription.videoAddonEnabled,
          postLimitType: summary.plan.postLimitType,
          schedulerRole: summary.plan.schedulerRole,
          visualQuota: summary.plan.baseVisualQuota,
          postQuota: summary.plan.basePostQuota,
          cancelAtPeriodEnd: summary.subscription.cancelAtPeriodEnd,
          scheduledChange: summary.scheduledChange ? {
            targetPlanCode: summary.scheduledChange.targetPlanCode,
            targetBillingCycle: summary.scheduledChange.targetBillingCycle?.toLowerCase() || summary.subscription.billingCycle.toLowerCase(),
            effectiveAt: summary.scheduledChange.effectiveAt,
            scheduleId: summary.scheduledChange.scheduleId,
          } : null
        };
        setPlan(mappedPlan);
      } else {
        setPlan(null);
      }
      
      setInvoices(invoicesRes.items || []);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to load billing data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (loading) return;
    if (typeof window !== "undefined" && window.location.hash === "#plans") {
      document
        .getElementById("plans")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading]);

  async function startCheckout(planCode: string) {
    // If they already have a plan, show the scheduling modal instead of direct checkout
    if (plan && plan.code && plan.code !== planCode) {
      setSchedulingPlan(planCode as PlanKey);
      return;
    }

    setCheckoutError(null);
    setCheckoutLoading(planCode);
    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const res = await apiPost<{
        checkoutUrl?: string;
        redirectUrl?: string;
        error?: string;
      }>("/api/billing/checkout", {
        planCode,
        successUrl: `${origin}/billing/success`,
        cancelUrl: `${origin}/dashboard/billing`,
      });
      if (res.checkoutUrl) {
        window.location.assign(res.checkoutUrl);
        return;
      }
      if (res.redirectUrl) {
        window.location.assign(res.redirectUrl);
        return;
      }
      setCheckoutError(res.error || "Unable to start checkout.");
    } catch (err: unknown) {
      setCheckoutError(err instanceof Error ? err.message : "Checkout failed.");
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function schedulePlanChange(
    targetPlanCode: string,
    targetBillingCycle: "monthly" | "yearly",
  ) {
    setActionLoading(true);
    setCheckoutError(null);
    try {
      const res = await apiPost<{
        success: boolean;
        message: string;
        scheduleId?: string;
        effectiveAt?: string;
      }>("/api/billing/schedule-change", {
        targetPlanCode,
        targetBillingCycle,
      });
      setSuccessMessage(res.message || `Successfully scheduled plan change to ${targetPlanCode}.`);
      setSchedulingPlan(null);
      load(); // Refresh data
    } catch (err: unknown) {
      setCheckoutError(
        err instanceof Error ? err.message : "Scheduling plan change failed.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function cancelScheduledChange() {
    setActionLoading(true);
    setPortalError(null);
    try {
      const res = await apiPost<{
        success: boolean;
        message: string;
      }>("/api/billing/scheduled-change/cancel", {});
      setSuccessMessage(res.message || "Scheduled plan change has been canceled.");
      setConfirmCancelSchedule(false);
      load(); // Refresh data
    } catch (err: unknown) {
      setPortalError(
        err instanceof Error ? err.message : "Failed to cancel scheduled change.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function cancelSubscription() {
    setActionLoading(true);
    setPortalError(null);
    try {
      await apiPost("/api/billing/cancel", {});
      setSuccessMessage("Your subscription will be canceled at the end of the current period.");
      setConfirmCancelSub(false);
      load(); // Refresh data
    } catch (err: unknown) {
      setPortalError(
        err instanceof Error ? err.message : "Subscription cancellation failed.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <p className="text-slate-400">Loading billing information...</p>
        </div>
      </div>
    );
  }

  // Show no subscription state
  const noPlan = !plan && !loading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Billing
          </p>
          <h1 className="text-2xl font-semibold text-white">
            Subscription & Invoices
          </h1>
          <p className="text-sm text-slate-300">
            {/* Review your current plan and manage billing details. */}
          </p>
        </div>
      </div>
      {portalError && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          {portalError}
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg border border-lime-500/50 bg-lime-500/10 px-3 py-2 text-sm text-lime-100 flex items-center justify-between">
          <span>{successMessage}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-lime-500/20"
            onClick={() => setSuccessMessage(null)}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Card className="border-slate-800 bg-slate-900/40">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <CardTitle className="text-lg font-semibold text-white">Current Subscription</CardTitle>
            <p className="text-xs text-slate-400 mt-1">
              Manage your active plan and subscription settings.
            </p>
          </div>
          <div className="rounded-full bg-lime-400/10 p-2">
            <CreditCard className="h-5 w-5 text-lime-400" />
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {!plan ? (
            <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-slate-600" />
              </div>
              <p className="text-slate-400 font-medium">No active plan found</p>
              <p className="mt-2 text-sm text-slate-500 max-w-xs mx-auto">
                Subscribe to a plan below to start scheduling and managing your social content.
              </p>
              <Button 
                variant="outline" 
                className="mt-6 rounded-full border-slate-700 text-slate-300"
                onClick={() => {
                  document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                View Plans
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {currentPlanDisplay?.name ?? "—"}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-2xl font-bold text-lime-400">
                      {currentPlanDisplay && currentPlanDisplay.price >= 0
                        ? formatCurrency(currentPlanDisplay.price, currentPlanDisplay.currency)
                        : "—"}
                    </p>
                    <div className="flex flex-col">
                      <span className="text-sm text-slate-500">
                        per month {currentPlanDisplay?.interval === "year" ? "(billed yearly)" : ""}
                      </span>
                      {currentPlanDisplay?.interval === "year" && (
                        <span className="text-[10px] text-slate-600 font-medium">
                          {formatCurrency(currentPlanDisplay.totalPrice, currentPlanDisplay.currency)} total / year
                        </span>
                      )}
                    </div>
                    <Badge variant="outline" className="ml-2 border-lime-400/30 text-lime-400 bg-lime-400/5">
                      {currentPlanDisplay?.priceType ?? "Standard"}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    className="rounded-full bg-lime-500 hover:bg-lime-400 text-black px-6 font-bold"
                    disabled={portalLoading}
                    onClick={async () => {
                      setPortalLoading(true);
                      setPortalError(null);
                      try {
                        const url = await getCustomerPortalUrl();
                        if (url) window.location.href = url;
                        else setPortalError("Unable to open billing portal.");
                      } finally {
                        setPortalLoading(false);
                      }
                    }}
                  >
                    {portalLoading ? "Loading..." : "Manage Subscription"}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-800/50">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Status</p>
                  <div className="flex items-center gap-1.5">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      plan.status === "ACTIVE" ? "bg-green-500" : "bg-amber-500"
                    )} />
                    <span className="text-sm font-semibold text-slate-200 capitalize">
                      {plan.status.toLowerCase()}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">
                    {plan.cancelAtPeriodEnd ? "Expires On" : "Next Payment"}
                  </p>
                  <p className="text-sm font-semibold text-slate-200">
                    {currentPlanDisplay?.renewsAt ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Platforms</p>
                  <p className="text-sm font-semibold text-slate-200">
                    {(plan.platformLimit || 0) + (plan.addonPlatformQty || 0)} included
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Billing</p>
                  <p className="text-sm font-semibold text-slate-200 capitalize">
                    {currentPlanDisplay?.interval === "year" ? "Yearly" : "Monthly"}
                  </p>
                </div>
              </div>

              {plan.cancelAtPeriodEnd && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
                  <div className="rounded-full bg-amber-500/10 p-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-200">Subscription Cancellation Pending</p>
                    <p className="text-xs text-amber-400/80 mt-1 leading-relaxed">
                      Your subscription will automatically end on <span className="font-bold text-amber-300">{currentPlanDisplay?.renewsAt}</span>. 
                      You will continue to have full access to all features until this date.
                    </p>
                  </div>
                </div>
              )}

              {plan.scheduledChange && (
                <div className="rounded-xl border border-lime-500/30 bg-lime-500/5 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-lime-500/10 p-1.5 mt-0.5">
                      <Clock className="h-4 w-4 text-lime-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-lime-200">Scheduled Plan Change</p>
                      <p className="text-xs text-lime-400/80 mt-1 leading-relaxed">
                        Moving to <span className="font-bold text-lime-300">
                          {getPlanByLookupKey(plan.scheduledChange.targetPlanCode as PlanKey)?.name || plan.scheduledChange.targetPlanCode}
                        </span> ({plan.scheduledChange.targetBillingCycle}) effective <span className="font-bold text-lime-300">
                          {new Date(plan.scheduledChange.effectiveAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </span>.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-lime-500/30 text-lime-400 hover:bg-lime-500/20 bg-transparent h-8 px-4 text-xs font-bold uppercase tracking-wider"
                    onClick={() => setConfirmCancelSchedule(true)}
                  >
                    Cancel Change
                  </Button>
                </div>
              )}

              {plan && !plan.cancelAtPeriodEnd && (
                <div className="flex justify-start pt-2">
                  <Button
                    variant="ghost"
                    className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    onClick={() => setConfirmCancelSub(true)}
                  >
                    Cancel Subscription
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plans: same card design as pricing page, current plan highlighted and not selectable for resubscribe */}
      <Card id="plans">
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Plans</CardTitle>
            <p className="text-xs text-slate-400">
              {/* Choose or change your plan. Your current plan is highlighted; you
              cannot resubscribe to it. */}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-lime-300" />
            <div className="flex p-1 bg-slate-950 rounded-full border border-slate-800 mr-2">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={cn(
                  "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full transition",
                  billingCycle === "monthly"
                    ? "bg-lime-500 text-slate-900"
                    : "text-slate-400 hover:text-slate-200",
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={cn(
                  "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full transition",
                  billingCycle === "yearly"
                    ? "bg-lime-500 text-slate-900"
                    : "text-slate-400 hover:text-slate-200",
                )}
              >
                Yearly
              </button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={togglePlansExpanded}
              aria-expanded={plansExpanded}
              aria-label={plansExpanded ? "Collapse plans" : "Show plans"}
            >
              {plansExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {checkoutError && (
            <div className="mb-4 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
              {checkoutError}
            </div>
          )}
          {plansExpanded && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {allPlans
                .filter((p) => p.category === "FULL_MANAGEMENT") // Only show main management plans
                .map((catalogPlan) => {
                  const planKey = catalogPlan.code as PlanKey;
                  const isCurrent = plan?.code === planKey;
                  
                  // Use the cents from the API response
                  const priceCents = catalogPlan.priceStandardCents;
                  
                  // If the price in cents is very high (e.g. > 100000), it's already a yearly price
                  const isAlreadyYearlyPrice = priceCents > 100000;
                  
                  let displayPrice: number;
                  let totalYearlyPrice: number;

                  if (billingCycle === "yearly") {
                    if (isAlreadyYearlyPrice) {
                      // It's already the discounted yearly price
                      // $9110.40 / 12 = $759.20
                      displayPrice = Math.round(priceCents / 1200);
                      totalYearlyPrice = priceCents / 100;
                    } else {
                      // Apply 20% discount to the monthly price
                      const monthlyPrice = priceCents / 100;
                      const discountedMonthly = Math.round(monthlyPrice * 0.8);
                      displayPrice = discountedMonthly;
                      totalYearlyPrice = discountedMonthly * 12;
                    }
                  } else {
                    // Monthly view
                    if (isAlreadyYearlyPrice) {
                      // Calculate original monthly price from discounted yearly price
                      // $9110.40 / 0.8 / 12 = $949
                      displayPrice = Math.round((priceCents / 0.8) / 1200);
                      totalYearlyPrice = priceCents / 100;
                    } else {
                      displayPrice = priceCents / 100;
                      totalYearlyPrice = Math.round(displayPrice * 12 * 0.8);
                    }
                  }

                  const billingNote = billingCycle === "yearly"
                    ? `Billed annually (${formatPlanPrice(totalYearlyPrice)}/year)`
                    : "Billed monthly";

                  return (
                    <article
                      key={planKey}
                    className={cn(
                      "rounded-2xl border p-5 shadow-sm transition",
                      isCurrent
                        ? "border-lime-400/50 bg-lime-400/10"
                        : "border-slate-800 bg-slate-900/60 hover:border-slate-700",
                    )}
                  >
                    <div className="min-h-[52px]">
                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-lime-400/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-lime-300">
                          <Check className="h-3 w-3" />
                          Current plan
                        </span>
                      ) : PLAN_BADGES[planKey] ? (
                        <span className="inline-flex rounded-full bg-slate-700 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-200">
                          {PLAN_BADGES[planKey]}
                        </span>
                      ) : null}
                    </div>
                    <h2 className="mt-3 text-lg font-semibold text-white">
                      {catalogPlan?.name ?? planKey}
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                      {PLAN_SUBTITLES[planKey]}
                    </p>
                    <p className="mt-5 text-4xl font-semibold leading-none text-white">
                      {formatPlanPrice(displayPrice)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">{billingNote}</p>

                    {isCurrent ? (
                      <Button
                        className="mt-5 w-full rounded-full bg-lime-500 hover:bg-lime-400 text-slate-900"
                        disabled={portalLoading}
                        onClick={async () => {
                          setPortalLoading(true);
                          setPortalError(null);
                          try {
                            const url = await getCustomerPortalUrl();
                            if (url) window.location.href = url;
                            else
                              setPortalError("Unable to open billing portal.");
                          } finally {
                            setPortalLoading(false);
                          }
                        }}
                      >
                        {portalLoading ? "Loading..." : "Manage Subscription"}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="mt-5 w-full rounded-full bg-lime-500 text-black hover:bg-lime-400 font-bold"
                        disabled={checkoutLoading !== null}
                        onClick={() => startCheckout(planKey)}
                      >
                        {checkoutLoading === planKey
                          ? "Loading..."
                          : (getPlanByLookupKey(planKey)?.ctaLabel ?? "Choose Plan")}
                      </Button>
                    )}

                    {/* Features from catalog as fallback */}
                    {getPlanByLookupKey(planKey)?.features && (
                      <ul className="mt-5 space-y-2">
                        {getPlanByLookupKey(planKey)?.features.map((feature, idx) => (
                          <li
                            key={
                              typeof feature === "string"
                                ? feature
                                : feature.label + String(idx)
                            }
                            className="flex items-start gap-2 text-sm text-slate-400"
                          >
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-lime-400" />
                            <span>
                              {typeof feature === "string"
                                ? feature
                                : feature.label}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {!noPlan && (
        <Card>
          <CardHeader>
            <CardTitle>Plan Limits</CardTitle>
            <p className="text-xs text-slate-400">
              {/* Your plan includes these features */}
            </p>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <PlanDetail
              label="Platforms"
              value={
                (plan?.platformLimit || 0) + (plan?.addonPlatformQty || 0) > 0
                  ? `${(plan?.platformLimit || 0) + (plan?.addonPlatformQty || 0)} platform${((plan?.platformLimit || 0) + (plan?.addonPlatformQty || 0)) > 1 ? "s" : ""}`
                  : "—"
              }
            />
            <PlanDetail
              label="Visuals/month"
              value={plan?.visualQuota ? `${plan.visualQuota}` : "Unlimited"}
            />
            <PlanDetail
              label="Posts/month"
              value={
                plan?.postQuota
                  ? `${plan.postQuota}${postLimitType === "SOFT" ? " (soft limit)" : ""}`
                  : "Unlimited"
              }
            />
          </CardContent>
        </Card>
      )}

      {!noPlan && (
        <Card>
          <CardHeader>
            <CardTitle>Usage This Month</CardTitle>
            <p className="text-xs text-slate-400">
              {/* Track your monthly usage */}
            </p>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <PlanDetail
              label="Posts"
              value={
                usage.postsLimit > 0
                  ? `${usage.postsUsed} / ${usage.postsLimit}${
                      usage.postsUsed >= usage.postsLimit
                        ? postLimitType === "SOFT"
                          ? " (Soft limit exceeded)"
                          : " (Limit reached)"
                        : ""
                    }`
                  : "Unlimited"
              }
            />
            <PlanDetail
              label="Visuals"
              value={
                usage.visualsLimit > 0
                  ? `${usage.visualsUsed} / ${usage.visualsLimit}${usage.visualsUsed >= usage.visualsLimit ? " (Limit reached)" : ""}`
                  : "Unlimited"
              }
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Invoices</CardTitle>
            <p className="text-xs text-slate-400">
              {/* Most recent invoices */}
            </p>
          </div>
          <Receipt className="h-5 w-5 text-lime-300" />
        </CardHeader>
        <CardContent>
          {invoices.length > 0 ? (
            <>
              {/* Desktop Table View - hidden on mobile */}
              <div className="hidden md:block overflow-x-auto">
                <div className="min-w-full">
                  <div className="grid grid-cols-5 gap-4 text-xs uppercase tracking-wide text-slate-400 pb-2 border-b border-slate-800">
                    <div>Invoice #</div>
                    <div>Amount</div>
                    <div>Status</div>
                    <div>Date</div>
                    <div className="text-right">Action</div>
                  </div>
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="grid grid-cols-5 gap-4 items-center py-3 border-b border-slate-800/50 last:border-0 text-sm"
                    >
                      <div className="font-mono text-xs text-slate-300 truncate">
                        {invoice.number || invoice.id.slice(-8)}
                      </div>
                      <div className="font-semibold text-white">
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </div>
                      <div>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            invoice.status === "paid"
                              ? "bg-green-500/20 text-green-300"
                              : invoice.status === "open"
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-slate-700/50 text-slate-300"
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {invoice.createdAt
                          ? new Date(invoice.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )
                          : "—"}
                      </div>
                      <div className="text-right">
                        {invoice.hostedInvoiceUrl ? (
                          <a
                            href={invoice.hostedInvoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-lime-400 hover:text-lime-300 hover:underline"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-xs text-slate-500">—</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Card View - shown on mobile only */}
              <div className="md:hidden space-y-3">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Invoice #</p>
                        <p className="text-sm font-mono text-white">
                          {invoice.number || invoice.id.slice(-8)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400 mb-1">Amount</p>
                        <p className="text-sm font-semibold text-white">
                          {formatCurrency(invoice.amount, invoice.currency)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Status</p>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            invoice.status === "paid"
                              ? "bg-green-500/20 text-green-300"
                              : invoice.status === "open"
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-slate-700/50 text-slate-300"
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400 mb-1">Date</p>
                        <p className="text-xs text-slate-300">
                          {invoice.createdAt
                            ? new Date(invoice.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )
                            : "—"}
                        </p>
                      </div>
                    </div>

                    {invoice.hostedInvoiceUrl && (
                      <div className="pt-2">
                        <a
                          href={invoice.hostedInvoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-full rounded-lg bg-lime-400/10 border border-lime-400/30 px-3 py-2 text-xs font-medium text-lime-300 hover:bg-lime-400/20 transition"
                        >
                          View Invoice
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-sm text-slate-300 py-4">No invoices yet.</div>
          )}
          {error && <p className="text-xs text-red-300 mt-4">{error}</p>}
        </CardContent>
      </Card>

      {/* Confirmation Dialogs */}
      <Dialog
        open={schedulingPlan !== null}
        onOpenChange={() => setSchedulingPlan(null)}
      >
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-lime-400" />
              Schedule Plan Change
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              You are about to schedule a plan change to{" "}
              <span className="font-bold text-white">
                {schedulingPlan ? getPlanByLookupKey(schedulingPlan)?.name : ""}
              </span>
              . This change will take effect at the end of your current billing
              period ({currentPlanDisplay?.renewsAt}).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="rounded-lg bg-slate-950/50 p-4 border border-slate-800">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">New Plan:</span>
                <span className="font-semibold">
                  {schedulingPlan
                    ? getPlanByLookupKey(schedulingPlan)?.name
                    : ""}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Effective Date:</span>
                <span className="font-semibold text-lime-400">
                  {currentPlanDisplay?.renewsAt}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              * Your current features will remain active until the change date.
              * You can cancel this scheduled change at any time before it
              takes effect.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="rounded-full border-slate-700"
              onClick={() => setSchedulingPlan(null)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              className="rounded-full bg-lime-500 hover:bg-lime-400 text-slate-900"
              onClick={() =>
                schedulingPlan && schedulePlanChange(schedulingPlan, billingCycle)
              }
              disabled={actionLoading}
            >
              {actionLoading ? "Scheduling..." : "Confirm Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmCancelSub}
        onOpenChange={() => setConfirmCancelSub(false)}
      >
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Cancel Subscription
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to cancel your subscription? You will
              maintain access to all features until{" "}
              <span className="font-bold text-white">
                {currentPlanDisplay?.renewsAt}
              </span>
              , after which your subscription will end.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-300">
              Once canceled, you will lose access to:
            </p>
            <ul className="mt-3 space-y-2">
              <li className="flex items-start gap-2 text-xs text-slate-400">
                <XCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>Automated scheduling & calendar management</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-slate-400">
                <XCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>AI-powered content generation</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-slate-400">
                <XCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>Platform management & analytics</span>
              </li>
            </ul>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="rounded-full border-slate-700"
              onClick={() => setConfirmCancelSub(false)}
              disabled={actionLoading}
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              className="rounded-full"
              onClick={cancelSubscription}
              disabled={actionLoading}
            >
              {actionLoading ? "Canceling..." : "Confirm Cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmCancelSchedule}
        onOpenChange={() => setConfirmCancelSchedule(false)}
      >
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-lime-400" />
              Cancel Scheduled Change
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to cancel the scheduled plan change? Your
              current plan will remain active and will renew normally on{" "}
              <span className="font-bold text-white">
                {currentPlanDisplay?.renewsAt}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              className="rounded-full border-slate-700"
              onClick={() => setConfirmCancelSchedule(false)}
              disabled={actionLoading}
            >
              No, Keep Scheduled Change
            </Button>
            <Button
              className="rounded-full bg-lime-500 hover:bg-lime-400 text-slate-900"
              onClick={cancelScheduledChange}
              disabled={actionLoading}
            >
              {actionLoading ? "Processing..." : "Yes, Cancel Change"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PlanDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(amount / 100);
  } catch {
    return `$${(amount / 100).toFixed(2)}`;
  }
}
>>>>>>> d562463 (remove the search filed and set the path)
=======
>>>>>>> xerox
