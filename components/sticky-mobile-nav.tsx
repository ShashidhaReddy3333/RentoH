"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";

type StickyNavItem = { label: string; href: Route; icon: string };

const items = [
  { label: "Browse", href: "/browse", icon: "\u{1F50D}" },
  { label: "My Listings", href: "/dashboard", icon: "\u{1F3E0}" },
  { label: "Messages", href: "/messages", icon: "\u{1F4AC}" },
  { label: "Profile", href: "/profile", icon: "\u{1F464}" }
] as const satisfies readonly StickyNavItem[];

export default function StickyMobileNav() {
  const pathname = usePathname();
  return (
    <nav className="sticky-bar md:hidden">
      <div className="container flex items-center justify-between gap-1 text-xs font-medium">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-2 rounded-lg transition ${
                active ? "bg-[var(--c-primary)]/10 text-[var(--c-primary)]" : "text-gray-600"
              }`}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
