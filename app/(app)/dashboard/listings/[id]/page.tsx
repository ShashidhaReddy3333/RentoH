import type { Metadata } from "next";
import Link from "next/link";

import EmptyState from "@/components/EmptyState";
import { buttonStyles } from "@/components/ui/button";

type PageProps = {
  params: { id: string };
};

export const metadata: Metadata = {
  title: "Listing details - Rento"
};

export default function ListingManagementPlaceholder({ params }: PageProps) {
  return (
    <EmptyState
      title="Listing management coming soon"
      description={`Editing listing ${params.id} from the dashboard will be available in a future update. For now you can create a new listing or contact support if you need to make changes.`}
      action={
        <div className="flex gap-3">
          <Link href={{ pathname: "/listings/new" }} className={buttonStyles({ variant: "primary", size: "md" })}>
            Add new listing
          </Link>
          <Link href={{ pathname: "/dashboard/listings" }} className={buttonStyles({ variant: "ghost", size: "md" })}>
            Back to listings
          </Link>
        </div>
      }
    />
  );
}
