"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { buttonStyles } from "@/components/ui/button";

import {
  createListingAction,
  saveDraftAction,
  fetchDraftAction,
  updateListingAction,
  type ListingFormState
} from "./actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import dynamic from "next/dynamic";
import { useDebounce } from "@/lib/utils/hooks/index";
import { useRouter } from "next/navigation";

const ListingImageUploader = dynamic(() => import("@/components/ListingImageUploader"), { ssr: false });

const propertyTypes = [
  { value: "apartment", label: "Apartment" },
  { value: "condo", label: "Condo" },
  { value: "house", label: "House" },
  { value: "townhouse", label: "Townhouse" }
];

const amenitiesOptions = [
  { value: "laundry", label: "Laundry" },
  { value: "gym", label: "Gym" },
  { value: "pool", label: "Pool" },
  { value: "ac", label: "A/C" },
  { value: "balcony", label: "Balcony" },
  { value: "storage", label: "Storage" },
  { value: "elevator", label: "Elevator" },
  { value: "wheelchair", label: "Wheelchair Access" }
];

const initialListingFormState: ListingFormState = { status: "idle" };
type ToastState = { type: "error" | "success"; message: string } | null;

type ListingFormMode = "create" | "edit";

type InitialListingValues = {
  title?: string;
  rent?: number;
  street?: string;
  city?: string;
  postalCode?: string;
  propertyType?: string;
  beds?: number;
  baths?: number;
  area?: number | null;
  amenities?: string[];
  pets?: boolean | null;
  smoking?: boolean | null;
  parking?: string | null;
  availableFrom?: string | null;
  rentFrequency?: "monthly" | "weekly" | "biweekly" | null;
  description?: string;
};

type ListingImageInput = { key: string; url: string; isCover?: boolean };

type ListingFormProps = {
  mode?: ListingFormMode;
  listingId?: string;
  initialValues?: InitialListingValues;
  initialImages?: ListingImageInput[];
};

