"use client";

import { useMemo, useCallback, useState, Fragment } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCalendar } from "./calendar-context";
import { useUpload } from "@/hooks/use-upload";
import { useScrollPropagation } from "@/hooks/use-scroll-propagation";
import { useSessionContext } from "@/context/SessionContext";
import dayjs, { Dayjs } from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Grid,
  AlertCircle,
  Loader2,
  List,
} from "lucide-react";
import clsx from "clsx";
import { CalendarColumn } from "@/components/calendar/calendar-column";
import { CalendarItem } from "@/components/calendar/calendar-item";
import { useDrop } from "react-dnd";
import PostModal from "./post-modal";
import PostDetailsModal from "./post-details-modal";

dayjs.extend(isoWeek);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(utc);
dayjs.extend(timezone);

const isTouchDevice = typeof window !== "undefined" && "ontouchstart" in window;

const hours = Array.from({ length: 24 }, (_, i) => i);

const MONTH_VIEW_WIDE_STORAGE_KEY = "talexia-calendar-month-wide";

const convertTimeFormat = (time: number) => {
  return `${time.toString().padStart(2, "0")}:00`;
};

// Drop zone component for Day view hour slots
function HourDropZone({
  hourDate,
  isPast,
  posts,
  onAddPost,
  onEdit,
  onDragEnd,
  onDelete,
  onDuplicate,
  onPublish,
}: {
  hourDate: Dayjs;
  isPast: boolean;
  posts: Array<{
    id: string;
    caption: string | null;
    hashtags?: string[] | null;
    scheduledFor: string;
    status: "DRAFT" | "SCHEDULED" | "PUBLISHING" | "POSTED" | "FAILED";
    asset?: {
      id: string;
      storageKey: string;
      type: "IMAGE" | "VIDEO";
      contentType?: string | null;
    };
    targets: Array<{
      id: string;
      platform: "INSTAGRAM" | "FACEBOOK" | "LINKEDIN" | "TIKTOK";
      status: string;
      errorMessage?: string | null;
    }>;
  }>;
  onAddPost: (date: Dayjs) => void;
  onEdit: (postId: string) => void;
  onDragEnd: (postId: string, newDate: Date) => void;
  onDelete: (postId: string) => void;
  onDuplicate: (postId: string) => void;
  onPublish?: (postId: string) => void;
  statusColors?: Record<string, string>;
}) {
  const [{ canDrop }, drop] = useDrop(() => ({
    accept: "post",
    drop: async (item: { id: string; scheduledFor: string }) => {
      if (isPast) return;
      onDragEnd(item.id, hourDate.toDate());
    },
    collect: (monitor) => ({
      canDrop: isPast ? false : !!monitor.canDrop() && !!monitor.isOver(),
    }),
  }));

  const dropRef = useCallback(
    (node: HTMLDivElement | null) => {
      drop(node);
    },
    [drop],
  );

  return (
    <div
      ref={dropRef}
      className={clsx(
        "flex-1 space-y-2 min-h-[60px] rounded-lg p-1 transition-colors",
        canDrop && "bg-amber-600/20 border-2 border-amber-500",
      )}
    >
      {posts.length > 0 ? (
        posts.map((post) => {
          return (
            <div key={post.id} className="w-full">
              <CalendarItem
                post={post}
                date={hourDate}
                isBeforeNow={isPast}
                display="day"
                onEdit={() => onEdit(post.id)}
                onDelete={() => onDelete(post.id)}
                onDuplicate={() => onDuplicate(post.id)}
                onPublish={onPublish ? () => onPublish(post.id) : undefined}
              />
            </div>
          );
        })
      ) : (
        <div
          onClick={() => !isPast && onAddPost(hourDate)}
          className={clsx(
            "rounded-lg p-3 cursor-pointer transition-all border border-dashed",
            isPast
              ? "border-slate-700/30 bg-slate-900/20 opacity-50 cursor-not-allowed"
              : "border-slate-700 hover:border-amber-600/50 hover:bg-amber-600/10",
          )}
        >
          <p className="text-xs text-slate-500 text-center">
            {isPast ? "Past time" : "Click to add post"}
          </p>
        </div>
      )}
    </div>
  );
}

