import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendUrl } from "@/lib/server-backend";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore ? cookieStore.toString() : "";
    
    const res = await fetch(`${getBackendUrl()}/billing/scheduled-change/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      credentials: "include",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Billing scheduled-change cancel proxy error", err);
    return NextResponse.json({ error: "Unable to cancel scheduled change" }, { status: 500 });
  }
}
