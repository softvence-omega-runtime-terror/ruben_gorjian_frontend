<<<<<<< HEAD
"use client";

import {
  createContext,
  useMemo,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export type Session = {
  id?: string;
  name?: string | null;
  email?: string;
  role?: string;
  isFounder?: boolean;
  status?: string;
  emailVerified?: boolean;
  emailVerifiedAt?: string | null;
  onboardingCompleted?: boolean;
  onboardingStep?: number;
  calendarOnboardingCompleted?: boolean;
  visualOnboardingCompleted?: boolean;
  fullManagementOnboardingCompleted?: boolean;
  pendingPlanCode?: string | null;
  avatarStorageKey?: string | null;
  avatarUrl?: string | null;
  avatarVersion?: number | null;
  permissions?: string[];
  subscription?: {
    planCode?: string;
    planCategory?: string;
    status?: string;
    priceType?: string;
  } | null;
};

type SessionContextType = {
  session: Session | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/me", {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status !== 401) {
          console.error("[SessionProvider] /api/auth/me failed", {
            status: res.status,
            statusText: res.statusText,
          });
        }
        setSession(null);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setSession(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to load session.";
      console.error("[SessionProvider] /api/auth/me error", { message, err });
      setError(message);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ session, loading, error, refresh }),
    [session, loading, error, refresh]
  );

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSessionContext must be used within a SessionProvider");
  }
  return ctx;
}
=======
"use client";

import {
  createContext,
  useMemo,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export type Session = {
  id?: string;
  name?: string | null;
  email?: string;
  role?: string;
  isFounder?: boolean;
  status?: string;
  emailVerified?: boolean;
  emailVerifiedAt?: string | null;
  onboardingCompleted?: boolean;
  onboardingStep?: number;
  calendarOnboardingCompleted?: boolean;
  visualOnboardingCompleted?: boolean;
  fullManagementOnboardingCompleted?: boolean;
  pendingPlanCode?: string | null;
  avatarStorageKey?: string | null;
  avatarUrl?: string | null;
  avatarVersion?: number | null;
  permissions?: string[];
  subscription?: {
    planCode?: string;
    planCategory?: string;
    status?: string;
    priceType?: string;
  } | null;
};

type SessionContextType = {
  session: Session | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/me", {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status !== 401) {
          console.error("[SessionProvider] /api/auth/me failed", {
            status: res.status,
            statusText: res.statusText,
          });
        }
        setSession(null);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setSession(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to load session.";
      console.error("[SessionProvider] /api/auth/me error", { message, err });
      setError(message);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ session, loading, error, refresh }),
    [session, loading, error, refresh]
  );

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSessionContext must be used within a SessionProvider");
  }
  return ctx;
}
>>>>>>> xerox
