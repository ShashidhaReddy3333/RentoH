"use client";

import { useOptimistic, useState } from "react";
import Image from "next/image";
import { CheckIcon } from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import type { Tour, TourStatus, UserRole } from "@/lib/types";
import {
  TOUR_STATUS_META,
  landlordActionsFor,
  tenantActionsFor,
  isActionableStatus,
  type TourAction,
  type TourStatusActionValue
} from "@/lib/tours/status";
import { TourStatusMenu } from "@/components/tours/TourStatusMenu";
import { updateTourStatusClient } from "@/lib/tours/update-status";

type DashboardTourListProps = {
  tours: Tour[];
  userRole: UserRole;
  localTimezone: string;
};

export function DashboardTourList({ tours, userRole, localTimezone }: DashboardTourListProps) {
  const [announcement, setAnnouncement] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const isLandlord = userRole === "landlord" || userRole === "admin";

  const [optimisticTours, updateOptimistic] = useOptimistic(tours, (current, next: Tour) =>
    current.map((tour) => (tour.id === next.id ? next : tour))
  );

  const mutateStatus = async (tour: Tour, status: TourStatusActionValue, label?: string) => {
    setPendingId(tour.id);
    updateOptimistic({ ...tour, status });
    try {
      await updateTourStatusClient({ tourId: tour.id, status });
      const readable = label ?? TOUR_STATUS_META[status].label.toLowerCase();
      setAnnouncement(`Tour ${readable}.`);
    } catch (error) {
      console.error("[dashboard/tours] Failed to update tour", error);
      updateOptimistic(tour);
      setAnnouncement("Unable to update the tour right now.");
    } finally {
      setPendingId(null);
    }
  };

  const handleAction = async (tour: Tour, action: TourAction) => {
    if (!isActionableStatus(action.status)) {
      return;
    }
    await mutateStatus(tour, action.status, action.label.toLowerCase());
  };

  const handleStatusSelect = (tour: Tour, status: TourStatusActionValue) => {
    void mutateStatus(tour, status);
  };

  if (optimisticTours.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-brand-outline/60 bg-white px-6 py-10 text-center shadow-soft">
        <p className="text-lg font-semibold text-brand-dark">No tours scheduled yet</p>
        <p className="mt-2 text-sm text-text-muted">
          {isLandlord
            ? "Once renters request tours, you can confirm or update them here."
            : "Request a tour from a property page to see it appear here."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
      {optimisticTours.map((tour) => {
        const statusMeta = TOUR_STATUS_META[tour.status];
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

        return (
          <article
            key={tour.id}
            className="rounded-3xl border border-brand-outline/40 bg-white p-4 shadow-soft sm:p-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 items-start gap-4">
                <div className="relative hidden h-20 w-28 overflow-hidden rounded-2xl bg-neutral-100 sm:block">
                  {tour.propertyImage ? (
                    <Image
                      src={tour.propertyImage}
                      alt={tour.propertyTitle}
                      fill
                      sizes="160px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-brand-dark">{tour.propertyTitle}</h2>
                  <p className="text-sm text-text-muted">
                    {formatTourDate(tour.scheduledAt, localTimezone)}{" "}
                    <span className="text-xs">(local: {localTimezone})</span>
                  </p>
                  {tour.notes ? (
                    <p className="text-sm text-text-muted">
                      <span className="font-semibold text-brand-dark">Notes:</span> {tour.notes}
                    </p>
                  ) : null}
                </div>
              </div>
              <StatusBadge status={tour.status} />
            </div>

            {actions.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-3">
                {actions.map((action) => (
                  <Button
                    key={`${tour.id}-${action.status}`}
                    variant={action.tone === "danger" ? "danger" : "primary"}
                    size="sm"
                    onClick={() => handleAction(tour, action)}
                    disabled={pendingId === tour.id}
                    aria-label={action.label}
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
                    disabled={pendingId === tour.id}
                    onSelect={(status) => handleStatusSelect(tour, status)}
                  />
                ) : null}
              </div>
            ) : (
              <p className="mt-4 text-sm text-text-muted">
                This tour is <span className="font-semibold">{statusMeta.label.toLowerCase()}</span>. No
                further actions are available.
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: TourStatus }) {
  const meta = TOUR_STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ring-1 ring-inset ${meta.badgeClass}`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {meta.label}
      {status === "completed" && <CheckIcon className="h-4 w-4 text-emerald-600" aria-hidden="true" />}
    </span>
  );
}

function formatTourDate(value: string, timeZone: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone
  }).format(new Date(value));
}
