"use client";

import { useState } from "react";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MultiSelect } from "@/components/ui/multi-select";
import { Calendar, Clock, Image as ImageIcon, Trash2, Upload, FileSpreadsheet } from "lucide-react";

type ConnectedPlatform = {
  id: string;
  platform: "INSTAGRAM" | "FACEBOOK" | "LINKEDIN";
  displayName: string | null;
  externalAccountId: string;
  isExpired: boolean;
  lastUpdated: string;
};

type UserAsset = {
  id: string;
  type: "IMAGE" | "VIDEO";
  kind: string;
  storageKey: string;
  contentType: string | null;
  source: "USER_UPLOAD" | "ADMIN_UPLOAD";
  uploadedByAdminId: string | null;
  createdAt: string;
  url: string | null;
};

type AdminPost = {
  id: string;
  caption: string | null;
  hashtags: string[] | null;
  status: string;
  scheduledFor: string | null;
  adminId: string | null;
  adminReason: string | null;
  createdAt: string;
  updatedAt: string;
  admin: {
    id: string;
    email: string;
    name: string | null;
  } | null;
  targets: Array<{
    id: string;
    platform: string;
    status: string;
    publishedAt: string | null;
    externalPostId: string | null;
    errorMessage: string | null;
    socialAccount: {
      id: string;
      displayName: string | null;
    } | null;
  }>;
  PostAsset: Array<{
    Asset: {
      id: string;
      type: string;
      storageKey: string;
    };
  }>;
};

type ImportedSheetRow = {
  rowNumber: number;
  imageSku: string;
  productSkuLink: string | null;
  postId: string;
  caption1: string;
  caption2: string;
  caption3: string;
  hashtags: string;
  notes: string | null;
};

interface AdminPostComposerProps {
  userId: string;
  userName: string | null;
  userEmail: string;
}

