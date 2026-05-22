import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getBackendUrl } from "@/lib/server-backend";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const response = await fetch(`${getBackendUrl()}/api/providers/upload-post/health`, {
      method: "GET",
      headers: {
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Upload-Post health proxy error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch Upload-Post health status" },
      { status: 500 }
    );
  }
}
