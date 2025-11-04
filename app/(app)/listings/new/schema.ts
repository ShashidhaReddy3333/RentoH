import { z } from "zod";

/**
 * Validation schema for the new listing form. This lives outside of the
 * server actions module so it can be reused by client components and tests
 * without triggering Next.js `use server` export restrictions.
 */
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
  description: z.string().min(10, "Description should be at least 10 characters"),
});
