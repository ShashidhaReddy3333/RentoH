'use client';

import { BaseButton } from "@/components/ui/button";

export default function Error({
  error,
  reset
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="space-y-3 rounded-md border p-6">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-sm text-text-muted">
        {error?.message ?? "Unknown error"}
      </p>
      <BaseButton onClick={() => reset()} className="bg-black text-white">
        Retry
      </BaseButton>
    </div>
  );
}
