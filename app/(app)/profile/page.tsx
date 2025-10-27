import type { Metadata } from "next";
import Link from "next/link";

import ProfileForm from "@/components/ProfileForm";
import EmptyState from "@/components/EmptyState";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { buttonStyles } from "@/components/ui/button";
import { getCurrentUser, getProfile } from "@/lib/data-access/profile";
import type { Profile } from "@/lib/types";

import { deleteAccountAction, updateProfileAction } from "./actions";

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

  if (!profile) {
    return (
      <EmptyState
        title="We couldn't load your profile"
        description="Check your Supabase connection or try again in a moment."
      />
    );
  }
  const handleSave = async (patch: Partial<Profile>) => {
    await updateProfileAction(patch);
  };
  const handleDelete = async () => {
    "use server";
    await deleteAccountAction();
  };

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-brand-dark">Your profile</h1>
            <p className="text-sm text-text-muted">
              Keep your details up to date to receive tailored matches and faster approvals.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/settings/notifications"
              className={buttonStyles({ variant: "outline", size: "sm" })}
            >
              Settings
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>
      <ProfileForm profile={profile} onSave={handleSave} onDeleteAccount={handleDelete} />
    </div>
  );
}
