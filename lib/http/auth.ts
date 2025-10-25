import { type NextRequest } from "next/server";

import { validateCsrfToken } from "./csrf";
import { createErrorResponse, HttpError } from "./errors";
import { checkRateLimit, getRateLimitKey } from "./rate-limit"; // Removed setRateLimitHeaders as it's unused
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface ValidateAuthRequestOptions {
  requireCsrf?: boolean;
}

export async function validateAuthRequest(
  req: NextRequest,
  { requireCsrf = true }: ValidateAuthRequestOptions = {}
) {
  try {
    // Check rate limit
    const key = getRateLimitKey(req);
    const remaining = checkRateLimit(key);

    // Get request body if needed
    const body = requireCsrf ? await req.json() : undefined; // Keep this as it's used
    
    // Validate CSRF token if required
    if (requireCsrf) {
      const csrfToken = body?.csrf;
      if (!validateCsrfToken(csrfToken)) {
        throw new HttpError(403, "Invalid request signature", "INVALID_CSRF");
      }
    }

  // Initialize Supabase client
  const supabase = createSupabaseServerClient();
    
    return {
      body,
      supabase,
      rateLimit: { key, remaining }
    };
  } catch (error) {
    // Let error handler normalize the error response
    throw error instanceof Error ? error : new Error("Invalid request");
  }
}

export async function handleAuthError(error: unknown) {
  if (error instanceof HttpError) {
    return createErrorResponse(error);
  }

  const err = error as Error;
  
  // Normalize Supabase auth errors
  if (err.message?.toLowerCase().includes("invalid credentials")) {
    return createErrorResponse(
      new HttpError(401, "Invalid email or password", "INVALID_CREDENTIALS")
    );
  }
  
  if (err.message?.toLowerCase().includes("email not confirmed")) {
    return createErrorResponse(
      new HttpError(401, "Please verify your email before signing in", "EMAIL_NOT_VERIFIED")
    );
  }

  if (err.message?.toLowerCase().includes("rate limit")) {
    return createErrorResponse(
      new HttpError(429, "Too many attempts. Please try again later", "RATE_LIMIT")
    );
  }

  // Generic error for anything else
  return createErrorResponse(
    new HttpError(500, "Authentication failed", "AUTH_ERROR")
  );
}