"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";

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
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
      <div className="container h-16 flex items-center justify-between gap-4">
        <Link href="/" className="text-2xl font-black tracking-tight text-[var(--c-primary)]">
          RENTO
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "text-[var(--c-primary)]"
                    : "hover:text-[var(--c-primary)] transition-colors"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden md:flex items-center gap-3">
          <Link href="/auth/sign-in" className="btn btn-secondary min-w-[104px]">
            Login
          </Link>
          <Link
            href={{ pathname: "/auth/sign-in", query: { tab: "signup" } }}
            className="btn btn-primary min-w-[104px]"
          >
            Sign up
          </Link>
        </div>
        <button className="md:hidden btn border border-gray-200 px-3 py-2" aria-label="Open menu">
          Menu
        </button>
      </div>
    </header>
  );
}
