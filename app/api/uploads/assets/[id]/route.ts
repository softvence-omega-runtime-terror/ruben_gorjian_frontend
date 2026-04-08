import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "http://localhost:4000";

export async function DELETE(
  request: NextRequest,
<<<<<<< HEAD
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
=======
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
>>>>>>> bfa5281 (fix the buidl error)
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const res = await fetch(`${BACKEND_URL}/uploads/assets/${id}`, {
      method: "DELETE",
      headers: {
        ...(token ? { Cookie: `token=${token}` } : {}),
      },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: data.error || "Failed to delete asset" },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
<<<<<<< HEAD
    console.error(`Asset ${params.id} DELETE Error:`, error);
=======
    console.error(`Asset ${id} DELETE Error:`, error);
>>>>>>> bfa5281 (fix the buidl error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
