"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="space-y-3 rounded-md border border-outline/80 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-ink">Something went wrong</h2>
      <p className="text-sm text-ink-muted">
        {error?.message ?? "Unknown error"}
      </p>
      <Button variant="primary" size="md" onClick={() => reset()}>
        Retry
      </Button>
    </div>
  );
}
