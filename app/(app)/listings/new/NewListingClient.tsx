"use client";

import type { ReactNode } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { buttonStyles } from "@/components/ui/button";

import { createListingAction, type ListingFormState } from "./actions";

const propertyTypes = [
  { value: "apartment", label: "Apartment" },
  { value: "condo", label: "Condo" },
  { value: "house", label: "House" },
  { value: "townhouse", label: "Townhouse" }
];

const initialListingFormState: ListingFormState = { status: "idle" };

export default function NewListingClient() {
  const [state, formAction] = useFormState(createListingAction, initialListingFormState);

  return (
    <form
      action={formAction}
      className="space-y-6 rounded-3xl border border-black/5 bg-white p-8 shadow-soft"
      aria-describedby="new-listing-description"
    >
      <p id="new-listing-description" className="text-sm text-text-muted">
        Provide property details to publish a draft listing to Supabase. Fields marked with an asterisk are required.
      </p>

      {state.status === "success" ? (
        <div
          role="status"
          className="rounded-2xl border border-brand-teal/40 bg-brand-teal/10 px-4 py-3 text-sm font-semibold text-brand-teal"
        >
          Property saved! Refreshing your dashboard shortly.
        </div>
      ) : null}

      {state.status === "error" ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
        >
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <FormField label="Title" htmlFor="title" required>
          <input
            id="title"
            name="title"
            required
            className="input"
            placeholder="Downtown loft with skyline views"
          />
        </FormField>

        <FormField label="Rent per month ($)" htmlFor="rent" required>
          <input
            id="rent"
            name="rent"
            type="number"
            min={0}
            step={50}
            required
            className="input"
            inputMode="numeric"
            aria-describedby="rent-help"
            placeholder="2300"
          />
          <span id="rent-help" className="text-xs text-text-muted">
            Enter the monthly rent before utilities and discounts.
          </span>
        </FormField>

        <FormField label="Street address" htmlFor="street" required>
          <input
            id="street"
            name="street"
            required
            className="input"
            placeholder="123 King Street W"
          />
        </FormField>

        <FormField label="City" htmlFor="city" required>
          <input
            id="city"
            name="city"
            required
            className="input"
            placeholder="Waterloo"
          />
        </FormField>

        <FormField label="Postal code" htmlFor="postalCode" required>
          <input
            id="postalCode"
            name="postalCode"
            required
            className="input uppercase"
            placeholder="N2L 0A1"
            aria-describedby="postal-help"
          />
          <span id="postal-help" className="text-xs text-text-muted">
            Format as ANA NAN for Canadian addresses.
          </span>
        </FormField>

        <FormField label="Property type" htmlFor="propertyType" required>
          <select id="propertyType" name="propertyType" required className="input" defaultValue="">
            <option value="" disabled>
              Select type
            </option>
            {propertyTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField label="Description" htmlFor="description" required>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          className="input"
          placeholder="Highlight key amenities, nearby transit, and what makes this rental unique."
        />
      </FormField>

      <div className="flex justify-end">
        <SubmitButton state={state} />
      </div>
    </form>
  );
}

function SubmitButton({ state }: { state: ListingFormState }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={buttonStyles({ variant: "primary", size: "lg" })}
      disabled={pending}
    >
      {pending ? "Saving..." : state.status === "success" ? "Saved" : "Save listing"}
    </button>
  );
}

function FormField({
  label,
  htmlFor,
  children,
  required
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="grid gap-2 text-sm font-semibold text-brand-dark">
      <span>
        {label}
        {required ? <span className="ml-1 text-brand-teal" aria-hidden="true">*</span> : null}
      </span>
      {children}
    </label>
  );
}