function WeekView({
  onAddPost,
  onEdit,
  onDragEnd,
}: {
  onAddPost: (date: Dayjs) => void;
  onEdit: (postId: string) => void;
  onDragEnd: (postId: string, newDate: Date) => void;
}) {
  const { posts, startDate, deletePost, duplicatePost, publishPost, timezone: userTimezone } =
    useCalendar();
  const weekStart = userTimezone ? dayjs.tz(startDate, userTimezone).startOf("isoWeek") : dayjs(startDate).startOf("isoWeek");

  const localizedDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = weekStart.add(i, "day");
      days.push({
        name: day.format("dddd"),
        day: day.format("MMM D"),
        date: day,
      });
    }
    return days;
  }, [weekStart]);

  return (
    <div className="flex flex-col text-slate-200 min-h-full">
      <div
        className="flex-1 relative h-full overflow-x-auto overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x pan-y" }}
      >
        <div
          className="grid [grid-template-columns:136px_repeat(7,160px)] md:[grid-template-columns:136px_repeat(7,_minmax(0,_1fr))] gap-[4px] rounded-[10px] absolute h-full start-0 top-0 w-max md:w-full"
        >
          <div className="z-10 bg-slate-900/80 flex justify-center items-center flex-col h-[62px] rounded-[8px] sticky top-0 border border-slate-800/50"></div>
          {localizedDays.map((day) => {
            const isToday = day.date.isSame(dayjs(), "day");
            return (
              <div
                key={day.name}
                className="p-2 text-center bg-slate-900/80 flex justify-center items-center flex-col h-[62px] rounded-[8px] sticky top-0 z-[20] border border-slate-800/50"
              >
                <div className="text-[14px] font-[500] text-slate-400">
                  {day.name}
                </div>
                <div
                  className={clsx(
                    "text-[14px] font-[600] flex items-center justify-center gap-[6px]",
                    isToday && "text-amber-400",
                  )}
                >
                  {isToday && (
                    <div className="w-[6px] h-[6px] bg-amber-400 rounded-full" />
                  )}
                  {day.day}
                </div>
              </div>
            );
          })}
          {hours.map((hour) => (
            <Fragment key={hour}>
              <div className="p-2 pe-4 text-center items-center justify-center flex text-[14px] text-slate-400 border-t border-slate-800/50">
                {convertTimeFormat(hour)}
              </div>
              {localizedDays.map((day) => (
                <Fragment key={`${day.date.format("YYYY-MM-DD")}-${hour}`}>
                  <div className="relative border-t border-slate-800/50">
                    <CalendarColumn
                      getDate={day.date.hour(hour).startOf("hour")}
                      display="week"
                      posts={posts}
                      onEdit={onEdit}
                      onDelete={deletePost}
                      onDuplicate={duplicatePost}
                      onPublish={publishPost}
                      onAddPost={onAddPost}
                      onDragEnd={onDragEnd}
                    />
                  </div>
                </Fragment>
              ))}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function MonthView({
  onAddPost,
  onEdit,
  onDragEnd,
}: {
  onAddPost: (date: Dayjs) => void;
  onEdit: (postId: string) => void;
  onDragEnd: (postId: string, newDate: Date) => void;
}) {
  const {
    posts,
    startDate,
    deletePost,
    duplicatePost,
    publishPost,
    setDisplay,
    navigateToDate,
  } = useCalendar();
  const monthStart = dayjs(startDate).startOf("month");
  const [wideMonth, setWideMonth] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const stored = window.localStorage.getItem(MONTH_VIEW_WIDE_STORAGE_KEY);
      return stored === "true";
    } catch {
      return false;
    }
  });

  const toggleMonthWidth = () => {
    setWideMonth((prev) => {
      const next = !prev;
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            MONTH_VIEW_WIDE_STORAGE_KEY,
            String(next),
          );
        }
      } catch {
        // ignore
      }
      return next;
    });
  };

  const localizedDays = useMemo(() => {
    const days = [];
    for (let i = 1; i <= 7; i++) {
      days.push(dayjs().day(i).format("ddd"));
    }
    return days;
  }, []);

  const calendarDays = useMemo(() => {
    const currentMonth = monthStart.month();
    const currentYear = monthStart.year();
    const startOfMonth = dayjs(new Date(currentYear, currentMonth, 1));
    const startDayOfWeek = startOfMonth.isoWeekday();
    const daysBeforeMonth = startDayOfWeek - 1;
    const calendarStartDate = startOfMonth.subtract(daysBeforeMonth, "day");

    const calendarDays = [];
    let currentDay = calendarStartDate;
    for (let i = 0; i < 42; i++) {
      let label = "current-month";
      if (currentDay.month() < currentMonth) label = "previous-month";
      if (currentDay.month() > currentMonth) label = "next-month";
      calendarDays.push({
        day: currentDay,
        label,
      });
      currentDay = currentDay.add(1, "day");
    }
    return calendarDays;
  }, [monthStart]);

  const gridClassName = clsx(
    "grid grid-rows-[62px_auto] gap-[4px] rounded-[10px] absolute start-0 top-0",
    wideMonth
      ? "[grid-template-columns:repeat(7,160px)] w-max h-full"
      : "grid-cols-7 w-full h-full min-w-[700px]",
  );

  return (
    <div className="flex flex-col text-slate-200 h-full">
      <div className="flex items-center justify-end mb-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-full border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
          onClick={toggleMonthWidth}
        >
          {wideMonth ? "Compact" : "Wide"} View
        </Button>
      </div>
      <div
        className="flex-1 flex relative h-full overflow-x-auto overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x pan-y" }}
      >
        <div className={gridClassName}>
          {localizedDays.map((day) => (
            <div
              key={day}
              className="z-[20] p-2 bg-slate-900/80 flex justify-center items-center flex-col h-[62px] rounded-[8px] sticky top-0 border border-slate-800/50"
            >
              <div className="text-[14px] font-medium text-slate-400">
                {day}
              </div>
            </div>
          ))}
          {calendarDays.map((date, index) => {
            const isCurrentMonth = date.label === "current-month";
            const dayDate = dayjs(date.day).startOf("day");
            const isToday = dayDate.isSame(dayjs(), "day");

            return (
              <div
                key={index}
                className={clsx(
                  "text-center items-center justify-center flex rounded-[8px]",
                  !isCurrentMonth && "opacity-30",
                  isToday && "border border-lime-500/30 bg-lime-500/5",
                )}
              >
                <CalendarColumn
                  getDate={dayDate}
                  display="month"
                  posts={posts}
                  randomHour={true}
                  onEdit={onEdit}
                  onDelete={deletePost}
                  onDuplicate={duplicatePost}
                  onPublish={publishPost}
                  onAddPost={onAddPost}
                  onDragEnd={onDragEnd}
                  onDayClick={() => {
                    navigateToDate(dayDate);
                    setDisplay("day");
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DayView({
  onAddPost,
  onEdit,
  onDragEnd,
}: {
  onAddPost: (date: Dayjs) => void;
  onEdit: (postId: string) => void;
  onDragEnd: (postId: string, newDate: Date) => void;
}) {
  const {
    posts,
    startDate,
    navigateDate,
    timezoneAbbr,
    deletePost,
    duplicatePost,
    publishPost,
    timezone: userTimezone,
  } = useCalendar();
  const selectedDate = userTimezone ? dayjs.tz(startDate, userTimezone) : dayjs(startDate);
  const scrollHandlers = useScrollPropagation();

  // Group posts by hour for timeline display
  const postsByHour = useMemo(() => {
    const grouped: Record<number, typeof posts> = {};
    posts
      .filter((post) => {
        const pDate = dayjs(post.scheduledFor);
        return pDate.isSame(selectedDate, "day");
      })
      .forEach((post) => {
        const hour = dayjs(post.scheduledFor).hour();
        if (!grouped[hour]) {
          grouped[hour] = [];
        }
        grouped[hour].push(post);
      });

    // Sort posts within each hour
    Object.keys(grouped).forEach((hour) => {
      grouped[Number(hour)].sort((a, b) => {
        return (
          dayjs(a.scheduledFor).valueOf() - dayjs(b.scheduledFor).valueOf()
        );
      });
    });

    return grouped;
  }, [posts, selectedDate]);

  const statusColors = {
    DRAFT: "bg-slate-700/80",
    SCHEDULED: "bg-amber-600/80",
    PUBLISHING: "bg-amber-600/80",
    POSTED: "bg-emerald-600/80",
    FAILED: "bg-rose-600/80",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Day Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">
            {selectedDate.format("dddd, MMMM D, YYYY")}
          </h2>
          <span className="text-sm text-slate-400">({timezoneAbbr})</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate("prev")}
            className="border-slate-700 hover:bg-slate-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate("today")}
            className="border-slate-700 hover:bg-slate-800 text-xs"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate("next")}
            className="border-slate-700 hover:bg-slate-800"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Timeline List - Always show time slots */}
      <div
        className="flex-1 overflow-y-auto min-h-0 overscroll-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{ WebkitOverflowScrolling: "touch" }}
        {...scrollHandlers}
      >
        <div className="space-y-2">
          {hours.map((hour) => {
            const hourPosts = postsByHour[hour] || [];
            const hourDate = selectedDate.hour(hour).minute(0);
            const isPast = hourDate.isBefore(dayjs(), "minute");

            return (
              <div key={hour} className="flex gap-3 items-start">
                {/* Timestamp on left */}
                <div className="w-16 flex-shrink-0 pt-2">
                  <span className="text-sm font-medium text-slate-400">
                    {convertTimeFormat(hour)}
                  </span>
                </div>

                {/* Posts for this hour - with drop zone */}
                <HourDropZone
                  hourDate={hourDate}
                  isPast={isPast}
                  posts={hourPosts}
                  onAddPost={onAddPost}
                  onEdit={onEdit}
                  onDragEnd={onDragEnd}
                  onDelete={deletePost}
                  onDuplicate={duplicatePost}
                  onPublish={publishPost}
                  statusColors={statusColors}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function EnhancedCalendar() {
  const {
    display,
    setDisplay,
    startDate,
    endDate,
    navigateDate,
    loading,
    posts,
    socialAccounts,
    createPost,
    updatePost,
    movePost,
  } = useCalendar();
  const { session } = useSessionContext();
  const isAdmin = session?.role === "ADMIN" || session?.role === "SUPER_ADMIN";
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState<Dayjs | null>(null);
  const [editingPost, setEditingPost] = useState<{
    id: string;
    caption: string;
    scheduledFor: string;
    assetId?: string;
    assetIds?: string[];
    socialAccountIds: string[];
    hashtags?: string[];
  } | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [viewingPostId, setViewingPostId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { uploadFile, uploading } = useUpload();

  const handleAddPost = useCallback((date?: Dayjs) => {
    setModalDate(date ?? dayjs());
    setModalOpen(true);
  }, []);

  const handleCreatePost = useCallback(
    async (payload: {
      caption: string;
      scheduledFor: Date;
      socialAccountIds: string[];
      platforms: string[];
      assetId?: string;
      assetIds?: string[];
      hashtags?: string[];
    }) => {
      try {
        if (editingPost) {
          await updatePost(editingPost.id, {
            caption: payload.caption,
            scheduledFor: payload.scheduledFor,
            socialAccountIds: payload.socialAccountIds,
            platforms: payload.platforms,
            ...(payload.assetIds && payload.assetIds.length > 0
              ? { assetIds: payload.assetIds }
              : payload.assetId
                ? { assetId: payload.assetId }
                : {}),
            ...(payload.hashtags ? { hashtags: payload.hashtags } : {}),
          });
          setEditingPost(null);
        } else {
          await createPost({
            caption: payload.caption,
            scheduledFor: payload.scheduledFor,
            socialAccountIds: payload.socialAccountIds,
            platforms: payload.platforms,
            ...(payload.assetIds && payload.assetIds.length > 0
              ? { assetIds: payload.assetIds }
              : payload.assetId
                ? { assetId: payload.assetId }
                : {}),
            ...(payload.hashtags ? { hashtags: payload.hashtags } : {}),
          });
        }
        setError(null);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to save post";
        setError(message);
        throw err; // rethrow so PostModal can catch and show error inside the modal
      }
    },
    [createPost, updatePost, editingPost],
  );

  const handleViewPost = useCallback((postId: string) => {
    setViewingPostId(postId);
    setDetailsModalOpen(true);
  }, []);

  const handleEditPost = useCallback(
    (postId: string) => {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      // Prevent editing posted content
      if (post.status === "POSTED") {
        setError(
          "Cannot edit posts that have already been published. Please duplicate the post to create a new version.",
        );
        return;
      }

      setEditingPost({
        id: post.id,
        caption: post.caption || "",
        scheduledFor: post.scheduledFor || new Date().toISOString(),
        assetId: post.assetId,
        assetIds:
          (post.assetIds && Array.isArray(post.assetIds)
            ? post.assetIds
            : undefined) || (post.assetId ? [post.assetId] : undefined),
        socialAccountIds: post.targets
          .map((t) => t.socialAccount?.id)
          .filter(Boolean) as string[],
        hashtags: Array.isArray(post.hashtags)
          ? post.hashtags
          : post.hashtags
            ? [post.hashtags]
            : [],
      });
      // post.scheduledFor is already in user timezone
      setModalDate(dayjs(post.scheduledFor));
      setModalOpen(true);
    },
    [posts],
  );

  const handleDragEnd = useCallback(
    async (postId: string, newDate: Date) => {
      try {
        const targetDate = dayjs(newDate);
        const now = dayjs();

        // Validate: cannot move to past dates (before current minute)
        if (targetDate.isBefore(now, "minute")) {
          setError(
            "Cannot schedule posts in the past. Please select a current or future date/time.",
          );
          return;
        }

        await movePost(postId, targetDate);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to move post");
      }
    },
    [movePost],
  );

  const formatDateRange = () => {
    const start = dayjs(startDate);
    const end = dayjs(endDate);

    if (display === "day") {
      return start.format("MMMM D, YYYY");
    } else if (display === "week") {
      return `${start.format("MMM D")} - ${end.format("MMM D, YYYY")}`;
    } else {
      return start.format("MMMM YYYY");
    }
  };

  const stats = useMemo(() => {
    return {
      total: posts.length,
      scheduled: posts.filter(
        (p) => p.status === "SCHEDULED" || p.status === "PUBLISHING",
      ).length,
      posted: posts.filter((p) => p.status === "POSTED").length,
      failed: posts.filter((p) => p.status === "FAILED").length,
    };
  }, [posts]);

  const dndBackend = isTouchDevice ? TouchBackend : HTML5Backend;

  return (
    <DndProvider backend={dndBackend}>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Content Calendar
            </h1>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate("prev")}
                className="border-slate-700 hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium text-sm sm:text-base text-slate-300 min-w-[140px] sm:min-w-[200px] text-center">
                {formatDateRange()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate("next")}
                className="border-slate-700 hover:bg-slate-800"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex border border-slate-700 rounded-lg overflow-hidden bg-slate-900/50">
              <Button
                variant={display === "day" ? "default" : "ghost"}
                size="sm"
                onClick={() => setDisplay("day")}
                className={clsx(
                  "rounded-none border-0",
                  display !== "day" && "text-slate-400 hover:text-slate-200 hover:bg-slate-800",
                )}
                title="Day view"
              >
                <List className="h-4 w-4" />
                <span className="ml-1 sm:ml-2">Day</span>
              </Button>
              <Button
                variant={display === "week" ? "default" : "ghost"}
                size="sm"
                onClick={() => setDisplay("week")}
                className={clsx(
                  "rounded-none border-0 border-l border-r border-slate-700",
                  display !== "week" && "text-slate-400 hover:text-slate-200 hover:bg-slate-800",
                )}
                title="Week view"
              >
                <Calendar className="h-4 w-4" />
                <span className="ml-1 sm:ml-2">Week</span>
              </Button>
              <Button
                variant={display === "month" ? "default" : "ghost"}
                size="sm"
                onClick={() => setDisplay("month")}
                className={clsx(
                  "rounded-none border-0",
                  display !== "month" && "text-slate-400 hover:text-slate-200 hover:bg-slate-800",
                )}
                title="Month view"
              >
                <Grid className="h-4 w-4" />
                <span className="ml-1 sm:ml-2">Month</span>
              </Button>
            </div>

            <Button
              onClick={() => handleAddPost()}
              className="bg-lime-400 hover:bg-lime-500 text-black flex-1 sm:flex-initial"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Create Post</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border-slate-800/50 bg-slate-900/40">
            <CardContent className="p-4">
              <div className="text-xl sm:text-2xl font-bold text-white">
                {stats.total}
              </div>
              <div className="text-xs sm:text-sm text-slate-400">
                Total Posts
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-800/50 bg-slate-900/40">
            <CardContent className="p-4">
              <div className="text-xl sm:text-2xl font-bold text-amber-400">
                {stats.scheduled}
              </div>
              <div className="text-xs sm:text-sm text-slate-400">Scheduled</div>
            </CardContent>
          </Card>
          <Card className="border-slate-800/50 bg-slate-900/40">
            <CardContent className="p-4">
              <div className="text-xl sm:text-2xl font-bold text-emerald-400">
                {stats.posted}
              </div>
              <div className="text-xs sm:text-sm text-slate-400">Published</div>
            </CardContent>
          </Card>
          <Card className="border-slate-800/50 bg-slate-900/40">
            <CardContent className="p-4">
              <div className="text-xl sm:text-2xl font-bold text-rose-400">
                {stats.failed}
              </div>
              <div className="text-xs sm:text-sm text-slate-400">Failed</div>
            </CardContent>
          </Card>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="rounded-lg border border-rose-600/50 bg-rose-950/30 px-4 py-3 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="h-4 w-4 text-rose-500" />
            <p className="text-sm text-rose-300">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="ml-auto h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
        )}

        {/* Calendar */}
        <Card className="border-slate-800/50 bg-slate-900/40">
          <CardContent className="p-4 sm:p-6 min-h-[600px]">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
                  <div className="text-slate-400">Loading calendar...</div>
                </div>
              </div>
            ) : (
              <div className="h-[600px] sm:h-[700px]">
                {display === "day" && (
                  <DayView
                    onAddPost={handleAddPost}
                    onEdit={handleViewPost}
                    onDragEnd={handleDragEnd}
                  />
                )}
                {display === "week" && (
                  <WeekView
                    onAddPost={handleAddPost}
                    onEdit={handleViewPost}
                    onDragEnd={handleDragEnd}
                  />
                )}
                {display === "month" && (
                  <MonthView
                    onAddPost={handleAddPost}
                    onEdit={handleViewPost}
                    onDragEnd={handleDragEnd}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <PostModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingPost(null);
            setError(null);
          }}
          initialDate={modalDate}
          editingPost={editingPost}
          socialAccounts={socialAccounts.map((acc) => ({
            id: acc.id,
            platform: acc.platform,
            displayName: acc.displayName || acc.externalAccountId || acc.id,
            externalAccountId: acc.externalAccountId,
          }))}
          onCreate={handleCreatePost}
          onUpload={uploadFile}
          uploading={uploading}
          isAdmin={isAdmin}
        />

        <PostDetailsModal
          open={detailsModalOpen}
          onClose={() => {
            setDetailsModalOpen(false);
            setViewingPostId(null);
          }}
          postId={viewingPostId}
          onEdit={handleEditPost}
          onDelete={useCalendar().deletePost}
          posts={posts}
          loading={loading}
        />
      </div>
    </DndProvider>
  );
}
