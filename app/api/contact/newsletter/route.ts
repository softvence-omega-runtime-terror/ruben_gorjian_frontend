import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string };
    const email = typeof body.email === "string" ? body.email.trim() : "";

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    const backendBase = process.env.BACKEND_API_URL;
    if (!backendBase) {
      return NextResponse.json(
        { error: "Service is not configured." },
        { status: 500 }
      );
    }

    const response = await fetch(
      `${backendBase.replace(/\/$/, "")}/api/contact/newsletter`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      const errMessage =
        errorBody?.error ?? "Unable to subscribe. Please try again.";
      return NextResponse.json(
        { error: errMessage },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Newsletter subscription failed:", err);
    return NextResponse.json(
      { error: "Unable to subscribe right now." },
      { status: 500 }
    );
  }
}
