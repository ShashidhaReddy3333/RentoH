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
  { label: "Profile", href: "/profile" }
] as const satisfies readonly NavItem[];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-surface/90 backdrop-blur dark:border-white/10">
      <div className="container h-16 flex items-center justify-between gap-4">
        <Link href="/" className="text-2xl font-black tracking-tight text-brand.primary">
          RENTO
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-textc/80">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "text-brand.primary"
                    : "transition-colors hover:text-brand.primary"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden md:flex items-center gap-3">
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
