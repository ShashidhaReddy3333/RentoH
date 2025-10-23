export type Property = {
  id: string;
  title: string;
  images: string[];
  price: number;
  beds: number;
  baths: number;
  type: "apartment" | "house" | "condo";
  city: string;
  verified: boolean;
  pets: boolean;
  furnished: boolean;
  createdAt: string;
};

export type Message = {
  id: string;
  threadId: string;
  senderId: string;
  text: string;
  createdAt: string;
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
};

export type PropertySort = "newest" | "priceAsc" | "priceDesc";

export type PaginatedResult<TItem> = {
  items: TItem[];
  nextPage?: number;
};

export type UserRole = "tenant" | "landlord" | "guest";
