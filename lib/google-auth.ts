import { getPlanSelection } from "./plan-selection";
import { validateReturnTo } from "./return-to";

/**
 * Utility to handle Google Login with an idToken
 * This is useful when using client-side Google SDKs
 */
export async function loginWithGoogleToken(idToken: string, searchParams?: URLSearchParams) {
  try {
    // Get plan selection from localStorage/query
    const planSelection = getPlanSelection(searchParams);
    const pendingPlanCode = planSelection?.planCode || null;

    const res = await fetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idToken,
        pendingPlanCode,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Google login failed");
    }

    return data;
  } catch (error) {
    console.error("Google login error:", error);
    throw error;
  }
}

/**
 * Handles the redirect logic after a successful Google login
 */
export function handleGoogleLoginRedirect(data: any, returnTo?: string) {
  const validatedReturnTo = validateReturnTo(returnTo) || "/dashboard";
  
  // If user is admin, they might need to go to /admin
  const role = data?.role || data?.user?.role;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  
  const destination = (isAdmin && validatedReturnTo === "/dashboard") ? "/admin" : validatedReturnTo;
  
  window.location.href = destination;
}
