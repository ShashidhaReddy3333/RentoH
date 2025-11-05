#!/usr/bin/env node

/**
 * Seeds the Supabase `properties` table with demo listings plus a verified landlord account.
 *
 * Usage:
 *  SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=... node scripts/seed-properties.js
 *
 * Optional overrides:
 *  SEED_LANDLORD_EMAIL, SEED_LANDLORD_PASSWORD
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const LANDLORD_EMAIL = process.env.SEED_LANDLORD_EMAIL ?? "demo-landlord@rento.test";
const LANDLORD_PASSWORD = process.env.SEED_LANDLORD_PASSWORD ?? "Rent0!Demo";

const listings = [
  {
    title: "Sunlit Loft Near King Street",
    slug: "sunlit-loft-king-street",
    description:
      "Bright corner loft with 12-foot ceilings, oversized windows, and a private balcony overlooking King Street. Perfect for remote work with fiber internet included.",
    price: 2450,
    beds: 2,
    baths: 2,
    type: "condo",
    city: "Waterloo",
    address: "215 King St S, Waterloo, ON",
    neighborhood: "Uptown Waterloo",
    amenities: ["In-suite laundry", "Underground parking", "Smart lock entry", "Fitness studio"],
    images: [
      "https://images.unsplash.com/photo-1505692794403-55b39e3b15a6?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80"
    ],
    area: 1080,
    available_from: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    pets: true,
    furnished: true,
    is_featured: true
  },
  {
    title: "Green Meadows Family Home",
    slug: "green-meadows-family-home",
    description:
      "Spacious detached family home with a fenced backyard, finished basement, and chef-inspired kitchen. Located minutes from excellent schools and parks.",
    price: 3200,
    beds: 4,
    baths: 3,
    type: "house",
    city: "Kitchener",
    address: "68 Cedarcrest Drive, Kitchener, ON",
    neighborhood: "Forest Heights",
    amenities: ["Two-car garage", "Fenced backyard", "Gas fireplace", "Dedicated office"],
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80"
    ],
    area: 2400,
    available_from: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    pets: false,
    furnished: false,
    is_featured: true
  },
  {
    title: "Downtown Designer Suite",
    slug: "downtown-designer-suite",
    description:
      "Designer-finished two bedroom suite with bespoke cabinetry, built-in storage, and an expansive kitchen island. Steps to LRT and the innovation district.",
    price: 2750,
    beds: 2,
    baths: 2,
    type: "apartment",
    city: "Waterloo",
    address: "32 Regina St N, Waterloo, ON",
    neighborhood: "Downtown Innovation District",
    amenities: ["Concierge service", "Coworking lounge", "EV chargers", "Floor-to-ceiling windows"],
    images: [
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80"
    ],
    area: 1025,
    available_from: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    pets: false,
    furnished: true,
    is_featured: false
  },
  {
    title: "Lakeview Corner Apartment",
    slug: "lakeview-corner-apartment",
    description:
      "Corner apartment overlooking the Grand River with curated furnishings, a dedicated workspace, and utilities included.",
    price: 2100,
    beds: 2,
    baths: 1,
    type: "apartment",
    city: "Cambridge",
    address: "12 Water St N, Cambridge, ON",
    neighborhood: "Galt",
    amenities: ["Rooftop terrace", "Bike storage", "Utilities included", "Pet washing station"],
    images: [
      "https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=1200&q=80"
    ],
    area: 900,
    available_from: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    pets: true,
    furnished: true,
    is_featured: false
  }
];

async function ensureLandlordUser(supabase) {
  const { data: existing } = await supabase.auth.admin.getUserByEmail(LANDLORD_EMAIL);
  if (existing?.user) {
    return existing.user.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: LANDLORD_EMAIL,
    password: LANDLORD_PASSWORD,
    email_confirm: true,
    app_metadata: { role: "landlord" },
    user_metadata: { full_name: "Demo Landlord", role: "landlord" }
  });

  if (error || !data?.user) {
    console.error("Failed to create landlord user:", error?.message ?? "unknown error");
    process.exit(1);
  }

  const landlordId = data.user.id;
  await supabase
    .from("profiles")
    .upsert({
      id: landlordId,
      email: LANDLORD_EMAIL,
      full_name: "Demo Landlord",
      role: "landlord",
      verification_status: "verified"
    })
    .eq("id", landlordId);

  return landlordId;
}

async function seed(supabase) {
  const landlordId = await ensureLandlordUser(supabase);

  const rows = listings.map((listing) => ({
    landlord_id: landlordId,
    slug: listing.slug,
    title: listing.title,
    description: listing.description,
    price: listing.price,
    beds: listing.beds,
    baths: listing.baths,
    type: listing.type,
    city: listing.city,
    address: listing.address,
    neighborhood: listing.neighborhood,
    amenities: listing.amenities,
    images: listing.images,
    area: listing.area,
    available_from: listing.available_from,
    pets: listing.pets,
    furnished: listing.furnished,
    rent_frequency: "monthly",
    status: "active",
    verified: true,
    is_featured: listing.is_featured,
    is_verified: listing.is_featured,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  const { error } = await supabase.from("properties").upsert(rows, { onConflict: "slug" });

  if (error) {
    console.error("Failed to seed properties:", error.message);
    process.exit(1);
  }

  console.log("Seed complete:");
  console.log(`- Landlord email: ${LANDLORD_EMAIL}`);
  console.log(`- Landlord password: ${LANDLORD_PASSWORD}`);
  console.log(`- Listings upserted: ${rows.length}`);
}

async function main() {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  await seed(supabase);
}

main().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
