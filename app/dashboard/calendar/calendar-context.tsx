"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { useTimezone } from "@/hooks/use-timezone";
import { fromUTC, toUTC } from "@/lib/timezone";
import { useUiStore } from "@/store/uiStore";
import { useSocket } from "@/app/providers/SocketProvider";

dayjs.extend(isoWeek);
dayjs.extend(utc);
dayjs.extend(timezone);

interface Post {
  id: string;
  caption: string;
  scheduledFor: string;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHING" | "POSTED" | "FAILED";
  hashtags?: string[] | null;
  assetId?: string;
  assetIds?: string[];
  asset?: {
    id: string;
    storageKey: string;
    type: "IMAGE" | "VIDEO";
    contentType?: string | null;
  };
  targets: Array<{
    id: string;
    platform: "INSTAGRAM" | "FACEBOOK" | "LINKEDIN" | "TIKTOK";
    status: "PENDING" | "SCHEDULED" | "POSTED" | "FAILED";
    errorMessage?: string | null;
    externalPostId?: string | null;
    publishedAt?: string | null;
    socialAccount?: {
      id: string;
      displayName: string;
    };
  }>;
}

interface SocialAccount {
  id: string;
  platform: "INSTAGRAM" | "FACEBOOK" | "LINKEDIN" | "TIKTOK";
  displayName: string;
  externalAccountId: string;
}

interface CalendarContextType {
  // View state
  display: "day" | "week" | "month";
  startDate: string;
  endDate: string;

  // Data
  posts: Post[];
  socialAccounts: SocialAccount[];

  // Loading states
  loading: boolean;

  // Actions
  setDisplay: (display: "day" | "week" | "month") => void;
  setDateRange: (startDate: string, endDate: string) => void;
  navigateDate: (direction: "prev" | "next" | "today") => void;
  navigateToDate: (date: dayjs.Dayjs) => void;

