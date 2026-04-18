"use client";
import { FormEvent, Suspense, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { GoogleLoginButton } from "@/components/google-login-button";
import { getReturnToFromQuery } from "@/lib/return-to";

function SignupPageInner() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const returnTo = getReturnToFromQuery(searchParams, "/dashboard");

  // Store returnTo in sessionStorage for after email verification
  if (typeof window !== "undefined" && returnTo !== "/dashboard") {
    sessionStorage.setItem("signup_return_to", returnTo);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");

    // Get plan selection from localStorage or query params
    const { getPlanSelection } = await import("@/lib/plan-selection");
    const planSelection = getPlanSelection(searchParams);
    const pendingPlanCode = planSelection?.planCode || null;

  

    // If no plan selected, redirect to pricing
    if (!pendingPlanCode) {
      setError("Please select a plan to continue.");
      setSubmitting(false);
      // Redirect to pricing after a short delay
      setTimeout(() => {
        window.location.href = "/pricing";
      }, 2000);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          pendingPlanCode,
        }),
      });
      const body = await res.json();

      if (!res.ok) {
        throw new Error(body?.error || "Unable to sign up.");
      }

      setSuccess(
        "Account created. Check your email for the verification link to continue.",
      );
      // Do not redirect until verified; verification email contains link.
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unable to sign up.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-primary text-primary p-6 shadow-xl">
        <h1 className="text-2xl font-semibold sora ">Create account</h1>
        <p className="mt-2 text-sm">
          Create your account. We&apos;ll send you an email to verify before you
          pick a plan.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-primary">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-md border border-emerald-500/60 bg-emerald-500/10 px-3 py-2 text-xs text-primary">
              {success}
            </div>
          )}

          <div className="space-y-1">
            <label
              htmlFor="email"
              className="text-xs font-semibold uppercase tracking-wide"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-primary  px-3 py-2 text-sm outline-none ring-primary0 focus:border-primary focus:ring-2"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="password"
              className="text-xs font-semibold uppercase tracking-wide"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                minLength={8}
                required
                className="w-full rounded-lg border border-primary px-3 py-2 text-sm outline-none ring-primary focus:border-border focus:ring-2 pr-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-primary/50 hover:text-primary transition-colors focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary transition disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Creating..." : "Create account"}
          </button>
          <div className="mt-6">
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-primary">or</span>
              </div>
            </div>
            <GoogleLoginButton returnTo={returnTo} />
          </div>
        </form>

        <p className="mt-4 text-sm text-primary text-center">
          Already have an account?{" "}
          <Link
            className="text-primary underline underline-offset-2"
            href={`/login?returnTo=${encodeURIComponent(returnTo)}`}
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white text-primary flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <SignupPageInner />
    </Suspense>
  );
}
