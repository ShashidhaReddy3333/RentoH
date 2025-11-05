'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

import { buttonStyles } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { upgradToLandlord } from './actions';

export default function LandlordOnboardingPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = () => {
    setError(null);
    startTransition(async () => {
      const result = await upgradToLandlord();
      if (result?.error) {
        setError(result.error);
      }
      // On success, the server action redirects to dashboard
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-textc">Become a Landlord</h1>
        <p className="text-sm text-textc/70">
          Start listing and managing properties on Rento
        </p>
      </header>

      <Card>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-textc">Terms & Conditions</h2>
            <p className="text-sm text-textc/70">
              By upgrading to a landlord account, you agree to our landlord terms of service.
              You&apos;ll be able to:
            </p>
            <ul className="space-y-2 text-sm text-textc/70">
              <li className="flex items-start gap-2">
                <CheckCircleIcon className="h-5 w-5 text-brand-blue flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>List unlimited properties with photos and detailed descriptions</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircleIcon className="h-5 w-5 text-brand-blue flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>Receive and manage rental applications from qualified tenants</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircleIcon className="h-5 w-5 text-brand-blue flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>Communicate directly with prospective renters</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircleIcon className="h-5 w-5 text-brand-blue flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>Schedule property tours and manage bookings</span>
              </li>
            </ul>
            <div className="rounded-lg border border-brand-blue/30 bg-brand-blue/5 p-4">
              <p className="text-xs text-brand-blue/80">
                <strong className="font-semibold">Note:</strong> Identity verification will be required
                before your first listing goes live. This helps keep our community safe and trusted.
              </p>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={isPending}
              className={buttonStyles({ variant: 'primary' })}
            >
              {isPending ? 'Upgrading...' : 'Accept & Become Landlord'}
            </button>
            <Link
              href="/dashboard"
              className={buttonStyles({ variant: 'secondary' })}
            >
              Cancel
            </Link>
          </div>

          <p className="text-xs text-textc/60">
            By clicking &quot;Accept & Become Landlord&quot;, you acknowledge that you have read and
            agree to our{' '}
            <Link href="/terms" className="text-brand-blue hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-brand-blue hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
