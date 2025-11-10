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
      // Add timeout protection to prevent indefinite hanging
      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), 15000);
      });

      const { error: signInError } = await Promise.race([
        signInPromise,
        timeoutPromise
      ]).catch((err) => {
        // Handle network errors and timeouts
        throw err;
      });

      if (signInError) {
        setError(friendlyAuthError(signInError.message));
        return;
      }

      // Success! The SupabaseListener will automatically sync the session.
      // Wait a brief moment for the listener to complete, then redirect.
      await new Promise(resolve => setTimeout(resolve, 100));

      const target: Route =
        next && next.startsWith('/') ? (next as Route) : '/dashboard';
      router.replace(target);
      router.refresh();
    } catch (err) {
      // Handle unexpected errors (network issues, timeouts, etc.)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if (errorMessage.includes('timed out')) {
        setError('Connection timed out. Please check your internet and try again.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(`Sign-in failed: ${errorMessage}`);
      }
    } finally {
      setBusy(false);
    }
  };

  const isUnconfigured = !supabase;

  // Show friendly message when Supabase is not configured
  if (isUnconfigured) {
    return (
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold text-textc">Welcome back</h1>
          <p className="text-sm text-textc/70">
            Sign in to access your dashboard
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
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-textc">Authentication Not Configured</h2>
              <p className="text-sm text-textc/70 max-w-md mx-auto">
                Supabase authentication is not set up yet. To enable sign-in functionality, 
                please configure your Supabase credentials.
              </p>
            </div>

            <SupabaseConfigBanner />

            <p className="text-center text-sm text-textc/70">
              New to Rento?{' '}
              <Link href="/auth/sign-up" className="text-brand-blue hover:text-brand-teal hover:underline">
                Create an account
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
            New to Rento?{' '}
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



