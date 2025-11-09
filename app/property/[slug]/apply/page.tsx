import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

import { PropertyApplicationForm } from "@/app/property/[slug]/apply/PropertyApplicationForm";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ApplyPage({ params }: { params: { slug: string } }) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    redirect("/auth/sign-in");
  }
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/sign-in");
  }

  const identifier = params.slug;
  const column = UUID_PATTERN.test(identifier) ? "id" : "slug";

  const { data: property, error } = await supabase
    .from("properties")
    .select(
      `
        id,
        slug,
        title,
        landlord_id
      `
    )
    .eq(column, identifier)
    .maybeSingle();

  if (error || !property) {
    redirect("/browse");
  }

  const propertyId: string = property.id;
  const canonicalSlug: string | null = property.slug ?? null;

  if (canonicalSlug && canonicalSlug !== identifier) {
    redirect(`/property/${canonicalSlug}/apply`);
  }

  const { data: existingApplication } = await supabase
    .from("applications")
    .select("id, status")
    .eq("property_id", propertyId)
    .eq("tenant_id", session.user.id)
    .maybeSingle();

  const landlordId: string | undefined = (property as { landlord_id?: string | null }).landlord_id ?? undefined;
  if (!landlordId) {
    redirect("/browse");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {existingApplication ? (
        <div className="rounded-2xl border border-brand-teal/30 bg-brand-teal/5 p-6 text-center">
          <h1 className="text-2xl font-semibold text-brand-dark">Application already submitted</h1>
          <p className="mt-3 text-sm text-text-muted">
            You have already applied for this property. Your application status is{" "}
            <span className="font-semibold text-brand-teal">{existingApplication.status}</span>.
          </p>
          <p className="mt-4 text-sm text-text-muted">
            You can review all of your applications in the{" "}
            <a href="/applications" className="font-semibold text-brand-teal hover:underline">
              applications dashboard
            </a>
            .
          </p>
        </div>
      ) : (
        <PropertyApplicationForm
          propertyId={propertyId}
          landlordId={landlordId}
          propertyTitle={property.title}
          userId={session.user.id}
        />
      )}
    </div>
  );
}
