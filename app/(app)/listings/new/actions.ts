'use server';

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ListingSchema = z.object({
  title: z.string().min(3, "Title is required"),
  rent: z.coerce.number().int().positive("Rent must be greater than zero"),
  street: z.string().min(3, "Street address is required"),
  city: z.string().min(2, "City is required"),
  postalCode: z.string().min(3, "Postal code is required"),
  propertyType: z.enum(["apartment", "condo", "house", "townhouse"]),
  description: z.string().min(10, "Description should be at least 10 characters")
});

export type ListingFormState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export async function createListingAction(_prev: ListingFormState, formData: FormData): Promise<ListingFormState> {
  if (!hasSupabaseEnv) {
    return { status: "error", message: "Supabase is not configured in this environment." };
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return { status: "error", message: "Supabase client unavailable." };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = ListingSchema.safeParse(raw);

  if (!parsed.success) {
    const firstError = parsed.error.errors.at(0)?.message ?? "Invalid listing details.";
    return { status: "error", message: firstError };
  }

  const values = parsed.data;

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
    price: values.rent,
    address: values.street,
    postal_code: values.postalCode,
    city: values.city,
    type: values.propertyType,
    description: values.description,
    status: "draft",
    amenities: [],
    images: [],
    verified: false,
    pets: false,
    furnished: false
  });

  if (error) {
    console.error("[listings] Failed to create listing", error);
    return { status: "error", message: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/browse");

  return { status: "success" };
}

export const initialListingFormState: ListingFormState = { status: "idle" };

