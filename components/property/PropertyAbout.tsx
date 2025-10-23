import type { Property } from "@/lib/types";

type PropertyAboutProps = {
  property: Property;
};

export function PropertyAbout({ property }: PropertyAboutProps) {
  if (!property.description) {
    return null;
  }

  return (
    <section aria-labelledby="about-heading" className="space-y-3 rounded-3xl border border-black/5 bg-white p-6 shadow-soft">
      <div>
        <h2 id="about-heading" className="text-xl font-semibold text-brand-dark">
          About this property
        </h2>
      </div>
      <p className="text-base leading-relaxed text-textc/90">{property.description}</p>
    </section>
  );
}
