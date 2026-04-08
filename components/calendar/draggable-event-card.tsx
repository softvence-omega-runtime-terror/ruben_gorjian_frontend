"use client";

import { useState } from "react";
import Image from "next/image";
import { useDrag, useDrop } from "react-dnd";
import { StatusPill } from "./status-pill";
import dayjs from "dayjs";
import clsx from "clsx";
import { FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa";
import { buildStorageUrl } from "@/lib/storage-utils";

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
    platform: "INSTAGRAM" | "FACEBOOK" | "LINKEDIN";
    status: string;
    errorMessage?: string | null;
  }>;
  // Client-side metadata for span/recurrence
  spanDays?: number[]; // Array of day indices (0-6 for week, or dates for month)
};

interface DraggableEventCardProps {
  post: CalendarPost;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onPublish?: () => void;
  compact?: boolean;
  isSpanning?: boolean;
  spanStart?: number;
  spanEnd?: number;
  viewType?: "month" | "week";
  onDragEnd?: (postId: string, newDate: Date) => void;
}

import { getEnvVarWithDefault } from "@/lib/env-utils";

const STORAGE_BASE_URL = getEnvVarWithDefault("NEXT_PUBLIC_STORAGE_BASE_URL", "");

const platformIcons = {
  INSTAGRAM: FaInstagram,
  FACEBOOK: FaFacebook,
  LINKEDIN: FaLinkedin,
};

