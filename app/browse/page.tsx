import Image from "next/image";
import { listProperties } from "@/lib/data/properties";

export const metadata = {
  title: "Rento - Browse rentals",
  description: "Find verified rentals and chat with landlords."
};

export default async function BrowsePage() {
  const properties = await listProperties();
  return (
    <main id="main" className="container mx-auto px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Latest listings</h1>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((p) => (
          <li
            key={p.id}
            className="backdrop-blur rounded-2xl border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5"
          >
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
              {p.image_url ? (
                <Image
                  src={p.image_url}
                  alt={p.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              ) : null}
            </div>
            <div className="mt-3">
              <h2 className="font-medium">{p.title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">{p.city}</p>
              <p className="mt-1 font-semibold">${p.price}/mo</p>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
