import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getBackendUrl } from "./server-backend";
import { validateReturnTo } from "./return-to";

export type CurrentUser = {
  id?: string;
  email?: string;
  role?: string;
  isFounder?: boolean;
  emailVerified?: boolean;
  onboardingCompleted?: boolean;
  onboardingStep?: number;
  name?: string | null;
  businessName?: string | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore ? cookieStore.toString() : "";
    const res = await fetch(`${getBackendUrl()}/auth/me`, {
      headers: cookieHeader ? { cookie: cookieHeader } : {},
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as CurrentUser;
    return data;
  } catch {
    // network or env misconfig—treat as unauthenticated
    return null;
  }
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || !user.id) {
    // Try to preserve the current path as returnTo
    // Note: This is a server component, so we need to get the path from headers
    const cookieStore = await cookies();
    const pathHeader = cookieStore.get("x-pathname")?.value;
    const returnTo = validateReturnTo(pathHeader) || "/dashboard";
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }
  return user;
}
