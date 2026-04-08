import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/server-backend";

export async function POST(req: NextRequest) {
  try {
    const res = await fetch(`${getBackendUrl()}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: {
        // Forward the user's session cookie so the backend can clear it
        cookie: req.headers.get("cookie") ?? "",
      },
    });
    const data = await res.json();
    const response = NextResponse.json(data, { status: res.status });
    
    // Forward set-cookie headers from backend
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      response.headers.set("set-cookie", setCookie);
    }
    
    // Also clear cookies on the frontend side to ensure they're removed
    // This handles cases where the backend response doesn't properly clear them
    response.cookies.delete("token");
    response.cookies.delete("auth-token");
    
    return response;
  } catch (err) {
    console.error("Logout proxy error", err);
    return NextResponse.json({ error: "Unable to logout" }, { status: 500 });
  }
}
