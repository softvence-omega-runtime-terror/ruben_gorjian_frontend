import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendUrl } from "@/lib/server-backend";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const res = await fetch(`${getBackendUrl()}/uploads/assets?${searchParams.toString()}`, {
    method: "GET",
    headers: {
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    },
    credentials: "include",
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
