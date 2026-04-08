import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  const session = await getSession();

  if (!session?.userId || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, postId } = await params;
    const sessionCookie = req.cookies.get("session")?.value;

    const response = await fetch(
      `${BACKEND_URL}/api/admin/users/${id}/posts/${postId}/approve`,
      {
        method: "POST",
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
    console.error("Admin post approval error:", error);
    return NextResponse.json(
      { error: "Failed to approve post" },
      { status: 500 }
    );
  }
}
