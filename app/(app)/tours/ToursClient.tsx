'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowDownTrayIcon,
  CalendarIcon,
  ClockIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { TourStatus, UserRole } from '@/lib/types';
import { createTourCalendarEvent, generateICS, generateGoogleCalendarUrl } from '@/lib/ics';
import {
  TOUR_STATUS_META,
  landlordActionsFor,
  tenantActionsFor,
  isActionableStatus,
  type TourAction,
  type TourStatusActionValue
} from '@/lib/tours/status';
import { TourStatusMenu } from '@/components/tours/TourStatusMenu';
import { updateTourStatusClient } from '@/lib/tours/update-status';

type ClientTour = {
  id: string;
  status: TourStatus;
  scheduled_at: string;
  timezone?: string | null;
  notes?: string | null;
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
};

type FilterValue = 'all' | TourStatus;

interface Props {
  tours: ClientTour[];
  userRole: UserRole;
  userId: string;
}

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'requested', label: 'Requested' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'rescheduled', label: 'Rescheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

const DIALOG_COPY: Record<
  TourStatusActionValue,
  { title: string; body: string; cta: string; intent: 'primary' | 'danger' }
> = {
  confirmed: {
    title: 'Confirm tour',
    body: 'Confirm this date and notify the renter instantly?',
    cta: 'Confirm tour',
    intent: 'primary'
  },
  rescheduled: {
    title: 'Confirm new time',
    body: 'Confirm the updated time and notify the other party?',
    cta: 'Confirm new slot',
    intent: 'primary'
  },
  completed: {
    title: 'Mark as completed',
    body: 'Mark this tour as completed? This helps keep your pipeline accurate.',
    cta: 'Mark completed',
    intent: 'primary'
  },
  cancelled: {
    title: 'Cancel tour',
    body: 'Are you sure you want to cancel this tour? The other party will be notified.',
    cta: 'Cancel tour',
    intent: 'danger'
  }
};

type ConfirmDialogState =
  | {
      isOpen: true;
      tourId: string;
      nextStatus: TourStatusActionValue;
      tourTitle: string;
      body: string;
      cta: string;
      intent: 'primary' | 'danger';
    }
  | null;

