"use client";

import { useDrop } from "react-dnd";
import clsx from "clsx";
import { Plus } from "lucide-react";
import { Dayjs } from "dayjs";
import { useRef, useEffect } from "react";

interface CalendarDropZoneProps {
  date: Dayjs;
  hour?: number;
  onDrop: (date: Date) => void;
  onAddPost?: (date: Dayjs) => void;
  isPast?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function CalendarDropZone({
  date,
  hour,
  onDrop,
  onAddPost,
  isPast = false,
  className,
  children,
}: CalendarDropZoneProps) {
  const dropDate = hour !== undefined ? date.hour(hour).minute(0) : date;

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: "post",
    drop: () => {
      onDrop(dropDate.toDate());
      return { date: dropDate.toDate(), hour };
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const dropRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    drop(dropRef);
  }, [drop]);

  return (
    <div
      ref={dropRef}
      className={clsx(
        "relative transition-colors",
        isOver && canDrop && "bg-amber-950/30 ring-2 ring-amber-500/50",
        isPast && "opacity-40",
        className
      )}
    >
      {children}
      {isOver && canDrop && (
        <div className="absolute inset-0 bg-amber-500/10 border-2 border-dashed border-amber-500/50 rounded flex items-center justify-center z-10">
          <span className="text-xs text-amber-400 font-medium">Drop here</span>
        </div>
      )}
      {!isPast && !children && onAddPost && (
        <button
          onClick={() => onAddPost(dropDate)}
          className="w-full h-full min-h-[40px] rounded border border-dashed border-slate-700/30 hover:border-slate-600 hover:bg-slate-800/20 transition-colors opacity-0 hover:opacity-100 flex items-center justify-center"
        >
          <Plus className="h-3 w-3 text-slate-500" />
        </button>
      )}
    </div>
  );
}
