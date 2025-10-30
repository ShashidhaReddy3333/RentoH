'use server';

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import { hasSupabaseEnv, env } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSlug } from "@/lib/utils/slug";

export const ListingSchema = z.object({
  title: z.string().min(3, "Title is required"),
  rent: z.coerce.number().int().positive("Rent must be greater than zero"),
  street: z.string().min(3, "Street address is required"),
  city: z.string().min(2, "City is required"),
  postalCode: z.string().min(3, "Postal code is required"),
  propertyType: z.enum(["apartment", "condo", "house", "townhouse"]),
  beds: z.coerce.number().int().min(0, "Beds required"),
  baths: z.coerce.number().int().min(0, "Baths required"),
  area: z.coerce.number().int().min(0, "Area required").optional(),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  pets: z.coerce.boolean().optional(),
  smoking: z.coerce.boolean().optional(),
  parking: z.string().optional(),
  availableFrom: z.string().optional(),
  rentFrequency: z.enum(["monthly", "weekly", "biweekly"]).default("monthly"),
  description: z.string().min(10, "Description should be at least 10 characters")
});

export type ListingFormState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string }
  | { status: "auto-saved"; timestamp: number };

export const initialListingFormState: ListingFormState = { status: "idle" };

export async function saveDraftAction(formData: FormData): Promise<ListingFormState> {
  if (!hasSupabaseEnv) {
    if (env.NODE_ENV === "production") {
      return { status: "error", message: "Missing Supabase configuration. Please set up your environment variables." };
    }
    // In dev mode, we'll just pretend the save worked
    return { status: "auto-saved", timestamp: Date.now() };
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return { status: "error", message: "Supabase client unavailable." };
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { status: "error", message: "You must be signed in to save drafts." };
  }

  const role = (user.app_metadata?.["role"] as string | undefined) ?? 
               (user.user_metadata?.["role"] as string | undefined) ?? 
               "tenant";

  if (role !== "landlord" && role !== "admin") {
    return { status: "error", message: "Only landlord accounts can create drafts." };
  }

  // Build raw object from form data
  const entries = Array.from(formData.entries());
  const raw: Record<string, unknown> = {};
  for (const [key, value] of entries) {
    if (key.endsWith("[]")) {
      const k = key.slice(0, -2);
      raw[k] = Array.isArray(raw[k]) ? [...(raw[k] as string[]), String(value)] : [String(value)];
    } else {
      raw[key] = value;
    }
  }

  const parsed = ListingSchema.safeParse(raw);
  if (!parsed.success) {
    // For auto-save, we don't want to show validation errors
    return { status: "error", message: "Invalid draft data" };
  }

  const values = parsed.data;

  const { error } = await supabase.from("properties").upsert({
    landlord_id: user.id,
    title: values.title,
    price: values.rent,
    address: values.street,
    postal_code: values.postalCode,
    city: values.city,
    type: values.propertyType,
    beds: values.beds,
    baths: values.baths,
    area: values.area,
    amenities: values.amenities ?? [],
    images: Array.isArray(values.images) ? values.images : values.images ? [values.images] : [],
    pets: values.pets ?? false,
    smoking: values.smoking ?? false,
    parking: values.parking,
    available_from: values.availableFrom,
    rent_frequency: values.rentFrequency,
    description: values.description,
    status: "draft",
    verified: false,
    furnished: false,
    updated_at: new Date().toISOString()
  });

  if (error) {
    console.error("[listings] Failed to save draft", error);
    return { status: "error", message: error.message };
  }

  return { status: "auto-saved", timestamp: Date.now() };
}

export async function createListingAction(
  _prev: ListingFormState,
  formData: FormData
): Promise<ListingFormState> {
  try {
    const entries = Array.from(formData.entries());
    const raw: Record<string, unknown> = {};
    for (const [key, value] of entries) {
      if (key.endsWith("[]")) {
        const k = key.slice(0, -2);
        raw[k] = Array.isArray(raw[k]) ? [...(raw[k] as string[]), String(value)] : [String(value)];
      } else {
        raw[key] = value;
      }
    }

    const parsed = ListingSchema.safeParse(raw);
    if (!parsed.success) {
      return { status: "error", message: "Please check the highlighted fields." };
    }

    const values = parsed.data;

    if (!hasSupabaseEnv) {
      return { status: "error", message: "Missing Supabase configuration. Please set up your environment variables." };
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

    const imagesArr: string[] = Array.isArray(values.images)
      ? (values.images as string[])
      : values.images
        ? [values.images as unknown as string]
        : [];
    const coverKey = (values as { cover?: string }).cover;
    let orderedImages = imagesArr;
    if (coverKey) {
      orderedImages = [coverKey, ...imagesArr.filter((i) => i !== coverKey)];
    }

    const slug = `${createSlug(values.title)}-${randomUUID().split("-")[0]}`;

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
    return { status: "error", message: "Missing Supabase configuration. Please set up your environment variables." };
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return { status: "error", message: "Supabase client unavailable." };
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
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
  const formData = {
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
    description: data.description,
  };

  return { status: "success", data: formData };
}

