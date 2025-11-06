"use client";

import type { PropertySort } from "@/lib/types";

export default function SortMenu({
  value,
  onChange
}: {
  value: PropertySort;
  onChange: (v: PropertySort) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium text-neutral-600">
      <span>Sort</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as PropertySort)}
        className="rounded-full border border-brand-outline/70 bg-white px-3 py-2 text-sm text-brand-dark shadow-sm transition focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        data-testid="sort-select"
      >
        <option value="newest">Newest</option>
        <option value="priceAsc">Price (Low to High)</option>
        <option value="priceDesc">Price (High to Low)</option>
      </select>
    </label>
  );
}
