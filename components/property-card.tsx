import Link from "next/link";
import BadgeVerified from "./badge-verified";
import { Property } from "@/lib/mock";

type CardVariant = "default" | "plain";

type PropertyCardProps = {
  property: Property;
  onSave?: (id: string) => void;
  saved?: boolean;
  className?: string;
  variant?: CardVariant;
};

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export default function PropertyCard({
  property,
  onSave,
  saved,
  className,
  variant = "default"
}: PropertyCardProps) {
  const primaryImage = property.images[0];
  return (
    <article
      className={cn(
        "flex flex-col gap-3",
        variant === "default"
          ? "card"
          : "rounded-xl border border-gray-200 bg-white p-4 shadow-soft",
        className
      )}
    >
      <div className="relative aspect-video overflow-hidden rounded-lg bg-[var(--c-bg)]">
        {primaryImage ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${primaryImage})` }}
            role="img"
            aria-label={`${property.title} photo`}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
            Image coming soon
          </div>
        )}
        <div className="absolute top-3 left-3">{property.verified && <BadgeVerified />}</div>
        <button
          type="button"
          onClick={() => onSave?.(property.id)}
          className={cn(
            "absolute top-3 right-3 rounded-full bg-white/90 px-3 py-1 text-sm font-medium shadow-soft transition hover:bg-white",
            saved ? "text-[var(--c-primary)]" : "text-gray-600"
          )}
          aria-pressed={saved}
        >
          {saved ? "\u2665 Saved" : "\u2661 Save"}
        </button>
      </div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-[var(--c-dark)]">{property.title}</h3>
          <p className="text-sm text-gray-600">
            {property.city} - ${property.rent}/mo
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link href={`/listings/${property.id}`} className="btn btn-secondary flex-1">
          View details
        </Link>
        <Link href="/messages" className="btn flex-1">
          Message
        </Link>
      </div>
    </article>
  );
}
