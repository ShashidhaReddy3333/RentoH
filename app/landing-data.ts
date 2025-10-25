// Shared static data
export const LANDING_DATA = {
  stats: [
    { label: "Verified listings", value: "120+" },
    { label: "Active landlords", value: "65" },
    { label: "Tours booked this month", value: "48" }
  ],
  steps: [
    {
      title: "Browse verified homes",
      description: "Use filters to match by price, neighbourhood, amenities, and pet policies.",
      icon: "MagnifyingGlass"
    },
    {
      title: "Book tours & apply",
      description: "Message landlords instantly, schedule tours, and submit applications in-app.",
      icon: "ClipboardDocumentCheck"
    },
    {
      title: "Move in with support",
      description: "Track applications, receive updates, and stay secure with verified partners.",
      icon: "Key"
    }
  ]
} as const;