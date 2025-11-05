'use server';

import { revalidatePath } from "next/cache";

import { hasSupabaseEnv, env } from "@/lib/env";
import { removeMockProperty } from "@/lib/mock";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function deleteListing(listingId: string): Promise<{ status: "success" } | { status: "error"; message: string }> {
  if (!listingId) {
    return { status: "error", message: "Listing not found." };
  }

  if (!hasSupabaseEnv) {
    if (env.NODE_ENV === "production") {
      return { status: "error", message: "Missing Supabase configuration. Please set up your environment variables." };
    }
    removeMockProperty(listingId);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/listings");
    return { status: "success" };
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return { status: "error", message: "Supabase client unavailable." };
  }

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { status: "error", message: "You must be signed in to delete a listing." };
  }

  const role =
    (user.app_metadata?.["role"] as string | undefined) ??
    (user.user_metadata?.["role"] as string | undefined) ??
    "tenant";

  if (role !== "landlord" && role !== "admin") {
    return { status: "error", message: "Only landlord accounts can delete listings." };
  }

  const {
    data: existing,
    error: loadError
  } = await supabase
    .from("properties")
    .select("id, landlord_id, slug, images")
    .eq("id", listingId)
    .maybeSingle();

  if (loadError || !existing) {
    return { status: "error", message: "Listing could not be found." };
  }

  if (existing.landlord_id !== user.id && role !== "admin") {
    return { status: "error", message: "You do not have permission to delete this listing." };
  }

  const { error: deleteError } = await supabase.from("properties").delete().eq("id", listingId);
  if (deleteError) {
    console.error("[listings] Failed to delete listing", deleteError);
    return { status: "error", message: deleteError.message };
  }

  const images: string[] = Array.isArray(existing.images)
    ? (existing.images as string[])
    : existing.images
      ? [String(existing.images)]
      : [];

  if (images.length > 0) {
    const bucket = env.SUPABASE_STORAGE_BUCKET_LISTINGS ?? "listings";
    const { error: removeError } = await supabase.storage.from(bucket).remove(images);
    if (removeError) {
      console.warn("[listings] Failed to remove listing images", removeError);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/listings");
  revalidatePath("/browse");
  revalidatePath(`/property/${listingId}`);
  if (existing.slug) {
    revalidatePath(`/property/${existing.slug}`);
  }

  return { status: "success" };
}
