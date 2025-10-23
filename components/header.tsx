"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { Button, buttonStyles } from "@/components/ui/button";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type NavItem = { label: string; href: Route };

const navItems = [
  { label: "Home", href: "/" },
  { label: "Browse", href: "/browse" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Messages", href: "/messages" },
  { label: "Profile", href: "/profile" }
] as const satisfies readonly NavItem[];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(
    () => (hasSupabaseEnv ? createSupabaseBrowserClient() : null),
    []
  );
  const [session, setSession] = useState<Session | null>(null);
  const [initialising, setInitialising] = useState(true);

  useEffect(() => {
    let active = true;

    if (!supabase) {
      setInitialising(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!active) return;
        setSession(session);
        setInitialising(false);
      })
      .catch(() => {
        if (!active) return;
        setInitialising(false);
        setSession(null);
      });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    router.replace("/");
    router.refresh();
  };

  const isAuthenticated = Boolean(session);

  return (
    <header className="sticky top-0 z-40 border-b border-brand-dark/10 bg-brand-bg/90 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-container items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-black tracking-tight text-brand-teal">
          RENTO
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-brand-dark/80 md:flex">
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active ? "text-brand-teal" : "transition-colors hover:text-brand-blue"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleSignOut}
              className={`${buttonStyles({ variant: "outline", size: "sm" })} min-w-[104px]`}
              disabled={initialising}
            >
              Logout
            </button>
          ) : (
            <>
              <Link
                href="/auth/sign-in"
                className={`${buttonStyles({ variant: "outline", size: "sm" })} min-w-[104px]`}
              >
                Login
              </Link>
              <Link
                href="/auth/sign-up"
                className={`${buttonStyles({ variant: "primary", size: "sm" })} min-w-[104px]`}
              >
                Sign up
              </Link>
            </>
          )}
        </div>
        <Button variant="outline" size="sm" className="md:hidden" aria-label="Open menu">
          Menu
        </Button>
      </div>
    </header>
  );
}
