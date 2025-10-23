"use client";

import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { buttonStyles } from "@/components/ui/button";

const upcoming = [
  {
    title: "Public profile",
    copy: "Share a renter-friendly profile with verified references and saved preferences."
  },
  {
    title: "Team access",
    copy: "Invite a co-host or agent to collaborate on listings and messaging."
  },
  {
    title: "Application vault",
    copy: "Store documents securely and reuse them when applying to new rentals."
  }
];

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6 lg:px-0">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold text-textc">Profile</h1>
        <p className="text-sm text-text-muted">
          We&apos;re polishing the profile experience so you can manage preferences, documents, and
          verifications in one place.
        </p>
      </header>

      <Card>
        <CardContent className="space-y-5">
          <h2 className="text-xl font-semibold text-textc">Coming soon to your profile</h2>
          <ul className="space-y-4 text-sm text-text-muted">
            {upcoming.map((item) => (
              <li key={item.title}>
                <p className="font-medium text-textc">{item.title}</p>
                <p className="mt-1">{item.copy}</p>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-muted">
              Need to update something now? Reach out to our team and we&apos;ll make sure your
              details are accurate.
            </p>
            <Link
              href="/contact"
              className={buttonStyles({ variant: "outline", size: "sm" })}
            >
              Contact support
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

