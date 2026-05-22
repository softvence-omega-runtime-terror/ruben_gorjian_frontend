"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Crown,
  Loader2,
  RefreshCcw,
  Shield,
  Users,
  Clock,
  XCircle,
  Send,
  TrendingUp,
} from "lucide-react";
import { useSessionContext } from "@/context/SessionContext";

type AdminUser = {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  isFounder: boolean;
  signupDate: string;
  emailVerified: boolean;
  onboardingCompleted: boolean;
  subscriptions: Array<{
    id: string;
    planCode: string;
    status: string;
    priceType: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    createdAt: string;
  }>;
  socialPlatforms: string[];
};

type AdminSubscription = {
  id: string;
  userId: string;
  userEmail: string;
  userIsFounder: boolean;
  planCode: string;
  planName: string;
  planCategory: string;
  planIsJewelry: boolean;
  platformLimit: number | null;
  baseVisualQuota: number | null;
  basePostQuota: number | null;
  status: string;
  priceType: string;
  stripeSubscriptionId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
};

type CalendarEntry = {
  userId: string;
  userEmail: string;
  posts: Array<{
    id: string;
    status: string;
    scheduledFor: string | null;
    createdAt: string;
    targets: Array<{
      id: string;
      platform: string;
      status: string;
      scheduledFor: string | null;
      publishedAt: string | null;
      errorMessage: string | null;
    }>;
  }>;
};

type Tab = "users" | "subscriptions" | "calendars";

type UploadPostHealth = {
  ok: boolean;
  authMode?: "API_KEY" | "CLIENT_CREDENTIALS" | "UNCONFIGURED";
  remote?: {
    success?: boolean;
    message?: string;
    email?: string;
    plan?: string;
  };
  error?: string;
};

