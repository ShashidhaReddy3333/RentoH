"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";

import { Button, buttonStyles } from "@/components/ui/button";

type NavItem = { label: string; href: Route };

const navItems = [
  { label: "Home", href: "/" },
  { label: "Browse", href: "/browse" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Messages", href: "/messages" },
  { label: "Profile", href: "/profile" },
] as const satisfies readonly NavItem[];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-brand-dark/10 bg-brand-bg/90 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-container items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-black tracking-tight text-brand-teal">
          RENTO
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-brand-dark/80 md:flex">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "text-brand-teal"
                    : "transition-colors hover:text-brand-blue"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/auth/sign-in"
            className={`${buttonStyles({ variant: "outline", size: "sm" })} min-w-[104px]`}
          >
            Login
          </Link>
          <Link
            href={{ pathname: "/auth/sign-in", query: { tab: "signup" } }}
            className={`${buttonStyles({ variant: "primary", size: "sm" })} min-w-[104px]`}
          >
            Sign up
          </Link>
        </div>
        <Button variant="outline" size="sm" className="md:hidden" aria-label="Open menu">
          Menu
        </Button>
      </div>
    </header>
  );
}
