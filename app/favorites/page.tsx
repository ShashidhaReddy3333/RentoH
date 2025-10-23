import Link from "next/link";

import EmptyState from "@/components/EmptyState";
import { buttonStyles } from "@/components/ui/button";

export default function FavoritesPage() {
  return (
    <EmptyState
      title="Save homes from Browse"
      description="Tap the heart icon on any listing to build your favourites list. Your saved homes will appear here."
      action={
        <Link href="/browse" className={buttonStyles({ variant: "primary", size: "md" })}>
          Explore homes
        </Link>
      }
    />
  );
}
