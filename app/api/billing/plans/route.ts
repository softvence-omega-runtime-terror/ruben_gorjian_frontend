import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/server-backend";

export async function GET() {
  try {
    const res = await fetch(`${getBackendUrl()}/billing/plans`, {
      cache: "no-store",
    });
    // console.log("Plans", res);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Failed to fetch plans from backend", err);
    return NextResponse.json({ error: "Unable to load plans" }, { status: 500 });
  }
}
