<<<<<<< HEAD
"use client";

import { useMemo, useState } from "react";
import { 
  CreditCard, 
  Search, 
  RefreshCw, 
  MoreHorizontal, 
  Calendar, 
  AlertCircle, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  flexRender, 
  getCoreRowModel, 
  useReactTable, 
  getPaginationRowModel,
  ColumnDef,
  VisibilityState
} from "@tanstack/react-table";

import { apiGet, apiPost } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";

// --- Types ---

type AdminSubscription = {
  id: string;
  userId: string;
  userEmail: string;
  userIsFounder: boolean;
  planCode: string;
  planName: string;
  planCategory: string;
  planIsJewelry: boolean;
  platformLimit: number;
  baseVisualQuota: number | null;
  basePostQuota: number;
  status: string;
  priceType: string;
  stripeSubscriptionId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  createdAt: string;
};

type AdminInvoice = {
  id: string;
  number: string | null;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  hostedInvoiceUrl: string | null;
};

type ConfirmAction = 
  | { type: "cancel-schedule"; subscription: AdminSubscription }
  | { type: "cancel-immediate"; subscription: AdminSubscription }
  | { type: "resume"; subscription: AdminSubscription }
  | { type: "refresh"; subscription: AdminSubscription }
  | null;

// --- Helper Components ---

