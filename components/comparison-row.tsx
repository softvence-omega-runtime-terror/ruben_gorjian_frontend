import Image from "next/image";
import image1 from "@/components/assets/Talexia.aiAI-assisted visuals plus expert human oversight.png";
import image2 from "@/components/assets/Tell us about your brand.png";
export default function ComparisonRow() {
  return (
    <section className="border-t bg-gradient-to-b from-indigo-900 to-indigo-950 min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div>
          <header className="mb-10 max-w-3xl">
            <h2 className="font-stack_sans_notch text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-[2.65rem] lg:leading-[1.1]">
              More output than an in-house hire. Less cost.
            </h2>
            <p className="mt-3 font-poppins leading-relaxed text-base leading-relaxed text-slate-300 sm:text-lg">
              Compare Talexia to hiring a social media employee or freelancer.
              You get more posts, more consistency, and less management
              overhead.
            </p>
          </header>

          <div className="grid gap-6 md:grid-cols-2 font-poppins">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6">
              <h3 className="text-sm font-semibold text-slate-100 sm:text-base">
                In-House Social Media Employee
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>• Salary + taxes + benefits every month.</li>
                <li>• Limited design and AI skills.</li>
                <li>• Output depends on one person’s time and energy.</li>
                <li>• Hard to scale content across multiple brands.</li>
              </ul>
              <p className="mt-6 text-sm font-medium text-slate-200 font-poppins">
                <Image src={image1} alt="image" className="rounded-2xl" />
              </p>
            </div>

            <div className="rounded-2xl border border-lime-500/60 bg-gradient-to-br from-lime-400/10 to-emerald-400/5 p-6">
              <h3 className="text-sm font-semibold text-lime-100 sm:text-base">
                Talexia.ai
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-lime-50">
                <li>• AI-assisted visuals plus expert human oversight.</li>
                <li>
                  • Calendar, visuals, captions, and hashtags in one place.
                </li>
                <li>• Scales with your growth—simply upgrade your plan.</li>
                <li>• No HR headaches, no onboarding, no sick days.</li>
              </ul>
              <p className="mt-6 text-sm font-medium text-slate-200 font-poppins">
                <Image src={image2} alt="image" className="rounded-2xl" />
              </p>
            </div>
          </div>

          <p className="mt-6 text-sm font-medium text-slate-200 font-poppins">
            Get an entire content engine—for less than the cost of a part-time
            employee.
          </p>
        </div>
      </div>
    </section>
  );
}
