import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/server-backend";

async function proxySubmissions(req: NextRequest, path: string[]) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.toString();
    const subPath = path.join("/");
    const backendUrl = `${getBackendUrl()}/api/submissions/${subPath}${query ? `?${query}` : ""}`;

    const contentType = req.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    const body =
      req.method !== "GET" && req.method !== "HEAD"
        ? isJson
          ? await req.json().then(JSON.stringify).catch(() => null)
          : await req.text().catch(() => null)
        : undefined;

    const response = await fetch(backendUrl, {
      method: req.method,
      headers: {
        ...(isJson && body != null ? { "Content-Type": "application/json" } : {}),
        cookie: req.headers.get("cookie") || "",
      },
      ...(body != null ? { body } : {}),
    });

    const data = await response.json().catch(() => null);
    return NextResponse.json(data ?? {}, { status: response.status });
  } catch (error) {
    console.error("Submissions sub-path proxy error", error);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxySubmissions(req, path);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxySubmissions(req, path);
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxySubmissions(req, path);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxySubmissions(req, path);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxySubmissions(req, path);
}
