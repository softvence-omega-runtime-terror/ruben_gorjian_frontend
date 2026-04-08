"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Check, RefreshCw } from "lucide-react";
import { useSessionContext } from "@/context/SessionContext";
import { OnboardingHeaderNav } from "@/components/onboarding/OnboardingHeaderNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { normalizeUrl } from "@/lib/url-utils";
import { FaFacebook, FaInstagram } from "react-icons/fa";
import { SiTiktok } from "react-icons/si";
import clsx from "clsx";

type Section = 1 | 2 | 3 | 4 | 5;

const sections = [
  { id: 1, title: "Business Context" },
  { id: 2, title: "Brand Basics" },
  { id: 3, title: "Usage Context" },
  { id: 4, title: "Visual Add-Ons" },
  { id: 5, title: "Creative Direction" },
] as const;

export const dynamic = "force-dynamic";

function VisualOnboardingInner() {
  const { session, loading: sessionLoading, refresh } = useSessionContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const handledQueryKeyRef = useRef<string | null>(null);
  const refetchRetryIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryKey = searchParams.toString();

  const [currentSection, setCurrentSection] = useState<Section>(1);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<string[]>([]);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  const [form, setForm] = useState({
    industry: "" as
      | "RESTAURANT"
      | "CAFE_COFFEE"
      | "JEWELRY"
      | "RUGS_HOME_DECOR"
      | "APPAREL"
      | "OTHER"
      | "",
    industryOther: "",
    targetAudience: "" as "B2C" | "B2B" | "",
    salesModel: [] as ("RETAIL" | "WHOLESALE" | "BOTH")[],
    websiteUrl: "",
    primaryPlatform: "" as
      | "INSTAGRAM"
      | "FACEBOOK"
      | "LINKEDIN"
      | "WEBSITE"
      | "ADS"
      | "",
    ctaEmbedded: "" as "YES" | "NO" | "",
    outlineFrame: "" as "YES" | "NO" | "",
    brandVibe: [] as (
      | "CLEAN_MINIMAL"
      | "WARM_COZY"
      | "BOLD_HIGH_CONTRAST"
      | "PREMIUM_LUXURY"
      | "NATURAL_LIFESTYLE"
    )[],
    visualStylePreference: "" as
      | "REALISTIC"
      | "SLIGHTLY_ENHANCED"
      | "MARKETING_STYLE"
      | "",
  });

  const fetchConnectedAccounts = useCallback(async () => {
    try {
      const accountsRes = await fetch("/api/social-media/platform/my-links", {
        credentials: "include",
      });
      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        // Updated mapping to match dashboard Logic
        const raw = Array.isArray(accountsData) 
          ? accountsData 
          : accountsData.links || accountsData.accounts || accountsData.data || [];
        const platforms = raw.map((a: any) => a.platform?.toUpperCase());
        setConnectedAccounts(platforms);
      }
    } catch (err) {
      console.error("Failed to fetch connected accounts:", err);
    }
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchConnectedAccounts();
    await refresh();
    setRefreshing(false);
    toast({ title: "Refreshed", description: "Checked for new social connections" });
  };

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) {
      router.push("/login?returnTo=/onboarding/visual");
      return;
    }

    const planCategory = session.subscription?.planCategory;
    const isVisualPlan =
      planCategory === "VISUAL_ADD_ON" ||
      planCategory === "REGULAR_VISUAL" ||
      planCategory === "JEWELRY_VISUAL";
    if (!isVisualPlan) {
      router.push("/onboarding");
      return;
    }

    if (session.visualOnboardingCompleted) {
      router.push("/dashboard");
      return;
    }

    async function load() {
      try {
        await fetchConnectedAccounts();

        const res = await fetch("/api/onboarding/visual", {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!data.data) return;

        setForm((f) => ({
          ...f,
          industry: data.data.industry || "",
          industryOther: data.data.industryOther || "",
          targetAudience: data.data.targetAudience || "",
          salesModel: data.data.salesModel || [],
          websiteUrl: data.data.websiteUrl || "",
          primaryPlatform: data.data.primaryPlatform || "",
          ctaEmbedded: data.data.ctaEmbedded || "",
          outlineFrame: data.data.outlineFrame || "",
          brandVibe: data.data.brandVibe || [],
          visualStylePreference: data.data.visualStylePreference || "",
        }));
        if (data.data.currentSection && data.data.currentSection <= 5) {
          setCurrentSection(data.data.currentSection as Section);
        }
      } catch (err) {
        console.error("Failed to load visual onboarding data:", err);
      } finally {
        setDraftReady(true);
      }
    }
    load();
  }, [session, sessionLoading, router, fetchConnectedAccounts]);

  useEffect(() => {
    if (handledQueryKeyRef.current === queryKey) return;
    handledQueryKeyRef.current = queryKey;

    const errorParam = searchParams.get("error");
    const successParam = searchParams.get("success");
    const platformParam = searchParams.get("platform");

    if (errorParam) {
      toast({
        title: "Connection failed",
        description: "Unable to connect account",
        variant: "destructive",
      });
      window.history.replaceState({}, "", "/onboarding/visual");
    } else if (successParam) {
      const message = platformParam ? `Connected ${platformParam.toLowerCase()}` : "Account connected";
      toast({ title: "Success", description: message });
      
      fetchConnectedAccounts();
      refresh();
      
      if (refetchRetryIdRef.current) clearTimeout(refetchRetryIdRef.current);
      refetchRetryIdRef.current = setTimeout(async () => {
        refetchRetryIdRef.current = null;
        fetchConnectedAccounts();
        await refresh();
      }, 2000);
      
      window.history.replaceState({}, "", "/onboarding/visual");
    }
  }, [queryKey, searchParams, toast, fetchConnectedAccounts, refresh]);

  useEffect(() => {
    return () => {
      if (refetchRetryIdRef.current) clearTimeout(refetchRetryIdRef.current);
    };
  }, []);

  const connectPlatform = async (platform: string) => {
    setConnectingPlatform(platform);
    try {
      const response = await fetch("/api/social-media/platform/connect-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          platform: platform.toLowerCase(),
          redirectUrl: `${window.location.origin}/onboarding/visual`,
          showCalendar: false 
        }),
      });
      const data = await response.json().catch(() => ({}));

      const connectUrl = data.url || data.link || data.connect?.access_url || data.connect?.url;
      if (connectUrl) {
        window.location.href = connectUrl;
      } else {
        setError("No connect URL returned from server.");
      }
    } catch (err) {
      console.error("Connection error:", err);
      setError("Failed to start connection process.");
    } finally {
      setConnectingPlatform(null);
    }
  };

  useEffect(() => {
    if (!draftReady || submitting || !session) return;
    const timer = window.setTimeout(async () => {
      try {
        await fetch("/api/onboarding/visual/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            industry: form.industry || undefined,
            industryOther: form.industryOther.trim() || undefined,
            targetAudience: form.targetAudience || undefined,
            salesModel: form.salesModel.length ? form.salesModel : undefined,
            websiteUrl: normalizeUrl(form.websiteUrl),
            primaryPlatform: form.primaryPlatform || undefined,
            ctaEmbedded: form.ctaEmbedded || undefined,
            outlineFrame: form.outlineFrame || undefined,
            brandVibe: form.brandVibe.length ? form.brandVibe : undefined,
            visualStylePreference: form.visualStylePreference || undefined,
            currentSection,
          }),
        });
      } catch (err) {
        console.warn("Failed to save visual onboarding draft", err);
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [form, currentSection, draftReady, submitting, session]);

  const handleSubmit = async () => {
    setError(null);

    if (currentSection === 1) {
      if (!form.industry) return setError("Please select an industry.");
      if (form.industry === "OTHER" && !form.industryOther.trim()) {
        return setError("Please specify your industry.");
      }
      if (!form.targetAudience)
        return setError("Please select target audience.");
    }

    if (currentSection === 3 && connectedAccounts.length === 0) {
      return setError("Please connect at least one social media account.");
    }

    if (currentSection === 4) {
      if (!form.ctaEmbedded) return setError("Please select CTA preference.");
      if (!form.outlineFrame)
        return setError("Please select outline/frame preference.");
    }

    if (currentSection === 5) {
      if (form.brandVibe.length === 0)
        return setError("Please select at least one brand vibe.");
      if (form.brandVibe.length > 3)
        return setError("Please select up to 3 brand vibes.");
      if (!form.visualStylePreference)
        return setError("Please select visual style preference.");
    }

    if (currentSection < 5) {
      setCurrentSection((s) => (s + 1) as Section);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding/visual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          industryOther: form.industryOther.trim() || undefined,
          websiteUrl: normalizeUrl(form.websiteUrl),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Unable to save onboarding.");

      await refresh();
      if (typeof window !== "undefined") {
        const { clearPlanSelection } = await import("@/lib/plan-selection");
        clearPlanSelection();
      }
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to save onboarding.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const platformOptions = [
    { value: "INSTAGRAM", label: "Instagram", icon: FaInstagram },
    { value: "FACEBOOK", label: "Facebook", icon: FaFacebook },
    { value: "TIKTOK", label: "TikTok", icon: SiTiktok },
  ];

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <p className="text-slate-300">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-950 to-slate-900">
      <OnboardingHeaderNav
        currentStep={currentSection}
        totalSteps={sections.length}
        sectionNames={sections.map((s) => ({ id: s.id, title: s.title }))}
      />

      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-4xl rounded-3xl border border-slate-800/80 bg-slate-950/80 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="grid md:grid-cols-3">
            <aside className="md:col-span-1 bg-slate-900/60 border-r border-slate-800 px-5 py-6">
              <div className="space-y-2">
                {sections.map((section) => {
                  const active = section.id === currentSection;
                  const done = section.id < currentSection;
                  return (
                    <div
                      key={section.id}
                      className={`flex items-start gap-3 rounded-xl border p-3 ${
                        active
                          ? "border-lime-300/70 bg-lime-300/5"
                          : done
                            ? "border-lime-200/40 bg-slate-900/60"
                            : "border-slate-800 bg-slate-900/40"
                      }`}
                    >
                      <div className="mt-0.5 h-6 w-6 rounded-full border-2 flex items-center justify-center text-xs font-semibold border-slate-700 bg-slate-800 text-slate-100">
                        {done ? <Check className="h-3 w-3" /> : section.id}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-300">
                          Section {section.id}
                        </div>
                        <div className="text-sm text-slate-50">
                          {section.title}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>

            <div className="md:col-span-2 px-6 py-8 flex flex-col min-h-[500px]">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-semibold text-white">
                  {sections.find((s) => s.id === currentSection)?.title}
                </h1>
                {currentSection === 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleManualRefresh}
                    disabled={refreshing}
                    className="text-slate-400 hover:text-white gap-2"
                  >
                    <RefreshCw className={clsx("h-3.5 w-3.5", refreshing && "animate-spin")} />
                    Refresh
                  </Button>
                )}
              </div>

              {error ? (
                <div className="mt-4 rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-100 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              ) : null}

              <div className="mt-6 space-y-6 flex-grow overflow-y-auto pr-2 max-h-[65vh]">
                {currentSection === 1 ? (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-300">
                        Industry <span className="text-red-400">*</span>
                      </Label>
                      <Select
                        value={form.industry}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            industry: e.target.value as typeof f.industry,
                            industryOther:
                              e.target.value === "OTHER" ? f.industryOther : "",
                          }))
                        }
                      >
                        <option value="">Select industry</option>
                        <option value="RESTAURANT">Restaurant</option>
                        <option value="CAFE_COFFEE">Café / Coffee</option>
                        <option value="JEWELRY">Jewelry</option>
                        <option value="RUGS_HOME_DECOR">
                          Rugs / Home Décor
                        </option>
                        <option value="APPAREL">Apparel</option>
                        <option value="OTHER">Other</option>
                      </Select>
                    </div>
                    {form.industry === "OTHER" ? (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-300">
                          Specify Industry{" "}
                          <span className="text-red-400">*</span>
                        </Label>
                        <Input
                          value={form.industryOther}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              industryOther: e.target.value,
                            }))
                          }
                          placeholder="Your industry"
                        />
                      </div>
                    ) : null}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-300">
                        Target Audience <span className="text-red-400">*</span>
                      </Label>
                      <div className="space-y-2">
                        {(["B2C", "B2B"] as const).map((opt) => (
                          <label
                            key={opt}
                            className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/60 cursor-pointer"
                          >
                            <input
                              type="radio"
                              checked={form.targetAudience === opt}
                              onChange={() =>
                                setForm((f) => ({ ...f, targetAudience: opt }))
                              }
                              className="h-4 w-4 text-lime-400"
                            />
                            <span className="text-sm text-slate-200">
                              {opt}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                ) : null}

                {currentSection === 2 ? (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-300">
                      Website URL (Optional)
                    </Label>
                    <Input
                      type="url"
                      value={form.websiteUrl}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, websiteUrl: e.target.value }))
                      }
                      placeholder="your-website.com"
                    />
                  </div>
                ) : null}

                {currentSection === 3 ? (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-300">
                      Connect Social Media <span className="text-red-400">*</span>
                    </Label>
                    <div className="space-y-3">
                      {platformOptions.map((option) => {
                        const Icon = option.icon;
                        const isConnected = connectedAccounts.includes(option.value);
                        return (
                          <div
                            key={option.value}
                            className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/60 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <div className={clsx(
                                "p-2 rounded-lg text-white",
                                option.value === "FACEBOOK" && "bg-blue-600",
                                option.value === "INSTAGRAM" && "bg-gradient-to-r from-pink-500 to-orange-400",
                                option.value === "TIKTOK" && "bg-black border border-slate-700"
                              )}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <div>
                                <span className="text-sm font-medium text-slate-200 block">
                                  {option.label}
                                </span>
                                <span className={clsx(
                                  "text-[10px] block",
                                  isConnected ? "text-lime-400" : "text-slate-400"
                                )}>
                                  {isConnected ? "Connected successfully" : "Not connected yet"}
                                </span>
                              </div>
                            </div>

                            {isConnected ? (
                              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-400/10 border border-lime-400/30 text-lime-400 text-xs font-medium">
                                <Check className="h-3 w-3" />
                                Connected
                              </div>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => connectPlatform(option.value)}
                                disabled={connectingPlatform === option.value}
                                className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs h-8"
                              >
                                {connectingPlatform === option.value ? "Connecting..." : "Connect"}
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {/* (Sections 4-5 restore full content) ... */}
                {currentSection === 4 && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-300">
                        CTA embedded in visual?{" "}
                        <span className="text-red-400">*</span>
                      </Label>
                      <div className="space-y-2">
                        {(["YES", "NO"] as const).map((opt) => (
                          <label
                            key={opt}
                            className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/60 cursor-pointer"
                          >
                            <input
                              type="radio"
                              checked={form.ctaEmbedded === opt}
                              onChange={() =>
                                setForm((f) => ({ ...f, ctaEmbedded: opt }))
                              }
                              className="h-4 w-4 text-lime-400"
                            />
                            <span className="text-sm text-slate-200">
                              {opt}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-300">
                        Outline / Frame? <span className="text-red-400">*</span>
                      </Label>
                      <div className="space-y-2">
                        {(["YES", "NO"] as const).map((opt) => (
                          <label
                            key={opt}
                            className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/60 cursor-pointer"
                          >
                            <input
                              type="radio"
                              checked={form.outlineFrame === opt}
                              onChange={() =>
                                setForm((f) => ({ ...f, outlineFrame: opt }))
                              }
                              className="h-4 w-4 text-lime-400"
                            />
                            <span className="text-sm text-slate-200">
                              {opt}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {currentSection === 5 && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-300">
                        Brand Vibe (Max 3){" "}
                        <span className="text-red-400">*</span>
                      </Label>
                      <div className="space-y-2">
                        {(
                          [
                            "CLEAN_MINIMAL",
                            "WARM_COZY",
                            "BOLD_HIGH_CONTRAST",
                            "PREMIUM_LUXURY",
                            "NATURAL_LIFESTYLE",
                          ] as const
                        ).map((opt) => (
                          <label
                            key={opt}
                            className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/60 cursor-pointer"
                          >
                            <Checkbox
                              checked={form.brandVibe.includes(opt)}
                              disabled={
                                !form.brandVibe.includes(opt) &&
                                form.brandVibe.length >= 3
                              }
                              onCheckedChange={(checked: boolean) =>
                                setForm((f) => ({
                                  ...f,
                                  brandVibe: checked
                                    ? [...f.brandVibe, opt]
                                    : f.brandVibe.filter((v) => v !== opt),
                                }))
                              }
                            />
                            <span className="text-sm text-slate-200">
                              {opt.replaceAll("_", " ")}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-300">
                        Visual Style Preference{" "}
                        <span className="text-red-400">*</span>
                      </Label>
                      <Select
                        value={form.visualStylePreference}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            visualStylePreference: e.target
                              .value as typeof f.visualStylePreference,
                          }))
                        }
                      >
                        <option value="">Select preference</option>
                        <option value="REALISTIC">Realistic</option>
                        <option value="SLIGHTLY_ENHANCED">
                          Slightly enhanced
                        </option>
                        <option value="MARKETING_STYLE">Marketing-style</option>
                      </Select>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-between pt-6 mt-auto border-t border-slate-800">
                {currentSection > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setCurrentSection((s) => (s - 1) as Section)}
                    className="text-slate-300 hover:text-white"
                  >
                    Back
                  </Button>
                ) : (
                  <div />
                )}
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-lime-400 text-slate-900 hover:bg-lime-300 font-bold px-8 rounded-xl"
                >
                  {submitting
                    ? "Saving..."
                    : currentSection === 5
                      ? "Complete Setup"
                      : "Continue"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VisualOnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <p className="text-slate-300">Loading...</p>
      </div>
    }>
      <VisualOnboardingInner />
    </Suspense>
  );
}
