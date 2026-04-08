<<<<<<< HEAD
"use client";

import { useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  MoreHorizontal,
  Calendar,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle,
  Clock,
  Eye,
  Mail,
  User,
  Info,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  ColumnDef,
  VisibilityState,
} from "@tanstack/react-table";

import { apiGet, apiPatch } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SupportDetailsModal } from "@/components/admin/support/SupportDetailsModal";
import { SupportStatusModal } from "@/components/admin/support/SupportStatusModal";

// --- Types ---

type SubmissionStatus = "PENDING" | "RESOLVED";

interface Submission {
  id: string;
  fullName: string;
  businessName: string;
  email: string;
  websiteHandle: string;
  interests: string[];
  postsPerMonth: string;
  message: string;
  source: string;
  status: SubmissionStatus;
  repliedBy: string | null;
  replyMessage: string | null;
  repliedAt: string | null;
  isResolved: boolean;
  resolvedAt: string | null;
  createdAt: string;
  createdIp: string;
}

interface SubmissionsResponse {
  success: boolean;
  data: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    submissions: Submission[];
  };
}

// --- Helper Components ---

function StatusBadge({ status }: { status: SubmissionStatus }) {
  const s = status.toUpperCase();
  if (s === "RESOLVED") {
    return (
      <Badge className="bg-lime-500/20 text-lime-400 border-lime-500/20">
        Resolved
      </Badge>
    );
  }
  if (s === "REPLIED") {
    return (
      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/20">
        Replied
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="text-white border-amber-400/50 bg-amber-400/10"
    >
      Pending
    </Badge>
  );
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// --- Main Page Component ---

export default function SupportSystemPage() {
  const queryClient = useQueryClient();

  // State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    id: false,
    source: false,
    createdAt: true,
  });

  // Queries
  const submissionsQuery = useQuery({
    queryKey: ["contact-submissions"],
    queryFn: () =>
      apiGet<SubmissionsResponse>("/api/contact/admin/submissions").then(
        (res) => res.data.submissions,
      ),
  });

  // Mutations
  const statusMutation = useMutation({
    mutationFn: (payload: { id: string; status: SubmissionStatus }) =>
      apiPatch<{ success: boolean }>(
        `/api/contact/admin/submissions/${payload.id}/status`,
        { status: payload.status },
      ),
    onSuccess: (_, variables) => {
      toast.success(`Status updated to ${variables.status}`, {
        position: "top-right",
      });
      queryClient.invalidateQueries({ queryKey: ["contact-submissions"] });
    },
    onError: (err: Error) => {
      toast.error("Failed to update status", {
        description: err.message,
        position: "top-right",
      });
    },
  });

  // Filtering Logic
  const filteredData = useMemo(() => {
    let data = submissionsQuery.data ?? [];
    if (statusFilter !== "ALL") {
      data = data.filter((s) => s.status.toUpperCase() === statusFilter);
    }
    if (search) {
      const low = search.toLowerCase();
      data = data.filter(
        (s) =>
          s.fullName.toLowerCase().includes(low) ||
          s.email.toLowerCase().includes(low) ||
          s.message.toLowerCase().includes(low) ||
          s.businessName.toLowerCase().includes(low),
      );
    }
    return data;
  }, [submissionsQuery.data, statusFilter, search]);

  // Table Columns
  const columns: ColumnDef<Submission>[] = [
    {
      accessorKey: "fullName",
      header: "User",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-200">
            {row.original.fullName}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {row.original.email}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "businessName",
      header: "Business",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-slate-300 font-medium">
            {row.original.businessName}
          </span>
          <span className="text-[10px] text-slate-500">
            {row.original.websiteHandle}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "interests",
      header: "Interests",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {row.original.interests.slice(0, 2).map((i) => (
            <Badge
              key={i}
              variant="outline"
              className="text-[10px] h-5 bg-slate-800/30 text-white/40 font-light border-slate-700/50"
            >
              {i}
            </Badge>
          ))}
          {row.original.interests.length > 2 && (
            <Badge variant="outline" className="text-[10px] h-5">
              +{row.original.interests.length - 2}
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "createdAt",
      header: "Submitted",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-slate-400">
          <Calendar className="h-3 w-3" />
          <span className="text-xs">{formatDate(row.original.createdAt)}</span>
        </div>
      ),
    },
    // {
    //   id: "toggleStatus",
    //   header: "Toggle Status",
    //   cell: ({ row }) => {
    //     const sub = row.original;
    //     const isResolved = sub.status === "RESOLVED";
    //     return (
    //       <div className="flex items-center gap-2">
    //         <Button
    //           variant="outline"
    //           size="sm"
    //           className={`h-7 px-3 text-[10px] font-bold rounded-full border-slate-800 transition-all ${
    //             isResolved
    //               ? "bg-lime-500/10 text-lime-400 border-lime-500/20 hover:bg-slate-800"
    //               : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
    //           }`}
    //           onClick={() =>
    //             statusMutation.mutate({
    //               id: sub.id,
    //               status: isResolved ? "PENDING" : "RESOLVED",
    //             })
    //           }
    //           disabled={statusMutation.isPending}
    //         >
    //           {isResolved ? "RESOLVED" : "MARK AS DONE"}
    //         </Button>
    //       </div>
    //     );
    //   },
    // },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const sub = row.original;
        return (
          <div className="flex justify-start pr-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-slate-900 border-slate-800 text-slate-200 shadow-2xl rounded-xl p-1"
              >
                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2 py-1.5">
                  Action Menu
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-800" />
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedSubmission(sub);
                    setIsDetailsOpen(true);
                  }}
                  className="rounded-lg focus:bg-slate-800 focus:text-lime-400"
                >
                  <Eye className="mr-2 h-4 w-4" /> View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedSubmission(sub);
                    setIsStatusOpen(true);
                  }}
                  className="rounded-lg focus:bg-slate-800 focus:text-lime-400"
                >
                  <Clock className="mr-2 h-4 w-4" /> View Status
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnVisibility,
    },
  });

  return (
    <div className="p-6 space-y-6 max-h-screen overflow-auto scrollbar-hide">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-lime-400/10 flex items-center justify-center border border-lime-400/20 shadow-lg shadow-lime-400/5">
            <MessageSquare className="h-6 w-6 text-lime-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Support System
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Analyze and respond to contact form submissions effectively.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="border-slate-800 bg-slate-900/50 text-slate-300 hover:bg-slate-800"
            onClick={() =>
              queryClient.invalidateQueries({
                queryKey: ["contact-submissions"],
              })
            }
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${submissionsQuery.isFetching ? "animate-spin" : ""}`}
            />
            Refresh List
          </Button>
        </div>
      </div>

      {/* Stats Cards - Optional Flair */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900/40 border-white/5 p-4 flex items-center gap-4 group hover:bg-slate-800/40 transition-colors">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
              Pending
            </p>
            <p className="text-xl font-bold text-white">
              {submissionsQuery.data?.filter((s) => s.status === "PENDING")
                .length ?? 0}
            </p>
          </div>
        </Card>
        <Card className="bg-slate-900/40 border-white/5 p-4 flex items-center gap-4 group hover:bg-slate-800/40 transition-colors">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
              Replied
            </p>
            <p className="text-xl font-bold text-white">
              {submissionsQuery.data?.filter((s) => s.status === "REPLIED")
                .length ?? 0}
            </p>
          </div>
        </Card>
        <Card className="bg-slate-900/40 border-white/5 p-4 flex items-center gap-4 group hover:bg-slate-800/40 transition-colors">
          <div className="h-10 w-10 rounded-xl bg-lime-500/10 flex items-center justify-center text-lime-500">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
              Resolved
            </p>
            <p className="text-xl font-bold text-white">
              {submissionsQuery.data?.filter((s) => s.status === "RESOLVED")
                .length ?? 0}
            </p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-end bg-slate-900/50 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
        <div className="flex-1 space-y-2">
          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest pl-1">
            Search Submissions
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Filter by name, email, or message content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-slate-950/50 border-slate-800 focus-visible:ring-lime-500/50 h-11"
            />
          </div>
        </div>
        <div className="w-full lg:w-48 space-y-2">
          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest pl-1">
            Status
          </label>
          <Select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950/50 border-slate-800 h-11"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            {/* <option value="REPLIED">Replied</option> */}
            <option value="RESOLVED">Resolved</option>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card className="border-white/5 bg-slate-900/40 backdrop-blur-md overflow-hidden transition-all shadow-2xl">
        <Table>
          <TableHeader className="bg-slate-950/40">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-white/5 hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-slate-500 py-4 font-semibold uppercase tracking-wider text-[10px]"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {submissionsQuery.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-white/5 animate-pulse">
                  <TableCell
                    colSpan={columns.length}
                    className="h-16 bg-slate-800/10"
                  />
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-white/5 hover:bg-white/5 transition-colors group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-48 text-center text-slate-500"
                >
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-slate-800/40 flex items-center justify-center">
                      <MessageSquare className="h-8 w-8 opacity-20" />
                    </div>
                    <p className="text-sm font-medium">
                      No submissions found matching your filters.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-white/5 bg-slate-950/20">
          <div className="text-xs text-slate-500 font-medium">
            Showing {filteredData.length} records
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="bg-slate-900 border-slate-800 h-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-slate-400 px-2 font-mono">
              Page {table.getState().pagination.pageIndex + 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="bg-slate-900 border-slate-800 h-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <SupportDetailsModal
        submissionId={selectedSubmission?.id || null}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />

      <SupportStatusModal
        submission={selectedSubmission}
        open={isStatusOpen}
        onOpenChange={setIsStatusOpen}
      />
    </div>
  );
}
=======
"use client";

import { useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  MoreHorizontal,
  Calendar,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle,
  Clock,
  Eye,
  Mail,
  User,
  Info,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  ColumnDef,
  VisibilityState,
} from "@tanstack/react-table";

import { apiGet, apiPatch } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SupportDetailsModal } from "@/components/admin/support/SupportDetailsModal";
import { SupportStatusModal } from "@/components/admin/support/SupportStatusModal";

// --- Types ---

type SubmissionStatus = "PENDING" | "RESOLVED";

interface Submission {
  id: string;
  fullName: string;
  businessName: string;
  email: string;
  websiteHandle: string;
  interests: string[];
  postsPerMonth: string;
  message: string;
  source: string;
  status: SubmissionStatus;
  repliedBy: string | null;
  replyMessage: string | null;
  repliedAt: string | null;
  isResolved: boolean;
  resolvedAt: string | null;
  createdAt: string;
  createdIp: string;
}

interface SubmissionsResponse {
  success: boolean;
  data: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    submissions: Submission[];
  };
}

// --- Helper Components ---

function StatusBadge({ status }: { status: SubmissionStatus }) {
  const s = status.toUpperCase();
  if (s === "RESOLVED") {
    return (
      <Badge className="bg-lime-500/20 text-lime-400 border-lime-500/20">
        Resolved
      </Badge>
    );
  }
  if (s === "REPLIED") {
    return (
      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/20">
        Replied
      </Badge>
    );
  }
  return (
    <Badge
      className="bg-orange-500 text-white border-none font-bold px-3 shadow-[0_0_10px_rgba(249,115,22,0.3)]"
    >
      Pending
    </Badge>
  );
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// --- Main Page Component ---

export default function SupportSystemPage() {
  const queryClient = useQueryClient();

  // State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    id: false,
    source: false,
    createdAt: true,
  });

  // Queries
  const submissionsQuery = useQuery({
    queryKey: ["contact-submissions"],
    queryFn: () =>
      apiGet<SubmissionsResponse>("/api/contact/admin/submissions").then(
        (res) => res.data.submissions,
      ),
  });

  // Mutations
  const statusMutation = useMutation({
    mutationFn: (payload: { id: string; status: SubmissionStatus }) =>
      apiPatch<{ success: boolean }>(
        `/api/contact/admin/submissions/${payload.id}/status`,
        { status: payload.status },
      ),
    onSuccess: (_, variables) => {
      toast.success(`Status updated to ${variables.status}`, {
        position: "top-right",
      });
      queryClient.invalidateQueries({ queryKey: ["contact-submissions"] });
    },
    onError: (err: Error) => {
      toast.error("Failed to update status", {
        description: err.message,
        position: "top-right",
      });
    },
  });

  // Filtering Logic
  const filteredData = useMemo(() => {
    let data = submissionsQuery.data ?? [];
    if (statusFilter !== "ALL") {
      data = data.filter((s) => s.status.toUpperCase() === statusFilter);
    }
    if (search) {
      const low = search.toLowerCase();
      data = data.filter(
        (s) =>
          s.fullName.toLowerCase().includes(low) ||
          s.email.toLowerCase().includes(low) ||
          s.message.toLowerCase().includes(low) ||
          s.businessName.toLowerCase().includes(low),
      );
    }
    return data;
  }, [submissionsQuery.data, statusFilter, search]);

  // Table Columns
  const columns: ColumnDef<Submission>[] = [
    {
      accessorKey: "fullName",
      header: "User",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-200">
            {row.original.fullName}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {row.original.email}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "businessName",
      header: "Business",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-slate-300 font-medium">
            {row.original.businessName}
          </span>
          <span className="text-[10px] text-slate-500">
            {row.original.websiteHandle}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "interests",
      header: "Interests",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {row.original.interests.slice(0, 2).map((i) => (
            <Badge
              key={i}
              variant="outline"
              className="text-[10px] h-5 bg-slate-800/30 text-white/40 font-light border-slate-700/50"
            >
              {i}
            </Badge>
          ))}
          {row.original.interests.length > 2 && (
            <Badge variant="outline" className="text-[10px] h-5">
              +{row.original.interests.length - 2}
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "createdAt",
      header: "Submitted",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-slate-400">
          <Calendar className="h-3 w-3" />
          <span className="text-xs">{formatDate(row.original.createdAt)}</span>
        </div>
      ),
    },
    // {
    //   id: "toggleStatus",
    //   header: "Toggle Status",
    //   cell: ({ row }) => {
    //     const sub = row.original;
    //     const isResolved = sub.status === "RESOLVED";
    //     return (
    //       <div className="flex items-center gap-2">
    //         <Button
    //           variant="outline"
    //           size="sm"
    //           className={`h-7 px-3 text-[10px] font-bold rounded-full border-slate-800 transition-all ${
    //             isResolved
    //               ? "bg-lime-500/10 text-lime-400 border-lime-500/20 hover:bg-slate-800"
    //               : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
    //           }`}
    //           onClick={() =>
    //             statusMutation.mutate({
    //               id: sub.id,
    //               status: isResolved ? "PENDING" : "RESOLVED",
    //             })
    //           }
    //           disabled={statusMutation.isPending}
    //         >
    //           {isResolved ? "RESOLVED" : "MARK AS DONE"}
    //         </Button>
    //       </div>
    //     );
    //   },
    // },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const sub = row.original;
        return (
          <div className="flex justify-start pr-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-slate-900 border-slate-800 text-slate-200 shadow-2xl rounded-xl p-1"
              >
                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2 py-1.5">
                  Action Menu
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-800" />
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedSubmission(sub);
                    setIsDetailsOpen(true);
                  }}
                  className="rounded-lg focus:bg-slate-800 focus:text-lime-400"
                >
                  <Eye className="mr-2 h-4 w-4" /> View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedSubmission(sub);
                    setIsStatusOpen(true);
                  }}
                  className="rounded-lg focus:bg-slate-800 focus:text-lime-400"
                >
                  <Clock className="mr-2 h-4 w-4" /> View Status
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnVisibility,
    },
  });

  return (
    <div className="p-6 space-y-6 max-h-screen overflow-auto scrollbar-hide">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-lime-400/10 flex items-center justify-center border border-lime-400/20 shadow-lg shadow-lime-400/5">
            <MessageSquare className="h-6 w-6 text-lime-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Support System
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Analyze and respond to contact form submissions effectively.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="border-slate-800 bg-slate-900/50 text-slate-300 hover:bg-slate-800"
            onClick={() =>
              queryClient.invalidateQueries({
                queryKey: ["contact-submissions"],
              })
            }
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${submissionsQuery.isFetching ? "animate-spin" : ""}`}
            />
            Refresh List
          </Button>
        </div>
      </div>

      {/* Stats Cards - Optional Flair */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900/40 border-white/5 p-4 flex items-center gap-4 group hover:bg-slate-800/40 transition-colors">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
              Pending
            </p>
            <p className="text-xl font-bold text-white">
              {submissionsQuery.data?.filter((s) => s.status === "PENDING")
                .length ?? 0}
            </p>
          </div>
        </Card>
        <Card className="bg-slate-900/40 border-white/5 p-4 flex items-center gap-4 group hover:bg-slate-800/40 transition-colors">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
              Replied
            </p>
            <p className="text-xl font-bold text-white">
              {submissionsQuery.data?.filter((s) => s.status === "REPLIED")
                .length ?? 0}
            </p>
          </div>
        </Card>
        <Card className="bg-slate-900/40 border-white/5 p-4 flex items-center gap-4 group hover:bg-slate-800/40 transition-colors">
          <div className="h-10 w-10 rounded-xl bg-lime-500/10 flex items-center justify-center text-lime-500">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
              Resolved
            </p>
            <p className="text-xl font-bold text-white">
              {submissionsQuery.data?.filter((s) => s.status === "RESOLVED")
                .length ?? 0}
            </p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-end bg-slate-900/50 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
        <div className="flex-1 space-y-2">
          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest pl-1">
            Search Submissions
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Filter by name, email, or message content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-slate-950/50 border-slate-800 focus-visible:ring-lime-500/50 h-11"
            />
          </div>
        </div>
        <div className="w-full lg:w-48 space-y-2">
          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest pl-1">
            Status
          </label>
          <Select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950/50 border-slate-800 h-11"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            {/* <option value="REPLIED">Replied</option> */}
            <option value="RESOLVED">Resolved</option>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card className="border-white/5 bg-slate-900/40 backdrop-blur-md overflow-hidden transition-all shadow-2xl">
        <Table>
          <TableHeader className="bg-slate-950/40">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-white/5 hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-slate-500 py-4 font-semibold uppercase tracking-wider text-[10px]"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {submissionsQuery.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-white/5 animate-pulse">
                  <TableCell
                    colSpan={columns.length}
                    className="h-16 bg-slate-800/10"
                  />
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-white/5 hover:bg-white/5 transition-colors group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-48 text-center text-slate-500"
                >
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-slate-800/40 flex items-center justify-center">
                      <MessageSquare className="h-8 w-8 opacity-20" />
                    </div>
                    <p className="text-sm font-medium">
                      No submissions found matching your filters.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-white/5 bg-slate-950/20">
          <div className="text-xs text-slate-500 font-medium">
            Showing {filteredData.length} records
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="bg-slate-900 border-slate-800 h-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-slate-400 px-2 font-mono">
              Page {table.getState().pagination.pageIndex + 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="bg-slate-900 border-slate-800 h-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <SupportDetailsModal
        submissionId={selectedSubmission?.id || null}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />

      <SupportStatusModal
        submission={selectedSubmission}
        open={isStatusOpen}
        onOpenChange={setIsStatusOpen}
      />
    </div>
  );
}
>>>>>>> d562463 (remove the search filed and set the path)