export default function NewListingClient({
  mode = "create",
  listingId,
  initialValues,
  initialImages = []
}: ListingFormProps) {
  const isCreateMode = mode === "create";
  const [state, formAction] = useFormState(
    isCreateMode ? createListingAction : updateListingAction,
    initialListingFormState
  );
  const [autoSaveState, setAutoSaveState] = useState<ListingFormState>({ status: "idle" });
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [toast, setToast] = useState<ToastState>(null);
  
  // If the browser Supabase client is unavailable, we are running in dev mode
  // (or missing NEXT_PUBLIC_* keys). Show a clear dev-mode notice so landlords
  // know drafts are stored in-memory.
  const browserSupabase = createSupabaseBrowserClient();
  const isDevMode = !browserSupabase;

  const amenitiesInitial = useMemo(() => initialValues?.amenities ?? [], [initialValues?.amenities]);
  const petsInitial = initialValues?.pets;
  const smokingInitial = initialValues?.smoking;
  const rentFrequencyInitial = initialValues?.rentFrequency ?? "monthly";
  const availableFromInitial = initialValues?.availableFrom
    ? (initialValues.availableFrom.includes("T")
        ? initialValues.availableFrom.split("T")[0]
        : initialValues.availableFrom)
    : "";
  const petsSelectValue = petsInitial === true ? "true" : petsInitial === false ? "false" : "";
  const smokingSelectValue = smokingInitial === true ? "true" : smokingInitial === false ? "false" : "";
  const normalizedInitialImages = useMemo(
    () =>
      initialImages.map((image, index) => ({
        ...image,
        isCover: image.isCover ?? index === 0
      })),
    [initialImages]
  );

  const fieldErrors = useMemo(() => {
    if (state.status === "validation-error") {
      return state.fieldErrors;
    }
    if (autoSaveState.status === "validation-error") {
      return autoSaveState.fieldErrors;
    }
    return undefined;
  }, [state, autoSaveState]);

  const formErrors = useMemo(() => {
    if (state.status === "validation-error" && state.formErrors?.length) {
      return state.formErrors;
    }
    if (autoSaveState.status === "validation-error" && autoSaveState.formErrors?.length) {
      return autoSaveState.formErrors;
    }
    return undefined;
  }, [state, autoSaveState]);

  const fieldHasError = useCallback(
    (name: string) => Boolean(fieldErrors?.[name]?.length),
    [fieldErrors]
  );

  const fieldErrorMessage = useCallback(
    (name: string) => fieldErrors?.[name]?.[0],
    [fieldErrors]
  );

  const errorIdFor = useCallback(
    (name: string) => (fieldHasError(name) ? `${name}-error` : undefined),
    [fieldHasError]
  );

  const inputClassName = useCallback(
    (name: string) =>
      clsx("input", fieldHasError(name) && "border-red-500 focus:border-red-500 focus:ring-red-500"),
    [fieldHasError]
  );

  const describedBy = useCallback(
    (name: string, extra?: string) => {
      const ids = [extra, errorIdFor(name)].filter(Boolean).join(" ");
      return ids.length ? ids : undefined;
    },
    [errorIdFor]
  );

  useEffect(() => {
    if (!isCreateMode) return;
    async function loadDraft() {
      const result = await fetchDraftAction();
      if (result.status === "success" && result.data && formRef.current) {
        const form = formRef.current;
        Object.entries(result.data).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            const checkboxGroup = form.querySelectorAll<HTMLInputElement>(`input[name="${key}[]"]`);
            if (checkboxGroup.length > 0) {
              const normalized = value.map((item) => String(item));
              checkboxGroup.forEach((checkbox) => {
                checkbox.checked = normalized.includes(checkbox.value);
              });
              return;
            }
          }

          const element = form.elements.namedItem(key);
          if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
            if (Array.isArray(value)) {
              if (element instanceof HTMLSelectElement && element.multiple) {
                Array.from(element.options).forEach((option) => {
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
  }, [isCreateMode]);

  const handleFormChange = useCallback(async () => {
    if (!isCreateMode || !formRef.current) return;
    const formData = new FormData(formRef.current);
    const result = await saveDraftAction(formData);
    setAutoSaveState(result);
  }, [isCreateMode]);

  const debouncedHandleFormChange = useDebounce(handleFormChange, 2000);

  useEffect(() => {
    if (!isCreateMode) return;
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
  }, [debouncedHandleFormChange, isCreateMode]);
  useEffect(() => {
    if (state.status === "error" || state.status === "validation-error") {
      setToast({ type: "error", message: state.message });
    } else if (state.status === "success") {
      setToast({
        type: "success",
        message: isCreateMode ? "Listing created! Redirecting..." : "Listing updated successfully."
      });
    } else if (state.status === "idle") {
      setToast(null);
    }
  }, [state, isCreateMode]);

  useEffect(() => {
    if (!isCreateMode) return;
    if (state.status !== "success") return;
    const timeout = setTimeout(() => {
      router.push("/dashboard?toast=listing-created");
    }, 250);
    return () => clearTimeout(timeout);
  }, [state.status, router, isCreateMode]);

  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      className="space-y-6 rounded-3xl border border-black/5 bg-white p-8 shadow-soft"
      aria-describedby="new-listing-description"
    >
      <p id="new-listing-description" className="text-sm text-text-muted">
        Provide property details to publish a draft listing to Supabase. Fields marked with an asterisk are required.
      </p>

      <div aria-live="polite" role="status" className="sr-only">
        {toast?.message ?? ""}
      </div>

      {mode === "edit" && listingId ? <input type="hidden" name="listingId" value={listingId} /> : null}

      {toast ? (
        <div
          role={toast.type === "error" ? "alert" : "status"}
          className={toast.type === "error"
            ? "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
            : "rounded-2xl border border-brand-teal/40 bg-brand-teal/10 px-4 py-3 text-sm font-semibold text-brand-teal"}
        >
          {toast.message}
        </div>
      ) : null}

      {isDevMode ? (
        <div role="status" className="rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm font-semibold text-yellow-800">
          Dev mode: Supabase public keys missing. Drafts are stored in-memory and will not persist across deploys. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable persistence.
        </div>
      ) : null}

      {isCreateMode ? (
        autoSaveState.status === "auto-saved" ? (
          <div role="status" className="rounded-2xl border border-brand-teal/40 bg-brand-teal/10 px-4 py-3 text-sm font-semibold text-brand-teal">
            Draft auto-saved at {new Date(autoSaveState.timestamp).toLocaleTimeString()}
          </div>
        ) : autoSaveState.status === "validation-error" ? (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {autoSaveState.message}
          </div>
        ) : autoSaveState.status === "error" ? (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {autoSaveState.message}
          </div>
        ) : null
      ) : null}

      {formErrors?.length ? (
        <ul role="alert" className="list-disc space-y-1 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {formErrors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}


      <div className="grid gap-6 md:grid-cols-2">
        <FormField label="Title" htmlFor="title" required error={fieldErrorMessage("title")}>
          <input
            id="title"
            name="title"
            required
            className={inputClassName("title")}
            placeholder="Downtown loft with skyline views"
            aria-invalid={fieldHasError("title")}
            aria-describedby={describedBy("title")}
            defaultValue={initialValues?.title ?? ""}
          />
        </FormField>

        <FormField label="Rent ($)" htmlFor="rent" required error={fieldErrorMessage("rent")}>
          <input
            id="rent"
            name="rent"
            type="number"
            min={0}
            step={50}
            required
            className={inputClassName("rent")}
            inputMode="numeric"
            aria-describedby={describedBy("rent", "rent-help")}
            aria-invalid={fieldHasError("rent")}
            placeholder="2300"
            defaultValue={initialValues?.rent != null ? String(initialValues.rent) : ""}
          />
          <span id="rent-help" className="text-xs text-text-muted">
            Enter the rent before utilities and discounts.
          </span>
        </FormField>

        <FormField label="Beds" htmlFor="beds" required error={fieldErrorMessage("beds")}>
          <input
            id="beds"
            name="beds"
            type="number"
            min={0}
            step={1}
            required
            className={inputClassName("beds")}
            placeholder="2"
            aria-invalid={fieldHasError("beds")}
            aria-describedby={describedBy("beds")}
            defaultValue={initialValues?.beds != null ? String(initialValues.beds) : ""}
          />
        </FormField>

        <FormField label="Baths" htmlFor="baths" required error={fieldErrorMessage("baths")}>
          <input
            id="baths"
            name="baths"
            type="number"
            min={0}
            step={1}
            required
            className={inputClassName("baths")}
            placeholder="1"
            aria-invalid={fieldHasError("baths")}
            aria-describedby={describedBy("baths")}
            defaultValue={initialValues?.baths != null ? String(initialValues.baths) : ""}
          />
        </FormField>

        <FormField label="Area (sqft)" htmlFor="area" error={fieldErrorMessage("area")}>
          <input
            id="area"
            name="area"
            type="number"
            min={0}
            step={10}
            className={inputClassName("area")}
            placeholder="900"
            aria-invalid={fieldHasError("area")}
            aria-describedby={describedBy("area")}
            defaultValue={initialValues?.area != null ? String(initialValues.area) : ""}
          />
        </FormField>

        <FormField label="Street address" htmlFor="street" required error={fieldErrorMessage("street")}>
          <input
            id="street"
            name="street"
            required
            className={inputClassName("street")}
            placeholder="123 King Street W"
            aria-invalid={fieldHasError("street")}
            aria-describedby={describedBy("street")}
            defaultValue={initialValues?.street ?? ""}
          />
        </FormField>

        <FormField label="City" htmlFor="city" required error={fieldErrorMessage("city")}>
          <input
            id="city"
            name="city"
            required
            className={inputClassName("city")}
            placeholder="Waterloo"
            aria-invalid={fieldHasError("city")}
            aria-describedby={describedBy("city")}
            defaultValue={initialValues?.city ?? ""}
          />
        </FormField>

        <FormField label="Postal code" htmlFor="postalCode" required error={fieldErrorMessage("postalCode")}>
          <input
            id="postalCode"
            name="postalCode"
            required
            className={clsx(inputClassName("postalCode"), "uppercase")}
            placeholder="N2L 0A1"
            aria-describedby={describedBy("postalCode", "postal-help")}
            aria-invalid={fieldHasError("postalCode")}
            defaultValue={initialValues?.postalCode ?? ""}
          />
          <span id="postal-help" className="text-xs text-text-muted">
            Format as ANA NAN for Canadian addresses.
          </span>
        </FormField>

        <FormField label="Property type" htmlFor="propertyType" required error={fieldErrorMessage("propertyType")}>
          <select
            id="propertyType"
            name="propertyType"
            required
            className={inputClassName("propertyType")}
            defaultValue={initialValues?.propertyType ?? ""}
            aria-invalid={fieldHasError("propertyType")}
            aria-describedby={describedBy("propertyType")}
          >
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

        <div className="grid gap-2 text-sm text-brand-dark">
          <span id="amenities-label" className="font-semibold text-brand-dark">
            Amenities
          </span>
          <div
            role="group"
            aria-labelledby="amenities-label"
            aria-describedby={fieldHasError("amenities") ? "amenities-error" : undefined}
            className={clsx(
              "grid gap-2 rounded-2xl border border-black/10 p-4",
              fieldHasError("amenities") && "border-red-500"
            )}
          >
            <p className="text-xs text-text-muted">
              Select all amenities that apply to this listing.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {amenitiesOptions.map((amenity) => (
                <label
                  key={amenity.value}
                  className="flex items-center gap-2 rounded-xl border border-black/5 bg-black/5 px-3 py-2 text-sm font-medium text-text-muted transition hover:border-brand-teal hover:text-brand-teal dark:bg-white/5"
                >
                  <input
                    type="checkbox"
                    name="amenities[]"
                    value={amenity.value}
                    className="h-4 w-4 rounded border-black/20 text-brand-teal focus:ring-brand-teal"
                    defaultChecked={amenitiesInitial.includes(amenity.value)}
                  />
                  <span>{amenity.label}</span>
                </label>
              ))}
            </div>
          </div>
          {fieldHasError("amenities") ? (
            <p id="amenities-error" className="text-xs font-medium text-red-600" role="alert">
              {fieldErrorMessage("amenities")}
            </p>
          ) : null}
        </div>

        <FormField label="Pets allowed?" htmlFor="pets" error={fieldErrorMessage("pets")}>
          <select
            id="pets"
            name="pets"
            className={inputClassName("pets")}
            aria-invalid={fieldHasError("pets")}
            aria-describedby={describedBy("pets")}
            defaultValue={petsSelectValue}
          >
            <option value="">Select</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </FormField>

        <FormField label="Smoking allowed?" htmlFor="smoking" error={fieldErrorMessage("smoking")}>
          <select
            id="smoking"
            name="smoking"
            className={inputClassName("smoking")}
            aria-invalid={fieldHasError("smoking")}
            aria-describedby={describedBy("smoking")}
            defaultValue={smokingSelectValue}
          >
            <option value="">Select</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </FormField>

        <FormField label="Parking" htmlFor="parking" error={fieldErrorMessage("parking")}>
          <input
            id="parking"
            name="parking"
            className={inputClassName("parking")}
            placeholder="e.g. 1 spot, underground, street"
            aria-invalid={fieldHasError("parking")}
            aria-describedby={describedBy("parking")}
            defaultValue={initialValues?.parking ?? ""}
          />
        </FormField>

        <FormField label="Available from" htmlFor="availableFrom" error={fieldErrorMessage("availableFrom")}>
          <input
            id="availableFrom"
            name="availableFrom"
            type="date"
            className={inputClassName("availableFrom")}
            aria-invalid={fieldHasError("availableFrom")}
            aria-describedby={describedBy("availableFrom")}
            defaultValue={availableFromInitial}
          />
        </FormField>

        <FormField label="Rent frequency" htmlFor="rentFrequency" error={fieldErrorMessage("rentFrequency")}>
          <select
            id="rentFrequency"
            name="rentFrequency"
            className={inputClassName("rentFrequency")}
            defaultValue={rentFrequencyInitial}
            aria-invalid={fieldHasError("rentFrequency")}
            aria-describedby={describedBy("rentFrequency")}
          >
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
          </select>
        </FormField>

      </div>

      <FormField label="Description" htmlFor="description" required error={fieldErrorMessage("description")}>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          className={clsx(inputClassName("description"), "min-h-[120px]")}
          placeholder="Highlight key amenities, nearby transit, and what makes this rental unique."
          aria-invalid={fieldHasError("description")}
          aria-describedby={describedBy("description")}
          defaultValue={initialValues?.description ?? ""}
        />
      </FormField>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-brand-dark">Photos</h3>
        <ListingImageUploader initialImages={normalizedInitialImages} />
        {fieldHasError("images") ? (
          <p id="images-error" className="mt-2 text-sm text-red-600" role="alert">
            {fieldErrorMessage("images")}
          </p>
        ) : null}
      </div>

      <div className="flex justify-end">
        <SubmitButton state={state} mode={mode} />
      </div>
    </form>
  );
}

function SubmitButton({ state, mode }: { state: ListingFormState; mode: ListingFormMode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={buttonStyles({ variant: "primary", size: "lg" })}
      disabled={pending}
    >
      {pending
        ? "Saving..."
        : state.status === "success"
          ? mode === "create"
            ? "Saved"
            : "Updated"
          : mode === "create"
            ? "Save listing"
            : "Update listing"}
    </button>
  );
}

function FormField({
  label,
  htmlFor,
  children,
  required,
  error
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  required?: boolean;
  error?: string;
}) {
  return (
    <div className="grid gap-2 text-sm text-brand-dark">
      <label htmlFor={htmlFor} className="font-semibold text-brand-dark">
        {label}
        {required ? <span className="ml-1 text-brand-teal" aria-hidden="true">*</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}





