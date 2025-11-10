"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PaperAirplaneIcon, PaperClipIcon } from "@heroicons/react/24/solid";
import { FaceSmileIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

import { buttonStyles } from "@/components/ui/button";
import { uploadMessageAttachment, formatFileSize, getFileIcon, type UploadResult } from "@/lib/storage/attachments";

type ComposerProps = {
  disabled?: boolean;
  onSend: (text: string, attachment?: UploadResult) => Promise<void>;
  currentUserId?: string;
};

const iconButtonClasses =
  "inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition hover:bg-brand-light hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

export default function Composer({ disabled = false, onSend, currentUserId }: ComposerProps) {
  const [value, setValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [attachment, setAttachment] = useState<UploadResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      className="border-t border-brand-outline/60 bg-white px-4 py-4"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSend();
      }}
      aria-label="Message composer"
    >
      <fieldset className="flex flex-col gap-2" disabled={disabled || isSending}>
        <div className="flex items-end gap-2 rounded-2xl border border-brand-outline/60 bg-white px-3 py-2 shadow-sm focus-within:ring-1 focus-within:ring-brand-primary/30">
          <button
            type="button"
            className={iconButtonClasses}
            aria-label="Attach a file"
            title="Attach a file"
          >
            <PaperClipIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            className={iconButtonClasses}
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
            placeholder="Type your message..."
            rows={1}
            className="max-h-[240px] w-full resize-none border-none bg-transparent py-1 text-sm text-brand-dark placeholder:text-neutral-400 focus-visible:outline-none"
            data-testid="message-input"
            aria-label="Type your message"
          />
          <button
            type="submit"
            className={clsx(
              buttonStyles({ variant: "primary", size: "md" }),
              "min-w-[44px] gap-2 rounded-full px-4"
            )}
            disabled={disabled || isSending || !value.trim()}
            data-testid="message-send"
          >
            <span>{isSending ? "Sending..." : "Send"}</span>
            <PaperAirplaneIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <p className="text-xs text-neutral-500" role="note">
          Press Enter to send | Shift+Enter adds a new line
        </p>
      </fieldset>
    </form>
  );
}
