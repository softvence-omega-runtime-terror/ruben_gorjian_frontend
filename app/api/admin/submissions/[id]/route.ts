import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendUrl } from "@/lib/server-backend";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore ? cookieStore.toString() : "";

    const res = await fetch(`${getBackendUrl()}/admin/submissions/${params.id}`, {
      headers: {
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      credentials: "include",
    });
    
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Admin submission details proxy error", err);
    return NextResponse.json({ error: "Unable to load submission" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore ? cookieStore.toString() : "";

    const res = await fetch(`${getBackendUrl()}/admin/submissions/${params.id}`, {
      method: "PATCH",
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
    console.error("Admin submission update proxy error", err);
    return NextResponse.json({ error: "Unable to update submission" }, { status: 500 });
  }
}
