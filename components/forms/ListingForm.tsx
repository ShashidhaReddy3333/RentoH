"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, type FieldError, type FieldErrors, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ListingImageUploader from "@/components/ListingImageUploader";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input";
import type { ListingFormState } from "@/app/(app)/listings/new/actions";
import { listingFormSchema } from "@/lib/validation/listingSchema";
import type { ListingFormInput, ListingFormValues } from "@/lib/validation/listingSchema";
import { useDebounce } from "@/lib/utils/hooks";
import { AmenitiesField } from "./listing/AmenitiesField";
import { FormSection } from "./listing/FormSection";
import { AutoSaveNotice, ToastBanner } from "./listing/FormMessages";
import { SelectField } from "./listing/SelectField";
import { TextareaField } from "./listing/TextareaField";

type ListingFormFieldValues = Omit<ListingFormInput, "images"> & {
  images: Array<{ key: string; url: string; isCover?: boolean }>;
};

export type ListingFormMode = "create" | "edit";

export type ListingImageInput = {
  key: string;
  url: string;
  isCover?: boolean;
};

export type ListingFormInitialValues = {
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

type ListingFormProps = {
  mode: ListingFormMode;
  initialValues?: ListingFormInitialValues;
  initialImages?: ListingImageInput[];
  loadDraft?: () => Promise<ListingFormState & { data?: Record<string, unknown> }>;
  onSubmit: (values: ListingFormValues) => Promise<ListingFormState>;
  onAutoSave?: (values: ListingFormValues) => Promise<ListingFormState>;
  onSuccess?: (result: ListingFormState) => void;
};

type Toast =
  | { tone: "success"; message: string }
  | { tone: "error"; message: string }
  | { tone: "info"; message: string }
  | null;

const propertyTypeOptions = [
  { value: "apartment", label: "Apartment" },
  { value: "condo", label: "Condo" },
  { value: "house", label: "House" },
  { value: "townhouse", label: "Townhouse" }
] as const;

type PropertyTypeValue = (typeof propertyTypeOptions)[number]["value"];

function resolvePropertyType(value?: string | null): PropertyTypeValue {
  if (typeof value !== "string") {
    return "apartment";
  }
  return propertyTypeOptions.some((option) => option.value === value)
    ? (value as PropertyTypeValue)
    : "apartment";
}

const amenitiesOptions = [
  { value: "laundry", label: "In-suite laundry" },
  { value: "gym", label: "Gym" },
  { value: "pool", label: "Pool" },
  { value: "ac", label: "Air conditioning" },
  { value: "balcony", label: "Balcony" },
  { value: "storage", label: "Storage" },
  { value: "elevator", label: "Elevator" },
  { value: "wheelchair", label: "Wheelchair access" }
] as const;

const LISTING_FIELD_LABELS: Partial<Record<keyof ListingFormFieldValues, string>> = {
  title: "Listing title",
  rent: "Monthly rent",
  street: "Street address",
  city: "City",
  postalCode: "Postal code",
  propertyType: "Property type",
  beds: "Bedrooms",
  baths: "Bathrooms",
  area: "Square footage",
  amenities: "Amenities",
  pets: "Pets policy",
  smoking: "Smoking policy",
  parking: "Parking availability",
  availableFrom: "Availability date",
  rentFrequency: "Rent frequency",
  description: "Listing description"
};

function normalizeDateValue(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().split("T")[0] ?? "";
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return "";
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0] ?? "";
    }
  }

  return "";
}

function findFirstError(
  errors: FieldErrors<ListingFormFieldValues>
): { name: keyof ListingFormFieldValues; message?: string } | null {
  for (const key of Object.keys(errors) as Array<keyof ListingFormFieldValues>) {
    const value = errors[key];
    if (!value) continue;

    if (typeof value === "object" && "message" in value && (value as FieldError).message) {
      return { name: key, message: (value as FieldError).message as string };
    }

    if (typeof value === "object") {
      const nested = findFirstError(value as FieldErrors<ListingFormFieldValues>);
      if (nested) {
        return { name: key, message: nested.message };
      }
    }
  }

  return null;
}

