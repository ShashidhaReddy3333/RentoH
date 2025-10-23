"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { useTheme } from "@/app/theme-provider";
import { Button, buttonStyles } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
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
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const themeLabel = `Switch to ${isDark ? "light" : "dark"} mode`;

  return (
    <header className="sticky top-0 z-40 border-b border-brand-dark/10 bg-surface/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur dark:border-white/10">
      <div className="mx-auto flex h-20 max-w-container items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-black tracking-tight text-brand-teal">
          RENTO
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-text-muted md:flex">
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "text-brand-teal dark:text-brand-teal"
                    : "text-text-muted transition-colors hover:text-brand-teal"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            onClick={toggleTheme}
            className={`${buttonStyles({ variant: "outline", size: "sm" })} min-w-[120px] justify-center`}
            aria-label={themeLabel}
          >
            <Icon name={isDark ? "sun" : "moon"} className="h-5 w-5" />
            <span className="text-sm font-semibold">
              {isDark ? "Light mode" : "Dark mode"}
            </span>
          </button>
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
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={toggleTheme}
            className={`${buttonStyles({ variant: "outline", size: "sm" })} px-3`}
            aria-label={themeLabel}
          >
            <Icon name={isDark ? "sun" : "moon"} className="h-5 w-5" />
          </button>
          <Button variant="outline" size="sm" aria-label="Open menu">
            Menu
          </Button>
        </div>
      </div>
    </header>
  );
}
