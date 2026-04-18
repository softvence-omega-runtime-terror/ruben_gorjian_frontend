"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Calendar,
  Camera,
  Video,
  Trash2,
  CheckCircle2,
  User,
  MoreHorizontal,
  RefreshCcw,
  Clock,
  ChevronLeft,
  ChevronRight,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import dayjs from "dayjs";

import { useToast } from "@/hooks/use-toast";
import { useTimezone } from "@/hooks/use-timezone";
import { useSocket } from "@/app/providers/SocketProvider";
import { apiGet, apiPatch } from "@/lib/api";

type Session = {
  id: string;
  scheduleType: "PHOTO_SESSION" | "VIDEO_SESSION";
  scheduledAt: string;
  status: string;
  session?: {
    title: string;
    notes: string;
    durationMinutes: number;
  };
  sessionTitle?: string;
  sessionNotes?: string;
  owner?: {
    id: string;
    name: string | null;
    fullName: string | null;
    email: string;
  };
  user?: {
    id: string;
    name: string | null;
    fullName: string | null;
    email: string;
  };
};

export default function SessionSchedulePage() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { socket } = useSocket();
  const { timezoneAbbr } = useTimezone();

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      // Fetching from /posts because it's confirmed to return all records for admins
      const data = await apiGet<any>("/api/scheduler/posts");
      const items = Array.isArray(data)
        ? data
        : data.items || data.sessions || [];

      // Filter for sessions ONLY and sync timezones
      const sessionItems = items
        .filter(
          (p: any) =>
            p.scheduleType === "PHOTO_SESSION" ||
            p.scheduleType === "VIDEO_SESSION",
        )
        .map((p: any) => {
          // We'll keep it simple here, but ensuring we have a stable date property
          return {
            ...p,
            scheduledAt: p.scheduledFor || p.scheduledAt || p.date,
          };
        });

      setSessions(sessionItems);
    } catch (err: any) {
      console.error("Error fetching sessions:", err);

      toast({
        title: "Error",
        description: "Failed to load sessions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (!socket) return;
    const handleRefresh = () => fetchSessions();
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

  const updateStatus = async (id: string, status: string) => {
    try {
      const apiStatus =
        status === "COMPLETED"
          ? "completed"
          : status === "CANCELLED" || status === "FAILED"
            ? "canceled"
            : "failed"; // Fallback to failed if not matched

      await apiPatch(`/api/scheduler/sessions/${id}/status`, {
        status: apiStatus,
        adminReason: `Status updated to ${status} by Administrator`,
      });
      toast({
        title: "Success",
        description: `Session marked as ${status}`,
      });
      fetchSessions();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toUpperCase();
    switch (s) {
      case "COMPLETED":
      case "POSTED":
      case "COMPLETE":
        return (
          <Badge className="bg-emerald-500/20 text-green-500 border-green-500/30">
            Completed
          </Badge>
        );
      case "CANCELLED":
      case "CANCELED":
      case "REJECTED":
      case "CANCEL":
      case "FAILED":
        return (
          <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30">
            Canceled
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 animate-pulse">
            Pending
          </Badge>
        );
      case "SCHEDULED":
        return (
          <Badge className="bg-blue-500/20 text-yellow-500 border-yellow-500/30">
            Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-slate-500 border-slate-800">
            {status}
          </Badge>
        );
    }
  };

  const getSessionTypeBadge = (type: string) => {
    if (type === "PHOTO_SESSION") {
      return (
        <Badge className="bg-lime-400/10 text-lime-400 border-lime-400/20 gap-1">
          <Camera className="h-3 w-3" /> Photo
        </Badge>
      );
    }
    return (
      <Badge className="bg-indigo-400/10 text-indigo-400 border-indigo-400/20 gap-1">
        <Video className="h-3 w-3" /> Video
      </Badge>
    );
  };

  const totalPages = Math.ceil(sessions.length / itemsPerPage);
  const currentItems = sessions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            Session Schedule Management
          </h1>
          <p className="text-sm text-slate-400">
            Manage all professional photoshoot and video sessions.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSessions}
          disabled={loading}
          className="border-slate-700 hover:bg-slate-800 text-slate-300"
        >
          <RefreshCcw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <CardHeader className="pb-3 border-b border-slate-800">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-lime-400" />
            All Scheduled Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-950/50">
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date / Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-lime-400 border-t-transparent" />
                      Loading sessions...
                    </div>
                  </TableCell>
                </TableRow>
              ) : sessions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-48 text-center text-slate-500"
                  >
                    No sessions found.
                  </TableCell>
                </TableRow>
              ) : (
                currentItems.map((s) => (
                  <TableRow
                    key={s.id}
                    className="border-slate-800 hover:bg-slate-800/30 transition-colors group"
                  >
                    <TableCell>{getSessionTypeBadge(s.scheduleType)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-200">
                          {s.session?.title ||
                            s.sessionTitle ||
                            "Untitled Session"}
                        </span>
                        {(s.session?.notes || s.sessionNotes) && (
                          <span className="text-[10px] text-slate-500 line-clamp-1 italic">
                            Notes: {s.session?.notes || s.sessionNotes}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-200">
                          {s.owner?.fullName ||
                            s.owner?.name ||
                            s.user?.fullName ||
                            s.user?.name ||
                            "Unknown"}
                        </span>
                        <span className="text-xs text-slate-500">
                          {s.owner?.email || s.user?.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(s.status)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-slate-200">
                          {dayjs(s.scheduledAt).format("MMM D, YYYY")}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {dayjs(s.scheduledAt).format("h:mm A")}
                          <span className="text-slate-500 ml-1">
                            {timezoneAbbr}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-slate-900 border-slate-800 text-slate-300"
                        >
                          {s.status.toUpperCase() !== "COMPLETED" && (
                            <DropdownMenuItem
                              className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer text-emerald-400"
                              onClick={() => updateStatus(s.id, "COMPLETED")}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Complete Session
                            </DropdownMenuItem>
                          )}
                          {s.status.toUpperCase() !== "CANCELLED" &&
                            s.status.toUpperCase() !== "REJECTED" && (
                              <DropdownMenuItem
                                className="hover:bg-rose-500/10 focus:bg-rose-500/10 cursor-pointer text-rose-400"
                                onClick={() => updateStatus(s.id, "CANCELLED")}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel Session
                              </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {sessions.length > itemsPerPage && (
          <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-950/20">
            <div className="text-xs text-slate-500 font-medium">
              Showing {sessions.length} sessions
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="bg-slate-900 border-slate-800 h-8 px-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-slate-400 px-2">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage >= totalPages}
                className="bg-slate-900 border-slate-800 h-8 px-2"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
