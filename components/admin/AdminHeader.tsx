"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSessionContext } from "@/context/SessionContext";
import { NAV_SECTIONS } from "./AdminSidebar";
import { cn } from "@/lib/utils";
import {
  Menu,
  Bell,
  ExternalLink,
  LogOut,
  User,
  Shield,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

type AdminHeaderProps = {
  onMenuClick: () => void;
  isCollapsed: boolean;
};

export function AdminHeader({ onMenuClick, isCollapsed }: AdminHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, refresh } = useSessionContext();
  const [searchQuery, setSearchQuery] = useState("");

  // Derive the current page title from the sidebar nav
  const currentPageTitle = (() => {
    for (const section of NAV_SECTIONS) {
      const match = section.items.find(item =>
        item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
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
        router.push("/admin/login");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleViewSite = () => {
    router.push("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement global search functionality
    console.log("Search query:", searchQuery);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-800 bg-slate-900/95 backdrop-blur px-4 lg:px-6 transition-all duration-300",
        !isCollapsed ? "lg:pl-64" : "lg:pl-20"
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

      {/* Desktop: Logo + Admin Badge (visible when sidebar collapsed) */}
      {/* <div className={cn(
        "hidden lg:flex items-center gap-2 transition-opacity duration-300",
        isCollapsed ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
      )}>
        <div className="h-8 w-8 rounded-lg bg-lime-400 flex items-center justify-center">
          <span className="text-sm font-bold text-slate-900">T</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">Talexia</span>
          <Badge variant="secondary" className="text-xs">Admin</Badge>
        </div>
      </div> */}

      {/* Center: Dynamic Page Title */}
      <div className="flex-1 flex items-center px-4">
        <h1 className="text-base font-semibold text-white tracking-tight">
          {currentPageTitle}
        </h1>
      </div>

      {/* Search Bar — commented out
      <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search users, posts, subscriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20"
          />
        </div>
      </form>
      */}

      {/* Right: Actions */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications (placeholder) */}
        {/* <button
          className="hidden sm:flex relative rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-lime-400"></span>
        </button> */}

        {/* View Site Button */}
        <button
          onClick={handleViewSite}
          className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          <span className="hidden lg:inline">View Site</span>
        </button>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white">
              <div className="h-8 w-8 rounded-full bg-lime-400/20 border border-lime-400 flex items-center justify-center">
                <User className="h-4 w-4 text-lime-400" />
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-sm font-medium text-white">
                  {session?.name || "Admin"}
                </div>
                <div className="text-xs text-slate-400">
                  {session?.email || "admin@talexia.ai"}
                </div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">
                  {session?.name || "Admin User"}
                </span>
                <span className="text-xs text-slate-400">
                  {session?.email || "admin@talexia.ai"}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Role: {session?.role || "ADMIN"}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleViewSite}
              className="flex items-center gap-2 lg:hidden"
            >
              <ExternalLink className="h-4 w-4" />
              <span>View Site</span>
            </DropdownMenuItem>
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