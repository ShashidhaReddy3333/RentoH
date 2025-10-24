import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "node:crypto";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const CSRF_COOKIE = "rento_csrf";

type AuthCallbackPayload = {
  event?: string;
  session?: unknown;
  csrf?: string;
};

export async function POST(request: Request) {
  const csrfCookie = cookies().get(CSRF_COOKIE)?.value;
  if (!csrfCookie) {
    return new Response("Invalid CSRF", { status: 403 });
  }

  let body: AuthCallbackPayload;
  try {
    body = (await request.json()) as AuthCallbackPayload;
  } catch {
    return new Response("Invalid payload", { status: 400 });
  }

  const csrfBody = typeof body?.csrf === "string" ? body.csrf : null;
  if (!csrfBody || !timingSafeEquals(csrfCookie, csrfBody)) {
    return new Response("Invalid CSRF", { status: 403 });
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase unavailable." }, { status: 503 });
  }

  const { event, session } = body;

  if (
    event === "SIGNED_IN" ||
    event === "TOKEN_REFRESHED" ||
    event === "INITIAL_SESSION"
  ) {
    const accessToken = (session as Record<string, unknown> | null)?.["access_token"];
    const refreshToken = (session as Record<string, unknown> | null)?.["refresh_token"];
    if (typeof accessToken === "string" && typeof refreshToken === "string") {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });
    }
  } else if (event === "SIGNED_OUT") {
    await supabase.auth.signOut();
  }

  return NextResponse.json({ success: true });
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}

function timingSafeEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}


