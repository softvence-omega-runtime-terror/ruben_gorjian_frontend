"use client";

import { useEffect, useState, useRef, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSessionContext } from "@/context/SessionContext";
import { Button } from "@/components/ui/button";

function BillingSuccessContent() {
  const { refresh, session } = useSessionContext();
  useSearchParams(); // presence triggers re-render when query changes
  const [checking, setChecking] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const retriesRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Exponential backoff delays: 1s, 2s, 4s, 8s, 16s (total ~31s, 5 checks)
  const BACKOFF_DELAYS = [1000, 2000, 4000, 8000, 16000];

  // Manual sync function
  const syncSubscription = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/billing/sync", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await refresh();
      }
    } catch (err) {
      console.error("Failed to sync subscription", err);
    } finally {
      setSyncing(false);
    }
  }, [refresh]);

  useEffect(() => {
    // Immediately sync subscription from Stripe on page load
    syncSubscription();

    const checkSubscription = async () => {
      await refresh();
    };

    // Initial check
    checkSubscription();

    // Schedule subsequent checks with exponential backoff
    const scheduleNext = (attempt: number) => {
      if (attempt >= BACKOFF_DELAYS.length) {
        setChecking(false);
        return;
      }
      timeoutRef.current = setTimeout(async () => {
        retriesRef.current = attempt + 1;
        await checkSubscription();
        scheduleNext(attempt + 1);
      }, BACKOFF_DELAYS[attempt]);
    };

    scheduleNext(0);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [refresh, syncSubscription]);

  // Check session status after refresh
  useEffect(() => {
    const isActive =
      session?.subscription?.status === "ACTIVE" ||
      session?.subscription?.status === "TRIALING";

    if (isActive && checking) {
      setChecking(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  }, [session, checking]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="max-w-lg w-full rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center shadow-xl">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-lime-400/10 border-2 border-lime-400 flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-lime-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white">
            Payment Successful!
          </h1>
          <p className="mt-3 text-sm text-slate-300">
            {checking
              ? "Activating your subscription..."
              : session?.subscription?.status === "ACTIVE" ||
                  session?.subscription?.status === "TRIALING"
                ? "Your subscription is now active. Welcome to Talexia!"
                : "Your payment was successful. Your subscription will be activated shortly."}
          </p>
          {checking && (
            <div className="mt-4 flex flex-col items-center justify-center gap-2">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-400">Processing...</span>
              </div>
              {!syncing && retriesRef.current >= 2 && (
                <Button
                  onClick={syncSubscription}
                  size="sm"
                  variant="outline"
                  className="mt-2 text-xs"
                >
                  Sync Subscription Status
                </Button>
              )}
            </div>
          )}
          {syncing && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="h-4 w-4 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-400">
                Syncing with Stripe...
              </span>
            </div>
          )}
        </div>

        <div className="bg-slate-800/50 rounded-lg p-4 mb-6 text-left">
          <p className="text-xs font-semibold text-lime-400 uppercase tracking-wide mb-2">
            Next Steps
          </p>
          <ol className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-lime-400 font-semibold">1.</span>
              <span>
                Connect your social media accounts (Instagram, Facebook,
                LinkedIn)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lime-400 font-semibold">2.</span>
              <span>
                Upload your content or let our AI create visuals for you
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lime-400 font-semibold">3.</span>
              <span>
                Schedule your posts and watch your social presence grow
              </span>
            </li>
          </ol>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {session?.onboardingCompleted ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full bg-lime-500 px-8 py-4 text-base font-bold text-slate-950 hover:bg-lime-400 shadow-[0_0_20px_rgba(132,204,22,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Go to Dashboard
            </Link>
          ) : (
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center rounded-full bg-lime-500 px-8 py-4 text-base font-bold text-slate-950 hover:bg-lime-400 shadow-[0_0_20px_rgba(132,204,22,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Start Onboarding
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
          <div className="max-w-lg w-full rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center shadow-xl">
            <div className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-slate-400">Loading...</span>
            </div>
          </div>
        </div>
      }
    >
      <BillingSuccessContent />
    </Suspense>
  );
}
