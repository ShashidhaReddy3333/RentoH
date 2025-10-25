"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { buttonStyles } from "@/components/ui/button";

import { createListingAction, saveDraftAction, fetchDraftAction, type ListingFormState } from "./actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import dynamic from "next/dynamic";
import { useDebounce } from "@/lib/utils/hooks/index";

const ListingImageUploader = dynamic(() => import("@/components/ListingImageUploader"), { ssr: false });

const propertyTypes = [
  { value: "apartment", label: "Apartment" },
  { value: "condo", label: "Condo" },
  { value: "house", label: "House" },
  { value: "townhouse", label: "Townhouse" }
];

const initialListingFormState: ListingFormState = { status: "idle" };

export default function NewListingClient() {
  const [state, formAction] = useFormState(createListingAction, initialListingFormState);
  const [autoSaveState, setAutoSaveState] = useState<ListingFormState>({ status: "idle" });
  const formRef = useRef<HTMLFormElement>(null);
  
  // If the browser Supabase client is unavailable, we are running in dev mode
  // (or missing NEXT_PUBLIC_* keys). Show a clear dev-mode notice so landlords
  // know drafts are stored in-memory.
  const browserSupabase = createSupabaseBrowserClient();
  const isDevMode = !browserSupabase;

  useEffect(() => {
    async function loadDraft() {
      const result = await fetchDraftAction();
      if (result.status === "success" && result.data && formRef.current) {
        const form = formRef.current;
        Object.entries(result.data).forEach(([key, value]) => {
          const element = form.elements.namedItem(key);
          if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
            if (Array.isArray(value)) {
              if (element instanceof HTMLSelectElement && element.multiple) {
                Array.from(element.options).forEach(option => {
                  option.selected = value.includes(option.value);
                });
              }
            } else if (value !== null && value !== undefined) {
              element.value = String(value);
            }
          }
        });
        setAutoSaveState({ status: "auto-saved", timestamp: Date.now() });
  }
    }
    loadDraft();
  }, []);

  const handleFormChange = useCallback(async () => {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    const result = await saveDraftAction(formData);
    setAutoSaveState(result);
  }, []);

  const debouncedHandleFormChange = useDebounce(handleFormChange, 2000);

  useEffect(() => {
    if (!formRef.current) return;
    const form = formRef.current;
    const formElements = form.elements;
    Array.from(formElements).forEach((element) => {
      if (element instanceof HTMLElement) {
        element.addEventListener("change", debouncedHandleFormChange);
        element.addEventListener("input", debouncedHandleFormChange);
      }
    });
    return () => {
      Array.from(formElements).forEach((element) => {
        if (element instanceof HTMLElement) {
          element.removeEventListener("change", debouncedHandleFormChange);
          element.removeEventListener("input", debouncedHandleFormChange);
        }
      });
    };
  }, [debouncedHandleFormChange]);

  return (
    <form
      ref={formRef}
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

      {isDevMode ? (
        <div role="status" className="rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm font-semibold text-yellow-800">
          Dev mode: Supabase public keys missing. Drafts are stored in-memory and will not persist across deploys. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable persistence.
        </div>
      ) : null}

      {autoSaveState.status === "auto-saved" ? (
        <div role="status" className="rounded-2xl border border-brand-teal/40 bg-brand-teal/10 px-4 py-3 text-sm font-semibold text-brand-teal">
          Draft auto-saved at {new Date(autoSaveState.timestamp).toLocaleTimeString()}
        </div>
      ) : autoSaveState.status === "error" ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {autoSaveState.message}
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

        <FormField label="Rent ($)" htmlFor="rent" required>
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
            Enter the rent before utilities and discounts.
          </span>
        </FormField>

        <FormField label="Beds" htmlFor="beds" required>
          <input
            id="beds"
            name="beds"
            type="number"
            min={0}
            step={1}
            required
            className="input"
            placeholder="2"
          />
        </FormField>

        <FormField label="Baths" htmlFor="baths" required>
          <input
            id="baths"
            name="baths"
            type="number"
            min={0}
            step={1}
            required
            className="input"
            placeholder="1"
          />
        </FormField>

        <FormField label="Area (sqft)" htmlFor="area">
          <input
            id="area"
            name="area"
            type="number"
            min={0}
            step={10}
            className="input"
            placeholder="900"
          />
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

        <FormField label="Amenities" htmlFor="amenities">
          <select
            id="amenities"
            name="amenities"
            multiple
            className="input"
            size={4}
          >
            <option value="laundry">Laundry</option>
            <option value="gym">Gym</option>
            <option value="pool">Pool</option>
            <option value="ac">A/C</option>
            <option value="balcony">Balcony</option>
            <option value="storage">Storage</option>
            <option value="elevator">Elevator</option>
            <option value="wheelchair">Wheelchair Access</option>
          </select>
          <span className="text-xs text-text-muted">Hold Ctrl (Windows) or Cmd (Mac) to select multiple.</span>
        </FormField>

        <FormField label="Pets allowed?" htmlFor="pets">
          <select id="pets" name="pets" className="input">
            <option value="">Select</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </FormField>

        <FormField label="Smoking allowed?" htmlFor="smoking">
          <select id="smoking" name="smoking" className="input">
            <option value="">Select</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </FormField>

        <FormField label="Parking" htmlFor="parking">
          <input
            id="parking"
            name="parking"
            className="input"
            placeholder="e.g. 1 spot, underground, street"
          />
        </FormField>

        <FormField label="Available from" htmlFor="availableFrom">
          <input
            id="availableFrom"
            name="availableFrom"
            type="date"
            className="input"
          />
        </FormField>

        <FormField label="Rent frequency" htmlFor="rentFrequency">
          <select id="rentFrequency" name="rentFrequency" className="input" defaultValue="monthly">
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
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

      <div>
        <h3 className="mb-2 text-sm font-semibold text-brand-dark">Photos</h3>
        <ListingImageUploader />
      </div>

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
