import { NextResponse, type NextRequest } from "next/server";
import { getBackendUrl } from "@/lib/server-backend";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    const query = req.nextUrl.search;

    const response = await fetch(`${getBackendUrl()}/posts/statistics${query}`, {
      headers: {
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      credentials: "include",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Posts statistics proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch post statistics" },
      { status: 500 }
    );
  }
}
