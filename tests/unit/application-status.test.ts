import { describe, it, expect } from 'vitest';

import {
  isValidApplicationStatusTransition,
  normalizeApplicationStatus
} from '@/lib/application-status';

describe('application status transitions', () => {
  describe('valid transitions', () => {
    it('allows submitted -> reviewing', () => {
      expect(isValidApplicationStatusTransition('submitted', 'reviewing')).toBe(true);
    });

    it('allows reviewing -> accepted', () => {
      expect(isValidApplicationStatusTransition('reviewing', 'accepted')).toBe(true);
    });

    it('allows reviewing -> rejected', () => {
      expect(isValidApplicationStatusTransition('reviewing', 'rejected')).toBe(true);
    });

    it('allows interview -> accepted', () => {
      expect(isValidApplicationStatusTransition('interview', 'accepted')).toBe(true);
    });

    it('treats approved as accepted', () => {
      expect(normalizeApplicationStatus('approved')).toBe('accepted');
      expect(isValidApplicationStatusTransition('reviewing', 'approved')).toBe(true);
    });
  });

  describe('invalid transitions', () => {
    it('blocks accepted -> reviewing', () => {
      expect(isValidApplicationStatusTransition('accepted', 'reviewing')).toBe(false);
    });

    it('blocks rejected -> accepted', () => {
      expect(isValidApplicationStatusTransition('rejected', 'accepted')).toBe(false);
    });

    it('blocks reviewing -> submitted', () => {
      expect(isValidApplicationStatusTransition('reviewing', 'submitted')).toBe(false);
    });

    it('blocks repeat statuses', () => {
      expect(isValidApplicationStatusTransition('submitted', 'submitted')).toBe(false);
    });
  });
});
