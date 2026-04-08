import { Badge } from "@/components/ui/badge";
import clsx from "clsx";

type PostStatus = "DRAFT" | "SCHEDULED" | "PUBLISHING" | "POSTED" | "FAILED";

interface StatusPillProps {
  status: PostStatus;
  className?: string;
}

const statusStyles: Record<PostStatus, string> = {
  DRAFT: "bg-slate-100/10 text-slate-500 border-slate-500/30",
  SCHEDULED: "bg-amber-100/15 text-amber-600 border-amber-600/30",
  PUBLISHING: "bg-amber-100/15 text-amber-600 border-amber-600/30",
  POSTED: "bg-emerald-100/15 text-emerald-600 border-emerald-600/30",
  FAILED: "bg-rose-100/15 text-rose-600 border-rose-600/30",
};

export function StatusPill({ status, className }: StatusPillProps) {
  return (
    <Badge
      variant="outline"
      className={clsx(
        "text-xs font-medium px-2 py-0.5 border",
        statusStyles[status],
        className
      )}
    >
      {status}
    </Badge>
  );
}








