import { NextResponse, type NextRequest } from "next/server";
import { getBackendUrl } from "@/lib/server-backend";
import { cookies } from "next/headers";

export async function GET(_req: NextRequest, context: { params: Promise<{ postId: string }> }) {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    const { postId } = await context.params;

    const res = await fetch(`${getBackendUrl()}/posts/${postId}`, {
      headers: {
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      credentials: "include",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Get post proxy error:", error);
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ postId: string }> }) {
  try {
    const body = await req.json();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    const { postId } = await context.params;

    const res = await fetch(`${getBackendUrl()}/posts/${postId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      credentials: "include",
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Update post proxy error:", error);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ postId: string }> }) {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    const { postId } = await context.params;

    const res = await fetch(`${getBackendUrl()}/posts/${postId}`, {
      method: "DELETE",
      headers: {
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      credentials: "include",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Delete post proxy error:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
