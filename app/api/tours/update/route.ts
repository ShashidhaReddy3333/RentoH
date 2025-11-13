import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import type { TourStatus } from "@/lib/types";

const TourUpdateSchema = z.object({
  tourId: z.string().uuid("Invalid tour ID"),
  status: z.enum(["confirmed", "completed", "cancelled", "rescheduled"], {
    errorMap: () => ({ message: "Invalid status" })
  }),
  scheduledAt: z.string().datetime("Invalid date format").optional(),
  timezone: z.string().min(1).optional(),
  notes: z.string().max(500).optional(),
  cancelledReason: z.string().max(500).optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    // Validate schema
    const parseResult = TourUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid request payload", 
          details: parseResult.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const payload = parseResult.data;

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = checkRateLimit(user.id, RATE_LIMITS.tours);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMITS.tours.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
          }
        }
      );
    }

    // Fetch the tour and verify permissions
    const { data: tour, error: fetchError } = await supabase
      .from("tours")
      .select("landlord_id, tenant_id, property_id, status, scheduled_at, timezone")
      .eq("id", payload.tourId)
      .single();

    if (fetchError || !tour) {
      return NextResponse.json({ error: "Tour not found" }, { status: 404 });
    }

    const isLandlord = tour.landlord_id === user.id;
    const isTenant = tour.tenant_id === user.id;

    if (!isLandlord && !isTenant) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const currentStatus = (tour.status ?? "requested") as TourStatus;
    const landlordTransitions: Record<TourStatus, TourStatus[]> = {
      requested: ["confirmed", "cancelled", "rescheduled"],
      confirmed: ["completed", "cancelled", "rescheduled"],
      rescheduled: ["confirmed", "cancelled"],
      completed: [],
      cancelled: []
    };
    const tenantTransitions: Record<TourStatus, TourStatus[]> = {
      requested: ["cancelled"],
      confirmed: ["cancelled"],
      rescheduled: ["cancelled"],
      completed: [],
      cancelled: []
    };

    const allowedTransitions = isLandlord ? landlordTransitions : tenantTransitions;
    if (!allowedTransitions[currentStatus]?.includes(payload.status)) {
      return NextResponse.json(
        {
          error: `Cannot change a ${currentStatus} tour to ${payload.status}`
        },
        { status: 400 }
      );
    }

    if (payload.status === "rescheduled" && !payload.scheduledAt) {
      return NextResponse.json(
        { error: "Provide a new time when rescheduling a tour." },
        { status: 400 }
      );
    }

    if (payload.scheduledAt) {
      const newDate = new Date(payload.scheduledAt);
      if (newDate <= new Date()) {
        return NextResponse.json(
          { error: "Tour date must be in the future" },
          { status: 400 }
        );
      }

      const { data: conflicts, error: conflictError } = await supabase
        .from("tours")
        .select("id")
        .eq("property_id", tour.property_id)
        .eq("scheduled_at", payload.scheduledAt)
        .neq("id", payload.tourId)
        .in("status", ["requested", "confirmed", "rescheduled"]);

      if (conflictError) {
        console.error("[tours] Conflict check failed", conflictError);
      } else if (conflicts && conflicts.length > 0) {
        return NextResponse.json(
          { error: "This time slot is already booked. Please choose another time." },
          { status: 409 }
        );
      }
    }

    // Build update payload
    const updateData: Record<string, unknown> = {
      status: payload.status,
      updated_at: new Date().toISOString()
    };
    if (payload.status === "completed") {
      updateData["completed_at"] = new Date().toISOString();
    }

    if (payload.scheduledAt) {
      updateData["scheduled_at"] = payload.scheduledAt;
    }

    if (payload.timezone) {
      updateData["timezone"] = payload.timezone;
    } else if (payload.scheduledAt && tour.timezone) {
      updateData["timezone"] = tour.timezone;
    }

    if (payload.notes !== undefined) {
      updateData["notes"] = payload.notes;
    }

    if (payload.cancelledReason) {
      updateData["cancelled_reason"] = payload.cancelledReason;
    }

    if (payload.status === "cancelled") {
      updateData["cancelled_by"] = user.id;
    }

    // Update the tour
    const { error: updateError } = await supabase
      .from("tours")
      .update(updateData)
      .eq("id", payload.tourId);

    if (updateError) {
      // Check if it's a conflict error
      if (updateError.message?.includes('Tour slot conflict')) {
        return NextResponse.json(
          { error: "This time slot is already booked. Please choose another time." },
          { status: 409 }
        );
      }
      
      console.error("[tours] Update error:", updateError);
      return NextResponse.json({ error: "Failed to update tour" }, { status: 500 });
    }

    // Send notification to the other party
    try {
      const recipientId = isLandlord ? tour.tenant_id : tour.landlord_id;
      const origin = process.env['NEXT_PUBLIC_SITE_URL'] || request.nextUrl.origin;
      await fetch(`${origin}/api/digest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: recipientId, reason: 'tour_updated' })
      });
    } catch (err) {
      console.error("[tours] Failed to trigger notification", err);
    }

    revalidatePath("/tours");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/tours");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[tours] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
