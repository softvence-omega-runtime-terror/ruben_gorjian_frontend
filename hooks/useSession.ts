"use client";

import { useCallback, useEffect, useState, useMemo } from "react";


type Session = {
  id?: string;
  email?: string;
  role?: string;
  isFounder?: boolean;
  emailVerified?: boolean;
  onboardingCompleted?: boolean;
};

type SessionState = {
  loading: boolean;
  session: Session | null;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useSession(): SessionState {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" });
      if (!res.ok) {
        setSession(null);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setSession(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unable to load session.";
      setError(message);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return useMemo(() => ({ loading, session, error, refresh: fetchSession }), [loading, session, error, fetchSession]);
}

