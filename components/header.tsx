import Link from "next/link";
import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { MagnifyingGlassIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

import { SignOutButton } from "@/components/auth/SignOutButton";
import { getProfile, getCurrentUser } from "@/lib/data-access/profile";
import { LandlordNavLink } from "./LandlordNavLink";
import { buttonStyles } from "@/components/ui/button";
import { MobileMenu } from "./MobileMenu";

const navLinks = [
  { href: "/browse" as const, label: "Browse" },
  { href: "/dashboard" as const, label: "Dashboard" },
  { href: "/messages" as const, label: "Messages" }
];

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-brand-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
        <Brand />
        
        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={{ pathname: link.href }}
              className="rounded-full px-3 py-2 text-sm font-medium text-text-muted transition hover:text-brand-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
            >
              {link.label}
            </Link>
          ))}
          <Suspense fallback={null}>
            <LandlordNavLink />
          </Suspense>
        </nav>
        
        {/* Desktop Actions */}
        <div className="hidden flex-1 items-center justify-end gap-3 lg:flex lg:flex-none">
          <Link
            href={{ pathname: "/browse", query: { filters: "open" } }}
            className="group inline-flex items-center gap-2 rounded-full border border-brand-teal/30 bg-surface px-4 py-2 text-sm font-semibold text-brand-teal shadow-sm transition hover:border-brand-teal hover:bg-brand-teal/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
            aria-label="Open home filters"
            data-testid="header-search-shortcut"
          >
            <MagnifyingGlassIcon className="h-4 w-4 transition group-hover:scale-105" />
            <span>Filters</span>
          </Link>
          <Suspense fallback={<SignInButtons />}>
            <ProfileMenu />
          </Suspense>
        </div>

        {/* Mobile Actions */}
        <Suspense fallback={<SignInButtons />}>
          <MobileMenuWrapper />
        </Suspense>
      </div>
    </header>
  );
}

function Brand() {
  return (
    <Link
      href={{ pathname: "/" }}
      className="flex items-center gap-2 text-lg font-bold uppercase tracking-tight text-brand-dark"
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-teal text-white shadow-soft">
        R
      </span>
      <span className="text-brand-dark">
        Rento
        <span className="text-brand-teal">.</span>
      </span>
    </Link>
  );
}

async function ProfileMenu() {
  noStore();
  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return <SignInButtons />;
  }

  const profile = await getProfile().catch(() => null);

  const displayName = profile?.name ?? "Account";
  const initials = displayName
    .split(" ")
    .map((part) => part.at(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isLandlord = user.role === "landlord" || user.role === "admin";
  const isTenant = user.role === "tenant" || !user.role;

  return (
    <div className="flex items-center gap-3">
      <SignOutButton />
      {isTenant && (
        <Link
          href={{ pathname: "/onboarding/landlord" }}
          className="rounded-full bg-brand-blue px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-blue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
        >
          Become a landlord
        </Link>
      )}
      {isLandlord && (
        <Link
          href={{ pathname: "/listings/new" }}
          className="rounded-full bg-brand-teal px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-teal/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
        >
          Add listing
        </Link>
      )}
      <Link
        href={{ pathname: "/profile" }}
        className="group flex items-center gap-2 rounded-full border border-transparent bg-surface px-2 py-1 shadow-sm transition hover:border-brand-teal/40 hover:bg-brand-teal/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
        aria-label="Open profile menu"
      >
        <span className="hidden text-sm font-medium text-text-muted transition group-hover:text-brand-teal md:inline">
          {displayName.split(" ")[0]}
        </span>
        <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-teal/10 text-sm font-semibold text-brand-teal">
          {profile?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              alt={`${displayName} profile picture`}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            initials || "U"
          )}
          {profile?.verificationStatus === "verified" && (
            <span className="absolute -bottom-1 -right-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-green text-white shadow-soft">
              <ShieldCheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sr-only">Verified account</span>
            </span>
          )}
        </span>
      </Link>
    </div>
  );
}


async function MobileMenuWrapper() {
  noStore();
  const profile = await getProfile().catch(() => null);
  const user = await getCurrentUser().catch(() => null);

  return <MobileMenu profile={profile} user={user} />;
}

function SignInButtons() {
  return (
    <div className="flex items-center gap-2">
      <Link
        href={{ pathname: "/auth/sign-in" }}
        className={buttonStyles({
          variant: "ghost",
          size: "sm"
        })}
      >
        Sign in
      </Link>
      <Link
        href={{ pathname: "/auth/sign-up" }}
        className={buttonStyles({
          variant: "primary",
          size: "sm"
        })}
      >
        Join Rento
      </Link>
    </div>
  );
}

