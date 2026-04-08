<<<<<<< HEAD
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
    postsUsed: number;
    postsRemaining: number;
    visualsUsed: number;
    visualsRemaining: number | null;
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

// ---------------- Page ----------------

export default function DashboardPage() {
  const { session } = useSessionContext();
  const enabled = !!session?.subscription?.planCode;

  const overviewQ = useDashboardOverview(enabled);
  const activityQ = useRecentActivity(enabled);
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
      </Section>

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

function MetricCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: string | number | undefined;
  loading: boolean;
}) {
  return (
    <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs uppercase tracking-wide text-slate-400">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-6 w-20 animate-pulse rounded bg-slate-700/60" />
        ) : (
          <p className="text-2xl font-semibold text-white">{value ?? 0}</p>
        )}
      </CardContent>
    </Card>
  );
}
=======
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
    postsUsed: number;
    postsRemaining: number;
    visualsUsed: number;
    visualsRemaining: number | null;
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

// ---------------- Page ----------------

export default function DashboardPage() {
  const { session } = useSessionContext();
  const enabled = !!session?.subscription?.planCode;

  const overviewQ = useDashboardOverview(enabled);
  const activityQ = useRecentActivity(enabled);
  const upcomingQ = useUpcomingPosts(enabled);
  const pipelineQ = usePostPipeline(enabled);
  const alertsQ = useSystemAlerts(enabled);

  const overview = overviewQ.data?.data;

  const activity = activityQ.data?.data.items || [];
  const upcoming = upcomingQ.data?.data.items || [];
  const pipeline = pipelineQ.data?.data;
  const alerts = alertsQ.data?.data.items || [];

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
        </div>
      </Section>

      {/* Alerts */}
      <Section title={`System Alerts (${alertsData.length})`}>
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

function MetricCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: string | number | undefined;
  loading: boolean;
}) {
  return (
    <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs uppercase tracking-wide text-slate-400">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-6 w-20 animate-pulse rounded bg-slate-700/60" />
        ) : (
          <p className="text-2xl font-semibold text-white">{value ?? 0}</p>
        )}
      </CardContent>
    </Card>
  );
}
>>>>>>> a150e68 (user dashboard overview mock data removed)
