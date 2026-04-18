"use client";

import { Suspense, useMemo, useEffect, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import {
  Image as ImageIcon,
  MapPin,
  Play,
  Loader2,
  Maximize2,
  X,
} from "lucide-react";
import { apiGet } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/navbar";
import FooterSecondary from "@/components/footer-secondary";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type CaseStudy = {
  id: string;
  title?: string | null;
  location?: string | null;
  displayOrder?: number | null;
  cycleTitle?: string | null;
  services?: string[] | string | null;
  tagline?: string | null;
  structureTitle?: string | null;
  structureItems?: string[] | string | null;
  videoTitle?: string | null;
  status?: "ACTIVE" | "INACTIVE" | string | null;
  isActive?: boolean | null;
  logoUrl?: string | null;
  logo?: any;
  images?: any[] | null;
  videoUrl?: string | null;
  video?: any;
  createdAt?: string | null;
  updatedAt?: string | null;
};

function getStringArray(input: unknown): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(String).filter(Boolean);
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
      } catch {
        return [];
      }
    }
    return trimmed
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function getMediaUrl(val: unknown): string | null {
  if (!val) return null;
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    const obj = val as any;
    if (typeof obj.url === "string") return obj.url;
    if (typeof obj.publicUrl === "string") return obj.publicUrl;
    if (typeof obj.src === "string") return obj.src;
    if (typeof obj.path === "string") return obj.path;
    if (typeof obj.location === "string") return obj.location;
  }
  return null;
}

function normalizeUserList(data: any): { items: CaseStudy[]; total: number; pages: number } {
  const items = Array.isArray(data)
    ? data
    : data?.items || data?.caseStudies || data?.data || data?.rows || [];

  const total =
    (typeof data?.total === "number" && data.total) ||
    (typeof data?.count === "number" && data.count) ||
    (typeof data?.pagination?.total === "number" && data.pagination.total) ||
    items.length;

  const pages =
    (typeof data?.pages === "number" && data.pages) ||
    (typeof data?.pagination?.pages === "number" && data.pagination.pages) ||
    1;

  return { items, total, pages };
}

