"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { apiGet } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  History, 
  User, 
  Mail, 
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

// --- Types ---

type CouponUsage = {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  usedAt: string;
};

type CouponUsagesResponse = {
  success: boolean;
  message: string;
  coupon: {
    code: string;
    usedCount: number;
    maxUses: number;
  };
  usages: CouponUsage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

// --- Page Component ---

export default function CouponUsagesPage() {
  const params = useParams();
  const router = useRouter();
  const couponId = params.id as string;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  // --- Queries ---

  const { data, isLoading } = useQuery({
    queryKey: ["admin-coupon-usages", couponId, page],
    queryFn: () => apiGet<CouponUsagesResponse>(`/api/admin/coupons/${couponId}/usages?page=${page}&limit=20`),
    enabled: !!couponId,
  });

  // --- Table Columns ---

  const columns: ColumnDef<CouponUsage>[] = [
    {
      accessorKey: "user",
      header: "User",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-white font-medium">
            <User className="h-3 w-3 text-slate-400" />
            {row.original.userName || "Anonymous"}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Mail className="h-3 w-3" />
            {row.original.userEmail}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "usedAt",
      header: "Used At",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Calendar className="h-4 w-4 text-slate-500" />
          {format(new Date(row.original.usedAt), "MMM d, yyyy HH:mm:ss")}
        </div>
      ),
    },
    {
      accessorKey: "id",
      header: "Usage ID",
      cell: ({ row }) => (
        <code className="text-[10px] text-slate-500 font-mono bg-slate-800/50 px-1.5 py-0.5 rounded border border-slate-700/50">
          {row.original.id}
        </code>
      ),
    },
  ];

  const table = useReactTable({
    data: data?.usages || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const filteredUsages = useMemo(() => {
    if (!data?.usages) return [];
    if (!search) return data.usages;
    const s = search.toLowerCase();
    return data.usages.filter(u => 
      u.userEmail.toLowerCase().includes(s) || 
      (u.userName && u.userName.toLowerCase().includes(s))
    );
  }, [data?.usages, search]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()}
          className="rounded-full h-10 w-10 text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <History className="h-6 w-6 text-lime-400" />
              Coupon Usages
            </h1>
            {data?.coupon && (
              <Badge variant="outline" className="bg-lime-400/10 text-lime-400 border-lime-400/20 px-3 py-1 font-mono text-base">
                {data.coupon.code}
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Viewing redemption history for this discount code.
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      {data?.coupon && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-1">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Redemptions</p>
            <p className="text-2xl font-bold text-white">{data.coupon.usedCount}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-1">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Remaining Uses</p>
            <p className="text-2xl font-bold text-white">{Math.max(0, data.coupon.maxUses - data.coupon.usedCount)}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-1">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Utilization</p>
            <div className="flex items-center gap-3">
              <p className="text-2xl font-bold text-white">{Math.round((data.coupon.usedCount / data.coupon.maxUses) * 100)}%</p>
              <div className="h-2 flex-1 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-lime-500 transition-all"
                  style={{ width: `${Math.min(100, (data.coupon.usedCount / data.coupon.maxUses) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Usages Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        {/* Table Filter */}
        <div className="p-4 border-b border-slate-800 bg-slate-800/20 flex items-center gap-2">
          <Search className="h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Filter by user email or name..."
            className="h-9 bg-transparent border-none text-slate-300 focus-visible:ring-0 placeholder:text-slate-600 max-w-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-lime-400" />
            <p className="text-slate-500 text-sm">Loading usage history...</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader className="bg-slate-800/50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent border-slate-800">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="text-slate-400 font-semibold py-4">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {filteredUsages.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-4">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-32 text-center text-slate-500">
                      No redemptions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {data?.pagination && data.pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-4 border-t border-slate-800 bg-slate-800/20">
                <div className="text-xs text-slate-500">
                  Showing page {data.pagination.page} of {data.pagination.pages} ({data.pagination.total} total)
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 border-slate-700 bg-slate-900 text-slate-300 hover:text-white"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 border-slate-700 bg-slate-900 text-slate-300 hover:text-white"
                    disabled={page === data.pagination.pages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
