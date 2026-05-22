"use client";

import {
  LucidePlus,
  LucideUpload,
  LucideCalendarDays,
  LucideSparkles,
} from "lucide-react";

const actions = [
  { title: "Upload media", desc: "JPG/PNG/MP4", icon: LucideUpload },
  {
    title: "Generate captions",
    desc: "AI variants + hashtags",
    icon: LucideSparkles,
  },
  { title: "Create post", desc: "Draft or schedule", icon: LucideCalendarDays },
];

export function DashboardQuickActions() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-full bg-lime-400/20 border border-lime-300/60 flex items-center justify-center">
          <LucidePlus className="h-4 w-4 text-lime-200" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Quick actions
          </p>
          <p className="text-sm text-white">Start creating content</p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.title}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-3 text-left hover:border-lime-300/60 transition"
            >
              <Icon className="h-5 w-5 text-lime-200" />
              <p className="mt-2 text-sm font-semibold text-white">
                {action.title}
              </p>
              <p className="text-xs text-slate-400">{action.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
