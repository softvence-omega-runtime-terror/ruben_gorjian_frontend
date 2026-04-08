"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  FileText,
  Image,
  Video,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Download,
  Eye,
  Search,
  XIcon,
  Package
} from "lucide-react";
import { apiGet, apiPatch } from "@/lib/api-client";
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { EnhancedDeliveryComposer } from "@/components/submissions/enhanced-delivery-composer";
import { EnhancedDeliveryViewer } from "@/components/submissions/enhanced-delivery-viewer";

type SubmissionStatus = "DRAFT" | "SUBMITTED" | "IN_REVIEW" | "ENHANCED_SENT" | "NEEDS_CHANGES" | "CLOSED" | "COMPLETED" | "REJECTED";
type SubmissionPlanCategory = "FULL_MANAGEMENT" | "VISUAL_ONLY";

interface SubmissionFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storageKey?: string;
}

interface Submission {
  id: string;
  status: SubmissionStatus;
  planCategory: SubmissionPlanCategory;
  user: {
    id: string;
    email: string;
    name?: string;
  };
  userNote?: string;
  adminNote?: string;
  fileCount: number;
  files: SubmissionFile[];
  latestEvent: {
    status: SubmissionStatus;
    note?: string;
    createdAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface DetailedSubmission extends Submission {
  quotaUnitsReserved?: number;
  quotaUnitsConsumed?: number;
  events: Array<{
    id: string;
    status: SubmissionStatus;
    note?: string;
    createdBy?: string;
    createdAt: string;
  }>;
}
const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-3 py-0.5 text-xs font-light transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-slate-300/40 bg-transparent text-slate-300/40",
        secondary:
          "border-slate-300/40 bg-transparent text-slate-300/40",
        destructive:
          "border-red-300/40 bg-transparent text-red-300/40",
        outline: "border-lime-300/40 bg-transparent text-lime-300/40",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}


function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}


