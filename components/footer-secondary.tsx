"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useState } from "react";
import logo from "@/components/assets/talexia_ai_logo.png";
import { Facebook, Instagram, Linkedin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

export default function FooterSecondary() {
  const year = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const newsletterMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch("/api/contact/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Subscription failed");
      }

      return data;
    },

    onSuccess: () => {
      toast.success("Subscribed successfully!");
      setEmail("");
    },

    onError: (error: any) => {
      toast.error(error.message || "Unable to subscribe");
    },
  });
  const linkClass = "text-sm text-white transition hover:text-white/80";

  // async function handleNewsletterSubmit(e: FormEvent<HTMLFormElement>) {
  //   e.preventDefault();
  //   setMessage("");
  //   setStatus("loading");
  //   try {
  //     const res = await fetch("/api/newsletter", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ email: email.trim() }),
  //     });
  //     const data = await res.json().catch(() => ({}));
  //     if (!res.ok) {
  //       setStatus("error");
  //       setMessage(data?.error ?? "Something went wrong. Please try again.");
  //       return;
  //     }
  //     setStatus("success");
  //     setEmail("");
  //     setMessage("You’re subscribed. We’ll be in touch.");
  //   } catch {
  //     setStatus("error");
  //     setMessage("Unable to subscribe. Please try again.");
  //   }
  // }

  async function handleNewsletterSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      toast.error("Email is required");
      return;
    }

    newsletterMutation.mutate(trimmedEmail);
  }

  return (
    <footer className="border-t border-[#e4e5ea] bg-primary">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-10 p-10 sm:grid-cols-3 lg:grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(0,1fr))] lg:gap-12">
          {/* Brand block */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold tracking-[0.22em] text-white font-sora"
            >
              <Image
                src={logo}
                alt="Talexia"
                width={36}
                height={36}
                className="rounded-full"
              />
              TALEXIA
            </Link>
            <p className="mt-3 max-w-xs text-sm text-white/90">
              Your AI-powered social media team. Plan, create, and schedule
              content that stays on brand.
            </p>
            {/* Newsletter form start here */}
            <div className="mt-10 space-y-4 text-white">
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-white font-sora">
                Newsletter
              </h3>
              <p className="max-w-xs text-sm text-white/80">
                Get the latest on Talexia updates and new features.
              </p>
              <form
                onSubmit={handleNewsletterSubmit}
                className="mt-3 flex items-center"
              >
                <label htmlFor="footer-newsletter-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="footer-newsletter-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  disabled={status === "loading"}
                  required
                  className="w-2/3 rounded-lg rounded-r-none border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/50 outline-none transition focus:border-white/40 focus:ring-2 focus:ring-white/20 disabled:opacity-70"
                />
                <button
                  type="submit"
                  disabled={newsletterMutation.isPending}
                  className="flex w-1/3 items-center justify-center gap-2 rounded-lg rounded-l-none bg-white px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-white/95 disabled:opacity-70"
                >
                  {/* {status === "loading" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Subscribing…
                    </>
                  ) : (
                    "Subscribe"
                  )} */}
                  {newsletterMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Subscribing…
                    </>
                  ) : (
                    "Subscribe"
                  )}
                </button>
                {message && (
                  <p
                    className={`text-sm ${
                      status === "success" ? "text-white/90" : "text-amber-200"
                    }`}
                  >
                    {message}
                  </p>
                )}
              </form>
              <p className="text-xs text-white/60">
                By subscribing you agree to our{" "}
                <Link
                  href="/privacy-policy"
                  className="underline hover:text-white/80"
                >
                  Privacy Policy
                </Link>{" "}
                and consent to receive updates from Talexia.
              </p>
            </div>
          </div>

          {/* Company */}
          <div className="space-y-10 text-white">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] font-sora">
              Product
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/#features" className={linkClass}>
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className={linkClass}>
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/contact" className={linkClass}>
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/faq" className={linkClass}>
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* About Us */}
          <div className="space-y-10 text-white">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] font-sora">
              About Us
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/" className={linkClass}>
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href="https://www.rgpstudio.com"
                  target="_blank"
                  className={linkClass}
                >
                  RPG Studios
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-10 text-white">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em]">
              Socials
            </h3>
            {/* Social Media */}
            <ul className="flex flex-row md:flex-col gap-4 mt-4 items-center md:items-start">
              <li>
                <Link
                  href="https://www.facebook.com/talexiaNY/"
                  target="_blank"
                  className={linkClass}
                >
                  <span className="sr-only flex items-center gap-2">
                    Facebook
                  </span>
                  <Facebook className="w-4 h-4" />
                </Link>
              </li>
              <li>
                <Link
                  href="https://www.instagram.com/talexia_ny"
                  target="_blank"
                  className={linkClass}
                >
                  <span className="sr-only flex items-center gap-2">
                    Instagram
                  </span>
                  <Instagram className="w-4 h-4" />
                </Link>
              </li>
              <li>
                <Link
                  href="https://www.linkedin.com/company/talexia"
                  target="_blank"
                  className={linkClass}
                >
                  <span className="sr-only flex items-center gap-2">
                    LinkedIn
                  </span>
                  <Linkedin className="w-4 h-4" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Section 2 start here */}
        <div className="grid grid-cols-2 gap-10 p-10 sm:grid-cols-3 lg:grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(0,1fr))] lg:gap-12">
          {/* Legal */}
          <div className="space-y-10 text-white">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] font-sora">
              Legal
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/privacy-policy" className={linkClass}>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-conditions" className={linkClass}>
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className={linkClass}>
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/cookie-policy" className={linkClass}>
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div className="space-y-10 text-white">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] font-sora">
              Policies
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/data-usage" className={linkClass}>
                  Acceptable Use
                </Link>
              </li>
              <li>
                <Link href="/api-data-disclosure" className={linkClass}>
                  API Data Disclosure
                </Link>
              </li>
              <li>
                <Link href="/content-disclaimer" className={linkClass}>
                  Content Disclaimer
                </Link>
              </li>
            </ul>
          </div>
        </div>
        {/* Section 2 end here */}
        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#e4e5ea] pt-8 sm:flex-row sm:items-center">
          <p className="text-sm text-white">
            © {year} Talexia.ai. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy-policy" className={linkClass}>
              Privacy
            </Link>
            <Link href="/terms-conditions" className={linkClass}>
              Terms
            </Link>
            <Link href="/cookie-policy" className={linkClass}>
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
