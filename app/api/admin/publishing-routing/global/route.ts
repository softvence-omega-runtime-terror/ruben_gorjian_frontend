import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendUrl } from "@/lib/server-backend";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore ? cookieStore.toString() : "";

    const res = await fetch(`${getBackendUrl()}/admin/publishing-routing/global`, {
      headers: {
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      credentials: "include",
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Admin global publishing routing GET proxy error", err);
    return NextResponse.json({ error: "Unable to load global publishing routing" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore ? cookieStore.toString() : "";

    const res = await fetch(`${getBackendUrl()}/admin/publishing-routing/global`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      credentials: "include",
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Admin global publishing routing PUT proxy error", err);
    return NextResponse.json({ error: "Unable to update global publishing routing" }, { status: 500 });
  }
}
