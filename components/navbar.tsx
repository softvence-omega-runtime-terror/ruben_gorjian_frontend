"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Menu, X } from "lucide-react";
import { usePreventScroll } from "@/hooks/usePreventScroll";
import { useSessionContext } from "@/context/SessionContext";
import Image from "next/image";
import logo from "@/components/assets/talexia_ai_logo.png";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "Case Studies", href: "/case-studies" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact Us", href: "/contact" },
];

function NavbarInner() {
  const [open, setOpen] = useState(false);
  const { session } = useSessionContext();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAuthed = Boolean(session);
  const isAdmin = session?.role === "ADMIN" || session?.role === "SUPER_ADMIN";
  const dashboardHref = isAdmin ? "/admin" : "/dashboard";
  const dashboardLabel = isAdmin ? "Admin Panel" : "Dashboard";

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
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold tracking-[0.22em] text-[#1c2231]"
        >
          <Image
            src={logo}
            alt="Talexia"
            width={40}
            height={40}
          />
          TALEXIA
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-[#4c4f5e] md:flex">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href) &&
                  (item.href.length > 1 || pathname === "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative py-1 transition-all duration-200 hover:text-[#1c2231]",
                  isActive ? "text-[#1c2231] font-bold" : "text-[#4c4f5e]"
                )}
              >
                {item.label}
                {isActive && (
                  <span className="absolute -bottom-1.5 left-0 h-[2px] w-full rounded-full bg-accent" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthed ? (
            <Link
              href={dashboardHref}
              className="text-sm font-medium text-[#4c4f5e] cursor-pointer"
            >
              {dashboardLabel}
            </Link>
          ) : (
            <Link
              href={getLoginUrl()}
              className="text-sm font-medium text-[#4c4f5e] cursor-pointer"
            >
              Sign in
            </Link>
          )}
          <Link
            href="/pricing"
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600 cursor-pointer"
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
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(item.href) &&
                    (item.href.length > 1 || pathname === "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 flex items-center justify-between",
                    isActive
                      ? "bg-white text-accent font-bold shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-[#e4e5ea]"
                      : "text-[#363a49] hover:bg-white/50"
                  )}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                  {isActive && <div className="h-1.5 w-1.5 rounded-full bg-accent" />}
                </Link>
              );
            })}

            {isAuthed ? (
              <Link
                href={dashboardHref}
                className="mt-2 rounded-full border border-[#d4d8e5] bg-white px-4 py-2.5 text-center text-sm font-semibold text-[#1e2333] cursor-pointer"
                onClick={() => setOpen(false)}
              >
                {dashboardLabel}
              </Link>
            ) : (
              <Link
                href={getLoginUrl()}
                className="mt-2 rounded-full border border-[#d4d8e5] bg-white px-4 py-2.5 text-center text-sm font-semibold text-[#1e2333] cursor-pointer"
                onClick={() => setOpen(false)}
              >
                Sign in
              </Link>
            )}

            <Link
              href="/pricing"
              className="mt-2 rounded-full bg-accent px-4 py-2.5 text-center text-sm font-semibold text-white cursor-pointer"
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
