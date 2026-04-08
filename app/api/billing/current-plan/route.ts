import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendUrl } from "@/lib/server-backend";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore ? cookieStore.toString() : "";
    
    const res = await fetch(`${getBackendUrl()}/billing/current-plan`, {
      headers: {
        "ngrok-skip-browser-warning": "true",
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      credentials: "include",
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(errorData, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Billing current-plan proxy error", err);
    return NextResponse.json({ error: "Unable to load plan details" }, { status: 500 });
  }
}