export function AdminPostComposer({ userId, userName, userEmail }: AdminPostComposerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [reason, setReason] = useState("");
  const [publishMode, setPublishMode] = useState<"NOW" | "SCHEDULE">("NOW");
  const [scheduledFor, setScheduledFor] = useState("");
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [selectedUserMediaIds, setSelectedUserMediaIds] = useState<string[]>([]);
  const [adminUploadedMediaIds, setAdminUploadedMediaIds] = useState<string[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [googleSheetLink, setGoogleSheetLink] = useState("");
  const [importedRows, setImportedRows] = useState<ImportedSheetRow[]>([]);
  const [selectedImportedRowIndex, setSelectedImportedRowIndex] = useState<number>(0);
  const [selectedCaptionVariant, setSelectedCaptionVariant] = useState<1 | 2 | 3>(1);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Query connected platforms
  const platformsQuery = useQuery({
    queryKey: ["admin", "users", userId, "connected-platforms"],
    queryFn: () =>
      apiGet<{ items: ConnectedPlatform[]; count: number }>(
        `/api/admin/users/${userId}/connected-platforms`
      ),
  });

  // Query ALL user media (for dropdown)
  const userMediaQuery = useQuery({
    queryKey: ["admin", "users", userId, "user-media"],
    queryFn: async () => {
      console.log("[AdminPostComposer] Fetching user media for userId:", userId);
      const result = await apiGet<{ items: UserAsset[]; page: number; pageSize: number; total: number }>(
        `/api/admin/users/${userId}/media?source=USER_UPLOAD&pageSize=100`
      );
      console.log("[AdminPostComposer] User media fetched:", {
        total: result.total,
        itemsCount: result.items.length,
        items: result.items,
      });
      return result;
    },
  });

  // Query admin-uploaded media (for preview cards)
  const adminMediaQuery = useQuery({
    queryKey: ["admin", "users", userId, "admin-media"],
    queryFn: () =>
      apiGet<{ items: UserAsset[]; page: number; pageSize: number; total: number }>(
        `/api/admin/users/${userId}/media?source=ADMIN_UPLOAD&pageSize=50`
      ),
  });

  // Query admin posts
  const adminPostsQuery = useQuery({
    queryKey: ["admin", "users", userId, "admin-posts"],
    queryFn: () =>
      apiGet<{ items: AdminPost[]; page: number; pageSize: number; total: number }>(
        `/api/admin/users/${userId}/posts`
      ),
  });

  // Upload mutation
  const uploadMediaMutation = useMutation({
    mutationFn: async (file: File) => {
      // Step 1: Get signed upload URL
      const urlResponse = await apiPost<{
        mediaId: string;
        uploadUrl: string;
        storageKey: string;
      }>(`/api/admin/users/${userId}/media/upload-url`, {
        filename: file.name,
        mimeType: file.type,
        size: file.size,
      });

      // Step 2: Upload to S3
      if (urlResponse.uploadUrl) {
        await fetch(urlResponse.uploadUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });
      }

      // Step 3: Finalize upload
      await apiPost(`/api/admin/users/${userId}/media/${urlResponse.mediaId}/finalize`, {});

      return urlResponse.mediaId;
    },
    onSuccess: (mediaId) => {
      setAdminUploadedMediaIds((prev) => [...prev, mediaId]);
      queryClient.invalidateQueries({ queryKey: ["admin", "users", userId, "admin-media"] });
    },
    onError: (err: Error) => {
      toast({
        title: "Upload failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMediaMutation = useMutation({
    mutationFn: (mediaId: string) =>
      apiDelete(`/api/admin/users/${userId}/media/${mediaId}`),
    onSuccess: (_, mediaId) => {
      setAdminUploadedMediaIds((prev) => prev.filter((id) => id !== mediaId));
      queryClient.invalidateQueries({ queryKey: ["admin", "users", userId, "admin-media"] });
      toast({ title: "Media deleted" });
    },
    onError: (err: Error) => {
      toast({
        title: "Failed to delete media",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: (data: {
      content: {
        caption: string;
        hashtags?: string[];
      };
      mediaIds?: string[];
      platforms: string[];
      socialAccountIds?: string[];
      publishMode: "NOW" | "SCHEDULE";
      scheduledFor?: string;
      timezone?: string;
      reason: string;
    }) => apiPost(`/api/admin/users/${userId}/posts`, data),
    onSuccess: () => {
      toast({
        title: "Post created successfully",
        description: publishMode === "NOW" ? "Post queued for publishing" : "Post scheduled",
      });
      // Reset form
      setCaption("");
      setHashtags("");
      setReason("");
      setSelectedAccountIds([]);
      setSelectedUserMediaIds([]);
      setAdminUploadedMediaIds([]);
      setScheduledFor("");
      setShowConfirmDialog(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "users", userId, "admin-posts"] });
    },
    onError: (err: Error) => {
      toast({
        title: "Failed to create post",
        description: err.message,
        variant: "destructive",
      });
      setShowConfirmDialog(false);
    },
  });

  const importGoogleSheetMutation = useMutation({
    mutationFn: (data: { sheetUrl: string }) =>
      apiPost<{ success: boolean; totalRows: number; rows: ImportedSheetRow[] }>(
        `/api/admin/users/${userId}/posts/import-google-sheet`,
        data
      ),
    onSuccess: (result) => {
      setImportedRows(result.rows || []);
      setSelectedImportedRowIndex(0);
      setSelectedCaptionVariant(1);
      setImportError(null);
      setImportFeedback(`Imported ${result.totalRows} row(s) successfully.`);
      toast({
        title: "Google Sheet imported",
        description: `${result.totalRows} row(s) ready for selection`,
      });
    },
    onError: (err: Error) => {
      setImportFeedback(null);
      setImportError(err.message);
      toast({
        title: "Import failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const platforms = platformsQuery.data?.items || [];
  const userMedia = userMediaQuery.data?.items || [];
  const adminMedia = adminMediaQuery.data?.items || [];
  const adminPosts = adminPostsQuery.data?.items || [];

  const normalizeMediaMatch = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/i, "");

  const findMediaIdsByImageSku = (imageSku: string) => {
    if (!imageSku.trim()) return [];
    const target = normalizeMediaMatch(imageSku);
    const allMedia = [...userMedia, ...adminMedia];
    return allMedia
      .filter((asset) => normalizeMediaMatch(asset.storageKey).includes(target))
      .map((asset) => asset.id);
  };

  const applyImportedRow = (row: ImportedSheetRow, variant: 1 | 2 | 3) => {
    const variantCaption =
      variant === 1 ? row.caption1 : variant === 2 ? row.caption2 : row.caption3;
    setCaption(variantCaption || row.caption1 || row.caption2 || row.caption3 || "");
    setHashtags(row.hashtags || "");

    const matchedMediaIds = findMediaIdsByImageSku(row.imageSku);
    if (matchedMediaIds.length > 0) {
      const userIds = new Set(userMedia.map((asset) => asset.id));
      const adminIds = new Set(adminMedia.map((asset) => asset.id));
      setSelectedUserMediaIds(matchedMediaIds.filter((id) => userIds.has(id)));
      setAdminUploadedMediaIds(matchedMediaIds.filter((id) => adminIds.has(id)));
    }

    if (!reason.trim()) {
      const reasonParts = [
        row.postId ? `Imported via Google Sheet (PostID: ${row.postId})` : "Imported via Google Sheet",
        row.notes ? `Notes: ${row.notes}` : "",
      ].filter(Boolean);
      setReason(reasonParts.join(" | "));
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    setUploadingFiles(fileArray.map((f) => f.name));

    for (const file of fileArray) {
      await uploadMediaMutation.mutateAsync(file);
    }

    setUploadingFiles([]);
    e.target.value = "";
  };

  const handleImportGoogleSheet = () => {
    if (!googleSheetLink.trim()) {
      setImportFeedback(null);
      setImportError("Please paste a Google Sheet link.");
      toast({ title: "Please paste a Google Sheet link", variant: "destructive" });
      return;
    }
    setImportError(null);
    setImportFeedback(null);
    importGoogleSheetMutation.mutate({ sheetUrl: googleSheetLink.trim() });
  };

  const handleDeleteAdminMedia = (mediaId: string) => {
    if (confirm("Delete this media? This will remove it from the user's library permanently.")) {
      deleteMediaMutation.mutate(mediaId);
    }
  };

  const handleSubmit = () => {
    // Validation
    if (!caption.trim()) {
      toast({ title: "Caption is required", variant: "destructive" });
      return;
    }
    if (selectedAccountIds.length === 0) {
      toast({ title: "Select at least one platform", variant: "destructive" });
      return;
    }
    if (!reason.trim()) {
      toast({ title: "Reason is required", variant: "destructive" });
      return;
    }
    if (publishMode === "SCHEDULE" && !scheduledFor) {
      toast({ title: "Scheduled date/time is required", variant: "destructive" });
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirm = () => {
    const selectedPlatforms = Array.from(
      new Set(platforms.filter((p) => selectedAccountIds.includes(p.id)).map((p) => p.platform))
    );
    const hashtagArray = hashtags
      .split(/[\s,]+/)
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    // Combine user-selected media + admin-uploaded media
    const allMediaIds = [...selectedUserMediaIds, ...adminUploadedMediaIds];

    createPostMutation.mutate({
      content: {
        caption: caption.trim(),
        hashtags: hashtagArray.length > 0 ? hashtagArray : undefined,
      },
      mediaIds: allMediaIds.length > 0 ? allMediaIds : undefined,
      platforms: selectedPlatforms,
      socialAccountIds: selectedAccountIds,
      publishMode,
      scheduledFor:
        publishMode === "SCHEDULE" && scheduledFor
          ? new Date(scheduledFor).toISOString()
          : undefined,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      reason: reason.trim(),
    });
  };

  const toggleAccount = (accountId: string) => {
    setSelectedAccountIds((prev) =>
      prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId]
    );
  };

  const getPlatformBadgeColor = (platform: string) => {
    switch (platform) {
      case "INSTAGRAM":
        return "bg-pink-600";
      case "FACEBOOK":
        return "bg-blue-600";
      case "LINKEDIN":
        return "bg-sky-700";
      default:
        return "bg-slate-600";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return <Badge variant="outline" className="text-blue-400">Scheduled</Badge>;
      case "POSTED":
        return <Badge variant="outline" className="text-green-400">Posted</Badge>;
      case "FAILED":
        return <Badge variant="outline" className="text-red-400">Failed</Badge>;
      case "PUBLISHING":
        return <Badge variant="outline" className="text-yellow-400">Publishing</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Build options for multi-select
  const userMediaOptions = userMedia.map((asset) => ({
    value: asset.id,
    label: `${asset.type} - ${new Date(asset.createdAt).toLocaleDateString()}`,
    thumbnail: asset.url || undefined,
    badge: asset.type,
  }));

  return (
    <div className="space-y-6">
      {/* Composer Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Post as {userName || userEmail}</span>
            <Badge variant="outline" className="text-yellow-500">Admin Posting</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connected Platforms */}
          <div className="space-y-2">
            <Label>Connected Accounts</Label>
            {platformsQuery.isLoading ? (
              <p className="text-sm text-slate-400">Loading platforms...</p>
            ) : platforms.length === 0 ? (
              <p className="text-sm text-red-400">User has no connected platforms</p>
            ) : (
              <div className="space-y-2">
                {platforms.map((platform) => {
                  const isSelected = selectedAccountIds.includes(platform.id);
                  return (
                    <label
                      key={platform.id}
                      className={`flex items-center gap-3 rounded-md border px-3 py-2 text-sm transition-all ${
                        platform.isExpired
                          ? "border-slate-700 text-slate-500 cursor-not-allowed"
                          : isSelected
                            ? "border-lime-500 bg-slate-800 text-slate-200"
                            : "border-slate-700 text-slate-300 hover:border-slate-600"
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        disabled={platform.isExpired}
                        onCheckedChange={() => toggleAccount(platform.id)}
                      />
                      <Badge className={getPlatformBadgeColor(platform.platform)}>
                        {platform.platform}
                      </Badge>
                      <span className="flex-1 truncate">
                        {platform.displayName || platform.externalAccountId}
                      </span>
                      {platform.isExpired && (
                        <Badge variant="outline" className="text-red-400">
                          Token Expired
                        </Badge>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Caption */}
          <div className="space-y-3 rounded-md border border-slate-700 p-4">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-slate-300" />
              <Label htmlFor="google-sheet-link">Import From Google Sheet</Label>
            </div>
            <div className="flex flex-col gap-2 md:flex-row">
              <Input
                id="google-sheet-link"
                placeholder="Paste Google Sheet share link..."
                value={googleSheetLink}
                onChange={(e) => setGoogleSheetLink(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleImportGoogleSheet}
                disabled={importGoogleSheetMutation.isPending}
              >
                {importGoogleSheetMutation.isPending ? "Importing..." : "Import From Google Sheet"}
              </Button>
            </div>
            <p className="text-xs text-slate-400">
              One-time pull only. No live sync. Expected columns: ImageSKU, Product SKU Link, PostID, Caption1, Caption2, Caption3, Hashtags, Notes.
            </p>
            {importGoogleSheetMutation.isPending && (
              <p className="text-xs text-slate-300">Importing sheet, please wait...</p>
            )}
            {importFeedback && (
              <p className="text-xs text-lime-400">{importFeedback}</p>
            )}
            {importError && (
              <p className="text-xs text-red-400">{importError}</p>
            )}

            {importedRows.length > 0 && (
              <div className="space-y-3 rounded-md border border-slate-700 bg-slate-900/40 p-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm text-slate-300">
                    Imported rows: {importedRows.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="imported-row-select" className="text-xs text-slate-400">Row</Label>
                    <select
                      id="imported-row-select"
                      className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
                      value={selectedImportedRowIndex}
                      onChange={(e) => setSelectedImportedRowIndex(Number(e.target.value))}
                    >
                      {importedRows.map((row, idx) => (
                        <option key={`${row.rowNumber}-${row.postId}`} value={idx}>
                          #{row.rowNumber} {row.postId ? `- ${row.postId}` : ""} {row.imageSku ? `(${row.imageSku})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {importedRows[selectedImportedRowIndex] && (
                  <div className="space-y-3">
                    <div className="grid gap-2 text-xs text-slate-300 md:grid-cols-2">
                      <p><span className="text-slate-400">ImageSKU:</span> {importedRows[selectedImportedRowIndex].imageSku || "—"}</p>
                      <p><span className="text-slate-400">PostID:</span> {importedRows[selectedImportedRowIndex].postId || "—"}</p>
                      <p className="md:col-span-2">
                        <span className="text-slate-400">Product SKU Link:</span> {importedRows[selectedImportedRowIndex].productSkuLink || "—"}
                      </p>
                      <p className="md:col-span-2">
                        <span className="text-slate-400">Notes:</span> {importedRows[selectedImportedRowIndex].notes || "—"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={selectedCaptionVariant === 1 ? "default" : "outline"}
                        onClick={() => setSelectedCaptionVariant(1)}
                      >
                        Caption 1
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={selectedCaptionVariant === 2 ? "default" : "outline"}
                        onClick={() => setSelectedCaptionVariant(2)}
                      >
                        Caption 2
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={selectedCaptionVariant === 3 ? "default" : "outline"}
                        onClick={() => setSelectedCaptionVariant(3)}
                      >
                        Caption 3
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() =>
                          applyImportedRow(
                            importedRows[selectedImportedRowIndex],
                            selectedCaptionVariant
                          )
                        }
                      >
                        Use Selected Row
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="caption">Caption *</Label>
            <Textarea
              id="caption"
              placeholder="Write your post caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={5}
              className="resize-none"
              maxLength={2200}
            />
            <p className="text-xs text-slate-400">{caption.length} / 2200 characters</p>
          </div>

          {/* Hashtags */}
          <div className="space-y-2">
            <Label htmlFor="hashtags">Hashtags (optional)</Label>
            <Input
              id="hashtags"
              placeholder="e.g., #marketing #socialmedia #business"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
            />
            <p className="text-xs text-slate-400">Separate with spaces or commas</p>
          </div>

          {/* USER MEDIA MULTI-SELECT DROPDOWN */}
          <div className="space-y-2">
            <Label>User Media Library (multi-select)</Label>
            {userMediaQuery.isLoading ? (
              <p className="text-sm text-slate-400">Loading user media...</p>
            ) : userMediaQuery.isError ? (
              <p className="text-sm text-red-400">Error loading media: {userMediaQuery.error?.message || "Unknown error"}</p>
            ) : (
              <>
                <MultiSelect
                  options={userMediaOptions}
                  selected={selectedUserMediaIds}
                  onChange={setSelectedUserMediaIds}
                  placeholder={userMedia.length === 0 ? "No user media available" : "Select media from user's library..."}
                  emptyText="No media found"
                  searchPlaceholder="Search media..."
                  disabled={userMedia.length === 0}
                />
                {selectedUserMediaIds.length > 0 && (
                  <p className="text-xs text-slate-400">
                    {selectedUserMediaIds.length} file(s) selected from user library
                  </p>
                )}
                {userMedia.length === 0 && !userMediaQuery.isLoading && (
                  <p className="text-xs text-slate-400">
                    This user has no uploaded media yet. You can upload media below.
                  </p>
                )}
                {userMediaQuery.data && (
                  <p className="text-xs text-slate-500">
                    Total available: {userMediaQuery.data.total} | Showing: {userMedia.length}
                  </p>
                )}
              </>
            )}
          </div>

          {/* ADMIN UPLOAD AREA */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Admin Upload Media</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("admin-media-upload")?.click()}
                disabled={uploadingFiles.length > 0}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploadingFiles.length > 0 ? `Uploading ${uploadingFiles.length}...` : "Upload Media"}
              </Button>
              <input
                id="admin-media-upload"
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                disabled={uploadingFiles.length > 0}
              />
            </div>

            {/* Show uploading files */}
            {uploadingFiles.length > 0 && (
              <div className="space-y-2">
                {uploadingFiles.map((filename) => (
                  <div key={filename} className="flex items-center gap-2 text-sm text-slate-400">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-700 border-t-lime-400"></div>
                    <span>Uploading {filename}...</span>
                  </div>
                ))}
              </div>
            )}

            {/* Show admin-uploaded media */}
            {adminMediaQuery.isLoading ? (
              <p className="text-sm text-slate-400">Loading admin uploads...</p>
            ) : adminMedia.filter((m) => adminUploadedMediaIds.includes(m.id)).length > 0 ? (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {adminMedia
                  .filter((m) => adminUploadedMediaIds.includes(m.id))
                  .map((asset) => (
                    <div
                      key={asset.id}
                      className="relative aspect-square rounded-md overflow-hidden border-2 border-lime-500"
                    >
                      {asset.type === "IMAGE" && asset.url ? (
                        <Image
                          src={asset.url}
                          alt="Admin upload"
                          width={160}
                          height={160}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : asset.type === "VIDEO" && asset.url ? (
                        <video
                          src={asset.url}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-slate-600" />
                        </div>
                      )}
                      <button
                        onClick={() => handleDeleteAdminMedia(asset.id)}
                        className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 rounded-full p-1 transition-colors"
                        title="Delete media"
                      >
                        <Trash2 className="w-3 h-3 text-white" />
                      </button>
                      {asset.type === "VIDEO" && (
                        <div className="absolute bottom-1 left-1 bg-slate-900/80 rounded px-1 py-0.5">
                          <span className="text-xs text-white">VIDEO</span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No admin uploads yet. Upload media to attach to this post.</p>
            )}
          </div>

          {/* Publish Mode */}
          <div className="space-y-2">
            <Label>Publish Mode *</Label>
            <div className="flex gap-4">
              <button
                onClick={() => setPublishMode("NOW")}
                className={`flex-1 px-4 py-3 rounded-md text-sm font-medium transition-all ${
                  publishMode === "NOW"
                    ? "bg-lime-600 text-slate-900"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                <Clock className="w-4 h-4 inline mr-2" />
                Publish Now
              </button>
              <button
                onClick={() => setPublishMode("SCHEDULE")}
                className={`flex-1 px-4 py-3 rounded-md text-sm font-medium transition-all ${
                  publishMode === "SCHEDULE"
                    ? "bg-lime-600 text-slate-900"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Schedule
              </button>
            </div>
          </div>

          {/* Scheduled Date/Time */}
          {publishMode === "SCHEDULE" && (
            <div className="space-y-2">
              <Label htmlFor="scheduledFor">Scheduled Date & Time *</Label>
              <Input
                id="scheduledFor"
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
              />
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for posting (required for audit) *</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Client requested urgent post, covering for user absence, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              maxLength={500}
            />
            <p className="text-xs text-slate-400">{reason.length} / 500 characters</p>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={createPostMutation.isPending || uploadingFiles.length > 0}
            className="w-full"
          >
            {createPostMutation.isPending
              ? "Creating..."
              : uploadingFiles.length > 0
                ? "Wait for upload..."
                : "Create Post"}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Admin Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Admin-Initiated Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {adminPostsQuery.isLoading ? (
            <p className="text-sm text-slate-400">Loading posts...</p>
          ) : adminPosts.length === 0 ? (
            <p className="text-sm text-slate-400">No admin posts yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Caption</TableHead>
                    <TableHead>Platforms</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Scheduled For</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <div className="max-w-xs truncate">{post.caption || "—"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {post.targets.map((target) => (
                            <Badge
                              key={target.id}
                              className={getPlatformBadgeColor(target.platform)}
                            >
                              {target.platform}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(post.status)}</TableCell>
                      <TableCell>
                        {post.scheduledFor
                          ? new Date(post.scheduledFor).toLocaleString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {post.admin?.name || post.admin?.email || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-sm text-slate-400">
                          {post.adminReason || "—"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Post Creation</DialogTitle>
            <DialogDescription>
              You are about to create a post as <strong>{userName || userEmail}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <strong>Platforms:</strong>{" "}
              {platforms
                .filter((p) => selectedAccountIds.includes(p.id))
                .map((p) => p.platform)
                .join(", ")}
            </div>
            <div>
              <strong>Publish Mode:</strong> {publishMode === "NOW" ? "Immediate" : "Scheduled"}
            </div>
            {publishMode === "SCHEDULE" && (
              <div>
                <strong>Scheduled For:</strong>{" "}
                {scheduledFor ? new Date(scheduledFor).toLocaleString() : "—"}
              </div>
            )}
            <div>
              <strong>Media:</strong>{" "}
              {selectedUserMediaIds.length + adminUploadedMediaIds.length} file(s) selected
            </div>
            <div>
              <strong>Caption:</strong>
              <div className="mt-1 p-2 bg-slate-800 rounded text-slate-300 max-h-24 overflow-y-auto">
                {caption}
              </div>
            </div>
            <div>
              <strong>Reason:</strong>
              <div className="mt-1 p-2 bg-slate-800 rounded text-slate-300">{reason}</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={createPostMutation.isPending}>
              {createPostMutation.isPending ? "Creating..." : "Confirm & Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
