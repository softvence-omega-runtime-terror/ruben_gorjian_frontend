<<<<<<< HEAD
import { NextResponse } from "next/server";
import { getBackendUrl, getBackendHeaders } from "@/lib/server-backend";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const { id, fileId } = await params;

    const res = await fetch(`${getBackendUrl()}/api/admin/submissions/${id}/files/${fileId}/download`, {
      headers: await getBackendHeaders(),
      credentials: "include",
    });
    
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Admin submission file download proxy error", err);
    return NextResponse.json({ error: "Unable to get download link" }, { status: 500 });
  }
}
=======
import { NextResponse } from "next/server";
import { getBackendUrl, getBackendHeaders } from "@/lib/server-backend";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const { id, fileId } = await params;

    const res = await fetch(`${getBackendUrl()}/api/admin/submissions/${id}/files/${fileId}/download`, {
      headers: await getBackendHeaders(),
      credentials: "include",
    });
    
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Admin submission file download proxy error", err);
    return NextResponse.json({ error: "Unable to get download link" }, { status: 500 });
  }
}
>>>>>>> xerox
