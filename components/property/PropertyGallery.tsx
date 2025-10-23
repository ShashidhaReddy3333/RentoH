import { ImageWithSkeleton } from "@/components/ui/image-with-skeleton";

type PropertyGalleryProps = {
  images: string[];
  title: string;
};

export function PropertyGallery({ images, title }: PropertyGalleryProps) {
  if (!images.length) {
    return (
      <div className="flex aspect-[16/9] w-full items-center justify-center rounded-3xl border border-black/5 bg-surface text-sm text-text-muted shadow-soft">
        Listing media coming soon
      </div>
    );
  }

  const primaryImage = images[0]!;
  const rest = images.slice(1);

  return (
    <section aria-label="Property gallery" className="grid gap-3 lg:grid-cols-[2fr_1fr]">
      <figure className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-surface shadow-soft">
        <ImageWithSkeleton
          src={primaryImage}
          alt={`${title} main photo`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 66vw"
          className="object-cover"
        />
      </figure>
      <div className="hidden h-full flex-col gap-3 lg:flex">
        {rest.slice(0, 3).map((image, index) => (
          <figure
            key={image}
            className="relative flex-1 overflow-hidden rounded-3xl bg-surface shadow-soft"
          >
            <ImageWithSkeleton
              src={image}
              alt={`${title} photo ${index + 2}`}
              fill
              loading="lazy"
              sizes="(max-width: 1024px) 100vw, 32vw"
              className="object-cover"
            />
          </figure>
        ))}
        {rest.length > 3 ? (
          <div className="flex h-24 items-center justify-center rounded-3xl border border-dashed border-brand-teal/40 bg-brand-teal/10 text-sm font-semibold text-brand-teal">
            +{rest.length - 3} more photos
          </div>
        ) : null}
      </div>
    </section>
  );
}

