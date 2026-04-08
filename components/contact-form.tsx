import { FormEvent, useState } from "react";
type InterestOption =
  | "calendar"
  | "ai-visuals"
  | "full-management"
  | "guidance";

export default function ContactFormSection() {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [interests, setInterests] = useState<InterestOption[]>([]);

  function toggleInterest(option: InterestOption) {
    setInterests((prev) =>
      prev.includes(option)
        ? prev.filter((v) => v !== option)
        : [...prev, option]
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const form = e.currentTarget;
    const data = new FormData(form);
    const email = (data.get("email") as string)?.trim();
    const fullName = (data.get("fullName") as string)?.trim();
    const businessName = (data.get("businessName") as string)?.trim();

    if (!fullName || !businessName || !email) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (interests.length === 0) {
      setError("Please select at least one area of interest.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        fullName,
        businessName,
        email,
        websiteOrHandle: data.get("websiteOrHandle"),
        interests,
        postsPerMonth: data.get("postsPerMonth"),
        message: data.get("message"),
      };

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        console.log(body);
        throw new Error(body?.error || "Unable to submit form right now.");
      }

      setSuccess(
        "Thank you! We’ll review your information and contact you within 24 hours."
      );
      form.reset();
      setInterests([]);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      id="contact"
      className="border-t bg-gradient-to-b from-slate-950 to-slate-950 border-slate-800"
    >
      <div className="mx-auto max-w-4xl px-4 py-16 sm:py-20">
        <div>
          <header className="mb-8">
            <h2 className="font-stack_sans_notch text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-[2.65rem] lg:leading-[1.1]">
              Tell us about your brand
            </h2>
            <p className="mt-3 font-poppins leading-relaxed text-base leading-relaxed text-slate-300 sm:text-lg">
              Fill out this form and we’ll get back to you with a short Loom
              video or call invite explaining how Talexia can help your specific
              business.
            </p>
          </header>

          <form
            onSubmit={handleSubmit}
            className="font-poppins space-y-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow"
          >
            {error && (
              <div className="rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-md border border-emerald-500/60 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
                {success}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Full Name" name="fullName" required />
              <Field label="Business Name" name="businessName" required />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Email Address"
                name="email"
                type="email"
                required
                placeholder="you@company.com"
              />
              <Field
                label="Website or Instagram Handle"
                name="websiteOrHandle"
                placeholder="https:// or @handle"
              />
            </div>

            <fieldset className="space-y-3">
              <legend className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                What are you most interested in?{" "}
                <span className="text-lime-300">*</span>
              </legend>
              <div className="grid gap-2 md:grid-cols-2">
                <CheckboxOption
                  label="Calendar-Only Planning"
                  checked={interests.includes("calendar")}
                  onChange={() => toggleInterest("calendar")}
                />
                <CheckboxOption
                  label="AI Visual Creation"
                  checked={interests.includes("ai-visuals")}
                  onChange={() => toggleInterest("ai-visuals")}
                />
                <CheckboxOption
                  label="Full Social Media Management"
                  checked={interests.includes("full-management")}
                  onChange={() => toggleInterest("full-management")}
                />
                <CheckboxOption
                  label="Not sure yet – I need guidance"
                  checked={interests.includes("guidance")}
                  onChange={() => toggleInterest("guidance")}
                />
              </div>
            </fieldset>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label
                  htmlFor="postsPerMonth"
                  className="text-xs font-semibold uppercase tracking-wide text-slate-300"
                >
                  Approximate number of posts per month
                </label>
                <select
                  id="postsPerMonth"
                  name="postsPerMonth"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none ring-lime-400/40 focus:border-lime-400 focus:ring-2"
                  defaultValue="not-sure"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="40">40</option>
                  <option value="60">60</option>
                  <option value="100">100</option>
                  <option value="not-sure">Not sure</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="message"
                className="text-xs font-semibold uppercase tracking-wide text-slate-300"
              >
                Message / Notes
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                className="w-full resize-none rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none ring-lime-400/40 focus:border-lime-400 focus:ring-2"
                placeholder="Tell us about your products, audience, and current social media challenges."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-full bg-lime-400 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-lime-500/30 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label
        htmlFor={name}
        className="text-xs font-semibold uppercase tracking-wide text-slate-300"
      >
        {label} {required && <span className="text-lime-300">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none ring-lime-400/40 focus:border-lime-400 focus:ring-2"
      />
    </div>
  );
}

function CheckboxOption({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-200 hover:border-lime-400/60">
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-900 text-lime-400 focus:ring-lime-400"
        checked={checked}
        onChange={onChange}
      />
      <span>{label}</span>
    </label>
  );
}
