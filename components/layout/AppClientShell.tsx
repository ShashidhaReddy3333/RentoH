"use client";

import type { PropsWithChildren } from "react";

import ThemeProvider from "@/app/theme-provider";
import { SupabaseListener } from "@/components/providers/supabase-listener";
import StickyMobileNav from "@/components/StickyMobileNav";

/**
 * Wraps authenticated routes in the handful of client-only providers we need.
 * This keeps the top-level layout server-only while still wiring up session listeners
 * and theme persistence for interactive sections of the app.
 */
export function AppClientShell({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <SupabaseListener />
      {children}
      <StickyMobileNav />
    </ThemeProvider>
  );
}