export function DraggableEventCard({
  post,
  onEdit,
  compact = false,
  isSpanning = false,
  spanStart,
  spanEnd,
  onDragEnd,
}: DraggableEventCardProps) {
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  const [{ isDragging: isDragActive }, drag] = useDrag({
    type: "post",
    item: { id: post.id, scheduledFor: post.scheduledFor },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (_item, monitor) => {
      const dropResult = monitor.getDropResult<{ date: Date; hour?: number }>();
      if (dropResult && onDragEnd) {
        onDragEnd(post.id, dropResult.date);
      }
    },
  });

  const [{ isOver }, drop] = useDrop({
    accept: "post",
    drop: () => {
      // Handle reordering within same day
      return { date: new Date(post.scheduledFor) };
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const mediaUrl = post.asset?.storageKey
    ? buildStorageUrl(STORAGE_BASE_URL, post.asset.storageKey)
    : null;

  const hashtags = Array.isArray(post.hashtags)
    ? post.hashtags
    : typeof post.hashtags === "string"
      ? [post.hashtags]
      : [];

  const timeStr = dayjs(post.scheduledFor).format("HH:mm");
  const platforms = post.targets.map((t) => t.platform);

  // Handle long press for mobile
  const handleTouchStart = () => {
    const timer = setTimeout(() => {
      // Long press detected - drag will be initiated by react-dnd
    }, 500);
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Compact view for grid cells
  if (compact) {
    return (
      <div
        ref={(node) => {
          drag(node);
          drop(node);
        }}
        className={clsx(
          "group rounded-md border bg-slate-900/60 border-slate-800/50 p-1.5 transition-all cursor-move",
          "hover:border-slate-700 hover:bg-slate-900/80 hover:shadow-md",
          isDragActive && "opacity-50 scale-95",
          isOver && "ring-2 ring-amber-500/50",
          post.status === "FAILED" && "border-rose-600/30 bg-rose-950/20",
          post.status === "POSTED" && "border-emerald-600/30 bg-emerald-950/20",
          post.status === "SCHEDULED" && "border-amber-600/30 bg-amber-950/20",
          post.status === "PUBLISHING" && "border-amber-600/30 bg-amber-950/20",
          isSpanning && "bg-gradient-to-r from-amber-950/30 to-transparent"
        )}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={onEdit}
      >
        <div className="flex items-start gap-1.5">
          {mediaUrl && (
            <div className="flex-shrink-0 w-8 h-8 rounded overflow-hidden bg-slate-800 border border-slate-800">
              <Image
                src={mediaUrl}
                alt=""
                width={32}
                height={32}
                className="w-full h-full object-cover"
                unoptimized
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-0.5 flex-wrap">
              <StatusPill
                status={post.status}
                className="text-[10px] px-1 py-0"
              />
              <span className="text-[10px] text-slate-400">{timeStr}</span>
            </div>
            <p className="text-[10px] text-slate-200 line-clamp-1 leading-tight mb-1">
              {post.caption || "No caption"}
            </p>
            <div className="flex items-center gap-0.5 flex-wrap">
              {platforms.slice(0, 3).map((platform) => {
                const Icon = platformIcons[platform];
                return (
                  <Icon
                    key={platform}
                    className={clsx(
                      "h-2.5 w-2.5",
                      platform === "INSTAGRAM" && "text-pink-500",
                      platform === "FACEBOOK" && "text-blue-500",
                      platform === "LINKEDIN" && "text-blue-600"
                    )}
                  />
                );
              })}
              {platforms.length > 3 && (
                <span className="text-[9px] text-slate-500">
                  +{platforms.length - 3}
                </span>
              )}
            </div>
            {hashtags.length > 0 && (
              <div className="text-[9px] text-slate-500 line-clamp-1 mt-0.5">
                {hashtags.slice(0, 2).join(" ")}
                {hashtags.length > 2 && ` +${hashtags.length - 2}`}
              </div>
            )}
          </div>
        </div>
        {isSpanning && spanStart !== undefined && spanEnd !== undefined && (
          <div className="absolute -top-1 -right-1 px-1 py-0.5 rounded-full bg-amber-950/50 border border-amber-600/30 text-[9px] text-amber-400">
            {spanEnd - spanStart + 1}d
          </div>
        )}
      </div>
    );
  }

  // Full card view for mobile/agenda
  return (
    <div
      ref={(node) => {
        drag(node);
        drop(node);
      }}
      className={clsx(
        "group rounded-lg border bg-slate-900/60 border-slate-800/50 p-3 transition-all cursor-move",
        "hover:border-slate-700 hover:bg-slate-900/80 hover:shadow-lg",
        isDragActive && "opacity-50 scale-95",
        isOver && "ring-2 ring-amber-500/50",
        post.status === "FAILED" && "border-rose-600/30 bg-rose-950/20",
        post.status === "POSTED" && "border-emerald-600/30 bg-emerald-950/20",
        post.status === "SCHEDULED" && "border-amber-600/30 bg-amber-950/20",
        post.status === "PUBLISHING" && "border-amber-600/30 bg-amber-950/20",
        isSpanning && "bg-gradient-to-r from-amber-950/30 to-transparent"
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={onEdit}
    >
      <div className="flex items-start gap-3">
        {mediaUrl && (
          <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-slate-800 border border-slate-800">
            <Image
              src={mediaUrl}
              alt=""
              width={64}
              height={64}
              className="w-full h-full object-cover"
              unoptimized
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <StatusPill status={post.status} />
            <span className="text-xs text-slate-400">{timeStr}</span>
            {isSpanning && spanStart !== undefined && spanEnd !== undefined && (
              <span className="px-2 py-0.5 rounded-full bg-amber-950/50 border border-amber-600/30 text-xs text-amber-400">
                {spanEnd - spanStart + 1} days
              </span>
            )}
          </div>
          <p className="text-sm text-slate-200 line-clamp-2 mb-2">
            {post.caption || "No caption"}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            {platforms.map((platform) => {
              const Icon = platformIcons[platform];
              return (
                <Icon
                  key={platform}
                  className={clsx(
                    "h-4 w-4",
                    platform === "INSTAGRAM" && "text-pink-500",
                    platform === "FACEBOOK" && "text-blue-500",
                    platform === "LINKEDIN" && "text-blue-600"
                  )}
                />
              );
            })}
          </div>
          {hashtags.length > 0 && (
            <div className="text-xs text-slate-400 line-clamp-1">
              {hashtags.slice(0, 5).join(" ")}
              {hashtags.length > 5 && ` +${hashtags.length - 5} more`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
