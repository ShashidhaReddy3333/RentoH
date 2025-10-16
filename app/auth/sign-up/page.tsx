"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { Suspense, useMemo, useState } from "react";

import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const OTP_LENGTH = 6;

type Stage = "collect" | "verify";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [stage, setStage] = useState<Stage>("collect");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const redirectTo = () => {
    const target: Route =
      next && next.startsWith("/") ? (next as Route) : "/dashboard";
    router.replace(target);
    router.refresh();
  };

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password
      });

      if (signUpError) {
        setError(friendlySignUpError(signUpError.message));
        return;
      }

      setStage("verify");
      setToken("");
      setMessage(
        `We sent a 6-digit code to ${email}. Enter it below to verify your account.`
      );
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        type: "signup",
        email,
        token
      });

      if (verifyError) {
        setError(friendlySignUpError(verifyError.message));
        return;
      }

      let session = data.session ?? null;

      if (!session) {
        const {
          data: fallbackData,
          error: fallbackError
        } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (fallbackError) {
          setError(friendlySignUpError(fallbackError.message));
          return;
        }

        session = fallbackData.session ?? null;
      }

      if (!session) {
        setError("We could not start a session. Please try signing in.");
        return;
      }

      redirectTo();
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
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email
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
    setStage("collect");
    setToken("");
    setMessage(null);
    setError(null);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold text-textc">
          Create your account
        </h1>
        <p className="text-sm text-textc/70">
          Sign up with your email and confirm with the 6-digit code sent to your
          inbox.
        </p>
      </header>

      <Card>
        <CardContent className="space-y-6">
          {stage === "collect" ? (
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
                />
              </div>

              <button
                type="submit"
                className={`${buttonStyles({ variant: "primary" })} w-full`}
                disabled={busy}
              >
                {busy ? "Creating account..." : "Continue"}
              </button>
            </form>
          ) : (
            <form
              onSubmit={handleVerify}
              className="space-y-4"
              aria-label="Verify email form"
            >
              <div className="space-y-1">
                <label
                  htmlFor="signup-otp"
                  className="text-sm font-medium text-textc"
                >
                  6-digit code
                </label>
                <input
                  id="signup-otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={OTP_LENGTH}
                  required
                  className="input tracking-widest"
                  value={token}
                  onChange={(event) =>
                    setToken(
                      event.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH)
                    )
                  }
                  placeholder="Enter your code"
                />
              </div>

              <button
                type="submit"
                className={`${buttonStyles({ variant: "primary" })} w-full`}
                disabled={busy || token.length !== OTP_LENGTH}
              >
                {busy ? "Verifying..." : "Verify and continue"}
              </button>

              <div className="flex items-center justify-between text-sm text-textc/70">
                <button
                  type="button"
                  className="text-brand.blue hover:text-brand.primary hover:underline"
                  onClick={handleResend}
                  disabled={busy}
                >
                  Resend code
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
            </form>
          )}

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
    return "That code has expired. Request a new one and try again.";
  }
  if (normalized.includes("invalid otp")) {
    return "That code didn't work. Double-check and try again.";
  }
  if (normalized.includes("rate limit")) {
    return "Too many attempts. Please wait a moment before trying again.";
  }
  return message;
}
