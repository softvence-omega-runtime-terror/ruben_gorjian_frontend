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
    const formData = await request.formData();
    const headers = await getBackendHeaders();

    const res = await fetch(`${getBackendUrl()}/case-studies/${id}`, {
      method: "PATCH",
      headers,
      body: formData,
    });

    return proxyResponse(res);
  } catch (error: any) {
    console.error("Case Studies PATCH Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const headers = await getBackendHeaders();

    const res = await fetch(`${getBackendUrl()}/case-studies/${id}`, {
      method: "DELETE",
      headers,
    });

    return proxyResponse(res);
  } catch (error: any) {
    console.error("Case Studies DELETE Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

