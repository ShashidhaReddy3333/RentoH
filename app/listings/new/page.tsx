"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import Checkbox from "@/components/form/checkbox";
import Field from "@/components/form/field";
import Toggle from "@/components/form/toggle";
import { useAppState, propertyTypes } from "@/components/providers/app-provider";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Property } from "@/lib/mock";

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
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImages((prev) => [...prev, url]);
  };

  useEffect(() => () => images.forEach((src) => URL.revokeObjectURL(src)), [images]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const property: Property = createProperty({
      title: form.title,
      rent: form.rent,
      address: form.address,
      city: form.city,
      postalCode: form.postalCode,
      type: form.type as Property["type"],
      furnished: form.furnished,
      description: form.description,
      amenities: form.amenities,
      images,
      landlordId: CURRENT_LANDLORD_ID,
      availability: form.availability ? "available" : "unavailable"
    });
    setStatus("Property saved! Redirecting you to manage the listing...");
    setTimeout(() => {
      router.push(`/listings/${property.id}/manage`);
    }, 600);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 text-textc">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-textc">Add a new property</h1>
        <p className="text-sm text-textc/70">
          Provide key details so tenants can evaluate if your property is the right fit.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardContent className="space-y-6">
            <h2 className="text-lg font-semibold text-textc">Basics</h2>
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
                      {type.charAt(0).toUpperCase() + type.slice(1)}
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
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-6">
            <h2 className="text-lg font-semibold text-textc">Description & amenities</h2>
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
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-6">
            <h2 className="text-lg font-semibold text-textc">Media & availability</h2>
            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <Field id="listing-images" label="Upload image">
                <input
                  id="listing-images"
                  className="input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </Field>
              <Toggle
                id="listing-availability"
                checked={form.availability}
                onChange={(next) => setForm((prev) => ({ ...prev, availability: next }))}
                label={form.availability ? "Available now" : "Waitlist"}
              />
            </div>
            <div className="flex flex-wrap gap-4">
              {images.map((src, index) => (
                <div key={index} className="relative aspect-video w-40 overflow-hidden rounded-lg bg-surface-muted">
                  <Image
                src={src}
                alt={`Upload ${index + 1}`}
                fill
                unoptimized
                sizes="160px"
                className="object-cover"
              />
                </div>
              ))}
              {!images.length ? (
                <div className="h-24 flex items-center justify-center rounded-xl border border-dashed border-black/10 bg-surface-muted px-6 text-sm text-textc/60 dark:border-white/20">
                  No images yet
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-textc/60">
            You can edit listings later from your dashboard.
          </span>
          <button
            type="submit"
            className={`${buttonStyles({ variant: "primary", size: "lg" })} md:min-w-[160px]`}
          >
            Save listing
          </button>
        </div>

        {status ? (
          <div className="rounded-lg border border-brand-primary/40 bg-brand-primary/5 px-4 py-3 text-sm text-brand-primary">
            {status}
          </div>
        ) : null}
      </form>
    </div>
  );
}