export default function ToursClient({ tours, userRole }: Props) {
  const [filter, setFilter] = useState<FilterValue>('all');
  const [items, setItems] = useState<ClientTour[]>(tours);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null);
  const [pendingTourId, setPendingTourId] = useState<string | null>(null);
  const [localTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  const isLandlord = userRole === 'landlord' || userRole === 'admin';

  useEffect(() => {
    setItems(tours);
  }, [tours]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(id);
  }, [toast]);

  const statusCounts = useMemo(() => {
    return items.reduce<Record<TourStatus, number>>((acc, tour) => {
      acc[tour.status] = (acc[tour.status] ?? 0) + 1;
      return acc;
    }, {} as Record<TourStatus, number>);
  }, [items]);

  const filteredTours = useMemo(
    () => items.filter((tour) => (filter === 'all' ? true : tour.status === filter)),
    [items, filter]
  );

  const handleDownloadICS = (tour: ClientTour) => {
    const event = createTourCalendarEvent({
      property: tour.property,
      scheduled_at: new Date(tour.scheduled_at)
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

  const handleGoogleCalendar = (tour: ClientTour) => {
    const event = createTourCalendarEvent({
      property: tour.property,
      scheduled_at: new Date(tour.scheduled_at)
    });
    const url = generateGoogleCalendarUrl(event);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openStatusDialog = (tour: ClientTour, status: TourStatusActionValue) => {
    setConfirmDialog({
      isOpen: true,
      tourId: tour.id,
      nextStatus: status,
      tourTitle: tour.property.title,
      ...DIALOG_COPY[status]
    });
  };

  const openConfirmDialog = (tour: ClientTour, action: TourAction) => {
    if (isActionableStatus(action.status)) {
      openStatusDialog(tour, action.status);
    }
  };

  const updateTourStatus = async (tourId: string, status: TourStatusActionValue) => {
    setPendingTourId(tourId);
    try {
      await updateTourStatusClient({ tourId, status });
      setItems((prev) => prev.map((tour) => (tour.id === tourId ? { ...tour, status } : tour)));
      const statusLabels: Record<string, string> = {
        confirmed: 'Tour confirmed',
        completed: 'Tour marked completed',
        cancelled: 'Tour cancelled'
      };
      setToast({ message: statusLabels[status] ?? 'Status updated', tone: 'success' });
    } catch (error) {
      console.error('[ToursClient] Failed to update tour', error);
      setToast({ message: 'Unable to update tour right now.', tone: 'error' });
    } finally {
      setConfirmDialog(null);
      setPendingTourId((current) => (current === tourId ? null : current));
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-brand-outline/60 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-brand-dark">Property tours</h1>
            <p className="text-sm text-text-muted">
              Times display in your local timezone ({localTimezone}).
            </p>
          </div>
          <div className="text-sm font-medium text-text-muted" role="status" aria-live="polite">
            Showing {filteredTours.length} of {items.length} tours
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <div className="inline-flex min-w-full gap-2">
            {FILTERS.map((option) => {
              const count =
                option.value === 'all'
                  ? items.length
                  : option.value in statusCounts
                    ? statusCounts[option.value as TourStatus] ?? 0
                    : 0;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFilter(option.value)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 ${
                    filter === option.value
                      ? 'bg-brand-primary text-white shadow-sm'
                      : 'bg-brand-light text-brand-dark hover:bg-brand-primaryMuted'
                  }`}
                  aria-pressed={filter === option.value}
                >
                  {option.label}
                  <span className="text-xs font-semibold">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-2xl border px-4 py-3 text-sm font-medium shadow-md ${
            toast.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="space-y-4">
        {filteredTours.map((tour) => (
          <Card key={tour.id} className="space-y-4 p-4 shadow-soft sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex flex-1 gap-4">
                <div className="relative h-28 w-36 overflow-hidden rounded-2xl bg-neutral-100">
                  {tour.property.images[0] ? (
                    <Image
                      src={tour.property.images[0]}
                      alt={tour.property.title}
                      fill
                      sizes="200px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-text-muted">
                      No photo
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/property/${tour.property.id}`}
                      className="text-lg font-semibold text-brand-dark hover:text-brand-primary"
                    >
                      {tour.property.title}
                    </Link>
                    <StatusBadge status={tour.status} />
                  </div>
                  <p className="text-sm text-text-muted">{tour.property.address}</p>
                  <p className="text-sm font-medium text-brand-dark">
                    {formatTourDate(tour.scheduled_at, localTimezone)}
                  </p>
                  {tour.notes ? (
                    <p className="text-sm text-text-muted">
                      <span className="font-semibold text-brand-dark">Notes:</span> {tour.notes}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="space-y-2 md:text-right">
                <p className="text-sm text-text-muted">
                  {isLandlord ? 'Touring with' : 'Hosted by'}
                  <span className="ml-1 font-semibold text-brand-dark">
                    {isLandlord ? tour.tenant.full_name : tour.landlord.full_name}
                  </span>
                </p>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      (window.location.href = `mailto:${isLandlord ? tour.tenant.email : tour.landlord.email}`)
                    }
                    aria-label="Send email"
                  >
                    <EnvelopeIcon className="h-4 w-4" aria-hidden="true" />
                    Email
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDownloadICS(tour)}
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
                    ICS
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleGoogleCalendar(tour)}>
                    <CalendarIcon className="h-4 w-4" aria-hidden="true" />
                    Calendar
                  </Button>
                </div>
              </div>
            </div>

            <TourActions
              tour={tour}
              isLandlord={isLandlord}
              isPending={pendingTourId === tour.id}
              onTriggerAction={(action) => openConfirmDialog(tour, action)}
              onStatusIntent={(status) => openStatusDialog(tour, status)}
            />
          </Card>
        ))}

        {filteredTours.length === 0 && (
          <Card className="p-6 text-center text-sm text-text-muted">
            <p>No tours match this filter yet.</p>
          </Card>
        )}
      </div>

      {confirmDialog?.isOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-brand-dark">{confirmDialog.body}</h2>
            <p className="mt-2 text-sm text-text-muted">
              Listing: <span className="font-medium text-brand-dark">{confirmDialog.tourTitle}</span>
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setConfirmDialog(null)}>
                Keep tour
              </Button>
              <Button
                variant={confirmDialog.intent === 'danger' ? 'danger' : 'primary'}
                onClick={() => updateTourStatus(confirmDialog.tourId, confirmDialog.nextStatus)}
              >
                {confirmDialog.cta}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: TourStatus }) {
  const meta = TOUR_STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${meta.badgeClass}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {meta.label}
    </span>
  );
}

function TourActions({
  tour,
  isLandlord,
  isPending,
  onTriggerAction,
  onStatusIntent
}: {
  tour: ClientTour;
  isLandlord: boolean;
  isPending: boolean;
  onTriggerAction: (action: TourAction) => void;
  onStatusIntent: (status: TourStatusActionValue) => void;
}) {
  const actions = isLandlord ? landlordActionsFor(tour.status) : tenantActionsFor(tour.status);
  const landlordStatusOptions = isLandlord
    ? Array.from(
        new Set(
          actions
            .map((action) => action.status)
            .filter((status): status is TourStatusActionValue => isActionableStatus(status))
        )
      )
    : [];

  if (actions.length === 0) {
    return (
      <p className="inline-flex items-center gap-2 rounded-full bg-brand-light px-3 py-1 text-sm text-text-muted">
        <ClockIcon className="h-4 w-4" aria-hidden="true" />
        No further actions available
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((action) => (
        <Button
          key={`${tour.id}-${action.status}`}
          variant={action.tone === 'danger' ? 'danger' : 'primary'}
          size="sm"
          onClick={() => onTriggerAction(action)}
          disabled={isPending}
        >
          <action.icon className="h-4 w-4" aria-hidden="true" />
          {action.label}
        </Button>
      ))}
      {isLandlord ? (
        <TourStatusMenu
          tourId={tour.id}
          currentStatus={tour.status}
          allowedStatuses={landlordStatusOptions}
          disabled={isPending}
          onSelect={onStatusIntent}
        />
      ) : null}
    </div>
  );
}

function formatTourDate(value: string, timeZone: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone
  }).format(new Date(value));
}
