 "use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, FileText, Image, Upload, X } from "lucide-react";
import { apiPost } from "@/lib/api-client";

const MAX_FILES = 10;
const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "application/zip",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

type UploadStatus = "pending" | "uploading" | "completed" | "error";

type EnhancedFile = {
  id: string;
  file: File;
  progress: number;
  status: UploadStatus;
  error?: string;
  storageKey?: string;
  xhr?: XMLHttpRequest;
};

type EnhancedDeliveryComposerProps = {
  submissionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSent?: () => void;
};

function getFileIcon(fileType: string) {
  // Lucide Image icon (decorative SVG; LucideProps has no alt)
  if (fileType.startsWith("image/")) return <Image className="h-4 w-4" aria-hidden />; // eslint-disable-line jsx-a11y/alt-text
  return <FileText className="h-4 w-4" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function EnhancedDeliveryComposer({
  submissionId,
  open,
  onOpenChange,
  onSent,
}: EnhancedDeliveryComposerProps) {
  const [files, setFiles] = useState<EnhancedFile[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const filesRef = useRef<Map<string, EnhancedFile>>(new Map());

  useEffect(() => {
    filesRef.current.clear();
    files.forEach((file) => filesRef.current.set(file.id, file));
  }, [files]);

  const canSend = useMemo(() => files.length > 0 && !uploading, [files.length, uploading]);

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles || uploading) return;
    const errors: string[] = [];
    const nextFiles: EnhancedFile[] = [];
    const existingKeys = new Set(files.map((file) => `${file.file.name}-${file.file.size}`));

    Array.from(selectedFiles).forEach((file) => {
      if (files.length + nextFiles.length >= MAX_FILES) {
        errors.push(`Maximum ${MAX_FILES} files allowed.`);
        return;
      }

      const key = `${file.name}-${file.size}`;
      if (existingKeys.has(key)) {
        errors.push(`"${file.name}" is already added.`);
        return;
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`"${file.name}" is not an allowed type.`);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`"${file.name}" exceeds 100MB.`);
        return;
      }

      nextFiles.push({
        id: crypto.randomUUID(),
        file,
        progress: 0,
        status: "pending",
      });
      existingKeys.add(key);
    });

    setError(errors.length ? errors.join(" ") : null);
    if (nextFiles.length > 0) {
      setFiles((prev) => [...prev, ...nextFiles]);
    }
  }, [files, uploading]);

  const removeFile = useCallback((id: string) => {
    const fileData = filesRef.current.get(id);
    if (fileData?.xhr) {
      fileData.xhr.abort();
    }
    setFiles((prev) => prev.filter((file) => file.id !== id));
  }, []);

  const resetState = () => {
    setFiles([]);
    setMessage("");
    setError(null);
    setUploading(false);
    setConfirming(false);
  };

  const uploadFiles = async (uploadUrls: Array<{ fileId: string; uploadUrl: string | null; storageKey: string }>) => {
    const results = await Promise.allSettled(
      files.map((fileItem, index) => {
        const uploadInfo = uploadUrls[index];
        const normalizedType = fileItem.file.type === "image/jpg" ? "image/jpeg" : fileItem.file.type;

        if (!uploadInfo) {
          const errorMsg = "Upload configuration missing for this file.";
          setFiles((prev) =>
            prev.map((file) =>
              file.id === fileItem.id ? { ...file, status: "error", error: errorMsg } : file
            )
          );
          return Promise.reject(new Error(errorMsg));
        }

        setFiles((prev) =>
          prev.map((file) => (file.id === fileItem.id ? { ...file, status: "uploading" } : file))
        );

        const uploadUrl = uploadInfo.uploadUrl;
        if (!uploadUrl) {
          setFiles((prev) =>
            prev.map((file) =>
              file.id === fileItem.id
                ? { ...file, status: "completed", progress: 100, storageKey: uploadInfo.storageKey }
                : file
            )
          );
          return Promise.resolve({ ...fileItem, storageKey: uploadInfo.storageKey, mimeType: normalizedType });
        }

        return new Promise<{ file: File; storageKey: string; mimeType: string }>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          setFiles((prev) =>
            prev.map((file) => (file.id === fileItem.id ? { ...file, xhr } : file))
          );

          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              setFiles((prev) =>
                prev.map((file) => (file.id === fileItem.id ? { ...file, progress } : file))
              );
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              setFiles((prev) =>
                prev.map((file) =>
                  file.id === fileItem.id
                    ? { ...file, status: "completed", progress: 100, storageKey: uploadInfo.storageKey }
                    : file
                )
              );
              resolve({ file: fileItem.file, storageKey: uploadInfo.storageKey, mimeType: normalizedType });
            } else {
              const errorMsg = `Upload failed (${xhr.status}).`;
              setFiles((prev) =>
                prev.map((file) =>
                  file.id === fileItem.id ? { ...file, status: "error", error: errorMsg } : file
                )
              );
              reject(new Error(errorMsg));
            }
          });

          xhr.addEventListener("error", () => {
            const errorMsg = "Upload failed. Please check your connection.";
            setFiles((prev) =>
              prev.map((file) =>
                file.id === fileItem.id ? { ...file, status: "error", error: errorMsg } : file
              )
            );
            reject(new Error(errorMsg));
          });

          xhr.open("PUT", uploadUrl);
          xhr.setRequestHeader("Content-Type", normalizedType);
          xhr.send(fileItem.file);
        });
      })
    );

    const successful = results
      .filter((result): result is PromiseFulfilledResult<{ file: File; storageKey: string; mimeType: string }> => result.status === "fulfilled")
      .map((result) => result.value);

    const failed = results.filter((result) => result.status === "rejected");

    return { successful, failed };
  };

  const handleSend = async () => {
    if (!canSend) {
      setError("Please attach at least one file.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const createRes = await apiPost<{
        delivery: { id: string };
        uploadUrls: Array<{ fileId: string; uploadUrl: string | null; storageKey: string }>;
      }>(`/api/admin/submissions/${submissionId}/enhanced-deliveries`, {
        message: message.trim() || undefined,
        files: files.map((file) => ({
          fileName: file.file.name,
          mimeType: file.file.type === "image/jpg" ? "image/jpeg" : file.file.type,
          size: file.file.size,
        })),
      });

      const { delivery, uploadUrls } = createRes;
      const { successful, failed } = await uploadFiles(uploadUrls);

      if (successful.length === 0) {
        throw new Error("All file uploads failed. Please try again.");
      }

      await apiPost(`/api/admin/submissions/${submissionId}/enhanced-deliveries/${delivery.id}/complete`, {
        files: successful.map((item) => ({
          fileName: item.file.name,
          mimeType: item.mimeType,
          size: item.file.size,
          storageKey: item.storageKey,
        })),
      });

      if (failed.length > 0) {
        setError(`${successful.length} files sent. ${failed.length} failed to upload.`);
      } else {
        resetState();
        onSent?.();
        onOpenChange(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send enhanced delivery.";
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (uploading) return;
    resetState();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send Enhanced Version</DialogTitle>
          <DialogDescription>Upload enhanced files and include a message for the client.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Enhanced Files</Label>
            <div
              className="mt-2 rounded-lg border border-dashed border-slate-700 p-6 text-center cursor-pointer hover:border-slate-500"
              onClick={() => !uploading && document.getElementById("enhanced-upload-input")?.click()}
            >
              <Upload className="mx-auto h-6 w-6 text-slate-400 mb-2" />
              <p className="text-sm text-slate-300">Click to upload files</p>
              <p className="text-xs text-slate-500">PDF, DOCX, ZIP, JPG, PNG (max 100MB)</p>
              <input
                id="enhanced-upload-input"
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.zip,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(event) => handleFileSelect(event.target.files)}
                disabled={uploading}
              />
            </div>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((fileItem) => (
                <div key={fileItem.id} className="flex items-center gap-3 rounded-lg bg-slate-900/60 p-3">
                  <div className="text-slate-400">{getFileIcon(fileItem.file.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-white truncate">{fileItem.file.name}</p>
                      {!uploading && (
                        <Button variant="ghost" size="sm" onClick={() => removeFile(fileItem.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{formatFileSize(fileItem.file.size)}</p>
                    {fileItem.status === "uploading" && <Progress value={fileItem.progress} className="h-1 mt-2" />}
                    {fileItem.status === "completed" && (
                      <p className="text-xs text-green-400 flex items-center gap-1 mt-1">
                        <CheckCircle className="h-3 w-3" /> Uploaded
                      </p>
                    )}
                    {fileItem.status === "error" && (
                      <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" /> {fileItem.error}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div>
            <Label htmlFor="enhanced-message">Message</Label>
            <Textarea
              id="enhanced-message"
              rows={4}
              placeholder="Summarize the enhancements and next steps..."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              disabled={uploading}
              className="mt-2"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={uploading}>
              Cancel
            </Button>
            {!confirming ? (
              <Button onClick={() => setConfirming(true)} disabled={!canSend}>
                Review & Send
              </Button>
            ) : (
              <Button onClick={handleSend} disabled={uploading}>
                {uploading ? "Sending..." : "Confirm Send"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
