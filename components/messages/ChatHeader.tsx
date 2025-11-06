"use client";

import Link from "next/link";
import type { Route } from "next";
import clsx from "clsx";

import Avatar from "./Avatar";
import Chip from "./Chip";

type ChatHeaderProps = {
  name: string;
  listingTitle?: string;
  listingUrl?: string;
  statusText?: string;
  initials?: string;
  online?: boolean;
  onSchedule?: () => void;
  onCall?: () => void;
  onReport?: () => void;
};

const headerButtonClasses =
  "inline-flex items-center rounded-full border border-brand-outline/60 px-3 py-1.5 text-xs font-semibold text-neutral-600 transition hover:border-brand-primary hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

export default function ChatHeader({
  name,
  listingTitle,
  listingUrl,
  statusText,
  initials,
  online,
  onSchedule,
  onCall,
  onReport
}: ChatHeaderProps) {
  const handleSchedule = () => onSchedule?.();
  const handleCall = () => onCall?.();
  const handleReport = () => onReport?.();

  return (
    <header className="flex items-center justify-between border-b border-brand-outline/60 bg-white px-4 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar initials={initials ?? name} online={online} />
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-brand-dark sm:text-base">{name}</h2>
          {statusText ? (
            <p className="truncate text-xs text-neutral-500" aria-live="polite">
              {statusText}
            </p>
          ) : null}
          {listingTitle ? (
            <div className="mt-1 flex flex-wrap gap-2">
              {listingUrl ? (
                <Chip>
                  <Link
                    href={listingUrl as Route}
                    className="hover:text-brand-primary focus:outline-none focus-visible:underline"
                  >
                    {listingTitle}
                  </Link>
                </Chip>
              ) : (
                <Chip>{listingTitle}</Chip>
              )}
            </div>
          ) : null}
        </div>
      </div>
      <div className="hidden items-center gap-2 sm:flex">
        <button type="button" onClick={handleSchedule} className={headerButtonClasses} aria-label="Schedule tour">
          Schedule
        </button>
        <button type="button" onClick={handleCall} className={headerButtonClasses} aria-label="Call contact">
          Call
        </button>
        <button
          type="button"
          onClick={handleReport}
          className={clsx(
            headerButtonClasses,
            "hover:border-danger hover:text-danger focus-visible:ring-danger/40"
          )}
          aria-label="Report conversation"
        >
          Report
        </button>
      </div>
    </header>
  );
}
