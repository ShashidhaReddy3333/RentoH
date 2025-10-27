"use client";

import { useState } from "react";
import Link from "next/link";
import { Bars3Icon, XMarkIcon, MagnifyingGlassIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

import { SignOutButton } from "@/components/auth/SignOutButton";

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
};

export function MobileMenu({ profile, user }: MobileMenuProps) {
  return (
    <div className="flex items-center gap-3 lg:hidden">
      {profile && user && <ProfileMenuMobile profile={profile} user={user} />}
      <MobileMenuButton user={user} />
    </div>
  );
}

function MobileMenuButton({ user }: { user: User | null }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLandlord = user?.role === 'landlord' || user?.role === 'admin';

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="rounded-lg p-2 text-text-muted hover:bg-surface hover:text-brand-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
      >
        {mobileMenuOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <Bars3Icon className="h-6 w-6" />
        )}
      </button>

      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-[73px] border-t border-black/5 bg-white shadow-lg lg:hidden z-50">
          <nav className="mx-auto max-w-7xl space-y-1 px-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={{ pathname: link.href }}
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-text-muted transition hover:bg-surface hover:text-brand-teal"
              >
                {link.label}
              </Link>
            ))}
            {isLandlord && (
              <Link
                href={{ pathname: "/dashboard/listings" }}
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-text-muted transition hover:bg-surface hover:text-brand-teal"
              >
                My Listings
              </Link>
            )}
            <Link
              href={{ pathname: "/browse", query: { filters: "open" } }}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-brand-teal transition hover:bg-brand-teal/10"
            >
              <MagnifyingGlassIcon className="h-4 w-4" />
              <span>Search Filters</span>
            </Link>
            <div className="pt-2 border-t border-black/5 mt-2">
              <SignOutButton className="w-full justify-start" />
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

function ProfileMenuMobile({ profile, user }: { profile: Profile; user: User }) {
  const isLandlord = user.role === 'landlord' || user.role === 'admin';
  const isTenant = user.role === 'tenant' || !user.role;

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
          className="rounded-full bg-brand-blue px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-blue/90"
        >
          Landlord
        </Link>
      )}
      {isLandlord && (
        <Link
          href={{ pathname: "/listings/new" }}
          className="rounded-full bg-brand-teal px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-teal/90"
        >
          Add
        </Link>
      )}
      <Link
        href={{ pathname: "/profile" }}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-teal/10 text-sm font-semibold text-brand-teal"
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