  // Post operations
  createPost: (data: CreatePostData) => Promise<void>;
  updatePost: (id: string, data: Partial<CreatePostData>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  duplicatePost: (id: string) => Promise<void>;
  movePost: (id: string, newDate: dayjs.Dayjs) => Promise<void>;
  publishPost: (id: string) => Promise<void>;

  // Data refresh
  refreshData: () => Promise<void>;

  // Admin / Impersonation
  targetUserId?: string;

  // Timezone info (optional, added dynamically)
  timezone?: string;
  timezoneAbbr?: string;
  timezoneDisplayName?: string;
}

interface CreatePostData {
  caption: string;
  scheduledFor: Date;
  platforms: string[];
  socialAccountIds: string[];
  assetId?: string;
  assetIds?: string[];
  hashtags?: string[];
  userId?: string; // For admin
  adminReason?: string; // For admin
}

const CalendarContext = createContext<CalendarContextType | null>(null);

function getDateRange(display: string, referenceDate?: string, tz?: string) {
  const date = referenceDate
    ? tz
      ? dayjs.tz(referenceDate, tz)
      : dayjs(referenceDate)
    : tz
      ? dayjs().tz(tz)
      : dayjs();

  switch (display) {
    case "day":
      return {
        startDate: date.startOf("day").format("YYYY-MM-DD"),
        endDate: date.endOf("day").format("YYYY-MM-DD"),
      };
    case "week":
      return {
        startDate: date.startOf("isoWeek").format("YYYY-MM-DD"),
        endDate: date.endOf("isoWeek").format("YYYY-MM-DD"),
      };
    case "month":
      return {
        startDate: date.startOf("month").format("YYYY-MM-DD"),
        endDate: date.endOf("month").format("YYYY-MM-DD"),
      };
    default:
      return {
        startDate: date.startOf("isoWeek").format("YYYY-MM-DD"),
        endDate: date.endOf("isoWeek").format("YYYY-MM-DD"),
      };
  }
}

export function CalendarProvider({
  children,
  targetUserId,
}: {
  children: ReactNode;
  targetUserId?: string;
}) {
  const {
    timezone: userTimezone,
    timezoneAbbr,
    timezoneDisplayName,
    loading: timezoneLoading,
  } = useTimezone();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { socket } = useSocket();

  const storedView = useUiStore((state) => state.calendarView);
  const setStoredView = useUiStore((state) => state.setCalendarView);

  // Get view from URL or persisted store, default to "month"
  const getInitialDisplay = (): "day" | "week" | "month" => {
    const urlView = searchParams.get("view");
    if (urlView === "day" || urlView === "week" || urlView === "month") {
      return urlView;
    }
    return storedView || "month";
  };

  const [display, setDisplayState] = useState<"day" | "week" | "month">(() =>
    getInitialDisplay()
  );
  const [posts, setPosts] = useState<Post[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [focusDate, setFocusDate] = useState(() =>
    dayjs().format("YYYY-MM-DD")
  );
  const hasUserNavigatedRef = useRef(false);
  const isUpdatingDisplayRef = useRef(false);

  // Initialize date range
  const initialRange = getDateRange(display, focusDate, userTimezone ?? undefined);
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);

  const setDateRange = useCallback(
    (newStartDate: string, newEndDate: string) => {
      setStartDate(newStartDate);
      setEndDate(newEndDate);
    },
    []
  );

  // Sync display with URL and persisted store
  // Note: searchParams is NOT in dependencies to avoid recreating on every URL change
  // We read the current value from searchParams directly when needed
  const setDisplay = useCallback(
    (newDisplay: "day" | "week" | "month") => {
      isUpdatingDisplayRef.current = true;
      setDisplayState(newDisplay);
      setStoredView(newDisplay);
      const range = getDateRange(newDisplay, focusDate, userTimezone ?? undefined);
      setDateRange(range.startDate, range.endDate);
      // Update URL - read current searchParams at call time, not from closure
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.set("view", newDisplay);
      router.replace(`${pathname}?${currentParams.toString()}`, { scroll: false });
      // Reset flag after a brief delay to allow URL update to complete
      setTimeout(() => {
        isUpdatingDisplayRef.current = false;
      }, 0);
    },
    [focusDate, pathname, router, setDateRange, setStoredView, userTimezone]
  );

  const navigateDate = useCallback(
    (direction: "prev" | "next" | "today") => {
      hasUserNavigatedRef.current = true;
      const current = userTimezone ? dayjs.tz(focusDate, userTimezone) : dayjs(focusDate);
      let newDate: dayjs.Dayjs;

      if (direction === "today") {
        newDate = userTimezone ? dayjs().tz(userTimezone) : dayjs();
      } else {
        switch (display) {
          case "day":
            newDate =
              direction === "next"
                ? current.add(1, "day")
                : current.subtract(1, "day");
            break;
          case "week":
            newDate =
              direction === "next"
                ? current.add(1, "week")
                : current.subtract(1, "week");
            break;
          case "month":
            newDate =
              direction === "next"
                ? current.add(1, "month")
                : current.subtract(1, "month");
            break;
        }
      }

      const nextFocus = newDate.format("YYYY-MM-DD");
      setFocusDate(nextFocus);
      const range = getDateRange(display, nextFocus, userTimezone ?? undefined);
      setDateRange(range.startDate, range.endDate);
    },
    [display, focusDate, setDateRange, userTimezone]
  );

  const navigateToDate = useCallback(
    (date: dayjs.Dayjs) => {
      hasUserNavigatedRef.current = true;
      const nextFocus = date.format("YYYY-MM-DD");
      setFocusDate(nextFocus);
      const range = getDateRange(display, nextFocus, userTimezone ?? undefined);
      setDateRange(range.startDate, range.endDate);
    },
    [display, setDateRange, userTimezone]
  );

  const fetchPosts = useCallback(async () => {
    // Wait for timezone to load before fetching
    if (timezoneLoading || !userTimezone) return;

    try {
      setLoading(true);
      const rangeStart = userTimezone
        ? dayjs.tz(startDate, userTimezone).startOf("day").utc()
        : dayjs(startDate).startOf("day");
      const rangeEnd = userTimezone
        ? dayjs.tz(endDate, userTimezone).endOf("day").utc()
        : dayjs(endDate).endOf("day");

      // Use the scheduler API and pass targetUserId if it exists
      let url = `/api/scheduler/posts?startDate=${rangeStart.toISOString()}&endDate=${rangeEnd.toISOString()}`;
      if (targetUserId) {
        url += `&userId=${targetUserId}`;
      }

      const response = await fetch(url, { credentials: "include" });

      if (response.ok) {
        const data = await response.json();
        // The new scheduler API returns posts in 'items' array
        const rawPosts = Array.isArray(data) 
          ? data 
          : (data.items || data.posts || []);
        
        // Convert post dates from UTC to user timezone for display
        const postsWithTimezone = rawPosts.map((post: any) => ({
          ...post,
          scheduledFor: post.scheduledFor
            ? fromUTC(post.scheduledFor, userTimezone).format("YYYY-MM-DD HH:mm:ss")
            : post.scheduledFor,
        }));
        setPosts(postsWithTimezone);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, userTimezone, timezoneLoading, targetUserId]);

  const fetchSocialAccounts = useCallback(async () => {
    try {
      let url = "/api/social-media/platform/my-links";
      if (targetUserId) {
        url += `?userId=${targetUserId}`;
      }
      const response = await fetch(url, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        // Assuming the data format might be { success: true, links: [...] } or just an array
        const rawAccounts = Array.isArray(data) 
          ? data 
          : data.links || data.accounts || data.data || [];
        
        const mappedAccounts: SocialAccount[] = rawAccounts.map((acc: any) => ({
          id: acc.id || acc._id || acc.platform,
          platform: acc.platform?.toUpperCase(),
          displayName: acc.username || acc.displayName || acc.platform,
          externalAccountId: acc.externalAccountId || acc.username || "",
        }));
        
        setSocialAccounts(mappedAccounts);
      }
    } catch (error) {
      console.error("Failed to fetch social accounts:", error);
    }
  }, []);

  const createPost = useCallback(
    async (data: CreatePostData) => {
      try {
        if (!userTimezone) {
          throw new Error("Timezone not ready. Please try again.");
        }
        // Convert scheduledFor from user timezone to UTC
        const payload = {
          ...data,
          scheduledAt: toUTC(dayjs(data.scheduledFor), userTimezone).toISOString(),
          ...(targetUserId ? { userId: targetUserId, adminReason: "Created from admin dashboard" } : {}),
        };
        // Remove scheduledFor if it exists in data to avoid confusion
        if ('scheduledFor' in payload) delete (payload as any).scheduledFor;

        const response = await fetch("/api/scheduler/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ data: JSON.stringify(payload) }),
        });

        if (response.ok) {
          await fetchPosts();
        } else {
          const error = await response.json();
          throw new Error(error.error || "Failed to create post");
        }
      } catch (error) {
        console.error("Failed to create post:", error);
        throw error;
      }
    },
    [fetchPosts, userTimezone, targetUserId]
  );

  const updatePost = useCallback(
    async (id: string, data: Partial<CreatePostData>) => {
      try {
        if (!userTimezone) {
          throw new Error("Timezone not ready. Please try again.");
        }
        const payload = {
          ...data,
          caption: data.caption || ".",
          ...(data.scheduledFor
            ? { scheduledAt: toUTC(dayjs(data.scheduledFor), userTimezone).toISOString() }
            : {}),
          ...(targetUserId ? { userId: targetUserId, adminReason: data.adminReason || "Updated from admin dashboard" } : {}),
        };
        if ('scheduledFor' in payload) delete (payload as any).scheduledFor;

        const response = await fetch(`/api/scheduler/posts/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ data: JSON.stringify(payload) }),
        });

        if (response.ok) {
          await fetchPosts();
        } else {
          const error = await response.json();
          throw new Error(error.error || "Failed to update post");
        }
      } catch (error) {
        console.error("Failed to update post:", error);
        throw error;
      }
    },
    [fetchPosts, userTimezone, targetUserId]
  );

  const deletePost = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/scheduler/posts/${id}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (response.ok) {
          await fetchPosts();
        } else {
          const error = await response.json();
          throw new Error(error.error || "Failed to delete post");
        }
      } catch (error) {
        console.error("Failed to delete post:", error);
        throw error;
      }
    },
    [fetchPosts]
  );

  const duplicatePost = useCallback(
    async (id: string) => {
      const post = posts.find((p) => p.id === id);
      if (!post) return;

      // post.scheduledFor is already in user timezone (from fetchPosts conversion)
      const scheduledDate = dayjs(post.scheduledFor).add(1, "hour");

      const duplicateData: CreatePostData = {
        caption: post.caption + " (Copy)",
        scheduledFor: scheduledDate.toDate(), // Will be converted to UTC in createPost
        platforms: post.targets.map((t) => t.platform),
        socialAccountIds: post.targets
          .map((t) => t.socialAccount?.id)
          .filter(Boolean) as string[],
        ...(post.assetIds && post.assetIds.length > 0
          ? { assetIds: post.assetIds }
          : post.assetId
            ? { assetId: post.assetId }
            : {}),
        hashtags: Array.isArray(post.hashtags) ? post.hashtags : undefined,
      };

      await createPost(duplicateData);
    },
    [posts, createPost]
  );

  const movePost = useCallback(
    async (id: string, newDate: dayjs.Dayjs) => {
      await updatePost(id, {
        scheduledFor: newDate.toDate(),
      });
    },
    [updatePost]
  );

  const publishPost = useCallback(
    async (id: string) => {
      const response = await fetch(`/api/posts/${id}/publish`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        await fetchPosts();
        return;
      }
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Failed to publish post");
    },
    [fetchPosts]
  );

  const refreshData = useCallback(async () => {
    await Promise.all([fetchPosts(), fetchSocialAccounts()]);
  }, [fetchPosts, fetchSocialAccounts]);

  // Sync display from URL on mount and when URL changes (e.g., browser back/forward)
  // Skip if we're currently updating display to prevent loops
  useEffect(() => {
    if (isUpdatingDisplayRef.current) return;
    
    const urlView = searchParams.get("view");
    if (urlView === "day" || urlView === "week" || urlView === "month") {
      if (urlView !== display) {
        setDisplayState(urlView);
        setStoredView(urlView);
        const range = getDateRange(urlView, focusDate, userTimezone ?? undefined);
        setDateRange(range.startDate, range.endDate);
      }
    }
  }, [searchParams, display, focusDate, setStoredView, setDateRange, userTimezone]);

  // Fetch data when date range changes
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Initial social account fetch
  useEffect(() => {
    fetchSocialAccounts();
  }, [fetchSocialAccounts]);

  useEffect(() => {
    if (!socket) return;
    const handleStatus = () => {
      fetchPosts();
    };
    socket.on("post:status_changed", handleStatus);
    socket.on("post:updated", handleStatus);
    socket.on("post:deleted", handleStatus);
    socket.on("post:failed", handleStatus);
    socket.on("post:published", handleStatus);
    return () => {
      socket.off("post:status_changed", handleStatus);
      socket.off("post:updated", handleStatus);
      socket.off("post:deleted", handleStatus);
      socket.off("post:failed", handleStatus);
      socket.off("post:published", handleStatus);
    };
  }, [socket, fetchPosts]);

  useEffect(() => {
    if (!userTimezone || hasUserNavigatedRef.current) return;
    const today = dayjs().tz(userTimezone).format("YYYY-MM-DD");
    setFocusDate(today);
    const range = getDateRange(display, today, userTimezone);
    setDateRange(range.startDate, range.endDate);
  }, [display, userTimezone, setDateRange]);

  const value: CalendarContextType = {
    display,
    startDate,
    endDate,
    posts,
    socialAccounts,
    loading,
    setDisplay,
    setDateRange,
    navigateDate,
    navigateToDate,
    createPost,
    updatePost,
    deletePost,
    duplicatePost,
    movePost,
    publishPost,
    refreshData,
    targetUserId,
    // Add timezone info to context
    timezone: userTimezone,
    timezoneAbbr,
    timezoneDisplayName,
  } as CalendarContextType & {
    timezone: string;
    timezoneAbbr: string;
    timezoneDisplayName: string;
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error("useCalendar must be used within CalendarProvider");
  }
  return context;
}
=======
"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { useTimezone } from "@/hooks/use-timezone";
import {
  fromUTC,
  formatForDateTimeLocal,
  parseDateTimeLocal,
  toUTC,
} from "@/lib/timezone";
import { useUiStore } from "@/store/uiStore";
import { useSocket } from "@/app/providers/SocketProvider";

dayjs.extend(isoWeek);
dayjs.extend(utc);
dayjs.extend(timezone);

interface Post {
  id: string;
  caption: string;
  scheduledFor: string;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHING" | "POSTED" | "FAILED";
  hashtags?: string[] | null;
  assetId?: string;
  assetIds?: string[];
  asset?: {
    id: string;
    storageKey: string;
    type: "IMAGE" | "VIDEO";
    contentType?: string | null;
  };
  targets: Array<{
    id: string;
    platform: "INSTAGRAM" | "FACEBOOK" | "LINKEDIN" | "TIKTOK";
    status: "PENDING" | "SCHEDULED" | "POSTED" | "FAILED";
    errorMessage?: string | null;
    externalPostId?: string | null;
    publishedAt?: string | null;
    socialAccount?: {
      id: string;
      displayName: string;
    };
  }>;
}

interface SocialAccount {
  id: string;
  platform: "INSTAGRAM" | "FACEBOOK" | "LINKEDIN" | "TIKTOK";
  displayName: string;
  externalAccountId: string;
}

interface CalendarContextType {
  // View state
  display: "day" | "week" | "month";
  startDate: string;
  endDate: string;

  // Data
  posts: Post[];
  socialAccounts: SocialAccount[];

  // Loading states
  loading: boolean;

  // Actions
  setDisplay: (display: "day" | "week" | "month") => void;
  setDateRange: (startDate: string, endDate: string) => void;
  navigateDate: (direction: "prev" | "next" | "today") => void;
  navigateToDate: (date: dayjs.Dayjs) => void;

  // Post operations
  createPost: (data: CreatePostData) => Promise<void>;
  updatePost: (id: string, data: Partial<CreatePostData>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  duplicatePost: (id: string) => Promise<void>;
  movePost: (id: string, newDate: dayjs.Dayjs) => Promise<void>;
  publishPost: (id: string) => Promise<void>;

  // Data refresh
  refreshData: () => Promise<void>;

  // Admin / Impersonation
  targetUserId?: string;

  // Timezone info (optional, added dynamically)
  timezone?: string;
  timezoneAbbr?: string;
  timezoneDisplayName?: string;
}

interface CreatePostData {
  caption: string;
  scheduledFor: string;
  platforms: string[];
  socialAccountIds: string[];
  assetId?: string;
  assetIds?: string[];
  hashtags?: string[];
  userId?: string; // For admin
  adminReason?: string; // For admin
}

const CalendarContext = createContext<CalendarContextType | null>(null);

function getDateRange(display: string, referenceDate?: string, tz?: string) {
  const date = referenceDate
    ? tz
      ? dayjs.tz(referenceDate, tz)
      : dayjs(referenceDate)
    : tz
      ? dayjs().tz(tz)
      : dayjs();

  switch (display) {
    case "day":
      return {
        startDate: date.startOf("day").format("YYYY-MM-DD"),
        endDate: date.endOf("day").format("YYYY-MM-DD"),
      };
    case "week":
      return {
        startDate: date.startOf("isoWeek").format("YYYY-MM-DD"),
        endDate: date.endOf("isoWeek").format("YYYY-MM-DD"),
      };
    case "month":
      return {
        startDate: date.startOf("month").format("YYYY-MM-DD"),
        endDate: date.endOf("month").format("YYYY-MM-DD"),
      };
    default:
      return {
        startDate: date.startOf("isoWeek").format("YYYY-MM-DD"),
        endDate: date.endOf("isoWeek").format("YYYY-MM-DD"),
      };
  }
}

export function CalendarProvider({
  children,
  targetUserId,
}: {
  children: ReactNode;
  targetUserId?: string;
}) {
  const {
    timezone: userTimezone,
    timezoneAbbr,
    timezoneDisplayName,
    loading: timezoneLoading,
  } = useTimezone();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { socket } = useSocket();

  const storedView = useUiStore((state) => state.calendarView);
  const setStoredView = useUiStore((state) => state.setCalendarView);

  // Get view from URL or persisted store, default to "month"
  const getInitialDisplay = (): "day" | "week" | "month" => {
    const urlView = searchParams.get("view");
    if (urlView === "day" || urlView === "week" || urlView === "month") {
      return urlView;
    }
    return storedView || "month";
  };

  const [display, setDisplayState] = useState<"day" | "week" | "month">(() =>
    getInitialDisplay()
  );
  const [posts, setPosts] = useState<Post[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [focusDate, setFocusDate] = useState(() =>
    dayjs().format("YYYY-MM-DD")
  );
  const hasUserNavigatedRef = useRef(false);
  const isUpdatingDisplayRef = useRef(false);

  // Initialize date range
  const initialRange = getDateRange(display, focusDate, userTimezone ?? undefined);
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);

  const setDateRange = useCallback(
    (newStartDate: string, newEndDate: string) => {
      setStartDate(newStartDate);
      setEndDate(newEndDate);
    },
    []
  );

  // Sync display with URL and persisted store
  // Note: searchParams is NOT in dependencies to avoid recreating on every URL change
  // We read the current value from searchParams directly when needed
  const setDisplay = useCallback(
    (newDisplay: "day" | "week" | "month") => {
      isUpdatingDisplayRef.current = true;
      setDisplayState(newDisplay);
      setStoredView(newDisplay);
      const range = getDateRange(newDisplay, focusDate, userTimezone ?? undefined);
      setDateRange(range.startDate, range.endDate);
      // Update URL - read current searchParams at call time, not from closure
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.set("view", newDisplay);
      router.replace(`${pathname}?${currentParams.toString()}`, { scroll: false });
      // Reset flag after a brief delay to allow URL update to complete
      setTimeout(() => {
        isUpdatingDisplayRef.current = false;
      }, 0);
    },
    [focusDate, pathname, router, setDateRange, setStoredView, userTimezone]
  );

  const navigateDate = useCallback(
    (direction: "prev" | "next" | "today") => {
      hasUserNavigatedRef.current = true;
      const current = userTimezone ? dayjs.tz(focusDate, userTimezone) : dayjs(focusDate);
      let newDate: dayjs.Dayjs;

      if (direction === "today") {
        newDate = userTimezone ? dayjs().tz(userTimezone) : dayjs();
      } else {
        switch (display) {
          case "day":
            newDate =
              direction === "next"
                ? current.add(1, "day")
                : current.subtract(1, "day");
            break;
          case "week":
            newDate =
              direction === "next"
                ? current.add(1, "week")
                : current.subtract(1, "week");
            break;
          case "month":
            newDate =
              direction === "next"
                ? current.add(1, "month")
                : current.subtract(1, "month");
            break;
        }
      }

      const nextFocus = newDate.format("YYYY-MM-DD");
      setFocusDate(nextFocus);
      const range = getDateRange(display, nextFocus, userTimezone ?? undefined);
      setDateRange(range.startDate, range.endDate);
    },
    [display, focusDate, setDateRange, userTimezone]
  );

  const navigateToDate = useCallback(
    (date: dayjs.Dayjs) => {
      hasUserNavigatedRef.current = true;
      const nextFocus = date.format("YYYY-MM-DD");
      setFocusDate(nextFocus);
      const range = getDateRange(display, nextFocus, userTimezone ?? undefined);
      setDateRange(range.startDate, range.endDate);
    },
    [display, setDateRange, userTimezone]
  );

  const fetchPosts = useCallback(async () => {
    // Wait for timezone to load before fetching
    if (timezoneLoading || !userTimezone) return;

    try {
      setLoading(true);
      const rangeStart = userTimezone
        ? dayjs.tz(startDate, userTimezone).startOf("day").utc()
        : dayjs(startDate).startOf("day");
      const rangeEnd = userTimezone
        ? dayjs.tz(endDate, userTimezone).endOf("day").utc()
        : dayjs(endDate).endOf("day");

      // Use the scheduler API and pass targetUserId if it exists
      let url = `/api/scheduler/posts?startDate=${rangeStart.toISOString()}&endDate=${rangeEnd.toISOString()}`;
      if (targetUserId) {
        url += `&userId=${targetUserId}`;
      }

      const response = await fetch(url, { credentials: "include" });

      if (response.ok) {
        const data = await response.json();
        // The new scheduler API returns posts in 'items' array
        const rawPosts = Array.isArray(data) 
          ? data 
          : (data.items || data.posts || []);
        
        // Convert post dates from UTC to user timezone for display
        const postsWithTimezone = rawPosts.map((post: any) => {
          const dateValue = post.scheduledFor || post.scheduledAt;
          return {
            ...post,
            scheduledFor: dateValue
              ? fromUTC(dateValue, userTimezone).format()
              : dateValue,
          };
        });
        setPosts(postsWithTimezone);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, userTimezone, timezoneLoading, targetUserId]);

  const fetchSocialAccounts = useCallback(async () => {
    try {
      let url = "/api/social-media/platform/my-links";
      if (targetUserId) {
        url += `?userId=${targetUserId}`;
      }
      const response = await fetch(url, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        // Assuming the data format might be { success: true, links: [...] } or just an array
        const rawAccounts = Array.isArray(data) 
          ? data 
          : data.links || data.accounts || data.data || [];
        
        const mappedAccounts: SocialAccount[] = rawAccounts.map((acc: any) => ({
          id: acc.id || acc._id || acc.platform,
          platform: acc.platform?.toUpperCase(),
          displayName: acc.username || acc.displayName || acc.platform,
          externalAccountId: acc.externalAccountId || acc.username || "",
        }));
        
        setSocialAccounts(mappedAccounts);
      }
    } catch (error) {
      console.error("Failed to fetch social accounts:", error);
    }
  }, []);

  const createPost = useCallback(
    async (data: CreatePostData) => {
      try {
        if (!userTimezone) {
          throw new Error("Timezone not ready. Please try again.");
        }
        // Convert scheduledFor from user timezone to UTC
        const dateISO = parseDateTimeLocal(data.scheduledFor, userTimezone).toISOString();
        const payload = {
          ...data,
          scheduledAt: dateISO,
          scheduledFor: dateISO,
          ...(targetUserId ? { userId: targetUserId, adminReason: "Created from admin dashboard" } : {}),
        };

        const response = await fetch("/api/scheduler/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ data: JSON.stringify(payload) }),
        });

        if (response.ok) {
          await fetchPosts();
        } else {
          const error = await response.json();
          throw new Error(error.error || "Failed to create post");
        }
      } catch (error) {
        console.error("Failed to create post:", error);
        throw error;
      }
    },
    [fetchPosts, userTimezone, targetUserId]
  );

  const updatePost = useCallback(
    async (id: string, data: Partial<CreatePostData>) => {
      try {
        if (!userTimezone) {
          throw new Error("Timezone not ready. Please try again.");
        }
        const payload = {
          ...data,
          caption: data.caption || ".",
          ...(data.scheduledFor
            ? { 
                scheduledAt: parseDateTimeLocal(data.scheduledFor, userTimezone).toISOString(),
                scheduledFor: parseDateTimeLocal(data.scheduledFor, userTimezone).toISOString()
              }
            : {}),
          ...(targetUserId ? { userId: targetUserId, adminReason: data.adminReason || "Updated from admin dashboard" } : {}),
        };

        const response = await fetch(`/api/scheduler/posts/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ data: JSON.stringify(payload) }),
        });

        if (response.ok) {
          await fetchPosts();
        } else {
          const error = await response.json();
          throw new Error(error.error || "Failed to update post");
        }
      } catch (error) {
        console.error("Failed to update post:", error);
        throw error;
      }
    },
    [fetchPosts, userTimezone, targetUserId]
  );

  const deletePost = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/scheduler/posts/${id}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (response.ok) {
          await fetchPosts();
        } else {
          const error = await response.json();
          throw new Error(error.error || "Failed to delete post");
        }
      } catch (error) {
        console.error("Failed to delete post:", error);
        throw error;
      }
    },
    [fetchPosts]
  );

  const duplicatePost = useCallback(
    async (id: string) => {
      const post = posts.find((p) => p.id === id);
      if (!post) return;

      // post.scheduledFor is already in user timezone (from fetchPosts conversion)
      const scheduledDate = dayjs.tz(post.scheduledFor, userTimezone).add(1, "hour");

      const duplicateData: CreatePostData = {
        caption: post.caption + " (Copy)",
        scheduledFor: scheduledDate.format("YYYY-MM-DDTHH:mm"), // Pass formatted string to createPost
        platforms: post.targets.map((t) => t.platform),
        socialAccountIds: post.targets
          .map((t) => t.socialAccount?.id)
          .filter(Boolean) as string[],
        ...(post.assetIds && post.assetIds.length > 0
          ? { assetIds: post.assetIds }
          : post.assetId
            ? { assetId: post.assetId }
            : {}),
        hashtags: Array.isArray(post.hashtags) ? post.hashtags : undefined,
      };

      await createPost(duplicateData);
    },
    [posts, createPost]
  );

  const movePost = useCallback(
    async (id: string, newDate: dayjs.Dayjs) => {
      await updatePost(id, {
        scheduledFor: newDate.format("YYYY-MM-DDTHH:mm"),
      });
    },
    [updatePost]
  );

  const publishPost = useCallback(
    async (id: string) => {
      const response = await fetch(`/api/posts/${id}/publish`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        await fetchPosts();
        return;
      }
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Failed to publish post");
    },
    [fetchPosts]
  );

  const refreshData = useCallback(async () => {
    await Promise.all([fetchPosts(), fetchSocialAccounts()]);
  }, [fetchPosts, fetchSocialAccounts]);

  // Sync display from URL on mount and when URL changes (e.g., browser back/forward)
  // Skip if we're currently updating display to prevent loops
  useEffect(() => {
    if (isUpdatingDisplayRef.current) return;
    
    const urlView = searchParams.get("view");
    if (urlView === "day" || urlView === "week" || urlView === "month") {
      if (urlView !== display) {
        setDisplayState(urlView);
        setStoredView(urlView);
        const range = getDateRange(urlView, focusDate, userTimezone ?? undefined);
        setDateRange(range.startDate, range.endDate);
      }
    }
  }, [searchParams, display, focusDate, setStoredView, setDateRange, userTimezone]);

  // Fetch data when date range changes
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Initial social account fetch
  useEffect(() => {
    fetchSocialAccounts();
  }, [fetchSocialAccounts]);

  useEffect(() => {
    if (!socket) return;
    const handleStatus = () => {
      fetchPosts();
    };
    socket.on("post:status_changed", handleStatus);
    socket.on("post:updated", handleStatus);
    socket.on("post:deleted", handleStatus);
    socket.on("post:failed", handleStatus);
    socket.on("post:published", handleStatus);
    return () => {
      socket.off("post:status_changed", handleStatus);
      socket.off("post:updated", handleStatus);
      socket.off("post:deleted", handleStatus);
      socket.off("post:failed", handleStatus);
      socket.off("post:published", handleStatus);
    };
  }, [socket, fetchPosts]);

  useEffect(() => {
    if (!userTimezone || hasUserNavigatedRef.current) return;
    const today = dayjs().tz(userTimezone).format("YYYY-MM-DD");
    setFocusDate(today);
    const range = getDateRange(display, today, userTimezone);
    setDateRange(range.startDate, range.endDate);
  }, [display, userTimezone, setDateRange]);

  const value: CalendarContextType = {
    display,
    startDate,
    endDate,
    posts,
    socialAccounts,
    loading,
    setDisplay,
    setDateRange,
    navigateDate,
    navigateToDate,
    createPost,
    updatePost,
    deletePost,
    duplicatePost,
    movePost,
    publishPost,
    refreshData,
    targetUserId,
    // Add timezone info to context
    timezone: userTimezone,
    timezoneAbbr,
    timezoneDisplayName,
  } as CalendarContextType & {
    timezone: string;
    timezoneAbbr: string;
    timezoneDisplayName: string;
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error("useCalendar must be used within CalendarProvider");
  }
  return context;
}

