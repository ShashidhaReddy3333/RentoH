"use client";

import { useEffect, type ChangeEvent } from "react";
import clsx from "clsx";

import type { Property } from "@/lib/types";
import { buttonStyles } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format";

const SHEET_ID_PREFIX = "filters-sheet";
export const MOBILE_FILTERS_PANEL_ID = `${SHEET_ID_PREFIX}-panel`;
export const MOBILE_FILTERS_TITLE_ID = `${SHEET_ID_PREFIX}-title`;
const DESKTOP_ID_PREFIX = "filters-desktop";

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

const inputClasses =
  "w-full rounded-lg border border-brand-outline/70 bg-white px-3 py-2 text-sm text-brand-dark shadow-sm transition focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

const labelClasses = "text-xs font-semibold uppercase tracking-wide text-neutral-600";

export default function FiltersSheet({
  open,
  onOpenChange,
  values,
  onChange,
  onApply,
  onClear,
  renderStatic = false
}: FiltersSheetProps) {
  const sheetCityInputId = `${SHEET_ID_PREFIX}-city`;
  const sheetPanelId = MOBILE_FILTERS_PANEL_ID;
  const sheetTitleId = MOBILE_FILTERS_TITLE_ID;

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    const focusTimer = window.setTimeout(() => {
      document.getElementById(sheetCityInputId)?.focus();
    }, 100);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [open, onOpenChange, sheetCityInputId]);

  return (
    <>
      {renderStatic && (
        <div className="hidden lg:block">
          <FiltersContent
            values={values}
            onChange={onChange}
            onApply={onApply}
            onClear={onClear}
            idPrefix={DESKTOP_ID_PREFIX}
          />
        </div>
      )}

      {open ? (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-sm md:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby={sheetTitleId}
        >
          <div id={sheetPanelId} className="rounded-t-3xl bg-white shadow-lg">
            <header className="flex items-center justify-between border-b border-brand-outline/60 px-4 py-3">
              <h2 id={sheetTitleId} className="text-base font-semibold text-brand-dark">
                Filters
              </h2>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-full px-3 py-1 text-sm font-medium text-neutral-500 transition hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
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
              idPrefix={SHEET_ID_PREFIX}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

type ContentProps = {
  values: FiltersState;
  onChange: (values: FiltersState) => void;
  onApply: () => void;
  onClear: () => void;
  idPrefix?: string;
};

export function FiltersContent({
  values,
  onChange,
  onApply,
  onClear,
  idPrefix = "filters"
}: ContentProps) {
  const sectionHeadingId = `${idPrefix}-filters-heading`;
  const budgetSummaryId = `${idPrefix}-budget-summary`;
  const minRangeId = `${idPrefix}-budget-min-range`;
  const maxRangeId = `${idPrefix}-budget-max-range`;

  const handleInput =
    (key: keyof FiltersState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const target = event.target;
      const value =
        target.type === "checkbox"
          ? (target as HTMLInputElement).checked
          : target.value;

      if (key === "city" || key === "type") {
        onChange({ ...values, [key]: value });
        return;
      }

      if (key === "min" || key === "max" || key === "beds" || key === "baths") {
        const rawNumeric = value === "" ? null : Number(value);
        const numeric = rawNumeric !== null && Number.isFinite(rawNumeric) ? Number(rawNumeric) : null;

        if (key === "min") {
          const bounded =
            numeric === null ? null : Math.min(Math.max(priceRange.min, numeric), priceRange.max);
          const currentMax = values.max ?? priceRange.max;
          if (bounded !== null && bounded > currentMax) {
            onChange({ ...values, min: bounded, max: bounded });
          } else {
            onChange({ ...values, min: bounded });
          }
          return;
        }

        if (key === "max") {
          const bounded =
            numeric === null ? null : Math.min(Math.max(priceRange.min, numeric), priceRange.max);
          const currentMin = values.min ?? priceRange.min;
          if (bounded !== null && bounded < currentMin) {
            onChange({ ...values, min: bounded, max: bounded });
          } else {
            onChange({ ...values, max: bounded });
          }
          return;
        }

        onChange({ ...values, [key]: numeric });
        return;
      }

      onChange({ ...values, [key]: value });
    };

  const selectedMin = values.min ?? priceRange.min;
  const selectedMax = values.max ?? priceRange.max;

  const numberFormatter = (amount: number) => formatCurrency(amount, "CAD");

  return (
    <section
      className="space-y-6 rounded-3xl border border-brand-outline/60 bg-white p-4 shadow-sm md:p-6"
      aria-labelledby={sectionHeadingId}
    >
      <h3 id={sectionHeadingId} className="sr-only">
        Filter listings
      </h3>
      <div className="space-y-4">
        <label htmlFor={`${idPrefix}-city`} className="block space-y-2">
          <span className={labelClasses}>City</span>
          <input
            id={`${idPrefix}-city`}
            value={values.city}
            onChange={handleInput("city")}
            placeholder="Search by city"
            className={inputClasses}
          />
        </label>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className={labelClasses}>Budget</span>
              <p className="text-xs text-neutral-500">Set your monthly rent range</p>
            </div>
            <div
              id={budgetSummaryId}
              className="flex items-center gap-2 text-xs font-medium text-brand-dark"
              aria-live="polite"
              aria-atomic="true"
            >
              <span className="rounded-full bg-brand-primaryMuted px-2 py-1">
                {numberFormatter(selectedMin)}
              </span>
              <span aria-hidden="true">-</span>
              <span className="rounded-full bg-brand-primaryMuted px-2 py-1">
                {numberFormatter(selectedMax)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-neutral-600">Min rent</span>
                <input
                  type="number"
                  min={priceRange.min}
                  max={priceRange.max}
                  step={priceRange.step}
                  value={values.min ?? ""}
                  onChange={handleInput("min")}
                  className={inputClasses}
                  inputMode="numeric"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-neutral-600">Max rent</span>
                <input
                  type="number"
                  min={priceRange.min}
                  max={priceRange.max}
                  step={priceRange.step}
                  value={values.max ?? ""}
                  onChange={handleInput("max")}
                  className={inputClasses}
                  inputMode="numeric"
                />
              </label>
            </div>
            <div className="space-y-2">
              <input
                id={minRangeId}
                type="range"
                min={priceRange.min}
                max={priceRange.max}
                step={priceRange.step}
                value={selectedMin}
                onChange={handleInput("min")}
                aria-label="Minimum price"
                aria-valuetext={numberFormatter(selectedMin)}
                aria-describedby={budgetSummaryId}
                className="range-input focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              />
              <input
                id={maxRangeId}
                type="range"
                min={priceRange.min}
                max={priceRange.max}
                step={priceRange.step}
                value={selectedMax}
                onChange={handleInput("max")}
                aria-label="Maximum price"
                aria-valuetext={numberFormatter(selectedMax)}
                aria-describedby={budgetSummaryId}
                className="range-input focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="space-y-1.5">
            <span className={labelClasses}>Beds</span>
            <input
              type="number"
              min={0}
              value={values.beds ?? ""}
              onChange={handleInput("beds")}
              className={inputClasses}
              inputMode="numeric"
            />
          </label>
          <label className="space-y-1.5">
            <span className={labelClasses}>Baths</span>
            <input
              type="number"
              min={0}
              value={values.baths ?? ""}
              onChange={handleInput("baths")}
              className={inputClasses}
              inputMode="numeric"
            />
          </label>
        </div>

        <label className="space-y-1.5">
          <span className={labelClasses}>Type</span>
          <select
            value={values.type}
            onChange={handleInput("type")}
            className={clsx(inputClasses, "capitalize")}
          >
            <option value="any">Any</option>
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="condo">Condo</option>
            <option value="townhouse">Townhouse</option>
          </select>
        </label>
      </div>

      <div className="grid gap-3">
        <Toggle
          id={`${idPrefix}-pets`}
          label="Pet-friendly"
          checked={values.pets}
          onChange={handleInput("pets")}
        />
        <Toggle
          id={`${idPrefix}-furnished`}
          label="Furnished"
          checked={values.furnished}
          onChange={handleInput("furnished")}
        />
        <Toggle
          id={`${idPrefix}-verified`}
          label="Verified listings only"
          checked={values.verified}
          onChange={handleInput("verified")}
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-brand-outline/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center justify-center rounded-full border border-brand-outline/70 px-4 py-2 text-sm font-medium text-brand-dark transition hover:border-brand-primary hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
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
    </section>
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
      className="flex items-center justify-between gap-4 rounded-2xl border border-brand-outline/50 bg-brand-light px-4 py-3 transition hover:border-brand-primary hover:bg-brand-primaryMuted/40"
    >
      <span className="text-sm font-medium text-brand-dark">{label}</span>
      <span className="relative inline-flex h-6 w-12 items-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="peer sr-only"
          role="switch"
          aria-checked={checked}
        />
        <span className="absolute inset-0 rounded-full bg-brand-outline/70 transition peer-checked:bg-brand-primary"></span>
        <span className="absolute left-1 h-4 w-4 rounded-full bg-white shadow-md transition peer-checked:translate-x-6 peer-checked:bg-white peer-checked:shadow-brand-primary/60" />
      </span>
    </label>
  );
}

