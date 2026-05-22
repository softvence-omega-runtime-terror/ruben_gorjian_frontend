"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionContext } from "@/context/SessionContext";
import { OnboardingHeaderNav } from "@/components/onboarding/OnboardingHeaderNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Instagram, Facebook, Linkedin, AlertCircle } from "lucide-react";

// Force dynamic rendering since this page uses client-side hooks and session context
export const dynamic = "force-dynamic";

export default function CalendarOnboardingPage() {
  const { session, loading: sessionLoading, refresh } = useSessionContext();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    platforms: [] as ("INSTAGRAM" | "FACEBOOK" | "LINKEDIN")[],
    timezoneAutoDetect: true,
    timezone: "",
    insightGoal: "" as
      | "STAY_CONSISTENT"
      | "PLAN_AHEAD"
      | "REDUCE_LAST_MINUTE"
      | "",
  });

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
        // Log error but don't block user from continuing
        console.error("Failed to load calendar onboarding data:", err);
      }
    }
    load();
  }, [session, sessionLoading, router]);

  const handlePlatformToggle = (
    platform: "INSTAGRAM" | "FACEBOOK" | "LINKEDIN",
  ) => {
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(platform)
        ? f.platforms.filter((p) => p !== platform)
        : [...f.platforms, platform],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }

    if (form.platforms.length === 0) {
      setError("Please select at least one platform");
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
          platforms: form.platforms,
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
      // Clear plan selection after successful onboarding
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

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <p className="text-slate-300">Loading...</p>
      </div>
    );
  }

  const platformOptions: Array<{
    value: "INSTAGRAM" | "FACEBOOK" | "LINKEDIN";
    label: string;
    icon: typeof Instagram;
  }> = [
    { value: "INSTAGRAM", label: "Instagram", icon: Instagram },
    { value: "FACEBOOK", label: "Facebook", icon: Facebook },
    { value: "LINKEDIN", label: "LinkedIn", icon: Linkedin },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-950 to-slate-900">
      <OnboardingHeaderNav currentStep={1} totalSteps={1} sectionNames={[]} />
      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl rounded-3xl border border-slate-800/80 bg-slate-950/80 backdrop-blur-xl shadow-2xl overflow-hidden relative z-10">
          <div className="px-6 py-8">
            <h1 className="text-2xl font-semibold text-white">
              Calendar Setup
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Configure your calendar access and preferences
            </p>

            {error && (
              <div className="mt-4 rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-100 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              {/* Name */}
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

              {/* Platform Connection */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-300">
                  Platform Connection <span className="text-red-400">*</span>
                </Label>
                <div className="space-y-2">
                  {platformOptions.map((option) => {
                    const Icon = option.icon;
                    const isChecked = form.platforms.includes(option.value);
                    return (
                      <label
                        key={option.value}
                        className="flex items-center space-x-3 p-3 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-900/80 cursor-pointer"
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => {
                            handlePlatformToggle(option.value);
                          }}
                        />
                        <Icon className="h-5 w-5 text-slate-300" />
                        <span className="text-sm text-slate-200 flex-1">
                          {option.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Timezone */}
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

              {/* Insight Goal (Optional) */}
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

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-lime-400 text-slate-900 hover:bg-lime-300"
                >
                  {submitting ? "Saving..." : "Complete Setup"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
