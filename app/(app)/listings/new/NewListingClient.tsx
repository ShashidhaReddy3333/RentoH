"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import ListingForm, {
  type ListingFormInitialValues,
  type ListingImageInput,
  type ListingFormMode
} from "@/components/forms/ListingForm";
import {
  createListingAction,
  saveDraftAction,
  fetchDraftAction,
  updateListingAction,
  type ListingFormState
} from "./actions";
import type { ListingFormValues } from "@/lib/validation/listingSchema";

const initialListingFormState: ListingFormState = { status: "idle" };

type ListingFormProps = {
  mode?: ListingFormMode;
  listingId?: string;
  initialValues?: ListingFormInitialValues;
  initialImages?: ListingImageInput[];
};

function valuesToFormData(values: ListingFormValues, listingId?: string): FormData {
  const data = new FormData();
  data.set("title", values.title);
  data.set("street", values.street);
  data.set("city", values.city);
  data.set("postalCode", values.postalCode);
  data.set("propertyType", values.propertyType);
  data.set("rent", String(values.rent));
  data.set("beds", String(values.beds));
  data.set("baths", String(values.baths));

  if (typeof values.area === "number") {
    data.set("area", String(values.area));
  }

  if (values.parking) {
    data.set("parking", values.parking);
  }

  if (values.availableFrom) {
    data.set("availableFrom", values.availableFrom);
  }

  if (values.pets != null) {
    data.set("pets", String(values.pets));
  }

  if (values.smoking != null) {
    data.set("smoking", String(values.smoking));
  }

  data.set("rentFrequency", values.rentFrequency);
  data.set("description", values.description);

  if (Array.isArray(values.amenities)) {
    values.amenities.forEach((amenity) => data.append("amenities[]", amenity));
  }

  if (Array.isArray(values.imageEntries)) {
    values.imageEntries.forEach((image) => data.append("images[]", image.key));
  }

  if (values.coverImageKey) {
    data.set("cover", values.coverImageKey);
  }

  if (listingId) {
    data.set("listingId", listingId);
  }

  return data;
}

export default function NewListingClient({
  mode = "create",
  listingId,
  initialValues,
  initialImages = []
}: ListingFormProps) {
  const router = useRouter();
  const isCreateMode = mode === "create";

  const handleSubmit = useCallback(
    async (values: ListingFormValues) => {
      const formData = valuesToFormData(values, listingId);
      const result =
        mode === "create"
          ? await createListingAction(initialListingFormState, formData)
          : await updateListingAction(initialListingFormState, formData);
      if (result.status === "success") {
        if (mode === "create") {
          router.push("/dashboard?toast=listing-created");
        } else {
          router.refresh();
        }
      }
      return result;
    },
    [listingId, mode, router]
  );

  const handleAutoSave = useCallback(
    async (values: ListingFormValues) => {
      if (!isCreateMode) return { status: "idle" } as ListingFormState;
      const result = await saveDraftAction(valuesToFormData(values, listingId));
      return result;
    },
    [isCreateMode, listingId]
  );

  return (
    <ListingForm
      mode={mode}
      initialValues={initialValues}
      initialImages={initialImages}
      loadDraft={isCreateMode ? fetchDraftAction : undefined}
      onSubmit={handleSubmit}
      onAutoSave={isCreateMode ? handleAutoSave : undefined}
    />
  );
}
