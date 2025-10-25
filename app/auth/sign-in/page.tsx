'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import type { FormEvent } from 'react';
import { Suspense, useMemo, useState } from 'react';

import { SupabaseConfigBanner } from '@/components/SupabaseConfigBanner';
import { buttonStyles } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { hasSupabaseEnv } from '@/lib/env';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInContent />
    </Suspense>
  );
}

function SignInFallback() {
  return (
    <div className="mx-auto max-w-2xl py-12 text-center text-sm text-textc/60">
      Loading sign-in experience...
    </div>
  );
}

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(
    () => (hasSupabaseEnv ? createSupabaseBrowserClient() : null),
    []
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = searchParams?.get('next') ?? null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    if (!supabase) {
      setError('Supabase environment variables are not configured.');
      setBusy(false);
      return;
    }

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        setError(friendlyAuthError(signInError.message));
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const csrf = document.cookie
          .split("; ")
          .find((cookie) => cookie.startsWith("rento_csrf="))
          ?.split("=")[1];
        await fetch('/auth/callback', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ event: 'SIGNED_IN', session: data.session, csrf })
        });
      }

      const target: Route =
        next && next.startsWith('/') ? (next as Route) : '/dashboard';
      router.replace(target);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const isUnconfigured = !supabase;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold text-textc">Welcome back</h1>
        <p className="text-sm text-textc/70">
          Enter your credentials to access the dashboard.
        </p>
      </header>

      <Card>
        <CardContent className="space-y-6">
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            aria-label="Sign-in form"
          >
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium text-textc">
                Email
              </label>
              <input
                id="email"
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
                htmlFor="password"
                className="text-sm font-medium text-textc"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                className="input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-describedby="signin-password-hint"
                placeholder="Enter your password"
              />
              <p id="signin-password-hint" className="sr-only">
                Minimum 8 characters. Do not share your password.
              </p>
            </div>

            <button
              type="submit"
              className={`${buttonStyles({ variant: 'primary' })} w-full`}
              disabled={busy || isUnconfigured}
              title={isUnconfigured ? 'Supabase connection required for sign-in' : undefined}
            >
              {busy ? 'Signing in...' : 'Sign in'}
            </button>
            {isUnconfigured && <SupabaseConfigBanner />}
          </form>

          {error ? (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {error}
            </p>
          ) : null}

          <p className="text-center text-sm text-textc/70">
            New to Rento Bridge?{' '}
            <Link href="/auth/sign-up" className="text-brand-blue hover:text-brand-teal hover:underline">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function friendlyAuthError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes('invalid login credentials')) {
    return 'Incorrect email or password.';
  }
  if (normalized.includes('email not confirmed')) {
    return 'Please confirm your email using the code we sent before signing in.';
  }
  if (normalized.includes('over email rate limit')) {
    return 'Too many attempts. Wait a moment and try again.';
  }
  return message;
}



