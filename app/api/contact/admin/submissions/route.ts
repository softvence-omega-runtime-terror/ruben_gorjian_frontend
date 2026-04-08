import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/server-backend";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.toString();
    const backendUrl = `${getBackendUrl()}/api/contact/admin/submissions${query ? `?${query}` : ""}`;

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        cookie: req.headers.get("cookie") || "",
      },
    });

    const data = await response.json().catch(() => null);
    return NextResponse.json(data ?? {}, { status: response.status });
  } catch (error) {
    console.error("Support system submissions list proxy error", error);
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
  }
}
