'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
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
  const supabase = createClientComponentClient();

  const filteredTours = tours.filter(tour => {
    if (filter === 'all') return true;
    return tour.status === filter;
  });

  const updateTourStatus = async (id: string, status: string, note: string) => {
    await supabase
      .from('tours')
      .update({ status, notes: note })
      .eq('id', id);
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
            variant={filter === 'all' ? 'primary' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          {Object.keys(statusColors).map(status => (
            <Button
              key={status}
              variant={filter === status ? 'primary' : 'outline'}
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
                    {format(new Date(tour.scheduled_at), 'PPP p')}
                  </p>
                  <div className={`inline-block px-2 py-1 rounded-full text-sm mt-2 ${statusColors[tour.status]}`}>
                    {tour.status.charAt(0).toUpperCase() + tour.status.slice(1)}
                  </div>
                </div>
              </div>

              <div className="space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handleDownloadICS(tour)}
                >
                  Download ICS
                </Button>
                <Button
                  variant="outline"
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
                      variant="destructive"
                      onClick={() => updateTourStatus(tour.id, 'cancelled', 'Tour cancelled')}
                    >
                      Cancel
                    </Button>
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
    </div>
  );
}