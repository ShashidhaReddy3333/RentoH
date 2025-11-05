'use server';

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";

import { hasSupabaseEnv, env } from "@/lib/env";
import { addMockProperty } from "@/lib/mock";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSlug } from "@/lib/utils/slug";
import type { Property } from "@/lib/types";
import { ListingSchema } from "./schema";

export type ListingFormState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string }
  | { status: "auto-saved"; timestamp: number }
  | { status: "validation-error"; message: string; fieldErrors: Record<string, string[]>; formErrors?: string[] };

const DRAFT_STORAGE_KEY = "__rento_listing_draft__";

type DraftStore = {
  [key: string]: Record<string, unknown> | undefined;
};

type ListingValues = ReturnType<typeof ListingSchema.parse>;

function cloneDraftData(input: Record<string, unknown> | undefined) {
  if (!input) return undefined;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (Array.isArray(value)) {
      result[key] = [...value];
    } else {
      result[key] = value;
    }
  }
  return result;
}

function persistDraft(data: Record<string, unknown>) {
  const store = globalThis as unknown as DraftStore;
  store[DRAFT_STORAGE_KEY] = cloneDraftData(data);
}

function readPersistedDraft(): Record<string, unknown> | undefined {
  const store = globalThis as unknown as DraftStore;
  const data = store[DRAFT_STORAGE_KEY];
  return cloneDraftData(data);
}

function clearPersistedDraft() {
  const store = globalThis as unknown as DraftStore;
  if (DRAFT_STORAGE_KEY in store) {
    delete store[DRAFT_STORAGE_KEY];
  }
}

function formDataToObject(formData: FormData): Record<string, unknown> {
  const raw: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (key.endsWith("[]")) {
      const bareKey = key.slice(0, -2);
      const stringValue = typeof value === "string" ? value : String(value);
      const existing = raw[bareKey];
      if (Array.isArray(existing)) {
        raw[bareKey] = [...existing, stringValue];
      } else if (existing) {
        raw[bareKey] = [existing, stringValue].flat().map((item) => (typeof item === "string" ? item : String(item)));
      } else {
        raw[bareKey] = [stringValue];
      }
    } else {
      raw[key] = typeof value === "string" ? value : String(value);
    }
  }
  return raw;
}

function buildOrderedImages(images: string[] | undefined, cover?: string): string[] {
  const sanitizedCover = typeof cover === "string" ? cover.trim() : "";
  const filtered = (images ?? []).map((image) => image.trim()).filter((image) => image.length > 0);
  const unique = Array.from(new Set(filtered));
  if (sanitizedCover && unique.includes(sanitizedCover)) {
    const withoutCover = unique.filter((image) => image !== sanitizedCover);
    return [sanitizedCover, ...withoutCover];
  }
  return unique;
}

function toMockProperty(values: ListingValues, slug: string, orderedImages: string[]): Property {
  return {
    id: randomUUID(),
    slug,
    title: values.title,
    images: orderedImages,
    price: values.rent,
    beds: values.beds,
    baths: values.baths,
    type: values.propertyType,
    city: values.city,
    verified: false,
    pets: values.pets ?? false,
    furnished: false,
    createdAt: new Date().toISOString(),
    address: values.street,
    description: values.description,
    amenities: values.amenities && values.amenities.length > 0 ? values.amenities : undefined,
    area: typeof values.area === "number" ? values.area : undefined,
    availableFrom: values.availableFrom,
    status: "draft"
  };
}

export async function saveDraftAction(formData: FormData): Promise<ListingFormState> {
  const raw = formDataToObject(formData);
  const coverValue = raw["cover"];
  const coverKey = typeof coverValue === "string" ? coverValue : undefined;

  if (!hasSupabaseEnv) {
    if (env.NODE_ENV === "production") {
      return { status: "error", message: "Missing Supabase configuration. Please set up your environment variables." };
    }
    persistDraft(raw);
    return { status: "auto-saved", timestamp: Date.now() };
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return { status: "error", message: "Supabase client unavailable." };
  }

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { status: "error", message: "You must be signed in to save drafts." };
  }

  const role =
    (user.app_metadata?.["role"] as string | undefined) ??
    (user.user_metadata?.["role"] as string | undefined) ??
    "tenant";

  if (role !== "landlord" && role !== "admin") {
    return { status: "error", message: "Only landlord accounts can create drafts." };
  }

  const parsed = ListingSchema.safeParse(raw);
  if (!parsed.success) {
    const { fieldErrors, formErrors } = parsed.error.flatten();
    return {
      status: "validation-error",
      message: "Draft not saved. Complete the required fields to enable auto-save.",
      fieldErrors,
      formErrors
    };
  }

  const values = parsed.data;
  const orderedImages = buildOrderedImages(values.images, coverKey);
  const now = new Date().toISOString();

  const { data: existingDraft, error: draftLookupError } = await supabase
    .from("properties")
    .select("id, slug")
    .eq("landlord_id", user.id)
    .eq("status", "draft")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (draftLookupError) {
    console.error("[listings] Failed to look up existing draft", draftLookupError);
  }

  const draftId = existingDraft?.id ?? randomUUID();
  const landlordSuffix = user.id?.slice(0, 8) ?? randomUUID().split("-")[0];
  const draftSlug = existingDraft?.slug ?? `${createSlug(values.title)}-${landlordSuffix}-draft`;

  const { error } = await supabase
    .from("properties")
    .upsert(
      {
        id: draftId,
        landlord_id: user.id,
        title: values.title,
        slug: draftSlug,
        price: values.rent,
        address: values.street,
        postal_code: values.postalCode,
        city: values.city,
        type: values.propertyType,
        beds: values.beds,
        baths: values.baths,
        area: values.area,
        amenities: values.amenities ?? [],
        images: orderedImages,
        pets: values.pets ?? false,
        smoking: values.smoking ?? false,
        parking: values.parking,
        available_from: values.availableFrom,
        rent_frequency: values.rentFrequency,
        description: values.description,
        status: "draft",
        verified: false,
        furnished: false,
        updated_at: now
      },
      { onConflict: "id" }
    );

  if (error) {
    console.error("[listings] Failed to save draft", error);
    return { status: "error", message: error.message };
  }

  persistDraft(raw);

  return { status: "auto-saved", timestamp: Date.now() };
}

