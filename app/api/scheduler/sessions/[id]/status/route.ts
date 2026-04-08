import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "http://localhost:4000";

export async function PATCH(
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
    const body = await request.json().catch(() => ({}));
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const res = await fetch(`${BACKEND_URL}/scheduler/sessions/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Cookie: `token=${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => null);

    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
<<<<<<< HEAD
    console.error(`Scheduler Session status ${params.id} PATCH Error:`, error);
=======
    console.error(`Scheduler Session status ${id} PATCH Error:`, error);
>>>>>>> bfa5281 (fix the buidl error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
