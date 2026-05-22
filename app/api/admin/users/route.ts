import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendUrl } from "@/lib/server-backend";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.toString();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore ? cookieStore.toString() : "";

    const res = await fetch(`${getBackendUrl()}/admin/users${query ? `?${query}` : ""}`, {
      headers: {
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      credentials: "include",
    });
    const data = await res.json();

    const response = NextResponse.json(data, { status: res.status });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      response.headers.set("set-cookie", setCookie);
    }
    return response;
  } catch (err) {
    console.error("Admin users proxy error", err);
    return NextResponse.json({ error: "Unable to load users" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore ? cookieStore.toString() : "";

    const res = await fetch(`${getBackendUrl()}/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const data = await res.json();

    const response = NextResponse.json(data, { status: res.status });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      response.headers.set("set-cookie", setCookie);
    }
    return response;
  } catch (err) {
    console.error("Admin create user proxy error", err);
    return NextResponse.json({ error: "Unable to create user" }, { status: 500 });
  }
}
