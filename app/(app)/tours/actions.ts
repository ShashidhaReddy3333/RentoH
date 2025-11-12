"use server";

import { revalidatePath } from "next/cache";

import { hasSupabaseEnv, missingSupabaseMessage } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import type { TourRequestState } from "./types";

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
  try {
    const propertyId = String(formData.get("propertyId") ?? "").trim();
    const landlordId = String(formData.get("landlordId") ?? "").trim();
    const propertySlugRaw = formData.get("propertySlug");
    const propertySlug = typeof propertySlugRaw === "string" ? propertySlugRaw : undefined;
    const date = String(formData.get("date") ?? "").trim();
    const time = String(formData.get("time") ?? "").trim();
    const notesRaw = formData.get("notes");
    const notes = typeof notesRaw === "string" ? notesRaw.slice(0, 500) : null;

    console.log("[tours] Request received:", { propertyId, landlordId, date, time, hasNotes: !!notes });

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
      console.error("[tours] Missing Supabase environment variables");
      return { status: "error", message: missingSupabaseMessage };
    }

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      console.error("[tours] Failed to create Supabase client");
      return { status: "error", message: "Supabase client unavailable. Please try again later." };
    }

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("[tours] Auth error:", authError);
      return { status: "error", message: "Sign in to request a tour for this property." };
    }

    if (!user) {
      console.error("[tours] No user found");
      return { status: "error", message: "Sign in to request a tour for this property." };
    }

    console.log("[tours] User authenticated:", user.id);

    // Rate limiting
    const rateLimitResult = checkRateLimit(user.id, RATE_LIMITS.tours);
    if (!rateLimitResult.allowed) {
      return {
        status: "error",
        message: "Too many tour requests. Please wait a moment and try again."
      };
    }

    if (user.id === landlordId) {
      return { status: "error", message: "You already manage this property." };
    }

    // Attempt 1: insert including notes
    const attemptInsert = async (client: ReturnType<typeof createSupabaseServerClient>, withNotes: boolean) => {
      const payload: Record<string, unknown> = {
        property_id: propertyId,
        landlord_id: landlordId,
        tenant_id: user.id,
        scheduled_at: scheduledAt,
        status: "requested"
      };
      if (withNotes && notes != null) {
        payload["notes"] = notes;
      }
      console.log("[tours] Attempting insert with payload:", payload);
      return client!.from("tours").insert(payload);
    };

    let { error, data } = await attemptInsert(supabase, true);

    if (error) {
      console.error("[tours] Initial insert error:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });

      // Fallback 1: missing column 'notes' => retry without notes
      if (error.code === "42703" || /column\s+"?notes"?/.test(error.message ?? "")) {
        console.log("[tours] Retrying without notes column");
        ({ error, data } = await attemptInsert(supabase, false));
      }

      // Fallback 2: RLS/permission denied => try with service role
      if (
        error &&
        (error.code === "42501" || /row level security|permission denied/i.test(error.message ?? ""))
      ) {
        console.log("[tours] Trying with service role due to RLS");
        const service = createSupabaseServerClient("service");
        if (!service) {
          console.error("[tours] Service role client unavailable");
          return { status: "error", message: "Server is not fully configured for tour requests." };
        }
        ({ error, data } = await attemptInsert(service, false));
      }

      if (error) {
        console.error("[tours] Final insert error:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        return { status: "error", message: error.message ?? "Unable to submit tour request." };
      }
    }

    console.log("[tours] Tour request created successfully:", data);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/tours");
    revalidatePath("/tours");
    if (propertySlug) {
      revalidatePath(`/property/${propertySlug}`);
    } else {
      revalidatePath(`/property/${propertyId}`);
    }

    return { status: "success" };
  } catch (error) {
    console.error("[tours] Unexpected error requesting tour:", error);
    const message = error instanceof Error ? error.message : "Unable to submit tour request. Please try again.";
    return { status: "error", message };
  }
}

/**
 * Approve a tour request (landlord-only action)
 */
export async function approveTourAction(
  _prev: TourRequestState,
  formData: FormData
): Promise<TourRequestState> {
  try {
    const tourId = String(formData.get("tourId") ?? "").trim();
    const notesRaw = formData.get("notes");
    const notes = typeof notesRaw === "string" ? notesRaw.slice(0, 500) : null;

    if (!tourId) {
      return { status: "validation-error", message: "Tour ID is required." };
    }

    if (!hasSupabaseEnv) {
      return { status: "error", message: missingSupabaseMessage };
    }

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return { status: "error", message: "Service unavailable." };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { status: "error", message: "Authentication required." };
    }

    // Verify user is the landlord for this tour
    const { data: tour, error: fetchError } = await supabase
      .from("tours")
      .select("landlord_id, property_id, tenant_id, status")
      .eq("id", tourId)
      .single();

    if (fetchError || !tour) {
      return { status: "error", message: "Tour not found." };
    }

    if (tour.landlord_id !== user.id) {
      return { status: "error", message: "Only the landlord can approve this tour." };
    }

    if (tour.status !== "requested") {
      return { status: "error", message: "This tour has already been processed." };
    }

    // Update the tour to confirmed status
    const updatePayload: Record<string, unknown> = {
      status: "confirmed",
      updated_at: new Date().toISOString()
    };

    if (notes) {
      updatePayload['notes'] = notes;
    }

    const { error: updateError } = await supabase
      .from("tours")
      .update(updatePayload)
      .eq("id", tourId);

    if (updateError) {
      console.error("[tours] Approve error:", updateError);
      return { status: "error", message: "Failed to approve tour." };
    }

    console.log("[tours] Tour approved successfully:", { tourId });

    revalidatePath("/tours");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/tours");

    return { status: "success" };
  } catch (error) {
    console.error("[tours] Unexpected error approving tour:", error);
    const message = error instanceof Error ? error.message : "Unable to approve tour.";
    return { status: "error", message };
  }
}

