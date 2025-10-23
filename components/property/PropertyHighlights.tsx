import { ShieldCheckIcon, HeartIcon, SparklesIcon } from "@heroicons/react/24/solid";

import type { Property } from "@/lib/types";

type PropertyHighlightsProps = {
  property: Property;
};

export function PropertyHighlights({ property }: PropertyHighlightsProps) {
  const highlights: Array<{ label: string; icon: JSX.Element }> = [];

  if (property.verified) {
    highlights.push({
      label: "Verified listing",
      icon: <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
    });
  }

  if (property.pets) {
    highlights.push({
      label: "Pet friendly",
      icon: <HeartIcon className="h-4 w-4" aria-hidden="true" />
    });
  }

  if (property.furnished) {
    highlights.push({
      label: "Furnished",
      icon: <SparklesIcon className="h-4 w-4" aria-hidden="true" />
    });
  }

  if (highlights.length === 0) {
    return null;
  }

  return (
    <section aria-label="Listing highlights" className="flex flex-wrap gap-3">
      {highlights.map((highlight) => (
        <span
          key={highlight.label}
          className="inline-flex items-center gap-2 rounded-full bg-brand-teal/10 px-4 py-2 text-sm font-semibold text-brand-teal"
        >
          {highlight.icon}
          {highlight.label}
        </span>
      ))}
    </section>
  );
}
