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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const headers = await getBackendHeaders();
    headers["Content-Type"] = "application/json";

    const res = await fetch(`${getBackendUrl()}/case-studies/${id}/status`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });

    return proxyResponse(res);
  } catch (error: any) {
    console.error("Case Studies status PATCH Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

