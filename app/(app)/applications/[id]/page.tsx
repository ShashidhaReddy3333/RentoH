import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { formatDistance } from 'date-fns';
import Image from 'next/image';

import { Card } from '@/components/ui/card';
import ApplicationActions from './ApplicationActions';
import { normalizeApplicationStatus } from '@/lib/application-status';

const FALLBACK_PROPERTY_IMAGE = "/images/listings/home-1.jpg";

export default async function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/sign-in');
  }

  const { data: application, error } = await supabase
    .from('applications')
    .select(`
      id,
      tenant_id,
      landlord_id,
      property_id,
      status,
      message,
      notes,
      monthly_income,
      timeline,
      submitted_at,
      created_at,
      updated_at,
      property:properties(
        id,
        title,
        address,
        images,
        price,
        slug,
        beds,
        baths,
        city
      ),
      applicant:profiles!applications_tenant_id_fkey(
        full_name,
        email,
        avatar_url,
        phone
      ),
      landlord:profiles!applications_landlord_id_fkey(
        full_name,
        email,
        avatar_url,
        phone
      )
    `)
    .eq('id', params.id)
    .single();

  if (error || !application) {
    notFound();
  }

  // Check if user has access to this application
  const isLandlord = application.landlord_id === session.user.id;
  const isTenant = application.tenant_id === session.user.id;
  
  if (!isLandlord && !isTenant) {
    redirect('/applications');
  }

  const property = Array.isArray(application.property) ? application.property[0] : application.property;
  const applicant = Array.isArray(application.applicant) ? application.applicant[0] : application.applicant;
  const landlord = Array.isArray(application.landlord) ? application.landlord[0] : application.landlord;
  const propertyImages =
    (property?.images ?? []).filter((image: string | null): image is string => typeof image === "string" && image.length > 0);
  const coverImage = propertyImages[0] ?? FALLBACK_PROPERTY_IMAGE;

  const statusColors: Record<string, string> = {
    submitted: 'bg-blue-100 text-blue-800',
    reviewing: 'bg-yellow-100 text-yellow-800',
    interview: 'bg-purple-100 text-purple-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  const propertySlug = property?.slug ?? property?.id ?? '';

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link 
          href="/applications" 
          className="inline-flex items-center gap-2 text-sm text-brand-blue hover:text-brand-teal"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to applications
        </Link>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-brand-dark">Application Details</h1>
              <p className="text-sm text-text-muted mt-1">
                Submitted {formatDistance(new Date(application.submitted_at || application.created_at), new Date(), { addSuffix: true })}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                statusColors[getStatusKey(application.status)] ?? statusColors["submitted"]
              }`}
            >
              {formatStatusLabel(application.status)}
            </span>
          </div>

          {/* Property Information */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-brand-dark">Property</h2>
            <Link href={`/property/${propertySlug}`} className="block">
              <div className="flex gap-4 p-4 rounded-lg border border-black/5 hover:border-brand-teal/40 transition">
                <div className="relative w-32 h-24 flex-shrink-0">
                  <Image
                    src={coverImage}
                    alt={property?.title || 'Property'}
                    fill
                    className="object-cover rounded-lg"
                    sizes="(max-width: 640px) 70vw, 128px"
                    priority
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-brand-dark">{property?.title}</h3>
                  <p className="text-sm text-text-muted">{property?.address}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-text-muted">
                    <span>${property?.price?.toLocaleString()}/mo</span>
                    {property?.beds && <span>{property.beds} bed</span>}
                    {property?.baths && <span>{property.baths} bath</span>}
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Applicant Information (for landlord view) */}
          {isLandlord && applicant && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3 text-brand-dark">Applicant Information</h2>
              <div className="p-4 rounded-lg border border-black/5">
                <div className="flex items-center gap-3 mb-3">
                  {applicant.avatar_url && (
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <Image
                        src={applicant.avatar_url}
                        alt={applicant.full_name || 'Applicant'}
                        fill
                        className="object-cover rounded-full"
                        sizes="48px"
                      />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-brand-dark">{applicant.full_name}</p>
                    <p className="text-sm text-text-muted">{applicant.email}</p>
                    {applicant.phone && (
                      <p className="text-sm text-text-muted">{applicant.phone}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-text-muted">Monthly Income</p>
                    <p className="font-semibold text-brand-dark">
                      ${application.monthly_income?.toLocaleString() || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Landlord Information (for tenant view) */}
          {isTenant && landlord && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3 text-brand-dark">Landlord</h2>
              <div className="p-4 rounded-lg border border-black/5">
                <div className="flex items-center gap-3">
                  {landlord.avatar_url && (
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <Image
                        src={landlord.avatar_url}
                        alt={landlord.full_name || 'Landlord'}
                        fill
                        className="object-cover rounded-full"
                        sizes="48px"
                      />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-brand-dark">{landlord.full_name}</p>
                    <p className="text-sm text-text-muted">{landlord.email}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Application Message */}
          {application.message && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3 text-brand-dark">Message</h2>
              <div className="p-4 rounded-lg border border-black/5 bg-surface">
                <p className="text-sm text-brand-dark whitespace-pre-wrap">{application.message}</p>
              </div>
            </div>
          )}

          {/* Notes */}
          {application.notes && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3 text-brand-dark">Notes</h2>
              <div className="p-4 rounded-lg border border-black/5 bg-surface">
                <p className="text-sm text-brand-dark whitespace-pre-wrap">{application.notes}</p>
              </div>
            </div>
          )}

          {/* Timeline */}
          {application.timeline && Array.isArray(application.timeline) && application.timeline.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-brand-dark">Timeline</h2>
              <div className="space-y-3">
                {application.timeline.map((event: { status?: string; timestamp?: string; note?: string }, index: number) => (
                  <div key={index} className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${getTimelineDotColor(event.status)}`}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-brand-dark">
                        {event.status ? formatStatusLabel(event.status) : 'Updated'}
                      </p>
                      {event.timestamp && (
                        <p className="text-xs text-text-muted">
                          {formatDistance(new Date(event.timestamp), new Date(), { addSuffix: true })}
                        </p>
                      )}
                      {event.note && (
                        <p className="text-sm text-text-muted mt-1">{event.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Actions for Landlord */}
        {isLandlord && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-brand-dark">Actions</h2>
            <ApplicationActions 
              applicationId={application.id} 
              currentStatus={application.status || 'submitted'} 
            />
          </Card>
        )}
      </div>
    </div>
  );
}

function getStatusKey(status?: string | null) {
  return normalizeApplicationStatus(status ?? 'submitted');
}

function formatStatusLabel(status?: string | null) {
  const normalized = getStatusKey(status);
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getTimelineDotColor(status?: string | null) {
  const normalized = getStatusKey(status);
  if (normalized === 'accepted') {
    return 'bg-green-500';
  }
  if (normalized === 'rejected') {
    return 'bg-red-500';
  }
  return 'bg-blue-500';
}
