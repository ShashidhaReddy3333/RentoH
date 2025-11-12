'use client';

import { useEffect, useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatInTimeZone } from 'date-fns-tz';
import Image from 'next/image';
import Link from 'next/link';
import { createTourCalendarEvent, generateICS, generateGoogleCalendarUrl } from '@/lib/ics';

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

export default function ToursClient({ tours, userRole, userId }: Props) {
  // userId is accepted from the server page for context; keep it referenced to
  // avoid unused-var lint in the client bundle.
  void userId;
  const [filter, setFilter] = useState('all');
  const [items, setItems] = useState<Tour[]>(tours);
  const [localTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  const supabase = createSupabaseBrowserClient();
  
  if (!supabase) {
    console.error('[ToursClient] Supabase client not available');
    return <div className="text-center py-8"><p className="text-red-500">Unable to load tours</p></div>;
  }

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

  const updateTourStatus = async (id: string, status: string, note: string) => {
    const res = await fetch('/api/tours/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tourId: id, status, notes: note })
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = body?.error || body?.message || 'Failed to update tour';
      showToast(msg);
      return;
    }
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    showToast(`Tour ${status}`, { success: true });
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

              <div className="space-x-2">
                <Button
                  variant="secondary"
                  onClick={() => handleDownloadICS(tour)}
                >
                  Download ICS
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleGoogleCalendar(tour)}
                >
                  Add to Google Calendar
                </Button>

                {userRole === 'landlord' && tour.status === 'requested' && (
                  <>
                    <Button
                      variant="primary"
                      onClick={() => updateTourStatus(tour.id, 'confirmed', 'Tour confirmed')}
                    >
                      Confirm
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => updateTourStatus(tour.id, 'cancelled', 'Tour cancelled')}
                    >
                      Cancel
                    </Button>
                  </>
                )}
                {userRole === 'landlord' && tour.status === 'confirmed' && (
                  <Button
                    variant="secondary"
                    onClick={() => updateTourStatus(tour.id, 'completed', 'Tour completed')}
                  >
                    Mark completed
                  </Button>
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
    </div>
  );
}
