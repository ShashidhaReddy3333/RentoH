"use client";

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatDistance } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';

interface Application {
  id: string;
  status: string;
  submitted_at: string;
  message: string;
  monthly_income: number;
  notes: string;
  timeline: Array<{
    status: string;
    timestamp: string;
    note: string;
  }>;
  property: {
    id: string;
    title: string;
    address: string;
    images: string[];
    price: number;
  };
  applicant: {
    full_name: string;
    email: string;
    avatar_url: string;
  };
  landlord: {
    full_name: string;
    email: string;
    avatar_url: string;
  };
}

interface Props {
  applications: Application[];
  userRole: string;
}

export default function ApplicationsClient({ applications, userRole }: Props) {
  const [filter, setFilter] = useState('all');
  const supabase = createSupabaseBrowserClient();
  
  if (!supabase) {
    console.error('[ApplicationsClient] Supabase client not available');
    return <div className="text-center py-8"><p className="text-red-500">Unable to load applications</p></div>;
  }

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const updateApplicationStatus = async (id: string, status: string, note: string) => {
    await supabase
      .from('applications')
      .update({ status, notes: note })
      .eq('id', id);
  };

  const statusColors: Record<string, string> = {
    submitted: 'bg-blue-100 text-blue-800',
    reviewing: 'bg-yellow-100 text-yellow-800',
    interview: 'bg-purple-100 text-purple-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Applications</h1>
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
        {filteredApplications.map((app) => (
          <Card key={app.id} className="p-6">
            <div className="flex justify-between">
              <div className="flex space-x-4">
                <div className="relative w-24 h-24">
                  <Image
                    src={app.property.images[0] || '/images/placeholder.jpg'}
                    alt={app.property.title}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    <Link href={`/applications/${app.id}`} className="hover:text-brand-teal">
                      {app.property.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-gray-500">{app.property.address}</p>
                  <p className="text-sm text-gray-500">
                    Submitted {formatDistance(new Date(app.submitted_at), new Date(), { addSuffix: true })}
                  </p>
                  <div className={`inline-block px-2 py-1 rounded-full text-sm mt-2 ${statusColors[app.status]}`}>
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </div>
                </div>
              </div>

              {userRole === 'landlord' && (
                <div className="space-x-2">
                  {app.status !== 'approved' && (
                    <Button
                      variant="primary"
                      onClick={() => updateApplicationStatus(app.id, 'approved', 'Application approved')}
                    >
                      Approve
                    </Button>
                  )}
                  {app.status !== 'rejected' && (
                    <Button
                      variant="danger"
                      onClick={() => updateApplicationStatus(app.id, 'rejected', 'Application rejected')}
                    >
                      Reject
                    </Button>
                  )}
                  {['submitted', 'reviewing'].includes(app.status) && (
                    <Button
                      variant="secondary"
                      onClick={() => updateApplicationStatus(app.id, 'interview', 'Scheduled for interview')}
                    >
                      Schedule Interview
                    </Button>
                  )}
                </div>
              )}
            </div>

            {app.timeline && app.timeline.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <h4 className="font-semibold mb-2">Timeline</h4>
                <div className="space-y-2">
                  {app.timeline.map((event, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400 mt-2" />
                      <div>
                        <p className="text-sm font-medium">
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDistance(new Date(event.timestamp), new Date(), { addSuffix: true })}
                        </p>
                        {event.note && (
                          <p className="text-sm text-gray-600 mt-1">{event.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))}

        {filteredApplications.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No applications found</p>
          </div>
        )}
      </div>
    </div>
  );
}
