import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, RATE_LIMITS } from '@/lib/middleware/rate-limit';

describe('Rate Limiting', () => {
  const userId = 'test-user-123';

  beforeEach(() => {
    // Clear rate limit stores by waiting for window to expire
    // In production, you might want to expose a clearStore function for testing
  });

  describe('checkRateLimit', () => {
    it('should allow first request', () => {
      const result = checkRateLimit(userId, RATE_LIMITS.messages);
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(RATE_LIMITS.messages.maxRequests - 1);
      expect(result.resetAt).toBeGreaterThan(Date.now());
    });

    it('should track multiple requests', () => {
      const config = RATE_LIMITS.messages;
      
      // Make several requests
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(userId + '-multi', config);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(config.maxRequests - (i + 1));
      }
    });

    it('should block requests when limit exceeded', () => {
      const config = { ...RATE_LIMITS.applications, storeName: 'test-block' };
      
      // Exhaust the limit
      for (let i = 0; i < config.maxRequests; i++) {
        checkRateLimit(userId + '-block', config);
      }
      
      // Next request should be blocked
      const result = checkRateLimit(userId + '-block', config);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should reset after window expires', async () => {
      const shortWindowConfig = {
        maxRequests: 2,
        windowMs: 100, // 100ms window
        storeName: 'test-reset',
      };
      
      // Exhaust the limit
      checkRateLimit(userId + '-reset', shortWindowConfig);
      checkRateLimit(userId + '-reset', shortWindowConfig);
      
      // Should be blocked
      let result = checkRateLimit(userId + '-reset', shortWindowConfig);
      expect(result.allowed).toBe(false);
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should be allowed again
      result = checkRateLimit(userId + '-reset', shortWindowConfig);
      expect(result.allowed).toBe(true);
    });

    it('should handle different users independently', () => {
      const user1 = 'user-1';
      const user2 = 'user-2';
      const config = { ...RATE_LIMITS.tours, storeName: 'test-multi-user' };
      
      // User 1 makes requests
      for (let i = 0; i < config.maxRequests; i++) {
        const result = checkRateLimit(user1, config);
        expect(result.allowed).toBe(true);
      }
      
      // User 1 is blocked
      const result1 = checkRateLimit(user1, config);
      expect(result1.allowed).toBe(false);
      
      // User 2 should still be allowed
      const result2 = checkRateLimit(user2, config);
      expect(result2.allowed).toBe(true);
    });
  });

  describe('RATE_LIMITS constants', () => {
    it('should have reasonable limits for messages', () => {
      expect(RATE_LIMITS.messages.maxRequests).toBe(10);
      expect(RATE_LIMITS.messages.windowMs).toBe(60000);
    });

    it('should have reasonable limits for applications', () => {
      expect(RATE_LIMITS.applications.maxRequests).toBe(5);
      expect(RATE_LIMITS.applications.windowMs).toBe(60000);
    });

    it('should have reasonable limits for tours', () => {
      expect(RATE_LIMITS.tours.maxRequests).toBe(5);
      expect(RATE_LIMITS.tours.windowMs).toBe(60000);
    });

    it('should have higher limits for favorites', () => {
      expect(RATE_LIMITS.favorites.maxRequests).toBe(20);
      expect(RATE_LIMITS.favorites.windowMs).toBe(60000);
    });
  });
});
