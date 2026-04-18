
"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Calendar, FileText, AlertTriangle } from "lucide-react";
import { useSessionContext } from "@/context/SessionContext";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

// ---------------- Types ----------------

type DashboardOverview = {
  plan: {
    planCode: string;
    planCategory: string;
    status: string;
    billingCycle: string;
    currentPeriodEnd: string;
    daysLeft: number;
    postQuota: number;
    platformLimit: number;
  };
  usage: {
    priceType: string;
    billingCycle: string;
    currentPeriodEnd: string;
    daysLeft: number;
    postLimitType: string;
    postQuota: number;
    visualQuota: number | null;
    platformLimit: number;
    videoSessionHours: number;
  };
  usage: {
    periodStart: string;
    periodEnd: string;

    postsUsed: number;
    postsRemaining: number;
    visualsUsed: number;
    visualsRemaining: number | null;

    visualsBonus: number;

    platformsUsed: number;
    platformsRemaining: number;
  };
  socialAccounts: {
    connectedTotal: number;
    byPlatform: Record<string, number>;
    expiringSoon: number;
  };
};

type RecentActivity = {
  id: string;
  type: string;
  title: string;
  description: string;
  createdAt: string;
};

type UpcomingPost = {
  postId: string;
  status: string;
  scheduledFor: string;
  targets: { platform: string; status: string }[];
};

// ---------------- Mock Data ----------------

const MOCK_RECENT_ACTIVITY: RecentActivity[] = [
  {
    id: "mock_1",
    type: "POST_PUBLISHED",
    title: "Post published successfully",
    description: "Published to Instagram",
    createdAt: new Date().toISOString(),
  },
];

const MOCK_UPCOMING_POSTS: UpcomingPost[] = [
  {
    postId: "mock_post_1",
    status: "SCHEDULED",
    scheduledFor: new Date(Date.now() + 86400000).toISOString(),
    targets: [{ platform: "INSTAGRAM", status: "PENDING" }],
  },
];

const MOCK_ALERTS = [
  {
    type: "warning",
    code: "DEMO_ALERT",
    message: "This is a demo alert message.",
  },
];

const MOCK_PIPELINE = {
  draft: 2,
  scheduled: 3,
  publishing: 1,
  failed: 0,
  postedThisWeek: 5,
};


// ---------------- Hooks ----------------

function useDashboardOverview(enabled: boolean) {
  return useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: () =>
      apiGet<{ success: boolean; data: DashboardOverview }>(
        "/api/dashboard/overview",
      ),
    enabled,
    staleTime: 1000 * 60,
  });
}

function useRecentActivity(enabled: boolean) {
  return useQuery({
    queryKey: ["recent-activity"],
    queryFn: () =>
      apiGet<{ success: boolean; data: { items: RecentActivity[] } }>(
        "/api/dashboard/overview/recent-activity",
      ),
    enabled,
  });
}

function useUpcomingPosts(enabled: boolean) {
  return useQuery({
    queryKey: ["upcoming-posts"],
    queryFn: () =>
      apiGet<{ success: boolean; data: { items: UpcomingPost[] } }>(
        "/api/dashboard/overview/upcoming-posts",
      ),
    enabled,
  });
}

function usePostPipeline(enabled: boolean) {
  return useQuery({
    queryKey: ["post-pipeline"],
    queryFn: () =>
      apiGet<{ success: boolean; data: any }>(
        "/api/dashboard/overview/post-pipeline",
      ),
    enabled,
  });
}

function useSystemAlerts(enabled: boolean) {
  return useQuery({
    queryKey: ["system-alerts"],
    queryFn: () =>
      apiGet<{
        success: boolean;
        data: {
          count: number;
          items: { type: string; code: string; message: string }[];
        };
      }>("/api/dashboard/overview/system-alerts"),
    enabled,
  });
}

