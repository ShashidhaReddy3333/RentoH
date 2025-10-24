import Link from "next/link";

import EmptyState from "@/components/EmptyState";
import { buttonStyles } from "@/components/ui/button";

type Props = {
  params: { id: string };
};

export default function ListingDetailPlaceholder({ params }: Props) {
  return (
    <EmptyState
      title="Listing details coming soon"
      description={`We're rebuilding listing ${params.id} for the new Rento experience.`}
      action={
        <Link href="/browse" className={buttonStyles({ variant: "primary", size: "md" })}>
          Back to browse
        </Link>
      }
    />
  );
}
