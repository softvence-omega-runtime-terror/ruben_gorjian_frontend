"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { useTimezone } from "@/hooks/use-timezone";
import { useScrollPropagation } from "@/hooks/use-scroll-propagation";
import {
  fromUTC,
  formatForDateTimeLocal,
  parseDateTimeLocal,
} from "@/lib/timezone";
import dayjs from "dayjs";
import clsx from "clsx";

import { getEnvVarWithDefault } from "@/lib/env-utils";
import { buildStorageUrl } from "@/lib/storage-utils";

const STORAGE_BASE_URL = getEnvVarWithDefault("NEXT_PUBLIC_STORAGE_BASE_URL", "");

interface PostModalProps {
  open: boolean;
  onClose: () => void;
  initialDate: dayjs.Dayjs | null;
  socialAccounts: Array<{ id: string; platform: string; displayName: string; externalAccountId?: string }>;
  onCreate: (payload: {
    caption: string;
    scheduledFor: Date;
    socialAccountIds: string[];
    platforms: string[];
    assetId?: string;
    assetIds?: string[];
    hashtags?: string[];
  }) => Promise<void>;
  onUpload: (file: File) => Promise<{ id: string; storageKey: string }>;
  uploading?: boolean;
  editingPost?: {
    id: string;
    caption: string;
    scheduledFor: string;
    assetId?: string;
    assetIds?: string[];
    socialAccountIds: string[];
    hashtags?: string[];
  } | null;
  isAdmin?: boolean;
  onPublish?: (payload: any) => Promise<void>;
}

type UploadedAsset = { id: string; storageKey: string; name?: string };

