'use client';

import type { TourStatusActionValue } from '@/lib/tours/status';

export type TourStatusUpdatePayload = {
  tourId: string;
  status: TourStatusActionValue;
  notes?: string;
  cancelledReason?: string;
  scheduledAt?: string;
  timezone?: string;
};

function extractErrorMessage(input: unknown): string | undefined {
  if (!input) return undefined;
  if (typeof input === 'string') return input;
  if (typeof input === 'object') {
    const record = input as Record<string, unknown>;
    const message = record['error'] ?? record['message'];
    return typeof message === 'string' ? message : undefined;
  }
  return undefined;
}

export async function updateTourStatusClient(payload: TourStatusUpdatePayload): Promise<void> {
  const response = await fetch('/api/tours/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const details = await response.json().catch(() => null);
    throw new Error(extractErrorMessage(details) ?? 'Failed to update tour status');
  }
}
