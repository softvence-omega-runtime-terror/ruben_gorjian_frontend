import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendUrl } from "@/lib/server-backend";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const p = await params;
    const pathString = p.path.join("/");
    
    const cookieStore = await cookies();
    const cookieHeader = cookieStore ? cookieStore.toString() : "";
    
    const res = await fetch(`${getBackendUrl()}/dashboard/overview/${pathString}`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      credentials: "include",
    });
    
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error(`Overview proxy error for subpath`, err);
    return NextResponse.json({ error: "Unable to load data" }, { status: 500 });
  }
}
