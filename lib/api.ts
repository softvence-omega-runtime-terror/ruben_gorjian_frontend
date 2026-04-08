// Access env vars directly (not through function) so Next.js can replace them at build time
const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "";

function buildUrl(path: string) {
  // Full URLs are used as-is
  if (path.startsWith("http")) return path;

  // /api/* paths are Next.js proxy routes — always keep them relative so the
  // browser hits the Next.js server, which then forwards to the real backend.
  // Never prepend API_BASE_URL here: the backend has no /api/ prefix.
  if (path.startsWith("/api/")) return path;

  // Non-/api/ paths: direct backend calls (rare). Use API_BASE_URL if set.
  if (API_BASE_URL) {
    return `${API_BASE_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  }

  return path;
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  // Bypass ngrok warning page for free accounts
  headers.set("ngrok-skip-browser-warning", "true");

  const res = await fetch(buildUrl(path), {
    credentials: "include",
    ...options,
    headers,
  });

  const contentType = res.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);

  if (!res.ok) {
    const obj = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
    const message =
      (obj && typeof obj.error !== "undefined" && String(obj.error)) ||
      (obj && typeof obj.message !== "undefined" && String(obj.message)) ||
      "Request failed";
    const error = new Error(message) as Error & {
      status?: number;
      code?: string;
      details?: unknown;
    };
    error.status = res.status;
    if (obj) {
      if (typeof obj.code === "string") {
        error.code = obj.code;
      }
      if ("details" in obj) {
        error.details = obj.details;
      }
    }
    throw error;
  }

  return payload as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { cache: "no-store" });
}

export async function apiPost<T, B = unknown>(path: string, body: B): Promise<T> {
  return apiRequest<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function apiPut<T, B = unknown>(path: string, body: B): Promise<T> {
  return apiRequest<T>(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function apiPatch<T, B = unknown>(path: string, body: B): Promise<T> {
  return apiRequest<T>(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function apiDelete<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: "DELETE" });
}
