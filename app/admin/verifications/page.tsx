import Link from "next/link";

import EmptyState from "@/components/EmptyState";
import { buttonStyles } from "@/components/ui/button";

export default function VerificationQueuePlaceholder() {
  return (
    <EmptyState
      title="Verification queue not available"
      description="Identity and listing verification tools are being rebuilt for the new Rento experience."
      action={
        <Link href="/dashboard" className={buttonStyles({ variant: "primary", size: "md" })}>
          Return to dashboard
        </Link>
      }
    />
  );
}
