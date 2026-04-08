"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type SheetContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const SheetContext = React.createContext<SheetContextValue | null>(null);

type SheetProps = {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function Sheet({ children, open: openProp, onOpenChange }: SheetProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = openProp ?? uncontrolledOpen;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (openProp === undefined) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [openProp, onOpenChange]
  );

  return <SheetContext.Provider value={{ open, setOpen }}>{children}</SheetContext.Provider>;
}

type SheetTriggerProps = {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
};

export function SheetTrigger({ children, className, asChild }: SheetTriggerProps) {
  const ctx = useSheet();

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ className?: string; onClick?: (e: React.MouseEvent) => void }>;
    const mergedClassName = cn(child.props?.className, className);
    return React.cloneElement(child, {
      className: mergedClassName,
      onClick: (e: React.MouseEvent) => {
        child.props?.onClick?.(e);
        if (!e.defaultPrevented) ctx.setOpen(true);
      },
    });
  }

  return (
    <button
      type="button"
      onClick={() => ctx.setOpen(true)}
      className={cn("inline-flex items-center justify-center", className)}
    >
      {children}
    </button>
  );
}

type SheetContentProps = {
  side?: "left" | "right";
  children: React.ReactNode;
  className?: string;
};

export function SheetContent({ side = "left", children, className }: SheetContentProps) {
  const ctx = useSheet();
  if (!ctx.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50" onClick={() => ctx.setOpen(false)} />
      <div
        className={cn(
          "relative h-full w-72 max-w-[80vw] bg-slate-900 border border-slate-800 shadow-xl",
          side === "left" ? "ml-0" : "ml-auto",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-4 pt-4 pb-2 border-b border-slate-800", className)} {...props} />;
}

export function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-base font-semibold text-white", className)} {...props} />;
}

export function SheetDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-1 text-sm text-slate-400", className)} {...props} />;
}

export function SheetClose({ children, className }: { children: React.ReactNode; className?: string }) {
  const ctx = useSheet();
  return (
    <button
      type="button"
      onClick={() => ctx.setOpen(false)}
      className={cn("inline-flex items-center", className)}
    >
      {children}
    </button>
  );
}

function useSheet() {
  const ctx = React.useContext(SheetContext);
  if (!ctx) throw new Error("Sheet components must be used within <Sheet>");
  return ctx;
}
