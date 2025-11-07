import type { Message, MessageThread, Profile, Property } from "./types";

const now = new Date();

const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
const daysFromNow = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

export const mockProperties: Property[] = [
  {
    id: "prop_royal-loft",
    title: "Sunlit Loft near King Street",
    images: ["/images/listings/loft-1.jpg", "/images/listings/loft-1b.jpg"],
    price: 2450,
    beds: 2,
    baths: 2,
    type: "condo",
    city: "Waterloo",
    verified: true,
    pets: true,
    furnished: true,
    createdAt: daysAgo(1),
    address: "215 King St S, Waterloo, ON",
    neighborhood: "Uptown Waterloo",
    description:
      "Bright two-bedroom corner unit with 12 foot ceilings, floor-to-ceiling windows, and a private balcony facing King Street. Ideal for remote work with dedicated fibre internet.",
    amenities: [
      "In-suite laundry",
      "Underground parking",
      "Private balcony",
      "Secure smart entry",
      "Fitness centre access"
    ],
    area: 1080,
    availableFrom: daysFromNow(14),
    coordinates: { lat: 43.464259, lng: -80.52041 },
    walkScore: 88,
    transitScore: 72,
    walkthroughVideoUrl: "https://www.youtube.com/watch?v=ysz5S6PUM-U"
  },
  {
    id: "prop_green-meadows",
    title: "Green Meadows Family Home",
    images: ["/images/listings/home-1.jpg", "/images/listings/home-1b.jpg"],
    price: 3200,
    beds: 4,
    baths: 3,
    type: "house",
    city: "Kitchener",
    verified: true,
    pets: false,
    furnished: false,
    createdAt: daysAgo(2),
    address: "68 Cedarcrest Drive, Kitchener, ON",
    neighborhood: "Forest Heights",
    description:
      "Spacious detached family home with a fenced backyard, finished basement, and a chef's kitchen featuring quartz counters and a walk-in pantry.",
    amenities: [
      "Two-car garage",
      "Fenced backyard",
      "Gas fireplace",
      "Dedicated home office",
      "Smart thermostat"
    ],
    area: 2400,
    availableFrom: daysFromNow(30),
    coordinates: { lat: 43.427312, lng: -80.518901 },
    walkScore: 61,
    transitScore: 54
  },
  {
    id: "prop_lakeview",
    title: "Lakeview Corner Apartment",
    images: ["/images/listings/apartment-1.jpg"],
    price: 2100,
    beds: 2,
    baths: 1,
    type: "apartment",
    city: "Cambridge",
    verified: false,
    pets: true,
    furnished: true,
    createdAt: daysAgo(3),
    address: "12 Water St N, Cambridge, ON",
    neighborhood: "Galt",
    description:
      "Corner apartment overlooking the Grand River with curated furnishings, a dedicated workspace, and inclusive utilities.",
    amenities: [
      "Rooftop terrace",
      "Bike storage",
      "Utilities included",
      "Dedicated workspace",
      "Pet washing station"
    ],
    area: 900,
    availableFrom: daysFromNow(10),
    coordinates: { lat: 43.360081, lng: -80.312699 },
    walkScore: 82,
    transitScore: 58
  },
  {
    id: "prop_downtown-suite",
    title: "Downtown Designer Suite",
    images: ["/images/listings/apartment-2.jpg"],
    price: 2750,
    beds: 2,
    baths: 2,
    type: "apartment",
    city: "Waterloo",
    verified: true,
    pets: false,
    furnished: true,
    createdAt: daysAgo(4),
    address: "32 Regina St N, Waterloo, ON",
    neighborhood: "Downtown Innovation District",
    description:
      "Designer-finished suite with bespoke cabinetry, built-in storage, and an expansive kitchen island. Steps from the LRT and innovation hub.",
    amenities: [
      "Concierge service",
      "Coworking lounge",
      "Electric vehicle chargers",
      "Floor-to-ceiling windows",
      "Quartz waterfall island"
    ],
    area: 1025,
    availableFrom: daysFromNow(21),
    coordinates: { lat: 43.467023, lng: -80.522873 },
    walkScore: 91,
    transitScore: 78
  },
  {
    id: "prop_riverwalk",
    title: "Riverwalk Modern Condo",
    images: ["/images/listings/condo-1.jpg"],
    price: 2350,
    beds: 1,
    baths: 1,
    type: "condo",
    city: "Kitchener",
    verified: false,
    pets: true,
    furnished: false,
    createdAt: daysAgo(5),
    address: "155 Riverwalk Place, Kitchener, ON",
    neighborhood: "Victoria Park",
    description:
      "Modern one-bedroom with 10 foot ceilings, exposed concrete accents, and panoramic city views from the 18th floor.",
    amenities: [
      "24 hour concierge",
      "Outdoor pool",
      "Guest suites",
      "Party room",
      "Yoga studio"
    ],
    area: 760,
    availableFrom: daysFromNow(45),
    coordinates: { lat: 43.44681, lng: -80.49691 },
    walkScore: 84,
    transitScore: 70
  },
  {
    id: "prop_southridge",
    title: "Southridge Garden Home",
    images: ["/images/listings/home-2.jpg"],
    price: 2950,
    beds: 3,
    baths: 2,
    type: "house",
    city: "Guelph",
    verified: true,
    pets: true,
    furnished: false,
    createdAt: daysAgo(6),
    address: "109 Southridge Drive, Guelph, ON",
    neighborhood: "Westminster Woods",
    description:
      "Bright garden home with a sunroom, landscaped backyard, and updated kitchen featuring stainless steel appliances and butcher-block counters.",
    amenities: [
      "Heated sunroom",
      "Two-tier deck",
      "Primary ensuite",
      "Finished basement",
      "Community trails access"
    ],
    area: 1950,
    availableFrom: daysFromNow(18),
    coordinates: { lat: 43.500732, lng: -80.189741 },
    walkScore: 52,
    transitScore: 46
  },
  {
    id: "prop_midtown",
    title: "Midtown Studio with Balcony",
    images: ["/images/listings/studio-1.jpg"],
    price: 1850,
    beds: 1,
    baths: 1,
    type: "apartment",
    city: "Waterloo",
    verified: false,
    pets: false,
    furnished: true,
    createdAt: daysAgo(7),
    address: "91 Bridgeport Rd E, Waterloo, ON",
    neighborhood: "Midtown",
    description:
      "Thoughtfully planned studio with custom Murphy bed, integrated storage, and a sunset-facing balcony.",
    amenities: [
      "Furnished with Murphy bed",
      "Heated floors",
      "Bike locker",
      "Shared rooftop patio",
      "Secure mail room"
    ],
    area: 540,
    availableFrom: daysFromNow(7),
    coordinates: { lat: 43.472137, lng: -80.529501 },
    walkScore: 87,
    transitScore: 69
  },
  {
    id: "prop_townhouse",
    title: "Townhouse Steps from LRT",
    images: ["/images/listings/townhouse-1.jpg"],
    price: 2650,
    beds: 3,
    baths: 2,
    type: "house",
    city: "Waterloo",
    verified: true,
    pets: true,
    furnished: false,
    createdAt: daysAgo(8),
    address: "12 Allen St E, Waterloo, ON",
    neighborhood: "Central Waterloo",
    description:
      "Three-bedroom townhouse with private rooftop terrace, main-floor powder room, and two parking spots. One block from the LRT stop.",
    amenities: [
      "Private rooftop terrace",
      "Two parking spots",
      "Main floor powder room",
      "Energy efficient appliances",
      "Lockable bike storage"
    ],
    area: 1680,
    availableFrom: daysFromNow(12),
    coordinates: { lat: 43.47293, lng: -80.52114 },
    walkScore: 93,
    transitScore: 82
  }
];

