"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";

import { SignOutButton } from "@/components/auth/SignOutButton";
import { buttonStyles } from "@/components/ui/button";

const navLinks = [
  { href: "/browse" as const, label: "Browse" },
  { href: "/dashboard" as const, label: "Dashboard" },
  { href: "/messages" as const, label: "Messages" }
];

type Profile = {
  name: string;
  avatarUrl?: string;
  verificationStatus?: string;
};

type User = {
  role?: string;
};

type MobileMenuProps = {
  profile: Profile | null;
  user: User | null;
  hasUnreadMessages?: boolean;
};

export function MobileMenu({ profile, user, hasUnreadMessages = false }: MobileMenuProps) {
  const isAuthenticated = Boolean(profile && user);

  return (
    <div className="flex items-center gap-3 lg:hidden">
      {isAuthenticated && profile && user && (
        <ProfileMenuMobile profile={profile} user={user} />
      )}
      <MobileMenuButton profile={profile} user={user} hasUnreadMessages={hasUnreadMessages} />
    </div>
  );
}

function MobileMenuButton({
  user,
  profile,
  hasUnreadMessages
}: {
  user: User | null;
  profile: Profile | null;
  hasUnreadMessages: boolean;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthenticated = Boolean(user && profile);
  const isLandlord = user?.role === "landlord" || user?.role === "admin";
  const buttonLabel = mobileMenuOpen
    ? "Close menu"
    : hasUnreadMessages
      ? "Open menu, unread messages available"
      : "Open menu";

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="relative rounded-lg p-2 text-text-muted transition hover:bg-surface hover:text-brand-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
        aria-label={buttonLabel}
      >
        {mobileMenuOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <Bars3Icon className="h-6 w-6" />
        )}
        {hasUnreadMessages && !mobileMenuOpen && (
          <span
            className="absolute -right-0.5 top-1 inline-flex h-2.5 w-2.5 rounded-full bg-brand-green"
            aria-hidden="true"
          />
        )}
      </button>

      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-[73px] z-50 border-t border-black/5 bg-white shadow-lg lg:hidden">
          <nav className="mx-auto max-w-7xl space-y-1 px-4 py-4">
            {navLinks.map((link) => {
              const isMessagesLink = link.href === "/messages";
              const showUnread = isMessagesLink && hasUnreadMessages;
              const linkLabel = showUnread ? `${link.label} (unread)` : link.label;

              return (
                <Link
                  key={link.href}
                  href={{ pathname: link.href }}
                  onClick={() => setMobileMenuOpen(false)}
                  className="relative flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-muted transition hover:bg-surface hover:text-brand-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
                  aria-label={linkLabel}
                >
                  <span>{link.label}</span>
                  {showUnread && (
                    <span
                      className="inline-flex h-2.5 w-2.5 rounded-full bg-brand-green"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              );
            })}
            {isLandlord && (
              <Link
                href={{ pathname: "/listings/new" }}
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-semibold text-brand-teal transition hover:bg-brand-teal/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
              >
                Add listing
              </Link>
            )}
            <Link
              href={{ pathname: "/browse", query: { filters: "open" } }}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-brand-teal transition hover:bg-brand-teal/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
            >
              <MagnifyingGlassIcon className="h-4 w-4" />
              <span>Search Filters</span>
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  href={{ pathname: "/profile" }}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-text-muted transition hover:bg-surface hover:text-brand-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
                >
                  View profile
                </Link>
                <div className="mt-3 border-t border-black/5 pt-3">
                  <SignOutButton className="w-full justify-start" />
                </div>
              </>
            ) : (
              <div className="mt-3 border-t border-black/5 pt-3 space-y-2">
                <Link
                  href={{ pathname: "/auth/sign-in" }}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`${buttonStyles({ variant: "ghost", size: "sm" })} w-full justify-start`}
                >
                  Sign in
                </Link>
                <Link
                  href={{ pathname: "/auth/sign-up" }}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`${buttonStyles({ variant: "primary", size: "sm" })} w-full justify-center`}
                >
                  Join Rento
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </>
  );
}

function ProfileMenuMobile({ profile, user }: { profile: Profile; user: User }) {
  const isLandlord = user.role === "landlord" || user.role === "admin";
  const isTenant = user.role === "tenant" || !user.role;

  const initials = profile.name
    .split(" ")
    .map((part: string) => part.at(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-2">
      {isTenant && (
        <Link
          href={{ pathname: "/onboarding/landlord" }}
          className="rounded-full bg-brand-blue px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-blue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
        >
          Landlord
        </Link>
      )}
      {isLandlord && (
        <Link
          href={{ pathname: "/listings/new" }}
          className="rounded-full bg-brand-teal px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-teal/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
        >
          Add listing
        </Link>
      )}
      <Link
        href={{ pathname: "/profile" }}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-teal/10 text-sm font-semibold text-brand-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
        aria-label="View profile"
      >
        {profile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatarUrl}
            alt={`${profile.name} profile picture`}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          initials || "U"
        )}
        {profile.verificationStatus === "verified" && (
          <span className="absolute -bottom-1 -right-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-green text-white">
            <ShieldCheckIcon className="h-3 w-3" aria-hidden="true" />
          </span>
        )}
      </Link>
    </div>
  );
}
