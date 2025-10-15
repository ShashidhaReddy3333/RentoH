"use client";

import Link from "next/link";
import type { Route } from "next";
import type { UrlObject } from "url";
import { useMemo } from "react";
import BadgeVerified from "@/components/badge-verified";
import { useAppState } from "@/components/providers/app-provider";
import PropertyCard from "@/components/property-card";
import StatsCards from "@/components/stats-cards";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const CURRENT_LANDLORD_ID = "u2";

export default function DashboardPage() {
  const { landlordListings, deleteProperty, toggleFavorite, favorites, users } = useAppState();
  const listings = landlordListings(CURRENT_LANDLORD_ID);
  const landlord = useMemo(
    () => users.find((user) => user.id === CURRENT_LANDLORD_ID),
    [users]
  );

  const stats = useMemo(
    () => [
      { title: "Total listings", value: listings.length },
      { title: "New inquiries", value: 8, subtext: "Across all properties this week" },
      { title: "Views (30d)", value: 214, subtext: "Average per listing" }
    ],
    [listings.length]
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="space-y-4">
        <Card>
          <CardContent className="space-y-2">
            <div className="text-sm text-textc/70">Signed in as</div>
            <div className="text-lg font-semibold text-textc">
            {landlord?.name ?? "Landlord"}
            </div>
            {landlord?.verified ? <BadgeVerified /> : null}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 text-sm font-medium text-textc/70">
            {sidebarLinks.map((item) => {
              const key =
                typeof item.href === "string"
                  ? item.href
                  : `${item.href.pathname ?? ""}#${item.href.hash ?? ""}`;
              return (
                <Link
                  key={key}
                  href={item.href}
                  className="block rounded-lg px-3 py-2 transition hover:bg-brand.primary/10 hover:text-brand.primary"
                >
                  {item.label}
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </aside>

      <section className="space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-textc">Dashboard</h1>
            <p className="text-sm text-textc/70">
              Track performance, manage listings, and respond to tenant messages.
            </p>
          </div>
          <Link
            href="/listings/new"
            className={`${buttonStyles({ variant: "primary" })} w-fit`}
          >
            Add new property
          </Link>
        </header>

        <StatsCards stats={stats} />

        <section className="space-y-4" id="listings">
          <header className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-textc">My listings</h2>
            <span className="text-sm text-textc/60">{listings.length} active</span>
          </header>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {listings.map((property) => (
              <Card key={property.id}>
                <CardContent className="space-y-4">
                  <PropertyCard
                    property={property}
                    onSave={toggleFavorite}
                    saved={favorites.includes(property.id)}
                    variant="plain"
                    className="border-none bg-transparent p-0 shadow-none"
                  />
                  <div className="flex gap-2">
                    <Link
                      href={`/listings/${property.id}/manage`}
                      className={`${buttonStyles({ variant: "outline" })} flex-1 text-center`}
                    >
                      Manage
                    </Link>
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex-1"
                      onClick={() => deleteProperty(property.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Card className="border-2 border-dashed border-black/10 text-center text-textc/70 transition hover:border-brand.primary/60 hover:text-brand.primary dark:border-white/10">
              <CardContent className="flex min-h-[280px] flex-col items-center justify-center space-y-2">
                <span className="text-3xl">+</span>
                <p className="font-medium">Create a new listing</p>
                <Link
                  href="/listings/new"
                  className={`${buttonStyles({ variant: "primary" })} mt-2`}
                >
                  Start
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </section>
    </div>
  );
}

type SidebarLink = { label: string; href: Route | UrlObject };

const sidebarLinks: readonly SidebarLink[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "My Listings", href: { pathname: "/dashboard", hash: "listings" } },
  { label: "Messages", href: "/messages" },
  { label: "Settings", href: "/profile" }
];