mockProperties.forEach((property, index) => {
  if (!property.landlordId) {
    property.landlordId = `mock-landlord-${index + 1}`;
  }
});

export let mockThreads: MessageThread[] = [
  {
    id: "thread_leo",
    otherPartyName: "Leo Bridges",
    otherPartyAvatar: "/images/avatars/leo.png",
    lastMessage: "Looking forward to meeting you for the tour!",
    unreadCount: 1,
    updatedAt: hoursAgo(2)
  },
  {
    id: "thread_priya",
    otherPartyName: "Priya Kapoor",
    otherPartyAvatar: "/images/avatars/priya.png",
    lastMessage: "Application received - let's review details.",
    unreadCount: 0,
    updatedAt: hoursAgo(8)
  },
  {
    id: "thread_hailey",
    otherPartyName: "Hailey Chen",
    otherPartyAvatar: "/images/avatars/hailey.png",
    lastMessage: "Can we confirm the move-in date?",
    unreadCount: 0,
    updatedAt: hoursAgo(28)
  }
];

export let mockMessages: Message[] = [
  {
    id: "msg_001",
    threadId: "thread_leo",
    senderId: "user_current",
    text: "Hi Leo! Thanks for sharing the listing. Is the unit still available?",
    createdAt: hoursAgo(30)
  },
  {
    id: "msg_002",
    threadId: "thread_leo",
    senderId: "user_leo",
    text: "Absolutely! We have an opening July 15. Would you like to tour?",
    createdAt: hoursAgo(26)
  },
  {
    id: "msg_003",
    threadId: "thread_leo",
    senderId: "user_current",
    text: "Yes please - evenings work best for me.",
    createdAt: hoursAgo(25)
  },
  {
    id: "msg_004",
    threadId: "thread_leo",
    senderId: "user_leo",
    text: "Perfect, let's meet Thursday at 6pm.",
    createdAt: hoursAgo(2)
  },
  {
    id: "msg_005",
    threadId: "thread_priya",
    senderId: "user_priya",
    text: "Thanks for submitting your application!",
    createdAt: hoursAgo(16)
  },
  {
    id: "msg_006",
    threadId: "thread_priya",
    senderId: "user_current",
    text: "Great, let me know if you need anything else from me.",
    createdAt: hoursAgo(12)
  },
  {
    id: "msg_007",
    threadId: "thread_hailey",
    senderId: "user_current",
    text: "Hi Hailey, can we keep the August 1 date?",
    createdAt: hoursAgo(54)
  },
  {
    id: "msg_008",
    threadId: "thread_hailey",
    senderId: "user_hailey",
    text: "Yes that works, just bring ID for the tour.",
    createdAt: hoursAgo(50)
  }
];

