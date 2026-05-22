import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendUrl } from "@/lib/server-backend";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore ? cookieStore.toString() : "";
    const res = await fetch(`${getBackendUrl()}/api/visits/config`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      credentials: "include",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Visits config proxy error", err);
    return NextResponse.json({ error: "Unable to load visit scheduling config" }, { status: 500 });
  }
}
