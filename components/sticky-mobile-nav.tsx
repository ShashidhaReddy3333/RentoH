"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";

import { Icon } from "@/components/ui/icon";

type StickyNavItem = { label: string; href: Route; icon: Parameters<typeof Icon>[0]["name"] };

const items = [
  { label: "Browse", href: "/browse", icon: "discover" },
  { label: "My Listings", href: "/dashboard", icon: "home" },
  { label: "Messages", href: "/messages", icon: "chat" },
  { label: "Profile", href: "/profile", icon: "profile" }
] as const satisfies readonly StickyNavItem[];

export default function StickyMobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-brand-dark/10 bg-white/95 backdrop-blur md:hidden dark:bg-slate-900/95">
      <div className="mx-auto flex max-w-container items-center justify-between gap-1 px-4 py-2 text-xs font-medium sm:px-6 lg:px-8">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-card px-3 py-2 transition min-h-[64px] ${
                active ? "bg-brand-teal/10 text-brand-teal" : "text-brand-dark/70 dark:text-slate-200"
              }`}
            >
              <Icon
                name={item.icon}
                className="h-6 w-6"
                ariaLabel={`${item.label} navigation icon`}
              />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
