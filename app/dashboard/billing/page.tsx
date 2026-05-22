"use client";

import { useMemo, useState, useEffect } from "react";
import {
  CreditCard,
  Receipt,
  Zap,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [plansExpanded, setPlansExpanded] = useState(true);

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
    const priceCents =
      plan.price > 0
        ? plan.price
        : catalogPlan
          ? (plan.priceType === "FOUNDER"
              ? catalogPlan.priceFounder
              : catalogPlan.priceStandard) * 100
          : 0;
    const rawEnd = plan.current_period_end ?? plan.renewsAt;
    const renewalDate = rawEnd
      ? (() => {
          const d =
            typeof rawEnd === "number"
              ? new Date(rawEnd * 1000)
              : new Date(rawEnd);
          if (Number.isNaN(d.getTime())) return "—";
          return d.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          });
        })()
      : "—";
    return {
      name: catalogPlan?.name || plan.name || plan.code || "—",
      price: priceCents,
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
      const [summary, invoicesRes] = await Promise.all([
        apiGet<{ currentPlan: Plan | null }>("/api/billing/summary"),
        apiGet<{ items: Invoice[] }>("/api/billing/invoices"),
      ]);
      setPlan(summary.currentPlan);
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
        {!noPlan && (
          <Button
            className="rounded-full"
            disabled={portalLoading}
            onClick={async () => {
              setPortalLoading(true);
              setPortalError(null);
              try {
                const url = await getCustomerPortalUrl();
                if (url) {
                  window.location.href = url;
                } else {
                  setPortalError(
                    "Unable to open billing portal. Please try again or contact support.",
                  );
                }
              } finally {
                setPortalLoading(false);
              }
            }}
          >
            {portalLoading ? "Loading..." : "Manage subscription"}
          </Button>
        )}
      </div>
      {portalError && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          {portalError}
        </div>
      )}

      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Current plan</CardTitle>
            <p className="text-xs text-slate-400">
              {/* Your active subscription details */}
            </p>
          </div>
          <CreditCard className="h-5 w-5 text-lime-300" />
        </CardHeader>
        <CardContent>
          {!plan ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-6 text-center">
              <p className="text-slate-400">No active plan</p>
              <p className="mt-1 text-sm text-slate-500">
                Subscribe to a plan below to get started.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <PlanDetail
                label="Plan"
                value={currentPlanDisplay?.name ?? "—"}
              />
              <PlanDetail
                label="Price"
                value={
                  currentPlanDisplay && currentPlanDisplay.price >= 0
                    ? `${formatCurrency(currentPlanDisplay.price, currentPlanDisplay.currency)}/${currentPlanDisplay.interval === "month" ? "mo" : "yr"}`
                    : "—"
                }
              />
              <PlanDetail
                label="Price Type"
                value={currentPlanDisplay?.priceType ?? "—"}
              />
              <PlanDetail
                label="Status"
                value={currentPlanDisplay?.status ?? "—"}
              />
              <PlanDetail
                label="Renews"
                value={
                  currentPlanDisplay?.renewsAt &&
                  currentPlanDisplay.renewsAt !== "—"
                    ? currentPlanDisplay.renewsAt
                    : (currentPlanDisplay?.renewsAt ?? "—")
                }
              />
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
              {PLAN_KEYS.map((planKey) => {
                const catalogPlan = getPlanByLookupKey(planKey);
                const isCurrent = plan?.code === planKey;
                const displayPrice = catalogPlan?.priceStandard ?? 0;
                const billingNote = "Billed monthly";

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
                        variant="outline"
                        size="sm"
                        className="mt-5 w-full rounded-full border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
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
                        {portalLoading ? "Loading..." : "Manage subscription"}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="mt-5 w-full rounded-full bg-lime-500 text-slate-900 hover:bg-lime-400"
                        disabled={checkoutLoading !== null}
                        onClick={() => startCheckout(planKey)}
                      >
                        {checkoutLoading === planKey
                          ? "Loading..."
                          : (catalogPlan?.ctaLabel ?? "Choose Plan")}
                      </Button>
                    )}

                    {catalogPlan?.features &&
                      catalogPlan.features.length > 0 && (
                        <ul className="mt-5 space-y-2">
                          {catalogPlan.features.map((feature, idx) => (
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
                plan?.platformLimit
                  ? `${plan.platformLimit} platform${plan.platformLimit > 1 ? "s" : ""}${
                      plan.addonPlatformQty && plan.addonPlatformQty > 0
                        ? ` (+${plan.addonPlatformQty} add-on)`
                        : ""
                    }`
                  : "—"
              }
            />
            <PlanDetail
              label="Visuals/month"
              value={plan?.visualQuota ? `${plan.visualQuota}` : "—"}
            />
            <PlanDetail
              label="Posts/month"
              value={
                plan?.postQuota
                  ? `${plan.postQuota}${postLimitType === "SOFT" ? " (soft limit)" : ""}`
                  : "—"
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