function buildDefaultValues({
  initialValues,
  initialImages
}: {
  initialValues?: ListingFormInitialValues;
  initialImages?: ListingImageInput[];
}): ListingFormFieldValues {
  return {
    title: initialValues?.title ?? "",
    rent: initialValues?.rent != null ? String(initialValues.rent) : "",
    street: initialValues?.street ?? "",
    city: initialValues?.city ?? "",
    postalCode: initialValues?.postalCode ?? "",
    propertyType: resolvePropertyType(initialValues?.propertyType),
    beds: initialValues?.beds != null ? String(initialValues.beds) : "",
    baths: initialValues?.baths != null ? String(initialValues.baths) : "",
    area: initialValues?.area != null ? String(initialValues.area) : "",
    amenities: initialValues?.amenities ?? [],
    pets:
      initialValues?.pets === true
        ? "true"
        : initialValues?.pets === false
          ? "false"
          : "",
    smoking:
      initialValues?.smoking === true
        ? "true"
        : initialValues?.smoking === false
          ? "false"
          : "",
    parking: initialValues?.parking ?? "",
    availableFrom: normalizeDateValue(initialValues?.availableFrom ?? ""),
    rentFrequency: initialValues?.rentFrequency ?? "monthly",
    description: initialValues?.description ?? "",
    images:
      initialImages?.map((image, index) => ({
        key: image.key,
        url: image.url,
        isCover: image.isCover ?? index === 0
      })) ?? []
  };
}

function applyDraftValues(
  base: ListingFormFieldValues,
  draft: Record<string, unknown>
): ListingFormFieldValues {
  const next: ListingFormFieldValues = { ...base };
  const nextMutable = next as Record<string, unknown>;

  const assignString = (key: keyof ListingFormFieldValues) => {
    const value = draft[key as string];
    if (typeof value === "string") {
      nextMutable[key as string] = value;
    }
  };

  const assignNumeric = (key: keyof ListingFormFieldValues) => {
    const value = draft[key as string];
    if (typeof value === "number" || typeof value === "string") {
      nextMutable[key as string] = String(value);
    }
  };

  assignString("title");
  assignNumeric("rent");
  assignString("street");
  assignString("city");
  assignString("postalCode");
  assignString("propertyType");
  assignNumeric("beds");
  assignNumeric("baths");
  assignNumeric("area");
  assignString("parking");
  const draftAvailable = draft["availableFrom"];
  if (draftAvailable !== undefined) {
    nextMutable["availableFrom"] = normalizeDateValue(draftAvailable);
  }
  assignString("rentFrequency");
  assignString("description");

  const amenitiesRaw = draft["amenities"];
  if (Array.isArray(amenitiesRaw)) {
    next.amenities = amenitiesRaw.map((item) => String(item));
  }

  const petsRaw = draft["pets"];
  if (typeof petsRaw === "boolean") {
    next.pets = petsRaw ? "true" : "false";
  } else if (typeof petsRaw === "string") {
    next.pets = petsRaw;
  }

  const smokingRaw = draft["smoking"];
  if (typeof smokingRaw === "boolean") {
    next.smoking = smokingRaw ? "true" : "false";
  } else if (typeof smokingRaw === "string") {
    next.smoking = smokingRaw;
  }

  const imagesRaw = draft["images"];
  if (Array.isArray(imagesRaw)) {
    if (typeof imagesRaw[0] === "string") {
      next.images = (imagesRaw as string[]).map((url, index) => ({
        key: url,
        url,
        isCover: draft["cover"] === url || (draft["cover"] == null && index === 0)
      }));
    } else {
      next.images = (imagesRaw as Array<{ key: string; url: string; isCover?: boolean }>).map(
        (image, index) => ({
          key: image.key,
          url: image.url,
          isCover: image.isCover ?? index === 0
        })
      );
    }
  }

  return next;
}

