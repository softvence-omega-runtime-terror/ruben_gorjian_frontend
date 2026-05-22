"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Section {
  id: number;
  title: string;
}

interface OnboardingSectionRailProps {
  sections: Section[];
  currentStep: number;
  className?: string;
}

export function OnboardingSectionRail({
  sections,
  currentStep,
  className,
}: OnboardingSectionRailProps) {
  return (
    <aside
      className={cn(
        "hidden lg:block w-64 border-r border-slate-800 bg-slate-900/40 p-6",
        className
      )}
    >
      <div className="sticky top-20">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Sections
        </h3>
        <nav className="space-y-1">
          {sections.map((section) => {
            const isCompleted = section.id < currentStep;
            const isCurrent = section.id === currentStep;
            const isLocked = section.id > currentStep;

            return (
              <div
                key={section.id}
                className={cn(
                  "flex items-start gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isCurrent
                    ? "bg-lime-400/10 border border-lime-400/30"
                    : isCompleted
                      ? "text-slate-300 hover:bg-slate-800/50"
                      : "text-slate-500",
                  isLocked && "opacity-50"
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold",
                    isCurrent
                      ? "border-lime-400 bg-lime-400/10 text-lime-300"
                      : isCompleted
                        ? "border-lime-300/50 bg-lime-300/20 text-lime-200"
                        : "border-slate-700 bg-slate-800 text-slate-400"
                  )}
                >
                  {isCompleted ? <Check className="h-3 w-3" /> : section.id}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{section.title}</div>
                  {isCurrent && (
                    <div className="mt-1 text-xs text-lime-400">Current step</div>
                  )}
                </div>
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}




