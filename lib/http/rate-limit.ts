import type { NextRequest } from "next/server";
import { HttpError } from "./errors";

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // Max requests per window

type RateLimitStore = {
  [key: string]: {
    count: number;
    timestamp: number;
  };
};

// In-memory store for rate limiting
// Note: In production, use Redis or similar for distributed systems
const store: RateLimitStore = {};

export function getRateLimitKey(req: NextRequest): string {
  // Use a combination of IP and user agent
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0] || "unknown";
  const ua = req.headers.get("user-agent") || "unknown";
  
  return `${ip}:${ua}`;
}

export function checkRateLimit(key: string) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  // Clean up old entries
  for (const k in store) {
    if (!store[k] || store[k].timestamp < windowStart) {
      delete store[k];
    }
  }
  
  // Get or create entry
  const entry = store[key] || { count: 0, timestamp: now };
  
  // Reset if outside window
  if (entry.timestamp < windowStart) {
    entry.count = 0;
    entry.timestamp = now;
  }
  
  // Check limit
  if (entry.count >= MAX_REQUESTS) {
    throw new HttpError(
      429,
      "Too many requests. Please try again later",
      "RATE_LIMIT_EXCEEDED"
    );
  }
  
  // Update count
  entry.count++;
  store[key] = entry;
  
  // Return remaining requests
  return MAX_REQUESTS - entry.count;
}

export function setRateLimitHeaders(headers: Headers, remaining: number) {
  headers.set("X-RateLimit-Limit", MAX_REQUESTS.toString());
  headers.set("X-RateLimit-Remaining", Math.max(0, remaining).toString());
  headers.set("X-RateLimit-Reset", (Date.now() + RATE_LIMIT_WINDOW).toString());
}