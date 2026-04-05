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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, 
  Plus, 
  MoreHorizontal, 
  Trash2, 
  UserPlus,
  Key,
  Mail,
  User,
  Shield,
  Loader2,
  ChevronLeft,
  ChevronRight,
  UserX,
  UserCheck,
  Search,
  Filter,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// --- Constants ---

const PERMISSIONS = [
  "OVERVIEW",
  "USER_MANAGE",
  "SUBSCRIPTION_MANAGE",
  "SCHEDULE_MANAGE",
  "POST_MANAGE",
  "COUPON_MANAGE",
  "VIRTUAL_ADMIN_MANAGE",
  "PROFILE"
];

const ROLES = ["ADMIN", "SUPER_ADMIN"];

// --- Types ---

type AdminItem = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: "ACTIVE" | "BLOCKED";
  createdAt: string;
  updatedAt: string;
  permissions: string[];
};

type AdminsResponse = {
  items: AdminItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type CreateAdminPayload = {
  name: string;
  email: string;
  password?: string;
  role: string;
  permissions: string[];
};

export default function AdminManagementPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useMemo(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); 
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAdminDetailsOpen, setIsAdminDetailsOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<AdminItem | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminItem | null>(null);
  const [editingAdmin, setEditingAdmin] = useState<AdminItem | null>(null);

  const [formData, setFormData] = useState<CreateAdminPayload>({
    name: "",
    email: "",
    password: "",
    role: "ADMIN",
    permissions: [],
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-virtual-admins", page, statusFilter, debouncedSearch],
    queryFn: () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (debouncedSearch) params.append("search", debouncedSearch);
      return apiGet<AdminsResponse>(`/api/admin/virtual-admins?${params.toString()}`);
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateAdminPayload) => apiPost<any, CreateAdminPayload>("/api/admin/virtual-admins", payload),
    onSuccess: () => {
      toast({ 
        title: "Admin Onboarded", 
        description: `Successfully created account for ${formData.email}`
      });
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-virtual-admins"] });
      resetForm();
    },
    onError: (err: any) => {
      toast({ 
        title: "Onboarding Failed", 
        description: err.message || "Unable to create administrator account.", 
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: Partial<CreateAdminPayload> }) => {
      const updateData = {
        name: payload.data.name,
        role: payload.data.role,
        replacePermissions: payload.data.permissions
      };
      return apiPatch<any, any>(`/api/admin/virtual-admins/${payload.id}`, updateData);
    },
    onSuccess: () => {
      toast({ 
        title: "Profile Updated", 
        description: "Administrative permissions and role have been saved."
      });
      setEditingAdmin(null);
      setIsDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-virtual-admins"] });
    },
    onError: (err: any) => {
      toast({ 
        title: "Update Failed", 
        description: err.message || "Failed to save profile changes.", 
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete<any>(`/api/admin/virtual-admins/${id}`),
    onSuccess: () => {
      toast({ 
        title: "Access Revoked", 
        description: "Admin account has been permanently removed.",
        variant: "destructive"
      });
      setIsDialogOpen(false);
      setAdminToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["admin-virtual-admins"] });
    },
    onError: (err: any) => {
      toast({ 
        title: "Deletion Failed", 
        description: err.message || "Unable to revoke administrative access.", 
        variant: "destructive" 
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (payload: { id: string; status: string }) => 
      apiPatch<any, { status: string }>(`/api/admin/virtual-admins/${payload.id}/status`, { status: payload.status }),
    onSuccess: (_, variables) => {
      const isBlocked = variables.status === "BLOCKED";
      toast({ 
        title: isBlocked ? "Admin Blocked" : "Admin Activated", 
        description: `Personnel status changed to ${variables.status.toLowerCase()}.`
      });
      queryClient.invalidateQueries({ queryKey: ["admin-virtual-admins"] });
    },
    onError: (err: any) => {
      toast({ 
        title: "Status Update Failed", 
        description: err.message || "Could not change administrator status.", 
        variant: "destructive" 
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "ADMIN",
      permissions: [],
    });
  };

  const handleEdit = (admin: AdminItem) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name || "",
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions || [],
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAdmin) {
      updateMutation.mutate({ id: editingAdmin.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const togglePermission = (perm: string) => {
    setFormData(prev => {
      const has = prev.permissions.includes(perm);
      if (has) {
        return { ...prev, permissions: prev.permissions.filter(p => p !== perm) };
      } else {
        return { ...prev, permissions: [...prev.permissions, perm] };
      }
    });
  };

  const columns: ColumnDef<AdminItem>[] = [
    {
      accessorKey: "admin",
      header: "Admin Information",
      cell: ({ row }) => {
        const admin = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-lime-400 font-bold overflow-hidden">
              {admin.name ? admin.name.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">{admin.name || "N/A"}</span>
              <span className="text-xs text-slate-500">{admin.email}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.original.role;
        return (
          <Badge 
            variant="outline" 
            className={cn(
              "font-bold tracking-wider",
              role === "SUPER_ADMIN" ? "bg-purple-500/20 text-purple-300 border-purple-500/40" : "bg-sky-500/20 text-sky-300 border-sky-500/40"
            )}
          >
            {role.replace("_", " ")}
          </Badge>
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
      accessorKey: "createdAt",
      header: "Created On",
      cell: ({ row }) => (
        <div className="text-xs text-slate-400">
          {format(new Date(row.original.createdAt), "MMM d, yyyy")}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const admin = row.original;
        return (
          <div className="flex items-center gap-2">
            {/* <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 border-slate-800 text-slate-400 hover:text-lime-400 hover:border-lime-400/50"
              onClick={() => {
                setSelectedAdmin(admin);
                setIsAdminDetailsOpen(true);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button> */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-slate-900 border-slate-800 text-slate-200 shadow-2xl">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => {
                  setSelectedAdmin(admin);
                  setIsAdminDetailsOpen(true);
                }}>
                  <Eye className="mr-2 h-4 w-4" /> View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEdit(admin)}>
                  <User className="mr-2 h-4 w-4" /> Edit Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => statusMutation.mutate({
                    id: admin.id,
                    status: admin.status === "ACTIVE" ? "BLOCKED" : "ACTIVE"
                  })}
                  className={admin.status === "ACTIVE" ? "text-amber-400" : "text-lime-400"}
                >
                  {admin.status === "ACTIVE" ? (
                    <><UserX className="mr-2 h-4 w-4" /> Block Admin</>
                  ) : (
                    <><UserCheck className="mr-2 h-4 w-4" /> Activate Admin</>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setAdminToDelete(admin);
                    setIsDeleteDialogOpen(true);
                  }}
                  className="text-red-400 focus:text-red-400"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete admin
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: data?.items || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
            <ShieldCheck className="h-8 w-8 text-lime-400" />
            Admin Management
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-medium">
            Manage your team, roles, and fine-grained access permissions.
          </p>
        </div>
        <Button 
          onClick={() => {
            resetForm();
            setEditingAdmin(null);
            setIsDialogOpen(true);
          }}
          className="bg-lime-400 hover:bg-lime-300 text-slate-950 font-black gap-2 px-8 py-6 rounded-2xl shadow-[0_15px_30px_rgba(163,230,53,0.3)] transition-all hover:scale-[1.05] active:scale-95 text-base"
        >
          <UserPlus className="h-5 w-5" /> Add New Admin
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 group-focus-within:text-lime-400 transition-colors" />
          <Input 
            placeholder="Search admins by name or email..." 
            className="pl-10 h-12 bg-slate-900/50 border-slate-800 text-white rounded-xl focus:ring-lime-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500 hidden sm:block" />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-12 w-40 bg-slate-900 border-slate-800 text-white rounded-xl px-3 outline-none focus:ring-1 focus:ring-lime-400"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/30 overflow-hidden backdrop-blur-sm">
        {isLoading ? (
          <div className="flex h-80 flex-col items-center justify-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-lime-400" />
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Loading Personnel...</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader className="bg-slate-800/30">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent border-slate-800">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="text-slate-500 font-bold uppercase tracking-widest text-[10px] py-5">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="border-slate-800 hover:bg-slate-800/20 transition-all group">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-5 font-medium group-hover:text-white transition-colors">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-40 text-center text-slate-500 font-medium">
                      No matching administrators found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {data?.totalPages && data.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-6 border-t border-slate-800 bg-slate-950/20">
                <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                  Showing page {data.page} of {data.totalPages}
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-lg border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition-all"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-lg border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition-all"
                    disabled={page === data.totalPages}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-slate-950 border-slate-800 text-slate-200 rounded-3xl overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-lime-400 shadow-[0_0_15px_rgba(163,230,53,0.5)]" />
          <DialogHeader className="pt-6 px-6 pb-2">
            <DialogTitle className="text-2xl font-black text-white tracking-tight">
              {editingAdmin ? "Edit Administrator" : "Onboard New Admin"}
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium text-sm">
              {editingAdmin 
                ? "Update security roles and access permissions for this admin." 
                : "Create a new administrative user with specific access controls."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 p-6 overflow-y-auto max-h-[70vh]">
            <div className="grid gap-6">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Identity Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                      <User className="h-3 w-3" /> Full Name
                    </Label>
                    <Input 
                      placeholder="e.g. John Doe"
                      className="bg-slate-900 border-slate-800 text-white rounded-xl h-11 focus:ring-lime-400"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                      <Mail className="h-3 w-3" /> Email Address
                    </Label>
                    <Input 
                      type="email"
                      placeholder="email@talexia.ai"
                      className="bg-slate-900 border-slate-800 text-white rounded-xl h-11 focus:ring-lime-400"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      disabled={!!editingAdmin}
                    />
                  </div>
                </div>
                
                {!editingAdmin && (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                      <Key className="h-3 w-3" /> Temporary Password
                    </Label>
                    <Input 
                      type="password"
                      placeholder="Minimum 8 characters"
                      className="bg-slate-900 border-slate-800 text-white rounded-xl h-11 focus:ring-lime-400"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Role & Authority</h4>
                <div className="grid grid-cols-2 gap-4">
                  {ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setFormData({...formData, role})}
                      className={cn(
                        "p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all group",
                        formData.role === role 
                          ? "bg-lime-400/10 border-lime-400 shadow-[0_0_15px_rgba(163,230,53,0.1)]" 
                          : "bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50"
                      )}
                    >
                      <Shield className={cn("h-6 w-6 transition-colors", formData.role === role ? "text-lime-400" : "text-slate-600 group-hover:text-slate-400")} />
                      <span className={cn("text-xs font-black uppercase tracking-widest", formData.role === role ? "text-lime-400" : "text-slate-500")}>
                        {role.replace("_", " ")}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 bg-slate-900/50 p-6 rounded-3xl border border-slate-800/60">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Access Permissions</h4>
                  <button 
                    type="button" 
                    onClick={() => setFormData(prev => ({...prev, permissions: prev.permissions.length === PERMISSIONS.length ? [] : [...PERMISSIONS]}))}
                    className="text-[10px] font-bold text-lime-400 hover:underline"
                  >
                    {formData.permissions.length === PERMISSIONS.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                  {PERMISSIONS.map((perm) => (
                    <div key={perm} className="flex items-center space-x-3 group justify-between sm:justify-start">
                      <Checkbox 
                        id={`perm-${perm}`} 
                        checked={formData.permissions.includes(perm)}
                        onCheckedChange={() => togglePermission(perm)}
                        className="h-5 w-5 border-slate-700 data-[state=checked]:bg-lime-500 data-[state=checked]:border-lime-500 shadow-sm"
                      />
                      <label 
                        htmlFor={`perm-${perm}`}
                        className="text-xs font-semibold text-slate-400 cursor-pointer group-hover:text-white transition-colors"
                      >
                        {perm.split("_").map(s => s.charAt(0) + s.slice(1).toLowerCase()).join(" ")}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 flex flex-col-reverse sm:flex-row gap-3">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsDialogOpen(false)}
                className="text-slate-500 hover:text-white hover:bg-slate-900 rounded-xl"
              >
                Dismiss
              </Button>
              <Button 
                type="submit" 
                className="bg-lime-400 hover:bg-lime-300 text-slate-950 font-black px-10 h-12 rounded-xl shadow-[0_10px_20px_rgba(163,230,53,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserCheck className="mr-2 h-4 w-4" />
                )}
                {editingAdmin ? "Save Account Changes" : "Confirm Onboarding"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAdminDetailsOpen} onOpenChange={setIsAdminDetailsOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-950 border-slate-800 text-slate-200 rounded-3xl overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-lime-400" />
          <DialogHeader className="pt-6 px-6">
            <DialogTitle className="text-xl font-black text-white tracking-tight flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-lime-400" />
              Administrator Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedAdmin && (
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                <div className="h-14 w-14 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-2xl font-black text-lime-400">
                  {selectedAdmin.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedAdmin.name}</h3>
                  <p className="text-sm text-slate-500 font-medium">{selectedAdmin.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Access Level</p>
                  <Badge variant="outline" className="bg-sky-500/10 text-sky-400 border-sky-500/20 px-3 py-1">
                    {selectedAdmin.role}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Current Status</p>
                  <Badge variant="outline" className={cn(
                    "px-3 py-1",
                    selectedAdmin.status === "ACTIVE" ? "bg-lime-500/10 text-lime-400 border-lime-400/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                  )}>
                    {selectedAdmin.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Shield className="h-3 w-3 text-lime-400" /> Active Permissions
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedAdmin.permissions?.map(perm => (
                    <Badge key={perm} variant="secondary" className="bg-slate-900 text-slate-300 border-slate-800 text-[10px]">
                      {perm.split("_").map(s => s.charAt(0) + s.slice(1).toLowerCase()).join(" ")}
                    </Badge>
                  ))}
                  {(!selectedAdmin.permissions || selectedAdmin.permissions.length === 0) && (
                    <p className="text-xs text-slate-600 italic">No special permissions granted.</p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-between text-[10px] text-slate-600 font-mono">
                <span>Created: {format(new Date(selectedAdmin.createdAt), "yyyy-MM-dd HH:mm")}</span>
                <span>Last Updated: {format(new Date(selectedAdmin.updatedAt), "yyyy-MM-dd HH:mm")}</span>
              </div>
            </div>
          )}
          
          <DialogFooter className="bg-slate-900/50 p-4 border-t border-slate-800">
            <Button 
              variant="secondary" 
              onClick={() => setIsAdminDetailsOpen(false)}
              className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 text-white"
            >
              Close Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-slate-950 border-slate-800 text-slate-200 rounded-3xl shadow-2xl">
          <DialogHeader className="pt-4">
            <DialogTitle className="text-xl font-black text-white tracking-tight">Revoke Admin Access</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              Are you sure you want to permanently delete the administrator account for <span className="text-white font-black underline decoration-red-500/50 underline-offset-4">{adminToDelete?.email}</span>? This action is irreversible and will immediately revoke all access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-6 sm:justify-center">
            <Button 
              variant="ghost" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl px-8"
            >
              Keep Access
            </Button>
            <Button 
              variant="destructive" 
              className="bg-red-500 hover:bg-red-400 text-white font-black rounded-xl px-10 shadow-[0_10px_20px_rgba(239,68,68,0.2)]"
              onClick={() => adminToDelete && deleteMutation.mutate(adminToDelete.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Revoke Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
