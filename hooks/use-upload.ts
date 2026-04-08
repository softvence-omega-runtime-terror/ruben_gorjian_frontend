import { useState } from "react";

interface PresignResponse {
  uploadUrl: string | null;
  storageKey: string;
  message?: string;
}

interface FinalizeResponse {
  asset: { id: string; storageKey: string };
}

export function useUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presign = async (fileName: string, contentType?: string) => {
    const res = await fetch("/api/uploads/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ fileName, contentType }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to presign upload");
    }
    return (await res.json()) as PresignResponse;
  };

  const createAssetRecord = async (storageKey: string, contentType?: string) => {
    const res = await fetch("/api/uploads/asset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ storageKey, contentType }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to save asset");
    }
    const json = (await res.json()) as FinalizeResponse;
    return json.asset;
  };

  const uploadFile = async (file: File): Promise<FinalizeResponse["asset"]> => {
    setUploading(true);
    setError(null);
    try {
      const presignResp = await presign(file.name, file.type);
      // If uploadUrl is null (stubbed), just return the storageKey
      if (!presignResp.uploadUrl) {
        const asset = await createAssetRecord(presignResp.storageKey, file.type);
        return asset;
      }

      const res = await fetch(presignResp.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });
      if (!res.ok) {
        throw new Error(`Upload failed: ${res.statusText}`);
      }
      const asset = await createAssetRecord(presignResp.storageKey, file.type);
      return asset;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return { uploadFile, uploading, error };
}