export default function PostModal({
  open,
  onClose,
  initialDate,
  socialAccounts,
  onCreate,
  onUpload,
  uploading = false,
  editingPost,
  isAdmin = false,
  onPublish,
}: PostModalProps) {
  const [caption, setCaption] = useState("");
  const [datetime, setDatetime] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assetIds, setAssetIds] = useState<string[]>([]);
  const [assets, setAssets] = useState<UploadedAsset[]>([]);
  const [hashtagsInput, setHashtagsInput] = useState("");
  const isEditing = !!editingPost;
  const {
    timezone: userTimezone,
    timezoneAbbr,
  } = useTimezone();

  const scrollHandlers = useScrollPropagation({ scrollWindowAtBoundary: true });

  const normalizeHashtags = (input: string): string[] => {
    if (!input.trim()) return [];
    const tags = input
      .split(/[\s,]+/)
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
      .map((tag) => {
        const cleaned = tag.replace(/^#+/, "");
        return cleaned.length > 0 ? `#${cleaned}` : "";
      })
      .filter((tag) => tag.length > 0);
    return tags.slice(0, 30);
  };

  const requiresMedia = useMemo(
    () =>
      socialAccounts
        .filter((acc) => selectedAccounts.includes(acc.id))
        .some((acc) => acc.platform === "INSTAGRAM" || acc.platform === "TIKTOK"),
    [selectedAccounts, socialAccounts]
  );

  const hasFacebook = useMemo(
    () =>
      socialAccounts
        .filter((acc) => selectedAccounts.includes(acc.id))
        .some((acc) => acc.platform === "FACEBOOK"),
    [selectedAccounts, socialAccounts]
  );

  // Instagram allows only one media file; Facebook supports multiple
  const allowsMultipleMedia = useMemo(
    () => !requiresMedia && (hasFacebook || assets.length > 1),
    [assets.length, hasFacebook, requiresMedia]
  );

  const storageConfigured = useMemo(() => {
    if (!requiresMedia) return true;
    return true;
  }, [requiresMedia]);

  useEffect(() => {
    if (editingPost) {
      setCaption(editingPost.caption === "." ? "" : (editingPost.caption || ""));
      // Convert from UTC to user timezone for display
      const scheduledDate = fromUTC(editingPost.scheduledFor, userTimezone);
      setDatetime(formatForDateTimeLocal(scheduledDate, userTimezone));
      setSelectedAccounts(editingPost.socialAccountIds);
      // Support both single assetId (legacy) and assetIds array
      if (editingPost.assetId) {
        setAssetIds([editingPost.assetId]);
      } else if (editingPost.assetIds && Array.isArray(editingPost.assetIds)) {
        setAssetIds(editingPost.assetIds);
      } else {
        setAssetIds([]);
      }
      setHashtagsInput(
        editingPost.hashtags && Array.isArray(editingPost.hashtags)
          ? editingPost.hashtags.join(" ")
          : ""
      );
    } else if (initialDate) {
      // initialDate is already in user timezone from calendar
      setDatetime(formatForDateTimeLocal(initialDate, userTimezone));
    }
  }, [initialDate, editingPost, userTimezone]);

  useEffect(() => {
    if (!open) {
      setCaption("");
      setDatetime("");
      setSelectedAccounts([]);
      setError(null);
      setSubmitting(false);
      setAssets([]);
      setAssetIds([]);
      setHashtagsInput("");
    }
  }, [open]);

  const toggleAccount = (id: string) => {
    const account = socialAccounts.find((acc) => acc.id === id);
    if (!account) return;

    // Users can now change platforms even during editing
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!datetime) {
      setError("Please choose a date and time");
      return;
    }

    // Validate past dates
    const selectedDate = dayjs(datetime);
    if (selectedDate.isBefore(dayjs(), "minute")) {
      setError(
        "Cannot schedule posts in the past. Please select a future date and time."
      );
      return;
    }

    // Caption is optional for initial user scheduling
    if (selectedAccounts.length === 0) {
      setError("Select at least one social account");
      return;
    }
    // Media is now optional for scheduling as per user request.
    // The admin will review and add media later if missing.
    if (requiresMedia && assetIds.length > 1) {
      setError(
        "Instagram and TikTok only support a single media file. Please select only one asset."
      );
      return;
    }

    // TikTok specific: Video only
    const hasTikTok = socialAccounts
      .filter((acc) => selectedAccounts.includes(acc.id))
      .some((acc) => acc.platform === "TIKTOK");
    
    if (hasTikTok) {
      const selectedAssets = assets.filter((a) => assetIds.includes(a.id));
      const hasNonVideo = selectedAssets.some(a => {
        // Simple extension check or we could use a metadata field if available
        const key = a.storageKey.toLowerCase();
        return !key.endsWith(".mp4") && !key.endsWith(".mov") && !key.endsWith(".webm");
      });
      if (hasNonVideo) {
        setError("TikTok only supports video uploads. Please remove any images.");
        return;
      }
    }
    setSubmitting(true);
    setError(null);
    try {
      const platforms = Array.from(
        new Set(
          socialAccounts
            .filter((acc) => selectedAccounts.includes(acc.id))
            .map((acc) => acc.platform)
        )
      );
      const hashtags = normalizeHashtags(hashtagsInput);
      // Parse datetime-local input and convert to UTC
      const scheduledDate = parseDateTimeLocal(datetime, userTimezone);
      await onCreate({
        // If caption is empty, use a small placeholder to satisfy backend requirements.
        caption: caption.trim() || ".",
        scheduledFor: scheduledDate,
        socialAccountIds: selectedAccounts,
        platforms,
        ...(assetIds.length > 0 ? { assetIds } : {}),
        ...(hashtags.length > 0 ? { hashtags } : {}),
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishNow = async () => {
    if (!caption.trim()) {
      setError("Please add a caption");
      return;
    }
    if (selectedAccounts.length === 0) {
      setError("Select at least one social account");
      return;
    }
    if (requiresMedia && assetIds.length === 0) {
      setError("Instagram and TikTok require media to publish.");
      return;
    }

    if (onPublish) {
      // Delegate to parent (AdminPostsPage) which will save and publish 
      setSubmitting(true);
      setError(null);
      try {
        const hashtags = normalizeHashtags(hashtagsInput);
        const platforms = Array.from(
          new Set(
            socialAccounts
              .filter((acc) => selectedAccounts.includes(acc.id))
              .map((acc) => acc.platform)
          )
        );
        const scheduledDate = parseDateTimeLocal(datetime, userTimezone);
        await onPublish({
          caption: caption.trim() || ".",
          scheduledFor: scheduledDate,
          socialAccountIds: selectedAccounts,
          platforms,
          ...(assetIds.length > 0 ? { assetIds } : {}),
          ...(hashtags.length > 0 ? { hashtags } : {}),
        });
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to publish post");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // TikTok specific: Video only
    const hasTikTok = socialAccounts
      .filter((acc) => selectedAccounts.includes(acc.id))
      .some((acc) => acc.platform === "TIKTOK");
    
    if (hasTikTok) {
      const selectedAssets = assets.filter((a) => assetIds.includes(a.id));
      const hasNonVideo = selectedAssets.some(a => {
        const key = a.storageKey.toLowerCase();
        return !key.endsWith(".mp4") && !key.endsWith(".mov") && !key.endsWith(".webm");
      });
      if (hasNonVideo) {
        setError("TikTok only supports video uploads. Please remove any images.");
        return;
      }
    }

    setSubmitting(true);
    setError(null);
    try {
      const hashtags = normalizeHashtags(hashtagsInput);
      const fullCaption = hashtags.length > 0 ? `${caption.trim()}\n\n${hashtags.join(" ")}` : caption.trim();

      // We publish per account using the user's provided API structure
      for (const accountId of selectedAccounts) {
        const account = socialAccounts.find((a) => a.id === accountId);
        if (!account) continue;

        // Resolve technical username for Upload-Post
        // Prefer externalAccountId (stripping prefix) or raw username
        let technicalUsername = account.displayName || account.id;
        
        if (account.externalAccountId) {
          if (account.externalAccountId.startsWith("upload-post:")) {
            technicalUsername = account.externalAccountId.replace("upload-post:", "");
          } else {
            technicalUsername = account.externalAccountId;
          }
        }

        const isFacebook = account.platform === "FACEBOOK";
        const selectedAssets = assets.filter((a) => assetIds.includes(a.id));
        
        // Build payload based on user's API spec
        const payload: any = {
          username: technicalUsername,
          platform: account.platform.toLowerCase(),
          title: fullCaption,
          asyncUpload: true,
        };

        if (selectedAssets.length > 0) {
          if (isFacebook && selectedAssets.length > 1) {
            payload.mediaUrls = selectedAssets.map(a => buildStorageUrl(STORAGE_BASE_URL, a.storageKey));
          } else {
            payload.mediaUrl = buildStorageUrl(STORAGE_BASE_URL, selectedAssets[0].storageKey);
          }
        }

        const endpoint = account.platform === "TIKTOK" 
          ? "/api/tiktok/publish-now" // TikTok specific as per user spec
          : "/api/social-media/publish-now";

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || `Failed to publish to ${account.platform}`);
        }
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish post");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFiles = async (files?: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    const uploaded: UploadedAsset[] = [];
    for (const file of Array.from(files)) {
      try {
        const asset = await onUpload(file);
        uploaded.push({
          id: asset.id,
          storageKey: asset.storageKey,
          name: file.name,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        break;
      }
    }
    if (uploaded.length > 0) {
      setAssets((prev) => [...prev, ...uploaded]);
      // Auto-select the uploaded assets if none are selected
      if (assetIds.length === 0) {
        if (allowsMultipleMedia) {
          // For Facebook, select all uploaded files
          setAssetIds(uploaded.map((a) => a.id));
        } else {
          // For Instagram or single selection, select only the last one
          setAssetIds([uploaded[uploaded.length - 1].id]);
        }
      }
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      <style jsx>{`
        @keyframes modalFade {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes overlayFade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm overscroll-none"
        style={{ animation: "overlayFade 180ms ease-out" }}
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/95 shadow-2xl max-h-[90vh] flex flex-col pointer-events-auto overflow-hidden"
        style={{ animation: "modalFade 200ms ease-out" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {isEditing ? "Edit Post" : "New Post"}
            </h3>
            <p className="text-xs text-slate-400">
              {isEditing
                ? "Update your scheduled post"
                : "Schedule a post for your connected accounts"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-300 hover:text-white"
          >
            Close
          </Button>
        </div>

        {/* 
          Scroll container with proper constraints:
          - min-h-0 is critical for flex-1 + overflow to work properly
          - overscroll-contain prevents scroll chaining to background
          - Hidden scrollbars for cleaner UI while maintaining scroll functionality
          - -webkit-overflow-scrolling: touch for smooth iOS scrolling
        */}
        <div
          className="space-y-4 px-5 py-4 overflow-y-auto flex-1 min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          style={{ WebkitOverflowScrolling: "touch" }}
          {...scrollHandlers}
        >
          <div className="space-y-2">
            <label className="text-sm text-slate-300">
              Media{" "}
              {requiresMedia && (
                <span className="text-amber-400/70">(Optional for scheduling)</span>
              )}
            </label>
            {requiresMedia && !storageConfigured && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                ⚠️ Media storage is not configured. Instagram posts require
                accessible media URLs.
              </div>
            )}
            <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950/60 p-3">
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                disabled={isEditing && !isAdmin}
                onChange={(e) => handleFiles(e.target.files)}
                className={clsx(
                  "text-xs text-slate-200 file:mr-3 file:rounded-md file:border file:border-slate-700 file:bg-slate-800 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-100 hover:file:bg-slate-700",
                  isEditing && !isAdmin && "opacity-50 cursor-not-allowed"
                )}
              />
              <div className="mt-2 text-xs text-slate-400">
                {uploading && <span>Uploading...</span>}
                {assets.length > 0 && !uploading && (
                  <span className="text-lime-300">
                    {assets.length} file(s) uploaded
                  </span>
                )}
                {assets.length === 0 && !uploading && assetIds.length === 0 && (
                  <span>
                    Optional: Attach an image or video. Admin can add media later before posting.
                  </span>
                )}
                {assetIds.length > 0 &&
                  assetIds.some((id) => !assets.find((a) => a.id === id)) && (
                    <span className="text-lime-300">
                      {assetIds.length} asset(s) selected from existing post
                    </span>
                  )}
              </div>
              {assets.length > 0 && (
                <div className="mt-3 space-y-1">
                  <div className="text-xs text-slate-300 font-medium">
                    {allowsMultipleMedia
                      ? `Select media for this post (multiple allowed for Facebook) ${assets.length > 1 && `(${assets.length} uploaded)`}`
                      : `Select one asset for this post${requiresMedia ? " (Instagram allows one image or video only)" : ""} ${assets.length > 1 && `(${assets.length} uploaded)`}`}
                  </div>
                  {assetIds.length === 0 && assets.length > 0 && (
                    <div className="text-xs text-amber-400">
                      Please select{" "}
                      {allowsMultipleMedia ? "media" : "which asset"} to use
                    </div>
                  )}
                  {requiresMedia && assetIds.length > 1 && (
                    <div className="text-xs text-amber-400">
                      Instagram only supports one media file. Select a single
                      asset for Instagram, or post to Facebook for
                      multiple.
                    </div>
                  )}
                  <div className="space-y-1 max-h-28 overflow-auto">
                    {assets.map((asset) => {
                      const isSelected = assetIds.includes(asset.id);
                      return (
                        <label
                          key={asset.id}
                          className={clsx(
                            "flex items-center gap-2 text-xs text-slate-200 p-1.5 rounded cursor-pointer hover:bg-slate-800/50",
                            isSelected &&
                              "bg-slate-800/70 border border-lime-400/50"
                          )}
                        >
                          <input
                            type={allowsMultipleMedia ? "checkbox" : "radio"}
                            name="asset"
                            value={asset.id}
                            checked={isSelected}
                            disabled={isEditing && !isAdmin}
                            onChange={() => {
                              if (isEditing && !isAdmin) return;
                              if (allowsMultipleMedia) {
                                // Toggle selection for checkboxes
                                setAssetIds((prev) =>
                                  prev.includes(asset.id)
                                    ? prev.filter((id) => id !== asset.id)
                                    : [...prev, asset.id]
                                );
                              } else {
                                // Single selection for radio buttons
                                setAssetIds([asset.id]);
                              }
                            }}
                            className="accent-lime-400"
                          />
                          <span className="truncate flex-1">
                            {asset.name || asset.storageKey}
                          </span>
                          {isSelected && (
                            <span className="text-lime-400 text-[10px]">
                              ✓{" "}
                              {allowsMultipleMedia && assetIds.length > 1
                                ? `${assetIds.indexOf(asset.id) + 1}/${assetIds.length}`
                                : "Selected"}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                  {allowsMultipleMedia && assetIds.length > 0 && (
                    <div className="text-xs text-slate-400 mt-1">
                      {assetIds.length} media file
                      {assetIds.length > 1 ? "s" : ""} selected
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <MarkdownEditor
            value={caption}
            onChange={setCaption}
            placeholder="Write your caption in Markdown... (Optional for scheduling)"
            rows={6}
          />

          <div className="space-y-2">
            <label className="text-sm text-slate-300">
              Hashtags{" "}
              <span className="text-xs text-slate-500">
                (separate with spaces, max 30)
              </span>
            </label>
            <textarea
              className="w-full rounded-lg border border-slate-800 bg-slate-950/80 p-2 text-sm text-white focus:border-lime-400 focus:outline-none"
              rows={2}
              value={hashtagsInput}
              onChange={(e) => setHashtagsInput(e.target.value)}
              placeholder="#hashtag1 #hashtag2 #hashtag3"
            />
            {hashtagsInput && (
              <div className="text-xs text-slate-400">
                {normalizeHashtags(hashtagsInput).length} / 30 tags
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <EnhancedDatePicker
              value={datetime}
              onChange={setDatetime}
              timezone={userTimezone}
              timezoneAbbr={timezoneAbbr}
              min={formatForDateTimeLocal(dayjs(), userTimezone)}
            />
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Accounts</label>
              <div className="max-h-32 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60 p-2 space-y-1">
                {socialAccounts.length === 0 && (
                  <div className="text-xs text-slate-500">
                    No connected accounts
                  </div>
                )}
                {socialAccounts.map((acc) => {
                  const isSelected = selectedAccounts.includes(acc.id);

                  return (
                    <label
                      key={acc.id}
                      className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className={clsx(
                          "h-4 w-4 accent-lime-400",
                          "cursor-pointer"
                        )}
                        checked={isSelected}
                        onChange={() => toggleAccount(acc.id)}
                      />
                      <span className="text-xs rounded px-1.5 py-0.5 border border-slate-700 text-slate-300">
                        {acc.platform}
                      </span>
                      <span className="truncate text-sm text-slate-100">
                        {acc.displayName || acc.id}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-800 flex-shrink-0">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-slate-300 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-lime-400 text-slate-900 hover:bg-lime-300"
          >
            {submitting
              ? isEditing
                ? "Updating..."
                : "Scheduling..."
              : isEditing
                ? "Update"
                : "Schedule"}
          </Button>
          {(isAdmin || onPublish) && (
            <Button
              onClick={handlePublishNow}
              disabled={submitting}
              className="bg-sky-500 text-white hover:bg-sky-400"
            >
              {submitting ? "Publishing..." : "Publish Now"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
=======
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { useTimezone } from "@/hooks/use-timezone";
import { useScrollPropagation } from "@/hooks/use-scroll-propagation";
import {
  fromUTC,
  formatForDateTimeLocal,
  parseDateTimeLocal,
} from "@/lib/timezone";
import dayjs from "dayjs";
import clsx from "clsx";
import { useToast } from "@/hooks/use-toast";

import { getEnvVarWithDefault } from "@/lib/env-utils";
import { buildStorageUrl } from "@/lib/storage-utils";

const STORAGE_BASE_URL = getEnvVarWithDefault("NEXT_PUBLIC_STORAGE_BASE_URL", "");

interface PostModalProps {
  open: boolean;
  onClose: () => void;
  initialDate: dayjs.Dayjs | null;
  socialAccounts: Array<{ id: string; platform: string; displayName: string; externalAccountId?: string }>;
  onCreate: (payload: {
    caption: string;
    scheduledFor: string;
    socialAccountIds: string[];
    platforms: string[];
    assetId?: string;
    assetIds?: string[];
    hashtags?: string[];
  }) => Promise<void>;
  onUpload: (file: File) => Promise<{ id: string; storageKey: string }>;
  uploading?: boolean;
  editingPost?: {
    id: string;
    caption: string;
    scheduledFor: string;
    assetId?: string;
    assetIds?: string[];
    socialAccountIds: string[];
    hashtags?: string[];
  } | null;
  isAdmin?: boolean;
  onPublish?: (payload: any) => Promise<void>;
}

type UploadedAsset = { id: string; storageKey: string; name?: string };

export default function PostModal({
  open,
  onClose,
  initialDate,
  socialAccounts,
  onCreate,
  onUpload,
  uploading = false,
  editingPost,
  isAdmin = false,
  onPublish,
}: PostModalProps) {
  const [caption, setCaption] = useState("");
  const [datetime, setDatetime] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [assetIds, setAssetIds] = useState<string[]>([]);
  const [assets, setAssets] = useState<UploadedAsset[]>([]);
  const [hashtagsInput, setHashtagsInput] = useState("");
  const isEditing = !!editingPost;
  const {
    timezone: userTimezone,
    timezoneAbbr,
  } = useTimezone();
  const { toast } = useToast();

  const scrollHandlers = useScrollPropagation({ scrollWindowAtBoundary: true });

  const normalizeHashtags = (input: string): string[] => {
    if (!input.trim()) return [];
    const tags = input
      .split(/[\s,]+/)
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
      .map((tag) => {
        const cleaned = tag.replace(/^#+/, "");
        return cleaned.length > 0 ? `#${cleaned}` : "";
      })
      .filter((tag) => tag.length > 0);
    return tags.slice(0, 30);
  };

  const requiresMedia = useMemo(
    () =>
      socialAccounts
        .filter((acc) => selectedAccounts.includes(acc.id))
        .some((acc) => acc.platform === "INSTAGRAM" || acc.platform === "TIKTOK"),
    [selectedAccounts, socialAccounts]
  );

  const hasFacebook = useMemo(
    () =>
      socialAccounts
        .filter((acc) => selectedAccounts.includes(acc.id))
        .some((acc) => acc.platform === "FACEBOOK"),
    [selectedAccounts, socialAccounts]
  );

  // Instagram allows only one media file; Facebook supports multiple
  const allowsMultipleMedia = useMemo(
    () => !requiresMedia && (hasFacebook || assets.length > 1),
    [assets.length, hasFacebook, requiresMedia]
  );

  const storageConfigured = useMemo(() => {
    if (!requiresMedia) return true;
    return true;
  }, [requiresMedia]);

  useEffect(() => {
    if (editingPost) {
      setCaption(editingPost.caption === "." ? "" : (editingPost.caption || ""));
      // Convert from UTC to user timezone for display
      const scheduledDate = fromUTC(editingPost.scheduledFor, userTimezone);
      setDatetime(formatForDateTimeLocal(scheduledDate, userTimezone));
      setSelectedAccounts(editingPost.socialAccountIds);
      // Support both single assetId (legacy) and assetIds array
      if (editingPost.assetId) {
        setAssetIds([editingPost.assetId]);
      } else if (editingPost.assetIds && Array.isArray(editingPost.assetIds)) {
        setAssetIds(editingPost.assetIds);
      } else {
        setAssetIds([]);
      }
      setHashtagsInput(
        editingPost.hashtags && Array.isArray(editingPost.hashtags)
          ? editingPost.hashtags.join(" ")
          : ""
      );
    } else if (initialDate) {
      // initialDate is already in user timezone from calendar
      setDatetime(formatForDateTimeLocal(initialDate, userTimezone));
    }
  }, [initialDate, editingPost, userTimezone]);

  useEffect(() => {
    if (!open) {
      setCaption("");
      setDatetime("");
      setSelectedAccounts([]);
      setSubmitting(false);
      setAssets([]);
      setAssetIds([]);
      setHashtagsInput("");
    }
  }, [open]);

  const toggleAccount = (id: string) => {
    const account = socialAccounts.find((acc) => acc.id === id);
    if (!account) return;

    // Users can now change platforms even during editing
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!datetime) {
      toast({ title: "Input Required", description: "Please choose a date and time", variant: "destructive" });
      return;
    }

    // Validate past dates
    const now = userTimezone ? dayjs().tz(userTimezone) : dayjs();
    const selectedDate = userTimezone ? dayjs.tz(datetime, userTimezone) : dayjs(datetime);
    
    if (selectedDate.isBefore(now, "minute")) {
      toast({
        title: "Invalid Date",
        description: "Cannot schedule posts in the past. Please select a future date and time.",
        variant: "destructive"
      });
      return;
    }

    if (selectedAccounts.length === 0) {
      toast({ title: "Account Required", description: "Select at least one social account", variant: "destructive" });
      return;
    }

    if (requiresMedia && assetIds.length > 1) {
      toast({
        title: "Media Limit",
        description: "Instagram and TikTok only support a single media file. Please select only one asset.",
        variant: "destructive"
      });
      return;
    }

    // TikTok specific: Video only
    const hasTikTok = socialAccounts
      .filter((acc) => selectedAccounts.includes(acc.id))
      .some((acc) => acc.platform === "TIKTOK");
    
    if (hasTikTok) {
      const selectedAssets = assets.filter((a) => assetIds.includes(a.id));
      const hasNonVideo = selectedAssets.some(a => {
        const key = a.storageKey.toLowerCase();
        return !key.endsWith(".mp4") && !key.endsWith(".mov") && !key.endsWith(".webm");
      });
      if (hasNonVideo) {
        toast({ title: "Format Error", description: "TikTok only supports video uploads. Please remove any images.", variant: "destructive" });
        return;
      }
    }

    setSubmitting(true);
    try {
      const platforms = Array.from(
        new Set(
          socialAccounts
            .filter((acc) => selectedAccounts.includes(acc.id))
            .map((acc) => acc.platform)
        )
      );
      const hashtags = normalizeHashtags(hashtagsInput);
      await onCreate({
        caption: caption.trim() || ".",
        scheduledFor: datetime,
        socialAccountIds: selectedAccounts,
        platforms,
        ...(assetIds.length > 0 ? { assetIds } : {}),
        ...(hashtags.length > 0 ? { hashtags } : {}),
      });
      onClose();
    } catch (err: any) {
       // Error will be caught by EnhancedCalendar and toasted there, 
       // but we'll toast here too for redundancy if preferred
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishNow = async () => {
    if (!caption.trim()) {
      toast({ title: "Caption Required", description: "Please add a caption", variant: "destructive" });
      return;
    }
    if (selectedAccounts.length === 0) {
      toast({ title: "Account Required", description: "Select at least one social account", variant: "destructive" });
      return;
    }
    if (requiresMedia && assetIds.length === 0) {
      toast({ title: "Media Required", description: "Instagram and TikTok require media to publish.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      if (onPublish) {
        const hashtags = normalizeHashtags(hashtagsInput);
        const platforms = Array.from(
          new Set(
            socialAccounts
              .filter((acc) => selectedAccounts.includes(acc.id))
              .map((acc) => acc.platform)
          )
        );
        await onPublish({
          caption: caption.trim() || ".",
          scheduledFor: datetime,
          socialAccountIds: selectedAccounts,
          platforms,
          ...(assetIds.length > 0 ? { assetIds } : {}),
          ...(hashtags.length > 0 ? { hashtags } : {}),
        });
        toast({ title: "Successfully Published", description: "Your post is being published." });
        onClose();
        return;
      }

      // TikTik specific check
      const hasTikTok = socialAccounts
        .filter((acc) => selectedAccounts.includes(acc.id))
        .some((acc) => acc.platform === "TIKTOK");
      
      if (hasTikTok) {
        const selectedAssets = assets.filter((a) => assetIds.includes(a.id));
        const hasNonVideo = selectedAssets.some(a => {
          const key = a.storageKey.toLowerCase();
          return !key.endsWith(".mp4") && !key.endsWith(".mov") && !key.endsWith(".webm");
        });
        if (hasNonVideo) {
          toast({ title: "Format Error", description: "TikTok only supports video uploads. Please remove any images.", variant: "destructive" });
          setSubmitting(false);
          return;
        }
      }

      const hashtags = normalizeHashtags(hashtagsInput);
      const fullCaption = hashtags.length > 0 ? `${caption.trim()}\n\n${hashtags.join(" ")}` : caption.trim();

      for (const accountId of selectedAccounts) {
        const account = socialAccounts.find((a) => a.id === accountId);
        if (!account) continue;

        let technicalUsername = account.displayName || account.id;
        
        if (account.externalAccountId) {
          if (account.externalAccountId.startsWith("upload-post:")) {
            technicalUsername = account.externalAccountId.replace("upload-post:", "");
          } else {
            technicalUsername = account.externalAccountId;
          }
        }

        const isFacebook = account.platform === "FACEBOOK";
        const selectedAssets = assets.filter((a) => assetIds.includes(a.id));
        
        const payload: any = {
          username: technicalUsername,
          platform: account.platform.toLowerCase(),
          title: fullCaption,
          asyncUpload: true,
        };

        if (selectedAssets.length > 0) {
          if (isFacebook && selectedAssets.length > 1) {
            payload.mediaUrls = selectedAssets.map(a => buildStorageUrl(STORAGE_BASE_URL, a.storageKey));
          } else {
            payload.mediaUrl = buildStorageUrl(STORAGE_BASE_URL, selectedAssets[0].storageKey);
          }
        }

        const endpoint = account.platform === "TIKTOK" 
          ? "/api/tiktok/publish-now"
          : "/api/social-media/publish-now";

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || `Failed to publish to ${account.platform}`);
        }
      }
      toast({ title: "Published Successfully", description: "Your post has been published to the selected accounts." });
      onClose();
    } catch (err) {
      toast({ title: "Publish Error", description: err instanceof Error ? err.message : "Failed to publish post", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFiles = async (files?: FileList | null) => {
    if (!files || files.length === 0) return;
    const uploaded: UploadedAsset[] = [];
    for (const file of Array.from(files)) {
      try {
        const asset = await onUpload(file);
        uploaded.push({
          id: asset.id,
          storageKey: asset.storageKey,
          name: file.name,
        });
      } catch (err) {
        toast({ title: "Upload Failed", description: err instanceof Error ? err.message : "Upload failed", variant: "destructive" });
        break;
      }
    }
    if (uploaded.length > 0) {
      setAssets((prev) => [...prev, ...uploaded]);
      if (assetIds.length === 0) {
        if (allowsMultipleMedia) {
          setAssetIds(uploaded.map((a) => a.id));
        } else {
          setAssetIds([uploaded[uploaded.length - 1].id]);
        }
      }
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      <style jsx>{`
        @keyframes modalFade {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes overlayFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm overscroll-none"
        style={{ animation: "overlayFade 180ms ease-out" }}
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/95 shadow-2xl max-h-[90vh] flex flex-col pointer-events-auto overflow-hidden"
        style={{ animation: "modalFade 200ms ease-out" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {isEditing ? "Edit Post" : "New Post"}
            </h3>
            <p className="text-xs text-slate-400">
              {isEditing
                ? "Update your scheduled post"
                : "Schedule a post for your connected accounts"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-300 hover:text-white"
          >
            Close
          </Button>
        </div>

        <div
          className="space-y-4 px-5 py-4 overflow-y-auto flex-1 min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          style={{ WebkitOverflowScrolling: "touch" }}
          {...scrollHandlers}
        >
          <div className="space-y-2">
            <label className="text-sm text-slate-300">
              Media{" "}
              {requiresMedia && (
                <span className="text-amber-400/70">(Optional for scheduling)</span>
              )}
            </label>
            <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950/60 p-3">
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={(e) => handleFiles(e.target.files)}
                className={clsx(
                  "text-xs text-slate-200 file:mr-3 file:rounded-md file:border file:border-slate-700 file:bg-slate-800 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-100 hover:file:bg-slate-700"
                )}
              />
              <div className="mt-2 text-xs text-slate-400">
                {uploading && <span>Uploading...</span>}
                {assets.length > 0 && !uploading && (
                  <span className="text-lime-300">
                    {assets.length} file(s) uploaded
                  </span>
                )}
                {assets.length === 0 && !uploading && assetIds.length === 0 && (
                  <span>Optional: Attach media. Admin can add it later.</span>
                )}
              </div>
              {assets.length > 0 && (
                <div className="mt-3 space-y-1">
                  <div className="text-xs text-slate-300 font-medium">
                    {allowsMultipleMedia ? "Select media (multiple allowed)" : "Select one asset"}
                  </div>
                  <div className="space-y-1 max-h-28 overflow-auto">
                    {assets.map((asset) => {
                      const isSelected = assetIds.includes(asset.id);
                      return (
                        <label
                          key={asset.id}
                          className={clsx(
                            "flex items-center gap-2 text-xs text-slate-200 p-1.5 rounded cursor-pointer hover:bg-slate-800/50",
                            isSelected && "bg-slate-800/70 border border-lime-400/50"
                          )}
                        >
                          <input
                            type={allowsMultipleMedia ? "checkbox" : "radio"}
                            name="asset"
                            value={asset.id}
                            checked={isSelected}
                            onChange={() => {
                              if (allowsMultipleMedia) {
                                setAssetIds((prev) =>
                                  prev.includes(asset.id)
                                    ? prev.filter((id) => id !== asset.id)
                                    : [...prev, asset.id]
                                );
                              } else {
                                setAssetIds([asset.id]);
                              }
                            }}
                            className="accent-lime-400"
                          />
                          <span className="truncate flex-1">{asset.name || asset.storageKey}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <MarkdownEditor
            value={caption}
            onChange={setCaption}
            placeholder="Write your caption... (Optional)"
            rows={6}
          />

          <div className="space-y-2">
            <label className="text-sm text-slate-300">Hashtags</label>
            <textarea
              className="w-full rounded-lg border border-slate-800 bg-slate-950/80 p-2 text-sm text-white focus:border-lime-400 focus:outline-none"
              rows={2}
              value={hashtagsInput}
              onChange={(e) => setHashtagsInput(e.target.value)}
              placeholder="#hashtag1 #hashtag2"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <EnhancedDatePicker
              value={datetime}
              onChange={setDatetime}
              timezone={userTimezone}
              timezoneAbbr={timezoneAbbr}
              min={formatForDateTimeLocal(dayjs(), userTimezone)}
            />
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Accounts</label>
              <div className="max-h-32 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60 p-2 space-y-1">
                {socialAccounts.map((acc) => (
                  <label key={acc.id} className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedAccounts.includes(acc.id)}
                      onChange={() => toggleAccount(acc.id)}
                      className="h-4 w-4 accent-lime-400 cursor-pointer"
                    />
                    <span className="text-xs rounded px-1.5 py-0.5 border border-slate-700 text-slate-300">
                      {acc.platform}
                    </span>
                    <span className="truncate text-sm text-slate-100">{acc.displayName || acc.id}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-800 flex-shrink-0">
          <Button variant="ghost" onClick={onClose} className="text-slate-300 hover:text-white">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-lime-400 text-slate-900 hover:bg-lime-300"
          >
            {submitting ? (isEditing ? "Updating..." : "Scheduling...") : (isEditing ? "Update" : "Schedule")}
          </Button>
          {(isAdmin || onPublish) && (
            <Button
              onClick={handlePublishNow}
              disabled={submitting}
              className="bg-sky-500 text-white hover:bg-sky-400"
            >
              {submitting ? "Publishing..." : "Publish Now"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

