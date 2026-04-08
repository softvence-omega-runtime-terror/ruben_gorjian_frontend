import { cookies } from "next/headers";
import { getBackendUrl } from "@/lib/server-backend";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cookieStore = await cookies();
    const cookieHeader = cookieStore ? cookieStore.toString() : "";

    // Proxy to the admin-specific assets endpoint in the backend
    const res = await fetch(`${getBackendUrl()}/admin/uploads/assets?${searchParams.toString()}`, {
      method: "GET",
      headers: {
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      credentials: "include",
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Admin Media Proxy Error:", errorText);
      return NextResponse.json({ error: "Failed to fetch admin media assets" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Admin Media Proxy Exception:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
