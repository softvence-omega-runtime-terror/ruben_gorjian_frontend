"use client";

import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, LogOut } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { CurrentUser } from "@/lib/auth";
import { NotificationBell } from "@/components/notifications/notification-bell";

const navItems = [
  { label: "Overview", href: "/dashboard" },
  { label: "Calendar", href: "/dashboard/calendar" },
  { label: "Media", href: "/dashboard/media" },
  { label: "Social", href: "/dashboard/social" },
  { label: "Billing", href: "/dashboard/billing" },
  { label: "Settings", href: "/dashboard/settings" },
];

type NavLinksProps = {
  pathname: string;
  onSelect?: () => void;
};

function NavLinks({ pathname, onSelect }: NavLinksProps) {
  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onSelect}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm border transition",
              active
                ? "bg-lime-300/15 text-white border-lime-300/60"
                : "text-slate-200 hover:bg-slate-800/80 hover:text-white border-transparent hover:border-lime-300/40",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardLayoutShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const displayName = user.name || user.email || "User";
  const businessName = user.businessName || "Talexia Workspace";
  const avatarFallback = user.email?.[0]?.toUpperCase() || "U";

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      // Use window.location instead of router.push to ensure a full page reload
      // This ensures cookies are cleared and middleware runs fresh
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
      setLoggingOut(false);
      // Even on error, try to redirect to login
      window.location.href = "/login";
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-950 to-slate-900 text-slate-100">
      <Sheet>
        <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <SheetTrigger className="lg:hidden rounded-full border border-slate-800 p-2 hover:bg-slate-800/50 transition">
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-sm font-semibold"
              >
                <span className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl bg-lime-300/20 border border-lime-300/40 flex items-center justify-center text-lime-200 text-xs sm:text-sm">
                  TL
                </span>
                <span className="hidden sm:inline">{businessName}</span>
              </Link>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Link href="/dashboard/billing">
                <Button className="hidden sm:flex rounded-full bg-lime-400 text-slate-950 hover:bg-lime-300 text-xs px-3 py-1.5">
                  Upgrade
                </Button>
              </Link>
              <NotificationBell />
              <Button
                variant="ghost"
                className="rounded-full p-2 hover:bg-slate-800/50"
                onClick={handleLogout}
                disabled={loggingOut}
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
              <Avatar
                fallback={avatarFallback}
                className="h-8 w-8 sm:h-9 sm:w-9"
              />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[240px,1fr] gap-4 sm:gap-6">
            <aside className="hidden lg:block rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 shadow h-fit sticky top-24">
              <div className="mb-4 sm:mb-6">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Navigation
                </p>
              </div>
              <NavLinks pathname={pathname} />
            </aside>

            <main className="space-y-4 sm:space-y-6 min-w-0">{children}</main>
          </div>
        </div>

        {mobileOpen && (
          <SheetContent>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Avatar fallback={avatarFallback} className="h-9 w-9" />
                <div>
                  <p className="text-sm font-semibold text-white">
                    {displayName}
                  </p>
                  <p className="text-xs text-slate-400">{businessName}</p>
                </div>
              </div>
              <SheetClose>
                <Button variant="ghost" className="p-2 rounded-full">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetClose>
            </div>
            <div className="p-4 space-y-4">
              <NavLinks
                pathname={pathname}
                onSelect={() => setMobileOpen(false)}
              />
              <Separator />
              <Button
                variant="secondary"
                className="w-full"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {loggingOut ? "Logging out..." : "Logout"}
              </Button>
            </div>
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
}
