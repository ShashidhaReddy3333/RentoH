import type { Property } from "@/lib/types";

type PropertyKeyFactsProps = {
  property: Property;
};

export function PropertyKeyFacts({ property }: PropertyKeyFactsProps) {
  const facts: Array<{ label: string; value: string }> = [
    { label: "Home type", value: capitalize(property.type) },
    { label: "Bedrooms", value: String(property.beds) },
    { label: "Bathrooms", value: String(property.baths) }
  ];

  facts.push({ label: "Pets", value: property.pets ? "Allowed" : "Not allowed" });
  facts.push({ label: "Furnished", value: property.furnished ? "Yes" : "No" });

  if (property.availableFrom) {
    facts.push({
      label: "Available",
      value: new Date(property.availableFrom).toLocaleDateString()
    });
  }

  return (
    <section aria-labelledby="key-facts-heading" className="space-y-4 rounded-3xl border border-black/5 bg-white p-6 shadow-soft">
      <h2 id="key-facts-heading" className="text-xl font-semibold text-brand-dark">
        Key facts
      </h2>
      <dl className="grid gap-3 sm:grid-cols-2">
        {facts.map((fact) => (
          <div key={fact.label} className="rounded-2xl bg-brand-blue/5 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-brand-blue/80">
              {fact.label}
            </dt>
            <dd className="text-sm font-semibold text-brand-dark">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
