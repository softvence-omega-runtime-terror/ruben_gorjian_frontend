"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSessionContext } from "@/context/SessionContext";
import { AdminHeader } from "./AdminHeader";
import { AdminSidebar } from "./AdminSidebar";
import { cn } from "@/lib/utils";

const SIDEBAR_COLLAPSED_KEY = "talexia_admin_sidebar_collapsed";

type AdminLayoutProps = {
  children: React.ReactNode;
};

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, loading: sessionLoading } = useSessionContext();
  
  // Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Check admin access
  const isAdmin = session?.role === "ADMIN" || session?.role === "SUPER_ADMIN";
  const isOnLoginPage = pathname === "/admin/login";

  // Redirect if not admin (but skip if already on login page to prevent loop)
  useEffect(() => {
    if (sessionLoading) return;
    
    // Skip redirect if already on login page (prevents infinite loop)
    if (!isAdmin && !isOnLoginPage) {
      router.replace("/admin/login");
    }
  }, [sessionLoading, isAdmin, isOnLoginPage, router, pathname]);

  // Load sidebar collapsed state from localStorage (run once on mount / hydration)
  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    queueMicrotask(() => {
      if (stored !== null) {
        setIsSidebarCollapsed(stored === "true");
      }
      setIsHydrated(true);
    });
  }, []);

  // Save sidebar collapsed state to localStorage
  const handleToggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const newValue = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newValue));
      return newValue;
    });
  };

  // Toggle mobile sidebar
  const handleToggleMobileSidebar = () => {
    setIsMobileSidebarOpen((prev) => !prev);
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    queueMicrotask(() => setIsMobileSidebarOpen(false));
  }, [pathname]);

  // Close mobile sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMobileSidebarOpen]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileSidebarOpen]);

  // Show loading state (but skip for login page)
  if ((sessionLoading || !isHydrated) && !isOnLoginPage) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-800 border-t-lime-400"></div>
          <p className="text-sm text-slate-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Show nothing while redirecting non-admin users (but allow login page to render)
  if (!isAdmin && !isOnLoginPage) {
    return null;
  }

  // If on login page, render it without the admin layout chrome
  if (isOnLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Desktop Sidebar */}
      <AdminSidebar
        isOpen={true}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
        isMobile={false}
      />

      {/* Mobile Sidebar */}
      <AdminSidebar
        isOpen={isMobileSidebarOpen}
        isCollapsed={false}
        onToggleCollapse={() => {}}
        onClose={() => setIsMobileSidebarOpen(false)}
        isMobile={true}
      />

      {/* Header */}
      <AdminHeader
        onMenuClick={handleToggleMobileSidebar}
        isCollapsed={isSidebarCollapsed}
      />

      {/* Main Content — page scrolls normally (trackpad/mouse wheel) */}
      <main
        className={cn(
          "min-h-[calc(100vh-4rem)] transition-[padding] duration-300",
          !isSidebarCollapsed ? "lg:pl-64" : "lg:pl-20"
        )}
      >
        <div>
          {children}
        </div>
      </main>
    </div>
  );
}