export async function createListingAction(
  _prev: ListingFormState,
  formData: FormData
): Promise<ListingFormState> {
  try {
    const raw = formDataToObject(formData);
    const coverValue = raw["cover"];
    const coverKey = typeof coverValue === "string" ? coverValue : undefined;

    const parsed = ListingSchema.safeParse(raw);
    if (!parsed.success) {
      const { fieldErrors, formErrors } = parsed.error.flatten();
      return {
        status: "validation-error",
        message: "Please check the highlighted fields.",
        fieldErrors,
        formErrors
      };
    }

    const values = parsed.data;
    const orderedImages = buildOrderedImages(values.images, coverKey);
    const slug = `${createSlug(values.title)}-${randomUUID().split("-")[0]}`;

    if (!hasSupabaseEnv) {
      if (env.NODE_ENV === "production") {
        return { status: "error", message: "Missing Supabase configuration. Please set up your environment variables." };
      }

      addMockProperty(toMockProperty(values, slug, orderedImages));
      clearPersistedDraft();
      return { status: "success" };
    }

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return { status: "error", message: "Supabase client unavailable." };
    }

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { status: "error", message: "You must be signed in to create a listing." };
    }

    const role =
      (user.app_metadata?.["role"] as string | undefined) ??
      (user.user_metadata?.["role"] as string | undefined) ??
      "tenant";

    if (role !== "landlord" && role !== "admin") {
      return { status: "error", message: "Only landlord accounts can create listings." };
    }

    const { error } = await supabase.from("properties").insert({
      landlord_id: user.id,
      title: values.title,
      slug,
      price: values.rent,
      address: values.street,
      postal_code: values.postalCode,
      city: values.city,
      type: values.propertyType,
      beds: values.beds,
      baths: values.baths,
      area: values.area,
      amenities: values.amenities ?? [],
      images: orderedImages,
      pets: values.pets ?? false,
      smoking: values.smoking ?? false,
      parking: values.parking,
      available_from: values.availableFrom,
      rent_frequency: values.rentFrequency,
      description: values.description,
      status: "draft",
      verified: false,
      furnished: false
    });

    if (error) {
      console.error("[listings] Failed to create listing", error);
      return { status: "error", message: error.message };
    }

    clearPersistedDraft();

    revalidatePath("/dashboard");
    revalidatePath("/browse");
    revalidatePath(`/property/${slug}`);

    return { status: "success" };
  } catch (error) {
    console.error("[listings] Unexpected error creating listing", error);
    const message = error instanceof Error ? error.message : "Failed to create listing";
    return { status: "error", message };
  }
}

export async function fetchDraftAction(): Promise<ListingFormState & { data?: Record<string, unknown> }> {
  if (!hasSupabaseEnv) {
    if (env.NODE_ENV === "production") {
      return { status: "error", message: "Missing Supabase configuration. Please set up your environment variables." };
    }
    const draft = readPersistedDraft();
    if (!draft) {
      return { status: "idle" };
    }
    return { status: "success", data: draft };
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return { status: "error", message: "Supabase client unavailable." };
  }

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { status: "error", message: "You must be signed in to view drafts." };
  }

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("landlord_id", user.id)
    .eq("status", "draft")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[listings] Failed to fetch draft", error);
    return { status: "error", message: error.message };
  }

  if (!data) {
    return { status: "idle" };
  }

  // Transform DB schema to form fields
  const formData: Record<string, unknown> = {
    title: data.title,
    rent: data.price,
    street: data.address,
    city: data.city,
    postalCode: data.postal_code,
    propertyType: data.type,
    beds: data.beds,
    baths: data.baths,
    area: data.area,
    amenities: data.amenities,
    images: data.images,
    pets: data.pets,
    smoking: data.smoking,
    parking: data.parking,
    availableFrom: data.available_from,
    rentFrequency: data.rent_frequency,
    description: data.description
  };

  persistDraft(formData);

  return { status: "success", data: formData };
}

