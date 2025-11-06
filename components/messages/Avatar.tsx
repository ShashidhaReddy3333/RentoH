"use client";

import clsx from "clsx";

type AvatarProps = {
  initials?: string;
  online?: boolean;
  className?: string;
};

function getInitials(input?: string) {
  if (!input) return "??";
  const parts = input
    .split(" ")
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) return input.slice(0, 2).toUpperCase();
  return parts.join("").toUpperCase();
}

export default function Avatar({ initials, online = false, className }: AvatarProps) {
  const label = initials ?? "";
  return (
    <span className={clsx("relative inline-flex h-10 w-10 shrink-0", className)}>
      <span
        aria-label={label ? `Avatar for ${label}` : undefined}
        className="flex h-full w-full items-center justify-center rounded-full bg-brand-primaryMuted text-sm font-semibold uppercase tracking-wide text-brand-primary"
      >
        {getInitials(initials)}
      </span>
      {online ? (
        <span
          className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-success"
          aria-label="Online"
        />
      ) : null}
    </span>
  );
}
