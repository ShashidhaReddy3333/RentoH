"use server";

import { updateProfile } from "@/lib/data-access/profile";
import type { Profile } from "@/lib/types";

export async function updateProfileAction(patch: Partial<Profile>) {
  const updated = await updateProfile(patch);
  return updated;
}
