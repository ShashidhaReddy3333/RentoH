/**
 * Simple in-memory rate limiting middleware
 * Limits actions per user per minute to prevent spam
 */

type RateLimitStore = Map<string, { count: number; resetAt: number }>;

const stores = new Map<string, RateLimitStore>();

function getStore(storeName: string): RateLimitStore {
  if (!stores.has(storeName)) {
    stores.set(storeName, new Map());
  }
  return stores.get(storeName)!;
}

function cleanupExpiredEntries(store: RateLimitStore): void {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (now > value.resetAt) {
      store.delete(key);
    }
  }
}

export type RateLimitConfig = {
  maxRequests: number;
  windowMs: number;
  storeName: string;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

/**
 * Check if a request should be rate limited
 * @param userId - User identifier
 * @param config - Rate limit configuration
 * @returns Rate limit result with allowed status and metadata
 */
export function checkRateLimit(userId: string, config: RateLimitConfig): RateLimitResult {
  const store = getStore(config.storeName);
  const now = Date.now();
  
  // Cleanup expired entries periodically (every 100 checks)
  if (Math.random() < 0.01) {
    cleanupExpiredEntries(store);
  }

  const entry = store.get(userId);

  if (!entry || now > entry.resetAt) {
    // First request or window expired, create new entry
    const resetAt = now + config.windowMs;
    store.set(userId, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt,
    };
  }

  if (entry.count >= config.maxRequests) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // Increment count
  entry.count += 1;
  store.set(userId, entry);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Common rate limit configurations
 */
export const RATE_LIMITS = {
  messages: {
    maxRequests: 10,
    windowMs: 60000, // 1 minute
    storeName: 'messages',
  },
  applications: {
    maxRequests: 5,
    windowMs: 60000, // 1 minute
    storeName: 'applications',
  },
  tours: {
    maxRequests: 5,
    windowMs: 60000, // 1 minute
    storeName: 'tours',
  },
  favorites: {
    maxRequests: 20,
    windowMs: 60000, // 1 minute
    storeName: 'favorites',
  },
} as const;
