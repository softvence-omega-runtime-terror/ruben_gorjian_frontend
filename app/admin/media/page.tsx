"use client";

import { useEffect, useState, useCallback } from "react";
import { Image as ImageIcon, Trash2, Search, RefreshCcw, FileVideo, Filter, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { buildStorageUrl } from "@/lib/storage-utils";
import { getEnvVarWithDefault } from "@/lib/env-utils";
import Image from "next/image";

const STORAGE_BASE_URL = getEnvVarWithDefault("NEXT_PUBLIC_STORAGE_BASE_URL", "");

type MediaAsset = {
  id: string;
  storageKey: string;
  type: "IMAGE" | "VIDEO";
  originalName?: string;
  contentType?: string;
  size?: number;
  userId?: string;
  user?: {
    name: string;
    email: string;
  };
  createdAt: string;
  deletedAt?: string | null;
};

export default function AdminMediaPage() {
  const { toast } = useToast();
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "IMAGE" | "VIDEO">("ALL");

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      // Use the admin-specific proxy to see all users' media and deleted items
      const res = await fetch("/api/admin/media?includeDeleted=true", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch media assets");
      const data = await res.json();
      setAssets(Array.isArray(data) ? data : (data.items || []));
    } catch (err: any) {
      console.error("Error fetching assets:", err);
      toast({ title: "Error", description: "Failed to load media library", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleDeleteAsset = async (id: string) => {
    if (!confirm("Are you sure you want to delete this asset? This will break any posts using it.")) return;

    try {
      const res = await fetch(`/api/uploads/assets/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        setAssets((prev) => prev.filter((a) => a.id !== id));
        toast({ title: "Success", description: "Asset deleted successfully" });
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete asset");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = (asset.originalName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (asset.user?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "ALL" || asset.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Media Library</h1>
          <p className="text-sm text-slate-400">
            View and manage all media assets uploaded by users.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchAssets} 
            disabled={loading}
            className="border-slate-700 hover:bg-slate-800 text-slate-300"
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input 
              placeholder="Search assets or users..." 
              className="pl-9 bg-slate-950 border-slate-700 text-slate-200 focus:border-lime-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button 
              variant={typeFilter === "ALL" ? "secondary" : "ghost"} 
              size="sm"
              onClick={() => setTypeFilter("ALL")}
              className={typeFilter === "ALL" ? "bg-lime-400 text-slate-900 hover:bg-lime-300" : "text-slate-400 hover:text-white"}
            >
              All
            </Button>
            <Button 
              variant={typeFilter === "IMAGE" ? "secondary" : "ghost"} 
              size="sm"
              onClick={() => setTypeFilter("IMAGE")}
              className={typeFilter === "IMAGE" ? "bg-lime-400 text-slate-900 hover:bg-lime-300" : "text-slate-400 hover:text-white"}
            >
              Images
            </Button>
            <Button 
              variant={typeFilter === "VIDEO" ? "secondary" : "ghost"} 
              size="sm"
              onClick={() => setTypeFilter("VIDEO")}
              className={typeFilter === "VIDEO" ? "bg-lime-400 text-slate-900 hover:bg-lime-300" : "text-slate-400 hover:text-white"}
            >
              Videos
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {loading && assets.length === 0 ? (
          Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-slate-800 animate-pulse" />
          ))
        ) : filteredAssets.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-500">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No media assets found matching your filters.</p>
          </div>
        ) : (
          filteredAssets.map((asset) => {
            const url = buildStorageUrl(STORAGE_BASE_URL, asset.storageKey) || "";
            return (
              <div key={asset.id} className="group relative aspect-square rounded-xl overflow-hidden bg-slate-800 border border-slate-700 hover:border-lime-400/50 transition-all">
                {asset.type === "IMAGE" && url ? (
                  <Image 
                    src={url} 
                    alt={asset.originalName || ""} 
                    fill 
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 15vw"
                    unoptimized
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-slate-900 text-slate-400">
                    <FileVideo className="h-10 w-10 opacity-50" />
                  </div>
                )}
                
                {/* Meta Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                  <div className="text-[10px] text-white font-medium truncate mb-1">
                    {asset.originalName || "Unnamed asset"}
                  </div>
                  <div className="text-[9px] text-slate-400 truncate">
                    By {asset.user?.name || "Unknown"}
                  </div>
                </div>

                {/* Actions */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {url && (
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-slate-300 hover:text-white backdrop-blur-sm"
                      title="Open in new tab"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <button 
                    onClick={() => handleDeleteAsset(asset.id)}
                    className="p-1.5 rounded-lg bg-rose-500/80 hover:bg-rose-500 text-white backdrop-blur-sm"
                    title="Delete asset"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Type Indicator */}
                {asset.type === "VIDEO" && (
                   <div className="absolute top-2 left-2 p-1 rounded bg-black/50 text-white backdrop-blur-sm">
                     <FileVideo className="h-3 w-3" />
                   </div>
                )}

                {/* Deleted Indicator */}
                {asset.deletedAt && (
                  <div className="absolute top-2 left-2 p-1 rounded bg-rose-500 text-white backdrop-blur-sm flex items-center gap-1 mt-6">
                    <Trash2 className="h-2 w-2" />
                    <span className="text-[8px] font-bold">DELETED</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
