import { NextResponse } from "next/server";
import { getBackendUrl, getBackendHeaders } from "@/lib/server-backend";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.toString();

    const res = await fetch(`${getBackendUrl()}/api/admin/submissions${query ? `?${query}` : ""}`, {
      headers: await getBackendHeaders(),
      credentials: "include",
    });
    
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Admin submissions listing proxy error", err);
    return NextResponse.json({ error: "Unable to load submissions" }, { status: 500 });
  }
}
