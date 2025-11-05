"use client";

import clsx from "clsx";

import Avatar from "./Avatar";
import Chip from "./Chip";

type ConversationItemProps = {
  active?: boolean;
  name: string;
  lastMessage: string;
  tags?: string[];
  updatedText?: string;
  unreadCount?: number;
  onClick?: () => void;
};

function initialsFromName(name: string) {
  const parts = name
    .split(" ")
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) {
    return name.slice(0, 2).toUpperCase();
  }
  return parts.join("").toUpperCase();
}

export default function ConversationItem({
  active = false,
  name,
  lastMessage,
  tags,
  updatedText,
  unreadCount = 0,
  onClick
}: ConversationItemProps) {
  const hasUnread = unreadCount > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition",
        active ? "bg-white shadow-sm ring-1 ring-slate-200" : "hover:bg-slate-100"
      )}
      aria-pressed={active}
      data-testid={`conversation-${name.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}`}
    >
      <Avatar initials={initialsFromName(name)} className="mt-0.5" online={hasUnread} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="truncate text-sm font-semibold text-slate-900">{name}</span>
              {updatedText ? (
                <span className="text-xs text-slate-500" aria-label={`Updated ${updatedText}`}>
                  {updatedText}
                </span>
              ) : null}
            </div>
            <p className="line-clamp-2 text-xs text-slate-500">{lastMessage || "No messages yet."}</p>
          </div>
          {hasUnread ? (
            <span className="inline-flex min-w-[1.5rem] justify-center rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {unreadCount}
            </span>
          ) : null}
        </div>
        {tags && tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Chip key={tag}>{tag}</Chip>
            ))}
          </div>
        ) : null}
      </div>
    </button>
  );
}
