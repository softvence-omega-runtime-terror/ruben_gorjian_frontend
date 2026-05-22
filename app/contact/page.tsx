"use client";

import { FormEvent, Suspense, useState } from "react";
import Image from "next/image";
import Navbar from "@/components/navbar";
import FooterSecondary from "@/components/footer-secondary";
import contactImage from "@/components/assets/contact.svg";

export default function ContactPage() {
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);

  async function handleContactSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setContactError(null);
    setContactSuccess(null);

    const form = e.currentTarget;
    const data = new FormData(form);
    const fullName = (data.get("fullName") as string)?.trim();
    const businessName = (data.get("businessName") as string)?.trim();
    const email = (data.get("email") as string)?.trim();
    const websiteOrHandle = (data.get("websiteOrHandle") as string)?.trim();
    const message = (data.get("message") as string)?.trim();

    if (!fullName || !businessName || !email) {
      setContactError("Full name, business name, and email are required.");
      return;
    }

    setContactSubmitting(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          businessName,
          email,
          websiteOrHandle,
          message,
          interests: ["guidance"],
          postsPerMonth: "not-sure",
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setContactError(
          body?.error || "Unable to submit contact form right now.",
        );
        return;
      }
      setContactSuccess(
        "Thanks. We received your request and will reply shortly.",
      );
      form.reset();
    } catch {
      setContactError("Unable to submit contact form right now.");
    } finally {
      setContactSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-[#1f2230]">
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>

      <section
        id="contact"
        className="px-4 pb-16 pt-14 sm:pt-20"
        aria-labelledby="contact-heading"
      >
        <div className="mx-auto grid max-w-6xl gap-6 rounded-3xl border border-[#dfe2ec] bg-white p-6 sm:p-8 lg:grid-cols-1">
          <div className="space-y-10">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#777b86]">
              Contact sales
            </p>
            <h2
              id="contact-heading"
              className="mt-2 text-3xl font-bold font-sora text-primary sm:text-4xl"
            >
              Tell us about your brand
            </h2>
            <p className="mt-3 text-sm text-secondary">
              Share your content volume and goals. We&apos;ll recommend the
              right Talexia setup for your workflow.
            </p>
            <div className="grid w-full gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_1.2fr]">
              <div className="h-full w-full rounded-xl border border-indigo-800/10 object-cover object-center">
                <Image
                  src={contactImage}
                  alt="Contact Talexia"
                  className="h-full w-full rounded-xl object-fit lg:h-[600px] object-center"
                  width={600}
                  height={600}
                />
              </div>
              <form
                className="grid h-full gap-3 overflow-y-auto rounded-xl border-2 border-indigo-800/10 p-4 shadow-lg sm:grid-cols-2 lg:h-[600px]"
                onSubmit={handleContactSubmit}
                aria-labelledby="contact-heading"
              >
                {contactError ? (
                  <p className="sm:col-span-2 rounded-xl border border-[#f1cbc1] bg-[#fff1ec] px-4 py-2 text-sm text-[#b53f2a]">
                    {contactError}
                  </p>
                ) : null}
                {contactSuccess ? (
                  <p className="sm:col-span-2 rounded-xl border border-[#ced9f6] bg-[#edf2ff] px-4 py-2 text-sm text-[#2f4587]">
                    {contactSuccess}
                  </p>
                ) : null}
                <div className="contents">
                  <label htmlFor="contact-fullName" className="sr-only">
                    Full name
                  </label>
                  <input
                    id="contact-fullName"
                    name="fullName"
                    placeholder="Full name"
                    className="form-control h-20 rounded-xl border border-[#d8dce8] px-6 py-3 text-sm outline-none focus:border-[#4a5dff]"
                    required
                  />
                </div>
                <div className="contents">
                  <label htmlFor="contact-businessName" className="sr-only">
                    Business name
                  </label>
                  <input
                    id="contact-businessName"
                    name="businessName"
                    placeholder="Business name"
                    className="form-control h-20 rounded-xl border border-[#d8dce8] px-6 py-3 text-sm outline-none focus:border-[#4a5dff]"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="contact-email" className="sr-only">
                    Email
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    placeholder="Email"
                    className="form-control h-20 w-full rounded-xl border border-[#d8dce8] px-6 py-3 text-sm outline-none focus:border-[#4a5dff]"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="contact-websiteOrHandle" className="sr-only">
                    Website or @handle
                  </label>
                  <input
                    id="contact-websiteOrHandle"
                    name="websiteOrHandle"
                    placeholder="Website or @handle"
                    className="form-control h-20 w-full rounded-xl border border-[#d8dce8] px-6 py-3 text-sm outline-none focus:border-[#4a5dff]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="contact-message" className="sr-only">
                    What do you want Talexia to handle for you?
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={4}
                    placeholder="What do you want Talexia to handle for you?"
                    className="form-control h-20 w-full rounded-xl border border-[#d8dce8] px-6 py-3 text-sm outline-none focus:border-[#4a5dff]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={contactSubmitting}
                  className="h-20 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-900 disabled:cursor-not-allowed disabled:opacity-70 sm:col-span-2"
                >
                  {contactSubmitting ? "Sending..." : "Send request"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <FooterSecondary />
    </main>
  );
}
