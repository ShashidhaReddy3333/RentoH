export type PropertyType =
  | "apartment"
  | "house"
  | "condo"
  | "townhouse"
  | "duplex"
  | "studio";

export type Amenity =
  | "parking"
  | "pet_friendly"
  | "in_unit_laundry"
  | "air_conditioning";

export type SearchFilters = {
  location?: string;
  priceMin?: number;
  priceMax?: number;
  bedroomsMin?: number;
  bathroomsMin?: number;
  propertyTypes?: PropertyType[];
  amenities?: Amenity[];
  // Bounding box for map viewport queries
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
};

export type SearchFilterKey = keyof SearchFilters;

export const amenityLabels: Record<Amenity, string> = {
  parking: "Parking",
  pet_friendly: "Pet-Friendly",
  in_unit_laundry: "In-unit Laundry",
  air_conditioning: "Air Conditioning"
};

export const supportedPropertyTypes: PropertyType[] = [
  "apartment",
  "house",
  "condo",
  "townhouse",
  "duplex",
  "studio"
];

export type ListingSummary = {
  slug: string;
  latitude: number | null;
  longitude: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  property_type: PropertyType | null;
  square_feet: number | null;
  amenities: Amenity[] | null;
  thumbnail_url: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  rent: number;
  title: string;
  address: string | null;
  neighborhood: string | null;
  landlord_id: string | null;
  id: string;
};

export type SearchResult = {
  items: ListingSummary[];
  total: number;
  hasMore: boolean;
};
