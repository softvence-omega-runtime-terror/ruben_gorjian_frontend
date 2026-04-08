"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white shadow-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-lime-300 focus:border-lime-300",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
