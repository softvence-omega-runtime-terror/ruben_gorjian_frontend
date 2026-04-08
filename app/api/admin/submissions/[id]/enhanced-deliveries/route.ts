import { NextResponse } from "next/server";
import { getBackendUrl, getBackendHeaders } from "@/lib/server-backend";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const res = await fetch(`${getBackendUrl()}/api/admin/submissions/${id}/enhanced-deliveries`, {
      headers: await getBackendHeaders(),
      credentials: "include",
    });
    
    const data = await res.json();
    // Return only the deliveries array if it exists, otherwise return the data as is
    const result = data.deliveries || data;
    return NextResponse.json(result, { status: res.status });
  } catch (err) {
    console.error("Admin enhanced deliveries fetch proxy error", err);
    return NextResponse.json({ error: "Unable to load enhanced deliveries" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const res = await fetch(`${getBackendUrl()}/api/admin/submissions/${id}/enhanced-deliveries`, {
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
    console.error("Admin enhanced delivery creation proxy error", err);
    return NextResponse.json({ error: "Unable to create enhanced delivery" }, { status: 500 });
  }
}
