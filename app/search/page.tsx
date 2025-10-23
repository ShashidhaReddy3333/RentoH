import type { Metadata } from "next";
import Link from "next/link";

import EmptyState from "@/components/EmptyState";
import { buttonStyles } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Search - Rento",
  description: "Browse rentals using filters on the Browse page while the dedicated search is refreshed."
};

export default function SearchPage() {
  return (
    <EmptyState
      title="Search is moving"
      description="Use the browse experience to filter homes while we finish the new search interface."
      action={
        <Link href={{ pathname: "/browse" }} className={buttonStyles({ variant: "primary", size: "md" })}>
          Open browse
        </Link>
      }
    />
  );
}
