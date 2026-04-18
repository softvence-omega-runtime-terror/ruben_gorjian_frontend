import { NextRequest, NextResponse } from "next/server";
import { getBackendHeaders, getBackendUrl } from "@/lib/server-backend";

async function proxyResponse(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await res.json().catch(() => null);
    return NextResponse.json(data, { status: res.status });
  }
  const text = await res.text().catch(() => "");
  return new NextResponse(text, {
    status: res.status,
    headers: contentType ? { "content-type": contentType } : undefined,
  });
}

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.toString();
    const headers = await getBackendHeaders();
    const url = `${getBackendUrl()}/case-studies${search ? `?${search}` : ""}`;
    const res = await fetch(url, { method: "GET", headers });
    return proxyResponse(res);
  } catch (error: any) {
    console.error("Case Studies GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const headers = await getBackendHeaders();
    const res = await fetch(`${getBackendUrl()}/case-studies`, {
      method: "POST",
      headers,
      body: formData,
    });
    return proxyResponse(res);
  } catch (error: any) {
    console.error("Case Studies POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