function useSubscriptionProgress(enabled: boolean) {
  return useQuery({
    queryKey: ["subscription-progress"],
    queryFn: () =>
      apiGet<{
        success: boolean;
        data: {
          subscription: any;
          chart: {
            type: string;
            unit: string;
            usedPercent: number;
            remainingPercent: number;
            segments: { key: string; label: string; value: number }[];
          };
        };
      }>("/api/dashboard/overview/subscription-progress"),
    enabled,
  });
}
// ---------------- Page ----------------

export default function DashboardPage() {
  const { session } = useSessionContext();
  const enabled = !!session?.subscription?.planCode;

  const overviewQ = useDashboardOverview(enabled);
  const activityQ = useRecentActivity(enabled);

  const progressQ = useSubscriptionProgress(enabled);
  const progress = progressQ.data?.data.chart;

  const upcomingQ = useUpcomingPosts(enabled);
  const pipelineQ = usePostPipeline(enabled);
  const alertsQ = useSystemAlerts(enabled);

  const overview = overviewQ.data?.data;

  const activity = activityQ.data?.data.items || [];
  const upcoming = upcomingQ.data?.data.items || [];
  const pipeline = pipelineQ.data?.data;
  const alerts = alertsQ.data?.data.items || [];

  const activityData = activity.length > 0 ? activity : MOCK_RECENT_ACTIVITY;
  const upcomingData = upcoming.length > 0 ? upcoming : MOCK_UPCOMING_POSTS;
  const alertsData = alerts.length > 0 ? alerts : MOCK_ALERTS;
  const pipelineData =
    pipeline && Object.keys(pipeline).length > 0 ? pipeline : MOCK_PIPELINE;
  const activityData = activity;
  const upcomingData = upcoming;
  const alertsData = alerts;
  const pipelineData = pipeline || {};


  const isLoading = overviewQ.isLoading;

  const refetchAll = () => {
    overviewQ.refetch();
    activityQ.refetch();
    upcomingQ.refetch();
    pipelineQ.refetch();
    alertsQ.refetch();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white sm:text-2xl">
            Overview
          </h1>
          <p className="text-sm text-slate-400">Dashboard summary</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={refetchAll}
          disabled={overviewQ.isFetching}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${overviewQ.isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Plan & Usage */}
      <Section title="Plan & Usage">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Plan Code"
            value={overview?.plan.planCode}
            loading={isLoading}
          />
          <MetricCard
            label="Billing"
            value={overview?.plan.billingCycle}
            loading={isLoading}
          />
          <MetricCard
            label="Days Left"
            value={overview?.plan.daysLeft}
            loading={isLoading}
          />
          <MetricCard
            label="Status"
            value={overview?.plan.status}
            loading={isLoading}
          />
        </div>
      </Section>

      {/* Usage */}
      <Section title="Usage">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <MetricCard
            label="Posts Used"
            value={overview?.usage.postsUsed}
            loading={isLoading}
          />
          <MetricCard
            label="Posts Remaining"
            value={overview?.usage.postsRemaining}
            loading={isLoading}
          />
          <MetricCard
            label="Platforms Remaining"
            value={overview?.usage.platformsRemaining}
            loading={isLoading}
          />
      {/* Plan Details */}
      <Section title="Plan Details">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <MetricCard label="Plan Code" value={overview?.plan.planCode} loading={isLoading} />
          <MetricCard label="Category" value={overview?.plan.planCategory} loading={isLoading} />
          <MetricCard label="Status" value={overview?.plan.status} loading={isLoading} />
          <MetricCard label="Price Type" value={overview?.plan.priceType} loading={isLoading} />
          <MetricCard label="Billing Cycle" value={overview?.plan.billingCycle} loading={isLoading} />
          <MetricCard label="Days Left" value={overview?.plan.daysLeft} loading={isLoading} />
          <MetricCard label="Post Limit Type" value={overview?.plan.postLimitType} loading={isLoading} />
          <MetricCard label="Post Quota" value={overview?.plan.postQuota} loading={isLoading} />
          <MetricCard label="Visual Quota" value={overview?.plan.visualQuota ?? "Unlimited"} loading={isLoading} />
          <MetricCard label="Platform Limit" value={overview?.plan.platformLimit} loading={isLoading} />
          <MetricCard label="Period Start" value={overview?.usage.periodStart ? new Date(overview.usage.periodStart).toLocaleDateString() : ""} loading={isLoading} />
          <MetricCard label="Period End" value={overview?.usage.periodEnd ? new Date(overview.usage.periodEnd).toLocaleDateString() : ""} loading={isLoading} />

      {/* TOP GRID (Main UI like screenshot) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT CARD - PLAN */}
        <div className="rounded-xl bg-[#0B0F19] border border-slate-800 p-6 text-white">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded">
              ACTIVE PLAN
            </span>
            <span className="text-xs text-slate-400">
              {overview?.plan.billingCycle}
            </span>
          </div>

          <h2 className="text-2xl font-bold mb-2">
            {overview?.plan.planCategory}
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            CODE: {overview?.plan.planCode}
          </p>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400 text-xs">SUBSCRIPTION PERIOD</p>
              <p className="font-semibold">
                {new Date(
                  overview?.usage.periodStart || "",
                ).toLocaleDateString()}{" "}
                -{" "}
                {new Date(overview?.usage.periodEnd || "").toLocaleDateString()}
              </p>
            </div>

            <div>
              <p className="text-slate-400 text-xs">PAYMENT</p>
              <p className="font-semibold">{overview?.plan.billingCycle}</p>
            </div>
          </div>

          {/* FEATURES */}
          <div className="grid grid-cols-2 gap-3 mt-6 text-xs">
            <FeatureBox
              label="Platform Limit"
              value={overview?.plan.platformLimit}
            />
            <FeatureBox label="Posts" value={overview?.plan.postQuota} />
            <FeatureBox label="Video" value="Enabled" />
            <FeatureBox
              label="Video Session Hours"
              value={overview?.plan.videoSessionHours}
            />
            <FeatureBox label="Days Left" value={overview?.plan.daysLeft} />
          </div>

        </div>

        {/* RIGHT CARD - PIE CHART */}
        <div className="rounded-xl bg-[#0B0F19] border border-slate-800 p-6 text-white flex flex-col items-center justify-center">
          <h3 className="text-lg font-semibold mb-4">Subscription Progress</h3>

          {/* DONUT WRAPPER */}
          <div className="relative w-44 h-44">
            {/* OUTER RING */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(
          #ef4444 0% ${progress?.usedPercent || 0}%,
          #22c55e ${progress?.usedPercent || 0}% 100%
        )`,
              }}
            />

            {/* INNER CUT (THIS MAKES IT CENTER-FILLED DONUT LOOK) */}
            <div className="absolute inset-[14px] rounded-full bg-[#0B0F19] flex items-center justify-center">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">
                  {progress?.usedPercent ?? 0}%
                </p>
                <p className="text-xs text-slate-400">Used</p>
              </div>
            </div>
          </div>

          {/* LABELS */}
          <div className="flex justify-between w-full mt-5 text-sm text-slate-400">
            <span>Used: {progress?.usedPercent}%</span>
            <span>Remaining: {progress?.remainingPercent}%</span>
          </div>
        </div>
      </div>

      {/* Usage Metrics - NEW UI */}
      <Section title="Usage Metrics">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl p-5 bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border border-indigo-500/20">
            <p className="text-xs text-slate-400">Posts</p>
            <p className="text-2xl font-bold text-white">
              {overview?.usage.postsUsed} / {overview?.usage.postsRemaining}
            </p>
          </div>

          <div className="rounded-2xl p-5 bg-gradient-to-br from-pink-500/10 to-pink-500/5 border border-pink-500/20">
            <p className="text-xs text-slate-400">Visuals</p>
            <p className="text-2xl font-bold text-white">
              {overview?.usage.visualsUsed} /{" "}
              {overview?.usage.visualsRemaining ?? "∞"}
            </p>
          </div>

          {/* <div className="rounded-2xl p-5 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20">
            <p className="text-xs text-slate-400">Platforms</p>
            <p className="text-2xl font-bold text-white">
              {overview?.usage.platformsUsed} /{" "}
              {overview?.usage.platformsRemaining}
            </p>
          </div> */}

          <div className="rounded-2xl p-5 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
            <p className="text-xs text-slate-400">Bonus Visuals</p>
            <p className="text-2xl font-bold text-white">
              {overview?.usage.visualsBonus}
            </p>
          </div>

          <div className="rounded-2xl p-5 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
            <p className="text-xs text-slate-400">Period</p>
            <p className="text-sm font-semibold text-white">
              {new Date(overview?.usage.periodStart || "").toLocaleDateString()}{" "}
              → {new Date(overview?.usage.periodEnd || "").toLocaleDateString()}
            </p>
          </div>
        </div>
      </Section>

      {/* Plan Details */}
      {/* <Section title="Plan Details">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

          <MetricCard label="Connected Total" value={overview?.socialAccounts.connectedTotal} loading={isLoading} />
          <MetricCard label="Expiring Soon" value={overview?.socialAccounts.expiringSoon} loading={isLoading} />
          {overview?.socialAccounts.byPlatform && Object.entries(overview.socialAccounts.byPlatform).map(([platform, count]) => (
            <MetricCard key={platform} label={`${platform}`} value={count} loading={isLoading} />
          ))}

          <MetricCard
            label="Plan Code"
            value={overview?.plan.planCode}
            loading={isLoading}
          />
          <MetricCard
            label="Category"
            value={overview?.plan.planCategory}
            loading={isLoading}
          />
          <MetricCard
            label="Status"
            value={overview?.plan.status}
            loading={isLoading}
          />
          <MetricCard
            label="Price Type"
            value={overview?.plan.priceType}
            loading={isLoading}
          />
          <MetricCard
            label="Billing Cycle"
            value={overview?.plan.billingCycle}
            loading={isLoading}
          />
          <MetricCard
            label="Days Left"
            value={overview?.plan.daysLeft}
            loading={isLoading}
          />
          <MetricCard
            label="Post Limit Type"
            value={overview?.plan.postLimitType}
            loading={isLoading}
          />
          <MetricCard
            label="Post Quota"
            value={overview?.plan.postQuota}
            loading={isLoading}
          />
          <MetricCard
            label="Visual Quota"
            value={overview?.plan.visualQuota ?? "Unlimited"}
            loading={isLoading}
          />
          <MetricCard
            label="Platform Limit"
            value={overview?.plan.platformLimit}
            loading={isLoading}
          />
          <MetricCard
            label="Period Start"
            value={
              overview?.usage.periodStart
                ? new Date(overview.usage.periodStart).toLocaleDateString()
                : ""
            }
            loading={isLoading}
          />
          <MetricCard
            label="Period End"
            value={
              overview?.usage.periodEnd
                ? new Date(overview.usage.periodEnd).toLocaleDateString()
                : ""
            }
            loading={isLoading}
          />
        </div>
      </Section> */}

      {/* ================= PIPELINE + UPCOMING ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PIPELINE */}
        <div className="rounded-xl border border-slate-800 bg-[#0B0F19] p-5">
          <h2 className="text-white font-semibold mb-4">Post Pipeline</h2>

          <div className="space-y-2">
            {Object.entries(pipelineData).map(([key, val]) => (
              <div
                key={key}
                className="flex justify-between items-center p-2 rounded bg-slate-900/40"
              >
                <span className="text-xs text-slate-400">{key}</span>
                <span className="text-white font-semibold">
                  {val as number}
                </span>
              </div>
            ))}
          </div>

        </div>

        {/* UPCOMING */}
        <div className="rounded-xl border border-slate-800 bg-[#0B0F19] p-5">
          <h2 className="text-white font-semibold mb-4">Upcoming Posts</h2>

          <div className="space-y-3">
            {upcomingData.map((p) => (
              <div key={p.postId} className="p-3 rounded-lg bg-slate-900/40">
                <p className="text-sm text-white">{p.postId}</p>
                <p className="text-xs text-slate-400">
                  {new Date(p.scheduledFor).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Social Accounts - NEW UI */}
      <Section title="Social Accounts">
        <div className="flex flex-col gap-4">
          {/* Top Summary Bar */}
          <div className="rounded-2xl p-5 bg-slate-900/40 border border-slate-800 flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-400">Total Connected</p>
              <p className="text-2xl font-bold text-white">
                {overview?.socialAccounts.connectedTotal}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs text-slate-400">Expiring Soon</p>
              <p className="text-xl font-bold text-red-400">
                {overview?.socialAccounts.expiringSoon}
              </p>
            </div>
          </div>

          {/* Platform Pills */}
          <div className="flex flex-wrap gap-3">
            {overview?.socialAccounts.byPlatform &&
              Object.entries(overview.socialAccounts.byPlatform).map(
                ([platform, count]) => (
                  <div
                    key={platform}
                    className="px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-sm text-white flex items-center gap-2"
                  >
                    <span className="capitalize">{platform}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="font-bold">{count}</span>
                  </div>
                ),
              )}
          </div>
        </div>
      </Section>
      {/* Alerts */}
      <Section title={`System Alerts (${alertsData.length})`}>
        <div className="space-y-3">
          {alertsData.map((a, i) => (
            <div
              key={i}
              className="flex items-start justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900 p-3 hover:bg-slate-800/40 transition"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-1 text-yellow-400" />
                <div>
                  <p className="text-sm text-slate-200">{a.message}</p>
                  <span className="text-xs text-slate-500">{a.code}</span>
                </div>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                {a.type}
              </span>
            </div>
          ))}
        </div>
        {alertsData.length === 0 ? (
          <p className="text-sm text-slate-400">No data available</p>
        ) : (
          <div className="space-y-3">
            {alertsData.map((a, i) => (
              <div
                key={i}
                className="flex items-start justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900 p-3 hover:bg-slate-800/40 transition"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-1 text-yellow-400" />
                  <div>
                    <p className="text-sm text-slate-200">{a.message}</p>
                    <span className="text-xs text-slate-500">{a.code}</span>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                  {a.type}
                </span>
              </div>
            ))}
          </div>
        )}

      </Section>

      {/* Pipeline */}
      <Section title="Post Pipeline">
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-5">
          {Object.entries(pipelineData).map(([key, val]) => (
            <div
              key={key}
              className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-center hover:border-slate-700 transition"
            >
              <p className="text-xs text-slate-400 capitalize">{key}</p>
              <p className="text-xl font-semibold text-white mt-1">
                {val as number}
              </p>
            </div>
          ))}
        </div>
        {Object.keys(pipelineData).length === 0 ? (
          <p className="text-sm text-slate-400">No data available</p>
        ) : (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-5">
            {Object.entries(pipelineData).map(([key, val]) => (
              <div
                key={key}
                className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-center hover:border-slate-700 transition"
              >
                <p className="text-xs text-slate-400 capitalize">{key}</p>
                <p className="text-xl font-semibold text-white mt-1">
                  {val as number}
                </p>
              </div>
            ))}
          </div>
        )}

      </Section>

      {/* Upcoming */}
      <Section title="Upcoming Posts">
        <div className="space-y-3">
          {upcomingData.map((p) => (
            <div
              key={p.postId}
              className="flex flex-col gap-1 rounded-lg border border-slate-800 bg-slate-900 p-4 hover:bg-slate-800/40 transition"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white">{p.postId}</p>
                <span className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {p.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Scheduled: {new Date(p.scheduledFor).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">
                Platforms: {p.targets.map((t) => t.platform).join(", ")}
              </p>
            </div>
          ))}
        </div>
        {upcomingData.length === 0 ? (
          <p className="text-sm text-slate-400">No data available</p>
        ) : (
          <div className="space-y-3">
            {upcomingData.map((p) => (
              <div
                key={p.postId}
                className="flex flex-col gap-1 rounded-lg border border-slate-800 bg-slate-900 p-4 hover:bg-slate-800/40 transition"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white">{p.postId}</p>
                  <span className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {p.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Scheduled: {new Date(p.scheduledFor).toLocaleString()}
                </p>
                <p className="text-xs text-slate-500">
                  Platforms: {p.targets.map((t) => t.platform).join(", ")}
                </p>
              </div>
            ))}
          </div>
        )}

      </Section>


      {/* Recent Activity */}
      <Section title="Recent Activity">
        <div className="space-y-3">
          {activityData.map((a) => (
            <div
              key={a.id}
              className="flex gap-3 rounded-lg border border-slate-800 bg-slate-900 p-3 hover:bg-slate-800/40 transition"
            >
              <div className="mt-1 h-2 w-2 rounded-full bg-lime-400" />
              <div>
                <p className="text-sm text-white">{a.title}</p>
                <p className="text-xs text-slate-400">{a.description}</p>
                <p className="text-xs text-slate-500">
                  {new Date(a.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
        {activityData.length === 0 ? (
          <p className="text-sm text-slate-400">No data available</p>
        ) : (
          <div className="space-y-3">
            {activityData.map((a) => (
              <div
                key={a.id}
                className="flex gap-3 rounded-lg border border-slate-800 bg-slate-900 p-3 hover:bg-slate-800/40 transition"
              >
                <div className="mt-1 h-2 w-2 rounded-full bg-lime-400" />
                <div>
                  <p className="text-sm text-white">{a.title}</p>
                  <p className="text-xs text-slate-400">{a.description}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(a.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

      </Section>

      {/* ================= INSIGHTS STRIP ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat label="Posts Used" value={overview?.usage.postsUsed} />
        <MiniStat
          label="Remaining Posts"
          value={overview?.usage.postsRemaining}
        />
        <MiniStat label="Platforms" value={overview?.usage.platformsUsed} />
        <MiniStat
          label="Connected Accounts"
          value={overview?.socialAccounts.connectedTotal}
        />
      </div>

      {/* Links */}
      <div className="flex flex-wrap gap-2 text-sm text-slate-400">
        <Link
          href="/dashboard/calendar"
          className="inline-flex items-center gap-1.5 text-lime-400 hover:text-lime-300"
        >
          <Calendar className="h-4 w-4" /> Open calendar
        </Link>
        <span className="text-slate-600">·</span>
        <Link
          href="/dashboard/media"
          className="inline-flex items-center gap-1.5 text-lime-400 hover:text-lime-300"
        >
          <FileText className="h-4 w-4" /> Media library
        </Link>
      </div>
    </div>
  );
}

// ---------------- Components ----------------

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-lime-400" />
        {title}
      </h2>
      {children}
    </div>
  );
}

function MetricCard({ label, value, loading }: any) {
  return (
    <Card className="border-slate-800 bg-slate-900/50 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all rounded-2xl">
      <CardContent className="p-4 flex flex-col space-y-2">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">
          {label}
        </p>

        {loading ? (
          <div className="h-5 w-1/2 animate-pulse rounded bg-slate-800/80" />
        ) : (
          <p className="text-sm font-black text-slate-100 truncate">
            {value ?? 0}
          </p>
        )}
      </CardContent>
    </Card>
  );
}


function FeatureBox({ label, value }: any) {
  return (
    <div className="bg-slate-800/40 rounded-lg p-3">
      <p className="text-[10px] text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-white">{value ?? 0}</p>
    </div>
  );
}
function MiniStat({ label, value }: any) {
  return (
    <div className="rounded-xl bg-[#0B0F19] border border-slate-800 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-lg font-bold text-white mt-1">{value ?? 0}</p>
    </div>
  );
}

