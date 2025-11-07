"use server";

import { revalidatePath } from "next/cache";

import { hasSupabaseEnv, missingSupabaseMessage } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type TourRequestState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string }
  | { status: "validation-error"; message: string };

export const initialTourRequestState: TourRequestState = { status: "idle" };

function parseDateTime(date: string, time: string): string | null {
  if (!date || !time) {
    return null;
  }

  const isoCandidate = new Date(`${date}T${time}`);
  if (Number.isNaN(isoCandidate.getTime())) {
    return null;
  }

  return isoCandidate.toISOString();
}

export async function requestTourAction(
  _prev: TourRequestState,
  formData: FormData
): Promise<TourRequestState> {
  const propertyId = String(formData.get("propertyId") ?? "").trim();
  const landlordId = String(formData.get("landlordId") ?? "").trim();
  const propertySlugRaw = formData.get("propertySlug");
  const propertySlug = typeof propertySlugRaw === "string" ? propertySlugRaw : undefined;
  const date = String(formData.get("date") ?? "").trim();
  const time = String(formData.get("time") ?? "").trim();
  const notesRaw = formData.get("notes");
  const notes = typeof notesRaw === "string" ? notesRaw.slice(0, 500) : null;

  if (!propertyId || !landlordId) {
    return { status: "validation-error", message: "Missing property information. Refresh and try again." };
  }

  if (!date || !time) {
    return { status: "validation-error", message: "Choose a preferred date and time." };
  }

  const scheduledAt = parseDateTime(date, time);
  if (!scheduledAt) {
    return { status: "validation-error", message: "Enter a valid date and time for your tour request." };
  }

  if (!hasSupabaseEnv) {
    return { status: "error", message: missingSupabaseMessage };
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return { status: "error", message: "Supabase client unavailable. Please try again later." };
  }

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { status: "error", message: "Sign in to request a tour for this property." };
  }

  if (user.id === landlordId) {
    return { status: "error", message: "You already manage this property." };
  }

  try {
    const { error } = await supabase.from("tours").insert({
      property_id: propertyId,
      landlord_id: landlordId,
      tenant_id: user.id,
      scheduled_at: scheduledAt,
      status: "requested",
      notes
    });

    if (error) {
      console.error("[tours] Failed to request tour", error);
      return { status: "error", message: error.message ?? "Unable to submit tour request." };
    }
  } catch (error) {
    console.error("[tours] Unexpected error requesting tour", error);
    return { status: "error", message: "Unable to submit tour request. Please try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tours");
  revalidatePath("/tours");
  if (propertySlug) {
    revalidatePath(`/property/${propertySlug}`);
  } else {
    revalidatePath(`/property/${propertyId}`);
  }

  return { status: "success" };
}
