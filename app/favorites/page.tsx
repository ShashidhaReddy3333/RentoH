"use client";

import { useMemo, useState } from "react";

import Toggle from "@/components/form/toggle";
import { useAppState } from "@/components/providers/app-provider";
import PropertyCard from "@/components/property-card";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function FavoritesPage() {
  const { properties, favorites, toggleFavorite } = useAppState();
  const [compareMode, setCompareMode] = useState(false);

  const savedProperties = useMemo(
    () => properties.filter((property) => favorites.includes(property.id)),
    [properties, favorites]
  );

  const comparePair = savedProperties.slice(0, 2);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-textc">Saved properties</h1>
          <p className="text-sm text-textc/70">
            Shortlist homes you love and compare them side-by-side to decide faster.
          </p>
        </div>
        <Toggle
          id="compare-toggle"
          checked={compareMode}
          onChange={setCompareMode}
          label={compareMode ? "Compare mode" : "View grid"}
        />
      </header>

      {!savedProperties.length ? (
        <Card className="border-2 border-dashed border-black/10 text-center text-textc/70 dark:border-white/10">
          <CardContent className="space-y-2">
            <p>
              You have not saved any properties yet. Explore listings and select &ldquo;Save&rdquo;
              to build your shortlist.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {compareMode && comparePair.length >= 2 ? (
        <section className="grid gap-6 md:grid-cols-2">
          {comparePair.map((property) => (
            <Card key={property.id}>
              <CardContent className="space-y-4">
                <header className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-textc">{property.title}</h2>
                    <p className="text-sm text-textc/70">
                      {property.city} - ${property.rent}/mo
                    </p>
                  </div>
                  <button
                    type="button"
                    className={buttonStyles({ variant: "ghost", size: "sm" })}
                    onClick={() => toggleFavorite(property.id)}
                  >
                    Remove
                  </button>
                </header>
                <ul className="space-y-2 text-sm text-textc/70">
                  <li>Type: {property.type}</li>
                  <li>Furnishing: {property.furnished ? "Furnished" : "Unfurnished"}</li>
                  <li>Amenities: {property.amenities.join(", ") || "None listed"}</li>
                </ul>
              </CardContent>
            </Card>
          ))}
        </section>
      ) : (
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {savedProperties.map((property) => (
            <PropertyCard key={property.id} property={property} onSave={toggleFavorite} saved />
          ))}
        </section>
      )}
    </div>
  );
}
