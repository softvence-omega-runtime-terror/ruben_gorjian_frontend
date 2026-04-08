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
} from "@tanstack/react-table";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { getPlanByLookupKey } from "@/lib/pricing-catalog";
import { PLAN_NAMES, MONTHLY_PRICES, type PlanKey } from "@/lib/pricing-comparison";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  Tag, 
  Plus, 
  MoreHorizontal, 
  Trash2, 
  Power, 
  PowerOff, 
  Eye, 
  Calendar,
  Percent,
  DollarSign,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Select } from "@/components/ui/select";

// --- Types ---

type Coupon = {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxUses: number;
  usedCount: number;
  maxUsesPerClient: number;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED";
  description: string;
  expiresAt: string;
  applicablePlans: string[];
  createdAt: string;
  updatedAt: string;
  totalUsages: number;
};

type CouponsResponse = {
  success: boolean;
  coupons: Coupon[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

type CreateCouponPayload = {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxUses: number;
  maxUsesPerClient: number;
  description: string;
  expiresAt: string;
  applicablePlans: string[];
};

// --- Page Component ---

export default function AdminCouponsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Form State
  const [formData, setFormData] = useState<CreateCouponPayload>({
    code: "",
    discountType: "percentage",
    discountValue: 0,
    maxUses: 100,
    maxUsesPerClient: 1,
    description: "",
    expiresAt: format(new Date(new Date().getFullYear() + 1, 11, 31), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
    applicablePlans: ["FM-70", "FMP-35", "FMP-20"],
  });

  // --- Queries ---

  const { data, isLoading } = useQuery({
    queryKey: ["admin-coupons", page],
    queryFn: () => apiGet<CouponsResponse>(`/api/admin/coupons?page=${page}&limit=20`),
  });

  // --- Mutations ---

  const createMutation = useMutation({
    mutationFn: (payload: CreateCouponPayload) => apiPost<any, CreateCouponPayload>("/api/admin/coupons", payload),
    onSuccess: () => {
      toast({ title: "Coupon created successfully" });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      resetForm();
    },
    onError: (err: any) => {
      toast({ title: "Error creating coupon", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: Partial<CreateCouponPayload> }) => 
      apiPatch<any, Partial<CreateCouponPayload>>(`/api/admin/coupons/${payload.id}`, payload.data),
    onSuccess: () => {
      toast({ title: "Coupon updated successfully" });
      setEditingCoupon(null);
      setIsCreateDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
    onError: (err: any) => {
      toast({ title: "Error updating coupon", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete<any>(`/api/admin/coupons/${id}`),
    onSuccess: () => {
      toast({ title: "Coupon deleted successfully" });
      setIsDeleteDialogOpen(false);
      setCouponToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
    onError: (err: any) => {
      toast({ title: "Error deleting coupon", description: err.message, variant: "destructive" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (payload: { id: string; status: string }) => 
      apiPost<any, { status: string }>(`/api/admin/coupons/${payload.id}/status`, { status: payload.status }),
    onSuccess: () => {
      toast({ title: "Status updated" });
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
  });

  // --- Helpers ---

  const resetForm = () => {
    setFormData({
      code: "",
      discountType: "percentage",
      discountValue: 0,
      maxUses: 100,
      maxUsesPerClient: 1,
      description: "",
      expiresAt: format(new Date(new Date().getFullYear() + 1, 11, 31), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
      applicablePlans: ["FM-70", "FMP-35", "FMP-20"],
    });
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxUses: coupon.maxUses,
      maxUsesPerClient: coupon.maxUsesPerClient,
      description: coupon.description,
      expiresAt: coupon.expiresAt,
      applicablePlans: coupon.applicablePlans,
    });
    setIsCreateDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCoupon) {
      updateMutation.mutate({ id: editingCoupon.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // --- Table Columns ---

  const columns: ColumnDef<Coupon>[] = [
    {
      accessorKey: "code",
      header: "Coupon Code",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-sm bg-slate-800 text-lime-400 border-lime-400/20 px-2 py-1">
            {row.original.code}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "discount",
      header: "Discount",
      cell: ({ row }) => {
        const c = row.original;
        return (
          <div className="flex items-center gap-1 font-medium text-white">
            {c.discountType === "percentage" ? (
              <><Percent className="h-3 w-3 text-slate-400" /> {c.discountValue}%</>
            ) : (
              <><DollarSign className="h-3 w-3 text-slate-400" /> ${c.discountValue}</>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "usage",
      header: "Usage",
      cell: ({ row }) => {
        const c = row.original;
        const percent = (c.usedCount / c.maxUses) * 100;
        return (
          <div className="space-y-1 w-32">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>{c.usedCount} / {c.maxUses}</span>
              <span>{Math.round(percent)}%</span>
            </div>
            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all",
                  percent > 90 ? "bg-red-500" : percent > 70 ? "bg-amber-500" : "bg-lime-500"
                )}
                style={{ width: `${Math.min(100, percent)}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge 
            className={cn(
              "capitalize",
              status === "ACTIVE" ? "bg-lime-500/10 text-lime-400 border-lime-400/20" : 
              status === "INACTIVE" ? "bg-slate-500/10 text-slate-400 border-slate-400/20" : 
              "bg-red-500/10 text-red-400 border-red-500/20"
            )}
            variant="outline"
          >
            {status.toLowerCase()}
          </Badge>
        );
      },
    },
    {
      accessorKey: "expiresAt",
      header: "Expires",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Calendar className="h-3 w-3" />
          {format(new Date(row.original.expiresAt), "MMM d, yyyy")}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const coupon = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-slate-800 text-slate-200">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.push(`/admin/coupons/${coupon.id}/usages`)}>
                <Eye className="mr-2 h-4 w-4" /> View Usages
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(coupon)}>
                <Tag className="mr-2 h-4 w-4" /> Edit Coupon
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => statusMutation.mutate({ 
                  id: coupon.id, 
                  status: coupon.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" 
                })}
                className={coupon.status === "ACTIVE" ? "text-amber-400" : "text-lime-400"}
              >
                {coupon.status === "ACTIVE" ? (
                  <><PowerOff className="mr-2 h-4 w-4" /> Deactivate</>
                ) : (
                  <><Power className="mr-2 h-4 w-4" /> Activate</>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setCouponToDelete(coupon);
                  setIsDeleteDialogOpen(true);
                }}
                className="text-red-400 focus:text-red-400"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: data?.coupons || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Tag className="h-6 w-6 text-lime-400" />
            Coupon Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Create and manage discount codes for your subscription plans.
          </p>
        </div>
        <Button 
          onClick={() => {
            resetForm();
            setEditingCoupon(null);
            setIsCreateDialogOpen(true);
          }}
          className="bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-400 hover:to-emerald-400 text-slate-950 font-bold gap-2 px-6 shadow-[0_0_20px_rgba(132,204,22,0.3)] transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="h-5 w-5" /> Create Coupon
        </Button>
      </div>

      {/* Coupons Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-lime-400" />
            <p className="text-slate-500 text-sm">Loading coupons...</p>
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
                {table.getRowModel().rows?.length ? (
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
                      No coupons found.
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

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">
              {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingCoupon 
                ? "Update the coupon details below." 
                : "Fill in the details to create a new discount code."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="code" className="text-slate-300">Coupon Code</Label>
                <Input 
                  id="code"
                  placeholder="e.g. SUMMER26"
                  className="bg-slate-950 border-slate-800 text-white focus:ring-lime-500 uppercase"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type" className="text-slate-300">Discount Type</Label>
                <Select 
                  id="type"
                  value={formData.discountType} 
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value as "percentage" | "fixed" })}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value" className="text-slate-300">Value</Label>
                <Input 
                  id="value"
                  type="number"
                  className="bg-slate-950 border-slate-800 text-white focus:ring-lime-500"
                  value={formData.discountValue === 0 ? "" : formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value === "" ? 0 : Number(e.target.value) })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUses" className="text-slate-300">Max Uses (Total)</Label>
                <Input 
                  id="maxUses"
                  type="number"
                  className="bg-slate-950 border-slate-800 text-white focus:ring-lime-500"
                  value={formData.maxUses === 0 ? "" : formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value === "" ? 0 : Number(e.target.value) })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxPerClient" className="text-slate-300">Max Per Client</Label>
                <Input 
                  id="maxPerClient"
                  type="number"
                  className="bg-slate-950 border-slate-800 text-white focus:ring-lime-500"
                  value={formData.maxUsesPerClient === 0 ? "" : formData.maxUsesPerClient}
                  onChange={(e) => setFormData({ ...formData, maxUsesPerClient: e.target.value === "" ? 0 : Number(e.target.value) })}
                  required
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="expiry" className="text-slate-300">Expiry Date</Label>
                <Input 
                  id="expiry"
                  type="datetime-local"
                  className="bg-slate-950 border-slate-800 text-white focus:ring-lime-500"
                  // Helper: Convert ISO string to YYYY-MM-DDTHH:MM for datetime-local input
                  value={formData.expiresAt ? new Date(formData.expiresAt).toLocaleString('sv-SE').replace(' ', 'T').slice(0, 16) : ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) {
                      // Save back as UTC ISO string
                      setFormData({ ...formData, expiresAt: new Date(val).toISOString() });
                    }
                  }}
                  required
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="desc" className="text-slate-300">Description</Label>
                <Input 
                  id="desc"
                  placeholder="e.g. Summer sale - 10% off"
                  className="bg-slate-950 border-slate-800 text-white focus:ring-lime-500"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-3 col-span-2 pt-2">
                <Label className="text-slate-300">Applicable Plans</Label>
                <div className="flex flex-wrap gap-4 mt-1">
                  {["FM-70", "FMP-35", "FMP-20"].map((plan) => (
                    <div key={plan} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`plan-${plan}`} 
                        checked={formData.applicablePlans.includes(plan)}
                        onCheckedChange={(checked: boolean) => {
                          const newPlans = checked 
                            ? [...formData.applicablePlans, plan]
                            : formData.applicablePlans.filter(p => p !== plan);
                          setFormData({ ...formData, applicablePlans: newPlans });
                        }}
                        className="border-slate-700 data-[state=checked]:bg-lime-500"
                      />
                      <label 
                        htmlFor={`plan-${plan}`}
                        className="text-sm font-medium leading-none text-slate-300 cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {plan}
                      </label>
                    </div>
                  ))}
                </div>
                {formData.applicablePlans.length === 0 && (
                  <p className="text-[10px] text-amber-400">At least one plan must be selected.</p>
                )}
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
                className="border-slate-800 bg-transparent text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-400 hover:to-emerald-400 text-slate-950 font-bold px-8 shadow-[0_0_20px_rgba(132,204,22,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : editingCoupon ? (
                  <Tag className="mr-2 h-4 w-4" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {editingCoupon ? "Save Changes" : "Confirm Creation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Coupon</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to delete coupon <span className="text-white font-bold">{couponToDelete?.code}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="border-slate-800 bg-transparent text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => couponToDelete && deleteMutation.mutate(couponToDelete.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Coupon
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
} from "@tanstack/react-table";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { getPlanByLookupKey } from "@/lib/pricing-catalog";
import { PLAN_NAMES, MONTHLY_PRICES, type PlanKey } from "@/lib/pricing-comparison";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  Tag, 
  Plus, 
  MoreHorizontal, 
  Trash2, 
  Power, 
  PowerOff, 
  Eye, 
  Calendar,
  Percent,
  DollarSign,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Select } from "@/components/ui/select";

// --- Types ---

type Coupon = {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxUses: number;
  usedCount: number;
  maxUsesPerClient: number;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED";
  description: string;
  expiresAt: string;
  applicablePlans: string[];
  createdAt: string;
  updatedAt: string;
  totalUsages: number;
};

type CouponsResponse = {
  success: boolean;
  coupons: Coupon[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

type CreateCouponPayload = {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxUses: number;
  maxUsesPerClient: number;
  description: string;
  expiresAt: string;
  applicablePlans: string[];
};

// --- Page Component ---

export default function AdminCouponsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Form State
  const [formData, setFormData] = useState<CreateCouponPayload>({
    code: "",
    discountType: "percentage",
    discountValue: 0,
    maxUses: 100,
    maxUsesPerClient: 1,
    description: "",
    expiresAt: format(new Date(new Date().getFullYear() + 1, 11, 31), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
    applicablePlans: ["FM-70", "FMP-35", "FMP-20"],
  });

  // --- Queries ---

  const { data, isLoading } = useQuery({
    queryKey: ["admin-coupons", page],
    queryFn: () => apiGet<CouponsResponse>(`/api/admin/coupons?page=${page}&limit=20`),
  });

  // --- Mutations ---

  const createMutation = useMutation({
    mutationFn: (payload: CreateCouponPayload) => apiPost<any, CreateCouponPayload>("/api/admin/coupons", payload),
    onSuccess: () => {
      toast({ title: "Coupon created successfully" });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      resetForm();
    },
    onError: (err: any) => {
      toast({ title: "Error creating coupon", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: Partial<CreateCouponPayload> }) => 
      apiPatch<any, Partial<CreateCouponPayload>>(`/api/admin/coupons/${payload.id}`, payload.data),
    onSuccess: () => {
      toast({ title: "Coupon updated successfully" });
      setEditingCoupon(null);
      setIsCreateDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
    onError: (err: any) => {
      toast({ title: "Error updating coupon", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete<any>(`/api/admin/coupons/${id}`),
    onSuccess: () => {
      toast({ title: "Coupon deleted successfully" });
      setIsDeleteDialogOpen(false);
      setCouponToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
    onError: (err: any) => {
      toast({ title: "Error deleting coupon", description: err.message, variant: "destructive" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (payload: { id: string; status: string }) => 
      apiPost<any, { status: string }>(`/api/admin/coupons/${payload.id}/status`, { status: payload.status }),
    onSuccess: () => {
      toast({ title: "Status updated" });
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
  });

  // --- Helpers ---

  const resetForm = () => {
    setFormData({
      code: "",
      discountType: "percentage",
      discountValue: 0,
      maxUses: 100,
      maxUsesPerClient: 1,
      description: "",
      expiresAt: format(new Date(new Date().getFullYear() + 1, 11, 31), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
      applicablePlans: ["FM-70", "FMP-35", "FMP-20"],
    });
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxUses: coupon.maxUses,
      maxUsesPerClient: coupon.maxUsesPerClient,
      description: coupon.description,
      expiresAt: coupon.expiresAt,
      applicablePlans: coupon.applicablePlans,
    });
    setIsCreateDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCoupon) {
      updateMutation.mutate({ id: editingCoupon.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // --- Table Columns ---

  const columns: ColumnDef<Coupon>[] = [
    {
      accessorKey: "code",
      header: "Coupon Code",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-sm bg-slate-800 text-lime-400 border-lime-400/20 px-2 py-1">
            {row.original.code}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "discount",
      header: "Discount",
      cell: ({ row }) => {
        const c = row.original;
        return (
          <div className="flex items-center gap-1 font-medium text-white">
            {c.discountType === "percentage" ? (
              <><Percent className="h-3 w-3 text-slate-400" /> {c.discountValue}%</>
            ) : (
              <><DollarSign className="h-3 w-3 text-slate-400" /> ${c.discountValue}</>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "usage",
      header: "Usage",
      cell: ({ row }) => {
        const c = row.original;
        const percent = (c.usedCount / c.maxUses) * 100;
        return (
          <div className="space-y-1 w-32">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>{c.usedCount} / {c.maxUses}</span>
              <span>{Math.round(percent)}%</span>
            </div>
            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all",
                  percent > 90 ? "bg-red-500" : percent > 70 ? "bg-amber-500" : "bg-lime-500"
                )}
                style={{ width: `${Math.min(100, percent)}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge 
            className={cn(
              "capitalize",
              status === "ACTIVE" ? "bg-lime-500/10 text-lime-400 border-lime-400/20" : 
              status === "INACTIVE" ? "bg-slate-500/10 text-slate-400 border-slate-400/20" : 
              "bg-red-500/10 text-red-400 border-red-500/20"
            )}
            variant="outline"
          >
            {status.toLowerCase()}
          </Badge>
        );
      },
    },
    {
      accessorKey: "expiresAt",
      header: "Expires",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Calendar className="h-3 w-3" />
          {format(new Date(row.original.expiresAt), "MMM d, yyyy")}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const coupon = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-slate-800 text-slate-200">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.push(`/admin/coupons/${coupon.id}/usages`)}>
                <Eye className="mr-2 h-4 w-4" /> View Usages
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(coupon)}>
                <Tag className="mr-2 h-4 w-4" /> Edit Coupon
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => statusMutation.mutate({ 
                  id: coupon.id, 
                  status: coupon.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" 
                })}
                className={coupon.status === "ACTIVE" ? "text-amber-400" : "text-lime-400"}
              >
                {coupon.status === "ACTIVE" ? (
                  <><PowerOff className="mr-2 h-4 w-4" /> Deactivate</>
                ) : (
                  <><Power className="mr-2 h-4 w-4" /> Activate</>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setCouponToDelete(coupon);
                  setIsDeleteDialogOpen(true);
                }}
                className="text-red-400 focus:text-red-400"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: data?.coupons || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Tag className="h-6 w-6 text-lime-400" />
            Coupon Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Create and manage discount codes for your subscription plans.
          </p>
        </div>
        <Button 
          onClick={() => {
            resetForm();
            setEditingCoupon(null);
            setIsCreateDialogOpen(true);
          }}
          className="bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-400 hover:to-emerald-400 text-slate-950 font-bold gap-2 px-6 shadow-[0_0_20px_rgba(132,204,22,0.3)] transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="h-5 w-5" /> Create Coupon
        </Button>
      </div>

      {/* Coupons Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-lime-400" />
            <p className="text-slate-500 text-sm">Loading coupons...</p>
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
                {table.getRowModel().rows?.length ? (
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
                      No coupons found.
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

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">
              {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingCoupon 
                ? "Update the coupon details below." 
                : "Fill in the details to create a new discount code."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="code" className="text-slate-300">Coupon Code</Label>
                <Input 
                  id="code"
                  placeholder="e.g. SUMMER26"
                  className="bg-slate-950 border-slate-800 text-white focus:ring-lime-500 uppercase"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type" className="text-slate-300">Discount Type</Label>
                <Select 
                  id="type"
                  value={formData.discountType} 
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value as "percentage" | "fixed" })}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value" className="text-slate-300">Value</Label>
                <Input 
                  id="value"
                  type="number"
                  className="bg-slate-950 border-slate-800 text-white focus:ring-lime-500"
                  value={formData.discountValue === 0 ? "" : formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value === "" ? 0 : Number(e.target.value) })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUses" className="text-slate-300">Max Uses (Total)</Label>
                <Input 
                  id="maxUses"
                  type="number"
                  className="bg-slate-950 border-slate-800 text-white focus:ring-lime-500"
                  value={formData.maxUses === 0 ? "" : formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value === "" ? 0 : Number(e.target.value) })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxPerClient" className="text-slate-300">Max Per Client</Label>
                <Input 
                  id="maxPerClient"
                  type="number"
                  className="bg-slate-950 border-slate-800 text-white focus:ring-lime-500"
                  value={formData.maxUsesPerClient === 0 ? "" : formData.maxUsesPerClient}
                  onChange={(e) => setFormData({ ...formData, maxUsesPerClient: e.target.value === "" ? 0 : Number(e.target.value) })}
                  required
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="expiry" className="text-slate-300">Expiry Date</Label>
                <Input 
                  id="expiry"
                  type="datetime-local"
                  className="bg-slate-950 border-slate-800 text-white focus:ring-lime-500"
                  // Helper: Convert ISO string to YYYY-MM-DDTHH:MM for datetime-local input
                  value={formData.expiresAt ? new Date(formData.expiresAt).toLocaleString('sv-SE').replace(' ', 'T').slice(0, 16) : ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) {
                      // Save back as UTC ISO string
                      setFormData({ ...formData, expiresAt: new Date(val).toISOString() });
                    }
                  }}
                  required
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="desc" className="text-slate-300">Description</Label>
                <Input 
                  id="desc"
                  placeholder="e.g. Summer sale - 10% off"
                  className="bg-slate-950 border-slate-800 text-white focus:ring-lime-500"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-3 col-span-2 pt-2">
                <Label className="text-slate-300">Applicable Plans</Label>
                <div className="flex flex-wrap gap-4 mt-1">
                  {["FM-70", "FMP-35", "FMP-20"].map((plan) => (
                    <div key={plan} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`plan-${plan}`} 
                        checked={formData.applicablePlans.includes(plan)}
                        onCheckedChange={(checked: boolean) => {
                          const newPlans = checked 
                            ? [...formData.applicablePlans, plan]
                            : formData.applicablePlans.filter(p => p !== plan);
                          setFormData({ ...formData, applicablePlans: newPlans });
                        }}
                        className="border-slate-700 data-[state=checked]:bg-lime-500"
                      />
                      <label 
                        htmlFor={`plan-${plan}`}
                        className="text-sm font-medium leading-none text-slate-300 cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {plan}
                      </label>
                    </div>
                  ))}
                </div>
                {formData.applicablePlans.length === 0 && (
                  <p className="text-[10px] text-amber-400">At least one plan must be selected.</p>
                )}
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
                className="border-slate-800 bg-transparent text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-400 hover:to-emerald-400 text-slate-950 font-bold px-8 shadow-[0_0_20px_rgba(132,204,22,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : editingCoupon ? (
                  <Tag className="mr-2 h-4 w-4" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {editingCoupon ? "Save Changes" : "Confirm Creation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Coupon</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to delete coupon <span className="text-white font-bold">{couponToDelete?.code}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="border-slate-800 bg-transparent text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => couponToDelete && deleteMutation.mutate(couponToDelete.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Coupon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
>>>>>>> d562463 (remove the search filed and set the path)
