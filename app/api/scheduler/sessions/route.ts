<<<<<<< HEAD
<<<<<<< HEAD
import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl, getBackendHeaders } from "@/lib/server-backend";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const headers = await getBackendHeaders();

    const res = await fetch(`${getBackendUrl()}/scheduler/sessions`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => null);

    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error("Scheduler Sessions POST Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
=======
import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl, getBackendHeaders } from "@/lib/server-backend";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const headers = await getBackendHeaders();

    const res = await fetch(`${getBackendUrl()}/scheduler/sessions`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => null);

    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error("Scheduler Sessions POST Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
>>>>>>> c9fef90 (fix the type issues in the sessions route.ts)
=======
import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl, getBackendHeaders } from "@/lib/server-backend";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const headers = await getBackendHeaders();

    const res = await fetch(`${getBackendUrl()}/scheduler/sessions`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => null);

    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error("Scheduler Sessions POST Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
>>>>>>> xerox
