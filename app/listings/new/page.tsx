
"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Field from "@/components/form/field";
import Toggle from "@/components/form/toggle";
import Checkbox from "@/components/form/checkbox";
import { propertyTypes, useAppState } from "@/components/providers/app-provider";
import { Property } from "@/lib/mock";

const AMENITIES = ["Wi-Fi", "Parking", "Laundry", "Air Conditioning", "Heating"];
const CURRENT_LANDLORD_ID = "u2";

export default function NewListingPage() {
  const router = useRouter();
  const { createProperty } = useAppState();
  const [status, setStatus] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "",
    rent: 1800,
    address: "",
    city: "",
    postalCode: "",
    type: "apartment",
    furnished: false,
    description: "",
    amenities: [] as string[],
    availability: true
  });

  const handleAmenityToggle = (name: string, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      amenities: checked
        ? [...prev.amenities, name]
        : prev.amenities.filter((item) => item !== name)
    }));
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setImages((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return files.slice(0, 5).map((file) => URL.createObjectURL(file));
    });
  };

  useEffect(() => {
    return () => {
      images.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const property = createProperty({
      title: form.title,
      rent: Number(form.rent),
      address: form.address,
      city: form.city,
      postalCode: form.postalCode,
      type: form.type as Property["type"],
      furnished: form.furnished,
      description: form.description || "Listing description coming soon.",
      amenities: form.amenities,
      landlordId: CURRENT_LANDLORD_ID,
      images: images.length ? images : ["/img/placeholder.jpg"],
      availability: form.availability ? "available" : "unavailable",
      verified: false
    });
    setStatus("Property saved! Redirecting you to manage the listing...");
    setTimeout(() => {
      router.push(`/listings/${property.id}/manage`);
    }, 600);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-[var(--c-dark)]">Add a new property</h1>
        <p className="text-sm text-gray-600">
          Provide key details so tenants can evaluate if your property is the right fit.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="card space-y-6">
          <h2 className="text-lg font-semibold text-[var(--c-dark)]">Basics</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field id="listing-title" label="Title" required>
              <input
                id="listing-title"
                className="input"
                placeholder="Light-filled 2BR condo"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                required
              />
            </Field>
            <Field id="listing-rent" label="Rent per month ($)" required>
              <input
                id="listing-rent"
                className="input"
                type="number"
                min={500}
                value={form.rent}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, rent: Number(event.target.value) }))
                }
                required
              />
            </Field>
            <Field id="listing-address" label="Street address" required>
              <input
                id="listing-address"
                className="input"
                placeholder="123 King Street W"
                value={form.address}
                onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
                required
              />
            </Field>
            <Field id="listing-city" label="City" required>
              <input
                id="listing-city"
                className="input"
                placeholder="Waterloo"
                value={form.city}
                onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
                required
              />
            </Field>
            <Field id="listing-postal" label="Postal code" required>
              <input
                id="listing-postal"
                className="input"
                placeholder="N2L 3G1"
                value={form.postalCode}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, postalCode: event.target.value }))
                }
                required
              />
            </Field>
            <Field id="listing-type" label="Property type" required>
              <select
                id="listing-type"
                className="input"
                value={form.type}
                onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
              >
                {propertyTypes().map((type) => (
                  <option key={type} value={type}>
                    {type[0].toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Toggle
            id="listing-furnished"
            checked={form.furnished}
            onChange={(next) => setForm((prev) => ({ ...prev, furnished: next }))}
            label={form.furnished ? "Furnished" : "Unfurnished"}
          />
        </section>

        <section className="card space-y-6">
          <h2 className="text-lg font-semibold text-[var(--c-dark)]">Description & amenities</h2>
          <Field id="listing-description" label="Description">
            <textarea
              id="listing-description"
              className="input min-h-[120px]"
              placeholder="Highlight top features, proximity to transit, and what makes your property unique."
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
            />
          </Field>
          <div className="grid gap-3 md:grid-cols-2">
            {AMENITIES.map((amenity) => (
              <Checkbox
                key={amenity}
                id={`amenity-${amenity}`}
                label={amenity}
                checked={form.amenities.includes(amenity)}
                onChange={(checked) => handleAmenityToggle(amenity, checked)}
              />
            ))}
          </div>
        </section>

        <section className="card space-y-6">
          <h2 className="text-lg font-semibold text-[var(--c-dark)]">Media & availability</h2>
          <Field id="listing-images" label="Upload images (up to 5)">
            <input
              id="listing-images"
              className="input"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
            />
          </Field>
          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {images.map((src, index) => (
                <div key={index} className="aspect-video overflow-hidden rounded-lg bg-[var(--c-bg)]">
                  <div
                    className="h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${src})` }}
                  />
                </div>
              ))}
            </div>
          )}
          <Toggle
            id="listing-availability"
            checked={form.availability}
            onChange={(next) => setForm((prev) => ({ ...prev, availability: next }))}
            label={form.availability ? "Currently available" : "Temporarily unavailable"}
          />
        </section>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <span className="text-sm text-gray-500">
            You can edit listings later from your dashboard.
          </span>
          <button type="submit" className="btn btn-primary md:min-w-[160px]">
            Save listing
          </button>
        </div>
        {status && (
          <div className="rounded-lg border border-[var(--c-primary)]/40 bg-[var(--c-primary)]/5 px-4 py-3 text-sm text-[var(--c-primary)]">
            {status}
          </div>
        )}
      </form>
    </div>
  );
}
