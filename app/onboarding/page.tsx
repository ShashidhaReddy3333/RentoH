import Link from "next/link";

import EmptyState from "@/components/EmptyState";
import { buttonStyles } from "@/components/ui/button";

export default function OnboardingPage() {
  return (
    <EmptyState
      title="Onboarding is handled inside Profile"
      description="Update your renter preferences and verification details from the profile screen."
      action={
        <Link href="/profile" className={buttonStyles({ variant: "primary", size: "md" })}>
          Go to profile
        </Link>
      }
    />
  );
}