function FullWidthMediaGrid({
  images,
  onImageClick,
}: {
  images: string[];
  onImageClick?: (url: string) => void;
}) {
  const mediaCount = images.length;

  if (mediaCount === 0) return null;

  const renderMedia = (url: string, className: string, isLast?: boolean, count?: number) => {
    return (
      <div 
        key={url} 
        className={cn("relative group overflow-hidden cursor-pointer bg-[#f3f4f6]", className)}
        onClick={() => onImageClick?.(url)}
      >
        <img src={url} alt="" className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105" loading="lazy" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <Maximize2 className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        {isLast && count && count > 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
            <span className="text-white text-3xl font-black">+{count}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full bg-[#f8f9fc] border-y border-[#e4e5ea]">
      {mediaCount === 1 && (
        <div className="h-[400px] sm:h-[600px]">
          {renderMedia(images[0], "h-full w-full")}
        </div>
      )}

      {mediaCount === 2 && (
        <div className="grid grid-cols-2 gap-[2px] h-[300px] sm:h-[500px]">
          {images.map((m) => renderMedia(m, "h-full w-full"))}
        </div>
      )}

      {mediaCount === 3 && (
        <div className="grid grid-cols-12 gap-[2px] h-[400px] sm:h-[600px]">
          <div className="col-span-8 h-full">
            {renderMedia(images[0], "h-full w-full")}
          </div>
          <div className="col-span-4 grid grid-rows-2 gap-[2px] h-full">
            {images.slice(1, 3).map((m) => renderMedia(m, "h-full w-full"))}
          </div>
        </div>
      )}

      {mediaCount === 4 && (
        <div className="grid grid-cols-2 grid-rows-2 gap-[2px] h-[400px] sm:h-[600px]">
          {images.map((m) => renderMedia(m, "h-full w-full"))}
        </div>
      )}

      {mediaCount >= 5 && (
        <div className="grid grid-cols-12 grid-rows-2 gap-[2px] h-[400px] sm:h-[600px]">
          <div className="col-span-8 row-span-2 h-full">
            {renderMedia(images[0], "h-full w-full")}
          </div>
          <div className="col-span-4 h-full">
            {renderMedia(images[1], "h-full w-full")}
          </div>
          <div className="col-span-4 h-full">
            {renderMedia(images[2], "h-full w-full", mediaCount > 3, mediaCount - 3)}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CaseStudiesPage() {
  const limit = 10;
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["case-studies", limit],
    queryFn: async ({ pageParam = 1 }) => {
      const resp = await apiGet<any>(`/api/case-studies?page=${pageParam}&limit=${limit}`);
      return normalizeUserList(resp);
    },
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = allPages.length + 1;
      return nextPage <= lastPage.pages ? nextPage : undefined;
    },
    initialPageParam: 1,
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const activeItems = useMemo(() => {
    const items = data?.pages.flatMap((p) => p.items) ?? [];
    return items
      .filter((cs) => {
        const status = cs.status ? String(cs.status).toUpperCase() : cs.isActive ? "ACTIVE" : "INACTIVE";
        return status === "ACTIVE";
      })
      .sort((a, b) => Number(a.displayOrder ?? 0) - Number(b.displayOrder ?? 0));
  }, [data]);

  return (
    <main className="min-h-screen bg-[#fcfcfd] text-[#1f2230]">
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>

      <section className="px-4 py-12 sm:py-24">
        <div className="max-w-4xl mx-auto space-y-20">
          <div className="flex flex-col gap-3 text-center sm:text-left border-l-4 border-accent pl-6 py-2">
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-[#1c2231]">
              Execution <span className="text-accent underline decoration-accent/10 underline-offset-8">Insight</span>
            </h1>
            <p className="text-[#6b7280] text-sm sm:text-lg max-w-2xl font-bold tracking-tight mt-2 italic opacity-80">
              Transforming complex campaigns into predictable, high-performance production cycles.
            </p>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6 text-[#4c4f5e]">
              <Loader2 className="h-12 w-12 animate-spin text-accent" />
              <p className="font-black tracking-[0.4em] uppercase text-[10px]">Assembling Visual Intelligence</p>
            </div>
          ) : activeItems.length === 0 ? (
            <div className="rounded-[3rem] border border-[#e4e5ea] bg-white p-20 text-center shadow-2xl shadow-indigo-500/5">
              <div className="text-[#1c2231] font-black text-2xl">The feed is currently silent</div>
              <div className="text-[#6b7280] text-base mt-2 max-w-sm mx-auto font-medium">
                Our latest production narratives are being processed and will appear here shortly.
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-24 sm:gap-40">
              {activeItems.map((cs) => {
                const logoUrl = cs.logoUrl || getMediaUrl(cs.logo);
                const imageUrls = Array.isArray(cs.images)
                  ? cs.images.map(getMediaUrl).filter(Boolean) as string[]
                  : [];
                const videoUrl = cs.videoUrl || getMediaUrl(cs.video);
                const services = getStringArray(cs.services);
                const structureItems = getStringArray(cs.structureItems);

                return (
                  <Card
                    key={cs.id}
                    className="group border-none bg-transparent rounded-none overflow-visible shadow-none relative"
                  >
                    <CardHeader className="p-0 mb-8 sm:mb-12">
                      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 border-b-2 border-[#f0f2f8] pb-8">
                        <div className="flex items-center gap-6">
                          <div className="h-20 w-20 rounded-[2rem] border-2 border-[#e4e5ea] bg-white overflow-hidden flex items-center justify-center shrink-0 shadow-lg group-hover:border-accent transition-colors duration-500">
                            {logoUrl ? (
                              <img src={logoUrl} alt="" className="h-full w-full object-cover scale-110" loading="lazy" />
                            ) : (
                              <ImageIcon className="h-7 w-7 text-[#9ca3af]" />
                            )}
                          </div>
                          <div>
                             <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-[#1c2231] font-black text-2xl sm:text-4xl tracking-tighter leading-none">
                                  {cs.title || "Project Alpha"}
                                </h2>
                                {typeof cs.displayOrder === "number" && (
                                  <span className="text-accent/40 font-black text-3xl sm:text-5xl italic tracking-tighter leading-none ml-2">
                                    0{cs.displayOrder}
                                  </span>
                                )}
                             </div>
                            {cs.location && (
                              <div className="text-xs text-[#9ca3af] font-black flex items-center gap-2 uppercase tracking-[0.2em] mt-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                                {cs.location}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-0 space-y-12 sm:space-y-16">
                      
                      {/* 1. NARRATIVE SECTION */}
                      <div className="space-y-6 px-2 sm:px-0">
                        <div className="flex items-center gap-4 text-accent">
                            <div className="h-px w-10 bg-accent" />
                            <div className="text-[10px] font-black tracking-[0.5em] uppercase">Executive Narrative</div>
                        </div>
                        <p className="text-[#1c2231] text-xl sm:text-4xl leading-[1.2] font-black tracking-tight max-w-[90%]">
                          {cs.tagline || "Engineered for high-frequency execution and strategic brand expansion."}
                        </p>
                      </div>

                      {/* 2. INTEL GRID */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 sm:gap-20 px-2 sm:px-0">
                         {/* Services */}
                         <div className="lg:col-span-4 space-y-6">
                             <div className="text-[10px] text-[#9ca3af] font-black tracking-[0.3em] uppercase opacity-60">Services Integrated</div>
                             <div className="flex flex-wrap gap-2">
                                {services.length === 0 ? (
                                    <div className="text-sm font-bold opacity-30 italic">Syncing Intel...</div>
                                ) : (
                                    services.map((s, idx) => (
                                    <span
                                        key={`${s}-${idx}`}
                                        className="px-4 py-2 rounded-xl bg-[#f0f2f8] text-[#1c2231] text-[10px] font-black tracking-[0.1em] uppercase border border-[#e4e5ea]"
                                    >
                                        {s}
                                    </span>
                                    ))
                                )}
                            </div>
                         </div>

                         {/* Pipeline */}
                         <div className="lg:col-span-8 space-y-6">
                            <div className="text-[10px] text-[#9ca3af] font-black tracking-[0.3em] uppercase opacity-60">Production Pipeline</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                                {structureItems.length === 0 ? (
                                <div className="text-sm font-bold opacity-30 italic">Building Architecture...</div>
                                ) : (
                                structureItems.map((it, idx) => (
                                    <div key={`${it}-${idx}`} className="flex items-start gap-4 border-l border-[#e4e5ea] pl-6 py-1">
                                        <span className="text-accent font-black text-xs">0{idx + 1}</span>
                                        <div className="text-sm sm:text-base text-[#363a49] font-bold leading-tight">
                                            {it}
                                        </div>
                                    </div>
                                ))
                                )}
                            </div>
                         </div>
                      </div>

                      {/* 3. FULL WIDTH IMAGE GRID */}
                      {imageUrls.length > 0 && (
                        <div className="space-y-4">
                            <div className="text-[10px] text-[#9ca3af] font-black tracking-[0.3em] uppercase flex items-center gap-4 px-2 sm:px-0">
                              <span className="shrink-0">Production Assets</span>
                              <div className="h-px w-full bg-[#f0f2f8]" />
                            </div>
                            <FullWidthMediaGrid images={imageUrls} onImageClick={setLightboxImage} />
                        </div>
                      )}

                      {/* 4. VIDEO PLAYER - CINEMATIC SCALE */}
                      {videoUrl && (
                        <div className="space-y-6 px-2 sm:px-0">
                          <div className="flex items-center gap-4 text-accent">
                            <div className="h-px w-10 bg-accent" />
                            <div className="text-[10px] font-black tracking-[0.5em] uppercase">Core Sync</div>
                          </div>
                          <div className="rounded-[2.5rem] sm:rounded-[4rem] overflow-hidden border-4 border-[#f0f2f8] bg-black shadow-2xl aspect-video relative group transition-all duration-500 hover:border-accent/20">
                            <video src={videoUrl} controls playsInline className="w-full h-full object-contain" />
                          </div>
                        </div>
                      )}

                      {/* 5. FOOTER SYNC */}
                      <div className="pt-12 border-t border-[#f0f2f8] flex items-center justify-between px-2 sm:px-0">
                         <div className="text-[10px] text-[#9ca3af] font-black tracking-[0.4em] uppercase opacity-50">
                            Execution Ref: {cs.updatedAt ? dayjs(cs.updatedAt).format("YYYY-MM-DD") : "SYNC_PENDING"}
                         </div>
                         <div className="flex items-center gap-4">
                           <span className="text-[9px] text-[#9ca3af] font-black tracking-[0.3em] uppercase">Authenticity Verified</span>
                           <div className="h-4 w-4 rounded-full border border-accent/30 flex items-center justify-center">
                              <div className="h-1.5 w-1.5 rounded-full bg-accent animate-ping" />
                           </div>
                         </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <div 
            ref={loadMoreRef} 
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-accent" />
                <p className="text-[10px] font-black tracking-[0.5em] uppercase text-[#4c4f5e]">Next Narrative Syncing</p>
              </>
            ) : hasNextPage ? (
              <p className="text-[10px] text-[#9ca3af] font-black tracking-[0.5em] uppercase opacity-40">Reveal Further Insights</p>
            ) : activeItems.length > 0 ? (
              <div className="flex flex-col items-center gap-8 w-full opacity-20 px-10">
                <div className="h-20 w-px bg-gradient-to-b from-[#e4e5ea] to-transparent" />
                <p className="text-[10px] text-[#9ca3af] font-black tracking-[0.6em] uppercase whitespace-nowrap">Narrative Stream Concluded</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Lightbox for full image viewing */}
      <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-transparent border-none overflow-hidden flex items-center justify-center">
          {lightboxImage && (
            <div className="relative w-full h-full flex items-center justify-center p-4">
               <button 
                onClick={() => setLightboxImage(null)}
                className="absolute top-4 right-4 z-50 p-3 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
               >
                 <X className="h-6 w-6" />
               </button>
               <img 
                src={lightboxImage} 
                alt="Full preview" 
                className="w-full h-full object-contain rounded-2xl shadow-2xl" 
               />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <FooterSecondary />
    </main>
  );
}
