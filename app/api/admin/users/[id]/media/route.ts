import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session?.userId || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();
    const sessionCookie = req.cookies.get("session")?.value;

    const response = await fetch(
      `${BACKEND_URL}/api/admin/users/${id}/media?${queryString}`,
      {
        method: "GET",
        headers: {
          Cookie: sessionCookie ? `session=${sessionCookie}` : "",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("User media fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user media" },
      { status: 500 }
    );
  }
}
