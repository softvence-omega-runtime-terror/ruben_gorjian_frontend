"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NotificationList } from "./notification-list";

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/unread-count", {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count ?? 0);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  }, []);

  useEffect(() => {
    // Defer initial fetch to avoid synchronous setState in effect
    const t = setTimeout(fetchUnreadCount, 0);

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, [fetchUnreadCount]);

  function handleNotificationRead() {
    // Decrease unread count when a notification is marked as read
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  function handleAllRead() {
    setUnreadCount(0);
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className={`rounded-full p-2 hover:bg-slate-800/50 relative ${className}`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-lime-400 text-slate-950 text-xs font-semibold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md bg-slate-900 border-slate-800">
        <SheetHeader>
          <SheetTitle className="text-white">Notifications</SheetTitle>
        </SheetHeader>
        <NotificationList
          onNotificationRead={handleNotificationRead}
          onAllRead={handleAllRead}
        />
      </SheetContent>
    </Sheet>
  );
}
