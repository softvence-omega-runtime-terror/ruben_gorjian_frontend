"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import dayjs from "dayjs";
import {
  Plus,
  MoreHorizontal,
  Loader2,
  Power,
  PowerOff,
  Trash2,
  Pencil,
  Image as ImageIcon,
  Video as VideoIcon,
} from "lucide-react";
import { apiDelete, apiGet, apiPatch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

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

type CaseStudyListResult = {
  items: CaseStudy[];
  page: number;
  limit: number;
  total: number;
  pages: number;
};

function getStringArray(input: unknown): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(String).filter(Boolean);
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
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

function normalizeAdminList(data: any, page: number, limit: number): CaseStudyListResult {
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
    Math.max(1, Math.ceil(total / limit));

  const resolvedPage =
    (typeof data?.page === "number" && data.page) ||
    (typeof data?.pagination?.page === "number" && data.pagination.page) ||
    page;

  const resolvedLimit =
    (typeof data?.limit === "number" && data.limit) ||
    (typeof data?.pagination?.limit === "number" && data.pagination.limit) ||
    limit;

  return {
    items,
    page: resolvedPage,
    limit: resolvedLimit,
    total,
    pages,
  };
}

function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const next = raw.trim();
    if (!next) return;
    const normalized = next.replace(/\s+/g, " ");
    const exists = value.some((v) => v.toLowerCase() === normalized.toLowerCase());
    if (exists) return;
    onChange([...value, normalized]);
  };

  const remove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
      <div className="flex flex-wrap gap-2">
        {value.map((t, idx) => (
          <button
            type="button"
            key={`${t}-${idx}`}
            onClick={() => remove(idx)}
            className="px-2 py-1 rounded-full bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
            title="Remove"
          >
            {t}
          </button>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
              setDraft("");
            }
            if (e.key === "Backspace" && !draft && value.length > 0) {
              remove(value.length - 1);
            }
          }}
          placeholder={placeholder}
          className="flex-1 min-w-[180px] bg-transparent outline-none text-sm text-slate-200 placeholder:text-slate-600"
        />
      </div>
      <div className="mt-2 text-[10px] text-slate-600 font-semibold uppercase tracking-widest">
        Press Enter to add, click tag to remove
      </div>
    </div>
  );
}

type CaseStudyFormValues = {
  logo: FileList | null;
  title: string;
  location: string;
  displayOrder: number;
  cycleTitle: string;
  services: string[];
  tagline: string;
  structureTitle: string;
  structureItems: string[];
  images: FileList | null;
  videoTitle: string;
  video: FileList | null;
  isActive: boolean;
};

function buildCaseStudyFormData(values: CaseStudyFormValues) {
  const fd = new FormData();
  if (values.logo && values.logo[0]) fd.append("logo", values.logo[0]);
  fd.append("title", values.title);
  if (values.location) fd.append("location", values.location);
  fd.append("displayOrder", String(values.displayOrder ?? 0));
  if (values.cycleTitle) fd.append("cycleTitle", values.cycleTitle);
  fd.append("services", JSON.stringify(values.services ?? []));
  if (values.tagline) fd.append("tagline", values.tagline);
  if (values.structureTitle) fd.append("structureTitle", values.structureTitle);
  fd.append("structureItems", JSON.stringify(values.structureItems ?? []));
  if (values.videoTitle) fd.append("videoTitle", values.videoTitle);
  if (values.video && values.video[0]) fd.append("video", values.video[0]);
  if (values.images && values.images.length > 0) {
    Array.from(values.images).forEach((file) => fd.append("images", file));
  }
  fd.append("isActive", values.isActive ? "true" : "false");
  return fd;
}

