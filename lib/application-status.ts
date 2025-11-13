import type { ApplicationStatus } from "@/lib/types";

export type CanonicalApplicationStatus =
  | "draft"
  | "submitted"
  | "reviewing"
  | "interview"
  | "accepted"
  | "rejected";

const STATUS_NORMALIZATION_MAP: Record<string, CanonicalApplicationStatus> = {
  draft: "draft",
  submitted: "submitted",
  reviewing: "reviewing",
  interview: "interview",
  accepted: "accepted",
  approved: "accepted",
  rejected: "rejected"
};

const STATUS_TRANSITIONS: Record<CanonicalApplicationStatus, CanonicalApplicationStatus[]> = {
  draft: ["submitted"],
  submitted: ["reviewing"],
  reviewing: ["interview", "accepted", "rejected"],
  interview: ["accepted", "rejected"],
  accepted: [],
  rejected: []
};

export function normalizeApplicationStatus(
  value: ApplicationStatus | string | null | undefined
): CanonicalApplicationStatus {
  if (!value) {
    return "submitted";
  }

  const key = String(value).toLowerCase();
  return STATUS_NORMALIZATION_MAP[key] ?? "submitted";
}

export function canonicalStatusToStorage(status: CanonicalApplicationStatus): ApplicationStatus {
  if (status === "accepted") {
    return "accepted";
  }
  return status;
}

export function isValidApplicationStatusTransition(
  current: ApplicationStatus | string,
  next: ApplicationStatus | string
): boolean {
  const currentNormalized = normalizeApplicationStatus(current);
  const nextNormalized = normalizeApplicationStatus(next);
  if (currentNormalized === nextNormalized) {
    return false;
  }
  const allowed = STATUS_TRANSITIONS[currentNormalized] ?? [];
  return allowed.includes(nextNormalized);
}

export function getNextStatusTimestamps(status: ApplicationStatus | string): {
  reviewed?: boolean;
  decision?: boolean;
} {
  const normalized = normalizeApplicationStatus(status);
  return {
    reviewed: normalized === "reviewing",
    decision: normalized === "accepted" || normalized === "rejected"
  };
}

export type ApplicationTimelineEntry = {
  status: CanonicalApplicationStatus;
  timestamp: string;
  note?: string | null;
};

export function appendTimelineEntry(
  timeline: unknown,
  entry: ApplicationTimelineEntry
): ApplicationTimelineEntry[] {
  const current = Array.isArray(timeline) ? timeline : [];
  return [...current, entry];
}
