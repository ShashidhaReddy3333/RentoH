"use client";

import { useMemo, useRef, useState } from "react";

import { signUpSchema } from "@/lib/schemas/profile";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const FIELD_LABELS = {
  full_name: "Full name",
  email: "Email address",
  password: "Password",
  confirm_password: "Confirm password",
  role: "Account type"
} as const;

type FieldName = keyof typeof FIELD_LABELS;

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
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});

  const fieldRefs: Record<FieldName, React.MutableRefObject<HTMLInputElement | null>> = {
    full_name: useRef<HTMLInputElement | null>(null),
    email: useRef<HTMLInputElement | null>(null),
    password: useRef<HTMLInputElement | null>(null),
    confirm_password: useRef<HTMLInputElement | null>(null),
    role: useRef<HTMLInputElement | null>(null)
  };

  const clearFieldError = (field: FieldName) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    if (!supabase) {
      setError("Supabase is not configured. Please check your environment variables.");
      return;
    }

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const result = signUpSchema.safeParse(Object.fromEntries(form.entries()));
    if (!result.success) {
      const nextFieldErrors: Partial<Record<FieldName, string>> = {};
      for (const issue of result.error.issues) {
        const fieldKey = issue.path[0];
        if (typeof fieldKey === "string" && fieldKey in FIELD_LABELS && !nextFieldErrors[fieldKey as FieldName]) {
          nextFieldErrors[fieldKey as FieldName] = issue.message;
        }
      }
      setFieldErrors(nextFieldErrors);

      const firstIssue = result.error.issues[0];
      const firstKey =
        firstIssue && typeof firstIssue.path[0] === "string" ? (firstIssue.path[0] as keyof typeof fieldRefs) : null;

      if (firstKey && fieldRefs[firstKey]) {
        const ref = fieldRefs[firstKey].current;
        if (typeof window !== "undefined") {
          window.requestAnimationFrame(() => {
            ref?.focus();
            ref?.scrollIntoView({ block: "center", behavior: "smooth" });
          });
        } else {
          ref?.focus();
          ref?.scrollIntoView({ block: "center", behavior: "smooth" });
        }
      }

      const label = firstKey ? FIELD_LABELS[firstKey] : null;
      setError(
        label
          ? `${label}: ${firstIssue?.message ?? "Please review this field."}`
          : firstIssue?.message ?? "Please review the highlighted fields."
      );
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
      setFieldErrors({});
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
        <div className="rounded-md border border-danger/40 bg-danger-muted p-3 text-sm text-danger" role="alert">
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
            ref={fieldRefs.full_name}
            id="full_name"
            name="full_name"
            type="text"
            className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
            placeholder="Jordan Lee"
            autoComplete="name"
            aria-invalid={Boolean(fieldErrors["full_name"]) || undefined}
            aria-describedby={fieldErrors["full_name"] ? "full_name-error" : undefined}
            onChange={() => clearFieldError("full_name")}
          />
          {fieldErrors["full_name"] ? (
            <p id="full_name-error" className="mt-1 text-xs text-danger" role="alert" aria-live="polite">
              {fieldErrors["full_name"]}
            </p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-brand-dark" htmlFor="email">
            Email address
          </label>
          <input
            ref={fieldRefs.email}
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
            placeholder="you@example.com"
            autoComplete="email"
            aria-invalid={Boolean(fieldErrors["email"]) || undefined}
            aria-describedby={fieldErrors["email"] ? "email-error" : undefined}
            onChange={() => clearFieldError("email")}
          />
          {fieldErrors["email"] ? (
            <p id="email-error" className="mt-1 text-xs text-danger" role="alert" aria-live="polite">
              {fieldErrors["email"]}
            </p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-brand-dark" htmlFor="password">
            Password
          </label>
          <input
            ref={fieldRefs.password}
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            aria-invalid={Boolean(fieldErrors["password"]) || undefined}
            aria-describedby={fieldErrors["password"] ? "password-error" : undefined}
            onChange={(event) => {
              setPassword(event.target.value);
              clearFieldError("password");
            }}
          />
          {fieldErrors["password"] ? (
            <p id="password-error" className="mt-1 text-xs text-danger" role="alert" aria-live="polite">
              {fieldErrors["password"]}
            </p>
          ) : null}
          <PasswordMeter value={password} />
        </div>

        <div>
          <label className="text-sm font-medium text-brand-dark" htmlFor="confirm_password">
            Confirm password
          </label>
          <input
            ref={fieldRefs.confirm_password}
            id="confirm_password"
            name="confirm_password"
            type="password"
            required
            minLength={8}
            className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
            placeholder="Retype your password"
            autoComplete="new-password"
            aria-invalid={Boolean(fieldErrors["confirm_password"]) || undefined}
            aria-describedby={fieldErrors["confirm_password"] ? "confirm_password-error" : undefined}
            onChange={() => clearFieldError("confirm_password")}
          />
          {fieldErrors["confirm_password"] ? (
            <p
              id="confirm_password-error"
              className="mt-1 text-xs text-danger"
              role="alert"
              aria-live="polite"
            >
              {fieldErrors["confirm_password"]}
            </p>
          ) : null}
        </div>

        <fieldset
          className="rounded-lg border border-black/10 px-3 py-2"
          aria-describedby={`role-hint${fieldErrors["role"] ? " role-error" : ""}`}
          aria-invalid={Boolean(fieldErrors["role"]) || undefined}
        >
          <legend className="px-1 text-sm font-medium text-brand-dark">Account type</legend>
          <p id="role-hint" className="mb-3 mt-1 text-xs text-text-muted">
            Choose the option that matches how you plan to use Rento.
          </p>
          <div className="space-y-2">
            <label className="flex items-start gap-3 rounded-md border border-transparent px-2 py-2 transition hover:border-brand-teal/40 hover:bg-brand-teal/5 focus-within:border-brand-teal focus-within:bg-brand-teal/5">
              <input
                ref={fieldRefs.role}
                type="radio"
                name="role"
                value="tenant"
                defaultChecked
                className="mt-1"
                onChange={() => clearFieldError("role")}
              />
              <span>
                <span className="block text-sm font-semibold text-brand-dark">I&apos;m looking for a place</span>
                <span className="text-xs text-text-muted">Browse, save favorites, and message landlords.</span>
              </span>
            </label>
              <label className="flex items-start gap-3 rounded-md border border-transparent px-2 py-2 transition hover:border-brand-teal/40 hover:bg-brand-teal/5 focus-within:border-brand-teal focus-within:bg-brand-teal/5">
                <input
                  type="radio"
                  name="role"
                  value="landlord"
                  className="mt-1"
                  onChange={() => clearFieldError("role")}
                />
                <span>
                  <span className="block text-sm font-semibold text-brand-dark">I&apos;m listing a property</span>
                  <span className="text-xs text-text-muted">Create listings, manage inquiries, and track applications.</span>
                </span>
              </label>
          </div>
          {fieldErrors["role"] ? (
            <p id="role-error" className="mt-2 text-xs text-danger" role="alert" aria-live="polite">
              {fieldErrors["role"]}
            </p>
          ) : null}
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
