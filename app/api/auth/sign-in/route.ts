import { NextResponse, type NextRequest } from "next/server";
import { validateAuthRequest, handleAuthError } from "@/lib/http/auth";
import { setRateLimitHeaders } from "@/lib/http/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const { body, supabase, rateLimit } = await validateAuthRequest(request);

    if (!supabase) {
      // Supabase server client is not configured
      throw new Error('Supabase server client unavailable');
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password
    });

    if (error) throw error;

    const response = NextResponse.json({ 
      message: "Sign in successful" 
    });
    
    // Add rate limit headers
    setRateLimitHeaders(response.headers, rateLimit.remaining);
    
    return response;
  } catch (error) {
    return handleAuthError(error);
  }
}