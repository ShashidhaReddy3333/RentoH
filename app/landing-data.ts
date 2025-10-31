// Shared static data
export const LANDING_DATA = {
  stats: [
    { label: "Quality-checked listings", value: "120+" },
    { label: "Verified owners online now", value: "65" },
    { label: "Tours scheduled this month", value: "48" }
  ],
  steps: [
    {
      title: "Filter matches faster",
      description: "Dial in price, commute, and amenities to get smart suggestions in seconds.",
      icon: "MagnifyingGlass"
    },
    {
      title: "Tour and apply in one place",
      description: "Chat with owners, lock tour times, and send applications without losing the thread.",
      icon: "ClipboardDocumentCheck"
    },
    {
      title: "Settle in confidently",
      description: "Track approvals, receive reminders, and lean on verified partners for each step.",
      icon: "Key"
    }
  ]
} as const;
