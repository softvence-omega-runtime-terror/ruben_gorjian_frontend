"use client";

import { memo, useRef, useEffect } from "react";
import Image from "next/image";
import { useDrag } from "react-dnd";
import dayjs from "dayjs";
import clsx from "clsx";
import { Copy, Send, Trash2, AlertCircle, Edit2 } from "lucide-react";
import { FaInstagram, FaFacebook, FaLinkedin, FaTiktok } from "react-icons/fa";
import type { Dayjs } from "dayjs";
import { buildStorageUrl } from "@/lib/storage-utils";
import { useSessionContext } from "@/context/SessionContext";

type CalendarPost = {
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
    status: string;
    errorMessage?: string | null;
    socialAccount?: {
      id: string;
      displayName: string;
    };
  }>;
};

interface CalendarItemProps {
  post: CalendarPost;
  date: Dayjs;
  isBeforeNow: boolean;
  display: "day" | "week" | "month";
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onPublish?: () => void;
}

import { getEnvVarWithDefault } from "@/lib/env-utils";

const STORAGE_BASE_URL = getEnvVarWithDefault(
  "NEXT_PUBLIC_STORAGE_BASE_URL",
  "",
);

const platformIcons = {
  INSTAGRAM: FaInstagram,
  FACEBOOK: FaFacebook,
  LINKEDIN: FaLinkedin,
  TIKTOK: FaTiktok,
};

const platformColors = {
  INSTAGRAM: "text-pink-500",
  FACEBOOK: "text-blue-500",
  LINKEDIN: "text-blue-600",
  TIKTOK: "text-white",
};

export const CalendarItem = memo<CalendarItemProps>(
  ({
    post,
    date, // eslint-disable-line @typescript-eslint/no-unused-vars -- required by CalendarItemProps
    isBeforeNow,
    display, // eslint-disable-line @typescript-eslint/no-unused-vars -- required by CalendarItemProps
    onEdit,
    onDuplicate,
    onDelete,
    onPublish,
  }) => {
    // date and display are part of the public props but not used in this compact view
    // Prevent dragging POSTED posts
    const canDrag = post.status !== "POSTED";

    const [{ opacity }, dragRef] = useDrag(
      () => ({
        type: "post",
        item: {
          id: post.id,
          scheduledFor: post.scheduledFor,
        },
        canDrag: canDrag,
        collect: (monitor) => ({
          opacity: monitor.isDragging() ? 0.5 : 1,
        }),
      }),
      [post.id, canDrag],
    );

    const dragElementRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
      dragRef(dragElementRef);
    }, [dragRef]);

    const anyPost = post as any;
    let mediaUrl = null;
    if (post.asset?.storageKey) {
      mediaUrl = buildStorageUrl(STORAGE_BASE_URL, post.asset.storageKey);
    } else if (anyPost.media && anyPost.media.length > 0) {
      mediaUrl = anyPost.media[0].url || buildStorageUrl(STORAGE_BASE_URL, anyPost.media[0].storageKey);
    } else if (anyPost.assets && anyPost.assets.length > 0) {
      mediaUrl = anyPost.assets[0];
    }

    const platforms = post.targets.map((t) => t.platform);
    const primaryPlatform = platforms[0];
    const PrimaryIcon = primaryPlatform ? platformIcons[primaryPlatform] : null;

    const statusColor = {
      DRAFT: "bg-slate-600",
      SCHEDULED: "bg-amber-600",
      PUBLISHING: "bg-amber-600",
      POSTED: "bg-emerald-600",
      FAILED: "bg-rose-600",
    }[post.status];

    const { session } = useSessionContext();
    const isAdmin = session?.role === "ADMIN" || session?.role === "SUPER_ADMIN";
    const needsMedia = platforms.some(p => p === "INSTAGRAM" || p === "TIKTOK");
    const isMissingContent = needsMedia && !mediaUrl && (!post.caption || post.caption.trim() === "");

    return (
      <div
        ref={canDrag ? dragElementRef : null}
        className={clsx(
          "w-full h-14 flex rounded-[10px] overflow-hidden group relative",
          "border border-slate-700/50 shadow-sm",
          isBeforeNow && "opacity-60",
          !canDrag && "cursor-default",
        )}
        style={{ opacity }}
      >
        {/* Left accent stripe - status color */}
        <div
          className={clsx(
            "w-1 min-w-[4px] flex-shrink-0 rounded-l-[10px]",
            statusColor,
          )}
        />
        {/* Compact content: thumbnail, time, platform icons */}
        <div
          onClick={onEdit}
          className={clsx(
            "flex-1 min-w-0 h-full flex flex-row items-center gap-2 px-2",
            "bg-slate-800/70 hover:bg-slate-800/90 transition-colors cursor-pointer",
            isBeforeNow && "grayscale",
          )}
        >
          {/* Thumbnail or platform icon */}
          <div className="relative flex-shrink-0">
            {mediaUrl ? (
              <Image
                className="w-9 h-9 rounded-[6px] object-cover"
                src={mediaUrl}
                alt=""
                width={36}
                height={36}
                unoptimized
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div 
                className={clsx(
                  "w-9 h-9 rounded-[6px] flex items-center justify-center",
                  isMissingContent ? "bg-amber-500/20 border border-amber-500/50" : "bg-slate-700"
                )}
                title={isMissingContent ? "Missing content" : undefined}
              >
                {isMissingContent ? (
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                ) : (
                  PrimaryIcon && (
                    <PrimaryIcon
                      className={clsx("h-4 w-4", platformColors[primaryPlatform])}
                    />
                  )
                )}
              </div>
            )}
            {platforms.length > 0 && (
              <div className="absolute -bottom-0.5 -right-0.5 z-10 flex items-center gap-0.5">
                {platforms.slice(0, 2).map((platform) => {
                  const Icon = platformIcons[platform];
                  return (
                    <div
                      key={platform}
                      className="w-[10px] h-[10px] rounded-[4px] bg-slate-900 border border-slate-600 flex items-center justify-center"
                    >
                      <Icon
                        className={clsx("h-2 w-2", platformColors[platform])}
                      />
                    </div>
                  );
                })}
                {platforms.length > 2 && (
                  <div className="w-[10px] h-[10px] rounded-[4px] bg-slate-700 text-[8px] flex items-center justify-center">
                    +{platforms.length - 2}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Time only - details in modal */}
          <span className="text-[11px] text-slate-400 tabular-nums shrink-0">
            {post.status === "DRAFT" ? "Draft " : ""}
            {dayjs(post.scheduledFor).format("HH:mm")}
          </span>

          {/* Hover actions */}
          <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0 ml-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1.5 rounded-md hover:bg-slate-600/50 transition-colors"
              title="Edit post"
            >
              <Edit2 className="h-4 w-4 text-slate-300 hover:text-white" />
            </button>
            {isAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                }}
                className="p-1.5 rounded-md hover:bg-slate-600/50 transition-colors"
                title="Duplicate"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            )}
            {isAdmin && onPublish && post.status !== "POSTED" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPublish?.();
                }}
                className="p-1.5 rounded-md hover:bg-slate-600/50 transition-colors"
                title={isMissingContent ? "Publishing without content may fail" : "Publish now"}
              >
                <Send className="h-3.5 w-3.5 text-lime-400" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 rounded-md hover:bg-slate-600/50 hover:text-rose-400 text-slate-400 transition-colors"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  },
);

CalendarItem.displayName = "CalendarItem";