export default function AdminPage() {
  const { session } = useSessionContext();
  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [calendars, setCalendars] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [uploadPostHealth, setUploadPostHealth] = useState<UploadPostHealth | null>(null);
  const [uploadPostLoading, setUploadPostLoading] = useState(false);
  const [uploadPostError, setUploadPostError] = useState<string | null>(null);

  const scheduledCount = useMemo(
    () =>
      calendars.reduce(
        (acc, cal) =>
          acc + cal.posts.filter((p) => p.status === "SCHEDULED" || p.status === "PUBLISHING").length,
        0
      ),
    [calendars]
  );

  const connectedPlatforms = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => u.socialPlatforms.forEach((p) => set.add(p)));
    return set.size;
  }, [users]);

  const calendarStats = useMemo(() => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    );
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let upcoming7Days = 0;
    let upcoming30Days = 0;
    let failedCount = 0;
    let postedLast30Days = 0;
    const platformCounts: Record<string, number> = {
      INSTAGRAM: 0,
      FACEBOOK: 0,
      LINKEDIN: 0,
    };

    calendars.forEach((calendar) => {
      calendar.posts.forEach((post) => {
        const scheduledFor = post.scheduledFor
          ? new Date(post.scheduledFor)
          : null;

        if ((post.status === "SCHEDULED" || post.status === "PUBLISHING") && scheduledFor) {
          if (scheduledFor > now && scheduledFor <= sevenDaysFromNow) {
            upcoming7Days++;
          }
          if (scheduledFor > now && scheduledFor <= thirtyDaysFromNow) {
            upcoming30Days++;
          }
        }

        if (post.status === "FAILED") {
          failedCount++;
        }

        post.targets.forEach((target) => {
          const publishedAt = target.publishedAt
            ? new Date(target.publishedAt)
            : null;

          if (
            target.status === "POSTED" &&
            publishedAt &&
            publishedAt >= thirtyDaysAgo
          ) {
            postedLast30Days++;
            if (target.platform in platformCounts) {
              platformCounts[target.platform as keyof typeof platformCounts]++;
            }
          }

          if (target.errorMessage || target.status === "FAILED") {
            failedCount++;
          }
        });
      });
    });

    return {
      upcoming7Days,
      upcoming30Days,
      failedCount,
      postedLast30Days,
      platformCounts,
    };
  }, [calendars]);

  useEffect(() => {
    if (!session || session.role !== "ADMIN") return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.role]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [userRes, subRes, calRes] = await Promise.all([
        fetch("/api/admin/users", {
          cache: "no-store",
          credentials: "include",
        }),
        fetch("/api/admin/subscriptions", {
          cache: "no-store",
          credentials: "include",
        }),
        fetch("/api/admin/calendars", {
          cache: "no-store",
          credentials: "include",
        }),
      ]);

      const [userData, subData, calData] = await Promise.all([
        userRes.json(),
        subRes.json(),
        calRes.json(),
      ]);

      if (!userRes.ok)
        throw new Error(userData?.error || "Unable to load users");
      if (!subRes.ok)
        throw new Error(subData?.error || "Unable to load subscriptions");
      if (!calRes.ok)
        throw new Error(calData?.error || "Unable to load calendars");

      setUsers(Array.isArray(userData) ? userData : []);
      setSubscriptions(Array.isArray(subData) ? subData : []);
      setCalendars(Array.isArray(calData) ? calData : []);
      await loadUploadPostHealth();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to load admin data.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function loadUploadPostHealth() {
    setUploadPostLoading(true);
    setUploadPostError(null);
    try {
      const response = await fetch("/api/admin/upload-post/health", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });
      const data = (await response.json()) as UploadPostHealth;
      if (!response.ok) {
        throw new Error(data?.error || "Unable to fetch Upload-Post health");
      }
      setUploadPostHealth(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to fetch Upload-Post health";
      setUploadPostError(message);
      setUploadPostHealth(null);
    } finally {
      setUploadPostLoading(false);
    }
  }

  async function updateUser(
    userId: string,
    payload: Partial<Pick<AdminUser, "role" | "isFounder">>
  ) {
    setSavingUserId(userId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Unable to update user");
      }
      setUsers((prev) => prev.map((u) => (u.id === userId ? data : u)));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to update user";
      setError(message);
    } finally {
      setSavingUserId(null);
    }
  }

  async function resetPassword(userId: string) {
    const password = window.prompt("Enter a new password (min 8 characters)");
    if (!password) return;
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setResettingUserId(userId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Unable to reset password");
      }
      window.alert("Password reset successfully.");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to reset password";
      setError(message);
    } finally {
      setResettingUserId(null);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            Dashboard
          </h1>
          <p className="text-sm text-slate-400">
            Overview of users, subscriptions, and scheduled posts.
          </p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800/70"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </button>
        </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Provider health
            </p>
            <p className="text-sm text-white">Upload-Post connection status</p>
          </div>
          <button
            onClick={loadUploadPostHealth}
            disabled={uploadPostLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-800/70 disabled:opacity-60"
          >
            <RefreshCcw
              className={`h-3.5 w-3.5 ${uploadPostLoading ? "animate-spin" : ""}`}
            />
            Check
          </button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {uploadPostLoading ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Checking
            </span>
          ) : uploadPostError ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-red-300/30 bg-red-300/10 px-3 py-1 text-xs font-semibold text-red-200">
              <AlertCircle className="h-3.5 w-3.5" />
              {uploadPostError}
            </span>
          ) : uploadPostHealth?.ok ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/40 bg-lime-300/20 px-3 py-1 text-xs font-semibold text-lime-200">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Healthy
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-200">
              <AlertCircle className="h-3.5 w-3.5" />
              Not configured
            </span>
          )}
          {uploadPostHealth?.authMode && (
            <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-[11px] font-semibold text-slate-200">
              {uploadPostHealth.authMode}
            </span>
          )}
          {uploadPostHealth?.remote?.email && (
            <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-[11px] font-semibold text-slate-200">
              {uploadPostHealth.remote.email}
            </span>
          )}
          {uploadPostHealth?.remote?.plan && (
            <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-[11px] font-semibold text-slate-200">
              Plan: {uploadPostHealth.remote.plan}
            </span>
          )}
        </div>
        {uploadPostHealth?.remote?.message && (
          <p className="text-xs text-slate-400">{uploadPostHealth.remote.message}</p>
        )}
      </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Users className="h-4 w-4" />}
            label="Total users"
            value={users.length}
          />
          <StatCard
            icon={<Crown className="h-4 w-4" />}
            label="Founder seats"
            value={users.filter((u) => u.isFounder).length}
          />
          <StatCard
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Active subscriptions"
            value={subscriptions.filter((s) => s.status === "ACTIVE").length}
          />
          <StatCard
            icon={<CalendarDays className="h-4 w-4" />}
            label="Scheduled posts"
            value={scheduledCount}
            hint={`${connectedPlatforms} platforms connected`}
          />
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Admin oversight panel
            </p>
            <p className="text-sm text-white">
              Calendar and posting health metrics
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<Clock className="h-4 w-4" />}
              label="Upcoming (7 days)"
              value={calendarStats.upcoming7Days}
              hint={`${calendarStats.upcoming30Days} in next 30 days`}
            />
            <StatCard
              icon={<Send className="h-4 w-4" />}
              label="Posted (last 30 days)"
              value={calendarStats.postedLast30Days}
            />
            <StatCard
              icon={<XCircle className="h-4 w-4" />}
              label="Failed posts"
              value={calendarStats.failedCount}
              hint="Recent failures"
            />
            <StatCard
              icon={<TrendingUp className="h-4 w-4" />}
              label="Platform activity"
              value={
                calendarStats.platformCounts.INSTAGRAM +
                calendarStats.platformCounts.FACEBOOK +
                calendarStats.platformCounts.LINKEDIN
              }
              hint={`IG: ${calendarStats.platformCounts.INSTAGRAM} • FB: ${calendarStats.platformCounts.FACEBOOK} • LI: ${calendarStats.platformCounts.LINKEDIN}`}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-2 shadow flex flex-wrap gap-2">
          {[
            { key: "users", label: "Users" },
            { key: "subscriptions", label: "Subscriptions" },
            { key: "calendars", label: "Calendars" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as Tab)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? "bg-lime-400 text-slate-950 shadow"
                  : "text-slate-100 hover:bg-slate-800/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 text-xs text-slate-400 px-3">
            {loading && (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading data
              </span>
            )}
            {error && (
              <span className="inline-flex items-center gap-1 text-red-300">
                <AlertCircle className="h-3 w-3" />
                {error}
              </span>
            )}
          </div>
        </div>

        {activeTab === "users" && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  User management
                </p>
                <p className="text-sm text-white">
                  Promote admins, mark founders, and inspect onboarding status.
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-2">User</th>
                    <th className="px-3 py-2">Role</th>
                    <th className="px-3 py-2">Founder</th>
                    <th className="px-3 py-2">Subscriptions</th>
                    <th className="px-3 py-2">Platforms</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-800/40">
                      <td className="px-3 py-3">
                        <div className="font-semibold text-white flex items-center gap-2">
                          {user.email}
                          {user.emailVerified ? (
                            <CheckCircle2 className="h-4 w-4 text-lime-300" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-amber-300" />
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          Joined {formatDate(user.signupDate)} •{" "}
                          {user.onboardingCompleted
                            ? "Onboarding done"
                            : "Onboarding pending"}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={user.role}
                          onChange={(e) =>
                            updateUser(user.id, {
                              role: e.target.value as "USER" | "ADMIN",
                            })
                          }
                          className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-2 py-2 text-sm text-white"
                          disabled={savingUserId === user.id}
                        >
                          <option value="USER">User</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() =>
                            updateUser(user.id, { isFounder: !user.isFounder })
                          }
                          disabled={savingUserId === user.id}
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold border transition ${
                            user.isFounder
                              ? "border-lime-300 text-lime-200 bg-lime-300/10"
                              : "border-slate-700 text-slate-200 hover:bg-slate-800/60"
                          }`}
                        >
                          <Crown className="h-4 w-4" />
                          {user.isFounder ? "Founder" : "Mark founder"}
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        {user.subscriptions.length === 0 ? (
                          <p className="text-xs text-slate-400">
                            No subscription
                          </p>
                        ) : (
                          <div className="space-y-1">
                            {user.subscriptions.map((sub) => (
                              <div
                                key={sub.id}
                                className="rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2"
                              >
                                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                                  {sub.planCode}
                                  <StatusBadge status={sub.status} />
                                </div>
                                <p className="text-xs text-slate-400">
                                  {sub.priceType} • renews{" "}
                                  {formatDate(sub.currentPeriodEnd)}
                                  {sub.cancelAtPeriodEnd
                                    ? " • cancel at period end"
                                    : ""}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          {user.socialPlatforms.length === 0 ? (
                            <span className="text-xs text-slate-400">None</span>
                          ) : (
                            user.socialPlatforms.map((platform) => (
                              <span
                                key={platform}
                                className="rounded-full bg-slate-800/70 px-3 py-1 text-xs font-semibold text-slate-100 border border-slate-700"
                              >
                                {platform.toLowerCase()}
                              </span>
                            ))
                          )}
                        </div>
                        <div className="mt-3">
                          <button
                            onClick={() => resetPassword(user.id)}
                            disabled={resettingUserId === user.id}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-800/70"
                          >
                            <Shield className="h-4 w-4" />
                            {resettingUserId === user.id
                              ? "Resetting..."
                              : "Reset password"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "subscriptions" && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Subscriptions
                </p>
                <p className="text-sm text-white">
                  Plan mix, price type, and platform limits per account.
                </p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {sub.userEmail}
                      </p>
                      <p className="text-xs text-slate-400">{sub.userId}</p>
                    </div>
                    {sub.userIsFounder && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-lime-300/20 px-3 py-1 text-xs font-semibold text-lime-200 border border-lime-300/40">
                        <Crown className="h-3 w-3" />
                        Founder
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    {sub.planName} ({sub.planCode})
                    <StatusBadge status={sub.status} />
                  </div>
                  <p className="text-xs text-slate-400">
                    {sub.planCategory.replace(/_/g, " ")} •{" "}
                    {sub.priceType.toLowerCase()} pricing
                    {sub.cancelAtPeriodEnd ? " • cancel at period end" : ""}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-300">
                    <Metric
                      label="Platform limit"
                      value={sub.platformLimit ?? 0}
                    />
                    <Metric label="Post quota" value={sub.basePostQuota ?? 0} />
                    <Metric
                      label="Visual quota"
                      value={sub.baseVisualQuota ?? 0}
                    />
                  </div>
                  <p className="text-xs text-slate-400">
                    Started {formatDate(sub.createdAt)} • renews{" "}
                    {formatDate(sub.currentPeriodEnd)}
                  </p>
                </div>
              ))}
              {subscriptions.length === 0 && (
                <div className="text-sm text-slate-400 rounded-xl border border-dashed border-slate-800 p-6 text-center">
                  No subscriptions found.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "calendars" && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Calendars
                </p>
                <p className="text-sm text-white">
                  See scheduled posts per user and which platforms are targeted.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {calendars.map((calendar) => (
                <div
                  key={calendar.userId}
                  className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {calendar.userEmail}
                      </p>
                      <p className="text-xs text-slate-400">
                        {calendar.posts.length} posts •{" "}
                        {
                          calendar.posts.filter(
                            (p) => p.status === "SCHEDULED" || p.status === "PUBLISHING"
                          ).length
                        }{" "}
                        scheduled
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {calendar.posts.map((post) => (
                      <div
                        key={post.id}
                        className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-semibold text-white">
                            {post.id.slice(0, 8)}
                            <StatusBadge status={post.status} />
                          </div>
                          <p className="text-xs text-slate-400">
                            {post.status === "SCHEDULED" || post.status === "PUBLISHING"
                              ? "Scheduled"
                              : "Last update"}{" "}
                            {formatDate(post.scheduledFor || post.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {post.targets.map((target) => (
                            <span
                              key={target.id}
                              className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-100"
                            >
                              {target.platform.toLowerCase()}
                              <StatusBadge status={target.status} small />
                            </span>
                          ))}
                          {post.targets.length === 0 && (
                            <span className="text-xs text-slate-400">
                              No targets
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {calendar.posts.length === 0 && (
                      <div className="text-sm text-slate-400 rounded-lg border border-dashed border-slate-800 p-6 text-center">
                        No posts for this user.
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {calendars.length === 0 && (
                <div className="text-sm text-slate-400 rounded-xl border border-dashed border-slate-800 p-6 text-center">
                  No calendar data yet.
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow">
      <div className="flex items-center justify-between">
        <div className="rounded-xl bg-slate-800/60 p-2 text-lime-200 border border-lime-300/40">
          {icon}
        </div>
        <p className="text-xl font-semibold text-white">{value}</p>
      </div>
      <p className="text-sm text-slate-300 mt-2">{label}</p>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/30 px-3 py-2">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function StatusBadge({ status, small }: { status: string; small?: boolean }) {
  const normalized = status?.toLowerCase?.() || "";
  const styles =
    normalized === "active" ||
    normalized === "scheduled" ||
    normalized === "posted"
      ? "bg-lime-300/20 text-lime-200 border-lime-300/40"
      : normalized === "failed" ||
          normalized === "canceled" ||
          normalized === "past_due"
        ? "bg-red-300/10 text-red-200 border-red-300/30"
        : "bg-slate-800 text-slate-200 border-slate-700";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 ${
        small ? "py-0.5 text-[10px]" : "py-1 text-[11px]"
      } font-semibold ${styles}`}
    >
      {status.toLowerCase().replace(/_/g, " ")}
    </span>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
