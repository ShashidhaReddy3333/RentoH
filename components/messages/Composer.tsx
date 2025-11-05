"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PaperAirplaneIcon, PaperClipIcon } from "@heroicons/react/24/solid";
import { FaceSmileIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

type ComposerProps = {
  disabled?: boolean;
  onSend: (text: string) => Promise<void>;
};

export default function Composer({ disabled = false, onSend }: ComposerProps) {
  const [value, setValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const resetHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, []);

  useEffect(() => {
    resetHeight();
  }, [value, resetHeight]);

  const handleSend = useCallback(async () => {
    if (!value.trim() || disabled || isSending) return;
    setIsSending(true);
    try {
      await onSend(value.trim());
      setValue("");
    } finally {
      setIsSending(false);
    }
  }, [value, disabled, isSending, onSend]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  return (
    <form
      className="border-t border-slate-200 bg-white px-4 py-3"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSend();
      }}
      aria-label="Message composer"
    >
      <fieldset className="flex flex-col gap-3" disabled={disabled || isSending}>
        <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Attach a file"
            title="Attach a file"
          >
            <PaperClipIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Insert emoji"
            title="Insert emoji"
          >
            <FaceSmileIcon className="h-5 w-5" />
          </button>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            onInput={resetHeight}
            placeholder="Type a message"
            rows={1}
            className={clsx(
              "max-h-[240px] w-full resize-none border-none bg-transparent py-1 text-sm text-slate-900 outline-none placeholder:text-slate-400",
              "focus-visible:outline-none"
            )}
            data-testid="message-input"
            aria-label="Type your message"
          />
          <button
            type="submit"
            className={clsx(
              "inline-flex h-10 min-w-[44px] items-center justify-center gap-1 rounded-full bg-blue-600 px-4 text-sm font-semibold text-white transition",
              "hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300"
            )}
            disabled={disabled || isSending || !value.trim()}
            data-testid="message-send"
          >
            <span>{isSending ? "Sending" : "Send"}</span>
            <PaperAirplaneIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <p className="text-xs text-slate-500" role="note">
          Press Enter to send | Shift+Enter adds a new line
        </p>
      </fieldset>
    </form>
  );
}
