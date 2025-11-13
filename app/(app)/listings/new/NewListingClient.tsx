"use client";

import { useCallback, useRef } from "react";
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
  updateListingAction
} from "./actions";
import type { ListingFormState } from "./types";
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
  const draftListingIdRef = useRef<string | undefined>(listingId);
  const redirectToDashboard = useCallback(() => {
    router.replace("/dashboard");
    router.refresh();
  }, [router]);

  const handleSubmit = useCallback(
    async (values: ListingFormValues) => {
      const targetListingId = listingId ?? draftListingIdRef.current;
      const formData = valuesToFormData(values, targetListingId);
      const result =
        mode === "create"
          ? await createListingAction(initialListingFormState, formData)
          : await updateListingAction(initialListingFormState, formData);
      if (result.status === "success") {
        if (mode === "create") {
          draftListingIdRef.current = undefined;
        }
        redirectToDashboard();
      }
      return result;
    },
    [listingId, mode, redirectToDashboard]
  );

  const loadDraft = useCallback(async () => {
    const result = await fetchDraftAction();
    if (result.listingId) {
      draftListingIdRef.current = result.listingId;
    }
    return result;
  }, []);

  const handleSaveDraft = useCallback(
    async (values: ListingFormValues) => {
      if (!isCreateMode) {
        return { status: "idle" } as ListingFormState;
      }
      const targetListingId = listingId ?? draftListingIdRef.current;
      const result = await saveDraftAction(valuesToFormData(values, targetListingId));
      if (result.listingId) {
        draftListingIdRef.current = result.listingId;
      }
      if (result.status === "auto-saved" || result.status === "success") {
        redirectToDashboard();
      }
      return result;
    },
    [isCreateMode, listingId, redirectToDashboard]
  );

  return (
    <ListingForm
      mode={mode}
      initialValues={initialValues}
      initialImages={initialImages}
      loadDraft={isCreateMode ? loadDraft : undefined}
      onSubmit={handleSubmit}
      onAutoSave={undefined}
      onSaveDraft={isCreateMode ? handleSaveDraft : undefined}
    />
  );
}
