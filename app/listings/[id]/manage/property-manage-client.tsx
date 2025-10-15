"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ImageCarousel from "@/components/image-carousel";
import Toggle from "@/components/form/toggle";
import Checkbox from "@/components/form/checkbox";
import { useAppState } from "@/components/providers/app-provider";
import { Property } from "@/lib/mock";

const AMENITIES = ["Wi-Fi", "Parking", "Laundry", "Air Conditioning", "Heating"];

type ManageListingClientProps = {
  id: string;
};

export default function ManageListingClient({ id }: ManageListingClientProps) {
  const router = useRouter();
  const { getProperty, updateProperty, deleteProperty } = useAppState();
  const property = getProperty(id);
  const [editMode, setEditMode] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [form, setForm] = useState(() => getInitialState(property));

  useEffect(() => {
    setForm(getInitialState(property));
  }, [property?.id]);

  if (!property) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">
        This listing no longer exists. Return to your dashboard to manage other properties.
      </div>
    );
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    updateProperty(property.id, {
      title: form.title,
      rent: form.rent,
      description: form.description,
      amenities: form.amenities,
      availability: form.availability ? "available" : "unavailable",
      furnished: form.furnished
    });
    setStatus("Your changes have been saved.");
    setEditMode(false);
  };

  const handleDelete = () => {
    deleteProperty(property.id);
    router.replace("/dashboard");
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--c-dark)]">Manage listing</h1>
          <p className="text-sm text-gray-600">
            Preview what tenants see and update details without leaving this page.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn btn-secondary" onClick={() => setEditMode((prev) => !prev)}>
            {editMode ? "Close edit" : "Edit details"}
          </button>
          <button type="button" className="btn" onClick={handleDelete}>
            Delete listing
          </button>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <div className="card space-y-4">
            <ImageCarousel images={property.images} title={property.title} />
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-[var(--c-dark)]">{property.title}</h2>
                <p className="text-sm text-gray-600">
                  ${property.rent}/mo · {property.city}
                </p>
              </div>
              <span className="rounded-full bg-[var(--c-primary)]/10 px-4 py-1 text-sm font-medium text-[var(--c-primary)]">
                {property.availability === "available" ? "Published" : "Hidden"}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {property.description || "No description provided yet."}
            </p>
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Amenities</h3>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                {property.amenities.map((amenity) => (
                  <span key={amenity} className="rounded-full border border-gray-200 px-3 py-1">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
            <button type="button" className="btn btn-secondary w-full">
              View public page
            </button>
          </div>
        </div>

        <aside className="card space-y-4">
          <h2 className="text-lg font-semibold text-[var(--c-dark)]">Performance snapshot</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>👀 124 views in the past 30 days</li>
            <li>💬 9 new inquiries this week</li>
            <li>⭐ Response rate: 95%</li>
          </ul>
        </aside>
      </section>

      {editMode && (
        <form onSubmit={handleSubmit} className="card space-y-6">
          <h2 className="text-lg font-semibold text-[var(--c-dark)]">Edit details</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
              Title
              <input
                className="input"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
              Monthly rent
              <input
                className="input"
                type="number"
                min={500}
                value={form.rent}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, rent: Number(event.target.value) }))
                }
              />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
            Description
            <textarea
              className="input min-h-[140px]"
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
            />
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            {AMENITIES.map((amenity) => (
              <Checkbox
                key={amenity}
                id={`edit-${amenity}`}
                label={amenity}
                checked={form.amenities.includes(amenity)}
                onChange={(checked) => {
                  setForm((prev) => ({
                    ...prev,
                    amenities: checked
                      ? [...prev.amenities, amenity]
                      : prev.amenities.filter((item) => item !== amenity)
                  }));
                }}
              />
            ))}
          </div>
          <Toggle
            id="edit-availability"
            checked={form.availability}
            onChange={(next) => setForm((prev) => ({ ...prev, availability: next }))}
            label={form.availability ? "Available" : "Unavailable"}
          />
          <Toggle
            id="edit-furnished"
            checked={form.furnished}
            onChange={(next) => setForm((prev) => ({ ...prev, furnished: next }))}
            label={form.furnished ? "Furnished" : "Unfurnished"}
          />
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary">
              Save changes
            </button>
            <button type="button" className="btn" onClick={() => setEditMode(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {status && (
        <div className="rounded-lg border border-[var(--c-primary)]/40 bg-[var(--c-primary)]/5 px-4 py-3 text-sm text-[var(--c-primary)]">
          {status}
        </div>
      )}
    </div>
  );
}

function getInitialState(property: Property | undefined) {
  if (!property) {
    return {
      title: "",
      rent: 0,
      description: "",
      amenities: [] as string[],
      availability: true,
      furnished: false
    };
  }
  return {
    title: property.title,
    rent: property.rent,
    description: property.description,
    amenities: property.amenities,
    availability: property.availability === "available",
    furnished: property.furnished
  };
}
