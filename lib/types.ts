export type Coordinates = {
  lat: number;
  lng: number;
};

export type Property = {
  id: string;
  title: string;
  images: string[];
  price: number;
  beds: number;
  baths: number;
  type: "apartment" | "house" | "condo" | "townhouse";
  city: string;
  verified: boolean;
  pets: boolean;
  furnished: boolean;
  createdAt: string;
  address?: string;
  description?: string;
  amenities?: string[];
  area?: number;
  availableFrom?: string;
  neighborhood?: string;
  coordinates?: Coordinates;
  walkthroughVideoUrl?: string;
  walkScore?: number;
  transitScore?: number;
  status?: "draft" | "active" | "archived";
};

export type Message = {
  id: string;
  threadId: string;
  senderId: string;
  text: string;
  createdAt: string;
  readAt?: string | null;
};

export type MessageThread = {
  id: string;
  otherPartyName: string;
  otherPartyAvatar?: string;
  lastMessage?: string;
  unreadCount: number;
  updatedAt: string;
};

export type Profile = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  prefs: {
    budgetMin?: number;
    budgetMax?: number;
    beds?: number;
    baths?: number;
    pets?: boolean;
    furnished?: boolean;
    areas?: string[];
  };
  notifications: {
    newMatches: boolean;
    messages: boolean;
    applicationUpdates: boolean;
  };
  verificationStatus: "verified" | "pending" | "unverified";
  role?: UserRole;
};

export type PropertyFilters = {
  city?: string;
  min?: number;
  max?: number;
  beds?: number;
  baths?: number;
  type?: Property["type"];
  pets?: boolean;
  furnished?: boolean;
  verified?: boolean;
  // Additional search-oriented filters
  neighborhood?: string;
  availableFrom?: string; // ISO date string, server will interpret
  amenities?: string[];
  keywords?: string;
};

export type PropertySort = "newest" | "priceAsc" | "priceDesc";

export type PaginatedResult<TItem> = {
  items: TItem[];
  nextPage?: number;
};

export type UserRole = "tenant" | "landlord" | "admin" | "guest";

export type TourStatus = "requested" | "confirmed" | "completed" | "cancelled";

export type Tour = {
  id: string;
  propertyId: string;
  propertyTitle: string;
  scheduledAt: string;
  city?: string;
  status: TourStatus;
};

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "reviewing"
  | "interview"
  | "approved"
  | "rejected";

export type ApplicationSummary = {
  id: string;
  propertyId: string;
  applicantId: string;
  applicantName: string;
  propertyTitle: string;
  status: ApplicationStatus;
  submittedAt: string;
};

