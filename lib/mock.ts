export type PropertyType = "apartment" | "house" | "studio";

export type Property = {
  id: string;
  title: string;
  address?: string;
  city: string;
  postalCode: string;
  type: PropertyType;
  furnished: boolean;
  rent: number;
  images: string[];
  verified: boolean;
  landlordId: string;
  amenities: string[];
  description: string;
  availability: "available" | "unavailable";
};

export type UserRole = "tenant" | "landlord" | "admin";

export type User = {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  verified?: boolean;
  email?: string;
};

export type Message = {
  id: string;
  propertyId: string;
  senderId: string;
  recipientId: string;
  body: string;
  createdAt: string;
};

export const properties: Property[] = [
  {
    id: "p1",
    title: "Sunny Apartment",
    city: "Waterloo",
    address: "12 King Street W",
    postalCode: "N2L 3G1",
    type: "apartment",
    furnished: true,
    rent: 1800,
    images: ["/img/1.jpg", "/img/1b.jpg", "/img/1c.jpg"],
    verified: true,
    landlordId: "u2",
    amenities: ["Wi-Fi", "Parking", "Laundry"],
    description:
      "Bright south-facing apartment close to the LRT, with updated kitchen and in-unit laundry.",
    availability: "available"
  },
  {
    id: "p2",
    title: "Modern Studio",
    city: "Kitchener",
    address: "410 Queen Street S",
    postalCode: "N2G 1A1",
    type: "studio",
    furnished: false,
    rent: 1450,
    images: ["/img/2.jpg", "/img/2b.jpg"],
    verified: false,
    landlordId: "u2",
    amenities: ["Wi-Fi", "Gym Access"],
    description:
      "Efficient studio with floor-to-ceiling windows, perfect for young professionals.",
    availability: "available"
  },
  {
    id: "p3",
    title: "Family Home",
    city: "Cambridge",
    address: "78 River Drive",
    postalCode: "N1P 1A5",
    type: "house",
    furnished: true,
    rent: 2350,
    images: ["/img/3.jpg", "/img/3b.jpg", "/img/3c.jpg"],
    verified: true,
    landlordId: "u3",
    amenities: ["Parking", "Backyard", "Air Conditioning"],
    description:
      "Spacious 3-bedroom home with finished basement, large backyard, and double garage.",
    availability: "available"
  },
  {
    id: "p4",
    title: "Downtown Loft",
    city: "Waterloo",
    address: "22 Bridgeport Road",
    postalCode: "N2J 2H1",
    type: "apartment",
    furnished: false,
    rent: 2100,
    images: ["/img/4.jpg", "/img/4b.jpg"],
    verified: true,
    landlordId: "u4",
    amenities: ["Wi-Fi", "Parking", "Gym Access"],
    description:
      "Industrial loft with exposed brick, 12ft ceilings, and secure parking spot.",
    availability: "unavailable"
  }
];

export const users: User[] = [
  {
    id: "u1",
    name: "Tina Evans",
    role: "tenant",
    avatar: "/img/avatars/tenant1.png",
    verified: true,
    email: "tina@example.com"
  },
  {
    id: "u2",
    name: "Leo Bridges",
    role: "landlord",
    avatar: "/img/avatars/landlord1.png",
    verified: true,
    email: "leo@example.com"
  },
  {
    id: "u3",
    name: "Priya Kapoor",
    role: "landlord",
    avatar: "/img/avatars/landlord2.png",
    verified: false,
    email: "priya@example.com"
  },
  {
    id: "u4",
    name: "Admin Rento",
    role: "admin",
    avatar: "/img/avatars/admin.png",
    verified: true,
    email: "admin@rento.io"
  }
];

export const messages: Message[] = [
  {
    id: "m1",
    propertyId: "p1",
    senderId: "u1",
    recipientId: "u2",
    body: "Hi Leo, is the apartment available for a July 1st move-in?",
    createdAt: new Date().toISOString()
  },
  {
    id: "m2",
    propertyId: "p1",
    senderId: "u2",
    recipientId: "u1",
    body: "Hi Tina! Yes, it's still available. Would you like to schedule a viewing?",
    createdAt: new Date().toISOString()
  },
  {
    id: "m3",
    propertyId: "p3",
    senderId: "u1",
    recipientId: "u3",
    body: "Can you tell me more about the neighborhood schools?",
    createdAt: new Date().toISOString()
  }
];

export type PropertyFilter = {
  city?: string;
  postalCode?: string;
  type?: PropertyType;
  min?: number;
  max?: number;
  furnished?: boolean;
};

export function filterProperties(all: Property[], q: PropertyFilter): Property[] {
  const city = q.city?.trim().toLowerCase();
  const postal = q.postalCode?.trim().toLowerCase();
  return all.filter((p) => {
    const matchesCity =
      !city ||
      p.city.toLowerCase().includes(city) ||
      p.postalCode.toLowerCase().includes(city);
    const matchesPostal = !postal || p.postalCode.toLowerCase().includes(postal);
    const matchesType = !q.type || p.type === q.type;
    const matchesMin = q.min == null || p.rent >= q.min;
    const matchesMax = q.max == null || p.rent <= q.max;
    const matchesFurnished =
      q.furnished == null ? true : p.furnished === q.furnished;
    return (
      matchesCity &&
      matchesPostal &&
      matchesType &&
      matchesMin &&
      matchesMax &&
      matchesFurnished
    );
  });
}

export function landlordProperties(
  landlordId: string,
  list: Property[]
): Property[] {
  return list.filter((p) => p.landlordId === landlordId);
}

export function getPropertyById(list: Property[], id: string): Property | undefined {
  return list.find((p) => p.id === id);
}

export function getUserById(list: User[], id: string): User | undefined {
  return list.find((u) => u.id === id);
}
