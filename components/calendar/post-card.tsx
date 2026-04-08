import Image from "next/image";
import { StatusPill } from "./status-pill";
import { PlatformChip } from "./platform-chip";
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit2, Copy, Trash2, Send } from "lucide-react";
import dayjs from "dayjs";
import clsx from "clsx";
import { useState } from "react";
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
    socialAccount?: { displayName: string };
  }>;
};

interface PostCardProps {
  post: CalendarPost;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onPublish?: () => void;
  compact?: boolean;
}

import { getEnvVarWithDefault } from "@/lib/env-utils";

const STORAGE_BASE_URL = getEnvVarWithDefault("NEXT_PUBLIC_STORAGE_BASE_URL", "");

export function PostCard({
  post,
  onEdit,
  onDelete,
  onDuplicate,
  onPublish,
  compact = false,
}: PostCardProps) {
  const { session } = useSessionContext();
  const isAdmin = session?.role === "ADMIN";
  const [showActions, setShowActions] = useState(false);
  const mediaUrl = post.asset?.storageKey
    ? buildStorageUrl(STORAGE_BASE_URL, post.asset.storageKey)
    : null;

  const hashtags = Array.isArray(post.hashtags)
    ? post.hashtags
    : typeof post.hashtags === "string"
      ? [post.hashtags]
      : [];

  const hasErrors = post.targets.some((t) => t.errorMessage);

  if (compact) {
    return (
      <div
        className={clsx(
          "group rounded-lg border bg-slate-900/40 border-slate-800/50 p-2 transition-all hover:border-slate-700 hover:bg-slate-900/60",
          post.status === "FAILED" && "border-rose-600/30 bg-rose-950/20",
          post.status === "POSTED" && "border-emerald-600/30 bg-emerald-950/20"
        )}
      >
        <div className="flex items-start gap-2">
          {mediaUrl && (
            <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden bg-slate-800">
              <Image
                src={mediaUrl}
                alt=""
                width={48}
                height={48}
                className="w-full h-full object-cover"
                unoptimized
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <StatusPill status={post.status} />
                <span className="text-xs text-slate-400">
                  {dayjs(post.scheduledFor).format("HH:mm")}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setShowActions(!showActions)}
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-xs text-slate-200 line-clamp-2 mb-1.5">
              {post.caption || "No caption"}
            </p>
            <div className="flex items-center gap-1 flex-wrap">
              {post.targets.map((target) => (
                <PlatformChip
                  key={target.id}
                  platform={target.platform}
                  status={target.status}
                  errorMessage={target.errorMessage}
                />
              ))}
            </div>
            {hashtags.length > 0 && (
              <div className="mt-1.5 text-xs text-slate-400 line-clamp-1">
                {hashtags.slice(0, 3).join(" ")}
                {hashtags.length > 3 && ` +${hashtags.length - 3}`}
              </div>
            )}
          </div>
        </div>
        {hasErrors && (
          <div className="mt-2 pt-2 border-t border-slate-800/50 space-y-1">
            {post.targets
              .filter((t) => t.errorMessage)
              .map((target) => (
                <div
                  key={target.id}
                  className="text-xs text-rose-500 bg-rose-950/30 rounded px-2 py-1"
                >
                  <span className="font-medium">{target.platform}:</span>{" "}
                  {target.errorMessage}
                </div>
              ))}
          </div>
        )}
        {showActions && (
          <div className="mt-2 pt-2 border-t border-slate-800/50 flex gap-1">
            {onEdit && post.status !== "POSTED" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  onEdit();
                  setShowActions(false);
                }}
              >
                <Edit2 className="h-3 w-3 mr-1" />
                Edit
              </Button>
            )}
            {onDuplicate && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  onDuplicate();
                  setShowActions(false);
                }}
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            )}
            {onPublish && post.status !== "POSTED" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  onPublish();
                  setShowActions(false);
                }}
              >
                <Send className="h-3 w-3 mr-1" />
                Publish
              </Button>
            )}
            {isAdmin && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-rose-500 hover:text-rose-400"
                onClick={() => {
                  onDelete();
                  setShowActions(false);
                }}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "group rounded-lg border bg-slate-900/40 border-slate-800/50 p-3 transition-all hover:border-slate-700 hover:bg-slate-900/60 hover:shadow-lg",
        post.status === "FAILED" && "border-rose-600/30 bg-rose-950/20",
        post.status === "POSTED" && "border-emerald-600/30 bg-emerald-950/20"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <StatusPill status={post.status} />
          <span className="text-xs text-slate-400">
            {dayjs(post.scheduledFor).format("MMM D, HH:mm")}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setShowActions(!showActions)}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-3 mb-3">
        {mediaUrl && (
          <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-slate-800 border border-slate-800">
            <Image
              src={mediaUrl}
              alt=""
              width={80}
              height={80}
              className="w-full h-full object-cover"
              unoptimized
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-200 line-clamp-2 mb-2">
            {post.caption || "No caption"}
          </p>
          {hashtags.length > 0 && (
            <div className="text-xs text-slate-400 line-clamp-2 mb-2">
              {hashtags.slice(0, 5).join(" ")}
              {hashtags.length > 5 && ` +${hashtags.length - 5} more`}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap mb-2">
        {post.targets.map((target) => (
          <PlatformChip
            key={target.id}
            platform={target.platform}
            status={target.status}
            errorMessage={target.errorMessage}
          />
        ))}
      </div>

      {hasErrors && (
        <div className="mt-2 pt-2 border-t border-slate-800/50 space-y-1">
          {post.targets
            .filter((t) => t.errorMessage)
            .map((target) => (
              <div
                key={target.id}
                className="text-xs text-rose-500 bg-rose-950/30 rounded px-2 py-1"
              >
                <span className="font-medium">{target.platform}:</span>{" "}
                {target.errorMessage}
              </div>
            ))}
        </div>
      )}

      {showActions && (
        <div className="mt-3 pt-3 border-t border-slate-800/50 flex gap-2 flex-wrap">
          {onEdit && post.status !== "POSTED" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                onEdit();
                setShowActions(false);
              }}
            >
              <Edit2 className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
          )}
          {onDuplicate && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                onDuplicate();
                setShowActions(false);
              }}
            >
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Duplicate
            </Button>
          )}
          {onPublish && post.status !== "POSTED" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                onPublish();
                setShowActions(false);
              }}
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              Publish Now
            </Button>
          )}
          {isAdmin && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-rose-500 hover:text-rose-400"
              onClick={() => {
                onDelete();
                setShowActions(false);
              }}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete
            </Button>
          )}
        </div>
      )}
    </div>
  );
}


