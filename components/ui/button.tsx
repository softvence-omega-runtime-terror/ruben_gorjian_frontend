"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "default";
type Size = "sm" | "md" | "lg" | "icon";

const base =
  "inline-flex items-center justify-center rounded-md text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-lime-300 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-60 disabled:cursor-not-allowed";

const variantClasses: Record<Variant, string> = {
  primary: "bg-lime-400 text-slate-950 hover:bg-lime-300",
  secondary: "border border-slate-700 bg-slate-900 text-slate-50 hover:bg-slate-800",
  ghost: "text-slate-100 hover:bg-slate-800/70",
  outline: "border border-slate-700 text-slate-100 hover:bg-slate-800/60",
  default: "bg-slate-200 text-slate-900 hover:bg-slate-100",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4",
  lg: "h-11 px-5 text-base",
  icon: "h-10 w-10",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(base, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    />
  )
);
Button.displayName = "Button";
