"use client";

import { useMemo, useState } from "react";

import { signUpSchema } from "@/lib/schemas/profile";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function PasswordMeter({ value }: { value: string }) {
  const score = useMemo(() => {
    let s = 0;
    if (/[A-Z]/.test(value)) s += 1;
    if (/[a-z]/.test(value)) s += 1;
    if (/[0-9]/.test(value)) s += 1;
    if (/[^A-Za-z0-9]/.test(value)) s += 1;
    if (value.length >= 12) s += 1;
    return s;
  }, [value]);

  return (
    <div className="mt-1 h-1.5 w-full rounded bg-black/10" aria-hidden>
      <div className="h-full rounded bg-emerald-500 transition-all" style={{ width: `${(score / 5) * 100}%` }} />
    </div>
  );
}

export default function SignUpClient() {
  const supabase = createSupabaseBrowserClient();
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!supabase) {
      setError("Supabase is not configured. Please check your environment variables.");
      return;
    }

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const result = signUpSchema.safeParse(Object.fromEntries(form.entries()));
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Please review the highlighted fields.");
      return;
    }

    const data = result.data;
    setPending(true);

    try {
      const siteUrl = typeof window !== "undefined" ? window.location.origin : undefined;
      const { data: signUpResult, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name ?? null,
            role: data.role
          },
          emailRedirectTo: siteUrl ? `${siteUrl}/auth/callback` : undefined
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      const user = signUpResult.user;
      if (!user) {
        throw new Error("Account could not be created. Please try again.");
      }

      let autoVerified = false;
      try {
        const response = await fetch("/api/auth/confirm-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, role: data.role })
        });
        if (response.ok) {
          autoVerified = true;
        } else if (response.status !== 403) {
          const details = await response.json().catch(() => null);
          console.warn("[sign-up] confirm-email route rejected request", details);
        }
      } catch (confirmError) {
        console.warn("[sign-up] automatic confirmation failed", confirmError);
      }

      if (autoVerified) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password
        });

        if (signInError) {
          throw signInError;
        }

        window.location.href = data.role === "landlord" ? "/dashboard?toast=welcome" : "/browse?toast=welcome";
        return;
      }

      setSuccess("Account created. Check your email for the confirmation link to finish signing in.");
      formElement.reset();
      setPassword("");
    } catch (err) {
      console.error("[sign-up] failed", err);
      let message = "We could not create your account. Please try again.";
      if (err instanceof Error && err.message) {
        message = err.message;
      } else if (typeof err === "string" && err.trim().length > 0) {
        message = err;
      }
      setError(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-lg space-y-6 rounded-2xl border border-black/10 bg-white p-6 shadow-soft"
      noValidate
    >
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-brand-dark">Join Rento</h1>
        <p className="text-sm text-text-muted">
          Create an account to save homes, chat with landlords, and manage your listings.
        </p>
      </header>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700" role="status">
          {success}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="text-sm font-medium text-brand-dark" htmlFor="full_name">
            Full name <span className="text-text-muted">(optional)</span>
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
            placeholder="Jordan Lee"
            autoComplete="name"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-brand-dark" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-brand-dark" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            onChange={(event) => setPassword(event.target.value)}
          />
          <PasswordMeter value={password} />
        </div>

        <div>
          <label className="text-sm font-medium text-brand-dark" htmlFor="confirm_password">
            Confirm password
          </label>
          <input
            id="confirm_password"
            name="confirm_password"
            type="password"
            required
            minLength={8}
            className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
            placeholder="Retype your password"
            autoComplete="new-password"
          />
        </div>

        <fieldset className="rounded-lg border border-black/10 px-3 py-2">
          <legend className="px-1 text-sm font-medium text-brand-dark">Account type</legend>
          <p className="mb-3 mt-1 text-xs text-text-muted">Choose the option that matches how you plan to use Rento.</p>
          <div className="space-y-2">
            <label className="flex items-start gap-3 rounded-md border border-transparent px-2 py-2 transition hover:border-brand-teal/40 hover:bg-brand-teal/5 focus-within:border-brand-teal focus-within:bg-brand-teal/5">
              <input
                type="radio"
                name="role"
                value="tenant"
                defaultChecked
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-semibold text-brand-dark">I'm looking for a place</span>
                <span className="text-xs text-text-muted">Browse, save favorites, and message landlords.</span>
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-md border border-transparent px-2 py-2 transition hover:border-brand-teal/40 hover:bg-brand-teal/5 focus-within:border-brand-teal focus-within:bg-brand-teal/5">
              <input
                type="radio"
                name="role"
                value="landlord"
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-semibold text-brand-dark">I'm listing a property</span>
                <span className="text-xs text-text-muted">Create listings, manage inquiries, and track applications.</span>
              </span>
            </label>
          </div>
        </fieldset>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-brand-teal px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-teal/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Creating your account..." : "Create account"}
      </button>

      <p className="text-center text-xs text-text-muted">
        By creating an account you agree to our{" "}
        <a href="/terms" className="font-semibold text-brand-teal hover:underline">
          Terms
        </a>{" "}
        and{" "}
        <a href="/privacy" className="font-semibold text-brand-teal hover:underline">
          Privacy Policy
        </a>
        .
      </p>
    </form>
  );
}
