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
=======
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
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);
import {
  Edit2,
  X,
  Calendar as CalendarIcon,
  Clock,
  Hash,
  FileText,
  AlertCircle,
  Trash2,
  User as UserIcon,
  ExternalLink,
  ImageIcon,
} from "lucide-react";
import {
  FaFacebook as Facebook,
  FaInstagram as Instagram,
  FaLinkedin as Linkedin,
  FaTiktok as Tiktok,
} from "react-icons/fa";
import NextImage from "next/image";

import { getEnvVarWithDefault } from "@/lib/env-utils";

const STORAGE_BASE_URL = getEnvVarWithDefault("NEXT_PUBLIC_STORAGE_BASE_URL", "");

const platformIcons = {
  INSTAGRAM: Instagram,
  FACEBOOK: Facebook,
  LINKEDIN: Linkedin,
  TIKTOK: Tiktok,
};

const platformColors = {
  INSTAGRAM: "text-rose-500",
  FACEBOOK: "text-blue-500",
  LINKEDIN: "text-sky-600",
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
  user?: {
    id: string;
    name: string | null;
    fullName: string | null;
    email: string;
  };
  author?: {
    id: string;
    email: string;
    name: string;
  };
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
  const { timezone: userTimezone, timezoneAbbr } = useTimezone();
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

  const scheduledDate = post?.scheduledFor 
    ? dayjs.tz(post.scheduledFor, userTimezone) 
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
      <style jsx>{`
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />
      
      <div
        className="relative w-full max-w-2xl bg-slate-900/90 border border-slate-800 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh] overflow-hidden"
        style={{ animation: 'modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Top Accent Strip */}
        <div className={clsx(
           "h-1.5 w-full shrink-0",
           post?.status === 'POSTED' ? "bg-gradient-to-r from-emerald-500 to-teal-400" :
           post?.status === 'FAILED' ? "bg-gradient-to-r from-rose-500 to-pink-500" :
           "bg-gradient-to-r from-amber-400 to-orange-500"
        )} />

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 shrink-0 transition-all">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
               Post Intelligence
               {post?.status === 'PUBLISHING' && (
                 <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping inline-block" />
               )}
            </h3>
            <div className="flex items-center gap-3 text-xs text-slate-400">
               <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {scheduledDate?.format('MMM D, HH:mm')}
               </span>
               <span className="w-1 h-1 rounded-full bg-slate-700" />
               <span className="flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {scheduledDate?.fromNow()}
               </span>
            </div>
          </div>
          <button 
             onClick={onClose}
             className="p-2 rounded-full hover:bg-slate-800 text-slate-500 hover:text-white transition-all transform hover:rotate-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Area */}
        <div 
          className="flex-1 overflow-y-auto px-6 py-2 space-y-6 scrollbar-hide overscroll-contain"
          {...scrollHandlers}
        >
          {loading ? (
             <div className="py-20 flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-slate-800 border-t-amber-400 rounded-full animate-spin" />
                <span className="text-slate-400 animate-pulse">Analyzing Post Data...</span>
             </div>
          ) : !post ? (
             <div className="py-20 text-center">
                <AlertCircle className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <h4 className="text-xl text-slate-300 font-medium">Data Sync Error</h4>
                <p className="text-slate-500 text-sm mt-1">This post record could not be retrieved from the cluster.</p>
             </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Core Analytics / Status */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                 <div className="bg-slate-800/40 border border-slate-700/50 p-3 rounded-2xl flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Status</span>
                    <StatusPill status={post.status} />
                 </div>
                 <div className="bg-slate-800/40 border border-slate-700/50 p-3 rounded-2xl flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Platforms</span>
                    <span className="text-sm font-semibold text-white">{post.targets.length} connected</span>
                 </div>
                 <div className="bg-slate-800/40 border border-slate-700/50 p-3 rounded-2xl flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Media</span>
                    <span className="text-sm font-semibold text-white">{mediaUrl ? "Attached" : "Null"}</span>
                 </div>
                 <div className="bg-slate-800/40 border border-slate-700/50 p-3 rounded-2xl flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">TZ</span>
                    <span className="text-sm font-semibold text-amber-400">{timezoneAbbr}</span>
                 </div>
              </div>

              {/* Admin Context */}
              {isAdmin && (post.user || post.author) && (
                <div className="p-4 bg-lime-400/10 border border-lime-400/20 rounded-2xl flex items-center gap-4">
                   <div className="p-2.5 bg-lime-400/20 rounded-xl">
                      <UserIcon className="w-5 h-5 text-lime-400" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-xs text-lime-400 font-bold uppercase tracking-widest">Post Origin</p>
                      <h5 className="text-sm font-medium text-white truncate">
                         {post.user?.fullName || post.user?.name || post.author?.name || post.user?.email || "Managed Account"}
                      </h5>
                   </div>
                   <Button variant="ghost" size="sm" className="text-lime-400 hover:bg-lime-400/10 text-xs">
                      View Profile
                   </Button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Left Column: Context */}
                 <div className="space-y-6">
                    <div className="space-y-3">
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-400" />
                          Caption Strategy
                       </label>
                       <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-inner min-h-[120px] relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <ExternalLink className="w-4 h-4 text-slate-600" />
                          </div>
                          <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap selection:bg-amber-400 selection:text-slate-900">
                             {post.caption === '.' ? <span className="text-slate-500 italic">No primary caption provided.</span> : post.caption}
                          </p>
                       </div>
                    </div>

                    {post.hashtags && Array.isArray(post.hashtags) && post.hashtags.length > 0 && (
                      <div className="space-y-3">
                         <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Hash className="w-4 h-4 text-sky-400" />
                            Target Hashtags
                         </label>
                         <div className="flex flex-wrap gap-2">
                            {post.hashtags.map((tag, idx) => (
                              <span key={idx} className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-3 py-1.5 rounded-xl text-xs font-medium hover:scale-105 transition-transform cursor-default">
                                {tag}
                              </span>
                            ))}
                         </div>
                      </div>
                    )}
                 </div>

                 {/* Right Column: Visual Preview */}
                 <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                       <ImageIcon className="w-4 h-4 text-pink-400" />
                       Media Asset
                    </label>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden group relative aspect-[4/5] sm:aspect-square">
                       {mediaUrl ? (
                         <>
                            {(post.asset?.type === "VIDEO" || (anyPost?.media && anyPost.media[0]?.mediaType === "VIDEO")) ? (
                              <video src={mediaUrl} controls className="w-full h-full object-cover" />
                            ) : (
                              <NextImage 
                                src={mediaUrl} 
                                alt="Post media" 
                                fill 
                                className="object-cover transition-transform duration-700 group-hover:scale-110" 
                                unoptimized
                              />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                               <span className="text-xs text-white font-medium drop-shadow-md">Original Media File</span>
                            </div>
                         </>
                       ) : (
                         <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-slate-900/50">
                            <AlertCircle className="w-10 h-10 text-slate-800" />
                            <span className="text-xs text-slate-600">Visual post component empty.</span>
                         </div>
                       )}
                    </div>
                 </div>
              </div>

              {/* Target Platforms Detail */}
              <div className="space-y-4">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Platform Distribution Pipeline
                 </label>
                 <div className="grid grid-cols-1 gap-3">
                    {post.targets.map((target) => {
                       const Icon = platformIcons[target.platform];
                       const color = platformColors[target.platform];
                       return (
                         <div key={target.id} className="bg-slate-800/30 border border-slate-800 hover:border-slate-700/80 transition-all rounded-2xl p-4 flex items-center gap-4 group">
                            <div className={clsx("p-3 rounded-2xl bg-slate-900 group-hover:scale-110 transition-transform", color)}>
                               <Icon className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                               <div className="flex items-center gap-2">
                                  <span className="font-bold text-white text-sm">{target.platform}</span>
                                  {target.socialAccount && (
                                    <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-[10px] text-slate-400 border border-slate-800">
                                       @{target.socialAccount.displayName}
                                    </span>
                                  )}
                               </div>
                               {target.publishedAt && (
                                 <p className="text-[10px] text-slate-500 mt-0.5">
                                    Published {dayjs.tz(target.publishedAt, userTimezone).format('MMM D [at] HH:mm')}
                                 </p>
                               )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                               <StatusPill status={target.status === 'PENDING' ? 'SCHEDULED' : (target.status as any)} />
                               {target.errorMessage && (
                                  <div className="flex items-center gap-1.5 text-rose-400 group/err relative">
                                     <AlertCircle className="w-3.5 h-3.5" />
                                     <span className="text-[10px] font-bold max-w-[100px] truncate">{target.errorMessage}</span>
                                     <div className="absolute right-0 bottom-full mb-2 w-48 p-2 bg-rose-950 border border-rose-500/50 rounded-lg text-[10px] text-white opacity-0 group-hover/err:opacity-100 transition-opacity z-50">
                                        {target.errorMessage}
                                     </div>
                                  </div>
                               )}
                            </div>
                         </div>
                       );
                    })}
                 </div>
              </div>

            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-6 shrink-0 border-t border-slate-800 bg-slate-950/50 flex flex-col sm:flex-row gap-3">
            <Button 
               variant="outline" 
               onClick={onClose} 
               className="border-slate-800 bg-transparent text-slate-400 hover:text-white hover:bg-slate-800 flex-1 order-2 sm:order-1"
            >
               Close
            </Button>
            <div className="flex gap-2 flex-[2] order-1 sm:order-2">
               {isAdmin && (
                 <Button
                    variant="ghost"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 border-rose-500/20 text-rose-400 hover:bg-rose-500/10"
                 >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Archive
                 </Button>
               )}
               <Button
                 onClick={handleEdit}
                 className="flex-1 bg-gradient-to-r from-lime-400 to-lime-500 text-slate-950 font-bold hover:shadow-[0_0_20px_rgba(163,230,53,0.3)] transition-all"
               >
                 <Edit2 className="w-4 h-4 mr-2" />
                 Optimization
               </Button>
            </div>
        </div>
      </div>
    </div>
  );
}

