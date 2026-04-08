"use client";

import { LucideCalendar, LucideCloudUpload, LucideCreditCard, LucideSparkles } from "lucide-react";

export function DashboardCards() {
  const cards = [
    {
      title: "Plan",
      value: "Not set",
      desc: "Select a plan to activate billing.",
      icon: <LucideCreditCard className="h-5 w-5 text-lime-200" />,
      cta: { label: "Choose plan", href: "#plans" },
    },
    {
      title: "Content Uploads",
      value: "0 assets",
      desc: "Upload photos/videos to start generating captions.",
      icon: <LucideCloudUpload className="h-5 w-5 text-lime-200" />,
      cta: { label: "Upload", href: "#" },
    },
    {
      title: "AI Captions",
      value: "0 generated",
      desc: "Run captions on uploaded assets.",
      icon: <LucideSparkles className="h-5 w-5 text-lime-200" />,
      cta: { label: "Generate", href: "#" },
    },
    {
      title: "Calendar",
      value: "No posts scheduled",
      desc: "Schedule posts across platforms.",
      icon: <LucideCalendar className="h-5 w-5 text-lime-200" />,
      cta: { label: "Open calendar", href: "#" },
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {cards.map((card) => (
        <div key={card.title} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-lime-400/20 border border-lime-300/60 flex items-center justify-center">
              {card.icon}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">{card.title}</p>
              <p className="text-lg font-semibold text-white">{card.value}</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-300">{card.desc}</p>
          <a
            href={card.cta.href}
            className="mt-4 inline-flex items-center justify-center rounded-full bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow hover:bg-lime-300"
          >
            {card.cta.label}
          </a>
        </div>
      ))}
    </div>
  );
}
