'use client';

import { lazy, Suspense, type PropsWithChildren } from 'react';

import ThemeProvider from "@/app/theme-provider";
import { SupabaseListener } from "@/components/providers/supabase-listener";

const Header = lazy(() => import('@/components/header'));
const MobileNav = lazy(() => import('@/components/StickyMobileNav'));

function HeaderFallback() {
  return (
    <div className="h-16 w-full animate-pulse bg-surface shadow-md" 
      role="progressbar" 
      aria-label="Loading header"
    />
  );
}

function NavFallback() {
  return (
    <div className="h-16 w-full animate-pulse bg-surface fixed bottom-0 left-0 right-0 md:hidden" 
      role="progressbar" 
      aria-label="Loading navigation" 
    />
  );
}

/**
 * Client-side shell that wraps the app in necessary providers and
 * lazy loads interactive components like header and mobile nav
 */
export function ClientProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <SupabaseListener />
      <Suspense fallback={<HeaderFallback />}>
        <Header />
      </Suspense>
      {children}
      <Suspense fallback={<NavFallback />}>
        <MobileNav />
      </Suspense>
    </ThemeProvider>
  );
}