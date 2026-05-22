"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
import { RefreshCw, Calendar, FileText } from "lucide-react";

type PostStatistics = {
  totalPosts: number;
  scheduledPosts: number;
  publishedPosts: number;
  failedPosts: number;
  draftPosts: number;
  platformBreakdown?: Record<string, number>;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<PostStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<PostStatistics>("/api/posts/statistics");
      setStats(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to load post statistics";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white sm:text-2xl">
            Overview
          </h1>
          <p className="text-sm text-slate-400">
            Your post counts across drafts, scheduled, and published.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          disabled={loading}
          className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* {error && (
        <Card className="border-amber-500/50 bg-amber-500/10">
          <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-amber-200">{error}</p>
            <Button variant="outline" size="sm" onClick={load}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )} */}

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Total posts"
          value={stats?.totalPosts}
          loading={loading}
          description="All posts you’ve created"
        />
        <MetricCard
          label="Scheduled"
          value={stats?.scheduledPosts}
          loading={loading}
          description="Queued for publishing"
          href="/dashboard/calendar"
        />
        <MetricCard
          label="Published"
          value={stats?.publishedPosts}
          loading={loading}
          description="Successfully posted"
          href="/dashboard/calendar"
        />
        <MetricCard
          label="Failed"
          value={stats?.failedPosts}
          loading={loading}
          description="Need attention"
          href="/dashboard/calendar"
        />
        <MetricCard
          label="Drafts"
          value={stats?.draftPosts}
          loading={loading}
          description="Not yet scheduled"
        />
      </div>

      <div className="flex flex-wrap gap-2 text-sm text-slate-400">
        <Link
          href="/dashboard/calendar"
          className="inline-flex items-center gap-1.5 text-lime-400 hover:text-lime-300"
        >
          <Calendar className="h-4 w-4" />
          Open calendar
        </Link>
        <span className="text-slate-600">·</span>
        <Link
          href="/dashboard/media"
          className="inline-flex items-center gap-1.5 text-lime-400 hover:text-lime-300"
        >
          <FileText className="h-4 w-4" />
          Media library
        </Link>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  loading,
  description,
  href,
}: {
  label: string;
  value: number | undefined;
  loading: boolean;
  description?: string;
  href?: string;
}) {
  const content = (
    <Card className="h-full transition hover:border-lime-300/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-300 sm:text-base">
          {label}
        </CardTitle>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-9 w-12 animate-pulse rounded bg-slate-700/60" />
        ) : (
          <p className="text-2xl font-semibold tabular-nums text-white sm:text-3xl">
            {typeof value === "number" ? value : 0}
          </p>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}
