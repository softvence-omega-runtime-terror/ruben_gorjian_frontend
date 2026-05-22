export default function Hero() {
  return (
    <section className="relative border-b border-slate-900/90 bg-gradient-to-b from-indigo-800 lg:min-h-screen">
      {/* <div className="absolute inset-0 bg-hero bg-cover bg-center opacity-10 blur-lg"></div> */}
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-16 pt-24 lg:flex-row lg:items-center lg:pb-24 lg:pt-32">
        <div className="flex-1 grid grid-cols-1 lg:gap-5">
          <h1 className="my-3 text-balance  text-5xl font-semibold lg:font-bold tracking-leading text-slate-50 lg:text-7xl font-stack_sans_notch">
            Your AI-Powered Social Media Team in One Platform
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base font-poppins">
            Talexia.ai turns your photos into high-impact visuals, plans your
            social media calendar, and pairs everything with strategic captions
            and hashtags, so you can focus on running your business.
          </p>

          <div className="mt-6 flex flex-wrap-reverse  items-center gap-3 font-poppins">
            <a
              href="/contact"
              className="flex items-center justify-center rounded-full bg-lime-400 px-6 py-4 font-semibold text-md text-slate-950 shadow-lg shadow-lime-500/20 transition hover:bg-lime-300"
            >
              Request a Free Strategy Call
            </a>
            <a
              href="#how-it-works"
              className="rounded-full border border-lime-300 px-6 py-4 text-md font-semibold text-slate-100 hover:border-lime-400 hover:text-lime-300"
            >
              See How Talexia Works
            </a>
          </div>

          <p className="my-4 text-xs text-lime-400 font-poppins">
            Ideal for restaurants, cafés, jewelry brands, home décor, and more.
          </p>
        </div>
      </div>
    </section>
  );
}
