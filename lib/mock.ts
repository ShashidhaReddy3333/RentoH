import type { Message, MessageThread, Profile, Property } from "./types";

const now = new Date();

const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

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
    createdAt: daysAgo(1)
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
    createdAt: daysAgo(2)
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
    createdAt: daysAgo(3)
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
    createdAt: daysAgo(4)
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
    createdAt: daysAgo(5)
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
    createdAt: daysAgo(6)
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
    createdAt: daysAgo(7)
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
    createdAt: daysAgo(8)
  }
];

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
    lastMessage: "Application received — let's review details.",
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
    text: "Yes please — evenings work best for me.",
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
