"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { Suspense, useMemo, useState } from "react";

import { SupabaseConfigBanner } from "@/components/SupabaseConfigBanner";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  return (
    <Suspense fallback={<SignUpFallback />}>
      <SignUpContent />
    </Suspense>
  );
}

function SignUpFallback() {
  return (
    <div className="mx-auto max-w-2xl py-12 text-center text-sm text-textc/60">
      Loading sign-up experience...
    </div>
  );
}

function SignUpContent() {
  const supabase = useMemo(
    () => (hasSupabaseEnv ? createSupabaseBrowserClient() : null),
    []
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      if (!supabase) {
        setError("Supabase credentials are not configured.");
        return;
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/callback`
              : undefined
        }
      });

      if (signUpError) {
        setError(friendlySignUpError(signUpError.message));
        return;
      }

      setMessage(
        `We just sent a magic link to ${email}. Follow it to confirm your account, then sign in.`
      );
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      if (!supabase) {
        setError("Supabase credentials are not configured.");
        return;
      }

      const { error: resendError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/callback`
              : undefined
        }
      });

      if (resendError) {
        setError(friendlySignUpError(resendError.message));
        return;
      }

      setMessage(`We sent a new code to ${email}.`);
    } finally {
      setBusy(false);
    }
  };

  const resetFlow = () => {
    setEmail("");
    setPassword("");
    setMessage(null);
    setError(null);
    setBusy(false);
  };

  const isUnconfigured = !supabase;

  // Show friendly message when Supabase is not configured
  if (isUnconfigured) {
    return (
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold text-textc">
            Create your account
          </h1>
          <p className="text-sm text-textc/70">
            Join Rento to find your perfect rental
          </p>
        </header>

        <Card>
          <CardContent className="space-y-6">
            <div className="space-y-4 text-center py-8">
              <div className="mx-auto w-16 h-16 rounded-full bg-brand-blue/10 flex items-center justify-center">
                <svg 
                  className="w-8 h-8 text-brand-blue" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" 
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-textc">Authentication Not Configured</h2>
              <p className="text-sm text-textc/70 max-w-md mx-auto">
                Supabase authentication is not set up yet. To enable account creation, 
                please configure your Supabase credentials.
              </p>
            </div>

            <SupabaseConfigBanner />

            <p className="text-center text-sm text-textc/70">
              Already have an account?{" "}
              <Link
                href="/auth/sign-in"
                className="text-brand-blue hover:text-brand-teal hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold text-textc">
          Create your account
        </h1>
        <p className="text-sm text-textc/70">
          Sign up with your email and we&apos;ll send a magic link so you can verify
          your account in one tap.
        </p>
      </header>

      <Card>
        <CardContent className="space-y-6">
          <form
            onSubmit={handleSignUp}
            className="space-y-4"
            aria-label="Create account form"
          >
            <div className="space-y-1">
              <label
                htmlFor="signup-email"
                className="text-sm font-medium text-textc"
              >
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                required
                autoComplete="email"
                className="input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                disabled={busy || Boolean(message)}
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="signup-password"
                className="text-sm font-medium text-textc"
              >
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                className="input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Choose a secure password"
                disabled={busy || Boolean(message)}
              />
            </div>

            <button
              type="submit"
              className={`${buttonStyles({ variant: "primary" })} w-full`}
              disabled={busy}
            >
              {busy ? "Creating account..." : "Send magic link"}
            </button>
          </form>

          {error ? (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {error}
            </p>
          ) : null}

          {message ? (
            <p className="rounded-lg border border-brand.primary/30 bg-brand.primary/5 px-4 py-3 text-sm text-brand.primary">
              {message}
            </p>
          ) : null}

          <div className="flex items-center justify-between text-sm text-textc/70">
            <button
              type="button"
              className="text-brand.blue hover:text-brand.primary hover:underline"
              onClick={handleResend}
              disabled={busy || !email}
            >
              Resend magic link
            </button>
            <button
              type="button"
              className="hover:underline"
              onClick={resetFlow}
              disabled={busy}
            >
              Use a different email
            </button>
          </div>

          <p className="text-center text-sm text-textc/70">
            Already have an account?{" "}
            <Link
              href="/auth/sign-in"
              className="text-brand.blue hover:text-brand.primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function friendlySignUpError(message: string) {
  const normalized = message.toLowerCase();
  if (
    normalized.includes("user already registered") ||
    normalized.includes("already registered")
  ) {
    return "An account already exists for this email. Try signing in instead.";
  }
  if (normalized.includes("password should be at least")) {
    return "Passwords must be at least 6 characters.";
  }
  if (normalized.includes("otp") && normalized.includes("expired")) {
    return "That magic link has expired. Request a new one and try again.";
  }
  if (normalized.includes("invalid otp")) {
    return "That magic link didn't work. Request a fresh link and try again.";
  }
  if (normalized.includes("rate limit")) {
    return "Too many attempts. Please wait a moment before trying again.";
  }
  return message;
}
