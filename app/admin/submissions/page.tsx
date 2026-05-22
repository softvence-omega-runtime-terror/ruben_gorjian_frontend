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
  XIcon
} from "lucide-react";
import { apiGet, apiPatch } from "@/lib/api-client";
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { EnhancedDeliveryComposer } from "@/components/submissions/enhanced-delivery-composer";

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

      const res = await apiGet<{ submissions: Submission[]; total: number }>(url);
      setSubmissions(res.submissions);
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
    try {
      const res = await apiGet<{ submission: DetailedSubmission }>(
        `/api/admin/submissions/${submissionId}`
      );
      setSelectedSubmission(res.submission);
      setDetailsOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load submission details");
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
        const res = await apiGet<{ submission: DetailedSubmission }>(
          `/api/admin/submissions/${submissionId}`
        );
        setSelectedSubmission(res.submission);
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
      const res = await apiGet<{ submission: DetailedSubmission }>(
        `/api/admin/submissions/${submissionId}`
      );
      setSelectedSubmission(res.submission);
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

  async function handleBatchUpdate(status: SubmissionStatus) {
    if (selectedIds.size === 0) return;
    
    setUpdating(true);
    try {
      const promises = Array.from(selectedIds).map(id =>
        apiPatch(`/api/admin/submissions/${id}`, { status })
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
                  onClick={() => handleBatchUpdate("IN_REVIEW")}
                  disabled={updating}
                >
                  Mark as In Review
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBatchUpdate("COMPLETED")}
                  disabled={updating}
                >
                  Mark as Completed
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBatchUpdate("REJECTED")}
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
                      onClick={() => updateStatus(submission.id, "IN_REVIEW")}
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
                        onClick={() => updateStatus(submission.id, "COMPLETED")}
                        disabled={updating}
                      >
                        Mark Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(submission.id, "REJECTED")}
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

      {/* Details Dialog */}
      {selectedSubmission && (
        <SubmissionDetailsDialog
          submission={selectedSubmission}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          onUpdate={updateStatus}
          onEnhancedSent={refreshSubmissionDetails}
          onDownload={downloadFile}
          updating={updating}
        />
      )}
    </div>
  );
}

interface SubmissionDetailsDialogProps {
  submission: DetailedSubmission;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (submissionId: string, status: SubmissionStatus, adminNote?: string) => Promise<void>;
  onEnhancedSent: (submissionId: string) => Promise<void>;
  onDownload: (submissionId: string, fileId: string) => Promise<void>;
  updating: boolean;
}

function SubmissionDetailsDialog({
  submission,
  open,
  onOpenChange,
  onUpdate,
  onEnhancedSent,
  onDownload,
  updating,
}: SubmissionDetailsDialogProps) {
  const [newStatus, setNewStatus] = useState<SubmissionStatus>(submission.status);
  const [adminNote, setAdminNote] = useState(submission.adminNote || "");
  const [enhancedOpen, setEnhancedOpen] = useState(false);

  const handleUpdate = async () => {
    await onUpdate(submission.id, newStatus, adminNote.trim() || undefined);
  };

  return (
    <div className="h-screen w-screen">
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Details #{submission.id.slice(0, 8)}</DialogTitle>
            <DialogDescription>
              From: {submission.user.email}
            </DialogDescription>
            <DialogDescription>
              Submitted on {formatDate(submission.createdAt)}
            </DialogDescription>
            <DialogDescription>
              Plan: {submission.planCategory === "VISUAL_ONLY" ? "Visual Only" : "Full Management"}
            </DialogDescription>
            {(submission.quotaUnitsReserved !== undefined || submission.quotaUnitsConsumed !== undefined) && (
              <DialogDescription>
                Quota: {submission.quotaUnitsConsumed ?? 0} consumed • {submission.quotaUnitsReserved ?? 0} reserved
              </DialogDescription>
            )}
          </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Current Status */}
          <div>
            <Label>Current Status</Label>
            <div className="mt-2">{getStatusBadge(submission.status)}</div>
          </div>
           <Button className="absolute top-0 right-4" variant="outline" onClick={() => onOpenChange(false)} disabled={updating}>
             <span className="sr-only">Close</span>
             <XIcon className="h-4 w-4" />
            </Button>
            
            
            

          {/* User Note */}
          {submission.userNote && (
            <div>
              <Label>User Note</Label>
              <div className="mt-2 rounded-lg bg-slate-800/50 p-3">
                <p className="text-sm text-slate-300">{submission.userNote}</p>
              </div>
            </div>
          )}

          {/* Files */}
          <div>
            <Label>Files ({submission.files.length})</Label>
            <div className="mt-2 space-y-2">
              {submission.files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 rounded-lg bg-slate-800/30 p-3"
                >
                  <div className="text-slate-400">{getFileIcon(file.fileType)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{file.fileName}</p>
                    <p className="text-xs text-slate-400">{formatFileSize(file.fileSize)}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDownload(submission.id, file.id)}
                    className="gap-2"
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Update Status */}
          <div>
            <Label htmlFor="new-status">Update Status</Label>
            <select
              id="new-status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as SubmissionStatus)}
              className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white ring-offset-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 focus-visible:ring-offset-2 mt-2"
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

          {/* Admin Note */}
          <div>
            <Label htmlFor="admin-note">Admin Note</Label>
            <Textarea
              id="admin-note"
              placeholder="Add notes or feedback for the user..."
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>

          {/* Event History */}
          <div>
            <Label>Event History</Label>
            <div className="mt-2 space-y-2">
              {submission.events.map((event) => (
                <div key={event.id} className="rounded-lg bg-slate-800/30 p-3">
                  <div className="flex items-center justify-between mb-1">
                    {getStatusBadge(event.status)}
                    <p className="text-xs text-slate-400">{formatDate(event.createdAt)}</p>
                  </div>
                  {event.note && <p className="text-sm text-slate-300 mt-2">{event.note}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button variant="outline" onClick={() => setEnhancedOpen(true)} disabled={updating}>
              Send Enhanced Version
            </Button>
            
            <Button onClick={handleUpdate} disabled={updating}>
              {updating ? "Updating..." : "Update Submission"}
            </Button>
          </div>
        </div>
        </DialogContent>
      </Dialog>
      <EnhancedDeliveryComposer
        submissionId={submission.id}
        open={enhancedOpen}
        onOpenChange={setEnhancedOpen}
        onSent={() => onEnhancedSent(submission.id)}
      />
    </div>
  );
}
