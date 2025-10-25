import { cookies } from "next/headers";
import { randomBytes } from "crypto";

const CSRF_COOKIE = "rento_csrf";
const CSRF_SECRET_LENGTH = 32;

export function generateCsrfToken(): string {
  return randomBytes(CSRF_SECRET_LENGTH).toString("base64url");
}

export function setCsrfCookie(token: string) {
  cookies().set(CSRF_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export function getCsrfCookie(): string | undefined {
  return cookies().get(CSRF_COOKIE)?.value;
}

export function validateCsrfToken(token: string | undefined): boolean {
  const cookieToken = getCsrfCookie();
  if (!cookieToken || !token) {
    return false;
  }
  
  // Use timing-safe comparison
  return timingSafeEqual(cookieToken, token);
}

// Timing-safe string comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  // Simple constant-time comparison
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}