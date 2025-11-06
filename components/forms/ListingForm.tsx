"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ListingImageUploader from "@/components/ListingImageUploader";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input";
import type { ListingFormState } from "@/app/(app)/listings/new/actions";
import { listingFormSchema } from "@/lib/validation/listingSchema";
import type { ListingFormInput, ListingFormValues } from "@/lib/validation/listingSchema";
import { useDebounce } from "@/lib/utils/hooks";

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
    availableFrom:
      initialValues?.availableFrom?.includes("T")
        ? initialValues.availableFrom.split("T")[0]
        : initialValues?.availableFrom ?? "",
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
  assignString("availableFrom");
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
    setToast({ tone: "error", message: "Please fix the highlighted errors and try again." });
  }, []);

  const submitButtonDisabled = submitting || !isValid;

  const toastClasses =
    toast?.tone === "error"
      ? "border-danger/40 bg-danger-muted text-danger"
      : toast?.tone === "success"
        ? "border-brand-success/40 bg-brand-successMuted text-brand-success"
        : "border-brand-primary/30 bg-brand-primaryMuted text-brand-primaryStrong";

  const autoSaveMessage =
    autoSaveState.status === "auto-saved"
      ? `Draft saved at ${new Date(autoSaveState.timestamp).toLocaleTimeString()}`
      : autoSaveState.status === "validation-error"
        ? autoSaveState.message
        : autoSaveState.status === "error"
          ? autoSaveState.message
          : null;

  const amenitiesFieldError = errors.amenities?.message;

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
        <div role={toast.tone === "error" ? "alert" : "status"} className={clsx("rounded-2xl border px-4 py-3 text-sm font-medium", toastClasses)}>
          {toast.message}
        </div>
      ) : null}

      {autoSaveMessage ? (
        <p role="status" className="rounded-xl border border-brand-outline/50 bg-brand-primaryMuted/40 px-3 py-2 text-sm text-brand-primary">
          {autoSaveMessage}
        </p>
      ) : null}

      <section aria-labelledby="basic-info-heading" className="space-y-4">
        <header>
          <h2 id="basic-info-heading" className="text-2xl font-semibold text-brand-dark">
            Basic Info
          </h2>
          <p className="text-sm text-neutral-600">
            Essential details renters will see first.
          </p>
        </header>

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
          <div className="grid gap-1.5">
            <label htmlFor="propertyType" className="text-sm font-medium text-brand-dark">
              Property type<span className="ml-1 text-brand-primary">*</span>
            </label>
            <select
              id="propertyType"
              {...register("propertyType")}
              className={clsx(
                "block w-full rounded-lg border border-brand-outline/70 bg-surface px-3 py-2 text-sm text-textc shadow-sm transition focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                errors.propertyType && "border-danger text-danger focus-visible:ring-danger/40"
              )}
              aria-invalid={errors.propertyType ? "true" : undefined}
              aria-describedby={errors.propertyType ? "propertyType-error" : undefined}
            >
              {propertyTypeOptions.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.propertyType ? (
              <p id="propertyType-error" className="text-sm font-medium text-danger" role="alert">
                {errors.propertyType.message}
              </p>
            ) : null}
          </div>
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
          <div className="grid gap-1.5">
            <label htmlFor="rentFrequency" className="text-sm font-medium text-brand-dark">
              Rent frequency<span className="ml-1 text-brand-primary">*</span>
            </label>
            <select
              id="rentFrequency"
              {...register("rentFrequency")}
              className="block w-full rounded-lg border border-brand-outline/70 bg-surface px-3 py-2 text-sm text-textc shadow-sm transition focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Biweekly</option>
            </select>
          </div>
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
      </section>

      <section aria-labelledby="features-heading" className="space-y-4">
        <header>
          <h2 id="features-heading" className="text-2xl font-semibold text-brand-dark">
            Features
          </h2>
          <p className="text-sm text-neutral-600">
            Highlight what makes this home stand out.
          </p>
        </header>

        <div>
          <label className="text-sm font-medium text-brand-dark">Amenities</label>
          <p className="text-sm text-neutral-600">Select all amenities included with this rental.</p>
          <div
            role="group"
            className={clsx(
              "mt-3 grid gap-2 rounded-2xl border border-brand-outline/60 p-4 md:grid-cols-2",
              amenitiesFieldError && "border-danger"
            )}
            aria-describedby={amenitiesFieldError ? "amenities-error" : undefined}
          >
            {amenitiesOptions.map((amenity) => (
              <label
                key={amenity.value}
                className="inline-flex select-none items-center gap-2 rounded-xl border border-brand-outline/50 bg-brand-light px-3 py-2 text-sm text-brand-dark transition hover:border-brand-primary hover:text-brand-primary"
              >
                <input
                  type="checkbox"
                  value={amenity.value}
                  className="h-4 w-4 rounded border-brand-outline/60 text-brand-primary focus-visible:ring-brand-primary"
                  {...register("amenities")}
                />
                <span>{amenity.label}</span>
              </label>
            ))}
          </div>
          {amenitiesFieldError ? (
            <p id="amenities-error" className="mt-2 text-sm font-medium text-danger" role="alert">
              {amenitiesFieldError}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="grid gap-1.5">
            <label htmlFor="pets" className="text-sm font-medium text-brand-dark">
              Pets allowed?
            </label>
            <select
              id="pets"
              {...register("pets")}
              className="block w-full rounded-lg border border-brand-outline/70 bg-surface px-3 py-2 text-sm text-textc shadow-sm transition focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              <option value="">Select</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
            {errors.pets ? (
              <p className="text-sm font-medium text-danger" role="alert">
                {errors.pets.message}
              </p>
            ) : null}
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="smoking" className="text-sm font-medium text-brand-dark">
              Smoking allowed?
            </label>
            <select
              id="smoking"
              {...register("smoking")}
              className="block w-full rounded-lg border border-brand-outline/70 bg-surface px-3 py-2 text-sm text-textc shadow-sm transition focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              <option value="">Select</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
            {errors.smoking ? (
              <p className="text-sm font-medium text-danger" role="alert">
                {errors.smoking.message}
              </p>
            ) : null}
          </div>
        </div>

        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <div className="space-y-1.5">
              <label htmlFor="description" className="text-sm font-medium text-brand-dark">
                Description<span className="ml-1 text-brand-primary">*</span>
              </label>
              <textarea
                id="description"
                rows={5}
                className={clsx(
                  "min-h-[140px] rounded-lg border border-brand-outline/70 bg-surface px-3 py-2 text-sm text-textc shadow-sm transition focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                  errors.description && "border-danger text-danger focus-visible:ring-danger/40"
                )}
                placeholder="Mention standout amenities, nearby transit, and application requirements."
                {...field}
              />
              {errors.description ? (
                <p className="text-sm font-medium text-danger" role="alert">
                  {errors.description.message}
                </p>
              ) : (
                <p className="text-sm text-neutral-600">
                  Aim for at least 20 characters to give renters enough detail.
                </p>
              )}
            </div>
          )}
        />
      </section>

      <section aria-labelledby="photos-heading" className="space-y-4">
        <header>
          <h2 id="photos-heading" className="text-2xl font-semibold text-brand-dark">
            Photos
          </h2>
          <p className="text-sm text-neutral-600">
            Upload high-quality images and choose a cover photo.
          </p>
        </header>

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
      </section>

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