function getStatusBadge(status: SubmissionStatus) {
  const variants: Record<
    SubmissionStatus,
    { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ComponentType<{ className?: string }>; label: string }
  > = {
    DRAFT: { variant: "secondary", icon: Clock, label: "Draft" },
    SUBMITTED: { variant: "secondary", icon: Clock, label: "Submitted" },
    IN_REVIEW: { variant: "default", icon: AlertCircle, label: "In Review" },
    ENHANCED_SENT: { variant: "outline", icon: CheckCircle, label: "Enhanced Sent" },
    NEEDS_CHANGES: { variant: "destructive", icon: AlertCircle, label: "Needs Changes" },
    CLOSED: { variant: "default", icon: XCircle, label: "Closed" },
    COMPLETED: { variant: "outline", icon: CheckCircle, label: "Completed" },
    REJECTED: { variant: "destructive", icon: XCircle, label: "Rejected" },
  };

  const config = variants[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function getFileIcon(fileType: string) {
  // Icons are decorative only, not informational
  /* eslint-disable jsx-a11y/alt-text */
  if (fileType.startsWith("image/")) return <Image className="h-4 w-4" />;
  if (fileType.startsWith("video/")) return <Video className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
  /* eslint-enable jsx-a11y/alt-text */
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"date" | "user" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedSubmission, setSelectedSubmission] = useState<DetailedSubmission | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  // Status Update Dialog State
  const [statusConfirm, setStatusConfirm] = useState<{
    open: boolean;
    submissionId: string;
    targetStatus: SubmissionStatus;
    note: string;
    isBatch?: boolean;
  }>({
    open: false,
    submissionId: "",
    targetStatus: "SUBMITTED",
    note: "",
    isBatch: false,
  });

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      if (planFilter !== "all") {
        params.planCategory = planFilter;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      params.sort = sortBy;
      params.order = sortOrder;

      const queryString = new URLSearchParams(params).toString();
      const url = `/api/admin/submissions${queryString ? `?${queryString}` : ""}`;

      const res = await apiGet<any>(url);
      
      // Handle both array response and object response
      if (Array.isArray(res)) {
        setSubmissions(res);
      } else if (res && typeof res === "object" && Array.isArray(res.submissions)) {
        setSubmissions(res.submissions);
      } else {
        console.error("Unexpected response format:", res);
        setSubmissions([]);
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, planFilter, searchQuery, sortBy, sortOrder]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]); // Reload when filters change

  async function viewDetails(submissionId: string) {
    setDetailsLoading(true);
    setDetailsOpen(true); // Open immediately to show loading
    setSelectedSubmission(null); // Clear previous
    try {
      const res = await apiGet<any>(
        `/api/admin/submissions/${submissionId}`
      );
      
      console.log("Submission details response:", res);

      // Handle both object response and wrapped response
      if (res && typeof res === "object") {
        if (res.submission) {
          setSelectedSubmission(res.submission);
        } else {
          setSelectedSubmission(res as DetailedSubmission);
        }
      } else {
        console.error("Unexpected response format for submission details:", res);
        setError("Failed to load submission details: Invalid response format");
        setDetailsOpen(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load submission details");
      setDetailsOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  }

  async function updateStatus(submissionId: string, status: SubmissionStatus, adminNote?: string) {
    setUpdating(true);
    try {
      await apiPatch(`/api/admin/submissions/${submissionId}`, {
        status,
        adminNote,
      });

      // Reload submissions
      await loadSubmissions();

      // Update selected submission if open
      if (selectedSubmission?.id === submissionId) {
        const res = await apiGet<any>(
          `/api/admin/submissions/${submissionId}`
        );
        
        if (res && typeof res === "object") {
          if (res.submission) {
            setSelectedSubmission(res.submission);
          } else {
            setSelectedSubmission(res as DetailedSubmission);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update submission");
    } finally {
      setUpdating(false);
    }
  }

  async function refreshSubmissionDetails(submissionId: string) {
    await loadSubmissions();
    if (selectedSubmission?.id === submissionId) {
      const res = await apiGet<any>(
        `/api/admin/submissions/${submissionId}`
      );
      
      if (res && typeof res === "object") {
        if (res.submission) {
          setSelectedSubmission(res.submission);
        } else {
          setSelectedSubmission(res as DetailedSubmission);
        }
      }
    }
  }

  async function downloadFile(submissionId: string, fileId: string) {
    try {
      const res = await apiGet<{ downloadUrl: string; fileName: string }>(
        `/api/admin/submissions/${submissionId}/files/${fileId}/download`
      );

      if (res.downloadUrl) {
        window.open(res.downloadUrl, "_blank");
      } else {
        setError("File download not available (S3 not configured)");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download file");
    }
  }

  async function handleBatchUpdate(status: SubmissionStatus, note?: string) {
    if (selectedIds.size === 0) return;
    
    setUpdating(true);
    try {
      const promises = Array.from(selectedIds).map(id =>
        apiPatch(`/api/admin/submissions/${id}`, { status, adminNote: note })
      );
      
      await Promise.all(promises);
      setSelectedIds(new Set());
      loadSubmissions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to batch update submissions");
    } finally {
      setUpdating(false);
    }
  }

  function toggleSelection(id: string) {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  }

  function toggleSelectAll() {
    if (selectedIds.size === submissions.length && submissions.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(submissions.map(s => s.id)));
    }
  }

  const filteredSubmissions = submissions;

  if (loading) {
    return (
      <div className="space-y-6 p-5">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <p className="text-slate-400">Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Submissions Management</h1>
          <p className="text-sm text-slate-400 mt-1">
            Review and process user document submissions
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-slate-800 bg-slate-900/60">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="search"
                  placeholder="Search by user email or submission ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white ring-offset-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 focus-visible:ring-offset-2"
              >
                <option value="all">All</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="ENHANCED_SENT">Enhanced Sent</option>
                <option value="NEEDS_CHANGES">Needs Changes</option>
                <option value="CLOSED">Closed</option>
                <option value="COMPLETED">Completed</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Plan Filter */}
            <div>
              <Label htmlFor="plan-filter">Plan</Label>
              <select
                id="plan-filter"
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white ring-offset-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 focus-visible:ring-offset-2"
              >
                <option value="all">All</option>
                <option value="FULL_MANAGEMENT">Full Management</option>
                <option value="VISUAL_ONLY">Visual Only</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <Label htmlFor="sort-by">Sort By</Label>
              <select
                id="sort-by"
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [by, order] = e.target.value.split('-');
                  setSortBy(by as "date" | "user" | "status");
                  setSortOrder(order as "asc" | "desc");
                }}
                className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white ring-offset-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 focus-visible:ring-offset-2"
              >
                <option value="date-desc">Date (Newest)</option>
                <option value="date-asc">Date (Oldest)</option>
                <option value="user-asc">User (A-Z)</option>
                <option value="user-desc">User (Z-A)</option>
                <option value="status-asc">Status (A-Z)</option>
                <option value="status-desc">Status (Z-A)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Batch Actions */}
      {selectedIds.size > 0 && (
        <Card className="border-lime-900/50 bg-lime-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white">
                {selectedIds.size} submission{selectedIds.size !== 1 ? 's' : ''} selected
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusConfirm({
                    open: true,
                    submissionId: "batch",
                    targetStatus: "IN_REVIEW",
                    note: "",
                    isBatch: true,
                  })}
                  disabled={updating}
                >
                  Mark as In Review
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusConfirm({
                    open: true,
                    submissionId: "batch",
                    targetStatus: "COMPLETED",
                    note: "",
                    isBatch: true,
                  })}
                  disabled={updating}
                >
                  Mark as Completed
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusConfirm({
                    open: true,
                    submissionId: "batch",
                    targetStatus: "REJECTED",
                    note: "",
                    isBatch: true,
                  })}
                  disabled={updating}
                >
                  Mark as Rejected
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                  disabled={updating}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="border-red-900/50 bg-red-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-400 mt-0.5" />
              <div>
                <p className="font-medium text-red-200">Error</p>
                <p className="text-sm text-red-300/80 mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
        <Card className="border-slate-800 bg-slate-900/60">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No submissions found</h3>
            <p className="text-sm text-slate-400">
              {statusFilter !== "all"
                ? `No submissions with status: ${statusFilter}`
                : "No submissions have been created yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Select All */}
          <div className="flex items-center gap-2 px-2">
            <input
              type="checkbox"
              checked={selectedIds.size === submissions.length && submissions.length > 0}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-lime-400 focus:ring-lime-400"
              aria-label="Select all submissions"
            />
            <label className="text-sm text-slate-400">
              Select all ({submissions.length})
            </label>
          </div>

          <div className="grid gap-4">
            {filteredSubmissions.map((submission) => (
              <Card key={submission.id} className="border-slate-800 bg-slate-900/60">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedIds.has(submission.id)}
                      onChange={() => toggleSelection(submission.id)}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-lime-400 focus:ring-lime-400 mt-1"
                      aria-label={`Select submission ${submission.id.slice(0, 8)}`}
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-base">
                          Submission #{submission.id.slice(0, 8)}
                        </CardTitle>
                        {getStatusBadge(submission.status)}
                      </div>
                      <p className="text-xs text-slate-400">
                        From: {submission.user.email} • {formatDate(submission.createdAt)} • {submission.planCategory === "VISUAL_ONLY" ? "Visual Only" : "Full Management"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => viewDetails(submission.id)}
                      className="gap-2"
                    >
                      <Eye className="h-3 w-3" />
                      View Details
                    </Button>
                  </div>
                </CardHeader>
              <CardContent className="space-y-3">
                {/* User Note */}
                {submission.userNote && (
                  <div className="rounded-lg bg-slate-800/50 p-3">
                    <p className="text-xs font-medium text-slate-300 mb-1">User Note:</p>
                    <p className="text-sm text-slate-400">{submission.userNote}</p>
                  </div>
                )}

                {/* Admin Note */}
                {submission.adminNote && (
                  <div className="rounded-lg bg-lime-400/5 p-3 border border-lime-400/10">
                    <p className="text-xs font-bold text-lime-400 uppercase tracking-wider mb-1">Admin Note:</p>
                    <p className="text-sm text-slate-300">{submission.adminNote}</p>
                  </div>
                )}

                {/* Files Summary */}
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <FileText className="h-4 w-4" />
                  {submission.fileCount} file{submission.fileCount !== 1 ? "s" : ""}
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 pt-2">
                  {submission.status === "SUBMITTED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setStatusConfirm({
                        open: true,
                        submissionId: submission.id,
                        targetStatus: "IN_REVIEW",
                        note: "",
                      })}
                      disabled={updating}
                    >
                      Start Review
                    </Button>
                  )}
                  {submission.status === "IN_REVIEW" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setStatusConfirm({
                          open: true,
                          submissionId: submission.id,
                          targetStatus: "COMPLETED",
                          note: "",
                        })}
                        disabled={updating}
                      >
                        Mark Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setStatusConfirm({
                          open: true,
                          submissionId: submission.id,
                          targetStatus: "REJECTED",
                          note: "",
                        })}
                        disabled={updating}
                        className="border-red-600 text-red-400 hover:bg-red-600/10"
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        </>
      )}

      {/* Status Update Confirmation Dialog */}
      <Dialog 
        open={statusConfirm.open} 
        onOpenChange={(open) => setStatusConfirm(prev => ({ ...prev, open }))}
      >
        <DialogContent className="max-w-md bg-slate-950 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              {statusConfirm.isBatch ? "Confirm Batch Status Update" : "Confirm Status Update"}
            </DialogTitle>
            <DialogDescription>
              Update {statusConfirm.isBatch ? `${selectedIds.size} submission${selectedIds.size !== 1 ? 's' : ''}` : 'submission status'} to <span className="text-lime-400 font-bold">{statusConfirm.targetStatus.replace('_', ' ')}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="confirm-note" className="text-slate-400 text-xs uppercase tracking-widest font-bold">
                Admin Note (Optional)
              </Label>
              <Textarea
                id="confirm-note"
                placeholder="Add a note for this status change..."
                value={statusConfirm.note}
                onChange={(e) => setStatusConfirm(prev => ({ ...prev, note: e.target.value }))}
                className="bg-slate-900 border-slate-800 focus:ring-lime-400 min-h-[100px]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button 
              variant="ghost" 
              onClick={() => setStatusConfirm(prev => ({ ...prev, open: false }))}
              disabled={updating}
              className="text-slate-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              className="bg-lime-400 hover:bg-lime-500 text-slate-950 font-bold px-6"
              onClick={async () => {
                if (statusConfirm.isBatch) {
                  await handleBatchUpdate(statusConfirm.targetStatus, statusConfirm.note);
                } else {
                  await updateStatus(statusConfirm.submissionId, statusConfirm.targetStatus, statusConfirm.note);
                }
                setStatusConfirm(prev => ({ ...prev, open: false }));
              }}
              disabled={updating}
            >
              {updating ? "Updating..." : "Confirm Update"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <SubmissionDetailsDialog
        submission={selectedSubmission}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onUpdate={updateStatus}
        onEnhancedSent={refreshSubmissionDetails}
        onDownload={downloadFile}
        setStatusConfirm={setStatusConfirm}
        updating={updating}
        loading={detailsLoading}
      />
    </div>
  );
}

