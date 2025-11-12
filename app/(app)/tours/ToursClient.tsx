'use client';

import { useEffect, useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatInTimeZone } from 'date-fns-tz';
import Image from 'next/image';
import Link from 'next/link';
import { createTourCalendarEvent, generateICS, generateGoogleCalendarUrl } from '@/lib/ics';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface Tour {
  id: string;
  status: string;
  scheduled_at: string;
  notes: string;
  property: {
    id: string;
    title: string;
    address: string;
    images: string[];
  };
  landlord: {
    full_name: string;
    email: string;
    avatar_url: string;
  };
  tenant: {
    full_name: string;
    email: string;
    avatar_url: string;
  };
}

interface Props {
  tours: Tour[];
  userRole: string;
  userId: string;
}

export default function ToursClient({ tours, userRole }: Props) {
  const [filter, setFilter] = useState('all');
  const [items, setItems] = useState<Tour[]>(tours);
  const [localTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    tourId: string;
    status: string;
    tourTitle: string;
  } | null>(null);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => { setItems(tours); }, [tours]);

  function showToast(message: string, opts: { success?: boolean } = {}) {
    const id = `rento-toast-${Date.now()}`;
    const el = document.createElement('div');
    el.id = id;
    el.className = 'fixed bottom-6 right-6 z-50 rounded-md px-4 py-2 text-sm font-medium shadow-lg';
    el.style.background = opts.success ? '#DCFCE7' : '#FEF3C7';
    el.style.color = '#0f172a';
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity 180ms ease';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 200);
    }, 2500);
  }

  const filteredTours = useMemo(() => items.filter(tour => {
    if (filter === 'all') return true;
    return tour.status === filter;
  }), [items, filter]);

  if (!supabase) {
    console.error('[ToursClient] Supabase client not available');
    return <div className="text-center py-8"><p className="text-red-500">Unable to load tours</p></div>;
  }

  const updateTourStatus = async (id: string, status: string, note?: string) => {
    const res = await fetch('/api/tours/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tourId: id, status, notes: note || '' })
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = body?.error || body?.message || 'Failed to update tour';
      showToast(msg);
      return;
    }
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    const statusLabels: Record<string, string> = {
      confirmed: 'confirmed',
      completed: 'marked as completed',
      cancelled: 'cancelled'
    };
    showToast(`Tour ${statusLabels[status] || status}`, { success: true });
    setConfirmDialog(null);
  };

  const openConfirmDialog = (tourId: string, status: string, tourTitle: string) => {
    setConfirmDialog({ isOpen: true, tourId, status, tourTitle });
  };

  const handleDownloadICS = (tour: Tour) => {
    const event = createTourCalendarEvent({
      property: tour.property,
      scheduled_at: new Date(tour.scheduled_at),
    });

    const icsContent = generateICS(event);
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tour-${tour.id}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGoogleCalendar = (tour: Tour) => {
    const event = createTourCalendarEvent({
      property: tour.property,
      scheduled_at: new Date(tour.scheduled_at),
    });

    const url = generateGoogleCalendarUrl(event);
    window.open(url, '_blank');
  };

  const statusColors: Record<string, string> = {
    requested: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Property Tours</h1>
        <div className="space-x-2">
          <Button
            variant={filter === 'all' ? 'primary' : 'secondary'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          {Object.keys(statusColors).map(status => (
            <Button
              key={status}
              variant={filter === status ? 'primary' : 'secondary'}
              onClick={() => setFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredTours.map((tour) => (
          <Card key={tour.id} className="p-6">
            <div className="flex justify-between">
              <div className="flex space-x-4">
                <div className="relative w-24 h-24">
                  <Image
                    src={tour.property.images[0] || '/images/placeholder.jpg'}
                    alt={tour.property.title}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    <Link href={`/property/${tour.property.id}`}>
                      {tour.property.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-gray-500">{tour.property.address}</p>
                  <p className="text-sm text-gray-500">
                    {formatInTimeZone(
                      new Date(tour.scheduled_at),
                      localTimezone,
                      'PPP p'
                    )}
                  </p>
                  <p className="text-xs text-gray-400">
                    {localTimezone !== 'UTC' && `(${localTimezone})`}
                  </p>
                  <div className={`inline-block px-2 py-1 rounded-full text-sm mt-2 ${statusColors[tour.status]}`}>
                    {tour.status.charAt(0).toUpperCase() + tour.status.slice(1)}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDownloadICS(tour)}
                  aria-label="Download calendar event"
                >
                  Download ICS
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleGoogleCalendar(tour)}
                  aria-label="Add to Google Calendar"
                >
                  Google Calendar
                </Button>

                {userRole === 'landlord' && (
                  <>
                    {tour.status === 'requested' && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openConfirmDialog(tour.id, 'confirmed', tour.property.title)}
                          aria-label="Confirm tour"
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                          Confirm
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => openConfirmDialog(tour.id, 'cancelled', tour.property.title)}
                          aria-label="Cancel tour"
                        >
                          <XCircleIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                          Cancel
                        </Button>
                      </>
                    )}
                    {tour.status === 'confirmed' && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openConfirmDialog(tour.id, 'completed', tour.property.title)}
                          aria-label="Mark tour as completed"
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                          Complete
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => openConfirmDialog(tour.id, 'cancelled', tour.property.title)}
                          aria-label="Cancel tour"
                        >
                          <XCircleIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                          Cancel
                        </Button>
                      </>
                    )}
                    {(tour.status === 'completed' || tour.status === 'cancelled') && (
                      <span className="inline-flex items-center gap-1 text-sm text-text-muted px-3 py-2">
                        <ClockIcon className="h-4 w-4" aria-hidden="true" />
                        No actions available
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            {tour.notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">{tour.notes}</p>
              </div>
            )}
          </Card>
        ))}

        {filteredTours.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No tours found</p>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog?.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setConfirmDialog(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="dialog-title" className="mb-4 text-xl font-semibold text-brand-dark">
              {confirmDialog.status === 'confirmed' && 'Confirm Tour'}
              {confirmDialog.status === 'completed' && 'Complete Tour'}
              {confirmDialog.status === 'cancelled' && 'Cancel Tour'}
            </h2>
            <p className="mb-6 text-sm text-text-muted">
              {confirmDialog.status === 'confirmed' &&
                `Are you sure you want to confirm the tour for "${confirmDialog.tourTitle}"? The tenant will be notified.`}
              {confirmDialog.status === 'completed' &&
                `Mark the tour for "${confirmDialog.tourTitle}" as completed? This action indicates the tour has taken place.`}
              {confirmDialog.status === 'cancelled' &&
                `Are you sure you want to cancel the tour for "${confirmDialog.tourTitle}"? The tenant will be notified.`}
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setConfirmDialog(null)}
                aria-label="Cancel action"
              >
                Cancel
              </Button>
              <Button
                variant={confirmDialog.status === 'cancelled' ? 'danger' : 'primary'}
                onClick={() => updateTourStatus(confirmDialog.tourId, confirmDialog.status)}
                aria-label={`Confirm ${confirmDialog.status}`}
              >
                {confirmDialog.status === 'confirmed' && 'Confirm Tour'}
                {confirmDialog.status === 'completed' && 'Mark Completed'}
                {confirmDialog.status === 'cancelled' && 'Cancel Tour'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
