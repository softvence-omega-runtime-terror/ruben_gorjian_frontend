<<<<<<< HEAD
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendUrl } from "@/lib/server-backend";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.toString();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore ? cookieStore.toString() : "";

    const res = await fetch(`${getBackendUrl()}/api/admin/submissions${query ? `?${query}` : ""}`, {
      headers: {
        "ngrok-skip-browser-warning": "true",
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      credentials: "include",
    });
    
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Admin submissions listing proxy error", err);
    return NextResponse.json({ error: "Unable to load submissions" }, { status: 500 });
  }
}
=======
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendUrl } from "@/lib/server-backend";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.toString();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore ? cookieStore.toString() : "";

    const res = await fetch(`${getBackendUrl()}/api/admin/submissions${query ? `?${query}` : ""}`, {
      headers: {
        "ngrok-skip-browser-warning": "true",
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      credentials: "include",
    });
    
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Admin submissions listing proxy error", err);
    return NextResponse.json({ error: "Unable to load submissions" }, { status: 500 });
  }
}
>>>>>>> xerox
