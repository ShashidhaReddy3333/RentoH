import Link from "next/link";

import EmptyState from "@/components/EmptyState";
import { buttonStyles } from "@/components/ui/button";

export default function NewListingPlaceholder() {
  return (
    <EmptyState
      title="Listing creation is not ready yet"
      description="We're finishing the landlord experience. Reach out to the Rento team if you need to publish a listing today."
      action={
        <Link href="/dashboard" className={buttonStyles({ variant: "primary", size: "md" })}>
          Go to dashboard
        </Link>
      }
    />
  );
}
