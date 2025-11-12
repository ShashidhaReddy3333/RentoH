import type { Metadata } from "next";
import { PropertyComparisonClient } from "@/app/compare/PropertyComparisonClient";

export const metadata: Metadata = {
  title: "Compare Properties - Rento",
  description: "Compare rental properties side by side to make the best decision for your next home."
};

export default function ComparePage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-brand-dark">Compare Properties</h1>
        <p className="text-sm text-text-muted">
          Compare up to 3 properties side by side to find the perfect match for your needs.
        </p>
      </header>
      <PropertyComparisonClient />
    </div>
  );
}
