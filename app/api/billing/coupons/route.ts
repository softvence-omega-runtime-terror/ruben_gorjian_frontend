import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendUrl } from "@/lib/server-backend";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore ? cookieStore.toString() : "";

    // The user confirmed that /admin/coupons is the final route
    const res = await fetch(`${getBackendUrl()}/admin/coupons`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      credentials: "include",
    });

    if (!res.ok) {
      console.error(`Coupons API (/admin/coupons) returned ${res.status}: ${res.statusText}`);
      const errorText = await res.text();
      console.error(`Error body: ${errorText}`);
      return NextResponse.json({ error: "Failed to fetch coupons from backend" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Coupons proxy error", err);
    return NextResponse.json({ error: "Unable to fetch coupons" }, { status: 500 });
  }
}
