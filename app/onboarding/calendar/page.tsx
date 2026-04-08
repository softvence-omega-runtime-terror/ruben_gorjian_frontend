"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSessionContext } from "@/context/SessionContext";
import { OnboardingHeaderNav } from "@/components/onboarding/OnboardingHeaderNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertCircle, Check, RefreshCw } from "lucide-react";
import clsx from "clsx";
import type { IconType } from "react-icons";
import { FaFacebook, FaInstagram } from "react-icons/fa";
import { SiTiktok } from "react-icons/si";

// Force dynamic rendering since this page uses client-side hooks and session context
export const dynamic = "force-dynamic";

function CalendarOnboardingInner() {
  const { session, loading: sessionLoading, refresh } = useSessionContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const handledQueryKeyRef = useRef<string | null>(null);
  const refetchRetryIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryKey = searchParams.toString();

  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<string[]>([]);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    platforms: [] as ("INSTAGRAM" | "FACEBOOK")[],
    timezoneAutoDetect: true,
    timezone: "",
    insightGoal: "" as
      | "STAY_CONSISTENT"
      | "PLAN_AHEAD"
      | "REDUCE_LAST_MINUTE"
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
      router.push("/login?returnTo=/onboarding/calendar");
      return;
    }

    const planCategory = session.subscription?.planCategory;
    const isCalendarPlan =
      planCategory === "CALENDAR_ONLY" ||
      planCategory === "VISUAL_CALENDAR" ||
      planCategory === "JEWELRY_CALENDAR_ONLY";
    if (!isCalendarPlan) {
      router.push("/onboarding");
      return;
    }

    if (session.calendarOnboardingCompleted) {
      router.push("/dashboard");
      return;
    }

    // Load existing data
    async function load() {
      try {
        await fetchConnectedAccounts();

        const res = await fetch("/api/onboarding/calendar", {
          cache: "no-store",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.data) {
            setForm((f) => ({
              ...f,
              name: data.name || "",
              platforms: data.data.platforms || [],
              timezoneAutoDetect: data.data.timezone === "AUTO",
              timezone:
                data.data.timezone === "AUTO" ? "" : data.data.timezone || "",
              insightGoal: data.data.insightGoal || "",
            }));
          }
        }
      } catch (err) {
        console.error("Failed to load calendar onboarding data:", err);
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
      window.history.replaceState({}, "", "/onboarding/calendar");
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
      
      window.history.replaceState({}, "", "/onboarding/calendar");
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
          redirectUrl: `${window.location.origin}/onboarding/calendar`,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }

    if (connectedAccounts.length === 0) {
      setError("Please connect at least one social media account");
      return;
    }

    if (!form.timezoneAutoDetect && !form.timezone.trim()) {
      setError("Please select a timezone or enable auto-detect");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          platforms: connectedAccounts,
          timezone: form.timezoneAutoDetect ? undefined : form.timezone,
          timezoneAutoDetect: form.timezoneAutoDetect,
          insightGoal: form.insightGoal || undefined,
        }),
        credentials: "include",
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.error || "Unable to save onboarding.");
      }

      await refresh();
      if (typeof window !== "undefined") {
        const { clearPlanSelection } = await import("@/lib/plan-selection");
        clearPlanSelection();
      }
      router.push("/dashboard");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to save onboarding.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const platformOptions: Array<{
    value: "INSTAGRAM" | "FACEBOOK" | "TIKTOK";
    label: string;
    icon: IconType;
  }> = [
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
      <OnboardingHeaderNav currentStep={1} totalSteps={1} sectionNames={[]} />
      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl rounded-3xl border border-slate-800/80 bg-slate-950/80 backdrop-blur-xl shadow-2xl overflow-hidden relative z-10">
          <div className="px-6 py-8 flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-white">
                  Calendar Setup
                </h1>
                <p className="mt-2 text-sm text-slate-300">
                  Configure your calendar access and preferences
                </p>
              </div>
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
            </div>

            {error && (
              <div className="mt-4 rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-100 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-6 flex-grow overflow-y-auto pr-2 max-h-[60vh]">
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-sm font-semibold text-slate-300"
                >
                  Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Your name"
                  required
                />
              </div>

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

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-300">
                  Timezone
                </Label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 p-3 rounded-lg border border-slate-800 bg-slate-900/60 cursor-pointer">
                    <Checkbox
                      checked={form.timezoneAutoDetect}
                      onCheckedChange={(checked: boolean) =>
                        setForm((f) => ({ ...f, timezoneAutoDetect: checked }))
                      }
                    />
                    <span className="text-sm text-slate-200">Auto-detect</span>
                  </label>
                  {!form.timezoneAutoDetect && (
                    <Select
                      value={form.timezone}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, timezone: e.target.value }))
                      }
                    >
                      <option value="">Select timezone</option>
                      <option value="America/New_York">
                        Eastern Time (ET)
                      </option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">
                        Pacific Time (PT)
                      </option>
                      <option value="Europe/London">London (GMT)</option>
                      <option value="Europe/Paris">Paris (CET)</option>
                      <option value="Asia/Tokyo">Tokyo (JST)</option>
                    </Select>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-300">
                  Insight Goal (Optional)
                </Label>
                <Select
                  value={form.insightGoal}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      insightGoal: e.target.value as
                        | "STAY_CONSISTENT"
                        | "PLAN_AHEAD"
                        | "REDUCE_LAST_MINUTE"
                        | "",
                    }))
                  }
                >
                  <option value="">Select an option</option>
                  <option value="STAY_CONSISTENT">Stay consistent</option>
                  <option value="PLAN_AHEAD">Plan ahead</option>
                  <option value="REDUCE_LAST_MINUTE">
                    Reduce last-minute posting
                  </option>
                </Select>
                <p className="text-xs text-slate-400 mt-1">
                  This answer does not affect execution
                </p>
              </div>
            </form>

            <div className="flex justify-end pt-4 mt-auto border-t border-slate-800">
              <Button
                type="button"
                onClick={(e: any) => handleSubmit(e)}
                disabled={submitting}
                className="bg-lime-400 text-slate-900 hover:bg-lime-300 font-bold px-8 rounded-xl"
              >
                {submitting ? "Saving..." : "Complete Setup"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CalendarOnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <p className="text-slate-300">Loading...</p>
      </div>
    }>
      <CalendarOnboardingInner />
    </Suspense>
  );
}
