import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session?.userId || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const sessionCookie = req.cookies.get("session")?.value;

    const response = await fetch(
      `${BACKEND_URL}/api/admin/users/${id}/posts/import-google-sheet`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: sessionCookie ? `session=${sessionCookie}` : "",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Google Sheet import proxy error:", error);
    return NextResponse.json(
      { error: "Failed to import Google Sheet" },
      { status: 500 }
    );
  }
}
