"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useScrollPropagation } from "@/hooks/use-scroll-propagation";

type DialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DialogContext = React.createContext<DialogContextValue | null>(null);

export function Dialog({ children, open: controlledOpen, onOpenChange }: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = React.useCallback((value: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(value);
    } else {
      onOpenChange?.(value);
    }
  }, [controlledOpen, onOpenChange]);

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogTrigger({ children, className }: {
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = useDialog();
  return (
    <button
      type="button"
      onClick={() => ctx.setOpen(true)}
      className={className}
    >
      {children}
    </button>
  );
}

export function DialogContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = useDialog();
  const scrollHandlers = useScrollPropagation({ scrollWindowAtBoundary: true });
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!ctx.open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => ctx.setOpen(false)}
        aria-hidden="true"
      />
      <div
        className={cn(
          "relative z-[100] flex max-h-[90vh] w-full max-w-md flex-col rounded-2xl border border-slate-700/50 bg-slate-900 shadow-2xl overflow-hidden",
          className
        )}
      >
        <div
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-6 scroll-smooth"
          {...scrollHandlers}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

export function DialogHeader({ children, className }: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4", className)}>
      {children}
    </div>
  );
}

export function DialogTitle({ children, className }: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("text-lg font-semibold text-white", className)}>
      {children}
    </h2>
  );
}

export function DialogDescription({ children, className }: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-sm text-slate-400", className)}>
      {children}
    </p>
  );
}

export function DialogFooter({ children, className }: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mt-6 flex justify-end gap-2", className)}>
      {children}
    </div>
  );
}

export function DialogClose({ children, className }: {
  children?: React.ReactNode;
  className?: string;
}) {
  const ctx = useDialog();
  return (
    <button
      type="button"
      onClick={() => ctx.setOpen(false)}
      className={cn(
        "absolute right-4 top-4 z-10 rounded-sm text-slate-400 hover:text-white",
        className
      )}
    >
      {children || <X className="h-4 w-4" />}
    </button>
  );
}

function useDialog() {
  const ctx = React.useContext(DialogContext);
  if (!ctx) throw new Error("Dialog components must be used within <Dialog>");
  return ctx;
}

