import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/server-backend";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const backendUrl = `${getBackendUrl()}/api/contact/admin/submissions/${id}`;

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        cookie: req.headers.get("cookie") || "",
      },
    });

    const data = await response.json().catch(() => null);
    return NextResponse.json(data ?? {}, { status: response.status });
  } catch (error) {
    console.error(`Support submission details proxy error for ID: ${error}`);
    return NextResponse.json({ error: "Failed to fetch submission details" }, { status: 500 });
  }
}
