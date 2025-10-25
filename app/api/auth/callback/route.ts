import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

import { validateCsrfToken } from "@/lib/http/csrf";
import { createErrorResponse, HttpError } from "@/lib/http/errors";
import { checkRateLimit, getRateLimitKey, setRateLimitHeaders } from "@/lib/http/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const key = getRateLimitKey(request);
    const remaining = checkRateLimit(key);
    
    // Validate CSRF token
    const body = await request.json();
    const csrfToken = body.csrf;
    
    if (!validateCsrfToken(csrfToken)) {
      throw new HttpError(403, "Invalid CSRF token", "INVALID_CSRF");
    }
    
    const cookieStore = cookies();
    const supabase = createSupabaseServerClient();

    // Set auth cookie with secure flags (server client may be null)
    if (body.session) {
      const { access_token, refresh_token } = body.session;

      // If supabase client supports setting session, prefer that; otherwise fall back to setting cookies manually
      if (supabase && typeof supabase.auth?.setSession === 'function') {
        // supabase.auth.setSession exists in some client versions
        // call setSession with tokens if available
        // @ts-ignore - runtime check above ensures method exists
        await supabase.auth.setSession({ access_token, refresh_token });
      }

      // Ensure secure cookie settings for any supabase-related cookies present in the store
      for (const cookie of cookieStore.getAll()) {
        if (cookie.name.includes("supabase") || cookie.name.startsWith('sb-')) {
          try {
            cookieStore.set(cookie.name, cookie.value, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax"
            });
          } catch {
            // ignore failures setting cookies (e.g., called from SSR context)
          }
        }
      }
    }
    
    const response = NextResponse.json({ message: "Auth callback succeeded" });
    setRateLimitHeaders(response.headers, remaining);
    return response;
  } catch (error) {
    return createErrorResponse(error instanceof Error ? error : new Error("Unknown error"));
  }
}