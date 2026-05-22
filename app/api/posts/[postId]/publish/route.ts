import { NextResponse, type NextRequest } from "next/server";
import { getBackendUrl } from "@/lib/server-backend";
import { cookies } from "next/headers";

export async function POST(_req: NextRequest, context: { params: Promise<{ postId: string }> }) {
  try {
     const { postId } = await context.params;
      const cookieStore = await cookies();
      const cookieHeader = cookieStore.toString();

    // const res = await fetch(`${getBackendUrl()}/posts/${params.postId}/publish`, {
    //   method: "POST",
    //   headers: {
    //     ...(cookieHeader ? { cookie: cookieHeader } : {}),
    //   },
    //   credentials: "include",
    // });
      const res = await fetch(`${getBackendUrl()}/posts/${postId}/publish`, {
        method: "POST",
        headers: cookieHeader ? { cookie: cookieHeader } : {},
        credentials: "include",
      });


    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Publish post proxy error:", error);
    return NextResponse.json({ error: "Failed to publish post" }, { status: 500 });
  }
}
