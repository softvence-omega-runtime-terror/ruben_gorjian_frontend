"use client";

import { FormEvent, useEffect, useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Video,
  Calendar as CalendarIcon,
  Clock,
  Camera,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  PlusCircle,
  ShieldCheck,
  CalendarDays,
  History,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import dayjs from "dayjs";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { apiGet, apiPost, apiPatch } from "@/lib/api";
import { useSessionContext } from "@/context/SessionContext";
import { useSocket } from "@/app/providers/SocketProvider";
import { useTimezone } from "@/hooks/use-timezone";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

type Session = {
  id: string;
  scheduleType: "PHOTO_SESSION" | "VIDEO_SESSION";
  scheduledAt: string;
  scheduledFor?: string; // Added to fix TS error
  date?: string; // Added for completeness
  status: string;
  schedulerStatus: string;
  session?: {
    title: string;
    notes: string;
    durationMinutes: number;
    status: string;
  };
  // Fallback for older data or different API responses
  sessionTitle?: string;
  sessionNotes?: string;
  sessionDurationMinutes?: number;
};

export default function ScheduleVisitPage() {
  const { toast } = useToast();
  const { session: userSession } = useSessionContext();
  const { timezone: userTimezone } = useTimezone();
  const { socket } = useSocket();
  const isAdmin = userSession?.role === "ADMIN" || userSession?.role === "SUPER_ADMIN";

  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [selectedTime, setSelectedTime] = useState("10:00");
  const [sessionType, setSessionType] = useState<"PHOTO_SESSION" | "VIDEO_SESSION">("PHOTO_SESSION");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [duration, setDuration] = useState(60);

  // Admin only fields
  const [targetUserId, setTargetUserId] = useState("");
  const [adminReason, setAdminReason] = useState("");

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);

  // Fetch blocked dates
  const fetchSessions = useCallback(async () => {
    try {
      setLoadingSessions(true);
      // Use apiGet for consistent behavior
      const data = await apiGet<any>("/api/scheduler/sessions");
      const items = Array.isArray(data) ? data : (data.items || data.sessions || []);
      setSessions(items);
    } catch (err) {
      console.error("Failed to load sessions", err);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (!socket) return;
    const handleRefresh = () => {
      fetchSessions();
    };
    socket.on("session:created", handleRefresh);
    socket.on("session:updated", handleRefresh);
    socket.on("session:deleted", handleRefresh);
    socket.on("session:status_changed", handleRefresh);
    return () => {
      socket.off("session:created", handleRefresh);
      socket.off("session:updated", handleRefresh);
      socket.off("session:deleted", handleRefresh);
      socket.off("session:status_changed", handleRefresh);
    };
  }, [socket, fetchSessions]);

  const blockedDates = useMemo(() => {
    const dates = sessions
      .filter(s => s.status !== "CANCELLED" && s.status !== "REJECTED")
      .map(s => {
        const d = s.scheduledAt || s.scheduledFor || s.date;
        if (!d) return null;

        // IMPORTANT: We must interpret the saved UTC timestamp in the user's photoshoot timezone
        // directly. Using split('T')[0] on a UTC string can result in the wrong local date.
        try {
          return dayjs.tz(d, userTimezone).format("YYYY-MM-DD");
        } catch (err) {
          // Fallback if timezone conversion fails
          return dayjs(d).format("YYYY-MM-DD");
        }
      })
      .filter(Boolean) as string[];

    return Array.from(new Set(dates)); // Remove duplicates
  }, [sessions, userTimezone]);

  const calendarDays = useMemo(() => {
    const startOfMonth = currentDate.startOf("month");
    const endOfMonth = currentDate.endOf("month");
    const startDay = startOfMonth.startOf("week");
    const endDay = endOfMonth.endOf("week");

    const days = [];
    let day = startDay;
    while (day.isBefore(endDay) || day.isSame(endDay, "day")) {
      days.push(day);
      day = day.add(1, "day");
    }
    return days;
  }, [currentDate]);

  const handlePrevMonth = () => setCurrentDate(prev => prev.subtract(1, "month"));
  const handleNextMonth = () => setCurrentDate(prev => prev.add(1, "month"));

  const resetForm = () => {
    setNotes("");
    setTitle("");
    setSelectedDate(null);
    setSelectedTime("10:00");
    setDuration(60);
    setEditingSession(null);
    setAdminReason("");
    setTargetUserId("");
  };

  const handleEditSession = (session: Session) => {
    setEditingSession(session);
    const date = dayjs(session.scheduledAt);
    setSelectedDate(date);
    setSelectedTime(date.format("HH:mm"));
    setSessionType(session.scheduleType);
    setTitle(session.session?.title || session.sessionTitle || "");
    setNotes(session.session?.notes || session.sessionNotes || "");
    setDuration(session.session?.durationMinutes || session.sessionDurationMinutes || 60);

    // Scroll to form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedDate) {
      toast({
        title: "Missing Date",
        description: "Please select a date for your session.",
        variant: "destructive",
      });
      return;
    }

    if (isDayBlocked(selectedDate)) {
      toast({
        title: "Date Already Taken",
        description: "This date was just booked by another user. Please select a different date.",
        variant: "destructive",
      });
      fetchSessions(); // Refresh list to be sure
      return;
    }

    if (!title.trim()) {
      toast({
        title: "Missing Title",
        description: "Please provide a title for your session.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      // Construct the date in the user's photoshoot timezone to avoid jumps
      const scheduledAt = dayjs.tz(
        `${selectedDate.format("YYYY-MM-DD")} ${selectedTime}:00`,
        userTimezone
      ).toISOString();

      const payload: any = {
        scheduleType: sessionType,
        scheduledAt,
        sessionTitle: title.trim(),
        sessionNotes: notes.trim(),
        sessionDurationMinutes: duration,
        status: "PENDING",

      };



      if (isAdmin) {
        if (targetUserId.trim()) payload.userId = targetUserId.trim();
        if (adminReason.trim()) payload.adminReason = adminReason.trim();
      }

      const requestBody = payload;

      let res;
      if (editingSession) {
        res = await apiPatch<any, any>(`/api/scheduler/sessions/${editingSession.id}`, requestBody);
      } else {
        res = await apiPost<any, any>("/api/scheduler/sessions", requestBody);
      }

      toast({
        title: "Success!",
        description: editingSession ? "Your session has been updated." : "Your session has been scheduled successfully.",
      });

      resetForm();
      // Wait for sessions to be refreshed before allowing another submission
      await fetchSessions();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isDayBlocked = (day: dayjs.Dayjs | null) => {
    if (!day) return false;
    const dateStr = day.format("YYYY-MM-DD");

    // If we are editing, the current session's day is not blocked for us
    if (editingSession) {
      const scheduledVal = editingSession.scheduledAt || editingSession.scheduledFor || (editingSession as any).date;
      const editingDate = dayjs.tz(scheduledVal, userTimezone).format("YYYY-MM-DD");
      if (editingDate === dateStr) return false;
    }

    return blockedDates.includes(dateStr);
  };

  const isDayInPast = (day: dayjs.Dayjs) => {
    return day.isBefore(dayjs(), "day");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2"
      >
        <div className="flex items-center gap-4">
          <h1 className="text-4xl font-black text-white tracking-tight">
            Session <span className="text-lime-400">Scheduling</span>
          </h1>
          {isAdmin && (
            <div className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Admin Mode</span>
            </div>
          )}
        </div>
        <p className="text-slate-400 text-lg">
          Book your professional photoshoot or video session. One slot per day for maximum quality.
        </p>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Calendar Selection */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl overflow-hidden shadow-2xl">
            <CardHeader className="border-b border-slate-800 bg-slate-800/20 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-lime-400/10 rounded-lg">
                    <CalendarIcon className="h-5 w-5 text-lime-400" />
                  </div>
                  <CardTitle className="text-xl font-bold text-white">Select Date</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePrevMonth}
                    className="border-slate-700 bg-slate-800/50 hover:bg-slate-700 text-white h-9 w-9 rounded-lg"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-white font-semibold min-w-[120px] text-center">
                    {currentDate.format("MMMM YYYY")}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNextMonth}
                    className="border-slate-700 bg-slate-800/50 hover:bg-slate-700 text-white h-9 w-9 rounded-lg"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-7 gap-2 mb-4">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                  <div key={day} className="text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, idx) => {
                  const isCurrentMonth = day.isSame(currentDate, "month");
                  const isToday = day.isSame(dayjs(), "day");
                  const isSelected = selectedDate?.isSame(day, "day");
                  const isBlocked = isDayBlocked(day);
                  const isPast = isDayInPast(day);
                  const canSelect = isCurrentMonth && !isBlocked && !isPast;

                  return (
                    <button
                      key={idx}
                      disabled={!canSelect}
                      type="button"
                      onClick={() => setSelectedDate(day)}
                      className={clsx(
                        "relative flex flex-col items-center justify-center aspect-square rounded-xl transition-all duration-300 group",
                        !isCurrentMonth && "opacity-20 cursor-default",
                        canSelect && "hover:bg-lime-400/10 hover:border-lime-400/30 border border-transparent",
                        isSelected && "bg-lime-400 text-slate-900 font-bold shadow-[0_0_25px_rgba(163,230,53,0.4)] border-lime-400 scale-105 z-10",
                        !isSelected && isCurrentMonth && !isBlocked && !isPast && "bg-slate-800/40 text-slate-300 hover:scale-105",
                        isToday && !isSelected && "border-lime-400/50 text-lime-400 font-bold",
                        isBlocked && "bg-rose-500/10 border-rose-500/20 text-rose-500/40 cursor-not-allowed",
                        isPast && isCurrentMonth && "bg-slate-900/20 text-slate-700 cursor-not-allowed"
                      )}
                    >
                      <span className="text-sm">{day.date()}</span>
                      {isBlocked && (
                        <div className="absolute top-1 right-1">
                          <AlertCircle className="h-3 w-3 opacity-50" />
                        </div>
                      )}
                      {isBlocked && isCurrentMonth && (
                        <span className="absolute bottom-1 text-[8px] font-bold uppercase opacity-60">Booked</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 flex flex-wrap gap-6 text-[10px] text-slate-500 border-t border-slate-800/50 pt-6 uppercase font-bold tracking-widest">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-slate-800" />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.6)]" />
                  <span>Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-rose-500/40 border border-rose-500/40" />
                  <span>Already Booked</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bookings List */}
          <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl overflow-hidden shadow-xl">
            <CardHeader className="border-b border-slate-800 bg-slate-800/20 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-400/10 rounded-lg">
                    <History className="h-5 w-5 text-indigo-400" />
                  </div>
                  <CardTitle className="text-xl font-bold text-white">Your Bookings</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingSessions ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="h-8 w-8 text-lime-400 animate-spin" />
                  <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Loading sessions...</p>
                </div>
              ) : sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <div className="p-4 bg-slate-800/50 rounded-full mb-4">
                    <CalendarDays className="h-8 w-8 text-slate-600" />
                  </div>
                  <p className="text-slate-400 font-medium">No sessions scheduled yet.</p>
                  <p className="text-slate-600 text-sm mt-1">Book your first professional photoshoot today!</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/50">
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      className={clsx(
                        "group flex items-center justify-between p-4 transition-all duration-300",
                        editingSession?.id === s.id ? "bg-lime-400/5 border-l-4 border-lime-400" : "hover:bg-slate-800/30 border-l-4 border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={clsx(
                          "p-3 rounded-xl",
                          s.scheduleType === "PHOTO_SESSION" ? "bg-amber-400/10 text-amber-400" : "bg-indigo-400/10 text-indigo-400"
                        )}>
                          {s.scheduleType === "PHOTO_SESSION" ? <Camera className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                        </div>
                        <div>
                          <h4 className="text-white font-bold">{s.session?.title || s.sessionTitle || "Untitled Session"}</h4>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" />
                              {dayjs(s.scheduledAt).format("MMM D, YYYY")}
                            </span>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {dayjs(s.scheduledAt).format("HH:mm")}
                            </span>
                            <span className={clsx(
                              "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                              s.status?.toUpperCase() === "SCHEDULED" || s.status?.toUpperCase() === "COMPLETED" ? "bg-emerald-500/10 text-emerald-500" : 
                              s.status?.toUpperCase() === "PENDING" ? "bg-amber-500/10 text-amber-500 animate-pulse" :

                              "bg-slate-700/30 text-slate-500"
                            )}>
                              {s.status}
                            </span>

                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isAdmin && (
                          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
                            {["pending", "completed", "canceled"].map((status) => (

                              <Button
                                key={status}
                                variant="ghost"
                                size="sm"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await apiPatch(`/api/scheduler/sessions/${s.id}/status`, {
                                      status: status.toLowerCase(),
                                      adminReason: "Status updated by admin"
                                    });
                                    toast({ title: "Status Updated", description: `Session marked as ${status.toLowerCase()}` });
                                    fetchSessions();
                                  } catch (err: any) {
                                    toast({ title: "Update Failed", description: err.message, variant: "destructive" });
                                  }
                                }}
                                className={clsx(
                                  "h-7 px-2 text-[8px] font-black tracking-widest uppercase rounded-md transition-all",
                                  s.status === status
                                    ? "bg-lime-400 text-slate-900"
                                    : "text-slate-500 hover:text-white hover:bg-slate-700"
                                )}
                              >
                                {status === "SCHEDULED" ? "Sch" : status === "COMPLETED" ? "Done" : "Can"}
                              </Button>
                            ))}
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSession(s)}
                          className="h-9 text-slate-400 hover:text-lime-400 hover:bg-lime-400/10 font-bold"
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Session Details */}
        <div className="lg:col-span-5 space-y-6">
          <Card className={clsx(
            "border-slate-800 bg-slate-900/40 backdrop-blur-xl h-full border-l-4 transition-all duration-500 shadow-2xl",
            editingSession ? "border-l-indigo-400" : "border-l-lime-400"
          )}>
            <CardHeader className="px-6 py-6 pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-white">
                    {editingSession ? "Edit Session" : "Session Details"}
                  </CardTitle>
                  <p className="text-slate-400 text-sm">
                    {editingSession ? "Update your session requirements." : "Fill in the requirements for your booking."}
                  </p>
                </div>
                {editingSession && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetForm}
                    className="text-slate-500 hover:text-white"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={onSubmit} className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em]">Session Type</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setSessionType("PHOTO_SESSION")}
                      className={clsx(
                        "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300",
                        sessionType === "PHOTO_SESSION"
                          ? "bg-lime-400/10 border-lime-400 text-white"
                          : "bg-slate-800/50 border-transparent text-slate-500 hover:border-slate-700 hover:text-slate-300"
                      )}
                    >
                      <Camera className={clsx("h-8 w-8", sessionType === "PHOTO_SESSION" ? "text-lime-400" : "text-slate-600")} />
                      <span className="font-bold">Photoshoot</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSessionType("VIDEO_SESSION")}
                      className={clsx(
                        "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300",
                        sessionType === "VIDEO_SESSION"
                          ? "bg-lime-400/10 border-lime-400 text-white"
                          : "bg-slate-800/50 border-transparent text-slate-500 hover:border-slate-700 hover:text-slate-300"
                      )}
                    >
                      <Video className={clsx("h-8 w-8", sessionType === "VIDEO_SESSION" ? "text-lime-400" : "text-slate-600")} />
                      <span className="font-bold">Video Session</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-lime-400" /> Session Title
                      </Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="e.g. Wedding Shoot"
                        className="bg-slate-800/50 border-slate-700 text-white h-12 rounded-xl focus:ring-lime-400/50 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time" className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                        <Clock className="h-3 w-3 text-lime-400" /> Start Time
                      </Label>
                      <Input
                        id="time"
                        type="time"
                        value={selectedTime}
                        onChange={e => setSelectedTime(e.target.value)}
                        className="bg-slate-800/50 border-slate-700 text-white h-12 rounded-xl focus:ring-lime-400/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                      <Loader2 className="h-3 w-3 text-lime-400" /> Duration (Minutes)
                    </Label>
                    <Input
                      id="duration"
                      type="number"
                      min="15"
                      step="15"
                      value={duration}
                      onChange={e => setDuration(Number(e.target.value))}
                      className="bg-slate-800/50 border-slate-700 text-white h-12 rounded-xl focus:ring-lime-400/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-lime-400" /> Notes / Requirements
                    </Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Share any specific requirements or location details..."
                      rows={4}
                      className="bg-slate-800/50 border-slate-700 text-white rounded-xl focus:ring-lime-400/50 resize-none transition-all"
                    />
                  </div>

                  {isAdmin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="pt-4 space-y-4 border-t border-slate-800 mt-4"
                    >
                      <div className="flex items-center gap-2 text-amber-500">
                        <ShieldCheck className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Admin Controls</span>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="userId" className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em]">
                          Client User ID (Optional)
                        </Label>
                        <Input
                          id="userId"
                          value={targetUserId}
                          onChange={e => setTargetUserId(e.target.value)}
                          placeholder="e.g. user_123"
                          className="bg-amber-500/5 border-amber-500/20 text-white h-12 rounded-xl focus:ring-amber-500/50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="adminReason" className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em]">
                          Admin Reason / Note
                        </Label>
                        <Input
                          id="adminReason"
                          value={adminReason}
                          onChange={e => setAdminReason(e.target.value)}
                          placeholder="e.g. Rescheduled by request"
                          className="bg-amber-500/5 border-amber-500/20 text-white h-12 rounded-xl focus:ring-amber-500/50"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={submitting || !selectedDate || isDayBlocked(selectedDate)}
                  className={clsx(
                    "w-full h-14 text-lg font-black tracking-widest uppercase transition-all duration-500 rounded-2xl",
                    selectedDate && !isDayBlocked(selectedDate)
                      ? (editingSession
                        ? "bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_10px_30px_rgba(99,102,241,0.3)]"
                        : "bg-lime-400 hover:bg-lime-300 text-slate-900 shadow-[0_10px_30px_rgba(163,230,53,0.3)]")
                      : "bg-slate-800 text-slate-500 cursor-not-allowed"
                  )}
                >
                  {submitting ? (
                    <span className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin" /> {editingSession ? "Updating..." : "Scheduling..."}
                    </span>
                  ) : isDayBlocked(selectedDate) ? (
                    "Already Booked"
                  ) : editingSession ? (
                    "Update Session"
                  ) : selectedDate ? (
                    `Request for ${selectedDate.format("MMM D")}`
                  ) : (
                    "Select a Date to Continue"
                  )}
                </Button>

                <p className="text-[10px] text-center text-slate-500 uppercase tracking-[0.2em] font-bold">
                  All sessions are reviewed by our team
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
