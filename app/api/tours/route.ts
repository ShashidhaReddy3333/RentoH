import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { revalidatePath } from "next/cache";

const TourRequestSchema = z.object({
  propertyId: z.string().uuid("Invalid property ID"),
  landlordId: z.string().uuid("Invalid landlord ID"),
  scheduledAt: z.string().datetime("Invalid date format"),
  timezone: z.string().min(1).default("UTC"),
  notes: z.string().max(500).optional()
});

// POST: Request a new tour (tenant)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    // Validate schema
    const parseResult = TourRequestSchema.safeParse(body);
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

    // Validate that the date is in the future
    const scheduledDate = new Date(payload.scheduledAt);
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: "Tour date must be in the future" },
        { status: 400 }
      );
    }

    // Verify the property exists and belongs to the specified landlord
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("landlord_id")
      .eq("id", payload.propertyId)
      .single();

    if (propertyError || !property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    if (property.landlord_id !== payload.landlordId) {
      return NextResponse.json({ error: "Invalid landlord ID for this property" }, { status: 400 });
    }

    // Insert the tour request
    const { data: tour, error } = await supabase
      .from("tours")
      .insert({
        property_id: payload.propertyId,
        landlord_id: payload.landlordId,
        tenant_id: user.id,
        scheduled_at: payload.scheduledAt,
        timezone: payload.timezone,
        notes: payload.notes,
        status: "requested"
      })
      .select()
      .single();

    if (error) {
      // Check if it's a conflict error
      if (error.message?.includes('Tour slot conflict')) {
        return NextResponse.json(
          { error: "This time slot is already booked. Please choose another time." },
          { status: 409 }
        );
      }
      
      console.error("[tours] Insert error:", error);
      return NextResponse.json({ error: "Failed to request tour" }, { status: 500 });
    }

    // Trigger notification for landlord
    try {
      const origin = process.env['NEXT_PUBLIC_SITE_URL'] || request.nextUrl.origin;
      await fetch(`${origin}/api/digest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: payload.landlordId, reason: 'tour_requested' })
      });
    } catch (err) {
      console.error("[tours] Failed to trigger notification", err);
    }

    revalidatePath("/tours");
    revalidatePath("/dashboard");

    return NextResponse.json({ tour }, { status: 201 });
  } catch (error) {
    console.error("[tours] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
