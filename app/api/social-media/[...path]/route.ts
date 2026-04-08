import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendUrl } from "@/lib/server-backend";

async function proxyRequest(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: pathSegments } = await params;
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    const path = pathSegments.join("/");
    const query = request.nextUrl.search;
    const url = `${getBackendUrl()}/api/social-media/${path}${query}`;
    
    console.log(`Proxying ${request.method} to: ${url}`);
    
    const method = request.method;
    let body: any = undefined;
    
    if (method !== "GET" && method !== "HEAD") {
      try {
        const text = await request.text();
        if (text) {
          body = JSON.parse(text);
        }
      } catch (e) {
        console.warn("Failed to parse request body as JSON", e);
      }
    }

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } else {
      const text = await res.text();
      return new NextResponse(text, { status: res.status });
    }
  } catch (error) {
    console.error(`Social Media Proxy Error (${request.method}):`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
export const PATCH = proxyRequest;
