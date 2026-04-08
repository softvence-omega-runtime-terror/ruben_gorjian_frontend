"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  CheckCheck,
  FileText,
  FileCheck,
  FileX,
  FileSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Notification {
  id: string;
  type:
    | "SUBMISSION_CREATED"
    | "SUBMISSION_STATUS_UPDATED"
    | "ENHANCED_DELIVERY_SENT";
  title: string;
  message: string;
  payload: {
    submissionId: string;
    status: string;
    previousStatus?: string;
    timestamp: string;
    userNote?: string;
    adminNote?: string;
    enhancedDeliveryId?: string;
    fileCount?: number;
    message?: string;
  };
  readAt: string | null;
  createdAt: string;
}

interface NotificationListProps {
  onNotificationRead?: () => void;
  onAllRead?: () => void;
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days !== 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? "s" : ""} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years !== 1 ? "s" : ""} ago`;
}

export function NotificationList({
  onNotificationRead,
  onAllRead,
}: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications?limit=50", {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setHasMore(data.hasMore || false);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      const res = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
        credentials: "include",
      });

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId
              ? { ...n, readAt: new Date().toISOString() }
              : n,
          ),
        );
        onNotificationRead?.();
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }

  async function markAllAsRead() {
    try {
      const res = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, readAt: new Date().toISOString() })),
        );
        onAllRead?.();
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "SUBMITTED":
        return <FileText className="h-5 w-5 text-blue-400" />;
      case "IN_REVIEW":
        return <FileSearch className="h-5 w-5 text-yellow-400" />;
      case "ENHANCED_SENT":
        return <FileCheck className="h-5 w-5 text-green-400" />;
      case "COMPLETED":
        return <FileCheck className="h-5 w-5 text-green-400" />;
      case "REJECTED":
        return <FileX className="h-5 w-5 text-red-400" />;
      default:
        return <FileText className="h-5 w-5 text-slate-400" />;
    }
  }

  function getNotificationLink(notification: Notification): string {
    // Check if user is admin based on notification type and content
    const isAdminNotification = notification.message.includes(
      "submitted new files",
    );

    if (isAdminNotification) {
      return `/admin/submissions`;
    }

    return `/dashboard/submissions`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-slate-400">Loading notifications...</p>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="flex flex-col h-full mt-4">
      {unreadCount > 0 && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-400">
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="text-lime-400 hover:text-lime-300 hover:bg-slate-800"
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto -mx-6 px-6">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-slate-600 mb-4" />
            <p className="text-slate-400 text-center">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <Link
                key={notification.id}
                href={getNotificationLink(notification)}
                onClick={() =>
                  !notification.readAt && markAsRead(notification.id)
                }
                className={`block rounded-lg border p-4 transition-colors ${
                  notification.readAt
                    ? "border-slate-800 bg-slate-900/40"
                    : "border-lime-400/30 bg-lime-400/5"
                }`}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getStatusIcon(notification.payload.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-white text-sm">
                        {notification.title}
                      </p>
                      {!notification.readAt && (
                        <div className="flex-shrink-0 h-2 w-2 rounded-full bg-lime-400" />
                      )}
                    </div>
                    <p className="text-sm text-slate-300 mt-1">
                      {notification.message}
                    </p>
                    {(notification.payload.adminNote ||
                      notification.payload.message) && (
                      <p className="text-xs text-slate-400 mt-2 italic">
                        &quot;
                        {notification.payload.adminNote ||
                          notification.payload.message}
                        &quot;
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-2">
                      {getRelativeTime(notification.createdAt)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {hasMore && (
        <div className="mt-4 pt-4 border-t border-slate-800">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              // Could implement pagination here
              console.log("Load more notifications");
            }}
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
