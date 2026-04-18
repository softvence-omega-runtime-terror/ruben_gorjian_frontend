"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { useDrop } from "react-dnd";
import { CalendarItem } from "./calendar-item";
import dayjs, { Dayjs } from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import clsx from "clsx";
import { useCalendar } from "@/app/dashboard/calendar/calendar-context";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(utc);
dayjs.extend(timezone);

type CalendarPost = {
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
};

interface CalendarColumnProps {
  getDate: Dayjs;
  display: "day" | "week" | "month";
  posts: CalendarPost[];
  randomHour?: boolean;
  onEdit: (postId: string) => void;
  onDelete: (postId: string) => void;
  onDuplicate: (postId: string) => void;
  onPublish?: (postId: string) => void;
  onAddPost: (date: Dayjs) => void;
  onDragEnd: (postId: string, newDate: Date) => void;
  onDayClick?: () => void;
}

export const CalendarColumn = memo<CalendarColumnProps>(
  ({
    getDate,
    display,
    posts,
    randomHour,
    onEdit,
    onDelete,
    onDuplicate,
    onPublish,
    onAddPost,
    onDragEnd,
    onDayClick,
  }) => {
    const { timezone: userTimezone } = useCalendar();
    const [showAll, setShowAll] = useState(false);

    const postList = useMemo(() => {
      return posts.filter((post) => {
        const pDate = userTimezone ? dayjs.tz(post.scheduledFor, userTimezone) : dayjs(post.scheduledFor);
        const check =
          display === "day"
            ? pDate.format("YYYY-MM-DD HH:mm") ===
              getDate.format("YYYY-MM-DD HH:mm")
            : display === "week"
              ? pDate.isSame(getDate, "hour")
              : pDate.isSame(getDate, "day");
        return check;
      });
    }, [posts, display, getDate, userTimezone]);

    // Allow current day in month view and current hour in day/week views.
    // Only block dates that are strictly in the past.
    const isBeforeNow = useMemo(() => {
      const now = userTimezone ? dayjs().tz(userTimezone) : dayjs();
      if (display === "month") {
        // Block only days strictly before today
        return getDate.startOf("day").isBefore(now.startOf("day"));
      }
      // For day/week, block hours strictly before the current hour
      return getDate.startOf("hour").isBefore(now.startOf("hour"));
    }, [getDate, display, userTimezone]);

    const list = useMemo(() => {
      if (showAll) {
        return postList;
      }
      return postList.slice(0, 3);
    }, [postList, showAll]);

    const [{ canDrop }, drop] = useDrop(() => ({
      accept: "post",
      drop: async (item: { id: string; scheduledFor: string }) => {
        if (isBeforeNow) return;
        onDragEnd(item.id, getDate.toDate());
      },
      collect: (monitor) => ({
        canDrop: isBeforeNow
          ? false
          : !!monitor.canDrop() && !!monitor.isOver(),
      }),
    }));

    const dropRef = useCallback(
      (node: HTMLDivElement | null) => {
        drop(node);
      },
      [drop]
    );

    const showAllFunc = useCallback(() => {
      setShowAll(true);
    }, []);

    const showLessFunc = useCallback(() => {
      setShowAll(false);
    }, []);

    return (
      <div
        className={clsx(
          "flex flex-col w-full min-h-[70px] relative",
          isBeforeNow && "opacity-60",
          isBeforeNow
            ? "cursor-not-allowed"
            : "border border-slate-800/50 rounded-[8px]"
        )}
        ref={dropRef}
      >
        {display === "month" && (
          <div
            className={clsx(
              "pt-[6px] text-[14px] text-slate-300 px-1",
              onDayClick && "cursor-pointer hover:text-white transition-colors"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onDayClick?.();
            }}
          >
            {getDate.date()}
          </div>
        )}
        <div
          className={clsx(
            "relative flex flex-col flex-1 text-white rounded-[8px] min-h-[70px]",
            canDrop && "border-2 border-amber-500"
          )}
        >
          <div
            className={clsx(
              "flex-col text-[12px] pointer w-full flex overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900",
              isBeforeNow ? "flex-1" : "cursor-pointer",
              isBeforeNow && postList.length === 0 && "min-h-[40px]"
            )}
          >
            {list.map((post) => (
              <div
                key={post.id}
                className={clsx(
                  "text-slate-200 p-[2.5px] relative flex flex-col justify-center items-center"
                )}
              >
                <div className="relative w-full flex flex-col items-center p-[2.5px]">
                  <CalendarItem
                    display={display}
                    isBeforeNow={isBeforeNow}
                    date={getDate}
                    post={post}
                    onEdit={() => onEdit(post.id)}
                    onDelete={() => onDelete(post.id)}
                    onDuplicate={() => onDuplicate(post.id)}
                    onPublish={onPublish ? () => onPublish(post.id) : undefined}
                  />
                </div>
              </div>
            ))}
            {!showAll && postList.length > 3 && (
              <div
                className="text-center hover:underline py-[5px] text-slate-400 text-[11px] cursor-pointer"
                onClick={showAllFunc}
              >
                + Show more ({postList.length - 3})
              </div>
            )}
            {showAll && postList.length > 3 && (
              <div
                className="text-center hover:underline py-[5px] text-slate-400 text-[11px] cursor-pointer"
                onClick={showLessFunc}
              >
                - Show less
              </div>
            )}
          </div>
          {!isBeforeNow && (
            <div
              className="pb-[2.5px] px-[5px] flex-1 flex"
              onClick={() =>
                onAddPost(
                  randomHour
                    ? getDate.hour(Math.floor(Math.random() * 24))
                    : getDate
                )
              }
            >
              <div
                className={clsx(
                  display === "month"
                    ? "flex-1 min-h-[40px] w-full"
                    : !postList.length
                      ? "min-h-full w-full p-[5px]"
                      : "min-h-[40px] w-full",
                  "flex items-center justify-center cursor-pointer pb-[2.5px]"
                )}
              >
                {display !== "day" && (
                  <div className="group hover:before:h-[30px] w-full h-full rounded-[8px] flex justify-center items-center text-white">
                    <div className="group-hover:before:content-['+'] pb-[5px] flex justify-center items-center rounded-[8px] transition-all group-hover:bg-amber-600/20 w-full h-full max-w-[40px] max-h-[40px] border border-dashed border-slate-700 group-hover:border-amber-600/50" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

CalendarColumn.displayName = "CalendarColumn";
=======
"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { useDrop } from "react-dnd";
import { CalendarItem } from "./calendar-item";
import dayjs, { Dayjs } from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import clsx from "clsx";
import { useCalendar } from "@/app/dashboard/calendar/calendar-context";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(utc);
dayjs.extend(timezone);

type CalendarPost = {
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
};

interface CalendarColumnProps {
  getDate: Dayjs;
  display: "day" | "week" | "month";
  posts: CalendarPost[];
  randomHour?: boolean;
  onEdit: (postId: string) => void;
  onDelete: (postId: string) => void;
  onDuplicate: (postId: string) => void;
  onPublish?: (postId: string) => void;
  onAddPost: (date: Dayjs) => void;
  onDragEnd: (postId: string, newDate: Date) => void;
  onDayClick?: () => void;
}

export const CalendarColumn = memo<CalendarColumnProps>(
  ({
    getDate,
    display,
    posts,
    randomHour,
    onEdit,
    onDelete,
    onDuplicate,
    onPublish,
    onAddPost,
    onDragEnd,
    onDayClick,
  }) => {
    const { timezone: userTimezone } = useCalendar();
    const [showAll, setShowAll] = useState(false);

    const postList = useMemo(() => {
      const dateInTz = userTimezone ? getDate.tz(userTimezone) : getDate;
      const targetDay = dateInTz.format("YYYY-MM-DD");
      
      return posts.filter((post) => {
        // Special case: Failed posts should be counted in stats but hidden from the grid
        // to satisfy the requirement that Admin 'Delete' (now mapping to FAILED) makes them disappear.
        if (post.status === "FAILED") return false;

        const pDate = userTimezone ? dayjs.tz(post.scheduledFor, userTimezone) : dayjs(post.scheduledFor);
        
        if (display === "day") {
          return pDate.format("YYYY-MM-DD HH:mm") === dateInTz.format("YYYY-MM-DD HH:mm");
        }
        if (display === "week") {
          return pDate.isSame(dateInTz, "hour");
        }
        
        // Month view: compare YYYY-MM-DD strings for maximum reliability
        return pDate.format("YYYY-MM-DD") === targetDay;
      });
    }, [posts, display, getDate, userTimezone]);

    // Allow current day in month view and current hour in day/week views.
    // Only block dates that are strictly in the past.
    // Month view: block only days strictly before today in the user's timezone
    const isToday = useMemo(() => {
      const now = userTimezone ? dayjs().tz(userTimezone) : dayjs();
      const dateInTz = userTimezone ? getDate.tz(userTimezone) : getDate;
      return dateInTz.isSame(now, "day");
    }, [getDate, userTimezone]);

    const isBeforeNow = useMemo(() => {
      const now = userTimezone ? dayjs().tz(userTimezone) : dayjs();
      const dateInTz = userTimezone ? getDate.tz(userTimezone) : getDate;
      
      if (display === "month") {
        return dateInTz.startOf("day").isBefore(now.startOf("day"));
      }
      return dateInTz.startOf("hour").isBefore(now.startOf("hour"));
    }, [getDate, display, userTimezone]);

    const list = useMemo(() => {
      if (showAll) {
        return postList;
      }
      return postList.slice(0, 3);
    }, [postList, showAll]);

    const [{ canDrop }, drop] = useDrop(() => ({
      accept: "post",
      drop: async (item: { id: string; scheduledFor: string }) => {
        if (isBeforeNow) return;
        onDragEnd(item.id, getDate.toDate());
      },
      collect: (monitor) => ({
        canDrop: isBeforeNow
          ? false
          : !!monitor.canDrop() && !!monitor.isOver(),
      }),
    }));

    const dropRef = useCallback(
      (node: HTMLDivElement | null) => {
        drop(node);
      },
      [drop]
    );

    const showAllFunc = useCallback(() => {
      setShowAll(true);
    }, []);

    const showLessFunc = useCallback(() => {
      setShowAll(false);
    }, []);

    return (
      <div
        className={clsx(
          "flex flex-col w-full h-full relative group transition-colors",
          isBeforeNow && "opacity-60",
          !isBeforeNow && "hover:bg-slate-800/20"
        )}
        ref={dropRef}
      >
        {display === "month" && (
          <div
            className={clsx(
              "pt-2 pb-1 text-[13px] font-bold text-slate-400 px-3 flex justify-between items-center",
              onDayClick && "cursor-pointer hover:text-white transition-colors"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onDayClick?.();
            }}
          >
            <span className={clsx(
               "w-6 h-6 flex items-center justify-center rounded-full leading-none",
               isToday && "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
            )}>
              {getDate.date()}
            </span>
          </div>
        )}
        <div
          className={clsx(
            "relative flex flex-col flex-1 text-white rounded-[8px] min-h-[70px]",
            canDrop && "border-2 border-amber-500"
          )}
        >
          <div
            className={clsx(
              "flex-col text-[12px] pointer w-full flex",
              isBeforeNow ? "flex-1" : "cursor-pointer",
              isBeforeNow && postList.length === 0 && "min-h-[40px]"
            )}
          >
            {list.map((post) => (
              <div
                key={post.id}
                className={clsx(
                  "text-slate-200 p-[2.5px] relative flex flex-col justify-center items-center"
                )}
              >
                <div className="relative w-full flex flex-col items-center p-[2.5px]">
                  <CalendarItem
                    display={display}
                    isBeforeNow={isBeforeNow}
                    date={getDate}
                    post={post}
                    onEdit={() => onEdit(post.id)}
                    onDelete={() => onDelete(post.id)}
                    onDuplicate={() => onDuplicate(post.id)}
                    onPublish={onPublish ? () => onPublish(post.id) : undefined}
                  />
                </div>
              </div>
            ))}
            {!showAll && postList.length > 3 && (
              <div
                className="text-center hover:underline py-[5px] text-slate-400 text-[11px] cursor-pointer"
                onClick={showAllFunc}
              >
                + Show more ({postList.length - 3})
              </div>
            )}
            {showAll && postList.length > 3 && (
              <div
                className="text-center hover:underline py-[5px] text-slate-400 text-[11px] cursor-pointer"
                onClick={showLessFunc}
              >
                - Show less
              </div>
            )}
          </div>
          {!isBeforeNow && (
            <div
              className="pb-[2.5px] px-[5px] flex-1 flex"
              onClick={() =>
                onAddPost(
                  randomHour
                    ? getDate.hour(Math.floor(Math.random() * 24))
                    : getDate
                )
              }
            >
              <div
                className={clsx(
                  display === "month"
                    ? "flex-1 min-h-[40px] w-full"
                    : !postList.length
                      ? "min-h-full w-full p-[5px]"
                      : "min-h-[40px] w-full",
                  "flex items-center justify-center cursor-pointer pb-[2.5px]"
                )}
              >
                {display !== "day" && (
                  <div className="group hover:before:h-[30px] w-full h-full rounded-[8px] flex justify-center items-center text-white">
                    <div className="group-hover:before:content-['+'] pb-[5px] flex justify-center items-center rounded-[8px] transition-all group-hover:bg-amber-600/20 w-full h-full max-w-[40px] max-h-[40px] border border-dashed border-slate-700 group-hover:border-amber-600/50" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

CalendarColumn.displayName = "CalendarColumn";

