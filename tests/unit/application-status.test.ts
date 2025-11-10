import { describe, it, expect } from 'vitest';

describe('Application Status Transitions', () => {
  // Define valid status transitions
  const validTransitions: Record<string, string[]> = {
    submitted: ['reviewing', 'approved', 'rejected'],
    reviewing: ['interview', 'approved', 'rejected'],
    interview: ['approved', 'rejected'],
  };

  function isValidTransition(currentStatus: string, newStatus: string): boolean {
    const allowedTransitions = validTransitions[currentStatus];
    return allowedTransitions ? allowedTransitions.includes(newStatus) : false;
  }

  describe('Valid transitions', () => {
    it('should allow submitted -> reviewing', () => {
      expect(isValidTransition('submitted', 'reviewing')).toBe(true);
    });

    it('should allow submitted -> approved', () => {
      expect(isValidTransition('submitted', 'approved')).toBe(true);
    });

    it('should allow submitted -> rejected', () => {
      expect(isValidTransition('submitted', 'rejected')).toBe(true);
    });

    it('should allow reviewing -> interview', () => {
      expect(isValidTransition('reviewing', 'interview')).toBe(true);
    });

    it('should allow reviewing -> approved', () => {
      expect(isValidTransition('reviewing', 'approved')).toBe(true);
    });

    it('should allow reviewing -> rejected', () => {
      expect(isValidTransition('reviewing', 'rejected')).toBe(true);
    });

    it('should allow interview -> approved', () => {
      expect(isValidTransition('interview', 'approved')).toBe(true);
    });

    it('should allow interview -> rejected', () => {
      expect(isValidTransition('interview', 'rejected')).toBe(true);
    });
  });

  describe('Invalid transitions', () => {
    it('should not allow approved -> any status', () => {
      expect(isValidTransition('approved', 'reviewing')).toBe(false);
      expect(isValidTransition('approved', 'rejected')).toBe(false);
    });

    it('should not allow rejected -> any status', () => {
      expect(isValidTransition('rejected', 'approved')).toBe(false);
      expect(isValidTransition('rejected', 'reviewing')).toBe(false);
    });

    it('should not allow reviewing -> submitted', () => {
      expect(isValidTransition('reviewing', 'submitted')).toBe(false);
    });

    it('should not allow interview -> submitted', () => {
      expect(isValidTransition('interview', 'submitted')).toBe(false);
    });

    it('should not allow interview -> reviewing', () => {
      expect(isValidTransition('interview', 'reviewing')).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle unknown current status', () => {
      expect(isValidTransition('unknown', 'approved')).toBe(false);
    });

    it('should handle empty status', () => {
      expect(isValidTransition('', 'approved')).toBe(false);
    });

    it('should not allow same status transition', () => {
      expect(isValidTransition('submitted', 'submitted')).toBe(false);
      expect(isValidTransition('reviewing', 'reviewing')).toBe(false);
    });
  });
});
