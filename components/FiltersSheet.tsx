"use client";

import { useEffect, type ChangeEvent } from "react";
import type { Property } from "@/lib/types";

import { buttonStyles } from "@/components/ui/button";

export type FiltersState = {
  city: string;
  min: number | null;
  max: number | null;
  beds: number | null;
  baths: number | null;
  type: Property["type"] | "any";
  pets: boolean;
  furnished: boolean;
  verified: boolean;
};

type FiltersSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  values: FiltersState;
  onChange: (values: FiltersState) => void;
  onApply: () => void;
  onClear: () => void;
  renderStatic?: boolean;
};

const priceRange = { min: 500, max: 6000, step: 100 };

export default function FiltersSheet({
  open,
  onOpenChange,
  values,
  onChange,
  onApply,
  onClear,
  renderStatic = false
}: FiltersSheetProps) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      {renderStatic && (
        <div className="hidden md:block">
          <FiltersContent
            values={values}
            onChange={onChange}
            onApply={onApply}
            onClear={onClear}
          />
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-sm md:hidden">
          <div className="rounded-t-3xl bg-white shadow-soft">
            <header className="flex items-center justify-between border-b border-black/5 px-4 py-3">
              <h2 className="text-base font-semibold text-textc">Filters</h2>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-full px-3 py-1 text-sm font-medium text-text-muted transition hover:text-brand-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                data-testid="filters-close"
              >
                Close
              </button>
            </header>
            <FiltersContent
              values={values}
              onChange={onChange}
              onApply={() => {
                onApply();
                onOpenChange(false);
              }}
              onClear={onClear}
            />
          </div>
        </div>
      )}
    </>
  );
}

type ContentProps = {
  values: FiltersState;
  onChange: (values: FiltersState) => void;
  onApply: () => void;
  onClear: () => void;
};

export function FiltersContent({ values, onChange, onApply, onClear }: ContentProps) {
  const handleNumber =
    (field: keyof FiltersState) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      onChange({ ...values, [field]: value ? Number(value) : null });
    };

  const handleCheckbox =
    (field: keyof FiltersState) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange({ ...values, [field]: event.target.checked });
    };

  return (
    <div className="flex flex-col gap-6 px-4 py-6 text-sm text-text-muted">
      <div className="grid gap-4">
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide">City</span>
          <input
            value={values.city}
            onChange={(event) => onChange({ ...values, city: event.target.value })}
            placeholder="Neighbourhood or city"
            className="input"
          />
        </label>

        <div className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide">Budget</span>
          <div className="grid gap-3 rounded-2xl border border-black/5 bg-surface px-3 py-4">
            <div className="flex items-center justify-between text-xs font-medium">
              <span>${values.min ?? priceRange.min}</span>
              <span>${values.max ?? priceRange.max}</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={priceRange.min}
                max={priceRange.max}
                step={priceRange.step}
                value={values.min ?? priceRange.min}
                onChange={handleNumber("min")}
                aria-label="Minimum price"
                className="w-full accent-brand-teal"
              />
              <input
                type="range"
                min={priceRange.min}
                max={priceRange.max}
                step={priceRange.step}
                value={values.max ?? priceRange.max}
                onChange={handleNumber("max")}
                aria-label="Maximum price"
                className="w-full accent-brand-teal"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide">Beds</span>
            <input
              type="number"
              min={0}
              value={values.beds ?? ""}
              onChange={handleNumber("beds")}
              className="input"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide">Baths</span>
            <input
              type="number"
              min={0}
              value={values.baths ?? ""}
              onChange={handleNumber("baths")}
              className="input"
            />
          </label>
        </div>

        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide">Type</span>
          <select
            value={values.type}
            onChange={(event) =>
              onChange({ ...values, type: event.target.value as FiltersState["type"] })
            }
            className="input"
          >
            <option value="any">Any</option>
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="condo">Condo</option>
          </select>
        </label>
      </div>

      <div className="grid gap-3">
        <Toggle
          id="filter-pets"
          label="Pet-friendly"
          checked={values.pets}
          onChange={handleCheckbox("pets")}
        />
        <Toggle
          id="filter-furnished"
          label="Furnished"
          checked={values.furnished}
          onChange={handleCheckbox("furnished")}
        />
        <Toggle
          id="filter-verified"
          label="Verified listings only"
          checked={values.verified}
          onChange={handleCheckbox("verified")}
        />
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-black/5 pt-4">
        <button
          type="button"
          onClick={onClear}
          className="text-sm font-medium text-brand-blue transition hover:text-brand-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          data-testid="filters-clear"
        >
          Clear all
        </button>
        <button
          type="button"
          onClick={onApply}
          className={buttonStyles({ variant: "primary", size: "md" })}
          data-testid="filters-apply"
        >
          Apply filters
        </button>
      </div>
    </div>
  );
}

function Toggle({
  id,
  label,
  checked,
  onChange
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex items-center justify-between gap-4 rounded-2xl border border-black/5 bg-surface px-4 py-3"
    >
      <span className="text-sm font-medium text-textc">{label}</span>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-5 w-10 cursor-pointer appearance-none rounded-full border border-brand-teal/40 bg-brand-teal/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-white checked:bg-brand-teal"
        role="switch"
        aria-checked={checked}
      />
    </label>
  );
}