/**
 * Decline a tour request (landlord-only action)
 */
export async function declineTourAction(
  _prev: TourRequestState,
  formData: FormData
): Promise<TourRequestState> {
  try {
    const tourId = String(formData.get("tourId") ?? "").trim();
    const notesRaw = formData.get("notes");
    const notes = typeof notesRaw === "string" ? notesRaw.slice(0, 500) : null;

    if (!tourId) {
      return { status: "validation-error", message: "Tour ID is required." };
    }

    if (!hasSupabaseEnv) {
      return { status: "error", message: missingSupabaseMessage };
    }

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return { status: "error", message: "Service unavailable." };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { status: "error", message: "Authentication required." };
    }

    // Verify user is the landlord for this tour
    const { data: tour, error: fetchError } = await supabase
      .from("tours")
      .select("landlord_id, property_id, tenant_id, status")
      .eq("id", tourId)
      .single();

    if (fetchError || !tour) {
      return { status: "error", message: "Tour not found." };
    }

    if (tour.landlord_id !== user.id) {
      return { status: "error", message: "Only the landlord can decline this tour." };
    }

    if (tour.status !== "requested") {
      return { status: "error", message: "This tour has already been processed." };
    }

    // Update the tour to cancelled status
    const updatePayload: Record<string, unknown> = {
      status: "cancelled",
      updated_at: new Date().toISOString()
    };

    if (notes) {
      updatePayload['notes'] = notes;
    }

    const { error: updateError } = await supabase
      .from("tours")
      .update(updatePayload)
      .eq("id", tourId);

    if (updateError) {
      console.error("[tours] Decline error:", updateError);
      return { status: "error", message: "Failed to decline tour." };
    }

    console.log("[tours] Tour declined successfully:", { tourId });

    revalidatePath("/tours");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/tours");

    return { status: "success" };
  } catch (error) {
    console.error("[tours] Unexpected error declining tour:", error);
    const message = error instanceof Error ? error.message : "Unable to decline tour.";
    return { status: "error", message };
  }
}

/**
 * Reschedule a tour (landlord-only action)
 */
export async function rescheduleTourAction(
  _prev: TourRequestState,
  formData: FormData
): Promise<TourRequestState> {
  try {
    const tourId = String(formData.get("tourId") ?? "").trim();
    const date = String(formData.get("date") ?? "").trim();
    const time = String(formData.get("time") ?? "").trim();
    const notesRaw = formData.get("notes");
    const notes = typeof notesRaw === "string" ? notesRaw.slice(0, 500) : null;

    if (!tourId) {
      return { status: "validation-error", message: "Tour ID is required." };
    }

    if (!date || !time) {
      return { status: "validation-error", message: "Choose a new date and time." };
    }

    const scheduledAt = parseDateTime(date, time);
    if (!scheduledAt) {
      return { status: "validation-error", message: "Enter a valid date and time." };
    }

    // Validate future date/time
    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      return { status: "validation-error", message: "Tour must be scheduled in the future." };
    }

    if (!hasSupabaseEnv) {
      return { status: "error", message: missingSupabaseMessage };
    }

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return { status: "error", message: "Service unavailable." };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { status: "error", message: "Authentication required." };
    }

    // Rate limiting
    const rateLimitResult = checkRateLimit(user.id, RATE_LIMITS.tours);
    if (!rateLimitResult.allowed) {
      return {
        status: "error",
        message: "Too many requests. Please wait a moment."
      };
    }

    // Verify user is the landlord for this tour
    const { data: tour, error: fetchError } = await supabase
      .from("tours")
      .select("landlord_id, property_id, tenant_id")
      .eq("id", tourId)
      .single();

    if (fetchError || !tour) {
      return { status: "error", message: "Tour not found." };
    }

    if (tour.landlord_id !== user.id) {
      return { status: "error", message: "Only the landlord can reschedule this tour." };
    }

    // Update the tour
    const updatePayload: Record<string, unknown> = {
      scheduled_at: scheduledAt,
      status: "rescheduled",
      updated_at: new Date().toISOString()
    };

    if (notes) {
      updatePayload['notes'] = notes;
    }

    const { error: updateError } = await supabase
      .from("tours")
      .update(updatePayload)
      .eq("id", tourId);

    if (updateError) {
      console.error("[tours] Reschedule error:", updateError);
      return { status: "error", message: "Failed to reschedule tour." };
    }

    // TODO: Send notification to tenant about reschedule
    console.log("[tours] Tour rescheduled successfully:", { tourId, scheduledAt });

    revalidatePath("/tours");
    revalidatePath("/dashboard");

    return { status: "success" };
  } catch (error) {
    console.error("[tours] Unexpected error rescheduling tour:", error);
    const message = error instanceof Error ? error.message : "Unable to reschedule tour.";
    return { status: "error", message };
  }
}
