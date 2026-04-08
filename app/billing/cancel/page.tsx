export default function BillingCancelPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="max-w-lg w-full rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center shadow-xl">
        <h1 className="text-2xl font-semibold text-white">Checkout canceled</h1>
        <p className="mt-3 text-sm text-slate-300">
          No charges were made. You can restart checkout or get in touch if you need help choosing a plan.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="#pricing"
            className="inline-flex items-center justify-center rounded-full bg-lime-400 px-5 py-2 text-sm font-semibold text-slate-950 shadow hover:bg-lime-300"
          >
            Back to Pricing
          </a>
          <a
            href="/contact"
            className="inline-flex items-center justify-center rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800/70"
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
}
