import { NextRequest, NextResponse } from "next/server";
import { validateReturnTo, setReturnToCookie } from "@/lib/return-to";

const AUTH_PATHS = ["/login", "/signup"];
const PROTECTED_PATHS = ["/dashboard", "/onboarding"];

type Session = {
  id?: string;
  email?: string;
  role?: string;
  isFounder?: boolean;
  emailVerified?: boolean;
  onboardingCompleted?: boolean;
  onboardingStep?: number;
  calendarOnboardingCompleted?: boolean;
  visualOnboardingCompleted?: boolean;
  fullManagementOnboardingCompleted?: boolean;
  subscription?: {
    planCode?: string;
    planCategory?: string;
    status?: string;
    priceType?: string;
  } | null;
};

async function fetchSession(req: NextRequest): Promise<Session | null> {
  try {
    const cookieHeader = req.headers.get("cookie");
    const backendBase =
      (process.env.BACKEND_API_URL ?? process.env.ANOTHER_BACKEND_API_URL ?? "http://localhost:4000").replace(
        /\/$/,
        ""
      );
    const res = await fetch(`${backendBase}/auth/me`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      credentials: "include",
    });
    if (!res.ok) return null;
    const data = await res.json() as Session;
    return data;
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const path = url.pathname;
  const authCookie = req.cookies.get("token") || req.cookies.get("auth-token");
  const hasSession = Boolean(authCookie?.value);

  const isAuthPath = AUTH_PATHS.some((p) => path.startsWith(p));
  const isProtected = PROTECTED_PATHS.some((p) => path.startsWith(p));

  // Allow logged-in users to access auth pages if they have a returnTo parameter
  // (e.g., they're trying to checkout and need to re-authenticate)
  if (isAuthPath && hasSession && !url.searchParams.has("returnTo") && !url.searchParams.has("redirect")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isProtected) {
    /* if (!hasSession) {
      // Preserve full URL (path + query + hash) as returnTo
      const fullPath = url.pathname + url.search + url.hash;
      const returnTo = validateReturnTo(fullPath) || "/dashboard";
      const encoded = encodeURIComponent(returnTo);
      const response = NextResponse.redirect(new URL(`/login?returnTo=${encoded}`, req.url));
      // Also set cookie as backup for OAuth flows
      response.headers.append("Set-Cookie", setReturnToCookie(returnTo));
      return response;
    } */

    const session = await fetchSession(req);
    /* if (!session) {
      // Preserve full URL (path + query + hash) as returnTo
      const fullPath = url.pathname + url.search + url.hash;
      const returnTo = validateReturnTo(fullPath) || "/dashboard";
      const encoded = encodeURIComponent(returnTo);
      const response = NextResponse.redirect(new URL(`/login?returnTo=${encoded}`, req.url));
      // Also set cookie as backup for OAuth flows
      response.headers.append("Set-Cookie", setReturnToCookie(returnTo));
      return response;
    } */

    if (session && session.emailVerified === false) {
      return NextResponse.redirect(new URL("/verify", req.url));
    }

    // Check if onboarding is completed (either generic or plan-specific)
    const planCategory = session?.subscription?.planCategory;
    const isOnboardingCompleted = 
      session?.onboardingCompleted ||
      (planCategory === "CALENDAR_ONLY" && session?.calendarOnboardingCompleted) ||
      (planCategory === "VISUAL_ADD_ON" && session?.visualOnboardingCompleted) ||
      (planCategory === "FULL_MANAGEMENT" && session?.fullManagementOnboardingCompleted);

    /* if (!isOnboardingCompleted && !path.startsWith("/onboarding")) {
      const onboardingRoute = "/onboarding";
      return NextResponse.redirect(new URL(onboardingRoute, req.url));
    } */
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/signup", "/dashboard/:path*", "/onboarding/:path*"],
};

// Backward compatibility with older Next middleware export
export const middleware = proxy;
