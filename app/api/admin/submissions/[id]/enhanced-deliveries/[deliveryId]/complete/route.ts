import { NextResponse } from "next/server";
import { getBackendUrl, getBackendHeaders } from "@/lib/server-backend";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; deliveryId: string }> }
) {
  try {
    const { id, deliveryId } = await params;
    const body = await req.json();

    const res = await fetch(`${getBackendUrl()}/api/admin/submissions/${id}/enhanced-deliveries/${deliveryId}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await getBackendHeaders()),
      },
      credentials: "include",
      body: JSON.stringify(body),
    });
    
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Admin enhanced delivery completion proxy error", err);
    return NextResponse.json({ error: "Unable to complete enhanced delivery" }, { status: 500 });
  }
}
