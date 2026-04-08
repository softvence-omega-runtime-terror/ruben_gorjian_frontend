import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendUrl } from "@/lib/server-backend";

export async function GET(
  req: Request,
  { params }: { params: { id: string; fileId: string } }
) {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore ? cookieStore.toString() : "";

    const res = await fetch(`${getBackendUrl()}/admin/submissions/${params.id}/files/${params.fileId}/download`, {
      headers: {
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      credentials: "include",
    });
    
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Admin submission file download proxy error", err);
    return NextResponse.json({ error: "Unable to get download link" }, { status: 500 });
  }
}
