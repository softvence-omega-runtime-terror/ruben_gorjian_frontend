"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertCircle,
  Check,
  RefreshCw,
} from "lucide-react";
import { FaFacebook, FaInstagram } from "react-icons/fa";
import { useSessionContext } from "@/context/SessionContext";
import { OnboardingHeaderNav } from "@/components/onboarding/OnboardingHeaderNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { normalizeUrl } from "@/lib/url-utils";
import { SiTiktok } from "react-icons/si";
import clsx from "clsx";

type Section = 1 | 2 | 3 | 4 | 5 | 6;

const sections = [
  { id: 1, title: "Business & Access" },
  { id: 2, title: "Business Context" },
  { id: 3, title: "Brand Direction" },
  { id: 4, title: "Visual Rules" },
  { id: 5, title: "CTA Rules" },
  { id: 6, title: "Scheduling Preferences" },
] as const;

export const dynamic = "force-dynamic";

function FullManagementOnboardingInner() {
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
    businessName: "",
    websiteUrl: "",
    instagramUrl: "",
    facebookUrl: "",
    linkedinUrl: "",
    platformsToManage: [] as ("INSTAGRAM" | "FACEBOOK")[],
    postingAccessGranted: "" as "YES" | "WILL_GRANT_AFTER" | "",

    industry: "" as
      | "RESTAURANT"
      | "CAFE_COFFEE"
      | "JEWELRY"
      | "RUGS_HOME_DECOR"
      | "APPAREL"
      | "OTHER"
      | "",
    industryOther: "",
    targetAudience: [] as ("B2C" | "B2B")[],
    salesModel: [] as ("RETAIL" | "WHOLESALE" | "BOTH")[],

    brandPersonality: [] as (
      | "CLEAN_MINIMAL"
      | "WARM_COZY"
      | "BOLD_HIGH_CONTRAST"
      | "PREMIUM_LUXURY"
      | "NATURAL_LIFESTYLE"
      | "PROFESSIONAL"
      | "PLAYFUL"
      | "SOPHISTICATED"
    )[],
    toneToAvoid: "",

    imageUsagePermission: "" as
      | "YES_ALL"
      | "YES_BRAND_ONLY"
      | "NO_STOCK"
      | "CUSTOM"
      | "",
    visualStylePreference: "" as
      | "REALISTIC"
      | "SLIGHTLY_ENHANCED"
      | "MARKETING_STYLE"
      | "",
    outlineFrame: "" as "YES" | "NO" | "",

    allowCtas: "" as "YES" | "NO" | "",

    postingFrequencyPreference: "" as
      | "DAILY"
      | "WEEKLY_3"
      | "WEEKLY_5"
      | "WEEKLY_7"
      | "FORTNIGHTLY"
      | "",
    postingTimePreference: [] as (
      | "MORNING"
      | "AFTERNOON"
      | "EVENING"
      | "NIGHT"
    )[],
  });

  const fetchConnectedAccounts = useCallback(async () => {
    try {
      const accountsRes = await fetch("/api/social-media/platform/my-links", {
        credentials: "include",
      });
      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        // Updated to include .data property, matching dashboard logic
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
      router.push("/login?returnTo=/onboarding/full-management");
      return;
    }

    if (session.role === "ADMIN" || session.role === "SUPER_ADMIN") {
      router.push("/admin");
      return;
    }

    const planCategory = session.subscription?.planCategory;
    const isFullPlan =
      planCategory === "FULL_MANAGEMENT" ||
      planCategory === "JEWELRY_FULL_MANAGEMENT";
    if (!isFullPlan) {
      router.push("/onboarding");
      return;
    }
    if (session.fullManagementOnboardingCompleted) {
      router.push("/dashboard");
      return;
    }

    async function load() {
      try {
        await fetchConnectedAccounts();

        const res = await fetch("/api/onboarding/full-management", {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!data.data) return;

        setForm((f) => ({
          ...f,
          businessName: data.businessName || data.data.businessName || "",
          websiteUrl: data.data.websiteUrl || "",
          instagramUrl: data.data.instagramUrl || "",
          facebookUrl: data.data.facebookUrl || "",
          linkedinUrl: data.data.linkedinUrl || "",
          platformsToManage: data.data.platformsToManage || [],
          postingAccessGranted: data.data.postingAccessGranted || "",
          industry: data.data.industry || "",
          industryOther: data.data.industryOther || "",
          targetAudience: Array.isArray(data.data.targetAudience)
            ? data.data.targetAudience
            : data.data.targetAudience
              ? [data.data.targetAudience]
              : [],
          salesModel: data.data.salesModel || [],
          brandPersonality: data.data.brandPersonality || [],
          toneToAvoid: data.data.toneToAvoid || "",
          imageUsagePermission: data.data.imageUsagePermission || "",
          visualStylePreference: data.data.visualStylePreference || "",
          outlineFrame: data.data.outlineFrame || "",
          allowCtas: data.data.allowCtas || "",
          postingFrequencyPreference:
            data.data.postingFrequencyPreference || "",
          postingTimePreference: data.data.postingTimePreference || [],
        }));

        if (data.data.currentSection && data.data.currentSection <= 6) {
          setCurrentSection(data.data.currentSection as Section);
        }
      } catch (err) {
        console.error("Failed to load full management onboarding data:", err);
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
      window.history.replaceState({}, "", "/onboarding/full-management");
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
      
      window.history.replaceState({}, "", "/onboarding/full-management");
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
          redirectUrl: `${window.location.origin}/onboarding/full-management`,
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
        await fetch("/api/onboarding/full-management/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            businessName: form.businessName.trim() || undefined,
            websiteUrl: normalizeUrl(form.websiteUrl),
            instagramUrl: normalizeUrl(form.instagramUrl),
            facebookUrl: normalizeUrl(form.facebookUrl),
            linkedinUrl: normalizeUrl(form.linkedinUrl),
            platformsToManage: form.platformsToManage.length
              ? form.platformsToManage
              : undefined,
            postingAccessGranted: form.postingAccessGranted || undefined,
            industry: form.industry || undefined,
            industryOther: form.industryOther.trim() || undefined,
            targetAudience: form.targetAudience.length
              ? form.targetAudience
              : undefined,
            salesModel: form.salesModel.length ? form.salesModel : undefined,
            brandPersonality: form.brandPersonality.length
              ? form.brandPersonality
              : undefined,
            toneToAvoid: form.toneToAvoid.trim() || undefined,
            imageUsagePermission: form.imageUsagePermission || undefined,
            visualStylePreference: form.visualStylePreference || undefined,
            outlineFrame: form.outlineFrame || undefined,
            allowCtas: form.allowCtas || undefined,
            postingFrequencyPreference:
              form.postingFrequencyPreference || undefined,
            postingTimePreference: form.postingTimePreference.length
              ? form.postingTimePreference
              : undefined,
            currentSection,
          }),
        });
      } catch (err) {
        console.warn("Failed to save full management draft", err);
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [form, currentSection, draftReady, session, submitting]);

  useEffect(() => {
    // Auto-select connected accounts for management if none are selected
    if (connectedAccounts.length > 0 && form.platformsToManage.length === 0) {
      const initial = connectedAccounts.filter((p) =>
        ["INSTAGRAM", "FACEBOOK"].includes(p),
      ) as ("INSTAGRAM" | "FACEBOOK")[];
      if (initial.length > 0) {
        setForm((f) => ({ ...f, platformsToManage: initial }));
      }
    }
  }, [connectedAccounts, form.platformsToManage.length]);

  const handleSubmit = async () => {
    setError(null);
    const normalizedWebsiteUrl = normalizeUrl(form.websiteUrl);

    if (currentSection === 1) {
      if (!form.businessName.trim())
        return setError("Business name is required.");
      if (!normalizedWebsiteUrl)
        return setError("Valid website URL is required.");
      if (connectedAccounts.length === 0)
        return setError("Please connect at least one social media account.");
      if (form.platformsToManage.length === 0)
        return setError("Please select at least one connected platform to manage (vía the 'Manage' checkbox).");
      if (!form.postingAccessGranted)
        return setError("Specify posting access status.");
    }

    if (currentSection === 2) {
      if (!form.industry) return setError("Please select an industry.");
      if (form.industry === "OTHER" && !form.industryOther.trim()) {
        return setError("Please specify your industry.");
      }
      if (form.targetAudience.length === 0)
        return setError("Select target audience.");
    }

    if (currentSection === 3) {
      if (form.brandPersonality.length === 0) {
        return setError("Select at least one brand personality.");
      }
      if (form.brandPersonality.length > 3) {
        return setError("Select up to 3 brand personalities.");
      }
    }

    if (currentSection === 4) {
      if (!form.imageUsagePermission)
        return setError("Select image usage permission.");
      if (!form.visualStylePreference)
        return setError("Select visual style preference.");
      if (!form.outlineFrame)
        return setError("Select outline/frame preference.");
    }

    if (currentSection === 5 && !form.allowCtas) {
      return setError("Select CTA preference.");
    }

    if (currentSection < 6) {
      setCurrentSection((s) => (s + 1) as Section);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding/full-management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          websiteUrl: normalizedWebsiteUrl,
          instagramUrl: normalizeUrl(form.instagramUrl),
          facebookUrl: normalizeUrl(form.facebookUrl),
          linkedinUrl: normalizeUrl(form.linkedinUrl),
          industryOther: form.industryOther.trim() || undefined,
          toneToAvoid: form.toneToAvoid.trim() || undefined,
          postingFrequencyPreference:
            form.postingFrequencyPreference || undefined,
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
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-white">
                  {sections.find((s) => s.id === currentSection)?.title}
                </h1>
                {currentSection === 1 && (
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

              <div className="mt-6 space-y-6 flex-grow overflow-y-auto pr-2 max-h-[70vh]">
                {currentSection === 1 ? (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-300">
                        Business Name <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        value={form.businessName}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            businessName: e.target.value,
                          }))
                        }
                        placeholder="Your business name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-300">
                        Website URL <span className="text-red-400">*</span>
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
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-300">
                        Social URLs (Optional)
                      </Label>
                      <Input
                        value={form.instagramUrl}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            instagramUrl: e.target.value,
                          }))
                        }
                        placeholder="instagram.com/your-handle"
                      />
                      <Input
                        value={form.facebookUrl}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            facebookUrl: e.target.value,
                          }))
                        }
                        placeholder="facebook.com/your-page"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-300">
                        Connect Platforms to Manage <span className="text-red-400">*</span>
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
                                <div className="flex items-center gap-3">
                                  <label className="flex items-center gap-2 cursor-pointer group">
                                    <Checkbox
                                      checked={form.platformsToManage.includes(option.value as any)}
                                      onCheckedChange={(checked: boolean) =>
                                        setForm((f) => ({
                                          ...f,
                                          platformsToManage: checked
                                            ? [...f.platformsToManage, option.value as any]
                                            : f.platformsToManage.filter((p) => p !== option.value),
                                        }))
                                      }
                                      className="border-lime-400 data-[state=checked]:bg-lime-400 data-[state=checked]:text-slate-900"
                                    />
                                    <span className="text-xs text-slate-300 group-hover:text-white transition-colors">
                                      Manage
                                    </span>
                                  </label>
                                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-400/10 border border-lime-400/30 text-lime-400 text-xs font-medium">
                                    <Check className="h-3 w-3" />
                                    Connected
                                  </div>
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
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-300">
                        Posting Access Granted?{" "}
                        <span className="text-red-400">*</span>
                      </Label>
                      {(["YES", "WILL_GRANT_AFTER"] as const).map((opt) => (
                        <label
                          key={opt}
                          className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/60 cursor-pointer"
                        >
                          <input
                            type="radio"
                            checked={form.postingAccessGranted === opt}
                            onChange={() =>
                              setForm((f) => ({
                                ...f,
                                postingAccessGranted: opt,
                              }))
                            }
                            className="h-4 w-4 text-lime-400"
                          />
                          <span className="text-sm text-slate-200">
                            {opt === "YES"
                              ? "Yes"
                              : "Will grant after onboarding"}
                          </span>
                        </label>
                      ))}
                    </div>
                  </>
                ) : null}

                {/* (Sections 2-6 content here...) */}
                {currentSection === 2 && (
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
                        />
                      </div>
                    ) : null}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-300">
                        Target Audience <span className="text-red-400">*</span>
                      </Label>
                      {(["B2C", "B2B"] as const).map((opt) => (
                        <label
                          key={opt}
                          className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/60 cursor-pointer"
                        >
                          <Checkbox
                            checked={form.targetAudience.includes(opt)}
                            onCheckedChange={(checked: boolean) =>
                              setForm((f) => ({
                                ...f,
                                targetAudience: checked
                                  ? [...f.targetAudience, opt]
                                  : f.targetAudience.filter((x) => x !== opt),
                              }))
                            }
                          />
                          <span className="text-sm text-slate-200">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </>
                )}

                {currentSection === 3 && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-300">
                        Brand Personality (Max 3){" "}
                        <span className="text-red-400">*</span>
                      </Label>
                      {(
                        [
                          "CLEAN_MINIMAL",
                          "WARM_COZY",
                          "BOLD_HIGH_CONTRAST",
                          "PREMIUM_LUXURY",
                          "NATURAL_LIFESTYLE",
                          "PROFESSIONAL",
                          "PLAYFUL",
                          "SOPHISTICATED",
                        ] as const
                      ).map((opt) => (
                        <label
                          key={opt}
                          className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/60 cursor-pointer"
                        >
                          <Checkbox
                            checked={form.brandPersonality.includes(opt)}
                            disabled={
                              !form.brandPersonality.includes(opt) &&
                              form.brandPersonality.length >= 3
                            }
                            onCheckedChange={(checked: boolean) =>
                              setForm((f) => ({
                                ...f,
                                brandPersonality: checked
                                  ? [...f.brandPersonality, opt]
                                  : f.brandPersonality.filter((x) => x !== opt),
                              }))
                            }
                          />
                          <span className="text-sm text-slate-200">
                            {opt.replaceAll("_", " ")}
                          </span>
                        </label>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-300">
                        Tone To Avoid (Optional)
                      </Label>
                      <Input
                        value={form.toneToAvoid}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            toneToAvoid: e.target.value,
                          }))
                        }
                        placeholder="e.g. too playful, too salesy"
                      />
                    </div>
                  </>
                )}

                {currentSection === 4 && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-300">
                        Image Usage Permission{" "}
                        <span className="text-red-400">*</span>
                      </Label>
                      <Select
                        value={form.imageUsagePermission}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            imageUsagePermission: e.target
                              .value as typeof f.imageUsagePermission,
                          }))
                        }
                      >
                        <option value="">Select option</option>
                        <option value="YES_ALL">
                          Yes - all approved sources
                        </option>
                        <option value="YES_BRAND_ONLY">
                          Yes - brand owned only
                        </option>
                        <option value="NO_STOCK">No stock imagery</option>
                        <option value="CUSTOM">Custom policy</option>
                      </Select>
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
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-300">
                        Outline / Frame <span className="text-red-400">*</span>
                      </Label>
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
                          <span className="text-sm text-slate-200">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </>
                )}

                {currentSection === 5 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-300">
                      Allow CTAs? <span className="text-red-400">*</span>
                    </Label>
                    {(["YES", "NO"] as const).map((opt) => (
                      <label
                        key={opt}
                        className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/60 cursor-pointer"
                      >
                        <input
                          type="radio"
                          checked={form.allowCtas === opt}
                          onChange={() =>
                            setForm((f) => ({ ...f, allowCtas: opt }))
                          }
                          className="h-4 w-4 text-lime-400"
                        />
                        <span className="text-sm text-slate-200">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {currentSection === 6 && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-300">
                        Posting Frequency (Optional)
                      </Label>
                      <Select
                        value={form.postingFrequencyPreference}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            postingFrequencyPreference: e.target
                              .value as typeof f.postingFrequencyPreference,
                          }))
                        }
                      >
                        <option value="">Select frequency</option>
                        <option value="DAILY">Daily</option>
                        <option value="WEEKLY_3">3 times a week</option>
                        <option value="WEEKLY_5">5 times a week</option>
                        <option value="WEEKLY_7">7 times a week</option>
                        <option value="FORTNIGHTLY">Fortnightly</option>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-300">
                        Preferred Posting Times (Optional)
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        {(["MORNING", "AFTERNOON", "EVENING", "NIGHT"] as const).map(
                          (time) => (
                            <label
                              key={time}
                              className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/60 cursor-pointer"
                            >
                              <Checkbox
                                checked={form.postingTimePreference.includes(time)}
                                onCheckedChange={(checked: boolean) =>
                                  setForm((f) => ({
                                    ...f,
                                    postingTimePreference: checked
                                      ? [...f.postingTimePreference, time]
                                      : f.postingTimePreference.filter(
                                          (t) => t !== time,
                                        ),
                                  }))
                                }
                              />
                              <span className="text-sm text-slate-200">
                                {time.charAt(0) + time.slice(1).toLowerCase()}
                              </span>
                            </label>
                          ),
                        )}
                      </div>
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
                  className="bg-lime-400 text-slate-900 hover:bg-lime-300 px-8 py-2 rounded-xl font-bold transition-all hover:scale-105 active:scale-95"
                >
                  {submitting
                    ? "Saving..."
                    : currentSection === 6
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

export default function FullManagementOnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <p className="text-slate-300">Loading...</p>
      </div>
    }>
      <FullManagementOnboardingInner />
    </Suspense>
  );
}
