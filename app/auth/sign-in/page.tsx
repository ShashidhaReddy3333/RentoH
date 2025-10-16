'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import type { FormEvent } from 'react';
import { Suspense, useMemo, useState } from 'react';

import { buttonStyles } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = searchParams.get('next');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        setError(friendlyAuthError(signInError.message));
        return;
      }

      const target: Route =
        next && next.startsWith('/') ? (next as Route) : '/dashboard';
      router.replace(target);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

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
            aria-label="Email sign-in form"
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
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className={`${buttonStyles({ variant: 'primary' })} w-full`}
              disabled={busy}
            >
              {busy ? 'Signing in...' : 'Sign in'}
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

          <p className="text-center text-sm text-textc/70">
            New to Rento Bridge?{' '}
            <Link
              href="/auth/sign-up"
              className="text-brand.blue hover:text-brand.primary hover:underline"
            >
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
