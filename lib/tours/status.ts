import {
  CheckCircleIcon,
  CheckBadgeIcon,
  ClockIcon,
  XCircleIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";

import type { TourStatus } from "@/lib/types";

type StatusMeta = {
  label: string;
  description: string;
  badgeClass: string;
  textClass: string;
  icon: typeof CheckCircleIcon;
};

export const TOUR_STATUS_META: Record<TourStatus, StatusMeta> = {
  requested: {
    label: "Requested",
    description: "Waiting for landlord response",
    badgeClass: "bg-blue-50 text-blue-700 ring-blue-100",
    textClass: "text-blue-700",
    icon: ClockIcon
  },
  confirmed: {
    label: "Confirmed",
    description: "Locked in with the landlord",
    badgeClass: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    textClass: "text-emerald-700",
    icon: CheckCircleIcon
  },
  completed: {
    label: "Completed",
    description: "Tour took place",
    badgeClass: "bg-slate-100 text-slate-700 ring-slate-200",
    textClass: "text-slate-700",
    icon: CheckBadgeIcon
  },
  cancelled: {
    label: "Cancelled",
    description: "Tour was cancelled",
    badgeClass: "bg-rose-50 text-rose-700 ring-rose-100",
    textClass: "text-rose-700",
    icon: XCircleIcon
  },
  rescheduled: {
    label: "Rescheduled",
    description: "Awaiting confirmation for new time",
    badgeClass: "bg-amber-50 text-amber-700 ring-amber-100",
    textClass: "text-amber-700",
    icon: ArrowPathIcon
  }
};

export const FINAL_TOUR_STATUSES: TourStatus[] = ["completed", "cancelled"];

export type TourAction = {
  status: TourStatus;
  label: string;
  tone: "primary" | "danger";
  icon: typeof CheckCircleIcon;
};

export function landlordActionsFor(status: TourStatus): TourAction[] {
  switch (status) {
    case "requested":
      return [
        { status: "confirmed", label: "Confirm tour", tone: "primary", icon: CheckCircleIcon },
        { status: "cancelled", label: "Cancel tour", tone: "danger", icon: XCircleIcon }
      ];
    case "confirmed":
    case "rescheduled":
      return [
        { status: "completed", label: "Mark completed", tone: "primary", icon: CheckBadgeIcon },
        { status: "cancelled", label: "Cancel tour", tone: "danger", icon: XCircleIcon }
      ];
    default:
      return [];
  }
}

export function tenantActionsFor(status: TourStatus): TourAction[] {
  if (status === "completed" || status === "cancelled") {
    return [];
  }
  return [
    {
      status: "cancelled",
      label: "Cancel tour",
      tone: "danger",
      icon: XCircleIcon
    }
  ];
}
