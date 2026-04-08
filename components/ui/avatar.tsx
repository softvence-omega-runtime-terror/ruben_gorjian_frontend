"use client";

import Image from "next/image";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
}

export function Avatar({ src, alt, fallback, className, ...props }: AvatarProps) {
  return (
    <div
      className={cn(
        "relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-800 bg-slate-800 text-sm font-semibold text-slate-100",
        className
      )}
      {...props}
    >
      {src ? (
        <Image
          src={src}
          alt={alt || "Avatar"}
          fill
          sizes="40px"
          className="object-cover"
        />
      ) : (
        <span>{fallback}</span>
      )}
    </div>
  );
}
