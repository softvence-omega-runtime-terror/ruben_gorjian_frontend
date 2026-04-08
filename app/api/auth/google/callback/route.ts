import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/server-backend";
import { validateReturnTo, getReturnToFromCookie, clearReturnToCookie } from "@/lib/return-to";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const state = url.searchParams.get("state");

  // Try to get returnTo for error redirects (from state or cookie)
  let errorReturnTo = "/dashboard";
  if (state) {
    try {
      const stateData = JSON.parse(decodeURIComponent(state));
      if (stateData?.returnTo) {
        const validated = validateReturnTo(stateData.returnTo);
        if (validated) errorReturnTo = validated;
      }
    } catch {
      const validated = validateReturnTo(decodeURIComponent(state));
      if (validated) errorReturnTo = validated;
    }
  }
  if (errorReturnTo === "/dashboard") {
    const cookieHeader = req.headers.get("cookie");
    const cookieReturnTo = getReturnToFromCookie(cookieHeader);
    if (cookieReturnTo) errorReturnTo = cookieReturnTo;
  }
  const errorReturnToParam = errorReturnTo !== "/dashboard" ? `&returnTo=${encodeURIComponent(errorReturnTo)}` : "";

  if (error) {
    return NextResponse.redirect(`${url.origin}/login?error=google_auth_failed${errorReturnToParam}`);
  }

  if (!code) {
    return NextResponse.redirect(`${url.origin}/login?error=missing_code${errorReturnToParam}`);
  }

  try {
    // Extract pendingPlanCode from state parameter
    let pendingPlanCode: string | undefined;
    if (state) {
      try {
        const stateData = JSON.parse(decodeURIComponent(state));
        if (stateData?.pendingPlanCode) {
          pendingPlanCode = stateData.pendingPlanCode;
        }
      } catch {
        // If state is not JSON, ignore
      }
    }

    // Exchange code for tokens via backend
    const res = await fetch(`${getBackendUrl()}/auth/google/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        code,
        pendingPlanCode: pendingPlanCode || undefined,
      }),
    });

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || "Authentication failed");
    }

    // Get returnTo from state parameter (primary) or cookie (fallback)
    let returnTo = "/dashboard";
    
    // Try to parse from OAuth state parameter (primary method)
    if (state) {
      try {
        const stateData = JSON.parse(decodeURIComponent(state));
        if (stateData?.returnTo) {
          const validated = validateReturnTo(stateData.returnTo);
          if (validated) returnTo = validated;
        }
      } catch {
        // If state is not JSON, try as direct value (backward compat)
        const validated = validateReturnTo(decodeURIComponent(state));
        if (validated) returnTo = validated;
      }
    }
    
    // Fallback to cookie if state didn't have returnTo (set by server-side redirects)
    if (returnTo === "/dashboard") {
      const cookieHeader = req.headers.get("cookie");
      const cookieReturnTo = getReturnToFromCookie(cookieHeader);
      if (cookieReturnTo) {
        returnTo = cookieReturnTo;
      }
    }

    // Determine final redirect URL
    let redirectUrl: string;
    if (!data.onboardingCompleted) {
      // Preserve returnTo through onboarding
      redirectUrl = `/onboarding?returnTo=${encodeURIComponent(returnTo)}`;
    } else {
      redirectUrl = returnTo;
    }

    const response = NextResponse.redirect(`${url.origin}${redirectUrl}`);
    
    // Set auth cookie from backend response
    if (data.token) {
      response.cookies.set("auth-token", data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
    }

    // Clear returnTo cookie after use
    response.headers.append("Set-Cookie", clearReturnToCookie());

    return response;

  } catch (error) {
    console.error("Google OAuth callback error:", error);
    // Try to preserve returnTo even on error
    let errorReturnTo = "/dashboard";
    if (state) {
      try {
        const stateData = JSON.parse(decodeURIComponent(state));
        if (stateData?.returnTo) {
          const validated = validateReturnTo(stateData.returnTo);
          if (validated) errorReturnTo = validated;
        }
      } catch {
        const validated = validateReturnTo(decodeURIComponent(state));
        if (validated) errorReturnTo = validated;
      }
    }
    if (errorReturnTo === "/dashboard") {
      const cookieHeader = req.headers.get("cookie");
      const cookieReturnTo = getReturnToFromCookie(cookieHeader);
      if (cookieReturnTo) errorReturnTo = cookieReturnTo;
    }
    const errorReturnToParam = errorReturnTo !== "/dashboard" ? `&returnTo=${encodeURIComponent(errorReturnTo)}` : "";
    return NextResponse.redirect(`${url.origin}/login?error=auth_failed${errorReturnToParam}`);
  }
}
