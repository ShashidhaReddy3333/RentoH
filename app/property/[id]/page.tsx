import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getBySlugOrId } from "@/lib/data-access/properties";
import { env } from "@/lib/env";
import SlugPropertyPage, {
  generateMetadata as generateSlugMetadata,
  revalidate
} from "../[slug]/page";

export { revalidate };

type Params = { params: { id: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const property = await getBySlugOrId(params.id);

  if (!property) {
    return {
      title: "Listing not found | Rento",
      description: "This listing could not be found. Browse Rento to discover available homes."
    };
  }

  const slug = property.slug ?? property.id;
  if (slug !== params.id) {
    const siteUrl = (env.NEXT_PUBLIC_SITE_URL ?? "https://rento-h.vercel.app").replace(/\/$/, "");
    return {
      title: `${property.title} | Rento`,
      description:
        property.description ??
        `See details for ${property.title} including pricing, availability, and amenities.`,
      alternates: {
        canonical: `${siteUrl}/property/${slug}`
      }
    };
  }

  return generateSlugMetadata({ params: { slug } });
}

export default async function PropertyPageById({ params }: Params) {
  const property = await getBySlugOrId(params.id);
  if (!property) {
    notFound();
  }

  const slug = property.slug ?? property.id;
  if (params.id !== slug) {
    redirect(`/property/${slug}`);
  }

  return SlugPropertyPage({ params: { slug } });
}
