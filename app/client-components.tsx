'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

import { buttonStyles } from '@/components/ui/button';
import { LANDING_DATA } from '@/app/landing-data';

const SearchBar = dynamic(() => import('@/components/SearchBar'), {
  ssr: false,
  loading: SearchBarFallback
});

function SearchBarFallback() {
  return (
    <div className="w-full rounded-3xl border border-black/5 bg-white p-6 shadow-soft">
      <div className="h-12 animate-pulse rounded-2xl bg-surface-muted" />
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="grid gap-10 rounded-3xl bg-gradient-to-br from-brand-blue/10 via-brand-teal/10 to-brand-green/10 px-6 py-12 shadow-soft sm:px-10">
      <div className="space-y-6 text-center sm:text-left">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-brand-teal shadow-soft">
          New
          <span className="text-brand-dark">Supabase-ready rental toolkit</span>
        </span>
        <h1 className="text-4xl font-extrabold text-brand-dark sm:text-5xl">
          Find your next place with Rento
        </h1>
        <p className="text-lg text-text-muted sm:max-w-xl">
          Discover verified rentals, explore neighbourhoods, and manage conversations in one
          streamlined dashboard.
        </p>
      </div>
      <SearchBar />
      <dl className="grid gap-4 text-sm text-text-muted sm:grid-cols-3">
        {LANDING_DATA.stats.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-white/60 bg-white/50 px-4 py-3 text-center shadow-sm"
          >
            <dt className="text-xs uppercase tracking-wide">{item.label}</dt>
            <dd className="text-lg font-semibold text-brand-dark">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function CallToAction() {
  return (
    <section className="grid gap-6 rounded-3xl bg-gradient-to-r from-brand-blue/15 via-brand-teal/15 to-brand-green/15 px-6 py-10 shadow-soft sm:px-10 sm:py-12">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-brand-dark">Ready to start your search?</h2>
        <p className="text-sm text-text-muted">
          Browse homes, book tours, and message landlords without leaving the app.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/browse"
          className={buttonStyles({ variant: 'primary', size: 'lg' })}
          data-testid="cta-browse"
        >
          Browse homes
          <span className="ml-2" aria-hidden="true">
            &rarr;
          </span>
        </Link>
        <Link
          href="/auth/sign-up"
          className={buttonStyles({ variant: 'secondary', size: 'lg' })}
          data-testid="cta-signup"
        >
          Create account
        </Link>
      </div>
    </section>
  );
}
