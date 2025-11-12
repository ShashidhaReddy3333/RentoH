"use client";

import { useEffect, useMemo, useState } from 'react';
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
  const [apps, setApps] = useState<Application[]>(applications);
  const supabase = createSupabaseBrowserClient();
  
  if (!supabase) {
    console.error('[ApplicationsClient] Supabase client not available');
    return <div className="text-center py-8"><p className="text-red-500">Unable to load applications</p></div>;
  }

  useEffect(() => {
    setApps(applications);
  }, [applications]);

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

  // Realtime: notify tenants when status changes
  useEffect(() => {
    let unsubscribed = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const channel = supabase
          .channel('applications-updates')
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'applications',
            filter: `tenant_id=eq.${user.id}`
          }, (payload) => {
            const row = payload.new as any;
            const id = row?.id as string | undefined;
            const status = row?.status as string | undefined;
            if (!id || !status) return;
            setApps((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
            showToast(`Application status updated to ${status}`, { success: true });
          })
          .subscribe();

        return () => {
          if (!unsubscribed) {
            supabase.removeChannel(channel);
          }
        };
      } catch {
        // ignore
      }
    })();
    return () => {
      unsubscribed = true;
    };
  }, [supabase]);

  const filteredApplications = useMemo(() => apps.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  }), [apps, filter]);

  const updateApplicationStatus = async (id: string, status: string, note: string) => {
    const res = await fetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = body?.error || body?.message || 'Failed to update application';
      showToast(msg);
      return;
    }
    setApps((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
    showToast(`Application ${status}`, { success: true });
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
