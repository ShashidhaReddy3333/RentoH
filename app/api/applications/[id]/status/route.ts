import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSupabaseClientWithUser } from "@/lib/supabase/auth";
import {
  appendTimelineEntry,
  canonicalStatusToStorage,
  getNextStatusTimestamps,
  isValidApplicationStatusTransition,
  normalizeApplicationStatus
} from "@/lib/application-status";

const StatusPayload = z.object({
  status: z.enum(["submitted", "reviewing", "interview", "accepted", "rejected"], {
    errorMap: () => ({ message: "Invalid application status" })
  }),
  note: z.string().max(280).optional()
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: "Missing application id" }, { status: 400 });
  }

  const { supabase, user } = await getSupabaseClientWithUser();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const payloadJson = await request.json().catch(() => null);
  const parsed = StatusPayload.safeParse(payloadJson);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request payload",
        details: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: application, error: fetchError } = await supabase
    .from("applications")
    .select("id, landlord_id, tenant_id, status, submitted_at, reviewed_at, decision_at, timeline")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  if (application.landlord_id !== user.id) {
    return NextResponse.json({ error: "Only the listing landlord can update this application." }, { status: 403 });
  }

  const currentStatus = application.status ?? "submitted";
  const nextStatus = parsed.data.status;

  if (!isValidApplicationStatusTransition(currentStatus, nextStatus)) {
    return NextResponse.json(
      {
        error: `Cannot change a ${normalizeApplicationStatus(currentStatus)} application to ${normalizeApplicationStatus(nextStatus)}`
      },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const updatePayload: Record<string, unknown> = {
    status: canonicalStatusToStorage(normalizeApplicationStatus(nextStatus)),
    updated_at: now,
    timeline: appendTimelineEntry(application.timeline, {
      status: normalizeApplicationStatus(nextStatus),
      timestamp: now,
      note: parsed.data.note
    })
  };

  const { reviewed, decision } = getNextStatusTimestamps(nextStatus);
  if (reviewed) {
    updatePayload["reviewed_at"] = now;
    if (!application.submitted_at) {
      updatePayload["submitted_at"] = now;
    }
  }
  if (decision) {
    updatePayload["decision_at"] = now;
  }

  const { error: updateError } = await supabase.from("applications").update(updatePayload).eq("id", id);
  if (updateError) {
    console.error("[applications] Failed to update status", updateError);
    return NextResponse.json({ error: "Failed to update application status" }, { status: 500 });
  }

  try {
    const digestOrigin = process.env["NEXT_PUBLIC_SITE_URL"] || request.nextUrl?.origin;
    if (digestOrigin) {
      await fetch(`${digestOrigin}/api/digest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: application.tenant_id, reason: "application_update" })
      });
    }
  } catch (error) {
    console.error("[applications] Failed to trigger digest notification", error);
  }

  revalidatePath("/applications");
  revalidatePath(`/applications/${id}`);
  revalidatePath("/dashboard");

  return NextResponse.json({
    ok: true,
    status: normalizeApplicationStatus(nextStatus),
    reviewed_at: updatePayload["reviewed_at"] ?? application.reviewed_at,
    decision_at: updatePayload["decision_at"] ?? application.decision_at
  });
}
