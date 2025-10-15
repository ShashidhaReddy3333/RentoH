"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

import Checkbox from "@/components/form/checkbox";
import Toggle from "@/components/form/toggle";
import ImageCarousel from "@/components/image-carousel";
import { useAppState } from "@/components/providers/app-provider";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Property } from "@/lib/mock";

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
  }, [property]);

  if (!property) {
    return (
      <Card className="border-2 border-dashed border-black/10 text-center text-textc/70 dark:border-white/10">
        <CardContent>
          This listing no longer exists. Return to your dashboard to manage other properties.
        </CardContent>
      </Card>
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
          <h1 className="text-3xl font-semibold text-textc">Manage listing</h1>
          <p className="text-sm text-textc/70">
            Preview what tenants see and update details without leaving this page.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className={buttonStyles({ variant: "outline" })}
            onClick={() => setEditMode((prev) => !prev)}
          >
            {editMode ? "Close edit" : "Edit details"}
          </button>
          <button type="button" className={buttonStyles({ variant: "ghost" })} onClick={handleDelete}>
            Delete listing
          </button>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4">
              <ImageCarousel images={property.images} title={property.title} />
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-textc">{property.title}</h2>
                  <p className="text-sm text-textc/70">
                    ${property.rent}/mo · {property.city}
                  </p>
                </div>
                <span className="rounded-full bg-brand.primary/10 px-4 py-1 text-sm font-medium text-brand.primary">
                  {property.availability === "available" ? "Published" : "Hidden"}
                </span>
              </div>
              <p className="text-sm text-textc/70">
                {property.description || "No description provided yet."}
              </p>
              <div>
                <h3 className="text-sm font-semibold text-textc">Amenities</h3>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-textc/70">
                  {property.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="rounded-full border border-black/10 px-3 py-1 dark:border-white/10"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
              <button type="button" className={`${buttonStyles({ variant: "outline" })} w-full`}>
                View public page
              </button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="space-y-4">
            <h2 className="text-lg font-semibold text-textc">Performance snapshot</h2>
            <ul className="space-y-2 text-sm text-textc/70">
              <li>📈 124 views in the past 30 days</li>
              <li>💬 9 new inquiries this week</li>
              <li>⚡ Response rate: 95%</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {editMode ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardContent className="space-y-6">
              <h2 className="text-lg font-semibold text-textc">Edit details</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-textc">
                  Title
                  <input
                    className="input"
                    value={form.title}
                    onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-textc">
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
              <label className="flex flex-col gap-2 text-sm font-medium text-textc">
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
                <button type="submit" className={buttonStyles({ variant: "primary" })}>
                  Save changes
                </button>
                <button
                  type="button"
                  className={buttonStyles({ variant: "ghost" })}
                  onClick={() => setEditMode(false)}
                >
                  Cancel
                </button>
              </div>
            </CardContent>
          </Card>
        </form>
      ) : null}

      {status ? (
        <div className="rounded-lg border border-brand.primary/40 bg-brand.primary/5 px-4 py-3 text-sm text-brand.primary">
          {status}
        </div>
      ) : null}
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
