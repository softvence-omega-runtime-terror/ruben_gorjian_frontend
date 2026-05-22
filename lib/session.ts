import { cookies } from "next/headers";
import { getBackendUrl } from "./server-backend";

export type Session = {
  userId?: string;
  role?: string;
  email?: string;
  name?: string | null;
  isFounder?: boolean;
  emailVerified?: boolean;
  onboardingCompleted?: boolean;
  onboardingStep?: number;
};

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore ? cookieStore.toString() : "";
    const res = await fetch(`${getBackendUrl()}/auth/me`, {
      headers: cookieHeader ? { cookie: cookieHeader } : {},
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    return {
      userId: (data.id ?? data.userId) as string,
      role: data.role as string,
      email: data.email as string,
      name: (data.name ?? null) as string | null,
      isFounder: data.isFounder as boolean,
      emailVerified: data.emailVerified as boolean,
      onboardingCompleted: data.onboardingCompleted as boolean,
      onboardingStep: data.onboardingStep as number,
    };
  } catch {
    return null;
  }
}
