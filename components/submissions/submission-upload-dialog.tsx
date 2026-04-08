"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, X, FileText, Image, Video, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { apiPost } from "@/lib/api-client";

interface SubmissionUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  onRequestTopup?: () => void;
}

interface FileWithProgress {
  file: File;
  id: string;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
  retryCount: number;
  xhr?: XMLHttpRequest;
}

// Constants
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "video/mp4",
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_FILES = 10;
const MAX_RETRY_ATTEMPTS = 3;
const PRESIGNED_URL_EXPIRY = 3600 * 1000; // 1 hour in ms
const FILE_ID_LENGTH = 9;
const RANDOM_STRING_BASE = 36;

// Utility functions
function getFileIcon(fileType: string) {
  // Lucide Image icon (decorative SVG; LucideProps has no alt)
  if (fileType.startsWith("image/")) return <Image className="h-4 w-4" aria-hidden />; // eslint-disable-line jsx-a11y/alt-text
  if (fileType.startsWith("video/")) return <Video className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function generateFileId(): string {
  return Math.random().toString(RANDOM_STRING_BASE).substr(2, FILE_ID_LENGTH);
}

function getFileDuplicateKey(file: File): string {
  return `${file.name}-${file.size}-${file.type}`;
}

export function SubmissionUploadDialog({
  open,
  onOpenChange,
  onSuccess,
  onRequestTopup,
}: SubmissionUploadDialogProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [userNote, setUserNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [urlGeneratedTime, setUrlGeneratedTime] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState<string>("");
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  
  const filesRef = useRef<Map<string, FileWithProgress>>(new Map());
  const dragCounter = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  // Update ref when files change
  useEffect(() => {
    filesRef.current.clear();
    files.forEach(f => filesRef.current.set(f.id, f));
  }, [files]);

  // Check for URL expiration warning
  useEffect(() => {
    if (!urlGeneratedTime || !uploading) return;
    
    const checkExpiry = setInterval(() => {
      const timeElapsed = Date.now() - urlGeneratedTime;
      const timeRemaining = PRESIGNED_URL_EXPIRY - timeElapsed;
      
      if (timeRemaining < 5 * 60 * 1000 && timeRemaining > 0) {
        setError("Upload URLs will expire soon. Please complete upload or refresh.");
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(checkExpiry);
  }, [urlGeneratedTime, uploading]);

  // Announce completion for screen readers
  useEffect(() => {
    const allCompleted = files.length > 0 && files.every(f => f.status === "completed");
    const hasErrors = files.some(f => f.status === "error");
    
    if (allCompleted) {
      setAnnouncement(`All ${files.length} files uploaded successfully`);
    } else if (hasErrors && !uploading) {
      const errorCount = files.filter(f => f.status === "error").length;
      setAnnouncement(`${errorCount} file${errorCount !== 1 ? 's' : ''} failed to upload`);
    } else if (uploading) {
      const completed = files.filter(f => f.status === "completed").length;
      if (completed > 0) {
        setAnnouncement(`${completed} of ${files.length} files uploaded`);
      }
    }
  }, [files, uploading]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: FileWithProgress[] = [];
    const errors: string[] = [];
    const existingFiles = new Set(files.map(f => getFileDuplicateKey(f.file)));

    Array.from(selectedFiles).forEach((file) => {
      // Check file count
      if (files.length + newFiles.length >= MAX_FILES) {
        errors.push(`Maximum ${MAX_FILES} files allowed.`);
        return;
      }

      // Check for duplicates
      const dupKey = getFileDuplicateKey(file);
      if (existingFiles.has(dupKey)) {
        errors.push(`"${file.name}" is already added.`);
        return;
      }

      // Check file type - normalize MIME type
      let normalizedType = file.type;
      if (file.type === "image/jpg") {
        normalizedType = "image/jpeg";
      }

      if (!ALLOWED_TYPES.includes(normalizedType)) {
        errors.push(`"${file.name}": Invalid file type. Allowed: PDF, JPG, PNG, MP4.`);
        return;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`"${file.name}": File too large. Maximum size is 100MB.`);
        return;
      }

      if (file.size === 0) {
        errors.push(`"${file.name}": File is empty.`);
        return;
      }

      newFiles.push({
        file,
        id: generateFileId(),
        progress: 0,
        status: "pending",
        retryCount: 0,
      });

      existingFiles.add(dupKey);
    });

    if (errors.length > 0) {
      setError(errors.join(" "));
    } else {
      setError(null);
    }

    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles]);
    }
  }, [files]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (uploading) return;

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles) {
      handleFileSelect(droppedFiles);
    }
  }, [uploading, handleFileSelect]);

  const removeFile = useCallback((id: string) => {
    const fileData = filesRef.current.get(id);
    if (fileData?.xhr) {
      fileData.xhr.abort();
    }
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const retryFile = useCallback(async (id: string) => {
    const fileData = files.find(f => f.id === id);
    if (!fileData || !submissionId) return;

    setFiles(prev => prev.map(f => 
      f.id === id ? { ...f, status: "pending" as const, error: undefined, progress: 0 } : f
    ));

    // Re-upload this specific file
    await uploadSingleFile(fileData, submissionId);
  }, [files, submissionId]);

  const uploadSingleFile = async (
    fileWithProgress: FileWithProgress,
    subId: string
  ): Promise<{
    fileName: string;
    fileType: string;
    fileSize: number;
    storageKey: string;
  } | null> => {
    // Generate new presigned URL for this file
    try {
      const createRes = await apiPost<{
        uploadUrls: Array<{
          uploadUrl: string | null;
          storageKey: string;
        }>;
      }>(`/api/submissions/${subId}/presign-single`, {
        files: [{
          fileName: fileWithProgress.file.name,
          fileType: fileWithProgress.file.type === "image/jpg" ? "image/jpeg" : fileWithProgress.file.type,
          fileSize: fileWithProgress.file.size,
        }],
      });

      const uploadInfo = createRes.uploadUrls[0];

      // Update status to uploading
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileWithProgress.id ? { ...f, status: "uploading" as const } : f
        )
      );

      // If no upload URL (S3 not configured), skip upload
      if (!uploadInfo.uploadUrl) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileWithProgress.id
              ? { ...f, status: "completed" as const, progress: 100 }
              : f
          )
        );
        return {
          fileName: fileWithProgress.file.name,
          fileType: fileWithProgress.file.type === "image/jpg" ? "image/jpeg" : fileWithProgress.file.type,
          fileSize: fileWithProgress.file.size,
          storageKey: uploadInfo.storageKey,
        };
      }

      // TypeScript now knows uploadUrl is not null
      const uploadUrl = uploadInfo.uploadUrl;

      // Upload to S3 with progress
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Store XHR for potential cancellation
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileWithProgress.id ? { ...f, xhr } : f
          )
        );

        let lastProgressUpdate = 0;
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const now = Date.now();
            // Throttle progress updates to every 100ms
            if (now - lastProgressUpdate > 100) {
              const progress = Math.round((e.loaded / e.total) * 100);
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === fileWithProgress.id ? { ...f, progress } : f
                )
              );
              lastProgressUpdate = now;
            }
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileWithProgress.id
                  ? { ...f, status: "completed" as const, progress: 100, xhr: undefined }
                  : f
              )
            );
            resolve({
              fileName: fileWithProgress.file.name,
              fileType: fileWithProgress.file.type === "image/jpg" ? "image/jpeg" : fileWithProgress.file.type,
              fileSize: fileWithProgress.file.size,
              storageKey: uploadInfo.storageKey,
            });
          } else {
            const errorMsg = xhr.status === 403 
              ? "Upload URL expired. Please try again."
              : `Upload failed with status ${xhr.status}.`;
            
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileWithProgress.id
                  ? { ...f, status: "error" as const, error: errorMsg, xhr: undefined }
                  : f
              )
            );
            reject(new Error(errorMsg));
          }
        });

        xhr.addEventListener("error", () => {
          const errorMsg = "Network error. Please check your connection and try again.";
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileWithProgress.id
                ? { ...f, status: "error" as const, error: errorMsg, xhr: undefined }
                : f
            )
          );
          reject(new Error(errorMsg));
        });

        xhr.addEventListener("abort", () => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileWithProgress.id
                ? { ...f, status: "pending" as const, progress: 0, xhr: undefined }
                : f
            )
          );
          reject(new Error("Upload cancelled"));
        });

        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", fileWithProgress.file.type);
        xhr.send(fileWithProgress.file);
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to upload file";
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileWithProgress.id
            ? { ...f, status: "error" as const, error: errorMsg }
            : f
        )
      );
      return null;
    }
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      setError("Please select at least one file to upload.");
      return;
    }

    setUploading(true);
    setError(null);
    setQuotaExceeded(false);

    try {
      // Step 1: Create submission and get presigned URLs
      const createRes = await apiPost<{
        submission: { id: string };
        uploadUrls: Array<{
          fileId: string;
          fileName: string;
          uploadUrl: string | null;
          storageKey: string;
        }>;
      }>("/api/submissions", {
        userNote: userNote.trim() || undefined,
        files: files.map((f) => ({
          fileName: f.file.name,
          fileType: f.file.type === "image/jpg" ? "image/jpeg" : f.file.type,
          fileSize: f.file.size,
        })),
      });

      const { submission, uploadUrls } = createRes;
      setSubmissionId(submission.id);
      setUrlGeneratedTime(Date.now());

      // Step 2: Upload files with Promise.allSettled for partial success handling
      const uploadPromises = files.map(async (fileWithProgress, index) => {
        const uploadInfo = uploadUrls[index];
        
        // Update status to uploading
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileWithProgress.id ? { ...f, status: "uploading" as const } : f
          )
        );

        // If no upload URL (S3 not configured), skip upload
        if (!uploadInfo.uploadUrl) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileWithProgress.id
                ? { ...f, status: "completed" as const, progress: 100 }
                : f
            )
          );
          return {
            fileName: fileWithProgress.file.name,
            fileType: fileWithProgress.file.type === "image/jpg" ? "image/jpeg" : fileWithProgress.file.type,
            fileSize: fileWithProgress.file.size,
            storageKey: uploadInfo.storageKey,
          };
        }

        // TypeScript now knows uploadUrl is not null
        const uploadUrl = uploadInfo.uploadUrl;

        // Upload to S3 with progress and retry logic
        let attempts = 0;
        while (attempts <= MAX_RETRY_ATTEMPTS) {
          try {
            return await new Promise<{
              fileName: string;
              fileType: string;
              fileSize: number;
              storageKey: string;
            }>((resolve, reject) => {
              const xhr = new XMLHttpRequest();

              // Store XHR for potential cancellation
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === fileWithProgress.id ? { ...f, xhr, retryCount: attempts } : f
                )
              );

              let lastProgressUpdate = 0;
              xhr.upload.addEventListener("progress", (e) => {
                if (e.lengthComputable) {
                  const now = Date.now();
                  // Throttle progress updates to every 100ms
                  if (now - lastProgressUpdate > 100) {
                    const progress = Math.round((e.loaded / e.total) * 100);
                    setFiles((prev) =>
                      prev.map((f) =>
                        f.id === fileWithProgress.id ? { ...f, progress } : f
                      )
                    );
                    lastProgressUpdate = now;
                  }
                }
              });

              xhr.addEventListener("load", () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                  setFiles((prev) =>
                    prev.map((f) =>
                      f.id === fileWithProgress.id
                        ? { ...f, status: "completed" as const, progress: 100, xhr: undefined }
                        : f
                    )
                  );
                  resolve({
                    fileName: fileWithProgress.file.name,
                    fileType: fileWithProgress.file.type === "image/jpg" ? "image/jpeg" : fileWithProgress.file.type,
                    fileSize: fileWithProgress.file.size,
                    storageKey: uploadInfo.storageKey,
                  });
                } else {
                  reject(new Error(`Upload failed: ${xhr.statusText}`));
                }
              });

              xhr.addEventListener("error", () => {
                reject(new Error("Network error"));
              });

              xhr.addEventListener("abort", () => {
                reject(new Error("Upload cancelled"));
              });

              xhr.open("PUT", uploadUrl);
              xhr.setRequestHeader("Content-Type", fileWithProgress.file.type);
              xhr.send(fileWithProgress.file);
            });
          } catch (err) {
            attempts++;
            if (attempts > MAX_RETRY_ATTEMPTS) {
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === fileWithProgress.id
                    ? { ...f, status: "error" as const, error: `Failed after ${MAX_RETRY_ATTEMPTS} attempts`, xhr: undefined }
                    : f
                )
              );
              throw err;
            }
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
          }
        }
        throw new Error("Max retries exceeded");
      });

      const results = await Promise.allSettled(uploadPromises);
      
      const successful = results
        .filter((r): r is PromiseFulfilledResult<{ fileName: string; fileType: string; fileSize: number; storageKey: string }> => r.status === "fulfilled")
        .map(r => r.value);
      
      const failed = results.filter(r => r.status === "rejected");

      if (successful.length === 0) {
        throw new Error("All file uploads failed. Please check your connection and try again.");
      }

      // Step 3: Confirm upload completion for successful files
      await apiPost(`/api/submissions/${submission.id}/files/complete`, {
        files: successful,
      });

      if (failed.length > 0) {
        setError(`${successful.length} of ${files.length} files uploaded successfully. ${failed.length} failed.`);
        // Don't call onSuccess yet - user can retry failed files
      } else {
        // Success!
        onSuccess();
        
        // Reset form
        setFiles([]);
        setUserNote("");
        setSubmissionId(null);
        setUrlGeneratedTime(null);
      }
    } catch (err) {
      const errWithCode = err as { code?: string; message?: string };
      if (errWithCode?.code === "quota_exceeded") {
        setQuotaExceeded(true);
        setError("You have reached your visual quota for this period.");
      } else {
        const errorMsg = errWithCode?.message ?? (err instanceof Error ? err.message : "Failed to submit files. Please try again.");
        setError(errorMsg);
      }
    } finally {
      setUploading(false);
    }
  };

  const cancelAll = () => {
    files.forEach(f => {
      if (f.xhr) {
        f.xhr.abort();
      }
    });
    setUploading(false);
    setFiles([]);
    setUserNote("");
    setError(null);
    setSubmissionId(null);
    setUrlGeneratedTime(null);
    setQuotaExceeded(false);
    onOpenChange(false);
  };

  const handleClose = () => {
    if (uploading) {
      const confirmed = confirm("Upload in progress. Are you sure you want to cancel?");
      if (confirmed) {
        cancelAll();
      }
    } else {
      setFiles([]);
      setUserNote("");
      setError(null);
      setSubmissionId(null);
      setUrlGeneratedTime(null);
      setQuotaExceeded(false);
      onOpenChange(false);
    }
  };

  const hasErrors = files.some(f => f.status === "error");
  const allCompleted = files.length > 0 && files.every(f => f.status === "completed");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Submission</DialogTitle>
          <DialogDescription>
            Upload documents and media files for admin processing (PDF, JPG, PNG, MP4 • Max 100MB per file)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* File Upload Area */}
          <div>
            <Label>Files (max {MAX_FILES})</Label>
            <div
              role="button"
              tabIndex={0}
              aria-label="Upload files area. Click or drag and drop files here"
              className={`mt-2 border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                isDragging
                  ? "border-lime-400 bg-lime-400/10"
                  : "border-slate-700 hover:border-slate-600"
              }`}
              onClick={() => !uploading && document.getElementById("file-input")?.click()}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !uploading) {
                  e.preventDefault();
                  document.getElementById("file-input")?.click();
                }
              }}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className={`h-8 w-8 mx-auto mb-2 ${isDragging ? "text-lime-400" : "text-slate-400"}`} />
              <p className="text-sm text-slate-300 mb-1">
                {isDragging ? "Drop files here" : "Click to upload or drag and drop"}
              </p>
              <p className="text-xs text-slate-500">
                PDF, JPG, PNG, MP4 (max 100MB per file)
              </p>
              <input
                id="file-input"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.mp4"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
                disabled={uploading}
                aria-label="Select files to upload"
              />
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((fileWithProgress) => (
                <div
                  key={fileWithProgress.id}
                  className="flex items-center gap-3 rounded-lg bg-slate-800/50 p-3"
                >
                  <div className="text-slate-400">
                    {getFileIcon(fileWithProgress.file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-white truncate">
                        {fileWithProgress.file.name}
                      </p>
                      <div className="flex items-center gap-1">
                        {fileWithProgress.status === "error" && fileWithProgress.retryCount < MAX_RETRY_ATTEMPTS && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => retryFile(fileWithProgress.id)}
                            className="h-6 w-6 p-0"
                            title="Retry upload"
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        )}
                        {!uploading && fileWithProgress.status !== "uploading" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFile(fileWithProgress.id)}
                            className="h-6 w-6 p-0"
                            title="Remove file"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-slate-400">
                        {formatFileSize(fileWithProgress.file.size)}
                      </p>
                      {fileWithProgress.status === "completed" && (
                        <CheckCircle className="h-3 w-3 text-green-400" />
                      )}
                      {fileWithProgress.status === "error" && (
                        <AlertCircle className="h-3 w-3 text-red-400" />
                      )}
                      {fileWithProgress.retryCount > 0 && (
                        <span className="text-xs text-slate-500">
                          (Attempt {fileWithProgress.retryCount + 1}/{MAX_RETRY_ATTEMPTS + 1})
                        </span>
                      )}
                    </div>
                    {fileWithProgress.status === "uploading" && (
                      <Progress 
                        value={fileWithProgress.progress} 
                        className="h-1 mt-2"
                        aria-label={`Upload progress for ${fileWithProgress.file.name}: ${fileWithProgress.progress}%`}
                        aria-valuenow={fileWithProgress.progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      />
                    )}
                    {fileWithProgress.error && (
                      <p className="text-xs text-red-400 mt-1" role="alert">{fileWithProgress.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* User Note */}
          <div>
            <Label htmlFor="user-note">Note (optional)</Label>
            <Textarea
              id="user-note"
              placeholder="Add any notes or instructions for the admin..."
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              disabled={uploading}
              className="mt-2"
              rows={3}
              aria-label="Optional note for admin"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-950/30 border border-red-900/50 p-3" role="alert">
              <p className="text-sm text-red-200">{error}</p>
              {quotaExceeded && onRequestTopup && (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3"
                  onClick={onRequestTopup}
                >
                  Buy more visuals
                </Button>
              )}
            </div>
          )}

          {/* Screen Reader Announcements */}
          <div 
            role="status" 
            aria-live="polite" 
            aria-atomic="true"
            className="sr-only"
          >
            {announcement}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClose}>
              {uploading ? "Cancel All" : "Close"}
            </Button>
            {hasErrors && !uploading && (
              <Button onClick={() => {
                // Retry all failed files
                files.filter(f => f.status === "error").forEach(f => retryFile(f.id));
              }}>
                Retry Failed
              </Button>
            )}
            {!allCompleted && (
              <Button onClick={handleSubmit} disabled={uploading || files.length === 0}>
                {uploading ? "Uploading..." : "Submit"}
              </Button>
            )}
            {allCompleted && !uploading && (
              <Button onClick={() => {
                onSuccess();
                setFiles([]);
                setUserNote("");
                setSubmissionId(null);
                setUrlGeneratedTime(null);
                onOpenChange(false);
              }}>
                Done
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
