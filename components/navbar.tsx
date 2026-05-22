"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Menu, X } from "lucide-react";
import { usePreventScroll } from "@/hooks/usePreventScroll";
import { useSessionContext } from "@/context/SessionContext";
import Image from "next/image";
import logo from "@/components/assets/talexia_ai_logo.png";

const navItems = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "/faq" },
];

function NavbarInner() {
  const [open, setOpen] = useState(false);
  const { session } = useSessionContext();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAuthed = Boolean(session);

  usePreventScroll(open);

  const getLoginUrl = () => {
    if (
      isAuthed ||
      pathname?.startsWith("/login") ||
      pathname?.startsWith("/signup")
    ) {
      return "/login";
    }
    const fullPath =
      pathname +
      (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    return `/login?returnTo=${encodeURIComponent(fullPath)}`;
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#e4e5ea] bg-white backdrop-blur">
      {/* <header className="sticky top-0 z-40 border-b border-[#e4e5ea] bg-[#f4f3ee]/95 backdrop-blur"> */}
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold tracking-[0.22em] text-[#1c2231]"
        >
          <Image
            // src={logo}
            // src="/talexia_ai_logo.png"
            src={logo}
            alt="Talexia"
            width={40}
            height={40}
          />
          TALEXIA
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-[#4c4f5e] md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition hover:text-[#1c2231]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthed ? (
            <Link
              href="/dashboard"
              className="text-sm font-medium text-[#4c4f5e]"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href={getLoginUrl()}
              className="text-sm font-medium text-[#4c4f5e]"
            >
              Sign in
            </Link>
          )}
          <Link
            href="/pricing"
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600"
            // className="rounded-full bg-[#D25FFD] px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600"
            // className="rounded-full bg-indigo-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600"
            // className="rounded-full bg-[#ff5a3d] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#e84f33]"
          >
            Get started
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg p-2 text-[#1f2333] md:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Toggle navigation"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-[#e4e5ea] bg-[#f4f3ee] md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-4 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-2 py-3 text-sm font-medium text-[#363a49] transition hover:bg-white"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            {isAuthed ? (
              <Link
                href="/dashboard"
                className="mt-2 rounded-full border border-[#d4d8e5] bg-white px-4 py-2.5 text-center text-sm font-semibold text-[#1e2333]"
                onClick={() => setOpen(false)}
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href={getLoginUrl()}
                className="mt-2 rounded-full border border-[#d4d8e5] bg-white px-4 py-2.5 text-center text-sm font-semibold text-[#1e2333]"
                onClick={() => setOpen(false)}
              >
                Sign in
              </Link>
            )}

            <Link
              href="/pricing"
              className="mt-2 rounded-full bg-accent px-4 py-2.5 text-center text-sm font-semibold text-white"
              // className="mt-2 rounded-full bg-[#D25FFD] px-4 py-2.5 text-center text-sm font-semibold text-white"
              // className="mt-2 rounded-full bg-indigo-800 px-4 py-2.5 text-center text-sm font-semibold text-white"
              // className="mt-2 rounded-full bg-[#ff5a3d] px-4 py-2.5 text-center text-sm font-semibold text-white"
              onClick={() => setOpen(false)}
            >
              Get started
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

export default function Navbar() {
  return (
    <Suspense
      fallback={
        <header className="sticky top-0 z-40 border-b border-[#e4e5ea] bg-white backdrop-blur">
          <div className="mx-auto h-[73px] max-w-6xl px-4" />
        </header>
      }
    >
      <NavbarInner />
    </Suspense>
  );
}
