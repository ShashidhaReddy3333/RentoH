"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChatBubbleLeftRightIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  UserCircleIcon
} from "@heroicons/react/24/outline";

const items = [
  {
    href: "/",
    label: "Home",
    icon: HomeIcon
  },
  {
    href: "/browse",
    label: "Browse",
    icon: MagnifyingGlassIcon
  },
  {
    href: "/messages",
    label: "Messages",
    icon: ChatBubbleLeftRightIcon
  },
  {
    href: "/profile",
    label: "Profile",
    icon: UserCircleIcon
  }
] as const;

export default function StickyMobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/5 bg-white/95 shadow-[0_-8px_30px_rgba(15,23,42,0.06)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <li key={item.href}>
              <Link
                href={{ pathname: item.href }}
                aria-current={isActive ? "page" : undefined}
                className="flex flex-col items-center gap-1 rounded-xl px-3 py-1 text-xs font-medium text-text-muted transition hover:text-brand-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                data-testid={`mobile-nav-${item.label.toLowerCase()}`}
              >
                <Icon
                  className={`h-6 w-6 ${isActive ? "text-brand-teal" : "text-text-muted"}`}
                  aria-hidden="true"
                />
                <span className={isActive ? "text-brand-teal" : undefined}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
