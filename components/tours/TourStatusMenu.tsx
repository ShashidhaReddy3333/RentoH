"use client";

import { useEffect, useId, useRef, useState } from "react";
import clsx from "clsx";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

import { ACTIONABLE_TOUR_STATUSES, TOUR_STATUS_META, type TourStatusActionValue } from "@/lib/tours/status";
import type { TourStatus } from "@/lib/types";

type TourStatusMenuProps = {
  tourId: string;
  currentStatus: TourStatus;
  allowedStatuses: TourStatusActionValue[];
  disabled?: boolean;
  onSelect: (status: TourStatusActionValue) => void;
};

export function TourStatusMenu({
  tourId,
  currentStatus,
  allowedStatuses,
  disabled = false,
  onSelect
}: TourStatusMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [announce, setAnnounce] = useState(" ");
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClick(event: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const toggleMenu = () => {
    if (disabled || allowedStatuses.length === 0) {
      return;
    }
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (status: TourStatusActionValue) => {
    setIsOpen(false);
    if (disabled) return;
    if (status === currentStatus) {
      setAnnounce(`${tourId} already ${status}`);
      return;
    }
    onSelect(status);
    const meta = TOUR_STATUS_META[status];
    setAnnounce(`Tour ${meta.label.toLowerCase()}`);
  };

  const buttonLabel = allowedStatuses.length === 0 ? "Status locked" : "Manage status";

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className={clsx(
          "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
          allowedStatuses.length === 0 || disabled
            ? "cursor-not-allowed border-brand-outline/60 bg-surface text-neutral-400"
            : "border-brand-outline/70 bg-white text-brand-dark hover:border-brand-primary hover:text-brand-primary"
        )}
        onClick={toggleMenu}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        disabled={disabled || allowedStatuses.length === 0}
        data-testid={`tour-status-menu-${tourId}`}
      >
        {buttonLabel}
        <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {announce}
      </span>
      {isOpen ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Update tour status"
          className="absolute right-0 z-30 mt-2 w-64 rounded-2xl border border-brand-outline/60 bg-white p-2 text-sm shadow-2xl"
        >
          {ACTIONABLE_TOUR_STATUSES.map((status) => {
            const meta = TOUR_STATUS_META[status];
            const isAllowed = allowedStatuses.includes(status);
            const isActive = currentStatus === status;
            return (
              <button
                key={status}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                disabled={!isAllowed || isActive || disabled}
                onClick={() => handleSelect(status)}
                className={clsx(
                  "flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left transition",
                  isActive
                    ? "bg-brand-primary/10 text-brand-primary"
                    : isAllowed
                      ? "hover:bg-brand-primary/5"
                      : "cursor-not-allowed opacity-50"
                )}
              >
                <meta.icon className="mt-0.5 h-4 w-4" aria-hidden="true" />
                <span>
                  <span className="font-semibold text-brand-dark">{meta.label}</span>
                  <span className="mt-0.5 block text-xs text-text-muted">{meta.description}</span>
                  {!isAllowed && !isActive ? (
                    <em className="mt-1 block text-[11px] text-text-muted">Not available from current status</em>
                  ) : null}
                </span>
              </button>
            );
          })}
          {allowedStatuses.length === 0 ? (
            <p className="rounded-xl bg-brand-light px-3 py-2 text-xs text-text-muted">
              No additional status changes are available once a tour is {currentStatus}.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
