import { describe, expect, it } from "vitest";
import { ListingSchema } from "@/app/(app)/listings/new/schema";

describe("Listing Schema Validation", () => {
  it("should validate a complete listing", () => {
    const validListing = {
      title: "Modern Apartment",
      rent: 1500,
      street: "123 Main St",
      city: "Waterloo",
      postalCode: "N2L 3G1",
      propertyType: "apartment",
      beds: 2,
      baths: 1,
      area: 800,
      amenities: ["Parking", "Laundry"],
      images: ["/image1.jpg", "/image2.jpg"],
      pets: true,
      smoking: false,
      parking: "Underground",
      availableFrom: "2024-01-01",
      rentFrequency: "monthly",
      description: "A beautiful modern apartment in the heart of the city"
    };

    const result = ListingSchema.safeParse(validListing);
    expect(result.success).toBe(true);
  });

  it("should reject incomplete listings", () => {
    const incompleteListing = {
      title: "Test",
      rent: 1500
    };

    const result = ListingSchema.safeParse(incompleteListing);
    expect(result.success).toBe(false);
    if (!result.success) {
      // Check specific error messages
      const errors = result.error.flatten().fieldErrors;
      expect(errors.street).toBeDefined();
      expect(errors.city).toBeDefined();
      expect(errors.postalCode).toBeDefined();
      expect(errors.propertyType).toBeDefined();
      expect(errors.description).toBeDefined();
    }
  });

  it("should validate required fields", () => {
    const minimalListing = {
      title: "Studio Apartment",
      rent: 1200,
      street: "456 Elm St",
      city: "Kitchener",
      postalCode: "N2H 1E2",
      propertyType: "apartment",
      beds: 1,
      baths: 1,
      description: "A cozy studio apartment perfect for students."
    };

    const result = ListingSchema.safeParse(minimalListing);
    expect(result.success).toBe(true);
  });

  it("should reject invalid values", () => {
    const invalidListing = {
      title: "Studio",
      rent: -100, // Invalid: negative rent
      street: "", // Invalid: empty street
      city: "K", // Invalid: too short
      postalCode: "12", // Invalid: too short
      propertyType: "mansion", // Invalid: not in enum
      beds: -1, // Invalid: negative beds
      baths: -1, // Invalid: negative baths
      description: "Short" // Invalid: too short
    };

    const result = ListingSchema.safeParse(invalidListing);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.rent).toBeDefined();
      expect(errors.street).toBeDefined();
      expect(errors.city).toBeDefined();
      expect(errors.postalCode).toBeDefined();
      expect(errors.propertyType).toBeDefined();
      expect(errors.beds).toBeDefined();
      expect(errors.baths).toBeDefined();
      expect(errors.description).toBeDefined();
    }
  });
});
