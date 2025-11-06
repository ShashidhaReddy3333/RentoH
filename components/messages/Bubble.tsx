"use client";

import clsx from "clsx";
import { CheckIcon } from "@heroicons/react/24/solid";
import { Fragment } from "react";

type BubbleStatus = "sent" | "delivered" | "read";

type BubbleProps = {
  me?: boolean;
  text: string;
  time?: string;
  timeLabel?: string;
  status?: BubbleStatus;
};

const statusLabels: Record<BubbleStatus, string> = {
  sent: "Message sent",
  delivered: "Message delivered",
  read: "Message read"
};

export default function Bubble({ me = false, text, time, timeLabel, status }: BubbleProps) {
  const alignment = me ? "items-end" : "items-start";
  const bubbleClasses = me
    ? "bg-brand-primary text-white"
    : "bg-brand-light text-brand-dark ring-1 ring-brand-outline/60";

  return (
    <div className={clsx("flex flex-col gap-1 text-sm", alignment)} role="group" aria-label={text}>
      <p className={clsx("max-w-[80%] rounded-2xl px-4 py-2 leading-relaxed shadow-sm", bubbleClasses)}>
        {text}
      </p>
      {(time || (me && status)) && (
        <span className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-neutral-500">
          {time ? (
            <time dateTime={timeLabel ?? time}>{timeLabel ?? time}</time>
          ) : null}
          {me && status ? (
            <span className="flex items-center gap-[2px]" aria-label={statusLabels[status]}>
              {status === "read" ? (
                <Fragment>
                  <CheckIcon className="h-3 w-3 text-brand-primaryMuted" aria-hidden="true" />
                  <CheckIcon className="h-3 w-3 text-brand-primaryMuted" aria-hidden="true" />
                </Fragment>
              ) : (
                <CheckIcon className="h-3 w-3 text-brand-primaryMuted" aria-hidden="true" />
              )}
            </span>
          ) : null}
        </span>
      )}
    </div>
  );
}
