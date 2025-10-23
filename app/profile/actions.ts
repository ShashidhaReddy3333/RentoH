"use server";

import { deleteAccount, updateProfile } from "@/lib/data-access/profile";
import type { Profile } from "@/lib/types";

export async function updateProfileAction(patch: Partial<Profile>) {
  const updated = await updateProfile(patch);
  return updated;
}

export async function deleteAccountAction() {
  await deleteAccount();
}
