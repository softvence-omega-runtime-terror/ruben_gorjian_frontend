import { cookies } from "next/headers"

const backendUrl = process.env.BACKEND_API_URL;

export function getBackendUrl() {
  if (!backendUrl) {
    throw new Error("BACKEND_API_URL is not configured");
  }
  return backendUrl.replace(/\/$/, "");
}

export async function getBackendHeaders() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  
  return {
    "Content-Type": "application/json",
    ...(token ? { Cookie: `token=${token}` } : {}),
  }
}