export let mockProfile: Profile = {
  id: "user_current",
  name: "Tina Evans",
  email: "tina.evans@example.com",
  phone: "+1 (519) 555-7421",
  avatarUrl: "/images/avatars/tina.png",
  prefs: {
    budgetMin: 1800,
    budgetMax: 2500,
    beds: 2,
    baths: 1,
    pets: true,
    furnished: true,
    areas: ["Waterloo", "Downtown Kitchener"]
  },
  notifications: {
    newMatches: true,
    messages: true,
    applicationUpdates: false
  },
  verificationStatus: "verified"
};

export const mockCurrentUser = {
  id: mockProfile.id,
  role: "tenant" as const
};

export function addMockProperty(property: Property) {
  mockProperties.unshift(property);
  if (mockProperties.length > 50) {
    mockProperties.length = 50;
  }
}

export function updateMockProperty(id: string, updater: (property: Property) => Property) {
  const index = mockProperties.findIndex((property) => property.id === id);
  if (index === -1) return;
  const current = mockProperties[index];
  if (!current) return;
  mockProperties[index] = updater(current);
}

export function removeMockProperty(id: string) {
  const index = mockProperties.findIndex((property) => property.id === id);
  if (index === -1) return;
  mockProperties.splice(index, 1);
}

export function appendMockMessage(message: Message) {
  mockMessages = [...mockMessages, message];
}

export function updateMockThread(threadId: string, updater: (thread: MessageThread) => MessageThread) {
  mockThreads = mockThreads.map((thread) => (thread.id === threadId ? updater(thread) : thread));
}

export function setMockProfile(nextProfile: Profile) {
  mockProfile = nextProfile;
}

export function addMockThread(thread: MessageThread) {
  const exists = mockThreads.some((item) => item.id === thread.id);
  if (exists) return;
  mockThreads = [...mockThreads, thread];
}