interface SubmissionDetailsDialogProps {
  submission: DetailedSubmission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (submissionId: string, status: SubmissionStatus, adminNote?: string) => Promise<void>;
  onEnhancedSent: (submissionId: string) => Promise<void>;
  onDownload: (submissionId: string, fileId: string) => Promise<void>;
  setStatusConfirm: (config: {
    open: boolean;
    submissionId: string;
    targetStatus: SubmissionStatus;
    note: string;
  }) => void;
  updating: boolean;
  loading?: boolean;
}

function SubmissionDetailsDialog({
  submission,
  open,
  onOpenChange,
  onUpdate,
  onEnhancedSent,
  onDownload,
  setStatusConfirm,
  updating,
  loading,
}: SubmissionDetailsDialogProps) {
  const [newStatus, setNewStatus] = useState<SubmissionStatus>("SUBMITTED");
  const [adminNote, setAdminNote] = useState("");
  const [enhancedOpen, setEnhancedOpen] = useState(false);

  useEffect(() => {
    if (submission) {
      setNewStatus(submission.status);
      setAdminNote(submission.adminNote || "");
    }
  }, [submission]);

  const handleUpdate = async () => {
    if (!submission) return;
    await onUpdate(submission.id, newStatus, adminNote.trim() || undefined);
  };

  return (
    <div className="h-screen w-screen">
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-950 border-slate-800 p-0">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-lime-400 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                <span className="!absolute !-m-px !important !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
              </div>
              <p className="mt-4 text-slate-400">Fetching submission details...</p>
            </div>
          ) : !submission ? (
            <div className="p-12 text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-white">Failed to load submission data.</p>
            </div>
          ) : (
            <>
              {/* Header with Background Accent */}
              <div className="relative overflow-hidden bg-slate-900 border-b border-slate-800 p-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-lime-400/5 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-lime-400/10 flex items-center justify-center border border-lime-400/20">
                        <FileText className="h-5 w-5 text-lime-400" />
                      </div>
                      <div>
                        <DialogTitle className="text-xl font-bold text-white">
                          Submission #{submission.id.slice(0, 8)}
                        </DialogTitle>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Submitted on {formatDate(submission.createdAt)}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(submission.status)}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-slate-950/40 rounded-lg p-3 border border-slate-800/50">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">User Email</p>
                      <p className="text-sm text-slate-200 truncate">{submission.user.email}</p>
                    </div>
                    <div className="bg-slate-950/40 rounded-lg p-3 border border-slate-800/50">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Plan Category</p>
                      <p className="text-sm text-slate-200">
                        {submission.planCategory === "VISUAL_ONLY" ? "Visual Only" : "Full Management"}
                      </p>
                    </div>
                    <div className="bg-slate-950/40 rounded-lg p-3 border border-slate-800/50">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Files Uploaded</p>
                      <p className="text-sm text-slate-200">{submission.files.length} Files</p>
                    </div>
                    {(submission.quotaUnitsReserved !== undefined || submission.quotaUnitsConsumed !== undefined) && (
                      <div className="bg-slate-950/40 rounded-lg p-3 border border-slate-800/50">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Quota Used</p>
                        <p className="text-sm text-slate-200">
                          {submission.quotaUnitsConsumed ?? 0} / {submission.quotaUnitsReserved ?? 0}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Content & Files */}
                <div className="lg:col-span-2 space-y-8">
                  {/* User Message */}
                  <section>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-1 w-4 bg-lime-400 rounded-full" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">User Note</h3>
                    </div>
                    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800/60 leading-relaxed text-slate-300">
                      {submission.userNote || (
                        <span className="text-slate-500 italic text-sm">No note provided by user.</span>
                      )}
                    </div>
                  </section>

                  {/* Admin Note Display */}
                  {submission.adminNote && (
                    <section>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-1 w-4 bg-lime-400 rounded-full" />
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Internal Admin Note</h3>
                      </div>
                      <div className="bg-lime-400/5 rounded-xl p-4 border border-lime-400/20 leading-relaxed text-slate-300">
                        {submission.adminNote}
                      </div>
                    </section>
                  )}

                  {/* Files List */}
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-4 bg-lime-400 rounded-full" />
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Attached Files</h3>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {submission.files.map((file) => (
                        <div
                          key={file.id}
                          className="group flex items-center gap-3 rounded-xl bg-slate-900/40 p-3 border border-slate-800/50 hover:border-lime-400/30 hover:bg-slate-900/80 transition-all duration-200"
                        >
                          <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-lime-400 transition-colors">
                            {getFileIcon(file.fileType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-200 truncate">{file.fileName}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{formatFileSize(file.fileSize)}</p>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => onDownload(submission.id, file.id)}
                            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Enhanced Deliveries Section */}
                  {submission.status === "ENHANCED_SENT" && (
                    <section>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="h-1 w-4 bg-blue-400 rounded-full" />
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Enhanced Deliveries (Admin View)</h3>
                      </div>
                      <div className="bg-blue-600/5 rounded-2xl p-6 border border-blue-600/10">
                        <EnhancedDeliveryViewer 
                          submissionId={submission.id} 
                          triggerLabel="View Sent Deliveries"
                          isAdmin={true}
                        />
                      </div>
                    </section>
                  )}

                  {/* History Timeline */}
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-1 w-4 bg-lime-400 rounded-full" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Activity History</h3>
                    </div>
                    <div className="relative pl-4 border-l border-slate-800 space-y-6 py-2">
                      {submission.events?.map((event, idx) => (
                        <div key={event.id} className="relative">
                          {/* Dot */}
                          <div className={cn(
                            "absolute -left-[21px] top-1.5 h-3 w-3 rounded-full border-2 border-slate-950 shadow-sm",
                            idx === 0 ? "bg-lime-400" : "bg-slate-700"
                          )} />
                          
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white uppercase">{event.status.replace('_', ' ')}</span>
                              <span className="text-[10px] text-slate-500">•</span>
                              <span className="text-[10px] text-slate-500">{formatDate(event.createdAt)}</span>
                            </div>
                            {event.note && (
                              <p className="text-sm text-slate-400 mt-1 bg-slate-900/30 rounded-lg p-2 border border-slate-800/40">
                                {event.note}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Right Column: Actions */}
                <div className="space-y-6">
                  <div className="bg-slate-900/50 rounded-2xl border border-slate-800/80 p-5 space-y-6 sticky top-0">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Management</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="new-status" className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">Target Status</Label>
                          <select
                            id="new-status"
                            value={newStatus}
                            onChange={(e) => {
                              const selectedStatus = e.target.value as SubmissionStatus;
                              setNewStatus(selectedStatus);
                              if (submission) {
                                setStatusConfirm({
                                  open: true,
                                  submissionId: submission.id,
                                  targetStatus: selectedStatus,
                                  note: adminNote,
                                });
                              }
                            }}
                            className="flex h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white ring-offset-slate-950 focus:outline-none focus:ring-2 focus:ring-lime-400 transition-all mt-1.5"
                          >
                            <option value="DRAFT">Draft</option>
                            <option value="SUBMITTED">Submitted</option>
                            <option value="IN_REVIEW">In Review</option>
                            <option value="ENHANCED_SENT">Enhanced Sent</option>
                            <option value="NEEDS_CHANGES">Needs Changes</option>
                            <option value="CLOSED">Closed</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="REJECTED">Rejected</option>
                          </select>
                        </div>

                        <div>
                          <Label htmlFor="admin-note" className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">Admin Feedback</Label>
                          <Textarea
                            id="admin-note"
                            placeholder="Add notes for the user or internal team..."
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                            className="mt-1.5 bg-slate-950 border-slate-800 rounded-xl min-h-[100px] resize-none focus:ring-lime-400"
                          />
                        </div>

                        <Button 
                          className="w-full h-11 bg-lime-400 hover:bg-lime-500 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-lime-400/10"
                          onClick={() => {
                            if (submission) {
                              setStatusConfirm({
                                open: true,
                                submissionId: submission.id,
                                targetStatus: newStatus,
                                note: adminNote,
                              });
                            }
                          }} 
                          disabled={updating}
                        >
                          {updating ? "Processing..." : "Update Status"}
                        </Button>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-800">
                      <Button 
                        variant="outline" 
                        className="w-full h-11 border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl"
                        onClick={() => setEnhancedOpen(true)} 
                        disabled={updating}
                      >
                        Send Enhanced Version
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      {submission && (
        <EnhancedDeliveryComposer
          submissionId={submission.id}
          open={enhancedOpen}
          onOpenChange={setEnhancedOpen}
          onSent={() => onEnhancedSent(submission.id)}
        />
      )}
    </div>
  );
}
