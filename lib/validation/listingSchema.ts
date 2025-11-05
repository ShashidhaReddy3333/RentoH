import { z } from "zod";

const canadianPostalCode = /^[A-Z]\d[A-Z] \d[A-Z]\d$/i;

const booleanish = z
  .union([z.boolean(), z.number(), z.string()])
  .transform((value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "n", "off", ""].includes(normalized)) return false;
    return value.length > 0;
  });

const optionalBooleanish = z
  .union([booleanish, z.null(), z.undefined()])
  .transform((value) => (value === undefined ? undefined : Boolean(value)));

const numericString = (message: string) =>
  z
    .union([z.number(), z.string()])
    .transform((value) => {
      if (typeof value === "number") return value;
      const normalized = value.replace(/,/g, "").trim();
      if (!normalized) return NaN;
      return Number(normalized);
    })
    .refine((value) => Number.isFinite(value), { message });

const optionalNumeric = (message: string) =>
  z
    .union([z.number(), z.string(), z.undefined(), z.null()])
    .transform((value) => {
      if (value === undefined || value === null) return undefined;
      if (typeof value === "number") return value;
      const normalized = value.replace(/,/g, "").trim();
      if (!normalized) return undefined;
      return Number(normalized);
    })
    .refine((value) => value === undefined || Number.isFinite(value), { message });

const amenitiesArray = z
  .union([
    z.array(z.string()),
    z.string().transform((value) => value.split(",").map((item) => item.trim()).filter(Boolean))
  ])
  .transform((value) =>
    value
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 20)
  );

const imageArray = z
  .array(
    z.object({
      key: z.string().min(1),
      url: z.string().url().or(z.string().min(1)),
      isCover: z.boolean().optional()
    })
  )
  .max(12, "You can upload up to 12 photos")
  .or(z.array(z.string()))
  .optional()
  .transform((value) => {
    if (!value) return [];
    if (Array.isArray(value) && value.length && typeof value[0] === "string") {
      const urls = value as string[];
      return urls.map((url, index) => ({
        key: url,
        url,
        isCover: index === 0
      }));
    }
    return value as Array<{ key: string; url: string; isCover?: boolean }>;
  });

export const listingFormSchema = z
  .object({
    title: z.string().min(3, "Title is required").max(120, "Keep titles under 120 characters").trim(),
    streetAddress: z.string().min(3, "Street address is required").trim(),
    city: z.string().min(2, "City is required").max(60).trim(),
    postalCode: z
      .string()
      .transform((value) => value.trim().toUpperCase())
      .refine((value) => canadianPostalCode.test(value), {
        message: "Enter a Canadian postal code (e.g. A1A 1A1)"
      }),
    rent: numericString("Rent must be a valid number").refine((value) => value > 0, {
      message: "Rent must be greater than zero"
    }),
    beds: numericString("Beds must be a number").refine((value) => value >= 0, {
      message: "Beds must be zero or more"
    }),
    baths: numericString("Baths must be a number").refine((value) => value >= 0, {
      message: "Baths must be zero or more"
    }),
    area: optionalNumeric("Area must be a valid number").refine(
      (value) => value === undefined || value >= 0,
      "Area must be zero or more"
    ),
    propertyType: z.enum(["apartment", "condo", "house", "townhouse"]),
    amenities: amenitiesArray.optional().default([]),
    pets: optionalBooleanish,
    smoking: optionalBooleanish,
    parking: z.string().trim().max(120).optional(),
    availableFrom: z
      .union([z.string(), z.date(), z.undefined(), z.null()])
      .transform((value) => {
        if (!value) return undefined;
        if (value instanceof Date) {
          return value.toISOString().slice(0, 10);
        }
        const trimmed = value.trim();
        return trimmed.length ? trimmed : undefined;
      }),
    rentFrequency: z.enum(["monthly", "weekly", "biweekly"]).default("monthly"),
    description: z
      .string()
      .trim()
      .min(20, "Tell renters more about this home (min 20 characters)")
      .max(2000, "Keep descriptions under 2000 characters"),
    images: imageArray
  })
  .superRefine((values, ctx) => {
    if (values.images && values.images.length) {
      const coverCount = values.images.filter((image) => image.isCover).length;
      if (coverCount === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["images"],
          message: "Select a cover photo"
        });
      }
    }
  })
  .transform((values) => {
    const orderedImages: Array<{ key: string; url: string; isCover: boolean }> = (
      values.images ?? []
    ).map((image, index) => {
      if (typeof image === "string") {
        return {
          key: image,
          url: image,
          isCover: index === 0
        };
      }

      return {
        key: image.key,
        url: image.url,
        isCover: Boolean(image.isCover)
      };
    });

    const coverEntry = orderedImages.find((image) => image.isCover);
    const sorted: Array<{ key: string; url: string; isCover: boolean }> = coverEntry
      ? [coverEntry, ...orderedImages.filter((image) => image.key !== coverEntry.key)]
      : orderedImages;

    const imageKeys = sorted.map((image) => image.key);

    return {
      ...values,
      street: values.streetAddress,
      rent: Number(values.rent),
      beds: Number(values.beds),
      baths: Number(values.baths),
      area: values.area ?? undefined,
      pets: values.pets,
      smoking: values.smoking,
      imageEntries: sorted,
      images: imageKeys,
      coverImageKey: sorted[0]?.key
    };
  });

export type ListingFormInput = z.input<typeof listingFormSchema>;
export type ListingFormValues = z.output<typeof listingFormSchema>;

export const ListingSchema = listingFormSchema;
