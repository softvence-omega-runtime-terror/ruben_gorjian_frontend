"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSessionContext } from "@/context/SessionContext";
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminPostComposer } from "@/components/admin/AdminPostComposer";

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
  subscriptions: Array<{
    id: string;
    planCode: string;
    status: string;
    priceType: string;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    canceledAt: string | null;
    createdAt: string;
  }>;
};

type Profile = {
  userId: string;
  fullName: string | null;
  businessName: string | null;
  website: string | null;
  industry: string | null;
  timezone: string | null;
  bio: string | null;
  avatarStorageKey: string | null;
  avatarContentType: string | null;
  createdAt: string;
  updatedAt: string;
};

type BrandProfile = {
  userId: string;
  industry: string | null;
  productTypes: string | null;
  businessType: string | null;
  tone: string | null;
  audience: string | null;
  competitors: string | null;
  ctaPreferences: string | null;
  hashtagPreferences: string | null;
  website: string | null;
  socials: {
    facebook?: string;
    linkedin?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
  } | null;
  fullManagementOnboardingData: {
    industry?: string;
    allowCtas?: string;
    salesModel?: string[];
    websiteUrl?: string;
    facebookUrl?: string;
    linkedinUrl?: string;
    businessName?: string;
    instagramUrl?: string;
    outlineFrame?: string;
    targetAudience?: string[];
    brandPersonality?: string[];
    platformsToManage?: string[];
    imageUsagePermission?: string;
    postingAccessGranted?: string;
    postingTimePreference?: string[];
    visualStylePreference?: string;
    postingFrequencyPreference?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

type AdminUserDetailResponse = {
  user: AdminUser;
  profile: Profile | null;
  brandProfile: BrandProfile | null;
  subscriptions: AdminUser["subscriptions"];
  posts: Array<{
    id: string;
    status: string;
    scheduledFor: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  usageSummary: {
    scheduledPostsCount: number;
    publishedPostsCount: number;
    failedPostsCount: number;
    uploadedMediaCount: number;
    connectedPlatformsCount: number;
    platformLimit: number | null;
  };
};

type ScheduledItem = {
  id: string;
  status: string;
  scheduledFor: string | null;
  caption: string | null;
  createdAt: string;
  updatedAt: string;
  targets: Array<{
    id: string;
    platform: string;
    status: string;
    publishedAt: string | null;
    errorMessage: string | null;
  }>;
};

type ScheduledItemsResponse = {
  items: ScheduledItem[];
  page: number;
  pageSize: number;
  total: number;
};

type Invoice = {
  id: string;
  number: string | null;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  hostedInvoiceUrl: string | null;
};

type AuditLog = {
  id: string;
  actorEmail: string;
  action: string;
  createdAt: string;
  metadata: Record<string, unknown> | null;
};

type ConfirmAction =
  | { type: "delete" }
  | { type: "block" }
  | { type: "unblock" }
  | { type: "cancel" }
  | null;

type TabKey = "overview" | "subscription" | "scheduled" | "post-as-user" | "billing" | "logs";

type PublishingRoutingMode = "FORCE_NATIVE" | "FORCE_UPLOAD_POST";

type PublishingRoutingResponse = {
  mode: PublishingRoutingMode;
  useInstagram: boolean;
  useFacebook: boolean;
  useLinkedin: boolean;
};

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { session, loading: sessionLoading } = useSessionContext();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [blockReason, setBlockReason] = useState("");
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(true);
  const [adminPassword, setAdminPassword] = useState("");
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<"USER" | "ADMIN" | "SUPER_ADMIN">(
    "USER",
  );
  const [scheduledItemsPage, setScheduledItemsPage] = useState(1);
  const [scheduledItemsStatus, setScheduledItemsStatus] = useState("");
  const [routingDraft, setRoutingDraft] = useState<PublishingRoutingResponse | null>(null);

  const isAdmin = session?.role === "ADMIN" || session?.role === "SUPER_ADMIN";

  const userQuery = useQuery({
    queryKey: ["admin-user", params.id],
    queryFn: () =>
      apiGet<AdminUserDetailResponse>(`/api/admin/users/${params.id}`),
    enabled: isAdmin,
  });

  const scheduledItemsQuery = useQuery({
    queryKey: [
      "admin-user",
      params.id,
      "scheduled-items",
      scheduledItemsPage,
      scheduledItemsStatus,
    ],
    queryFn: () => {
      const queryParams = new URLSearchParams();
      queryParams.set("page", String(scheduledItemsPage));
      queryParams.set("pageSize", "10");
      if (scheduledItemsStatus) queryParams.set("status", scheduledItemsStatus);
      return apiGet<ScheduledItemsResponse>(
        `/api/admin/users/${params.id}/scheduled-items?${queryParams.toString()}`,
      );
    },
    enabled: isAdmin && activeTab === "scheduled",
  });

  const routingQuery = useQuery({
    queryKey: ["admin-user", params.id, "publishing-routing"],
    queryFn: () =>
      apiGet<PublishingRoutingResponse>(
        `/api/admin/users/${params.id}/publishing-routing`,
      ),
    enabled: isAdmin,
  });

  useEffect(() => {
    const u = userQuery.data?.user;
    if (u) {
      queueMicrotask(() => {
        setEditName(u.name ?? "");
        setEditRole(u.role);
      });
    }
  }, [userQuery.data?.user]);

  const user = userQuery.data?.user;
  const routingState: PublishingRoutingResponse =
    routingDraft ??
    routingQuery.data ?? {
      mode: "FORCE_NATIVE",
      useInstagram: true,
      useFacebook: true,
      useLinkedin: true,
    };

  const invoicesQuery = useQuery({
    queryKey: ["admin-user", params.id, "invoices"],
    queryFn: () =>
      apiGet<{ items: Invoice[] }>(`/api/admin/users/${params.id}/invoices`),
    enabled: isAdmin && activeTab === "billing",
  });

  const auditLogsQuery = useQuery({
    queryKey: ["admin-user", params.id, "audit-logs"],
    queryFn: () =>
      apiGet<{ items: AuditLog[] }>(`/api/admin/users/${params.id}/audit-logs`),
    enabled: isAdmin && activeTab === "logs",
  });

  const updateUserMutation = useMutation({
    mutationFn: () =>
      apiPatch<AdminUser, { name?: string; role?: string }>(
        `/api/admin/users/${params.id}`,
        {
          name: editName || undefined,
          role: editRole,
        },
      ),
    onSuccess: () => {
      toast({ title: "User updated" });
      queryClient.invalidateQueries({ queryKey: ["admin-user", params.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: Error) => {
      toast({
        title: "Unable to update user",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const blockUserMutation = useMutation({
    mutationFn: () =>
      apiPost<AdminUser, { reason: string }>(
        `/api/admin/users/${params.id}/block`,
        { reason: blockReason },
      ),
    onSuccess: () => {
      toast({ title: "User blocked" });
      setBlockReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-user", params.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: Error) => {
      toast({
        title: "Unable to block user",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const unblockUserMutation = useMutation({
    mutationFn: () =>
      apiPost<AdminUser, Record<string, never>>(
        `/api/admin/users/${params.id}/unblock`,
        {},
      ),
    onSuccess: () => {
      toast({ title: "User unblocked" });
      queryClient.invalidateQueries({ queryKey: ["admin-user", params.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: Error) => {
      toast({
        title: "Unable to unblock user",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const resendVerificationMutation = useMutation({
    mutationFn: () =>
      apiPost<{ success: boolean }, Record<string, never>>(
        `/api/admin/users/${params.id}/resend-verification`,
        {},
      ),
    onSuccess: () => {
      toast({ title: "Verification email resent" });
    },
    onError: (err: Error) => {
      toast({
        title: "Unable to resend verification",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: () =>
      apiPost<{ subscription: unknown }, { cancelAtPeriodEnd: boolean }>(
        `/api/admin/users/${params.id}/cancel-subscription`,
        {
          cancelAtPeriodEnd,
        },
      ),
    onSuccess: () => {
      toast({ title: "Subscription cancellation updated" });
      queryClient.invalidateQueries({ queryKey: ["admin-user", params.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: Error) => {
      toast({
        title: "Unable to cancel subscription",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const refreshSubscriptionMutation = useMutation({
    mutationFn: () =>
      apiPost<{ subscription: unknown }, Record<string, never>>(
        `/api/admin/users/${params.id}/refresh-subscription`,
        {},
      ),
    onSuccess: () => {
      toast({ title: "Subscription refreshed" });
      queryClient.invalidateQueries({ queryKey: ["admin-user", params.id] });
    },
    onError: (err: Error) => {
      toast({
        title: "Unable to refresh subscription",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const updateRoutingMutation = useMutation({
    mutationFn: () =>
      apiPut<PublishingRoutingResponse, PublishingRoutingResponse>(
        `/api/admin/users/${params.id}/publishing-routing`,
        {
          mode: routingState.mode,
          useInstagram: routingState.useInstagram,
          useFacebook: routingState.useFacebook,
          useLinkedin: routingState.useLinkedin,
        },
      ),
    onSuccess: () => {
      toast({ title: "Posting channel updated" });
      setRoutingDraft(null);
      queryClient.invalidateQueries({
        queryKey: ["admin-user", params.id, "publishing-routing"],
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Unable to update posting channel",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: () =>
      apiDelete(`/api/admin/users/${params.id}`),
    onSuccess: () => {
      toast({ title: "User deleted" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      router.push("/admin/users");
    },
    onError: (err: Error) => {
      toast({
        title: "Unable to delete user",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const usageSummary = userQuery.data?.usageSummary;
  const subscription = user?.subscriptions?.[0];
  const scheduledItems = scheduledItemsQuery.data?.items ?? [];
  const scheduledItemsTotal = scheduledItemsQuery.data?.total ?? 0;
  const scheduledItemsTotalPages = Math.max(
    1,
    Math.ceil(scheduledItemsTotal / 10),
  );

  const tabs = useMemo(
    () => [
      { key: "overview", label: "Overview" },
      { key: "subscription", label: "Subscription" },
      { key: "scheduled", label: "Scheduled Items" },
      { key: "post-as-user", label: "Post as User" },
      { key: "billing", label: "Billing" },
      { key: "logs", label: "Admin Actions" },
    ],
    [],
  );

  function formatDate(value?: string | null) {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatDateTime(value?: string | null) {
    if (!value) return "—";
    return new Date(value).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function handleConfirmAction() {
    if (!confirmAction) return;
    if (confirmAction.type === "delete") {
      deleteUserMutation.mutate();
    }
    if (confirmAction.type === "block") {
      blockUserMutation.mutate();
    }
    if (confirmAction.type === "unblock") {
      unblockUserMutation.mutate();
    }
    if (confirmAction.type === "cancel") {
      cancelSubscriptionMutation.mutate();
    }
    setConfirmAction(null);
    setAdminPassword("");
  }

  // Show loading state
  if (sessionLoading || userQuery.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-800 border-t-lime-400"></div>
          <p className="text-sm text-slate-400">Loading user details...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (userQuery.isError || !userQuery.data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-400">Failed to load user details</p>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/users")}
            className="mt-4"
          >
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Button variant="ghost" onClick={() => router.push("/admin/users")}>
            ← Back to Users
          </Button>
          <h1 className="text-2xl font-semibold text-white">
            {user?.name || user?.email || "User"}
          </h1>
          <p className="text-sm text-slate-400">{user?.email}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {user?.isFounder && (
              <Badge className="bg-lime-300/20 text-lime-200 border-lime-300/40">
                Founder
              </Badge>
            )}
            <Badge
              variant={
                user?.status === "ACTIVE"
                  ? "default"
                  : user?.status === "BLOCKED"
                    ? "destructive"
                    : "secondary"
              }
            >
              {user?.status}
            </Badge>
            {subscription && (
              <Badge
                variant={
                  subscription.status === "ACTIVE" ? "default" : "secondary"
                }
              >
                {subscription.status}
              </Badge>
            )}
            <Badge variant="outline">
              Posting Channel:{" "}
              {routingState.mode === "FORCE_UPLOAD_POST" ? "Upload-Post" : "Default"}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {user?.status === "BLOCKED" ? (
            <Button
              variant="outline"
              onClick={() => setConfirmAction({ type: "unblock" })}
            >
              Unblock
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setConfirmAction({ type: "block" })}
            >
              Block
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => resendVerificationMutation.mutate()}
            disabled={user?.emailVerified}
          >
            Resend Verification
          </Button>
          <Button
            variant="outline"
            onClick={() => setConfirmAction({ type: "cancel" })}
            disabled={!subscription}
          >
            Cancel Subscription
          </Button>
          <Button
            variant="outline"
            className="border-red-400/60 text-red-200 hover:bg-red-500/10"
            onClick={() => setConfirmAction({ type: "delete" })}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {usageSummary && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Scheduled Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {usageSummary.scheduledPostsCount}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Published Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {usageSummary.publishedPostsCount}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Failed Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-300">
                {usageSummary.failedPostsCount}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Connected Platforms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {usageSummary.connectedPlatformsCount}
              </div>
              <div className="text-xs text-slate-500">
                Limit: {usageSummary.platformLimit ?? "—"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Platform Limit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {usageSummary.platformLimit ?? "—"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Uploaded Media
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {usageSummary.uploadedMediaCount}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "outline"}
            onClick={() => setActiveTab(tab.key as TabKey)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {userQuery.isLoading ? (
        <Card>
          <CardContent className="py-8 text-center text-slate-400">
            Loading user...
          </CardContent>
        </Card>
      ) : !user ? (
        <Card>
          <CardContent className="py-8 text-center text-slate-400">
            User not found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {activeTab === "overview" && (
            <div className="grid gap-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-slate-300">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-slate-500">Name</span>
                      <span>{user.name ?? "—"}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-slate-500">Status</span>
                      <Badge variant={user.status === "ACTIVE" ? "default" : "destructive"} className="h-5">
                        {user.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-slate-500">Role</span>
                      <Badge variant="outline" className="h-5">{user.role}</Badge>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-slate-500">Email Verified</span>
                      <span>{user.emailVerified ? (
                        <span className="flex items-center gap-1 text-lime-400">
                          Yes <span className="text-[10px] bg-lime-400/20 px-1 rounded">✔</span>
                        </span>
                      ) : "No"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Created At</span>
                      <span>{formatDate(user.createdAt)}</span>
                    </div>
                    {user.blockedReason && (
                      <div className="mt-4 rounded-md border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-200">
                        <span className="font-semibold block mb-1">Block reason:</span>
                        {user.blockedReason}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Update</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Display Name</Label>
                      <Input
                        id="edit-name"
                        value={editName}
                        onChange={(event) => setEditName(event.target.value)}
                        placeholder="Public name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-role">User Role</Label>
                      <Select
                        id="edit-role"
                        value={editRole}
                        onChange={(event) =>
                          setEditRole(event.target.value as typeof editRole)
                        }
                      >
                        <option value="USER">User (Standard)</option>
                        <option value="ADMIN">Admin</option>
                        <option value="SUPER_ADMIN">Super Admin</option>
                      </Select>
                    </div>
                    <Button
                      onClick={() => updateUserMutation.mutate()}
                      disabled={updateUserMutation.isPending}
                      className="w-full"
                    >
                      {updateUserMutation.isPending ? "Updating..." : "Save Changes"}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-slate-300">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-slate-500">Full Name</span>
                      <span>{userQuery.data.profile?.fullName ?? "—"}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-slate-500">Business Name</span>
                      <span>{userQuery.data.profile?.businessName ?? "—"}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-slate-500">Industry</span>
                      <span className="capitalize">{userQuery.data.profile?.industry?.toLowerCase().replace("_", " ") ?? "—"}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-slate-500">Website</span>
                      {userQuery.data.profile?.website ? (
                        <a href={userQuery.data.profile.website} target="_blank" rel="noreferrer" className="text-lime-400 hover:underline">
                          Visit Site ↗
                        </a>
                      ) : "—"}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Timezone</span>
                      <span>{userQuery.data.profile?.timezone ?? "—"}</span>
                    </div>
                    <div className="mt-4">
                      <span className="text-slate-500 block mb-1">Bio</span>
                      <p className="p-3 rounded bg-slate-950/40 border border-white/5 italic text-slate-400">
                        {userQuery.data.profile?.bio ?? "No bio provided."}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Brand Identity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-slate-300">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-slate-500">Target Audience</span>
                      <span>{userQuery.data.brandProfile?.audience ?? "—"}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-slate-500">Tone of Voice</span>
                      <span className="capitalize">{userQuery.data.brandProfile?.tone?.toLowerCase() ?? "—"}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-slate-500">CTA Preferences</span>
                      <span>{userQuery.data.brandProfile?.ctaPreferences ?? "—"}</span>
                    </div>
                    <div className="mt-4">
                      <span className="text-slate-500 block mb-2">Social Profiles</span>
                      <div className="flex flex-wrap gap-2">
                        {userQuery.data.brandProfile?.socials?.facebook && (
                          <Badge variant="secondary"><a href={userQuery.data.brandProfile.socials.facebook} target="_blank" rel="noreferrer">Facebook</a></Badge>
                        )}
                        {userQuery.data.brandProfile?.socials?.instagram && (
                          <Badge variant="secondary"><a href={userQuery.data.brandProfile.socials.instagram} target="_blank" rel="noreferrer">Instagram</a></Badge>
                        )}
                        {userQuery.data.brandProfile?.socials?.linkedin && (
                          <Badge variant="secondary"><a href={userQuery.data.brandProfile.socials.linkedin} target="_blank" rel="noreferrer">LinkedIn</a></Badge>
                        )}
                        {(!userQuery.data.brandProfile?.socials || Object.keys(userQuery.data.brandProfile.socials).length === 0) && (
                          <span className="text-slate-600">No social links</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {userQuery.data.brandProfile?.fullManagementOnboardingData && (
                <Card>
                  <CardHeader>
                    <CardTitle>Onboarding Details (Full Management)</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 text-sm text-slate-300">
                    <div className="space-y-1">
                      <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Visual Style</span>
                      <span className="font-medium text-white">{userQuery.data.brandProfile.fullManagementOnboardingData.visualStylePreference ?? "—"}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Frequency</span>
                      <span className="font-medium text-white">{userQuery.data.brandProfile.fullManagementOnboardingData.postingFrequencyPreference ?? "—"}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Platforms</span>
                      <div className="flex flex-wrap gap-1">
                        {userQuery.data.brandProfile.fullManagementOnboardingData.platformsToManage?.map(p => (
                          <Badge key={p} variant="outline" className="text-[10px] h-4">{p}</Badge>
                        )) ?? "—"}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Brand Personality</span>
                      <div className="flex flex-wrap gap-1">
                        {userQuery.data.brandProfile.fullManagementOnboardingData.brandPersonality?.map(p => (
                          <Badge key={p} variant="secondary" className="text-[10px] h-4">{p}</Badge>
                        )) ?? "—"}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Posting Access</span>
                      <Badge variant={userQuery.data.brandProfile.fullManagementOnboardingData.postingAccessGranted === "YES" ? "default" : "outline"} className="h-4 text-[10px]">
                        {userQuery.data.brandProfile.fullManagementOnboardingData.postingAccessGranted ?? "—"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardHeader>
                  <CardTitle>Posting Channel</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="posting-channel-mode">Channel</Label>
                    <Select
                      id="posting-channel-mode"
                      value={routingState.mode}
                      onChange={(event) =>
                        setRoutingDraft({
                          ...routingState,
                          mode: event.target.value as PublishingRoutingMode,
                        })
                      }
                    >
                      <option value="FORCE_NATIVE">Default</option>
                      <option value="FORCE_UPLOAD_POST">Upload-Post</option>
                    </Select>
                  </div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/50 p-3">
                    <p className="mb-2 text-xs text-slate-400">
                      Upload-Post platform toggles
                    </p>
                    <div className="space-y-2">
                      <label className="flex items-center justify-between text-sm text-slate-200">
                        Instagram
                        <Checkbox
                          checked={routingState.useInstagram}
                          onCheckedChange={(value) =>
                            setRoutingDraft({
                              ...routingState,
                              useInstagram: Boolean(value),
                            })
                          }
                        />
                      </label>
                      <label className="flex items-center justify-between text-sm text-slate-200">
                        Facebook
                        <Checkbox
                          checked={routingState.useFacebook}
                          onCheckedChange={(value) =>
                            setRoutingDraft({
                              ...routingState,
                              useFacebook: Boolean(value),
                            })
                          }
                        />
                      </label>
                      <label className="flex items-center justify-between text-sm text-slate-200">
                        LinkedIn
                        <Checkbox
                          checked={routingState.useLinkedin}
                          onCheckedChange={(value) =>
                            setRoutingDraft({
                              ...routingState,
                              useLinkedin: Boolean(value),
                            })
                          }
                        />
                      </label>
                    </div>
                  </div>
                  <Button
                    onClick={() => updateRoutingMutation.mutate()}
                    disabled={routingQuery.isLoading || updateRoutingMutation.isPending}
                  >
                    Save Posting Channel
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "subscription" && (
            <Card>
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-300">
                <div className="grid gap-2 md:grid-cols-2">
                  <div>Plan: {subscription?.planCode ?? "—"}</div>
                  <div>Status: {subscription?.status ?? "—"}</div>
                  <div>
                    Current period end:{" "}
                    {formatDate(subscription?.currentPeriodEnd)}
                  </div>
                  <div>
                    Cancel at period end:{" "}
                    {subscription?.cancelAtPeriodEnd ? "Yes" : "No"}
                  </div>
                  <div>
                    Stripe customer: {subscription?.stripeCustomerId ?? "—"}
                  </div>
                  <div>
                    Stripe subscription:{" "}
                    {subscription?.stripeSubscriptionId ?? "—"}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setConfirmAction({ type: "cancel" })}
                    disabled={!subscription}
                  >
                    Cancel Subscription
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => refreshSubscriptionMutation.mutate()}
                    disabled={!subscription}
                  >
                    Refresh from Stripe
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "scheduled" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Scheduled Items</CardTitle>
                  <Select
                    value={scheduledItemsStatus}
                    onChange={(e) => {
                      setScheduledItemsStatus(e.target.value);
                      setScheduledItemsPage(1);
                    }}
                    className="w-40"
                  >
                    <option value="">All Statuses</option>
                    <option value="DRAFT">Draft</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="PUBLISHING">Publishing</option>
                    <option value="POSTED">Posted</option>
                    <option value="FAILED">Failed</option>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="text-slate-500">
                      <TableHead>ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Scheduled For</TableHead>
                      <TableHead>Platforms</TableHead>
                      <TableHead>Caption Preview</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduledItemsQuery.isLoading ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-slate-400"
                        >
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : scheduledItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-slate-400"
                        >
                          No scheduled items found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      scheduledItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-xs">
                            {item.id.slice(0, 8)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                item.status === "POSTED"
                                  ? "default"
                                  : item.status === "FAILED"
                                    ? "destructive"
                                    : "secondary"
                              }
                              className="text-xs"
                            >
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {formatDateTime(item.scheduledFor)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {item.targets.map((target) => (
                                <Badge
                                  key={target.id}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {target.platform}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs max-w-xs truncate">
                            {item.caption
                              ? item.caption.slice(0, 50) +
                                (item.caption.length > 50 ? "..." : "")
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {scheduledItemsTotal > 10 && (
                  <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
                    <div>
                      Page {scheduledItemsPage} of {scheduledItemsTotalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={scheduledItemsPage <= 1}
                        onClick={() =>
                          setScheduledItemsPage((p) => Math.max(1, p - 1))
                        }
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          scheduledItemsPage >= scheduledItemsTotalPages
                        }
                        onClick={() =>
                          setScheduledItemsPage((p) =>
                            Math.min(scheduledItemsTotalPages, p + 1),
                          )
                        }
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "post-as-user" && userQuery.data && (
            <AdminPostComposer
              userId={params.id}
              userName={userQuery.data.user.name}
              userEmail={userQuery.data.user.email}
            />
          )}

          {activeTab === "billing" && (
            <Card>
              <CardHeader>
                <CardTitle>Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="text-slate-500">
                      <TableHead>Invoice</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Link</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(invoicesQuery.data?.items ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-slate-400"
                        >
                          No invoices found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      invoicesQuery.data?.items.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell>{invoice.number ?? invoice.id}</TableCell>
                          <TableCell>{invoice.status}</TableCell>
                          <TableCell>
                            {(invoice.amount / 100).toLocaleString("en-GB", {
                              style: "currency",
                              currency: invoice.currency.toUpperCase(),
                            })}
                          </TableCell>
                          <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                          <TableCell>
                            {invoice.hostedInvoiceUrl ? (
                              <a
                                className="text-lime-300 hover:underline"
                                href={invoice.hostedInvoiceUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                View
                              </a>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {activeTab === "logs" && (
            <Card>
              <CardHeader>
                <CardTitle>Admin Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="text-slate-500">
                      <TableHead>Action</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(auditLogsQuery.data?.items ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center text-slate-400"
                        >
                          No admin actions recorded.
                        </TableCell>
                      </TableRow>
                    ) : (
                      auditLogsQuery.data?.items.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>{log.action}</TableCell>
                          <TableCell>{log.actorEmail}</TableCell>
                          <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Confirm Action Dialog */}
      <Dialog
        open={Boolean(confirmAction)}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.type === "delete" && "Delete User"}
              {confirmAction?.type === "block" && "Block User"}
              {confirmAction?.type === "unblock" && "Unblock User"}
              {confirmAction?.type === "cancel" && "Cancel Subscription"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.type === "delete" &&
                "This will permanently delete the user account and all associated data."}
              {confirmAction?.type === "block" &&
                "Blocked users cannot sign in or access the API."}
              {confirmAction?.type === "unblock" &&
                "Restore access for this account."}
              {confirmAction?.type === "cancel" &&
                "Manage Stripe cancellation settings."}
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
                onCheckedChange={(value) =>
                  setCancelAtPeriodEnd(Boolean(value))
                }
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
              className={
                confirmAction?.type === "delete"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : ""
              }
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
