<<<<<<< HEAD
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  VisibilityState,
  RowSelectionState,
} from "@tanstack/react-table";
import { useSessionContext } from "@/context/SessionContext";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const PAGE_SIZE = 20;

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  status: "ACTIVE" | "BLOCKED" | "DELETED";
  isFounder: boolean;
  signupDate: string;
  createdAt: string;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  blockedAt: string | null;
  blockedReason: string | null;
  deletedAt: string | null;
  onboardingCompleted: boolean;
  connectedPlatformsCount: number;
  scheduledPostsCount: number;
  subscriptions: Array<{
    id: string;
    planCode: string;
    status: string;
    priceType: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    createdAt: string;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
  }>;
  socialPlatforms: string[];
};

type AdminUsersResponse = {
  items: AdminUser[];
  page: number;
  pageSize: number;
  total: number;
};

type Plan = {
  code: string;
  name: string;
  category: string;
};

type ConfirmAction =
  | { type: "delete"; user: AdminUser }
  | { type: "block"; user: AdminUser }
  | { type: "unblock"; user: AdminUser }
  | { type: "cancel"; user: AdminUser }
  | null;

type EditState = {
  open: boolean;
  user: AdminUser | null;
  name: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
};

type CreateState = {
  open: boolean;
  name: string;
  email: string;
  password?: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  planCode: string;
  sendVerification: boolean;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { session } = useSessionContext();

  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: "",
    plan: "",
    founder: "",
    subscriptionStatus: "",
    sortBy: "createdAt",
    sortDir: "desc",
    page: 1,
    pageSize: PAGE_SIZE,
  });

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(true);
  const [editState, setEditState] = useState<EditState>({
    open: false,
    user: null,
    name: "",
    role: "USER",
  });
  const [createState, setCreateState] = useState<CreateState>({
    open: false,
    name: "",
    email: "",
    password: "",
    role: "USER",
    planCode: "",
    sendVerification: true,
  });

  const isAdmin = session?.role === "ADMIN" || session?.role === "SUPER_ADMIN";

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.role) params.set("role", filters.role);
    if (filters.status) params.set("status", filters.status);
    if (filters.plan) params.set("plan", filters.plan);
    if (filters.founder) params.set("founder", filters.founder);
    if (filters.subscriptionStatus) params.set("subscriptionStatus", filters.subscriptionStatus);
    params.set("sortBy", filters.sortBy);
    params.set("sortDir", filters.sortDir);
    params.set("page", String(filters.page));
    params.set("pageSize", String(filters.pageSize));
    return params.toString();
  }, [filters]);

  const usersQuery = useQuery({
    queryKey: ["admin-users", queryString],
    queryFn: () => apiGet<AdminUsersResponse>(`/api/admin/users?${queryString}`),
    enabled: isAdmin,
  });

  const plansQuery = useQuery({
    queryKey: ["plans"],
    queryFn: () => apiGet<Plan[]>("/api/billing/plans"),
    enabled: isAdmin,
  });

  const createUserMutation = useMutation({
    mutationFn: (payload: { name?: string; email: string; password?: string; role: string; planCode?: string; sendVerification: boolean }) =>
      apiPost<AdminUser, typeof payload>("/api/admin/users", payload),
    onSuccess: () => {
      toast({ title: "User created" });
      setCreateState({ open: false, name: "", email: "", password: "", role: "USER", planCode: "", sendVerification: true });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: Error) => {
      toast({ title: "Unable to create user", description: err.message, variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: (payload: { id: string; name?: string; role?: string }) =>
      apiPatch<AdminUser, { name?: string; role?: string }>(`/api/admin/users/${payload.id}`, {
        name: payload.name,
        role: payload.role,
      }),
    onSuccess: () => {
      toast({ title: "User updated" });
      setEditState({ open: false, user: null, name: "", role: "USER" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: Error) => {
      toast({ title: "Unable to update user", description: err.message, variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/admin/users/${id}`),
    onSuccess: () => {
      toast({ title: "User deleted" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setConfirmAction(null);
    },
    onError: (err: Error) => {
      toast({ title: "Unable to delete user", description: err.message, variant: "destructive" });
    },
  });

  const blockUserMutation = useMutation({
    mutationFn: (payload: { id: string; reason: string }) =>
      apiPost<AdminUser, { reason: string }>(`/api/admin/users/${payload.id}/block`, { reason: payload.reason }),
    onSuccess: () => {
      toast({ title: "User blocked" });
      setBlockReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: Error) => {
      toast({ title: "Unable to block user", description: err.message, variant: "destructive" });
    },
  });

  const unblockUserMutation = useMutation({
    mutationFn: (id: string) => apiPost<AdminUser, Record<string, never>>(`/api/admin/users/${id}/unblock`, {}),
    onSuccess: () => {
      toast({ title: "User unblocked" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: Error) => {
      toast({ title: "Unable to unblock user", description: err.message, variant: "destructive" });
    },
  });

  const resendVerificationMutation = useMutation({
    mutationFn: (id: string) => apiPost<{ success: boolean }, Record<string, never>>(`/api/admin/users/${id}/resend-verification`, {}),
    onSuccess: () => {
      toast({ title: "Verification email resent" });
    },
    onError: (err: Error) => {
      toast({ title: "Unable to resend verification", description: err.message, variant: "destructive" });
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: (payload: { id: string; cancelAtPeriodEnd: boolean }) =>
      apiPost<{ subscription: unknown }, { cancelAtPeriodEnd: boolean }>(`/api/admin/users/${payload.id}/cancel-subscription`, {
        cancelAtPeriodEnd: payload.cancelAtPeriodEnd,
      }),
    onSuccess: () => {
      toast({ title: "Subscription cancellation updated" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: Error) => {
      toast({ title: "Unable to cancel subscription", description: err.message, variant: "destructive" });
    },
  });

  const columns: ColumnDef<AdminUser>[] = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "email",
        header: "User",
        cell: ({ row }) => (
          <div className="cursor-pointer" onClick={() => router.push(`/admin/users/${row.original.id}`)}>
            <div className="font-medium text-white">{row.original.name || "—"}</div>
            <div className="text-xs text-slate-400">{row.original.email}</div>
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Registered",
        cell: ({ row }) => <div className="text-xs text-slate-300">{formatDate(row.original.createdAt)}</div>,
      },
      {
        accessorKey: "isFounder",
        header: "Founder",
        cell: ({ row }) =>
          row.original.isFounder ? (
            <Badge className="bg-lime-300/20 text-lime-200 border-lime-300/40">Yes</Badge>
          ) : (
            <span className="text-xs text-slate-400">No</span>
          ),
      },
      {
        accessorKey: "onboardingCompleted",
        header: "Onboarding",
        cell: ({ row }) =>
          row.original.onboardingCompleted ? (
            <Badge variant="outline" className="text-lime-400 border-lime-400/30">Done</Badge>
          ) : (
            <Badge variant="outline" className="text-orange-400 border-orange-400/30">Pending</Badge>
          ),
      },
      {
        accessorKey: "subscriptions",
        header: "Subscription Plan",
        cell: ({ row }) => {
          const sub = row.original.subscriptions[0];
          return sub ? (
            <div className="flex flex-col gap-1">
              <Badge variant="outline" className="text-xs w-fit">
                {sub.planCode}
              </Badge>
              {sub.priceType && (
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">{sub.priceType}</span>
              )}
            </div>
          ) : (
            <span className="text-xs text-slate-400">—</span>
          );
        },
      },
      {
        id: "subscriptionStatus",
        header: "Subscription Status",
        cell: ({ row }) => {
          const sub = row.original.subscriptions[0];
          return sub ? (
            <Badge
              variant={
                sub.status === "ACTIVE"
                  ? "default"
                  : sub.status === "PAST_DUE" || sub.status === "CANCELED"
                    ? "destructive"
                    : "secondary"
              }
              className="text-xs"
            >
              {sub.status}
            </Badge>
          ) : (
            <span className="text-xs text-slate-400">—</span>
          );
        },
      },
      {
        id: "subscriptionEndDate",
        header: "Subscription End",
        cell: ({ row }) => {
          const sub = row.original.subscriptions[0];
          return (
            <div className="text-xs text-slate-300">
              {sub?.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : "—"}
            </div>
          );
        },
      },
      {
        accessorKey: "connectedPlatformsCount",
        header: "Platforms",
        cell: ({ row }) => (
          <div className="text-xs text-slate-300">{row.original.connectedPlatformsCount}</div>
        ),
      },
      {
        accessorKey: "scheduledPostsCount",
        header: "Scheduled",
        cell: ({ row }) => (
          <div className="text-xs text-slate-300">{row.original.scheduledPostsCount}</div>
        ),
      },
      {
        accessorKey: "status",
        header: "Account Status",
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge
              variant={status === "ACTIVE" ? "default" : status === "BLOCKED" ? "destructive" : "secondary"}
              className="text-xs"
            >
              {status}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const user = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <span className="text-slate-200">⋯</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => router.push(`/admin/users/${user.id}`)}>
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEdit(user)}>Edit</DropdownMenuItem>
                <DropdownMenuSeparator />
                {user.status === "BLOCKED" ? (
                  <DropdownMenuItem onClick={() => setConfirmAction({ type: "unblock", user })}>
                    Unblock
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => setConfirmAction({ type: "block", user })}>
                    Block/Suspend
                  </DropdownMenuItem>
                )}
                {/* <DropdownMenuItem onClick={() => resendVerificationMutation.mutate(user.id)}>
                  Resend Verification
                </DropdownMenuItem> */}
                {/* <DropdownMenuItem onClick={() => setConfirmAction({ type: "cancel", user })}>
                  Cancel Subscription
                </DropdownMenuItem> */}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setConfirmAction({ type: "delete", user })}
                  className="text-red-300"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [router, resendVerificationMutation]
  );

  const users = usersQuery.data?.items ?? [];
  const total = usersQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));

  // TanStack Table returns unstable function references; React Compiler skips memoizing by design
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: totalPages,
    state: {
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex: filters.page - 1,
        pageSize: filters.pageSize,
      },
    },
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
  });

  function handleEdit(user: AdminUser) {
    setEditState({
      open: true,
      user,
      name: user.name ?? "",
      role: user.role,
    });
  }

  function handleConfirmAction() {
    if (!confirmAction) return;
    if (confirmAction.type === "delete") {
      deleteUserMutation.mutate(confirmAction.user.id);
    }
    if (confirmAction.type === "block") {
      blockUserMutation.mutate({ id: confirmAction.user.id, reason: blockReason });
    }
    if (confirmAction.type === "unblock") {
      unblockUserMutation.mutate(confirmAction.user.id);
    }
    if (confirmAction.type === "cancel") {
      cancelSubscriptionMutation.mutate({ id: confirmAction.user.id, cancelAtPeriodEnd });
    }
    setConfirmAction(null);
  }

  function formatDate(value?: string | null) {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">User Management</h1>
          <p className="text-sm text-slate-400">Review and manage user accounts safely.</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Columns</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          {/* <Button onClick={() => setCreateState((prev) => ({ ...prev, open: true }))}>Create User</Button> */}
        </div>
      </div>

      <div className="mb-4 grid gap-4 rounded-lg border border-slate-800 bg-slate-900/40 p-4 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search by name, email, or ID"
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value, page: 1 }))}
          />
        </div>
        {/* <div>
          <Label htmlFor="role">Role</Label>
          <Select
            id="role"
            value={filters.role}
            onChange={(event) => setFilters((prev) => ({ ...prev, role: event.target.value, page: 1 }))}
          >
            <option value="">All</option>
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </Select>
        </div> */}
        <div>
          <Label htmlFor="status">Account Status</Label>
          <Select
            id="status"
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value, page: 1 }))}
          >
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="BLOCKED">Blocked</option>
            <option value="DELETED">Deleted</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="founder">Founder Status</Label>
          <Select
            id="founder"
            value={filters.founder}
            onChange={(event) => setFilters((prev) => ({ ...prev, founder: event.target.value, page: 1 }))}
          >
            <option value="">All</option>
            <option value="true">Founders</option>
            <option value="false">Non-founders</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="plan">Subscription Plan</Label>
          <Select
            id="plan"
            value={filters.plan}
            onChange={(event) => setFilters((prev) => ({ ...prev, plan: event.target.value, page: 1 }))}
          >
            <option value="">All</option>
            {(plansQuery.data ?? []).map((plan) => (
              <option key={plan.code} value={plan.code}>
                {plan.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="subscriptionStatus">Sub Status</Label>
          <Select
            id="subscriptionStatus"
            value={filters.subscriptionStatus}
            onChange={(event) => setFilters((prev) => ({ ...prev, subscriptionStatus: event.target.value, page: 1 }))}
          >
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="TRIALING">Trialing</option>
            <option value="PAST_DUE">Past Due</option>
            <option value="CANCELED">Cancelled</option>
            <option value="INCOMPLETE">Incomplete</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="sort">Sort By</Label>
          <Select
            id="sort"
            value={`${filters.sortBy}:${filters.sortDir}`}
            onChange={(event) => {
              const [sortBy, sortDir] = event.target.value.split(":");
              setFilters((prev) => ({ ...prev, sortBy, sortDir, page: 1 }));
            }}
          >
            <option value="createdAt:desc">Newest First</option>
            <option value="createdAt:asc">Oldest First</option>
            <option value="founder:desc">Founders First</option>
            <option value="founder:asc">Non-founders First</option>
            <option value="plan:asc">Plan (A-Z)</option>
            <option value="plan:desc">Plan (Z-A)</option>
            <option value="periodEnd:asc">Period End (Soonest)</option>
            <option value="periodEnd:desc">Period End (Latest)</option>
          </Select>
        </div>
      </div>

      {Object.keys(rowSelection).length > 0 && (
        <div className="mb-4 rounded-lg border border-lime-300/40 bg-lime-300/10 p-3 text-sm text-lime-200">
          {Object.keys(rowSelection).length} row(s) selected.
        </div>
      )}

      <div className="rounded-lg border border-slate-800 bg-slate-900/40">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}
                  className="text-slate-300"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {usersQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-slate-400">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : usersQuery.isError ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-red-300">
                  Unable to load users.
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-slate-400">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell 
                    className="text-slate-300"
                    key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6 flex items-center justify-between text-sm text-slate-400">
        <div>
          Showing {users.length} of {total} users (Page {filters.page} of {totalPages})
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={filters.page <= 1}
            onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={filters.page >= totalPages}
            onClick={() => setFilters((prev) => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Create User Dialog */}
      <Dialog open={createState.open} onOpenChange={(open) => setCreateState((prev) => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
            <DialogDescription>Invite a new account securely.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="create-name">Name</Label>
              <Input
                id="create-name"
                value={createState.name}
                onChange={(event) => setCreateState((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                value={createState.email}
                onChange={(event) => setCreateState((prev) => ({ ...prev, email: event.target.value }))}
                type="email"
                required
              />
            </div>
            <div>
              <Label htmlFor="create-role">Role</Label>
              <Select
                id="create-role"
                value={createState.role}
                onChange={(event) =>
                  setCreateState((prev) => ({
                    ...prev,
                    role: event.target.value as CreateState["role"],
                  }))
                }
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="create-plan">Initial Plan (optional)</Label>
              <Select
                id="create-plan"
                value={createState.planCode}
                onChange={(event) => setCreateState((prev) => ({ ...prev, planCode: event.target.value }))}
              >
                <option value="">None</option>
                {(plansQuery.data ?? []).map((plan) => (
                  <option key={plan.code} value={plan.code}>
                    {plan.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="create-password">Initial Password (optional)</Label>
              <Input
                id="create-password"
                type="password"
                value={createState.password}
                onChange={(event) => setCreateState((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="Secure password"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-200">
              <Checkbox
                checked={createState.sendVerification}
                onCheckedChange={(value) =>
                  setCreateState((prev) => ({ ...prev, sendVerification: Boolean(value) }))
                }
              />
              Send verification email
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateState((prev) => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                createUserMutation.mutate({
                  name: createState.name || undefined,
                  email: createState.email,
                  password: createState.password || undefined,
                  role: createState.role,
                  planCode: createState.planCode || undefined,
                  sendVerification: createState.sendVerification,
                })
              }
              disabled={!createState.email || createUserMutation.isPending}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editState.open} onOpenChange={(open) => setEditState((prev) => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update the name or role for this account.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editState.name}
                onChange={(event) => setEditState((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-role">Role</Label>
              <Select
                id="edit-role"
                value={editState.role}
                onChange={(event) =>
                  setEditState((prev) => ({
                    ...prev,
                    role: event.target.value as EditState["role"],
                  }))
                }
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditState((prev) => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                editState.user &&
                updateUserMutation.mutate({
                  id: editState.user.id,
                  name: editState.name || undefined,
                  role: editState.role,
                })
              }
              disabled={!editState.user || updateUserMutation.isPending}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      <Dialog open={Boolean(confirmAction)} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.type === "delete" && "Delete User"}
              {confirmAction?.type === "block" && "Block User"}
              {confirmAction?.type === "unblock" && "Unblock User"}
              {confirmAction?.type === "cancel" && "Cancel Subscription"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.type === "delete" && "This will permanently delete the user account and all associated data."}
              {confirmAction?.type === "block" && "Blocked users cannot sign in or access the API."}
              {confirmAction?.type === "unblock" && "Restore access for this account."}
              {confirmAction?.type === "cancel" && "Manage Stripe cancellation settings."}
            </DialogDescription>
          </DialogHeader>
          {confirmAction?.type === "block" && (
            <div>
              <Label htmlFor="block-reason">Reason</Label>
              <Input
                id="block-reason"
                value={blockReason}
                onChange={(event) => setBlockReason(event.target.value)}
                placeholder="Reason for blocking"
              />
            </div>
          )}
          {confirmAction?.type === "cancel" && (
            <label className="flex items-center gap-2 text-sm text-slate-200">
              <Checkbox
                checked={cancelAtPeriodEnd}
                onCheckedChange={(value) => setCancelAtPeriodEnd(Boolean(value))}
              />
              Cancel at period end (recommended)
            </label>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>
              Back
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={
                (confirmAction?.type === "block" && !blockReason)
              }
              variant="default"
              className={confirmAction?.type === "delete" ? "bg-red-600 hover:bg-red-700 text-white" : ""}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
=======
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  VisibilityState,
  RowSelectionState,
} from "@tanstack/react-table";
import { useSessionContext } from "@/context/SessionContext";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, User, UserCheck, UserX, Trash2, ChevronDown, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const PAGE_SIZE = 20;

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  status: "ACTIVE" | "BLOCKED" | "DELETED";
  isFounder: boolean;
  signupDate: string;
  createdAt: string;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  blockedAt: string | null;
  blockedReason: string | null;
  deletedAt: string | null;
  onboardingCompleted: boolean;
  connectedPlatformsCount: number;
  scheduledPostsCount: number;
  subscriptions: Array<{
    id: string;
    planCode: string;
    status: string;
    priceType: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    createdAt: string;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
  }>;
  socialPlatforms: string[];
};

type AdminUsersResponse = {
  items: AdminUser[];
  page: number;
  pageSize: number;
  total: number;
};

type Plan = {
  code: string;
  name: string;
  category: string;
};

type ConfirmAction =
  | { type: "delete"; user: AdminUser }
  | { type: "block"; user: AdminUser }
  | { type: "unblock"; user: AdminUser }
  | { type: "cancel"; user: AdminUser }
  | null;

type EditState = {
  open: boolean;
  user: AdminUser | null;
  name: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
};

type CreateState = {
  open: boolean;
  name: string;
  email: string;
  password?: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  planCode: string;
  sendVerification: boolean;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { session } = useSessionContext();

  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: "",
    plan: "",
    founder: "",
    subscriptionStatus: "",
    sortBy: "createdAt",
    sortDir: "desc",
    page: 1,
    pageSize: PAGE_SIZE,
  });

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(true);
  const [editState, setEditState] = useState<EditState>({
    open: false,
    user: null,
    name: "",
    role: "USER",
  });
  const [createState, setCreateState] = useState<CreateState>({
    open: false,
    name: "",
    email: "",
    password: "",
    role: "USER",
    planCode: "",
    sendVerification: true,
  });

  const isAdmin = session?.role === "ADMIN" || session?.role === "SUPER_ADMIN";

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.role) params.set("role", filters.role);
    if (filters.status) params.set("status", filters.status);
    if (filters.plan) params.set("plan", filters.plan);
    if (filters.founder) params.set("founder", filters.founder);
    if (filters.subscriptionStatus) params.set("subscriptionStatus", filters.subscriptionStatus);
    params.set("sortBy", filters.sortBy);
    params.set("sortDir", filters.sortDir);
    params.set("page", String(filters.page));
    params.set("pageSize", String(filters.pageSize));
    return params.toString();
  }, [filters]);

  const usersQuery = useQuery({
    queryKey: ["admin-users", queryString],
    queryFn: () => apiGet<AdminUsersResponse>(`/api/admin/users?${queryString}`),
    enabled: isAdmin,
  });

  const plansQuery = useQuery({
    queryKey: ["plans"],
    queryFn: () => apiGet<Plan[]>("/api/billing/plans"),
    enabled: isAdmin,
  });

  const createUserMutation = useMutation({
    mutationFn: (payload: { name?: string; email: string; password?: string; role: string; planCode?: string; sendVerification: boolean }) =>
      apiPost<AdminUser, typeof payload>("/api/admin/users", payload),
    onSuccess: () => {
      toast({ title: "User created" });
      setCreateState({ open: false, name: "", email: "", password: "", role: "USER", planCode: "", sendVerification: true });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: Error) => {
      toast({ title: "Unable to create user", description: err.message, variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: (payload: { id: string; name?: string; role?: string }) =>
      apiPatch<AdminUser, { name?: string; role?: string }>(`/api/admin/users/${payload.id}`, {
        name: payload.name,
        role: payload.role,
      }),
    onSuccess: () => {
      toast({ title: "User updated" });
      setEditState({ open: false, user: null, name: "", role: "USER" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: Error) => {
      toast({ title: "Unable to update user", description: err.message, variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/admin/users/${id}`),
    onSuccess: () => {
      toast({ title: "User deleted" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setConfirmAction(null);
    },
    onError: (err: Error) => {
      toast({ title: "Unable to delete user", description: err.message, variant: "destructive" });
    },
  });

  const blockUserMutation = useMutation({
    mutationFn: (payload: { id: string; reason: string }) =>
      apiPost<AdminUser, { reason: string }>(`/api/admin/users/${payload.id}/block`, { reason: payload.reason }),
    onSuccess: () => {
      toast({ title: "User blocked" });
      setBlockReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: Error) => {
      toast({ title: "Unable to block user", description: err.message, variant: "destructive" });
    },
  });

  const unblockUserMutation = useMutation({
    mutationFn: (id: string) => apiPost<AdminUser, Record<string, never>>(`/api/admin/users/${id}/unblock`, {}),
    onSuccess: () => {
      toast({ title: "User unblocked" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: Error) => {
      toast({ title: "Unable to unblock user", description: err.message, variant: "destructive" });
    },
  });

  const resendVerificationMutation = useMutation({
    mutationFn: (id: string) => apiPost<{ success: boolean }, Record<string, never>>(`/api/admin/users/${id}/resend-verification`, {}),
    onSuccess: () => {
      toast({ title: "Verification email resent" });
    },
    onError: (err: Error) => {
      toast({ title: "Unable to resend verification", description: err.message, variant: "destructive" });
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: (payload: { id: string; cancelAtPeriodEnd: boolean }) =>
      apiPost<{ subscription: unknown }, { cancelAtPeriodEnd: boolean }>(`/api/admin/users/${payload.id}/cancel-subscription`, {
        cancelAtPeriodEnd: payload.cancelAtPeriodEnd,
      }),
    onSuccess: () => {
      toast({ title: "Subscription cancellation updated" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: Error) => {
      toast({ title: "Unable to cancel subscription", description: err.message, variant: "destructive" });
    },
  });

  const columns: ColumnDef<AdminUser>[] = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "email",
        header: "User",
        cell: ({ row }) => (
          <div className="cursor-pointer" onClick={() => router.push(`/admin/users/${row.original.id}`)}>
            <div className="font-medium text-white">{row.original.name || "—"}</div>
            <div className="text-xs text-slate-400">{row.original.email}</div>
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Registered",
        cell: ({ row }) => <div className="text-xs text-slate-300">{formatDate(row.original.createdAt)}</div>,
      },
      {
        accessorKey: "isFounder",
        header: "Founder",
        cell: ({ row }) =>
          row.original.isFounder ? (
            <Badge className="bg-lime-300/20 text-lime-200 border-lime-300/40">Yes</Badge>
          ) : (
            <span className="text-xs text-slate-400">No</span>
          ),
      },
      {
        accessorKey: "onboardingCompleted",
        header: "Onboarding",
        cell: ({ row }) =>
          row.original.onboardingCompleted ? (
            <Badge variant="outline" className="text-lime-400 border-lime-400/30">Done</Badge>
          ) : (
            <Badge variant="outline" className="text-orange-400 border-orange-400/30">Pending</Badge>
          ),
      },
      {
        accessorKey: "subscriptions",
        header: "Subscription Plan",
        cell: ({ row }) => {
          const sub = row.original.subscriptions[0];
          return sub ? (
            <div className="flex flex-col gap-1">
              <Badge variant="outline" className="text-[10px] w-fit border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
                {sub.planCode}
              </Badge>
              {sub.priceType && (
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">{sub.priceType}</span>
              )}
            </div>
          ) : (
            <span className="text-xs text-slate-400">—</span>
          );
        },
      },
      {
        id: "subscriptionStatus",
        header: "Subscription Status",
        cell: ({ row }) => {
          const sub = row.original.subscriptions[0];
          if (!sub) return <span className="text-xs text-slate-400">—</span>;

          const s = sub.status.toUpperCase();
          if (s === "ACTIVE" && sub.cancelAtPeriodEnd) {
            return (
              <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-black px-2 py-0.5 flex items-center gap-1 animate-pulse uppercase text-[10px] tracking-widest">
                <Clock className="h-2.5 w-2.5" />
                Scheduled Cancel
              </Badge>
            );
          }

          return (
            <Badge
              variant={
                s === "ACTIVE"
                  ? "default"
                  : s === "PAST_DUE" || s === "CANCELED"
                    ? "destructive"
                    : "secondary"
              }
              className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5"
            >
              {s}
            </Badge>
          );
        },
      },
      {
        id: "subscriptionEndDate",
        header: "Subscription End",
        cell: ({ row }) => {
          const sub = row.original.subscriptions[0];
          return (
            <div className="text-xs text-slate-300">
              {sub?.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : "—"}
            </div>
          );
        },
      },
      {
        accessorKey: "connectedPlatformsCount",
        header: "Platforms",
        cell: ({ row }) => (
          <div className="text-xs text-slate-300">{row.original.connectedPlatformsCount}</div>
        ),
      },
      {
        accessorKey: "scheduledPostsCount",
        header: "Scheduled",
        cell: ({ row }) => (
          <div className="text-xs text-slate-300">{row.original.scheduledPostsCount}</div>
        ),
      },
      {
        accessorKey: "status",
        header: "Account Status",
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge
              variant={status === "ACTIVE" ? "default" : status === "BLOCKED" ? "destructive" : "secondary"}
              className="text-xs"
            >
              {status}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const user = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <span className="text-slate-200">⋯</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => router.push(`/admin/users/${user.id}`)}>
                  <Eye className="mr-2 h-4 w-4" /> View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEdit(user)}>
                  <User className="mr-2 h-4 w-4" /> Edit Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {user.status === "BLOCKED" ? (
                  <DropdownMenuItem onClick={() => setConfirmAction({ type: "unblock", user })} className="text-lime-400">
                    <UserCheck className="mr-2 h-4 w-4" /> Unblock User
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => setConfirmAction({ type: "block", user })} className="text-amber-400">
                    <UserX className="mr-2 h-4 w-4" /> Block/Suspend
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setConfirmAction({ type: "delete", user })}
                  className="text-red-400 focus:text-red-400"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [router, resendVerificationMutation]
  );

  const users = usersQuery.data?.items ?? [];
  const total = usersQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));

  // TanStack Table returns unstable function references; React Compiler skips memoizing by design
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: totalPages,
    state: {
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex: filters.page - 1,
        pageSize: filters.pageSize,
      },
    },
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
  });

  function handleEdit(user: AdminUser) {
    setEditState({
      open: true,
      user,
      name: user.name ?? "",
      role: user.role,
    });
  }

  function handleConfirmAction() {
    if (!confirmAction) return;
    if (confirmAction.type === "delete") {
      deleteUserMutation.mutate(confirmAction.user.id);
    }
    if (confirmAction.type === "block") {
      blockUserMutation.mutate({ id: confirmAction.user.id, reason: blockReason });
    }
    if (confirmAction.type === "unblock") {
      unblockUserMutation.mutate(confirmAction.user.id);
    }
    if (confirmAction.type === "cancel") {
      cancelSubscriptionMutation.mutate({ id: confirmAction.user.id, cancelAtPeriodEnd });
    }
    setConfirmAction(null);
  }

  function formatDate(value?: string | null) {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">User Management</h1>
          <p className="text-sm text-slate-400">Review and manage user accounts safely.</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Columns</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          {/* <Button onClick={() => setCreateState((prev) => ({ ...prev, open: true }))}>Create User</Button> */}
        </div>
      </div>

      <div className="mb-4 grid gap-4 rounded-lg border border-slate-800 bg-slate-900/40 p-4 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search by name, email, or ID"
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value, page: 1 }))}
          />
        </div>
        {/* <div>
          <Label htmlFor="role">Role</Label>
          <Select
            id="role"
            value={filters.role}
            onChange={(event) => setFilters((prev) => ({ ...prev, role: event.target.value, page: 1 }))}
          >
            <option value="">All</option>
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </Select>
        </div> */}
        <div>
          <Label htmlFor="status">Account Status</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button id="status" variant="outline" className="w-full justify-between h-10 border-slate-800 bg-slate-900/60 font-normal hover:bg-slate-800 text-slate-300 px-3 transition-colors">
                {filters.status === "" ? "All" : filters.status === "ACTIVE" ? "Active" : filters.status === "BLOCKED" ? "Blocked" : "Deleted"} 
                <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
              <DropdownMenuItem onClick={() => setFilters((prev) => ({ ...prev, status: "", page: 1 }))}>All</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters((prev) => ({ ...prev, status: "ACTIVE", page: 1 }))}>Active</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters((prev) => ({ ...prev, status: "BLOCKED", page: 1 }))}>Blocked</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters((prev) => ({ ...prev, status: "DELETED", page: 1 }))}>Deleted</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div>
          <Label htmlFor="plan">Subscription Plan</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button id="plan" variant="outline" className="w-full justify-between h-10 border-slate-800 bg-slate-900/60 font-normal hover:bg-slate-800 text-slate-300 px-3 transition-colors">
                {filters.plan === "" ? "All Plans" : (plansQuery.data?.find(p => p.code === filters.plan)?.name || filters.plan)} 
                <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-0">
              <DropdownMenuItem onClick={() => setFilters((prev) => ({ ...prev, plan: "", page: 1 }))}>All Plans</DropdownMenuItem>
              {(plansQuery.data ?? []).map((plan) => (
                <DropdownMenuItem key={plan.code} onClick={() => setFilters((prev) => ({ ...prev, plan: plan.code, page: 1 }))}>
                  {plan.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div>
          <Label htmlFor="subscriptionStatus">Sub Status</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button id="subscriptionStatus" variant="outline" className="w-full justify-between h-10 border-slate-800 bg-slate-900/60 font-normal hover:bg-slate-800 text-slate-300 px-3 transition-colors">
                {filters.subscriptionStatus === "" ? "All" : filters.subscriptionStatus} 
                <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
              <DropdownMenuItem onClick={() => setFilters((prev) => ({ ...prev, subscriptionStatus: "", page: 1 }))}>All</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters((prev) => ({ ...prev, subscriptionStatus: "ACTIVE", page: 1 }))}>ACTIVE</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters((prev) => ({ ...prev, subscriptionStatus: "TRIALING", page: 1 }))}>TRIALING</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters((prev) => ({ ...prev, subscriptionStatus: "PAST_DUE", page: 1 }))}>PAST_DUE</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters((prev) => ({ ...prev, subscriptionStatus: "CANCELED", page: 1 }))}>CANCELED</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters((prev) => ({ ...prev, subscriptionStatus: "INCOMPLETE", page: 1 }))}>INCOMPLETE</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div>
          <Label htmlFor="sort">Sort By</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button id="sort" variant="outline" className="w-full justify-between h-10 border-slate-800 bg-slate-900/60 font-normal hover:bg-slate-800 text-slate-300 px-3 transition-colors">
                {filters.sortBy === "createdAt" && filters.sortDir === "desc" ? "Newest First" : "Oldest First"} 
                <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[var(--radix-dropdown-menu-trigger-width)]">
              <DropdownMenuItem onClick={() => setFilters((prev) => ({ ...prev, sortBy: "createdAt", sortDir: "desc", page: 1 }))}>Newest First</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters((prev) => ({ ...prev, sortBy: "createdAt", sortDir: "asc", page: 1 }))}>Oldest First</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {Object.keys(rowSelection).length > 0 && (
        <div className="mb-4 rounded-lg border border-lime-300/40 bg-lime-300/10 p-3 text-sm text-lime-200">
          {Object.keys(rowSelection).length} row(s) selected.
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/30 overflow-hidden backdrop-blur-sm">
        <Table>
          <TableHeader className="bg-slate-800/30">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-slate-800">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-slate-500 font-bold uppercase tracking-widest text-[10px] py-5">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {usersQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-slate-400">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : usersQuery.isError ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-red-300">
                  Unable to load users.
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-slate-400">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="border-slate-800 hover:bg-slate-800/20 transition-all group">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell 
                    className="py-5 font-medium group-hover:text-white transition-colors"
                    key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

            {/* ── Pagination Footer ── */}
            {totalPages > 0 && (
              <div className="mt-6 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4 px-6 pb-6 border-t border-slate-800 bg-slate-950/20">
                
                {/* Left: results info */}
                <p className="text-[11px] font-semibold text-slate-500 tracking-wide">
                  Showing page{" "}
                  <span className="text-slate-300 font-black">{filters.page}</span>
                  {" "}of{" "}
                  <span className="text-slate-300 font-black">{totalPages}</span>
                  {" "}·{" "}
                  <span className="text-slate-300 font-black">{total}</span> total users
                </p>

                {/* Center: page number pills */}
                <div className="flex items-center gap-3">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      onClick={() => setFilters(prev => ({ ...prev, page: pg }))}
                      disabled={usersQuery.isLoading}
                      className={`h-8 w-8 rounded-lg text-[11px] font-black transition-all duration-200 ${
                        pg === filters.page
                          ? "bg-gradient-to-br from-lime-400 to-emerald-500 text-slate-900 shadow-lg shadow-lime-400/20 scale-110"
                          : "bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:border-lime-400/40 hover:text-lime-300 hover:bg-slate-700/60"
                      } disabled:cursor-not-allowed`}
                    >
                      {pg}
                    </button>
                  ))}
                </div>

                {/* Right: Prev / Next */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={usersQuery.isLoading || filters.page <= 1}
                    className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 bg-slate-800/60 text-[11px] font-black text-slate-300 uppercase tracking-widest transition-all duration-200 hover:border-indigo-400/50 hover:bg-indigo-500/10 hover:text-indigo-300 disabled:opacity-25 disabled:cursor-not-allowed"
                  >
                    <svg className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </button>
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
                    disabled={usersQuery.isLoading || filters.page >= totalPages}
                    className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-transparent bg-gradient-to-r from-lime-500/80 to-emerald-600/80 text-[11px] font-black text-white uppercase tracking-widest shadow-md shadow-lime-400/10 transition-all duration-200 hover:from-lime-400 hover:to-emerald-500 hover:shadow-lime-400/25 disabled:opacity-25 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    Next Page
                    <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

      {/* Create User Dialog */}
      <Dialog open={createState.open} onOpenChange={(open) => setCreateState((prev) => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
            <DialogDescription>Invite a new account securely.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="create-name">Name</Label>
              <Input
                id="create-name"
                value={createState.name}
                onChange={(event) => setCreateState((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                value={createState.email}
                onChange={(event) => setCreateState((prev) => ({ ...prev, email: event.target.value }))}
                type="email"
                required
              />
            </div>
            <div>
              <Label htmlFor="create-role">Role</Label>
              <Select
                id="create-role"
                value={createState.role}
                onChange={(event) =>
                  setCreateState((prev) => ({
                    ...prev,
                    role: event.target.value as CreateState["role"],
                  }))
                }
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="create-plan">Initial Plan (optional)</Label>
              <Select
                id="create-plan"
                value={createState.planCode}
                onChange={(event) => setCreateState((prev) => ({ ...prev, planCode: event.target.value }))}
              >
                <option value="">None</option>
                {(plansQuery.data ?? []).map((plan) => (
                  <option key={plan.code} value={plan.code}>
                    {plan.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="create-password">Initial Password (optional)</Label>
              <Input
                id="create-password"
                type="password"
                value={createState.password}
                onChange={(event) => setCreateState((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="Secure password"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-200">
              <Checkbox
                checked={createState.sendVerification}
                onCheckedChange={(value) =>
                  setCreateState((prev) => ({ ...prev, sendVerification: Boolean(value) }))
                }
              />
              Send verification email
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateState((prev) => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                createUserMutation.mutate({
                  name: createState.name || undefined,
                  email: createState.email,
                  password: createState.password || undefined,
                  role: createState.role,
                  planCode: createState.planCode || undefined,
                  sendVerification: createState.sendVerification,
                })
              }
              disabled={!createState.email || createUserMutation.isPending}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editState.open} onOpenChange={(open) => setEditState((prev) => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update the name or role for this account.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editState.name}
                onChange={(event) => setEditState((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-role">Role</Label>
              <Select
                id="edit-role"
                value={editState.role}
                onChange={(event) =>
                  setEditState((prev) => ({
                    ...prev,
                    role: event.target.value as EditState["role"],
                  }))
                }
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditState((prev) => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                editState.user &&
                updateUserMutation.mutate({
                  id: editState.user.id,
                  name: editState.name || undefined,
                  role: editState.role,
                })
              }
              disabled={!editState.user || updateUserMutation.isPending}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      <Dialog open={Boolean(confirmAction)} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.type === "delete" && "Delete User"}
              {confirmAction?.type === "block" && "Block User"}
              {confirmAction?.type === "unblock" && "Unblock User"}
              {confirmAction?.type === "cancel" && "Cancel Subscription"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.type === "delete" && "This will permanently delete the user account and all associated data."}
              {confirmAction?.type === "block" && "Blocked users cannot sign in or access the API."}
              {confirmAction?.type === "unblock" && "Restore access for this account."}
              {confirmAction?.type === "cancel" && "Manage Stripe cancellation settings."}
            </DialogDescription>
          </DialogHeader>
          {confirmAction?.type === "block" && (
            <div>
              <Label htmlFor="block-reason">Reason</Label>
              <Input
                id="block-reason"
                value={blockReason}
                onChange={(event) => setBlockReason(event.target.value)}
                placeholder="Reason for blocking"
              />
            </div>
          )}
          {confirmAction?.type === "cancel" && (
            <label className="flex items-center gap-2 text-sm text-slate-200">
              <Checkbox
                checked={cancelAtPeriodEnd}
                onCheckedChange={(value) => setCancelAtPeriodEnd(Boolean(value))}
              />
              Cancel at period end (recommended)
            </label>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>
              Back
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={
                (confirmAction?.type === "block" && !blockReason)
              }
              variant="default"
              className={confirmAction?.type === "delete" ? "bg-red-600 hover:bg-red-700 text-white" : ""}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
>>>>>>> ce3d2c1 (ui change the user page in admin dashboard)
