<<<<<<< HEAD
import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/server-backend";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const backendUrl = `${getBackendUrl()}/api/contact/admin/submissions/${id}/status`;

    const response = await fetch(backendUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        cookie: req.headers.get("cookie") || "",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => null);
    return NextResponse.json(data ?? {}, { status: response.status });
  } catch (error) {
    console.error(`Support submission status proxy error for ID: ${id}: ${error}`);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
=======
import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/server-backend";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const backendUrl = `${getBackendUrl()}/api/contact/admin/submissions/${id}/status`;

    const response = await fetch(backendUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        cookie: req.headers.get("cookie") || "",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => null);
    return NextResponse.json(data ?? {}, { status: response.status });
  } catch (error) {
    console.error(`Support submission status proxy error for ID: ${id}: ${error}`);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
>>>>>>> bfa5281 (fix the buidl error)
