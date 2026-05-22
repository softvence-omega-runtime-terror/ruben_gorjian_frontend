import { Badge } from "@/components/ui/badge";
import { Instagram, Facebook, Linkedin } from "lucide-react";
import clsx from "clsx";

type Platform = "INSTAGRAM" | "FACEBOOK" | "LINKEDIN";

interface PlatformChipProps {
  platform: Platform;
  status?: string;
  errorMessage?: string | null;
  className?: string;
}

const platformIcons: Record<Platform, typeof Instagram> = {
  INSTAGRAM: Instagram,
  FACEBOOK: Facebook,
  LINKEDIN: Linkedin,
};

const platformColors: Record<Platform, string> = {
  INSTAGRAM: "text-pink-500",
  FACEBOOK: "text-blue-500",
  LINKEDIN: "text-blue-600",
};

export function PlatformChip({
  platform,
  status,
  errorMessage,
  className,
}: PlatformChipProps) {
  const Icon = platformIcons[platform];
  const isFailed = status === "FAILED";
  const isPosted = status === "POSTED";

  return (
    <Badge
      variant="outline"
      className={clsx(
        "text-xs px-1.5 py-0.5 border-slate-700/50 bg-slate-800/30",
        isFailed && "border-rose-600/50 bg-rose-100/10",
        isPosted && "border-emerald-600/50 bg-emerald-100/10",
        className
      )}
      title={errorMessage || undefined}
    >
      <Icon className={clsx("h-3 w-3 mr-1", platformColors[platform])} />
      <span className="text-slate-300">{platform}</span>
      {isFailed && <span className="ml-1 text-rose-500">⚠</span>}
      {isPosted && <span className="ml-1 text-emerald-500">✓</span>}
    </Badge>
  );
}









