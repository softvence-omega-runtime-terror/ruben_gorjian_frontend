"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/calendar/status-pill";
import { useTimezone } from "@/hooks/use-timezone";
import { useScrollPropagation } from "@/hooks/use-scroll-propagation";
import { useSessionContext } from "@/context/SessionContext";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import clsx from "clsx";
import { buildStorageUrl } from "@/lib/storage-utils";

dayjs.extend(relativeTime);
import {
  Edit2,
  X,
  Calendar as CalendarIcon,
  Clock,
  Hash,
  FileText,
  AlertCircle,
  Trash2,
} from "lucide-react";
import {
  FaFacebook as Facebook,
  FaInstagram as Instagram,
  FaLinkedin as Linkedin,
  FaTiktok as Tiktok,
} from "react-icons/fa";
import Image from "next/image";

import { getEnvVarWithDefault } from "@/lib/env-utils";

const STORAGE_BASE_URL = getEnvVarWithDefault("NEXT_PUBLIC_STORAGE_BASE_URL", "");

const platformIcons = {
  INSTAGRAM: Instagram,
  FACEBOOK: Facebook,
  LINKEDIN: Linkedin,
  TIKTOK: Tiktok,
};

const platformColors = {
  INSTAGRAM: "text-pink-500",
  FACEBOOK: "text-blue-500",
  LINKEDIN: "text-blue-600",
  TIKTOK: "text-white",
};

type PostDetails = {
  id: string;
  caption: string | null;
  hashtags?: string[] | null;
  scheduledFor: string;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHING" | "POSTED" | "FAILED";
  asset?: {
    id: string;
    storageKey: string;
    type: "IMAGE" | "VIDEO";
    contentType?: string | null;
  };
  targets: Array<{
    id: string;
    platform: "INSTAGRAM" | "FACEBOOK" | "LINKEDIN" | "TIKTOK";
    status: "PENDING" | "SCHEDULED" | "POSTED" | "FAILED";
    errorMessage?: string | null;
    externalPostId?: string | null;
    publishedAt?: string | null;
    socialAccount?: {
      id: string;
      displayName: string;
    };
  }>;
  cta?: string | null;
  shortDescription?: string | null;
};

interface PostDetailsModalProps {
  open: boolean;
  onClose: () => void;
  postId: string | null;
  onEdit: (postId: string) => void;
  onDelete?: (postId: string) => Promise<void>;
  posts: PostDetails[];
  loading?: boolean;
}

