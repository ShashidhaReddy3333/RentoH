"use client";

import type { PropsWithChildren } from "react";

import ThemeProvider from "@/app/theme-provider";
import { SupabaseListener } from "@/components/providers/supabase-listener";

/**
 * Root-level client providers for the entire app.
 * Wraps children with ThemeProvider and SupabaseListener.
 * This component is dynamically imported in the root layout to avoid hydration issues.
 */
export function RootProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <SupabaseListener />
      {children}
    </ThemeProvider>
  );
}
