"use client";

import { useState, type KeyboardEvent } from "react";

import { buttonStyles } from "@/components/ui/button";

type MessageInputProps = {
  threadId?: string;
  onSend: (text: string) => Promise<void>;
  disabled?: boolean;
};

export default function MessageInput({ threadId, onSend, disabled = false }: MessageInputProps) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!value.trim() || !threadId || sending || disabled) return;
    setSending(true);
    try {
      await onSend(value.trim());
      setValue("");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  return (
    <form
      className="rounded-3xl border border-black/5 bg-white p-4 shadow-soft"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSend();
      }}
    >
      <fieldset className="grid gap-3" disabled={sending || disabled}>
        <label htmlFor="message-textarea" className="sr-only">
          Message
        </label>
        <p id="message-input-hint" className="sr-only">
          Press Enter to send. Shift and Enter adds a new line.
        </p>
        <textarea
          id="message-textarea"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[120px] w-full resize-none rounded-2xl border border-black/5 bg-surface px-4 py-3 text-sm text-textc focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
          placeholder={threadId ? "Type your message..." : "Select a conversation to start chatting"}
          aria-describedby="message-input-hint"
          data-testid="message-input"
        />
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs text-text-muted">Enter to send • Shift + Enter for newline</span>
          <button
            type="submit"
            className={buttonStyles({ variant: "primary", size: "md" })}
            disabled={!value.trim() || !threadId || sending || disabled}
            data-testid="message-send"
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
