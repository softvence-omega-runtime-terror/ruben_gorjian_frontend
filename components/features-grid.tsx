import Image from "next/image";
import { CalendarRange, Hash, Sparkles, Wand2 } from "lucide-react";

import live_preview from "@/components/assets/live_preview.png";

const featureCards = [
  {
    title: "Vision-powered captions",
    description:
      "3 captions, 20 hashtags, 3 CTAs, and a short description for every upload, conditioned by your brand profile.",
    icon: Wand2,
  },
  {
    title: "Calendar-first workflow",
    description:
      "Plan Instagram, Facebook, and LinkedIn together. Draft, schedule, or auto-post with platform limits enforced.",
    icon: CalendarRange,
  },
  {
    title: "Brand-safe by default",
    description:
      "Tone, competitors, CTA rules, quotas, and founder pricing are applied everywhere so nothing slips.",
    icon: Hash,
  },
];

const chips = [
  "Instagram / Facebook / LinkedIn",
  "Auto-posting + retries",
  "Brand profile conditioning",
  "Founder pricing + quotas",
];

export default function FeaturesGrid() {
  return (
    <section
      id="features"
      className="bg-gradient-to-b from-slate-950 to-indigo-950 py-16 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="overflow-hidden rounded-3xl border border-slate-800/70 bg-transparent p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-10">
          <div className="items-start gap-10 flex flex-col lg:flex-row  lg:flex-row-reverse">
            <div className="space-y-6 flex-1">
              <span className="font-poppins inline-flex w-fit items-center rounded-full border border-lime-300/90 bg-lime-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-lime-200">
                Why Talexia.Ai
              </span>
              <div className="space-y-3">
                <h2 className="font-stack_sans_notch text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-[2.65rem] lg:leading-[1.1]">
                  Upload, caption, schedule, auto-post—done.
                </h2>
                <p className="font-poppins text-base leading-relaxed text-slate-300 sm:text-lg">
                  Talexia.Ai is the AI-powered social team for agencies and
                  brand owners. We turn every asset into on-brand captions and
                  push them to Instagram, Facebook, and LinkedIn while enforcing
                  quotas and founder pricing automatically.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 font-poppins">
                {chips.map((chip) => (
                  <span
                    key={chip}
                    className="inline-flex items-center rounded-full border border-slate-800/70 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-200"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            <div className="font-poppins flex-1 relative overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-900">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(148,163,184,0.08),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(148,163,184,0.05),transparent_55%)]" />
              <div className="space-y-3 p-6">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-lime-300/80">
                  <Sparkles className="h-4 w-4" aria-hidden />
                  Live Preview
                </div>
                <h3 className="text-xl font-semibold text-white">
                  Calendar + captions in one view
                </h3>
                <p className="text-sm text-slate-300">
                  Preview scheduled posts with synced hashtags and CTAs before
                  auto-post kicks in.
                </p>
              </div>
              <div className="relative mx-6 mb-6 overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900">
                <Image
                  src={live_preview}
                  alt="Talexia.Ai scheduler preview"
                  className="w-full"
                  priority={false}
                  draggable={false}
                />
                <div className="absolute inset-x-3 bottom-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-lime-400/30 bg-lime-300 px-3 py-1 text-xs font-semibold text-slate-950">
                    Auto-post ready
                  </span>
                  <span className="inline-flex items-center rounded-full border border-slate-800/70 bg-slate-900/80 px-3 py-1 text-xs font-semibold text-slate-100">
                    Scheduled
                  </span>
                  <span className="inline-flex items-center rounded-full border border-slate-800/70 bg-slate-900/80 px-3 py-1 text-xs font-semibold text-slate-100">
                    Captions + hashtags synced
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 font-poppins">
            {featureCards.map((feature) => (
              <div
                key={feature.title}
                className="flex h-full flex-col rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300/15 text-lime-200">
                  <feature.icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="text-base font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-slate-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
