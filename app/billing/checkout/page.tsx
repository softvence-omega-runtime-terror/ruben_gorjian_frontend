"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, CreditCard, Tag, Plus, Minus, Video, ShieldCheck, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { getPlanByLookupKey } from "@/lib/pricing-catalog";
import { PLAN_NAMES, MONTHLY_PRICES, type PlanKey } from "@/lib/pricing-comparison";
import { apiGet, apiPost } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useSessionContext } from "@/context/SessionContext";

// Pricing data for addons matching screenshot
const ADDON_PRICES = {
  platform: 5, // $5 per extra platform
  videoHour: 495, // $495 per video session
};

const TAX_RATE = 0.08625; // 8.625% based on backend example

type Coupon = {
  id: string;
  code: string;
  discountType: "percentage" | "fixed_amount";
  discountValue: number;
  description: string;
  applicablePlans: string[];
  expiresAt: string;
};

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useSessionContext();
  
  // URL params
  const rawPlan = searchParams.get("plan");
  const planCode = (rawPlan && (PLAN_NAMES as any)[rawPlan] ? rawPlan : "FMP-35") as PlanKey;
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    (searchParams.get("cycle") as "monthly" | "yearly") || "monthly"
  );

  // State
  const [couponCode, setCouponCode] = useState("");
  const [addonPlatformQty, setAddonPlatformQty] = useState(0);
  const [videoSessionHours, setVideoSessionHours] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Fetch coupons on mount
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await apiGet<{ coupons: Coupon[] }>("/api/billing/coupons");
        if (res.coupons) {
          setAvailableCoupons(res.coupons);
        }
      } catch (err) {
        console.error("Failed to fetch coupons", err);
      }
    };
    fetchCoupons();
  }, []);

  // Re-validate coupon if plan changes
  useEffect(() => {
    if (appliedCoupon && !appliedCoupon.applicablePlans.includes(planCode)) {
      handleRemoveCoupon();
      setError(`The coupon was removed as it is not applicable to the ${PLAN_NAMES[planCode]} plan.`);
    }
  }, [planCode, appliedCoupon]);

  // Calculation Logic (aligned with screenshot and backend founder pricing)
  const calculation = useMemo(() => {
    const catalogPlan = getPlanByLookupKey(planCode);
    const basePrice = catalogPlan?.priceStandard || MONTHLY_PRICES[planCode] || 0;
    
    // BACKEND SYNC: Check if user has Founder pricing (30% discount)
    // Stripe shows $664.30 for $949.00 plan, which is 949 * 0.7
    const isFounder = session?.isFounder || session?.subscription?.priceType === "founder";
    const founderMultiplier = isFounder ? 0.7 : 1;

    const discountMultiplier = billingCycle === "yearly" ? 0.8 : 1;
    const cycleMultiplier = billingCycle === "yearly" ? 12 : 1;

    const planPrice = basePrice * discountMultiplier * cycleMultiplier * founderMultiplier;
    const platformPrice = (addonPlatformQty * ADDON_PRICES.platform) * cycleMultiplier;
    const videoPrice = (videoSessionHours * ADDON_PRICES.videoHour); // FIXED: Video sessions are NOT per month, they are quantity-based per year/month.
    
    const subtotal = planPrice + platformPrice + videoPrice;
    
    let discount = 0;
    // FINAL SAFETY CHECK: Strict plan code-level enforcement
    const isActuallyApplicable = !!(appliedCoupon && 
      appliedCoupon.applicablePlans && 
      appliedCoupon.applicablePlans.includes(planCode));

    if (isCouponApplied && appliedCoupon && isActuallyApplicable) {
      const val = appliedCoupon.discountValue;
      const type = appliedCoupon.discountType;
      
      if (type === 'percentage') {
        discount = subtotal * (val / 100);
      } else {
        discount = val * cycleMultiplier;
      }
    }

    const discountedSubtotal = subtotal - discount;
    const tax = Math.max(0, discountedSubtotal * TAX_RATE);
    const total = discountedSubtotal + tax;

    return {
      planPrice,
      platformPrice,
      videoPrice,
      subtotal,
      discount,
      tax,
      total,
      isYearly: billingCycle === "yearly",
      isFounder,
      isActuallyApplicable
    };
  }, [planCode, billingCycle, addonPlatformQty, videoSessionHours, isCouponApplied, appliedCoupon, session]);

  const handleApplyCoupon = (codeToApply?: string) => {
    const code = (codeToApply || couponCode).trim().toUpperCase();
    if (!code) return;

    // Reset everything first to ensure clean state
    handleRemoveCoupon();
    setCouponCode(code); // Keep the code in the input
    setError(null);

    const coupon = availableCoupons.find(c => c.code === code);
    
    if (coupon) {
      // STRICT VALIDATION: Check if the plan is explicitly on the allowed list
      const isApplicable = coupon.applicablePlans && coupon.applicablePlans.includes(planCode);
      
      if (!isApplicable) {
        setError(`This coupon is not applicable to the ${PLAN_NAMES[planCode]} plan.`);
        return;
      }
      setAppliedCoupon(coupon);
      setIsCouponApplied(true);
    } else {
      const fallbacks: Record<string, Coupon> = {
        "SUMMER26": {
          id: "fallback-summer26",
          code: "SUMMER26",
          discountType: "percentage",
          discountValue: 10,
          description: "Summer sale - 10% off",
          applicablePlans: ["FM-70", "FMP-20"],
          expiresAt: "2026-12-31T23:59:59.000Z"
        },
        "SUMMER25": {
          id: "fallback-summer25",
          code: "SUMMER25",
          discountType: "percentage",
          discountValue: 12,
          description: "Summer sale - 12% off",
          applicablePlans: ["FM-70", "FMP-35"],
          expiresAt: "2025-12-31T23:59:59.000Z"
        }
      };

      if (fallbacks[code]) {
        const fb = fallbacks[code];
        const isApplicable = fb.applicablePlans && fb.applicablePlans.includes(planCode);
        
        if (!isApplicable) {
          setError(`This coupon is not applicable to the ${PLAN_NAMES[planCode]} plan.`);
          return;
        }
        setAppliedCoupon(fb);
        setIsCouponApplied(true);
        setCouponCode(fb.code);
        return;
      }

      setError("Invalid coupon code.");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setIsCouponApplied(false);
    setCouponCode("");
    setError(null);
  };

  const handleCheckout = async () => {
    if (!termsAccepted) {
      setError("Please accept the terms and conditions to proceed.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const origin = window.location.origin;
      const res = await apiPost<{ checkoutUrl?: string; error?: string }>("/api/billing/checkout", {
        planCode,
        billingCycle,
        termsAccepted,
        addonPlatformQty,
        videoSessionHours,
        couponCode: isCouponApplied ? couponCode : undefined,
        successUrl: `${origin}/billing/success`,
        cancelUrl: `${origin}/billing/checkout?plan=${planCode}&cycle=${billingCycle}`,
      });

      if (res.checkoutUrl) {
        window.location.assign(res.checkoutUrl);
      } else {
        const errorMsg = res.error || "Failed to initiate checkout. Please try again.";
        setError(errorMsg);
        
        // If the error is specifically about the coupon, remove it to stop calculating the discount
        if (errorMsg.toLowerCase().includes("coupon") || errorMsg.toLowerCase().includes("applicable")) {
          handleRemoveCoupon();
          setCouponCode(""); // Completely clear it so they have to re-type
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-5xl mx-auto py-10">
      <Button 
        variant="ghost" 
        size="sm" 
        className="mb-6 gap-2 text-slate-400 hover:text-white"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Left Column: Configuration */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-white">Complete your subscription</CardTitle>
              <CardDescription className="text-slate-400">
                Customize your plan and review your order details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Plan Summary */}
              <div className="flex flex-col gap-4 rounded-xl border border-lime-400/20 bg-lime-400/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-lime-400 p-2 text-slate-950">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">{PLAN_NAMES[planCode]}</h3>
                        {calculation.isFounder && (
                          <div className="flex items-center gap-1 bg-lime-400/20 text-lime-400 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                            <Sparkles className="h-2.5 w-2.5" /> Founder
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 capitalize">{billingCycle} billing</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">
                      ${(calculation.planPrice / (calculation.isYearly ? 12 : 1)).toFixed(2)}
                      <span className="text-xs font-normal text-slate-500">/mo</span>
                    </p>
                  </div>
                </div>

                <Separator className="bg-lime-400/10" />

                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300">Billing Cycle</span>
                  <div className="flex p-0.5 bg-slate-950 rounded-lg border border-slate-800">
                    <button
                      onClick={() => setBillingCycle("monthly")}
                      className={cn(
                        "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                        billingCycle === "monthly" 
                          ? "bg-lime-500 text-slate-950 shadow-sm" 
                          : "text-slate-400 hover:text-white"
                      )}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingCycle("yearly")}
                      className={cn(
                        "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all flex items-center gap-1.5",
                        billingCycle === "yearly" 
                          ? "bg-lime-500 text-slate-950 shadow-sm" 
                          : "text-slate-400 hover:text-white"
                      )}
                    >
                      Yearly
                      <span className={cn(
                        "px-1 py-0.5 rounded-[4px] text-[8px] border",
                        billingCycle === "yearly" ? "bg-slate-950 border-slate-800 text-lime-400" : "bg-lime-400 text-slate-950 border-transparent"
                      )}>
                        -20%
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Addons Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Optional Add-ons</h3>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-4 transition hover:border-slate-700">
                    <div className="flex items-center justify-between">
                      <Label className="text-white font-medium"> Platforms</Label>
                      <span className="text-xs text-lime-400">+${ADDON_PRICES.platform.toFixed(2)} ea/mo</span>
                    </div>
                    {/* <p className="text-xs text-slate-500">Additional social accounts for your plan.</p> */}
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 rounded-full border-slate-700 bg-transparent hover:bg-slate-800"
                        onClick={() => setAddonPlatformQty(Math.max(0, addonPlatformQty - 1))}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-bold text-white">{addonPlatformQty}</span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 rounded-full border-slate-700 bg-transparent hover:bg-slate-800"
                        onClick={() => setAddonPlatformQty(addonPlatformQty + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3 transition hover:border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-slate-400" />
                        <Label className="text-white font-medium"> Video Sessions</Label>
                      </div>
                      <span className="text-xs text-lime-400">+${ADDON_PRICES.videoHour.toFixed(2)} each</span>
                    </div>
                    {/* <p className="text-xs text-slate-500">Additional vertical video sessions (15-20s).</p> */}
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 rounded-full border-slate-700 bg-transparent hover:bg-slate-800"
                        onClick={() => setVideoSessionHours(Math.max(0, videoSessionHours - 1))}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-bold text-white">{videoSessionHours}</span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 rounded-full border-slate-700 bg-transparent hover:bg-slate-800"
                        onClick={() => setVideoSessionHours(videoSessionHours + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coupon Section */}
              <div className="space-y-4">
                <Label className="text-sm font-semibold uppercase tracking-wider text-slate-500">Discount Coupon</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input 
                      placeholder="Enter code (e.g. SUMMER26)" 
                      className="border-slate-800 bg-slate-950 pl-10 text-white focus:ring-lime-400"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        if (error) setError(null); // Clear error when typing
                      }}
                      disabled={isCouponApplied}
                    />
                  </div>
                  <Button 
                    variant={isCouponApplied ? "outline" : "secondary"}
                    className={cn(isCouponApplied ? "border-lime-500/50 text-lime-400" : "")}
                    onClick={() => isCouponApplied ? handleRemoveCoupon() : handleApplyCoupon()}
                  >
                    {isCouponApplied ? "Remove" : "Apply"}
                  </Button>
                </div>
                
                {isCouponApplied && appliedCoupon && appliedCoupon.applicablePlans?.includes(planCode) && (
                  <div className="flex items-center gap-2 rounded-lg border border-lime-400/20 bg-lime-400/5 p-3 text-xs text-lime-400 animate-in fade-in slide-in-from-top-1">
                    <Check className="h-4 w-4" />
                    <div>
                      <span className="font-bold">{appliedCoupon.code}</span> applied: {appliedCoupon.description || "Discount applied successfully"}
                    </div>
                  </div>
                )}
                {error && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400 animate-in shake-in-1">
                    <ShieldCheck className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex items-start space-x-3 p-2">
            <Checkbox 
              id="terms" 
              className="mt-1 border-slate-700 data-[state=checked]:bg-lime-500" 
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(!!checked)}
            />
            <Label htmlFor="terms" className="text-xs leading-relaxed text-slate-400">
              I agree to the <a href="/terms" className="text-lime-400 hover:underline">Terms of Service</a> and <a href="/privacy" className="text-lime-400 hover:underline">Privacy Policy</a>. Subscriptions automatically renew at the end of each billing period.
            </Label>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-2">
          <Card className="sticky top-24 border-slate-800 bg-slate-900/80 shadow-2xl backdrop-blur-md overflow-hidden">
            <CardHeader className="bg-slate-800/20">
              <CardTitle className="text-lg text-white">Order Summary</CardTitle>
              {calculation.isFounder && (
                <CardDescription className="text-lime-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Exclusive Founder Discount Applied
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-4 text-sm">
                {/* Main Plan */}
                <div className="flex justify-between items-start text-slate-300">
                  <div className="flex flex-col">
                    <span className="font-medium text-white">{PLAN_NAMES[planCode]}</span>
                    <span className="text-[10px] text-slate-500 font-medium">Qty 1, Billed {billingCycle}</span>
                  </div>
                  <div className="text-right">
                    <span className={cn("text-white font-medium", calculation.isFounder && "block")}>
                      ${calculation.planPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    {calculation.isFounder && (
                      <span className="text-[9px] text-slate-500 line-through block">
                        ${(calculation.planPrice / 0.7).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Addons */}
                {addonPlatformQty > 0 && (
                  <div className="flex justify-between items-start text-slate-300">
                    <div className="flex flex-col">
                      <span>Additional Platform</span>
                      <span className="text-[10px] text-slate-500 font-medium">Qty {addonPlatformQty}, ${ADDON_PRICES.platform.toFixed(2)} each</span>
                    </div>
                    <span className="text-white font-medium">${calculation.platformPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                
                {videoSessionHours > 0 && (
                  <div className="flex justify-between items-start text-slate-300">
                    <div className="flex flex-col">
                      <span>Video Session</span>
                      <span className="text-[10px] text-slate-500 font-medium">Qty {videoSessionHours}, ${ADDON_PRICES.videoHour.toFixed(2)} each</span>
                    </div>
                    <span className="text-white font-medium">${calculation.videoPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}

                <Separator className="bg-slate-800/60" />
                
                {/* Subtotal */}
                <div className="flex justify-between text-white font-semibold">
                  <span>Subtotal</span>
                  <span>${calculation.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                {/* Coupon */}
                {isCouponApplied && calculation.isActuallyApplicable && (
                  <div className="flex justify-between items-center bg-lime-400/5 p-3 rounded-lg border border-lime-400/10">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 text-lime-400 font-semibold">
                        <Tag className="h-3 w-3" />
                        <span>Talexia Coupon {appliedCoupon?.code || couponCode}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">{appliedCoupon?.discountValue || 10}% off for this period</span>
                    </div>
                    <span className="text-lime-400 font-bold">- ${calculation.discount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}

                {/* Tax */}
                <div className="flex justify-between text-slate-400">
                  <span>Sales tax (8.625%)</span>
                  <span className="text-white font-medium">${calculation.tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              <Separator className="bg-slate-800" />

              {/* Final Total */}
              <div className="flex justify-between items-end">
                <span className="text-white font-bold text-lg mb-1">Total due today</span>
                <div className="text-right">
                  <p className="text-4xl font-black text-white">
                    <span className="text-sm font-normal text-slate-400 mr-1">US</span>
                    ${calculation.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>

            <CardContent className="pt-2 pb-6">
              <Button 
                className="w-full rounded-full bg-lime-500 py-7 text-base font-black text-slate-950 hover:bg-lime-400 shadow-[0_0_30px_rgba(132,204,22,0.4)] transition-all hover:scale-[1.03] active:scale-[0.98]"
                disabled={loading}
                onClick={handleCheckout}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-6 w-6" />
                    Secure Checkout
                  </>
                )}
              </Button>
              
              <div className="mt-6 flex flex-col items-center gap-4 border-t border-slate-800/80 pt-6">
                <div className="flex items-center justify-center gap-6 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-5" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-3" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-5" />
                </div>
                <p className="text-[10px] text-slate-500 flex items-center gap-1.5 font-medium tracking-wide">
                  <ShieldCheck className="h-4 w-4 text-lime-500" /> SECURE SSL ENCRYPTED CHECKOUT
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Suspense fallback={
        <div className="flex h-screen flex-col items-center justify-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-lime-400" />
          <p className="text-slate-400 animate-pulse font-medium">Securing your session...</p>
        </div>
      }>
        <CheckoutContent />
      </Suspense>
    </div>
  );
}
