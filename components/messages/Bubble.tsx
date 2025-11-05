"use client";

import { Fragment } from "react";
import { CheckIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

type BubbleStatus = "sent" | "delivered" | "read";

type BubbleProps = {
  me?: boolean;
  text: string;
  time?: string;
  timeLabel?: string;
  status?: BubbleStatus;
};

export default function Bubble({ me = false, text, time, timeLabel, status }: BubbleProps) {
  const alignment = me ? "items-end" : "items-start";
  const bubbleClasses = me
    ? "bg-blue-600 text-white"
    : "bg-white text-slate-900 ring-1 ring-slate-200";

  return (
    <div className={clsx("flex flex-col gap-1 text-sm", alignment)} role="group" aria-label={text}>
      <p className={clsx("max-w-[80%] rounded-2xl px-4 py-2 leading-relaxed shadow-sm", bubbleClasses)}>
        {text}
      </p>
      {(time || (me && status)) && (
        <span className="flex items-center gap-1 text-[11px] text-slate-500">
          {time ? (
            <time dateTime={timeLabel ?? time} className="uppercase tracking-wide">
              {timeLabel ?? time}
            </time>
          ) : null}
          {me && status ? (
            <span className="flex items-center gap-[2px]" aria-label={`Message ${status}`}>
              {status === "read" ? (
                <Fragment>
                  <CheckIcon className="h-3 w-3 text-blue-200" aria-hidden="true" />
                  <CheckIcon className="h-3 w-3 text-blue-200" aria-hidden="true" />
                </Fragment>
              ) : (
                <CheckIcon className="h-3 w-3 text-blue-200" aria-hidden="true" />
              )}
            </span>
          ) : null}
        </span>
      )}
    </div>
  );
}