export default function ListingForm({
  mode,
  initialValues,
  initialImages,
  loadDraft,
  onSubmit,
  onAutoSave,
  onSuccess
}: ListingFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [autoSaveState, setAutoSaveState] = useState<ListingFormState>({ status: "idle" });
  const [serverState, setServerState] = useState<ListingFormState>({ status: "idle" });

  const defaults = useMemo(
    () => buildDefaultValues({ initialValues, initialImages }),
    [initialImages, initialValues]
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    setFocus,
    watch,
    formState: { errors, isDirty, isValid }
  } = useForm<ListingFormFieldValues>({
    resolver: zodResolver(listingFormSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: defaults
  });

  const watchedValues = watch();
  const debouncedValues = useDebounce(watchedValues, 1200);

  const isCreateMode = mode === "create";
  const initialDraftLoaded = useRef(false);

  useEffect(() => {
    reset(defaults, { keepDirty: false });
  }, [defaults, reset]);

  useEffect(() => {
    if (!isCreateMode || !loadDraft) return;
    const loadDraftFn = loadDraft;
    let cancelled = false;
    async function load() {
      try {
        const result = await loadDraftFn();
        if (cancelled) return;
        if (result.status === "success" && result.data) {
          const merged = applyDraftValues(defaults, result.data);
          reset(merged, { keepDirty: false });
          initialDraftLoaded.current = true;
          setToast({ tone: "info", message: "Draft restored from your last session." });
        }
      } catch (error) {
        console.error("[ListingForm] Failed to load draft", error);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [defaults, isCreateMode, loadDraft, reset]);

  const runAutoSave = useCallback(
    async (values: ListingFormFieldValues) => {
      if (!onAutoSave) return;
      const parsed = listingFormSchema.safeParse(values);
      if (!parsed.success) return;
      try {
        const result = await onAutoSave(parsed.data);
        setAutoSaveState(result);
        if (result.status === "auto-saved") {
          setToast({
            tone: "info",
            message: `Draft saved at ${new Date(result.timestamp).toLocaleTimeString()}`
          });
        }
      } catch (error) {
        console.error("[ListingForm] Auto-save failed", error);
      }
    },
    [onAutoSave]
  );

  useEffect(() => {
    // Delay auto-save until the form is valid and the user has made changes to avoid storing partial drafts.
    if (!isCreateMode || !onAutoSave) return;
    if (!initialDraftLoaded.current && !isDirty) return;
    if (!isValid) return;
    void runAutoSave(debouncedValues);
  }, [debouncedValues, isCreateMode, isDirty, isValid, onAutoSave, runAutoSave]);

  useEffect(() => {
    if (serverState.status === "validation-error" && serverState.fieldErrors) {
      Object.entries(serverState.fieldErrors).forEach(([name, messages]) => {
        if (!messages?.length) return;
        setError(name as keyof ListingFormFieldValues, {
          type: "server",
          message: messages[0]
        });
      });
      setToast({
        tone: "error",
        message: serverState.message ?? "Please check the highlighted fields."
      });
    } else if (serverState.status === "error") {
      setToast({ tone: "error", message: serverState.message });
    } else if (serverState.status === "success") {
      setToast({
        tone: "success",
        message: mode === "create" ? "Listing created successfully." : "Listing updated."
      });
      onSuccess?.(serverState);
    }
  }, [mode, onSuccess, serverState, setError]);

  const handleValidSubmit = useCallback(
    async (rawValues: ListingFormFieldValues) => {
      const parsed = listingFormSchema.parse(rawValues);
      setSubmitting(true);
      setToast(null);
      try {
        const result = await onSubmit(parsed);
        setServerState(result);
        if (result.status === "success") {
          clearErrors();
        }
      } catch (error) {
        console.error("[ListingForm] Failed to submit listing", error);
        setToast({ tone: "error", message: "Unable to save listing. Try again." });
      } finally {
        setSubmitting(false);
      }
    },
    [clearErrors, onSubmit]
  );

  const handleError = useCallback(() => {
    const firstError = findFirstError(errors);

    if (firstError) {
      const fallbackLabel = firstError.name.toString().replace(/([A-Z])/g, " $1").trim();
      const normalizedFallback =
        fallbackLabel.length > 0 ? fallbackLabel.charAt(0).toUpperCase() + fallbackLabel.slice(1) : "This field";
      const label = LISTING_FIELD_LABELS[firstError.name] ?? normalizedFallback;
      setToast({
        tone: "error",
        message: `${label}: ${firstError.message ?? "Please review this field."}`
      });

      if (typeof window !== "undefined") {
        window.requestAnimationFrame(() => {
          setFocus(firstError.name, { shouldSelect: true });
          const element = document.querySelector<HTMLElement>(`[name="${firstError.name}"]`);
          element?.scrollIntoView({ block: "center", behavior: "smooth" });
        });
      } else {
        setFocus(firstError.name, { shouldSelect: true });
        const element = document.querySelector<HTMLElement>(`[name="${firstError.name}"]`);
        element?.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    } else {
      setToast({ tone: "error", message: "Please fix the highlighted errors and try again." });
    }
  }, [errors, setFocus]);

  const submitButtonDisabled = submitting;

  const autoSaveMessage =
    autoSaveState.status === "auto-saved"
      ? `Draft saved at ${new Date(autoSaveState.timestamp).toLocaleTimeString()}`
      : autoSaveState.status === "validation-error"
        ? autoSaveState.message
        : autoSaveState.status === "error"
          ? autoSaveState.message
          : null;

  const amenitiesFieldError = errors.amenities?.message;
  const propertyTypeRegister = register("propertyType");
  const rentFrequencyRegister = register("rentFrequency");
  const amenitiesRegister = register("amenities");
  const petsRegister = register("pets");
  const smokingRegister = register("smoking");

  return (
    <form
      className="space-y-6 rounded-3xl border border-brand-outline/60 bg-surface p-4 shadow-sm transition md:p-6 lg:p-8"
      noValidate
      onSubmit={handleSubmit(handleValidSubmit, handleError)}
      aria-describedby="listing-form-description"
    >
      <div id="listing-form-description" className="text-sm text-neutral-600">
        Provide complete and accurate details so renters can quickly decide if the listing fits their needs.
      </div>

      <div aria-live="polite" className="sr-only">
        {toast?.message ?? ""}
      </div>

      {toast ? (
        <ToastBanner tone={toast.tone} message={toast.message} role={toast.tone === "error" ? "alert" : "status"} />
      ) : null}

      <AutoSaveNotice message={autoSaveMessage} />

      <FormSection
        id="basic-info"
        title="Basic Info"
        description="Essential details renters will see first."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <InputField
            label="Listing title"
            required
            {...register("title")}
            error={errors.title?.message}
            aria-live="polite"
          />
          <InputField
            label="Monthly rent ($)"
            type="number"
            min={0}
            step="50"
            inputMode="decimal"
            required
            {...register("rent")}
            error={errors.rent?.message}
            helperText="Enter the monthly rent before incentives."
            aria-live="polite"
          />
          <InputField
            label="Bedrooms"
            type="number"
            min={0}
            step="1"
            inputMode="numeric"
            required
            {...register("beds")}
            error={errors.beds?.message}
            aria-live="polite"
          />
          <InputField
            label="Bathrooms"
            type="number"
            min={0}
            step="1"
            inputMode="numeric"
            required
            {...register("baths")}
            error={errors.baths?.message}
            aria-live="polite"
          />
          <InputField
            label="Square footage (optional)"
            type="number"
            min={0}
            step="10"
            inputMode="numeric"
            {...register("area")}
            error={errors.area?.message}
            aria-live="polite"
          />
          <SelectField
            id="propertyType"
            label="Property type"
            required
            error={errors.propertyType?.message}
            {...propertyTypeRegister}
          >
            {propertyTypeOptions.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <InputField
            label="Street address"
            required
            {...register("street")}
            error={errors.street?.message}
            aria-live="polite"
          />
          <InputField
            label="City"
            required
            {...register("city")}
            error={errors.city?.message}
            aria-live="polite"
          />
          <InputField
            label="Postal code"
            required
            {...register("postalCode")}
            className="uppercase"
            error={errors.postalCode?.message}
            helperText="Format ANA NAN for Canadian addresses."
            aria-live="polite"
          />
          <SelectField
            id="rentFrequency"
            label="Rent frequency"
            required
            {...rentFrequencyRegister}
          >
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
          </SelectField>
          <InputField
            label="Available from"
            type="date"
            {...register("availableFrom")}
            error={errors.availableFrom?.message}
            aria-live="polite"
          />
          <InputField
            label="Parking details"
            placeholder="e.g. 1 spot, underground, street"
            {...register("parking")}
            error={errors.parking?.message}
            aria-live="polite"
          />
        </div>
      </FormSection>

      <FormSection
        id="features"
        title="Features"
        description="Highlight what makes this home stand out."
      >
        <AmenitiesField
          options={amenitiesOptions}
          register={amenitiesRegister}
          error={amenitiesFieldError}
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <SelectField
            id="pets"
            label="Pets allowed?"
            error={errors.pets?.message}
            requiredMarker={false}
            {...petsRegister}
          >
            <option value="">Select</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </SelectField>
          <SelectField
            id="smoking"
            label="Smoking allowed?"
            error={errors.smoking?.message}
            requiredMarker={false}
            {...smokingRegister}
          >
            <option value="">Select</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </SelectField>
        </div>

        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <TextareaField
              id="description"
              label="Description"
              required
              error={errors.description?.message}
              helperText={
                errors.description
                  ? undefined
                  : "Aim for at least 20 characters to give renters enough detail."
              }
              placeholder="Mention standout amenities, nearby transit, and application requirements."
              {...field}
            />
          )}
        />
      </FormSection>

      <FormSection
        id="photos"
        title="Photos"
        description="Upload high-quality images and choose a cover photo."
      >
        <Controller
          control={control}
          name="images"
          render={({ field }) => (
            <ListingImageUploader
              value={field.value}
              onChange={(images) => {
                field.onChange(images);
                clearErrors("images");
              }}
            />
          )}
        />
        {errors.images ? (
          <p className="text-sm font-medium text-danger" role="alert">
            {errors.images.message as string}
          </p>
        ) : null}
      </FormSection>

      <div className="flex flex-col justify-between gap-3 border-t border-brand-outline/60 pt-4 sm:flex-row sm:items-center">
        <p className="text-sm text-neutral-600">
          Fields marked with <span className="text-brand-primary">*</span> are required.
        </p>
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            size="lg"
            className="min-w-[160px] focus:ring-2 focus:ring-brand-primary/40"
            disabled={submitButtonDisabled || submitting}
            aria-disabled={submitButtonDisabled || submitting}
          >
            {submitting ? "Saving..." : mode === "create" ? "Publish Listing" : "Save Changes"}
          </Button>
        </div>
      </div>
    </form>
  );
}
