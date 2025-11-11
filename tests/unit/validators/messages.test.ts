import { describe, it, expect } from 'vitest';
import { MessagePayload } from '@/lib/validators/messages';

describe('Message Validator', () => {
  it('should validate correct message payload', () => {
    const validPayload = {
      threadId: '123e4567-e89b-12d3-a456-426614174000',
      body: 'Hello, this is a test message'
    };

    const result = MessagePayload.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('should reject invalid UUID', () => {
    const invalidPayload = {
      threadId: 'not-a-uuid',
      body: 'Hello'
    };

    const result = MessagePayload.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });

  it('should reject empty message body', () => {
    const invalidPayload = {
      threadId: '123e4567-e89b-12d3-a456-426614174000',
      body: ''
    };

    const result = MessagePayload.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });

  it('should reject message body exceeding 2000 characters', () => {
    const invalidPayload = {
      threadId: '123e4567-e89b-12d3-a456-426614174000',
      body: 'a'.repeat(2001)
    };

    const result = MessagePayload.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });

  it('should accept message body at max length', () => {
    const validPayload = {
      threadId: '123e4567-e89b-12d3-a456-426614174000',
      body: 'a'.repeat(2000)
    };

    const result = MessagePayload.safeParse(validPayload);
    expect(result.success).toBe(true);
  });
});
