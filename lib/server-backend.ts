const backendUrl = process.env.BACKEND_API_URL;

export function getBackendUrl() {
  if (!backendUrl) {
    throw new Error("BACKEND_API_URL is not configured");
  }
  return backendUrl.replace(/\/$/, "");
}