export default function AdminCaseStudiesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const limit = 10;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CaseStudy | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CaseStudy | null>(null);

  const form = useForm<CaseStudyFormValues>({
    defaultValues: {
      logo: null,
      title: "",
      location: "",
      displayOrder: 0,
      cycleTitle: "",
      services: [],
      tagline: "",
      structureTitle: "",
      structureItems: [],
      images: null,
      videoTitle: "",
      video: null,
      isActive: true,
    },
  });

  const listQuery = useQuery({
    queryKey: ["admin-case-studies", page, limit],
    queryFn: async () => {
      const data = await apiGet<any>(`/api/case-studies/admin?page=${page}&limit=${limit}`);
      return normalizeAdminList(data, page, limit);
    },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({
      logo: null,
      title: "",
      location: "",
      displayOrder: 0,
      cycleTitle: "",
      services: [],
      tagline: "",
      structureTitle: "",
      structureItems: [],
      images: null,
      videoTitle: "",
      video: null,
      isActive: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (cs: CaseStudy) => {
    setEditing(cs);
    form.reset({
      logo: null,
      title: String(cs.title ?? ""),
      location: String(cs.location ?? ""),
      displayOrder: Number(cs.displayOrder ?? 0),
      cycleTitle: String(cs.cycleTitle ?? ""),
      services: getStringArray(cs.services),
      tagline: String(cs.tagline ?? ""),
      structureTitle: String(cs.structureTitle ?? ""),
      structureItems: getStringArray(cs.structureItems),
      images: null,
      videoTitle: String(cs.videoTitle ?? ""),
      video: null,
      isActive: cs.status
        ? String(cs.status).toUpperCase() === "ACTIVE"
        : Boolean(cs.isActive ?? true),
    });
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (values: CaseStudyFormValues) => {
      if (values.video && values.video.length > 1) {
        throw new Error("Only one video is allowed.");
      }

      const fd = buildCaseStudyFormData(values);
      const url = editing ? `/api/case-studies/${editing.id}` : "/api/case-studies";
      const method = editing ? "PATCH" : "POST";

      const res = await fetch(url, { method, credentials: "include", body: fd });
      const contentType = res.headers.get("content-type") || "";
      const payload = contentType.includes("application/json")
        ? await res.json().catch(() => null)
        : await res.text().catch(() => null);

      if (!res.ok) {
        const obj = payload && typeof payload === "object" ? (payload as any) : null;
        const message =
          (obj && (obj.error || obj.message) && String(obj.error || obj.message)) ||
          (typeof payload === "string" && payload) ||
          "Request failed";
        throw new Error(message);
      }
      return payload;
    },
    onSuccess: () => {
      toast({
        title: editing ? "Case study updated" : "Case study created",
      });
      setDialogOpen(false);
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["admin-case-studies"] });
    },
    onError: (err: any) => {
      toast({
        title: "Save failed",
        description: err.message || "Unable to save case study.",
        variant: "destructive",
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (payload: { id: string; status: "ACTIVE" | "INACTIVE" }) =>
      apiPatch<any, { status: "ACTIVE" | "INACTIVE" }>(`/api/case-studies/${payload.id}/status`, {
        status: payload.status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-case-studies"] });
    },
    onError: (err: any) => {
      toast({
        title: "Status update failed",
        description: err.message || "Unable to update status.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiDelete<any>(`/api/case-studies/${id}`),
    onSuccess: () => {
      toast({ title: "Case study deleted" });
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-case-studies"] });
    },
    onError: (err: any) => {
      toast({
        title: "Delete failed",
        description: err.message || "Unable to delete case study.",
        variant: "destructive",
      });
    },
  });

  const items = listQuery.data?.items ?? [];

  const totals = useMemo(() => {
    const total = listQuery.data?.total ?? items.length;
    const pages = listQuery.data?.pages ?? 1;
    return { total, pages };
  }, [items.length, listQuery.data?.pages, listQuery.data?.total]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Case Studies</h1>
          <p className="text-sm text-slate-400">
            Create, update, activate/inactivate and delete case studies.
          </p>
        </div>
        <Button 
          onClick={openCreate} 
          className="bg-lime-400 hover:bg-lime-300 text-slate-950 font-black gap-2 px-8 py-6 rounded-2xl shadow-[0_15px_30px_rgba(163,230,53,0.3)] transition-all hover:scale-105 active:scale-95 text-base"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Case Study
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="text-sm text-slate-300 font-semibold">
            Total: <span className="text-white">{totals.total}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </Button>
            <div className="text-xs text-slate-500 font-semibold">
              Page <span className="text-slate-200">{page}</span> /{" "}
              <span className="text-slate-200">{totals.pages}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700"
              disabled={page >= totals.pages}
              onClick={() => setPage((p) => Math.min(totals.pages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>

        {listQuery.isLoading ? (
          <div className="p-10 flex items-center justify-center gap-3 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading case studies...
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800">
                <TableHead className="text-slate-400">Title</TableHead>
                <TableHead className="text-slate-400 hidden md:table-cell">Location</TableHead>
                <TableHead className="text-slate-400 hidden lg:table-cell">Order</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400 hidden sm:table-cell">Media</TableHead>
                <TableHead className="text-slate-400 hidden xl:table-cell">Updated</TableHead>
                <TableHead className="text-slate-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow className="border-slate-800">
                  <TableCell colSpan={7} className="py-10 text-center text-slate-500">
                    No case studies found.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((cs) => {
                  const status = cs.status
                    ? String(cs.status).toUpperCase()
                    : cs.isActive
                      ? "ACTIVE"
                      : "INACTIVE";
                  const logoUrl = cs.logoUrl || getMediaUrl(cs.logo);
                  const imageCount = Array.isArray(cs.images) ? cs.images.length : 0;
                  const hasVideo = Boolean(cs.videoUrl || getMediaUrl(cs.video));

                  return (
                    <TableRow key={cs.id} className="border-slate-800">
                      <TableCell className="text-slate-200">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl border border-slate-800 bg-slate-800/40 overflow-hidden flex items-center justify-center">
                            {logoUrl ? (
                              <img src={logoUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <ImageIcon className="h-4 w-4 text-slate-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-white truncate">
                              {cs.title || "Untitled"}
                            </div>
                            <div className="text-xs text-slate-500 truncate">
                              {cs.tagline || cs.cycleTitle || ""}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-400 hidden md:table-cell">
                        {cs.location || "—"}
                      </TableCell>
                      <TableCell className="text-slate-400 hidden lg:table-cell">
                        {typeof cs.displayOrder === "number" ? cs.displayOrder : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "rounded-full",
                            status === "ACTIVE"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-rose-500/10 text-rose-300 border border-rose-500/20",
                          )}
                        >
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <ImageIcon className="h-4 w-4" /> {imageCount}
                          </span>
                          <span className={cn("inline-flex items-center gap-1", !hasVideo && "opacity-40")}>
                            <VideoIcon className="h-4 w-4" /> {hasVideo ? "1" : "0"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-400 hidden xl:table-cell">
                        {cs.updatedAt ? dayjs(cs.updatedAt).format("MMM D, YYYY") : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                              <MoreHorizontal className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openEdit(cs)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                statusMutation.mutate({
                                  id: cs.id,
                                  status: status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                                })
                              }
                            >
                              {status === "ACTIVE" ? (
                                <>
                                  <PowerOff className="h-4 w-4 mr-2" />
                                  Inactivate
                                </>
                              ) : (
                                <>
                                  <Power className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-rose-400 focus:text-rose-300"
                              onClick={() => setDeleteTarget(cs)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => !saveMutation.isPending && setDialogOpen(o)}>
        <DialogContent className="max-w-3xl bg-slate-950 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editing ? "Update Case Study" : "Create Case Study"}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
            className="space-y-5"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-slate-300">Logo</Label>
                <Input
                  type="file"
                  accept="image/*"
                  {...form.register("logo")}
                  className="bg-slate-900 border-slate-800 text-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Title</Label>
                <Input
                  placeholder="Case study title"
                  {...form.register("title", { required: true })}
                  className="bg-slate-900 border-slate-800 text-slate-200"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Location</Label>
                <Input
                  placeholder="Dhaka, Bangladesh"
                  {...form.register("location")}
                  className="bg-slate-900 border-slate-800 text-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Display Order</Label>
                <Input
                  type="number"
                  {...form.register("displayOrder", { valueAsNumber: true })}
                  className="bg-slate-900 border-slate-800 text-slate-200"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-300">Cycle Title</Label>
                <Input
                  placeholder="Production Cycle"
                  {...form.register("cycleTitle")}
                  className="bg-slate-900 border-slate-800 text-slate-200"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-300">Services</Label>
                <Controller
                  control={form.control}
                  name="services"
                  render={({ field }) => (
                    <TagInput
                      value={field.value || []}
                      onChange={field.onChange}
                      placeholder='Type a service, press Enter (e.g. "Creative Direction")'
                    />
                  )}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-300">Tagline</Label>
                <Textarea
                  rows={2}
                  placeholder="Short summary"
                  {...form.register("tagline")}
                  className="bg-slate-900 border-slate-800 text-slate-200"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-300">Structure Title</Label>
                <Input
                  placeholder="Production Structure"
                  {...form.register("structureTitle")}
                  className="bg-slate-900 border-slate-800 text-slate-200"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-300">Structure Items</Label>
                <Controller
                  control={form.control}
                  name="structureItems"
                  render={({ field }) => (
                    <TagInput
                      value={field.value || []}
                      onChange={field.onChange}
                      placeholder='Type an item, press Enter (e.g. "Planning")'
                    />
                  )}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-300">Images (multiple)</Label>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  {...form.register("images")}
                  className="bg-slate-900 border-slate-800 text-slate-200"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Video Title</Label>
                <Input
                  placeholder="Campaign Walkthrough"
                  {...form.register("videoTitle")}
                  className="bg-slate-900 border-slate-800 text-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Video (only one)</Label>
                <Input
                  type="file"
                  accept="video/*"
                  {...form.register("video")}
                  className="bg-slate-900 border-slate-800 text-slate-200"
                />
              </div>

              <div className="flex items-center gap-3 md:col-span-2 pt-1">
                <Checkbox
                  checked={form.watch("isActive")}
                  onCheckedChange={(v) => form.setValue("isActive", Boolean(v))}
                />
                <div className="text-sm text-slate-300 font-semibold">
                  Active (show on landing page)
                </div>
              </div>
            </div>

            <DialogFooter className="gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                className="border-slate-800 bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:text-white font-black px-8 py-6 rounded-2xl transition-all hover:scale-105 active:scale-95 text-base"
                onClick={() => setDialogOpen(false)}
                disabled={saveMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-lime-400 hover:bg-lime-300 text-slate-950 font-black gap-2 px-8 py-6 rounded-2xl shadow-[0_15px_30px_rgba(163,230,53,0.3)] transition-all hover:scale-105 active:scale-95 text-base"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </span>
                ) : editing ? (
                  "Update Case Study"
                ) : (
                  "Create Case Study"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-md bg-slate-950 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">Delete case study?</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-slate-400">
            This action cannot be undone. {deleteTarget?.title ? `“${deleteTarget.title}”` : ""}
          </div>
          <DialogFooter className="gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              className="border-slate-800 bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:text-white font-black px-8 py-6 rounded-2xl transition-all hover:scale-105 active:scale-95 text-base"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-rose-600 hover:bg-rose-500 text-white font-black px-8 py-6 rounded-2xl shadow-[0_15px_30px_rgba(225,29,72,0.3)] transition-all hover:scale-105 active:scale-95 text-base"
              disabled={deleteMutation.isPending || !deleteTarget?.id}
              onClick={() => deleteTarget?.id && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </span>
              ) : (
                "Delete Study"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
