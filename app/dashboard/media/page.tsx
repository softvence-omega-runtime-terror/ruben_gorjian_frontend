"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image  from "next/image";
import dayjs from "dayjs";

type Asset = {
  id: string;
  storageKey: string;
  type: "IMAGE" | "VIDEO";
  contentType?: string | null;
  createdAt: string;
};

type ApiResponse = { assets: Asset[]; baseUrl?: string | null };

function buildAssetUrl(asset: Asset, baseUrl?: string | null) {
  if (asset.storageKey.startsWith("http")) return asset.storageKey;
  if (baseUrl) return `${baseUrl.replace(/\/$/, "")}/${asset.storageKey}`;
  const fallback = process.env.NEXT_PUBLIC_STORAGE_BASE_URL;
  return fallback ? `${fallback.replace(/\/$/, "")}/${asset.storageKey}` : asset.storageKey;
}

export default function MediaLibraryPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [baseUrl, setBaseUrl] = useState<string | undefined | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/uploads/assets", { credentials: "include" });
        const data: ApiResponse | { error: string } = await res.json();
        if (!res.ok) {
          throw new Error((data && typeof data === "object" && "error" in data && typeof (data as { error?: string }).error === "string" ? (data as { error: string }).error : null) || "Failed to load media");
        }
        const payload = data as ApiResponse;
        setAssets(payload.assets || []);
        setBaseUrl(payload.baseUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load media");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const grouped = useMemo(() => {
    const groups: Record<string, Asset[]> = {};
    assets.forEach((asset) => {
      const day = dayjs(asset.createdAt).format("YYYY-MM-DD");
      if (!groups[day]) groups[day] = [];
      groups[day].push(asset);
    });
    return Object.entries(groups)
      .map(([day, items]) => ({ day, items }))
      .sort((a, b) => (a.day < b.day ? 1 : -1));
  }, [assets]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Media Library</h1>
          <p className="text-sm text-slate-400">Review your uploaded images and videos, grouped by upload date.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs text-slate-400">
            Total {assets.length}
          </Badge>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          {error}
        </div>
      )}

      {loading ? (
        <Card>
          <CardContent className="p-6 text-slate-300">Loading media...</CardContent>
        </Card>
      ) : grouped.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-slate-300">No uploads yet. Add media from the Calendar post modal.</CardContent>
        </Card>
      ) : (
        grouped.map(({ day, items }) => (
          <Card key={day} className="border-slate-800 bg-slate-900/60">
            <CardHeader className="flex items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm text-white">
                {dayjs(day).format("MMMM D, YYYY")}
              </CardTitle>
              <Badge variant="secondary" className="text-xs text-lime-300">
                {items.length} file{items.length === 1 ? "" : "s"}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((asset) => {
                  const url = buildAssetUrl(asset, baseUrl || undefined);
                  return (
                    <div
                      key={asset.id}
                      className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-2"
                    >
                      <div className="aspect-video w-full overflow-hidden rounded-md bg-slate-900 flex items-center justify-center">
                        {asset.type === "IMAGE" ? (
                          <Image
                            src={url}
                            alt={asset.storageKey}
                            className="h-full w-full object-cover"
                            width={100}
                            height={100}
                          />
                        ) : (
                          <video
                            src={url}
                            controls
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-300">
                         <span className="truncate" title={asset.storageKey}>
                          {asset.storageKey.split("/").pop()}
                        </span> 
                        <span className="uppercase text-slate-400">{asset.type}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {dayjs(asset.createdAt).format("h:mm A")}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                        >
                          Open
                        </Button>
                        <Button
                          onClick={() => navigator.clipboard.writeText(url)}
                          variant="ghost"
                          size="sm"
                          className="text-xs text-slate-200"
                        >
                          Copy URL
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
