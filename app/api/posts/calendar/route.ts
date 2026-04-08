import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/server-backend";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${getBackendUrl()}/posts/calendar${url.search}`, {
      headers: {
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Posts calendar proxy error:", error);
    return NextResponse.json({ error: "Failed to fetch calendar posts" }, { status: 500 });
  }
}
