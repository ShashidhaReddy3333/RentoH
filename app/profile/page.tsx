import type { Metadata } from "next";
import Link from "next/link";

import ProfileForm from "@/components/ProfileForm";
import EmptyState from "@/components/EmptyState";
import { buttonStyles } from "@/components/ui/button";
import { getCurrentUser, getProfile } from "@/lib/data-access/profile";
import type { Profile } from "@/lib/types";

import { updateProfileAction } from "./actions";

export const metadata: Metadata = {
  title: "Profile - Rento",
  description: "Manage your renter profile, preferences, and notifications."
};

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <EmptyState
        title="Sign in to manage your profile"
        description="Create an account or sign in to update your rental preferences."
        action={
          <Link href={{ pathname: "/auth/sign-in" }} className={buttonStyles({ variant: "primary", size: "md" })}>
            Sign in
          </Link>
        }
      />
    );
  }

  const profile = await getProfile();

  const handleSave = async (patch: Partial<Profile>) => {
    await updateProfileAction(patch);
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-brand-dark">Your profile</h1>
        <p className="text-sm text-text-muted">
          Keep your details up to date to receive tailored matches and faster approvals.
        </p>
      </header>
      <ProfileForm profile={profile} onSave={handleSave} />
    </div>
  );
}
