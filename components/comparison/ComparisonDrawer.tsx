"use client";

import Link from "next/link";
import { ArrowsRightLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";

import { usePropertyComparison } from "@/components/property/PropertyComparison";
import { buttonStyles } from "@/components/ui/button";

export function ComparisonDrawer() {
  const { comparisonIds, clearComparison } = usePropertyComparison();

  if (comparisonIds.length === 0) {
    return null;
  }

  return (
    <aside
      className="fixed inset-x-4 bottom-4 z-30 mx-auto max-w-3xl rounded-3xl border border-brand-outline/60 bg-white/95 px-4 py-3 shadow-xl backdrop-blur"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
          <ArrowsRightLeftIcon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-brand-dark">
            {comparisonIds.length} {comparisonIds.length === 1 ? "home" : "homes"} ready to compare
          </p>
          <p className="text-xs text-text-muted">Add up to three listings, then open the comparison table.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clearComparison}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-brand-outline/30 text-text-muted transition hover:text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40"
            aria-label="Clear comparison list"
          >
            <XMarkIcon className="h-4 w-4" aria-hidden="true" />
          </button>
          <Link
            href="/compare"
            className={buttonStyles({ variant: "primary", size: "sm" })}
            aria-label="Open comparison page"
          >
            Review comparison
          </Link>
        </div>
      </div>
    </aside>
  );
}
