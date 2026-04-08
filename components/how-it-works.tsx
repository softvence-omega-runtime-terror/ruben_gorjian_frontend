import Image from "next/image";
import step1 from "@/components/assets/STEP_1.png";
import step2 from "@/components/assets/STEP_2.png";
import step3 from "@/components/assets/STEP_3.png";
export default function HowItWorks() {
  const steps = [
    {
      label: "Step 1",
      title: "Share Your Brand & Goals",
      body: "You tell us about your business, target audience, and social media goals.",
      image: step1,
    },
    {
      label: "Step 2",
      title: "We Build Your Content Engine",
      body: "Talexia creates branded visuals, captions, and a monthly posting plan tailored to your niche.",
      image: step2,
    },
    {
      label: "Step 3",
      title: "Approve & Go Live",
      body: "You review the content, request adjustments if needed, and Talexia schedules your posts.",
      image: step3,
    },
  ];

  return (
    <section
      id="how-it-works"
      className="border-t bg-gradient-to-b from-indigo-950 to-indigo-900 min-h-screen"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20 font-poppins">
        <div>
          <header className="mb-10 max-w-3xl">
            <h2 className="font-stack_sans_notch text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-[2.65rem] lg:leading-[1.1]">
              How Talexia.ai Works
            </h2>
            <p className="mt-3 font-poppins leading-relaxed text-base leading-relaxed text-slate-300 sm:text-lg">
              A simple, guided process that takes you from “no content” to a
              full month of posts in days, not weeks.
            </p>
          </header>

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.title}
                className="relative flex flex-col rounded-2xl border border-slate-800 bg-slate-950/60 p-5"
              >
                <span className="mb-3 inline-flex w-fit rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-lime-300">
                  {step.label}
                </span>
                <h3 className="text-sm font-semibold text-slate-50 sm:text-base">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-slate-300">{step.body}</p>
                <div className="mt-5">
                  <Image
                    src={step.image}
                    alt={step.title}
                    className="rounded-2xl"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
