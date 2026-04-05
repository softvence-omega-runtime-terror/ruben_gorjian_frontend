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
  DollarSign,
  PieChart,
  BarChart3,
  Calendar,
  Filter,
  UserPlus,
  ShoppingBag,
  Activity,
  CreditCard,
  Zap
} from "lucide-react";
import dynamic from "next/dynamic";
import { useSessionContext } from "@/context/SessionContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Dynamically import Recharts components to avoid SSR/Hydration issues
const ResponsiveContainer = dynamic(() => import("recharts").then(mod => mod.ResponsiveContainer), { ssr: false });
const LineChart = dynamic(() => import("recharts").then(mod => mod.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then(mod => mod.Line), { ssr: false });
const XAxis = dynamic(() => import("recharts").then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(mod => mod.Tooltip), { ssr: false });
const Legend = dynamic(() => import("recharts").then(mod => mod.Legend), { ssr: false });
const PieChartComp = dynamic(() => import("recharts").then(mod => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then(mod => mod.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then(mod => mod.Cell), { ssr: false });
const Sector = dynamic(() => import("recharts").then(mod => mod.Sector), { ssr: false });

const PLAN_COLORS = ["#a3e635", "#818cf8", "#fbbf24", "#f87171", "#2dd4bf"];
const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      className="text-[10px] font-black"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const MyCustomPie = (props: any) => {
  return <Sector {...props} />;
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

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
  const [overviewStats, setOverviewStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [revLoading, setRevLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [activityData, setActivityData] = useState<any>(null);
  const [activityLoading, setActivityLoading] = useState(false);

  const dataWithColors = useMemo(() => {
    return (revenueData?.plans || []).map((p: any, i: number) => ({
      ...p,
      fill: PLAN_COLORS[i % PLAN_COLORS.length]
    }));
  }, [revenueData?.plans]);

  const MONTHS = [
    "All", "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  const YEARS = [2025, 2026, 2027];

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
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) return;
    loadData();
    loadOverviewStats();
    loadRevenueData();
    loadActivityData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.role, selectedYear, selectedMonth]);

  async function loadActivityData() {
    setActivityLoading(true);
    try {
      const res = await fetch("/api/admin/overview/activity?page=1&limit=10", {
        cache: "no-store",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActivityData(data.data);
      }
    } catch (err) {
      console.error("Failed to load activity data:", err);
    } finally {
      setActivityLoading(false);
    }
  }

  async function loadRevenueData() {
    setRevLoading(true);
    try {
      const params = new URLSearchParams({
        year: selectedYear.toString(),
        month: selectedMonth
      });
      const res = await fetch(`/api/admin/overview/revenue?${params.toString()}`, {
        cache: "no-store",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRevenueData(data.data);
      }
    } catch (err) {
      console.error("Failed to load revenue data:", err);
    } finally {
      setRevLoading(false);
    }
  }

  async function loadOverviewStats() {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/admin/overview/stats", {
        cache: "no-store",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOverviewStats(data.data);
      }
    } catch (err) {
      console.error("Failed to load overview stats:", err);
    } finally {
      setStatsLoading(false);
    }
  }

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

      {/* --- Premium Overview Cards --- */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Users Statistics */}
        <div className="group relative overflow-hidden rounded-[2rem] border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur-xl transition-all hover:border-lime-400/30">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-lime-400/5 blur-2xl transition-all group-hover:bg-lime-400/10" />
          <div className="flex items-start justify-between">
            <div className="rounded-2xl bg-lime-400/10 p-3 text-lime-400">
              <Users className="h-6 w-6" />
            </div>
            {statsLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
          </div>
          <div className="mt-5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Platform Users</p>
            <div className="mt-1 flex items-baseline gap-2">
              <h2 className="text-4xl font-black text-white tracking-tighter">{overviewStats?.users?.total ?? "—"}</h2>
              <span className="text-xs font-bold text-lime-400">+{overviewStats?.users?.newThisMonth ?? 0} this month</span>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 pt-6 border-t border-slate-800/50">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Accounts</p>
              <p className="text-sm font-black text-slate-100">{overviewStats?.users?.active ?? 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Verified</p>
              <p className="text-sm font-black text-slate-100">{overviewStats?.users?.emailVerified ?? 0}</p>
            </div>
          </div>
        </div>

        {/* Subscription Statistics */}
        <div className="group relative overflow-hidden rounded-[2rem] border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur-xl transition-all hover:border-indigo-400/30">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-indigo-400/5 blur-2xl transition-all group-hover:bg-indigo-400/10" />
          <div className="flex items-start justify-between">
            <div className="rounded-2xl bg-indigo-400/10 p-3 text-indigo-400">
              <Crown className="h-6 w-6" />
            </div>
            {statsLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
          </div>
          <div className="mt-5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Active Subscriptions</p>
            <div className="mt-1 flex items-baseline gap-2">
              <h2 className="text-4xl font-black text-white tracking-tighter">{overviewStats?.subscriptions?.active ?? "—"}</h2>
              <span className="text-xs font-bold text-indigo-400">Total: {overviewStats?.subscriptions?.total ?? 0}</span>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 pt-6 border-t border-slate-800/50">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Monthly Plans</p>
              <p className="text-sm font-black text-slate-100">{overviewStats?.subscriptions?.monthly ?? 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Yearly Plans</p>
              <p className="text-sm font-black text-slate-100">{overviewStats?.subscriptions?.yearly ?? 0}</p>
            </div>
          </div>
        </div>

        {/* Schedule Statistics */}
        <div className="group relative overflow-hidden rounded-[2rem] border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur-xl transition-all hover:border-amber-400/30">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-amber-400/5 blur-2xl transition-all group-hover:bg-amber-400/10" />
          <div className="flex items-start justify-between">
            <div className="rounded-2xl bg-amber-400/10 p-3 text-amber-400">
              <CalendarDays className="h-6 w-6" />
            </div>
            {statsLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
          </div>
          <div className="mt-5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Post Capacity</p>
            <div className="mt-1 flex items-baseline gap-2">
              <h2 className="text-4xl font-black text-white tracking-tighter">{overviewStats?.schedules?.total ?? "—"}</h2>
              <span className="text-xs font-bold text-amber-400">Pending: {overviewStats?.schedules?.pending ?? 0}</span>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 pt-6 border-t border-slate-800/50">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Successfully Posted</p>
              <p className="text-sm font-black text-slate-100">{overviewStats?.schedules?.posted ?? 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Execution Failed</p>
              <p className="text-sm font-black text-red-400">{overviewStats?.schedules?.failed ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- Revenue & Trend Dashboard --- */}
      <div className="space-y-6 pt-6 border-t border-slate-800/50">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-lime-400" />
              Financial Revenue Overview
            </h3>
            <p className="text-sm text-slate-500 font-medium tracking-tight">Real-time revenue trends and plan performance.</p>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-2xl border border-white/5 backdrop-blur-md">
            <div className="flex items-center px-3 border-r border-slate-800">
              <Calendar className="h-4 w-4 text-slate-500 mr-2" />
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer"
              >
                {YEARS.map(y => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
              </select>
            </div>
            <div className="flex items-center px-3">
              <Filter className="h-4 w-4 text-slate-500 mr-2" />
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer"
              >
                {MONTHS.map(m => <option key={m} value={m} className="bg-slate-900">{m}</option>)}
              </select>
            </div>
            {revLoading && (
              <div className="px-2">
                <Loader2 className="h-4 w-4 animate-spin text-lime-400" />
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Main Trend Line Chart */}
          <div className="lg:col-span-3 relative isolate overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-sm">
            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-lime-400/5 blur-[120px]" />
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-lime-400/10 text-lime-400 ring-1 ring-lime-400/20">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-widest">Revenue Growth Trend</h4>
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">Cumulative Monthly Performance</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Period Revenue</p>
                <p className="text-2xl font-black text-lime-400 tracking-tighter">
                  {formatCurrency(revenueData?.summary?.totalRevenueCents ?? 0)}
                </p>
              </div>
            </div>

            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData?.trend || []}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a3e635" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#a3e635" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke="#475569" 
                    fontSize={10} 
                    fontWeight="bold" 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => val.slice(0, 3)}
                  />
                  <YAxis 
                    stroke="#475569" 
                    fontSize={10} 
                    fontWeight="bold" 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => `$${val/1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '12px' }}
                    itemStyle={{ fontWeight: 'bold' }}
                    formatter={(value: any) => [formatCurrency(value), "Revenue"]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenueCents" 
                    stroke="#a3e635" 
                    strokeWidth={4} 
                    dot={{ fill: '#a3e635', strokeWidth: 2, r: 4 }} 
                    activeDot={{ r: 8, stroke: '#0f172a', strokeWidth: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Plan Distribution Pie Chart - Increased Width (lg:col-span-2) */}
          <div className="lg:col-span-2 relative isolate overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-sm">
             <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-400/5 blur-[120px]" />
             <div className="flex items-center gap-3 mb-8">
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-400/10 text-indigo-400 ring-1 ring-indigo-400/20">
                  <PieChart className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-widest">Plan Performance</h4>
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">Revenue Share by Plan</p>
                </div>
              </div>

              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChartComp>
                    <Pie
                      data={dataWithColors}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="revenueCents"
                      nameKey="planName"
                      stroke="none"
                      animationDuration={1500}
                      shape={MyCustomPie}
                    >
                      {dataWithColors.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '12px' }}
                      itemStyle={{ fontWeight: 'black' }}
                      formatter={(value: any) => formatCurrency(value)}
                    />
                  </PieChartComp>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 space-y-2">
                <div className="mb-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Detailed breakdown</p>
                </div>
                {(revenueData?.plans || []).map((plan: any, index: number) => (
                  <div key={plan.planCode} className="flex items-center justify-between p-2 rounded-xl transition-colors hover:bg-slate-800/40">
                    <div className="flex items-center gap-2">
                       <div className="h-2 w-2 rounded-full border border-white/20" style={{ backgroundColor: PLAN_COLORS[index % PLAN_COLORS.length] }} />
                       <div className="flex flex-col">
                         <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter truncate max-w-[150px]">{plan.planName}</span>
                         <span className="text-[9px] text-slate-500 font-bold uppercase">{plan.subscriptions} Active Subscribers</span>
                       </div>
                    </div>
                    <span className="text-xs font-black text-white">{formatCurrency(plan.revenueCents)}</span>
                  </div>
                ))}
              </div>
          </div>
        </div>

        {/* --- Recent Activity Feed --- */}
        <div className="relative isolate overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-sm">
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-lime-400/5 blur-[120px]" />
          <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-indigo-400/5 blur-[100px]" />

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="relative h-12 w-12 flex items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 ring-1 ring-white/10 shadow-lg">
                <Activity className="h-5 w-5 text-white" />
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-lime-400 ring-2 ring-slate-900 animate-pulse" />
              </div>
              <div>
                <h4 className="text-base font-black text-white tracking-tight">Recent Platform Activity</h4>
                <p className="text-[11px] text-slate-500 font-semibold">
                  {activityData?.total ? `${activityData.total} total events` : "Live event feed"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {activityData?.totalPages && activityData.totalPages > 1 && (
                <span className="hidden sm:inline text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 py-1 rounded-full border border-slate-700 bg-slate-800">
                  Page {activityData.page} / {activityData.totalPages}
                </span>
              )}
              <button
                onClick={loadActivityData}
                disabled={activityLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 bg-slate-800/50 text-[11px] font-black text-slate-300 uppercase tracking-widest hover:border-lime-400/40 hover:text-lime-400 hover:bg-lime-400/5 transition-all disabled:opacity-50"
              >
                <RefreshCcw className={`h-3.5 w-3.5 ${activityLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Loading Skeleton */}
          {activityLoading && !activityData && (
            <div className="grid gap-3 sm:grid-cols-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-2xl border border-white/5 bg-slate-950/20 animate-pulse">
                  <div className="h-9 w-9 rounded-xl bg-slate-800 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-2.5 w-24 bg-slate-800 rounded-full" />
                    <div className="h-3.5 w-3/4 bg-slate-800 rounded-full" />
                    <div className="h-2.5 w-36 bg-slate-800 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Activity Items Grid */}
          {(!activityLoading || activityData) && (
            <div
              className="grid gap-3 sm:grid-cols-2 max-h-[680px] overflow-y-auto"
              style={{ scrollbarWidth: "thin", scrollbarColor: "#1e293b transparent" }}
            >
              {(activityData?.items ?? []).map((item: any) => {
                const isUser    = item.type === "USER_CREATED";
                const planCode  = item.metadata?.planCode as string | undefined;
                const billing   = item.metadata?.billingCycle as string | undefined;

                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 p-4 rounded-2xl border transition-all duration-200 hover:scale-[1.01]
                      ${isUser
                        ? "border-lime-400/10 bg-lime-400/[0.03] hover:bg-lime-400/[0.06] hover:border-lime-400/20"
                        : "border-indigo-400/10 bg-indigo-400/[0.03] hover:bg-indigo-400/[0.07] hover:border-indigo-400/20"
                      }`}
                  >
                    {/* Icon */}
                    <div className={`flex-shrink-0 h-9 w-9 flex items-center justify-center rounded-xl ring-1
                      ${isUser
                        ? "bg-lime-400/10 text-lime-400 ring-lime-400/20"
                        : "bg-indigo-400/10 text-indigo-400 ring-indigo-400/20"
                      }`}
                    >
                      {isUser
                        ? <UserPlus className="h-4 w-4" />
                        : <ShoppingBag className="h-4 w-4" />
                      }
                    </div>

                    {/* Body */}
                    <div className="flex-1 min-w-0">
                      {/* Top row: badges + timestamp */}
                      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest
                            ${isUser
                              ? "bg-lime-400/10 text-lime-400 border border-lime-400/20"
                              : "bg-indigo-400/10 text-indigo-400 border border-indigo-400/20"
                            }`}
                          >
                            {isUser ? "New User" : "Subscription"}
                          </span>
                          {billing && (
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest
                              ${billing === "YEARLY"
                                ? "bg-amber-400/10 text-amber-300 border border-amber-400/20"
                                : "bg-slate-700/60 text-slate-400 border border-slate-600/50"
                              }`}
                            >
                              {billing === "YEARLY" ? "⚡ Yearly" : "Monthly"}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-600 font-semibold whitespace-nowrap">
                          {formatTimeAgo(item.createdAt)}
                        </span>
                      </div>

                      {/* Message */}
                      <p className="text-[13px] text-slate-200 font-medium leading-snug mb-2">
                        {item.message}
                      </p>

                      {/* Footer chips */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-900/80 border border-white/5">
                          <Users className="h-2.5 w-2.5 text-slate-500" />
                          <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[160px]">
                            {item.user?.name ?? item.user?.email}
                          </span>
                        </div>
                        {planCode && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                            <Zap className="h-2.5 w-2.5 text-indigo-400" />
                            <span className="text-[10px] text-indigo-300 font-black">{planCode}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Empty state */}
              {(activityData?.items ?? []).length === 0 && !activityLoading && (
                <div className="sm:col-span-2 text-center py-16 rounded-3xl border border-dashed border-slate-800">
                  <Activity className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-500">No activity recorded yet.</p>
                  <p className="text-xs text-slate-600 mt-1">Events will appear here as users join and subscribe.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-2 shadow flex flex-wrap gap-2">
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
        </div> */}

        {/* {activeTab === "users" && (
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
                          {session?.role === "VA_ADMIN" ? "••••••••@••••.•••" : user.email}
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
                        <div className="mt-3 flex gap-2">
                          <Link href={`/admin/users/${user.id}/calendar`}>
                            <Button variant="outline" size="sm" className="h-8 border-slate-700 text-xs text-slate-300 hover:bg-slate-800">
                              <CalendarDays className="h-4 w-4 mr-2" />
                              View Calendar
                            </Button>
                          </Link>
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
        )} */}

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
                        {session?.role === "VA_ADMIN" ? "••••••••@••••.•••" : sub.userEmail}
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
                        {session?.role === "VA_ADMIN" ? "••••••••@••••.•••" : calendar.userEmail}
                      </p>
                      <p className="text-xs text-slate-400">{calendar.userId}</p>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    {calendar.posts.map((post) => (
                      <div
                        key={post.id}
                        className="rounded-lg border border-slate-800 bg-slate-950/50 p-3"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <StatusBadge status={post.status} small />
                          <p className="text-[10px] text-slate-500">
                            Created {formatDate(post.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {post.targets.map((target) => (
                            <div
                              key={target.id}
                              className="rounded bg-slate-800/80 px-2 py-1 text-[10px] border border-slate-700"
                            >
                              <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                                {target.platform}
                                <StatusBadge status={target.status} small />
                              </div>
                              <p className="text-slate-500 mt-0.5">
                                {target.status === "POSTED"
                                  ? `Published ${formatDate(target.publishedAt)}`
                                  : target.scheduledFor
                                  ? `Scheduled ${formatDate(target.scheduledFor)}`
                                  : "Draft"}
                              </p>
                              {target.errorMessage && (
                                <p className="text-red-400 mt-0.5 max-w-[200px] truncate">
                                  {target.errorMessage}
                                </p>
                              )}
                            </div>
                          ))}
                          {post.targets.length === 0 && (
                            <span className="text-xs text-slate-400">
                              No targets
                            </span>
                          )}
                          <div className="flex items-center gap-3">
                            <Link href={`/admin/users/${calendar.userId}/calendar`}>
                              <Button variant="outline" size="sm" className="h-8 border-lime-400/30 text-xs text-lime-400 hover:bg-lime-400/10">
                                <CalendarDays className="h-3.5 w-3.5 mr-1" />
                                Interactive Calendar
                              </Button>
                            </Link>
                          </div>
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

function formatTimeAgo(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const diffMs = Date.now() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return "just now";
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
