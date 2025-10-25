import { NextResponse, type NextRequest } from "next/server";
import { validateAuthRequest, handleAuthError } from "@/lib/http/auth";
import { generateDigestForUser } from "@/lib/notifications/digest";

export async function POST(request: NextRequest) {
  try {
    // Don't require CSRF for this internal trigger; just ensure caller is authenticated
    const { body } = await validateAuthRequest(request, { requireCsrf: false });
    const { userId, reason } = body as { userId?: string; reason?: string };
    if (!userId) return NextResponse.json({ success: false, error: "missing userId" }, { status: 400 });

    await generateDigestForUser(userId, { trigger: reason ?? "manual" });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
