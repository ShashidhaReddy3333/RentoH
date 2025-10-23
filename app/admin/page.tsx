import Link from "next/link";

import EmptyState from "@/components/EmptyState";
import { buttonStyles } from "@/components/ui/button";

export default function AdminDashboardPlaceholder() {
  return (
    <EmptyState
      title="Admin console coming soon"
      description="The new Rento admin experience is under construction. Reach out to the product team if you need moderation tools today."
      action={
        <Link href="/dashboard" className={buttonStyles({ variant: "primary", size: "md" })}>
          Back to dashboard
        </Link>
      }
    />
  );
}
