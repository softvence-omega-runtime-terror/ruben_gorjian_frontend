"use client";
import { FormEvent, Suspense, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { GoogleLoginButton } from "@/components/google-login-button";

function LoginPageInner() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json();

      if (!res.ok) {
        throw new Error(body?.error || "Unable to login.");
      }

      setSuccess("Logged in. Redirecting...");
      const role = body?.role || body?.user?.role;
      const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
      const destination = (isAdmin && redirect === "/dashboard") ? "/admin" : redirect;
      window.location.href = destination;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to login.";
      setError(msg);
      if (msg.toLowerCase().includes("verify")) {
        setSuccess("Not seeing the email? Resend the verification link below.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-primary p-6 shadow-xl text-primary">
        <h1 className="text-2xl font-semibold sora">Login</h1>
        <p className="mt-2 text-sm">Use your email and password to sign in.</p>

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
              className="text-xs font-semibold uppercase tracking-wide "
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-primary px-3 py-2 text-sm outline-none ring-primary focus:border-primary focus:ring-2"
              onChange={(e) => setEmailValue(e.target.value)}
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
                required
                className="w-full rounded-lg border border-primary px-3 py-2 text-sm outline-none ring-primary0 focus:border-primary focus:ring-2 pr-10"
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
            className="w-full inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-primary">or</span>
            </div>
          </div>
          <GoogleLoginButton redirect={redirect} />
        </div>

        <p className="mt-4 text-sm text-primary text-center">
          Don&apos;t have an account?{" "}
          <Link
            className="text-primary underline underline-offset-2"
            href={`/signup?redirect=${encodeURIComponent(redirect)}`}
          >
            Sign up
          </Link>
        </p>

        {success && success.toLowerCase().includes("resend") && (
          <button
            type="button"
            onClick={async () => {
              try {
                await fetch("/api/auth/resend-verification", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email: emailValue }),
                });
                setSuccess(
                  "Verification email resent. Please check your inbox.",
                );
              } catch {
                setError("Unable to resend verification email.");
              }
            }}
            className="mt-4 w-full inline-flex items-center justify-center rounded-full border border-primary px-5 py-2 text-sm font-semibold text-slate-100 "
          >
            Resend verification email
          </button>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white text-primary flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
