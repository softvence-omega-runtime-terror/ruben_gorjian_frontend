"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
// import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Upload,
  FileText,
  Image,
  Video,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Download,
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api-client";
import { SubmissionUploadDialog } from "@/components/submissions/submission-upload-dialog";
import { EnhancedDeliveryViewer } from "@/components/submissions/enhanced-delivery-viewer";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

type SubmissionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "IN_REVIEW"
  | "ENHANCED_SENT"
  | "NEEDS_CHANGES"
  | "CLOSED"
  | "COMPLETED"
  | "REJECTED";

interface SubmissionFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

interface Submission {
  id: string;
  status: SubmissionStatus;
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

interface VisualQuotaSnapshot {
  periodStart: string;
  periodEnd: string;
  baseQuota: number;
  bonusQuota: number;
  used: number;
  reserved: number;
  remaining: number;
  canSubmit: boolean;
}

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-3 py-0.5 text-xs font-light transition-colors",
  {
    variants: {
      variant: {
        default: "border-slate-300/40 bg-transparent text-slate-300/40",
        secondary: "border-slate-300/40 bg-transparent text-slate-300/40",
        destructive: "border-red-300/40 bg-transparent text-red-300/40",
        outline: "border-lime-300/40 bg-transparent text-lime-300/40",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

function getStatusBadge(status: SubmissionStatus) {
  const variants: Record<
    SubmissionStatus,
    {
      variant: "default" | "secondary" | "destructive" | "outline";
      icon: React.ComponentType<{ className?: string }>;
      label: string;
    }
  > = {
    DRAFT: { variant: "secondary", icon: Clock, label: "Draft" },
    SUBMITTED: { variant: "secondary", icon: Clock, label: "Submitted" },
    IN_REVIEW: { variant: "default", icon: AlertCircle, label: "In Review" },
    ENHANCED_SENT: {
      variant: "outline",
      icon: CheckCircle,
      label: "Enhanced Sent",
    },
    NEEDS_CHANGES: {
      variant: "destructive",
      icon: AlertCircle,
      label: "Needs Changes",
    },
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

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [quota, setQuota] = useState<VisualQuotaSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    setActionError(null);
    try {
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: ((page - 1) * pageSize).toString(),
      });
      const res = await apiGet<{
        submissions: Submission[];
        total?: number;
      }>(`/api/submissions?${params}`);

      setSubmissions(res.submissions);
      setTotal(res.total || res.submissions.length);
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string };
      if (error.status === 403) {
        setError(
          "An active subscription is required to access media submissions.",
        );
      } else {
        setError(error.message || "Failed to load submissions");
      }
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  const loadQuota = useCallback(async () => {
    setQuotaError(null);
    try {
      const res = await apiGet<{ quota: VisualQuotaSnapshot }>(
        `/api/submissions/quota`,
      );
      setQuota(res.quota);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setQuotaError(error.message || "Failed to load quota");
    }
  }, []);

  useEffect(() => {
    loadSubmissions();
    loadQuota();
  }, [loadSubmissions, loadQuota]); // Reload when page changes

  function handleUploadSuccess() {
    setUploadDialogOpen(false);
    setPage(1); // Reset to first page
    loadSubmissions();
    loadQuota();
  }

  async function handleBuyMoreVisuals() {
    setActionError(null);
    try {
      const res = await apiPost<{ checkoutUrl: string }>(
        "/api/billing/visual-topups/checkout",
        {},
      );
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        setActionError("Unable to start top-up checkout.");
      }
    } catch (err: unknown) {
      const checkoutError = err as { message?: string };
      setActionError(
        checkoutError.message || "Failed to start top-up checkout.",
      );
    }
  }

  async function downloadFile(submissionId: string, fileId: string) {
    setActionError(null);
    try {
      const res = await apiGet<{
        downloadUrl: string | null;
        fileName: string;
      }>(`/api/submissions/${submissionId}/files/${fileId}/download`);

      if (res.downloadUrl) {
        window.open(res.downloadUrl, "_blank");
      } else {
        setActionError("File download not available.");
      }
    } catch (err: unknown) {
      const downloadError = err as { message?: string };
      setActionError(downloadError.message || "Failed to download file");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <p className="text-slate-400">Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-rose-600/50 bg-rose-950/30 px-4 py-3 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="h-4 w-4 text-rose-500" />
          <p className="text-sm text-rose-300">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="ml-auto h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>
      )}
      {actionError && (
        <Card className="border-red-900/50 bg-red-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-400 mt-0.5" />
              <div>
                <p className="font-medium text-red-200">Download Error</p>
                <p className="text-sm text-red-300/80 mt-1">{actionError}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Document Submissions
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Submit documents and media files for admin processing
          </p>
        </div>
        <Button
          onClick={() => setUploadDialogOpen(true)}
          className="gap-2"
          disabled={quota ? !quota.canSubmit : false}
        >
          <Plus className="h-4 w-4" />
          New Submission
        </Button>
      </div>

      {quota && (
        <Card className="border-slate-800 bg-slate-900/60">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">
                  Visual quota this period
                </p>
                <p className="text-xl font-semibold text-white">
                  {quota.remaining} remaining
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Resets on {formatDate(quota.periodEnd)}
                </p>
              </div>
              {quota.remaining === 0 && (
                <Button onClick={handleBuyMoreVisuals} className="gap-2">
                  Buy more visuals
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Used + reserved</span>
                <span>
                  {quota.used + quota.reserved} /{" "}
                  {quota.baseQuota + quota.bonusQuota}
                </span>
              </div>
              <Progress
                value={
                  quota.baseQuota + quota.bonusQuota > 0
                    ? ((quota.used + quota.reserved) /
                        (quota.baseQuota + quota.bonusQuota)) *
                      100
                    : 0
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      {quotaError && (
        <Card className="border-yellow-900/40 bg-yellow-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-200">Quota Unavailable</p>
                <p className="text-sm text-yellow-300/80 mt-1">{quotaError}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submissions List */}
      {submissions.length === 0 ? (
        <Card className="border-slate-800 bg-slate-900/60">
          <CardContent className="py-12 text-center">
            <Upload className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              No submissions yet
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              Submit documents and media files for admin review and processing
            </p>
            <Button onClick={() => setUploadDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create First Submission
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {submissions.map((submission) => (
            <Card
              key={submission.id}
              className="border-slate-800 bg-slate-900/60"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <CardTitle className="text-base">
                        Submission #{submission.id.slice(0, 8)}
                      </CardTitle>
                      {/* <Badge variant="secondary" className="text-xs text-lime-300"> */}
                      {getStatusBadge(submission.status)}
                      {/* </Badge> */}
                    </div>
                    <p className="text-xs text-slate-400">
                      Submitted {formatDate(submission.createdAt)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* User Note */}
                {submission.userNote && (
                  <div className="rounded-lg bg-slate-800/50 p-3">
                    <p className="text-xs font-medium text-slate-300 mb-1">
                      Your Note:
                    </p>
                    <p className="text-sm text-slate-400">
                      {submission.userNote}
                    </p>
                  </div>
                )}

                {/* Admin Note */}
                {submission.adminNote && (
                  <div className="rounded-lg bg-blue-950/30 border border-blue-900/50 p-3">
                    <p className="text-xs font-medium text-blue-300 mb-1">
                      Admin Response:
                    </p>
                    <p className="text-sm text-blue-200/80">
                      {submission.adminNote}
                    </p>
                  </div>
                )}

                {/* Files */}
                <div>
                  <p className="text-xs font-medium text-slate-300 mb-2">
                    Files ({submission.fileCount})
                  </p>
                  <div className="grid gap-2">
                    {submission.files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 rounded-lg bg-slate-800/30 p-3"
                      >
                        <div className="text-slate-400">
                          {getFileIcon(file.fileType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {file.fileName}
                          </p>
                          <p className="text-xs text-slate-400">
                            {formatFileSize(file.fileSize)}
                          </p>
                        </div>
                        {submission.status === "COMPLETED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadFile(submission.id, file.id)}
                            className="gap-2"
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Latest Event */}
                {submission.latestEvent && submission.latestEvent.note && (
                  <div className="text-xs text-slate-400 border-t border-slate-800 pt-3">
                    <span className="font-medium">Latest update:</span>{" "}
                    {submission.latestEvent.note}
                    <span className="ml-2">
                      ({formatDate(submission.latestEvent.createdAt)})
                    </span>
                  </div>
                )}

                {submission.status === "ENHANCED_SENT" && (
                  <div className="pt-2">
                    <EnhancedDeliveryViewer submissionId={submission.id} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-sm text-slate-400">
            Showing {(page - 1) * pageSize + 1} to{" "}
            {Math.min(page * pageSize, total)} of {total} submission
            {total !== 1 ? "s" : ""}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={page === 1 || loading}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={page * pageSize >= total || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Upload Dialog */}
      <SubmissionUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSuccess={handleUploadSuccess}
        onRequestTopup={handleBuyMoreVisuals}
      />
    </div>
  );
}
