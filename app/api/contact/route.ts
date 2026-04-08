import { NextResponse } from "next/server";

interface ContactPayload {
  fullName?: string;
  businessName?: string;
  email?: string;
  websiteOrHandle?: string | null;
  interests?: string[];
  postsPerMonth?: string;
  message?: string | null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ContactPayload;
    const { fullName, businessName, email, websiteOrHandle, interests, postsPerMonth, message } = body;

    if (!fullName || !businessName || !email) {
      return NextResponse.json(
        { error: "Full name, business name, and email are required." },
        { status: 400 }
      );
    }

    const backendBase = process.env.BACKEND_API_URL;
    if (!backendBase) {
      return NextResponse.json(
        { error: "Backend API is not configured." },
        { status: 500 }
      );
    }

    const payload = {
      fullName,
      businessName,
      email,
      websiteOrHandle,
      interests: Array.isArray(interests) ? interests : [],
      postsPerMonth,
      message,
      source: "landing",
    };

    const response = await fetch(
      `${backendBase.replace(/\/$/, "")}/api/contact`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      const errMessage =
        errorBody?.error ||
        "Unable to submit contact form. Please try again.";
      return NextResponse.json({ error: errMessage }, { status: response.status });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact form submission failed:", err);
    return NextResponse.json({ error: "Unable to send message right now." }, { status: 500 });
  }
}