function StatusBadge({ status, cancelAtPeriodEnd }: { status: string; cancelAtPeriodEnd: boolean }) {
  const s = status.toUpperCase();
  if (s === "ACTIVE") {
    if (cancelAtPeriodEnd) {
      return (
        <Badge variant="outline" className="text-amber-400 border-amber-400/50 bg-amber-400/10">
          Scheduled to Cancel
        </Badge>
      );
    }
    return <Badge className="bg-lime-500/20 text-lime-400 border-lime-500/20">Active</Badge>;
  }
  if (s === "CANCELED" || s === "CANCELLED") {
    return <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/20">Canceled</Badge>;
  }
  if (s === "INCOMPLETE") {
    return <Badge variant="secondary" className="bg-slate-500/20 text-slate-400">Incomplete</Badge>;
  }
  return <Badge variant="outline">{status}</Badge>;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

// --- Main Component ---

export default function AdminSubscriptionsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [invoiceUserId, setInvoiceUserId] = useState<string | null>(null);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    platformLimit: false,
    createdAt: false,
  });

  // Queries
  const subscriptionsQuery = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: () => apiGet<AdminSubscription[]>("/api/admin/subscriptions"),
  });

  const invoicesQuery = useQuery({
    queryKey: ["admin-user-invoices", invoiceUserId],
    queryFn: () => invoiceUserId ? apiGet<{ items: AdminInvoice[] }>(`/api/admin/users/${invoiceUserId}/invoices`) : null,
    enabled: !!invoiceUserId,
  });

  // Mutations
  const refreshMutation = useMutation({
    mutationFn: (userId: string) => apiPost(`/api/admin/users/${userId}/refresh-subscription`, {}),
    onSuccess: () => {
      toast({ title: "Subscription refreshed" });
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
    }
  });

  const cancelScheduleMutation = useMutation({
    mutationFn: (userId: string) => apiPost(`/api/admin/users/${userId}/cancel-subscription-schedule`, {}),
    onSuccess: () => {
      toast({ title: "Cancellation scheduled for period end" });
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
    }
  });

  const cancelImmediateMutation = useMutation({
    mutationFn: (userId: string) => apiPost(`/api/admin/users/${userId}/cancel-subscription-immediately`, {}),
    onSuccess: () => {
      toast({ title: "Subscription canceled immediately", variant: "destructive" });
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
    }
  });

  const resumeMutation = useMutation({
    mutationFn: (userId: string) => apiPost(`/api/admin/users/${userId}/resume-subscription`, {}),
    onSuccess: () => {
      toast({ title: "Subscription successfully resumed" });
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
    }
  });

  // Filtering Logic
  const filteredData = useMemo(() => {
    let data = subscriptionsQuery.data ?? [];
    if (statusFilter !== "ALL") {
      data = data.filter(s => s.status.toUpperCase() === statusFilter);
    }
    if (search) {
      const low = search.toLowerCase();
      data = data.filter(s => s.userEmail.toLowerCase().includes(low) || s.userId.toLowerCase().includes(low));
    }
    return data;
  }, [subscriptionsQuery.data, statusFilter, search]);

  // Table Columns
  const columns: ColumnDef<AdminSubscription>[] = [
    {
      accessorKey: "userEmail",
      header: "User",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-200">{row.original.userEmail}</span>
          <span className="text-[10px] text-slate-500 font-mono">{row.original.userId}</span>
        </div>
      ),
    },
    {
      accessorKey: "planName",
      header: "Plan",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-slate-300">{row.original.planName}</span>
          <span className="text-[10px] text-slate-500">{row.original.planCategory}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} cancelAtPeriodEnd={row.original.cancelAtPeriodEnd} />,
    },
    {
      accessorKey: "priceType",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant={row.original.priceType === "FOUNDER" ? "secondary" : "outline"} className="text-[10px] h-5">
          {row.original.priceType}
        </Badge>
      ),
    },
    {
      accessorKey: "platformLimit",
      header: "Limit",
    },
    {
      accessorKey: "currentPeriodEnd",
      header: "Next Billing",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-slate-400">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(row.original.currentPeriodEnd)}</span>
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const sub = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-800">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-slate-800">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => setConfirmAction({ type: "refresh", subscription: sub })}
                className="hover:bg-slate-800 cursor-pointer"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Sync from Stripe
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setInvoiceUserId(sub.userId)}
                className="hover:bg-slate-800 cursor-pointer"
              >
                <CreditCard className="mr-2 h-4 w-4" /> View Invoices
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-slate-800" />
              
              {sub.status === "ACTIVE" && !sub.cancelAtPeriodEnd && (
                <DropdownMenuItem 
                  onClick={() => setConfirmAction({ type: "cancel-schedule", subscription: sub })}
                  className="hover:bg-slate-800 cursor-pointer text-amber-400"
                >
                  Schedule Cancel
                </DropdownMenuItem>
              )}
              
              {sub.cancelAtPeriodEnd && (
                <DropdownMenuItem 
                  onClick={() => setConfirmAction({ type: "resume", subscription: sub })}
                  className="hover:bg-lime-500/10 cursor-pointer text-lime-400 font-medium"
                >
                  Resume Sub
                </DropdownMenuItem>
              )}

              {sub.status !== "CANCELED" && (
                <DropdownMenuItem 
                  onClick={() => setConfirmAction({ type: "cancel-immediate", subscription: sub })}
                  className="hover:bg-red-500/10 cursor-pointer text-red-400"
                >
                  Cancel Immediately
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    const { type, subscription } = confirmAction;
    
    if (type === "refresh") refreshMutation.mutate(subscription.userId);
    if (type === "cancel-schedule") cancelScheduleMutation.mutate(subscription.userId);
    if (type === "cancel-immediate") cancelImmediateMutation.mutate(subscription.userId);
    if (type === "resume") resumeMutation.mutate(subscription.userId);
    
    setConfirmAction(null);
  };

  return (
    <div className="p-6 space-y-6 max-h-screen overflow-auto scrollbar-hide">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Subscriptions</h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time management for Stripe billing and user plans.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] })}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${subscriptionsQuery.isFetching ? "animate-spin" : ""}`} />
            Refresh List
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-end bg-slate-900/50 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
        <div className="flex-1 space-y-2">
          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest pl-1">Search User</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input 
              placeholder="Filter by email or user ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-slate-950/50 border-slate-800 focus-visible:ring-lime-500/50 h-11"
            />
          </div>
        </div>
        <div className="w-full lg:w-48 space-y-2">
          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest pl-1">Status</label>
          <Select 
            id="status-filter"
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950/50 border-slate-800 h-11"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="CANCELED">Canceled</option>
            <option value="INCOMPLETE">Incomplete</option>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card className="border-white/5 bg-slate-900/40 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-950/40">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-white/5 hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-slate-500 py-4 font-semibold">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {subscriptionsQuery.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-white/5 animate-pulse">
                  <TableCell colSpan={columns.length} className="h-16 bg-slate-800/10" />
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <CreditCard className="h-10 w-10 opacity-20" />
                    <p>No subscriptions found matching your criteria.</p>
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
            <span className="text-xs text-slate-400 px-2">
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

      {/* --- Dialogs & Modals --- */}

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
              confirmAction?.type === 'cancel-immediate' ? 'bg-red-500/20' : 'bg-amber-500/20'
            }`}>
              <AlertCircle className={`h-6 w-6 ${
                confirmAction?.type === 'cancel-immediate' ? 'text-red-400' : 'text-amber-400'
              }`} />
            </div>
            <DialogTitle className="text-center text-xl">
              {confirmAction?.type === 'cancel-immediate' ? 'Cancel Immediately?' : 
               confirmAction?.type === 'cancel-schedule' ? 'Schedule Cancellation?' :
               confirmAction?.type === 'resume' ? 'Resume Subscription?' : 'Sync Subscription?'}
            </DialogTitle>
            <DialogDescription className="text-center text-slate-400 mt-2">
              {confirmAction?.type === 'cancel-immediate' ? 
                'This will terminate the subscription with Stripe right now. The user will lose access immediately.' :
               confirmAction?.type === 'cancel-schedule' ? 
                'The user will keep access until the end of the current billing cycle.' :
               confirmAction?.type === 'resume' ?
                'This will undo the scheduled cancellation and allow the subscription to renew normally.' :
                'This will fetch the latest status and period dates directly from Stripe.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-3 sm:justify-center">
            <Button variant="outline" onClick={() => setConfirmAction(null)} className="border-slate-800">
              Go Back
            </Button>
            <Button 
              variant={confirmAction?.type === 'cancel-immediate' ? 'destructive' : 'default'}
              onClick={handleConfirmAction}
              className={confirmAction?.type === 'resume' ? 'bg-lime-500 hover:bg-lime-600' : ''}
              disabled={
                refreshMutation.isPending || 
                cancelScheduleMutation.isPending || 
                cancelImmediateMutation.isPending || 
                resumeMutation.isPending
              }
            >
              Confirm Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoices Sheet/Modal */}
      <Dialog open={!!invoiceUserId} onOpenChange={(open) => !open && setInvoiceUserId(null)}>
        <DialogContent className="bg-slate-950 border-slate-800 sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-lime-400" />
              Invoices History
            </DialogTitle>
            <DialogDescription>
              Billing history and hosted invoice links from Stripe.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto mt-4 px-1">
            <Table>
              <TableHeader className="sticky top-0 bg-slate-950">
                <TableRow className="border-white/5">
                  <TableHead>Number</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoicesQuery.isLoading ? (
                   Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse border-white/5">
                      <TableCell colSpan={5} className="h-12 bg-slate-900/50" />
                    </TableRow>
                  ))
                ) : invoicesQuery.data?.items?.length ? (
                  invoicesQuery.data.items.map((inv) => (
                    <TableRow key={inv.id} className="border-white/5 hover:bg-white/5 text-slate-300">
                      <TableCell className="font-mono text-[10px]">{inv.number ?? inv.id.slice(0, 8)}</TableCell>
                      <TableCell className="font-bold text-white">{formatAmount(inv.amount, inv.currency)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`h-4 text-[9px] ${
                          inv.status === 'paid' ? 'border-lime-500/50 text-lime-400' : ''
                        }`}>
                          {inv.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{formatDate(inv.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        {inv.hostedInvoiceUrl && (
                          <a 
                            href={inv.hostedInvoiceUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-lime-400 hover:text-white transition-colors"
                          >
                            View <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-slate-600">
                       No invoices found for this user.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-4 pt-4 border-t border-white/5">
             <Button variant="outline" className="w-full border-slate-800" onClick={() => setInvoiceUserId(null)}>
               Close History
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
=======
"use client";

import { useMemo, useState } from "react";
import { 
  Clock, 
  CheckCircle,
  CreditCard, 
  Search, 
  RefreshCw, 
  MoreHorizontal, 
  Calendar, 
  AlertCircle, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  flexRender, 
  getCoreRowModel, 
  useReactTable, 
  getPaginationRowModel,
  ColumnDef,
  VisibilityState
} from "@tanstack/react-table";

import { apiGet, apiPost } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";

// --- Types ---

type AdminSubscription = {
  id: string;
  userId: string;
  userEmail: string;
  userIsFounder: boolean;
  planCode: string;
  planName: string;
  planCategory: string;
  planIsJewelry: boolean;
  platformLimit: number;
  baseVisualQuota: number | null;
  basePostQuota: number;
  status: string;
  priceType: string;
  stripeSubscriptionId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  createdAt: string;
};

type AdminInvoice = {
  id: string;
  number: string | null;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  hostedInvoiceUrl: string | null;
};

type ConfirmAction = 
  | { type: "cancel-schedule"; subscription: AdminSubscription }
  | { type: "cancel-immediate"; subscription: AdminSubscription }
  | { type: "resume"; subscription: AdminSubscription }
  | { type: "refresh"; subscription: AdminSubscription }
  | null;

// --- Helper Components ---

function StatusBadge({ status, cancelAtPeriodEnd }: { status: string; cancelAtPeriodEnd: boolean }) {
  const s = status.toUpperCase();
  if (s === "ACTIVE") {
    if (cancelAtPeriodEnd) {
      return (
        <Badge className="bg-amber-400 text-black border-amber-400 font-black px-3 py-1.5 flex items-center gap-1.5 shadow-[0_0_20px_rgba(251,191,36,0.35)] uppercase text-[11px] tracking-wide whitespace-nowrap">
          <Clock className="h-4 w-4 flex-shrink-0" />
          Scheduled to Cancel
        </Badge>
      );
    }
    return (
      <Badge className="bg-lime-500/10 text-lime-400 border-lime-500/20 px-3 py-1 flex items-center gap-1.5 uppercase text-[10px] font-black tracking-widest">
        <CheckCircle className="h-3 w-3" />
        Active
      </Badge>
    );
  }
  if (s === "CANCELED" || s === "CANCELLED") {
    return (
      <Badge variant="destructive" className="bg-red-500/10 text-red-400 border-red-500/20 px-3 py-1 flex items-center gap-1.5 uppercase text-[10px] font-black tracking-widest">
        <AlertCircle className="h-3 w-3" />
        Canceled
      </Badge>
    );
  }
  if (s === "INCOMPLETE") {
    return (
      <Badge variant="secondary" className="bg-slate-500/10 text-slate-400 border-slate-500/20 px-3 py-1 flex items-center gap-1.5 uppercase text-[10px] font-black tracking-widest">
        <RefreshCw className="h-3 w-3" />
        Incomplete
      </Badge>
    );
  }
  return <Badge variant="outline" className="px-3 py-1 uppercase text-[10px] font-black tracking-widest">{status}</Badge>;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

// --- Main Component ---

export default function AdminSubscriptionsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [invoiceUserId, setInvoiceUserId] = useState<string | null>(null);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    platformLimit: false,
    createdAt: false,
  });

  // Queries
  const subscriptionsQuery = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: () => apiGet<AdminSubscription[]>("/api/admin/subscriptions"),
  });

  const invoicesQuery = useQuery({
    queryKey: ["admin-user-invoices", invoiceUserId],
    queryFn: () => invoiceUserId ? apiGet<{ items: AdminInvoice[] }>(`/api/admin/users/${invoiceUserId}/invoices`) : null,
    enabled: !!invoiceUserId,
  });

  // Mutations
  const refreshMutation = useMutation({
    mutationFn: (userId: string) => apiPost(`/api/admin/users/${userId}/refresh-subscription`, {}),
    onSuccess: () => {
      toast({ title: "Subscription refreshed" });
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
    }
  });

  const cancelScheduleMutation = useMutation({
    mutationFn: (userId: string) => apiPost(`/api/admin/users/${userId}/cancel-subscription-schedule`, {}),
    onSuccess: () => {
      toast({ title: "Cancellation scheduled for period end" });
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
    }
  });

  const cancelImmediateMutation = useMutation({
    mutationFn: (userId: string) => apiPost(`/api/admin/users/${userId}/cancel-subscription-immediately`, {}),
    onSuccess: () => {
      toast({ title: "Subscription canceled immediately", variant: "destructive" });
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
    }
  });

  const resumeMutation = useMutation({
    mutationFn: (userId: string) => apiPost(`/api/admin/users/${userId}/resume-subscription`, {}),
    onSuccess: () => {
      toast({ title: "Subscription successfully resumed" });
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
    }
  });

  // Filtering Logic
  const filteredData = useMemo(() => {
    let data = subscriptionsQuery.data ?? [];
    if (statusFilter !== "ALL") {
      data = data.filter(s => s.status.toUpperCase() === statusFilter);
    }
    if (search) {
      const low = search.toLowerCase();
      data = data.filter(s => s.userEmail.toLowerCase().includes(low) || s.userId.toLowerCase().includes(low));
    }
    return data;
  }, [subscriptionsQuery.data, statusFilter, search]);

  // Table Columns
  const columns: ColumnDef<AdminSubscription>[] = [
    {
      accessorKey: "userEmail",
      header: "User",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-200">{row.original.userEmail}</span>
          <span className="text-[10px] text-slate-500 font-mono">{row.original.userId}</span>
        </div>
      ),
    },
    {
      accessorKey: "planName",
      header: "Plan",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-slate-300">{row.original.planName}</span>
          <span className="text-[10px] text-slate-500">{row.original.planCategory}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} cancelAtPeriodEnd={row.original.cancelAtPeriodEnd} />,
    },
    {
      accessorKey: "priceType",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant={row.original.priceType === "FOUNDER" ? "secondary" : "outline"} className="text-[10px] h-5 border-slate-700 bg-slate-800/50 text-slate-300">
          {row.original.priceType}
        </Badge>
      ),
    },
    {
      accessorKey: "platformLimit",
      header: "Limit",
    },
    {
      accessorKey: "currentPeriodEnd",
      header: "Next Billing",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-slate-400">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(row.original.currentPeriodEnd)}</span>
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const sub = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-slate-800">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => setConfirmAction({ type: "refresh", subscription: sub })}
                className="hover:bg-slate-800 cursor-pointer"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Sync from Stripe
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setInvoiceUserId(sub.userId)}
                className="hover:bg-slate-800 cursor-pointer"
              >
                <CreditCard className="mr-2 h-4 w-4" /> View Invoices
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-slate-800" />
              
              {sub.status === "ACTIVE" && !sub.cancelAtPeriodEnd && (
                <DropdownMenuItem 
                  onClick={() => setConfirmAction({ type: "cancel-schedule", subscription: sub })}
                  className="hover:bg-slate-800 cursor-pointer text-amber-400"
                >
                  Schedule Cancel
                </DropdownMenuItem>
              )}
              
              {sub.cancelAtPeriodEnd && (
                <DropdownMenuItem 
                  onClick={() => setConfirmAction({ type: "resume", subscription: sub })}
                  className="hover:bg-lime-500/10 cursor-pointer text-lime-400 font-medium"
                >
                  Resume Sub
                </DropdownMenuItem>
              )}

              {sub.status !== "CANCELED" && (
                <DropdownMenuItem 
                  onClick={() => setConfirmAction({ type: "cancel-immediate", subscription: sub })}
                  className="hover:bg-red-500/10 cursor-pointer text-red-400"
                >
                  Cancel Immediately
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    const { type, subscription } = confirmAction;
    
    if (type === "refresh") refreshMutation.mutate(subscription.userId);
    if (type === "cancel-schedule") cancelScheduleMutation.mutate(subscription.userId);
    if (type === "cancel-immediate") cancelImmediateMutation.mutate(subscription.userId);
    if (type === "resume") resumeMutation.mutate(subscription.userId);
    
    setConfirmAction(null);
  };

  return (
    <div className="p-6 space-y-6 max-h-screen overflow-auto scrollbar-hide">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Subscriptions</h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time management for Stripe billing and user plans.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] })}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${subscriptionsQuery.isFetching ? "animate-spin" : ""}`} />
            Refresh List
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-end bg-slate-900/50 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
        <div className="flex-1 space-y-2">
          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest pl-1">Search User</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input 
              placeholder="Filter by email or user ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-slate-950/50 border-slate-800 focus-visible:ring-lime-500/50 h-11"
            />
          </div>
        </div>
        <div className="w-full lg:w-48 space-y-2">
          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest pl-1">Status</label>
          <Select 
            id="status-filter"
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950/50 border-slate-800 h-11"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="CANCELED">Canceled</option>
            <option value="INCOMPLETE">Incomplete</option>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card className="border-white/5 bg-slate-900/40 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-950/40">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-white/5 hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-slate-500 py-4 font-semibold">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {subscriptionsQuery.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-white/5 animate-pulse">
                  <TableCell colSpan={columns.length} className="h-16 bg-slate-800/10" />
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <CreditCard className="h-10 w-10 opacity-20" />
                    <p>No subscriptions found matching your criteria.</p>
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
            <span className="text-xs text-slate-400 px-2">
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

      {/* --- Dialogs & Modals --- */}

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
              confirmAction?.type === 'cancel-immediate' ? 'bg-red-500/20' : 'bg-amber-500/20'
            }`}>
              <AlertCircle className={`h-6 w-6 ${
                confirmAction?.type === 'cancel-immediate' ? 'text-red-400' : 'text-amber-400'
              }`} />
            </div>
            <DialogTitle className="text-center text-xl">
              {confirmAction?.type === 'cancel-immediate' ? 'Cancel Immediately?' : 
               confirmAction?.type === 'cancel-schedule' ? 'Schedule Cancellation?' :
               confirmAction?.type === 'resume' ? 'Resume Subscription?' : 'Sync Subscription?'}
            </DialogTitle>
            <DialogDescription className="text-center text-slate-400 mt-2">
              {confirmAction?.type === 'cancel-immediate' ? 
                'This will terminate the subscription with Stripe right now. The user will lose access immediately.' :
               confirmAction?.type === 'cancel-schedule' ? 
                'The user will keep access until the end of the current billing cycle.' :
               confirmAction?.type === 'resume' ?
                'This will undo the scheduled cancellation and allow the subscription to renew normally.' :
                'This will fetch the latest status and period dates directly from Stripe.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-3 sm:justify-center">
            <Button variant="outline" onClick={() => setConfirmAction(null)} className="border-slate-800">
              Go Back
            </Button>
            <Button 
              variant={confirmAction?.type === 'cancel-immediate' ? 'destructive' : 'default'}
              onClick={handleConfirmAction}
              className={confirmAction?.type === 'resume' ? 'bg-lime-500 hover:bg-lime-600' : ''}
              disabled={
                refreshMutation.isPending || 
                cancelScheduleMutation.isPending || 
                cancelImmediateMutation.isPending || 
                resumeMutation.isPending
              }
            >
              Confirm Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoices Sheet/Modal */}
      <Dialog open={!!invoiceUserId} onOpenChange={(open) => !open && setInvoiceUserId(null)}>
        <DialogContent className="bg-slate-950 border-slate-800 sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-lime-400" />
              Invoices History
            </DialogTitle>
            <DialogDescription>
              Billing history and hosted invoice links from Stripe.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto mt-4 px-1">
            <Table>
              <TableHeader className="sticky top-0 bg-slate-950">
                <TableRow className="border-white/5">
                  <TableHead>Number</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoicesQuery.isLoading ? (
                   Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse border-white/5">
                      <TableCell colSpan={5} className="h-12 bg-slate-900/50" />
                    </TableRow>
                  ))
                ) : invoicesQuery.data?.items?.length ? (
                  invoicesQuery.data.items.map((inv) => (
                    <TableRow key={inv.id} className="border-white/5 hover:bg-white/5 text-slate-300">
                      <TableCell className="font-mono text-[10px]">{inv.number ?? inv.id.slice(0, 8)}</TableCell>
                      <TableCell className="font-bold text-white">{formatAmount(inv.amount, inv.currency)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`h-4 text-[9px] ${
                          inv.status === 'paid' ? 'border-lime-500/50 text-lime-400' : ''
                        }`}>
                          {inv.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{formatDate(inv.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        {inv.hostedInvoiceUrl && (
                          <a 
                            href={inv.hostedInvoiceUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-lime-400 hover:text-white transition-colors"
                          >
                            View <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-slate-600">
                       No invoices found for this user.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-4 pt-4 border-t border-white/5">
             <Button variant="outline" className="w-full border-slate-800" onClick={() => setInvoiceUserId(null)}>
               Close History
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
>>>>>>> d562463 (remove the search filed and set the path)
