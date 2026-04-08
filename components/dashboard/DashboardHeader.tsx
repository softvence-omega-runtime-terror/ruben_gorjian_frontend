"use client";

import { useRouter, usePathname } from "next/navigation";
import { useSessionContext } from "@/context/SessionContext";
import { NAV_SECTIONS } from "./DashboardSidebar";
import { cn } from "@/lib/utils";
import {
  Menu,
  Bell,
  Plus,
  LogOut,
  User,
  CreditCard,
  Settings,
  Crown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Image from "next/image";

type DashboardHeaderProps = {
  onMenuClick: () => void;
  isCollapsed: boolean;
};

export function DashboardHeader({
  onMenuClick,
  isCollapsed,
}: DashboardHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, refresh } = useSessionContext();

  // Derive the current page title from the sidebar nav
  const currentPageTitle = (() => {
    for (const section of NAV_SECTIONS) {
      const match = section.items.find(item =>
        item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href)
      );
      if (match) return match.label;
    }
    return "Dashboard";
  })();

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        await refresh();
        router.push("/login");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleCreateNew = () => {
    router.push("/dashboard");
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-800 bg-slate-900/95 backdrop-blur px-4 lg:px-6 transition-all duration-300",
        !isCollapsed ? "lg:pl-64" : "lg:pl-20",
      )}
    >
      {/* Left: Mobile Menu Button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Desktop: Logo — commented out to match admin header design
      <div
        className={cn(
          "hidden lg:flex items-center gap-2 transition-opacity duration-300",
          isCollapsed ? "opacity-100" : "opacity-0 w-0 overflow-hidden",
        )}
      >
        <div className="h-8 w-8 rounded-lg bg-lime-400 flex items-center justify-center">
          <span className="text-sm font-bold text-slate-900">T</span>
        </div>
        <span className="text-sm font-semibold text-white">Talexia</span>
      </div>
      */}

      {/* Center: Dynamic Page Title */}
      <div className="flex-1 flex items-center px-4">
        <h1 className="text-base font-semibold text-white tracking-tight">
          {currentPageTitle}
        </h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Create Button */}
        {/* <Button
          onClick={handleCreateNew}
          size="sm"
          className="hidden sm:flex items-center gap-2 bg-lime-400 text-slate-900 hover:bg-lime-300"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden lg:inline">New Campaign</span>
          <span className="lg:hidden">New</span>
        </Button> */}

        {/* Notifications — commented out
        <button
          className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-lime-400"></span>
        </button>
        */}

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white">
              <div className="h-8 w-8 rounded-full bg-lime-400/20 border border-lime-400 flex items-center justify-center overflow-hidden">
                {session?.avatarUrl ? (
                  <Image
                    width={32}
                    height={32}
                    src={`${session.avatarUrl}${session.avatarVersion ? `?v=${session.avatarVersion}` : ""}`}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-4 w-4 text-lime-400" />
                )}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-sm font-medium text-white flex items-center gap-1">
                  {session?.name || "User"}
                  {session?.isFounder && (
                    <Crown className="h-3 w-3 text-lime-400" />
                  )}
                </div>
                <div className="text-xs text-slate-400">
                  {session?.email || "user@example.com"}
                </div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-slate-900  text-slate-400 "
          >
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-semiboldflex items-center gap-1">
                  {session?.name || "User"}
                  {session?.isFounder && (
                    <Crown className="h-3 w-3 text-lime-400" />
                  )}
                </span>
                <span className="text-xs text-slate-400">
                  {session?.email || "user@example.com"}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push("/dashboard/settings")}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/dashboard/billing")}
              className="flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              <span>Billing</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/dashboard/settings")}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-300 focus:text-red-200"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
