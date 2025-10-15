
"use client";

import { useEffect, useState } from "react";
import { propertyTypes } from "@/components/providers/app-provider";
import type { PropertyFilter } from "@/lib/mock";

type FilterState = {
  city: string;
  postalCode: string;
  type: string;
  min: string;
  max: string;
  furnished: string;
};

const initial: FilterState = {
  city: "",
  postalCode: "",
  type: "",
  min: "",
  max: "",
  furnished: ""
};

type SearchFiltersProps = {
  defaultValues?: Partial<FilterState>;
  onChange: (filters: PropertyFilter) => void;
};

export default function SearchFilters({ defaultValues, onChange }: SearchFiltersProps) {
  const [state, setState] = useState<FilterState>({ ...initial, ...defaultValues });

  useEffect(() => {
    const payload: PropertyFilter = {
      city: state.city || undefined,
      postalCode: state.postalCode || undefined,
      type: state.type ? (state.type as PropertyFilter["type"]) : undefined,
      min: state.min ? Number(state.min) : undefined,
      max: state.max ? Number(state.max) : undefined,
      furnished:
        state.furnished === ""
          ? undefined
          : state.furnished === "true"
            ? true
            : false
    };
    onChange(payload);
  }, [state, onChange]);

  return (
    <form className="card grid gap-4 md:grid-cols-5" aria-label="Property search filters">
      <div className="flex flex-col gap-1">
        <label htmlFor="filter-city" className="text-sm font-medium text-gray-700">
          City
        </label>
        <input
          id="filter-city"
          className="input"
          placeholder="Waterloo"
          value={state.city}
          onChange={(event) => setState((prev) => ({ ...prev, city: event.target.value }))}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="filter-postal" className="text-sm font-medium text-gray-700">
          Postal code
        </label>
        <input
          id="filter-postal"
          className="input"
          placeholder="N2L 3G1"
          value={state.postalCode}
          onChange={(event) =>
            setState((prev) => ({ ...prev, postalCode: event.target.value }))
          }
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="filter-type" className="text-sm font-medium text-gray-700">
          Property type
        </label>
        <select
          id="filter-type"
          className="input"
          value={state.type}
          onChange={(event) => setState((prev) => ({ ...prev, type: event.target.value }))}
        >
          <option value="">Any</option>
          {propertyTypes().map((typeOption) => (
            <option key={typeOption} value={typeOption}>
              {typeOption[0].toUpperCase() + typeOption.slice(1)}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="filter-min" className="text-sm font-medium text-gray-700">
          Min rent
        </label>
        <input
          id="filter-min"
          className="input"
          type="number"
          inputMode="numeric"
          min={0}
          value={state.min}
          onChange={(event) => setState((prev) => ({ ...prev, min: event.target.value }))}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="filter-max" className="text-sm font-medium text-gray-700">
          Max rent
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            id="filter-max"
            className="input"
            type="number"
            inputMode="numeric"
            min={0}
            value={state.max}
            onChange={(event) =>
              setState((prev) => ({ ...prev, max: event.target.value }))
            }
          />
          <select
            aria-label="Furnished filter"
            className="input"
            value={state.furnished}
            onChange={(event) =>
              setState((prev) => ({ ...prev, furnished: event.target.value }))
            }
          >
            <option value="">Any</option>
            <option value="true">Furnished</option>
            <option value="false">Unfurnished</option>
          </select>
        </div>
      </div>
    </form>
  );
}
