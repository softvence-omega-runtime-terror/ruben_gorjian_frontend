import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/server-backend";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = await fetch(`${getBackendUrl()}/auth/resend-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Resend verification proxy error", err);
    return NextResponse.json({ error: "Unable to resend verification" }, { status: 500 });
  }
}
