'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

import { buttonStyles } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <div className="space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <ExclamationTriangleIcon className="h-8 w-8 text-red-600" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-brand-dark">
            Something went wrong
          </h1>
          <p className="text-sm text-textc/70">
            We encountered an unexpected error. Our team has been notified.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mx-auto max-w-lg rounded-lg border border-red-200 bg-red-50 p-4 text-left">
            <p className="text-xs font-mono text-red-900 break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="mt-2 text-xs text-red-700">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className={buttonStyles({ variant: 'primary' })}
          >
            Try again
          </button>
          <Link
            href="/"
            className={buttonStyles({ variant: 'outline' })}
          >
            Go home
          </Link>
        </div>

        <p className="text-xs text-textc/60">
          If this problem persists, please{' '}
          <a
            href="mailto:support@rento.example"
            className="text-brand-blue hover:underline"
          >
            contact support
          </a>
          .
        </p>
      </div>
    </div>
  );
}
