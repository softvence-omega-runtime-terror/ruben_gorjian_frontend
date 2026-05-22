import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendUrl } from "@/lib/server-backend";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore ? cookieStore.toString() : "";
    const res = await fetch(`${getBackendUrl()}/dashboard/overview`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      credentials: "include",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Overview proxy error", err);
    return NextResponse.json({ error: "Unable to load overview" }, { status: 500 });
  }
}
