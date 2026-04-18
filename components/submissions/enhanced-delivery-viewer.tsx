 "use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Eye } from "lucide-react";
import { apiGet } from "@/lib/api-client";

type EnhancedDeliveryFile = {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

type EnhancedDelivery = {
  id: string;
  message?: string | null;
  createdAt: string;
  admin?: { id: string; email: string; name?: string | null } | null;
  files: EnhancedDeliveryFile[];
};

type EnhancedDeliveryViewerProps = {
  submissionId: string;
  triggerLabel?: string;
};

type SignedUrlResponse = {
  downloadUrl: string | null;
  fileName: string;
};

function isPreviewable(file: EnhancedDeliveryFile) {
  return file.mimeType.startsWith("image/") || file.mimeType === "application/pdf";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function EnhancedDeliveryViewer({ submissionId, triggerLabel = "View Enhanced Delivery" }: EnhancedDeliveryViewerProps) {
  const [open, setOpen] = useState(false);
  const [deliveries, setDeliveries] = useState<EnhancedDelivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<EnhancedDeliveryFile | null>(null);

  const loadDeliveries = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<{ deliveries: EnhancedDelivery[] }>(`/api/submissions/${submissionId}/enhanced-deliveries`);
      setDeliveries(res.deliveries);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load enhanced delivery.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = async () => {
    setOpen(true);
    await loadDeliveries();
  };

  const getSignedUrl = async (deliveryId: string, fileId: string) => {
    return apiGet<SignedUrlResponse>(`/api/submissions/${submissionId}/enhanced-deliveries/${deliveryId}/files/${fileId}/download`);
  };

  const handlePreview = async (deliveryId: string, file: EnhancedDeliveryFile) => {
    setError(null);
    try {
      const res = await getSignedUrl(deliveryId, file.id);
      if (!res.downloadUrl) {
        throw new Error("Preview not available.");
      }
      setPreviewUrl(res.downloadUrl);
      setPreviewFile(file);
      setPreviewOpen(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to preview file.";
      setError(message);
    }
  };

  const handleDownload = async (deliveryId: string, file: EnhancedDeliveryFile) => {
    setError(null);
    try {
      const res = await getSignedUrl(deliveryId, file.id);
      if (!res.downloadUrl) {
        throw new Error("Download not available.");
      }
      window.open(res.downloadUrl, "_blank", "noopener");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to download file.";
      setError(message);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={handleOpen}>
        {triggerLabel}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enhanced Delivery</DialogTitle>
          </DialogHeader>

          {loading && <p className="text-sm text-slate-400">Loading enhanced delivery...</p>}
          {error && <p className="text-sm text-red-300">{error}</p>}

          {!loading && deliveries.length === 0 && (
            <Card className="border-slate-800 bg-slate-900/60">
              <CardContent className="py-8 text-center text-slate-400">No enhanced deliveries yet.</CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {deliveries.map((delivery) => (
              <div key={delivery.id} className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Delivered {formatDate(delivery.createdAt)}</p>
                  </div>
                </div>
                {delivery.message && (
                  <p className="text-sm text-slate-300 mt-3 whitespace-pre-line">{delivery.message}</p>
                )}
                <div className="mt-4 space-y-2">
                  {delivery.files.map((file) => (
                    <div key={file.id} className="flex flex-col items-start justify-between rounded-md bg-slate-950/40 p-3">
                      <div className="flex-1 mb-5">
                        <p className="text-sm text-lime-500">{file.fileName}</p>
                        <p className="text-xs text-slate-500">{file.mimeType}</p>
                      </div>
                      <div className="flex gap-2">
                          {isPreviewable(file) && (
                            <Button size="sm" variant="outline" onClick={() => handlePreview(delivery.id, file)}>
                              <Eye className="h-3 w-3 mr-1" /> Preview
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => handleDownload(delivery.id, file)}>
                            <Download className="h-3 w-3 mr-1" /> Download
                          </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{previewFile?.fileName || "Preview"}</DialogTitle>
          </DialogHeader>
          <div className="h-[70vh] overflow-auto rounded-md bg-slate-950/60">
            {previewUrl && previewFile?.mimeType.startsWith("image/") && (
              <Image src={previewUrl} alt={previewFile.fileName} width={800} height={600} className="max-w-full h-auto mx-auto" unoptimized />
            )}
            {previewUrl && previewFile?.mimeType === "application/pdf" && (
              <iframe src={previewUrl} title={previewFile.fileName} className="h-full w-full" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

 "use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Eye } from "lucide-react";
import { apiGet } from "@/lib/api-client";

type EnhancedDeliveryFile = {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

type EnhancedDelivery = {
  id: string;
  message?: string | null;
  createdAt: string;
  admin?: { id: string; email: string; name?: string | null } | null;
  files: EnhancedDeliveryFile[];
};

type EnhancedDeliveryViewerProps = {
  submissionId: string;
  triggerLabel?: string;
  isAdmin?: boolean;
};

type SignedUrlResponse = {
  downloadUrl: string | null;
  fileName: string;
};

function isPreviewable(file: EnhancedDeliveryFile) {
  return file.mimeType.startsWith("image/") || file.mimeType === "application/pdf";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function EnhancedDeliveryViewer({ submissionId, triggerLabel = "View Enhanced Delivery", isAdmin = false }: EnhancedDeliveryViewerProps) {
  const [open, setOpen] = useState(false);
  const [deliveries, setDeliveries] = useState<EnhancedDelivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<EnhancedDeliveryFile | null>(null);

  const loadDeliveries = async () => {
    setLoading(true);
    setError(null);
    try {
      const basePath = isAdmin ? `/api/admin/submissions/${submissionId}` : `/api/submissions/${submissionId}`;
      const res = await apiGet<{ deliveries: EnhancedDelivery[] }>(`${basePath}/enhanced-deliveries`);
      setDeliveries(res.deliveries);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load enhanced delivery.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = async () => {
    setOpen(true);
    await loadDeliveries();
  };

  const getSignedUrl = async (deliveryId: string, fileId: string) => {
    const basePath = isAdmin ? `/api/admin/submissions/${submissionId}` : `/api/submissions/${submissionId}`;
    return apiGet<SignedUrlResponse>(`${basePath}/enhanced-deliveries/${deliveryId}/files/${fileId}/download`);
  };

  const handlePreview = async (deliveryId: string, file: EnhancedDeliveryFile) => {
    setError(null);
    try {
      const res = await getSignedUrl(deliveryId, file.id);
      if (!res.downloadUrl) {
        throw new Error("Preview not available.");
      }
      setPreviewUrl(res.downloadUrl);
      setPreviewFile(file);
      setPreviewOpen(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to preview file.";
      setError(message);
    }
  };

  const handleDownload = async (deliveryId: string, file: EnhancedDeliveryFile) => {
    setError(null);
    try {
      const res = await getSignedUrl(deliveryId, file.id);
      if (!res.downloadUrl) {
        throw new Error("Download not available.");
      }
      window.open(res.downloadUrl, "_blank", "noopener");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to download file.";
      setError(message);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={handleOpen}>
        {triggerLabel}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enhanced Delivery</DialogTitle>
          </DialogHeader>

          {loading && <p className="text-sm text-slate-400">Loading enhanced delivery...</p>}
          {error && <p className="text-sm text-red-300">{error}</p>}

          {!loading && deliveries.length === 0 && (
            <Card className="border-slate-800 bg-slate-900/60">
              <CardContent className="py-8 text-center text-slate-400">No enhanced deliveries yet.</CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {deliveries.map((delivery) => (
              <div key={delivery.id} className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Delivered {formatDate(delivery.createdAt)}</p>
                  </div>
                </div>
                {delivery.message && (
                  <p className="text-sm text-slate-300 mt-3 whitespace-pre-line">{delivery.message}</p>
                )}
                <div className="mt-4 space-y-2">
                  {delivery.files.map((file) => (
                    <div key={file.id} className="flex flex-col items-start justify-between rounded-md bg-slate-950/40 p-3">
                      <div className="flex-1 mb-5">
                        <p className="text-sm text-lime-500">{file.fileName}</p>
                        <p className="text-xs text-slate-500">{file.mimeType}</p>
                      </div>
                      <div className="flex gap-2">
                          {isPreviewable(file) && (
                            <Button size="sm" variant="outline" onClick={() => handlePreview(delivery.id, file)}>
                              <Eye className="h-3 w-3 mr-1" /> Preview
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => handleDownload(delivery.id, file)}>
                            <Download className="h-3 w-3 mr-1" /> Download
                          </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{previewFile?.fileName || "Preview"}</DialogTitle>
          </DialogHeader>
          <div className="h-[70vh] overflow-auto rounded-md bg-slate-950/60">
            {previewUrl && previewFile?.mimeType.startsWith("image/") && (
              <Image src={previewUrl} alt={previewFile.fileName} width={800} height={600} className="max-w-full h-auto mx-auto" unoptimized />
            )}
            {previewUrl && previewFile?.mimeType === "application/pdf" && (
              <iframe src={previewUrl} title={previewFile.fileName} className="h-full w-full" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

 "use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Eye } from "lucide-react";
import { apiGet } from "@/lib/api-client";

type EnhancedDeliveryFile = {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

type EnhancedDelivery = {
  id: string;
  message?: string | null;
  createdAt: string;
  admin?: { id: string; email: string; name?: string | null } | null;
  files: EnhancedDeliveryFile[];
};

type EnhancedDeliveryViewerProps = {
  submissionId: string;
  triggerLabel?: string;
  isAdmin?: boolean;
};

type SignedUrlResponse = {
  downloadUrl: string | null;
  fileName: string;
};

function isPreviewable(file: EnhancedDeliveryFile) {
  return file.mimeType.startsWith("image/") || file.mimeType === "application/pdf";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function EnhancedDeliveryViewer({ submissionId, triggerLabel = "View Enhanced Delivery", isAdmin = false }: EnhancedDeliveryViewerProps) {
  const [open, setOpen] = useState(false);
  const [deliveries, setDeliveries] = useState<EnhancedDelivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<EnhancedDeliveryFile | null>(null);

  const loadDeliveries = async () => {
    setLoading(true);
    setError(null);
    try {
      const basePath = isAdmin ? `/api/admin/submissions/${submissionId}` : `/api/submissions/${submissionId}`;
      const res = await apiGet<{ deliveries: EnhancedDelivery[] }>(`${basePath}/enhanced-deliveries`);
      setDeliveries(res.deliveries);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load enhanced delivery.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = async () => {
    setOpen(true);
    await loadDeliveries();
  };

  const getSignedUrl = async (deliveryId: string, fileId: string) => {
    const basePath = isAdmin ? `/api/admin/submissions/${submissionId}` : `/api/submissions/${submissionId}`;
    return apiGet<SignedUrlResponse>(`${basePath}/enhanced-deliveries/${deliveryId}/files/${fileId}/download`);
  };

  const handlePreview = async (deliveryId: string, file: EnhancedDeliveryFile) => {
    setError(null);
    try {
      const res = await getSignedUrl(deliveryId, file.id);
      if (!res.downloadUrl) {
        throw new Error("Preview not available.");
      }
      setPreviewUrl(res.downloadUrl);
      setPreviewFile(file);
      setPreviewOpen(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to preview file.";
      setError(message);
    }
  };

  const handleDownload = async (deliveryId: string, file: EnhancedDeliveryFile) => {
    setError(null);
    try {
      const res = await getSignedUrl(deliveryId, file.id);
      if (!res.downloadUrl) {
        throw new Error("Download not available.");
      }
      
      const response = await fetch(res.downloadUrl);
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Access Denied (403). Backend IAM user 'devkizito' lacks s3:GetObject permission.");
        }
        throw new Error("Network response was not ok");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.fileName || "download";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to download file.";
      setError(message);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={handleOpen}>
        {triggerLabel}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enhanced Delivery</DialogTitle>
          </DialogHeader>

          {loading && <p className="text-sm text-slate-400">Loading enhanced delivery...</p>}
          {error && <p className="text-sm text-red-300">{error}</p>}

          {!loading && deliveries.length === 0 && (
            <Card className="border-slate-800 bg-slate-900/60">
              <CardContent className="py-8 text-center text-slate-400">No enhanced deliveries yet.</CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {deliveries.map((delivery) => (
              <div key={delivery.id} className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Delivered {formatDate(delivery.createdAt)}</p>
                  </div>
                </div>
                {delivery.message && (
                  <p className="text-sm text-slate-300 mt-3 whitespace-pre-line">{delivery.message}</p>
                )}
                <div className="mt-4 space-y-2">
                  {delivery.files.map((file) => (
                    <div key={file.id} className="flex flex-col items-start justify-between rounded-md bg-slate-950/40 p-3">
                      <div className="flex-1 mb-5">
                        <p className="text-sm text-lime-500">{file.fileName}</p>
                        <p className="text-xs text-slate-500">{file.mimeType}</p>
                      </div>
                      <div className="flex gap-2">
                          {isPreviewable(file) && (
                            <Button size="sm" variant="outline" onClick={() => handlePreview(delivery.id, file)}>
                              <Eye className="h-3 w-3 mr-1" /> Preview
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => handleDownload(delivery.id, file)}>
                            <Download className="h-3 w-3 mr-1" /> Download
                          </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{previewFile?.fileName || "Preview"}</DialogTitle>
          </DialogHeader>
          <div className="h-[70vh] overflow-auto rounded-md bg-slate-950/60">
            {previewUrl && previewFile?.mimeType.startsWith("image/") && (
              <Image src={previewUrl} alt={previewFile.fileName} width={800} height={600} className="max-w-full h-auto mx-auto" unoptimized />
            )}
            {previewUrl && previewFile?.mimeType === "application/pdf" && (
              <iframe src={previewUrl} title={previewFile.fileName} className="h-full w-full" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


// test