export default function PostDetailsModal({
  open,
  onClose,
  postId,
  onEdit,
  onDelete,
  posts,
  loading = false,
}: PostDetailsModalProps) {
  const { timezoneAbbr } = useTimezone();
  const { session } = useSessionContext();
  const isAdmin = session?.role === "ADMIN" || session?.role === "SUPER_ADMIN";
  const [isDeleting, setIsDeleting] = useState(false);

  const scrollHandlers = useScrollPropagation({ scrollWindowAtBoundary: true });

  const post = useMemo(() => {
    if (!open || !postId) return null;
    return posts.find((p) => p.id === postId) || null;
  }, [open, postId, posts]);

  if (!open) return null;

  const handleEdit = () => {
    if (postId) {
      onEdit(postId);
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!postId || !onDelete) return;
    if (!confirm("Are you sure you want to delete this post?")) return;
    
    setIsDeleting(true);
    try {
      await onDelete(postId);
      onClose();
    } catch (error) {
      console.error("Failed to delete post:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const anyPost = post as any;
  let mediaUrl = null;
  if (post?.asset?.storageKey) {
    mediaUrl = buildStorageUrl(STORAGE_BASE_URL, post.asset.storageKey);
  } else if (anyPost?.media && anyPost.media.length > 0) {
    mediaUrl = anyPost.media[0].url || buildStorageUrl(STORAGE_BASE_URL, anyPost.media[0].storageKey);
  } else if (anyPost?.assets && anyPost.assets.length > 0) {
    mediaUrl = anyPost.assets[0];
  }

  // post.scheduledFor is already in user timezone (from calendar context)
  const scheduledDate = post?.scheduledFor ? dayjs(post.scheduledFor) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 overflow-hidden">
      {/* ... (styles and overlay) */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm overscroll-none"
        style={{ animation: "overlayFade 180ms ease-out" }}
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-2xl mx-4 sm:mx-auto rounded-none sm:rounded-2xl border-0 sm:border border-slate-800 bg-slate-900/95 shadow-2xl h-full sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto"
        style={{ animation: "modalFade 200ms ease-out" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-white">Post Details</h3>
            <p className="text-xs text-slate-400">
              View scheduled post information
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-300 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scroll container */}
        <div
          className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          style={{ WebkitOverflowScrolling: "touch" }}
          {...scrollHandlers}
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <div className="text-slate-400">Loading post details...</div>
              </div>
            </div>
          ) : !post ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-slate-600 mb-4" />
              <p className="text-slate-400 mb-2">Post not found</p>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="mt-2 border-slate-700 hover:bg-slate-800"
              >
                Close
              </Button>
            </div>
          ) : (
            <>
              {/* Status */}
              <div className="flex items-center gap-2">
                <StatusPill status={post.status} />
                <span className="text-xs text-slate-400">
                  {(post.status === "SCHEDULED" || post.status === "PUBLISHING") && scheduledDate
                    ? `Scheduled for ${scheduledDate.format("MMM D, YYYY [at] h:mm A")} (${timezoneAbbr})`
                    : post.status === "POSTED"
                      ? "Published"
                    : post.status === "DRAFT"
                        ? "Draft"
                        : post.status === "PUBLISHING"
                          ? "Publishing"
                        : "Failed"}
                </span>
              </div>

              {/* Media Preview */}
              {mediaUrl && (
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 overflow-hidden">
                  <div className="relative w-full aspect-video bg-slate-900">
                    {(post.asset?.type === "VIDEO" || (anyPost?.media && anyPost.media[0]?.mediaType === "VIDEO")) ? (
                      <video
                        src={mediaUrl}
                        controls
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Image
                        src={mediaUrl}
                        alt="Post media"
                        fill
                        sizes="(max-width: 768px) 100vw, 672px"
                        className="object-contain"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Caption */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">Caption</span>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-sm text-white whitespace-pre-wrap">
                    {post.caption || "No caption"}
                  </p>
                </div>
              </div>

              {/* Hashtags */}
              {post.hashtags &&
                Array.isArray(post.hashtags) &&
                post.hashtags.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Hash className="h-4 w-4" />
                      <span className="font-medium">Hashtags</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {post.hashtags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-slate-800/70 px-3 py-1 text-xs font-semibold text-slate-200 border border-slate-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {/* Scheduled Time */}
              {scheduledDate && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Scheduled Time</span>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                    <p className="text-sm text-white">
                      {scheduledDate.format("dddd, MMMM D, YYYY [at] h:mm A")} (
                      {timezoneAbbr})
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {scheduledDate.fromNow()}
                    </p>
                  </div>
                </div>
              )}

              {/* Platforms */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <CalendarIcon className="h-4 w-4" color="#fbbf24" />
                  <span className="font-medium">Platforms</span>
                </div>
                <div className="space-y-2">
                  {post.targets.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      No platforms selected
                    </p>
                  ) : (
                    post.targets.map((target) => {
                      const Icon = platformIcons[target.platform];
                      const color = platformColors[target.platform];
                      return (
                        <div
                          key={target.id}
                          className="rounded-lg border border-slate-800 bg-slate-950/60 p-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className={clsx("h-5 w-5", color)} />
                              <span className="text-sm font-medium text-white">
                                {target.platform}
                              </span>
                              {target.socialAccount && (
                                <span className="text-xs text-slate-400">
                                  ({target.socialAccount.displayName})
                                </span>
                              )}
                            </div>
                            <StatusPill
                              status={
                                target.status === "PENDING"
                                  ? "SCHEDULED"
                                  : (target.status as
                                      | "DRAFT"
                                      | "SCHEDULED"
                                      | "POSTED"
                                      | "FAILED")
                              }
                            />
                          </div>
                          {target.publishedAt && (
                            <p className="text-xs text-slate-400 mt-2">
                              Published:{" "}
                              {dayjs(target.publishedAt).format(
                                "MMM D, YYYY [at] h:mm A"
                              )}
                            </p>
                          )}
                          {target.errorMessage && (
                            <div className="mt-2 rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1">
                              <p className="text-xs text-rose-300">
                                {target.errorMessage}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {post && !loading && (
          <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-800">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-slate-300 hover:text-white"
            >
              Close
            </Button>
            
            {isAdmin && (
              <>
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="border-rose-500/50 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button
                  onClick={handleEdit}
                  className="bg-lime-400 text-slate-900 hover:bg-lime-300"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
