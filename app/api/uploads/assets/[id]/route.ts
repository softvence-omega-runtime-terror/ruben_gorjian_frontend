import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl, getBackendHeaders } from "@/lib/server-backend";

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
  try {
<<<<<<< HEAD
>>>>>>> bfa5281 (fix the buidl error)
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
=======
    const { id } = await params;
    const headers = await getBackendHeaders();
>>>>>>> 69b6e88 (fix the build error)

    const res = await fetch(`${getBackendUrl()}/uploads/assets/${id}`, {
      method: "DELETE",
      headers,
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
<<<<<<< HEAD
    console.error(`Asset ${params.id} DELETE Error:`, error);
=======
    console.error(`Asset ${id} DELETE Error:`, error);
>>>>>>> bfa5281 (fix the buidl error)
=======
    console.error("Asset DELETE Error:", error);
>>>>>>> 69b6e88 (fix the build error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
