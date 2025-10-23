"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import type { ReactNode } from "react";

import { buttonStyles } from "@/components/ui/button";

type ConfirmDialogProps = {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  children: ReactNode;
  onConfirm: () => void | Promise<void>;
  destructive?: boolean;
};

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  children,
  onConfirm,
  destructive = true
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>{children}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-black/10 bg-white p-6 shadow-soft data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-90 data-[state=open]:zoom-in-95 data-[state=closed]:fade-out-90 data-[state=closed]:zoom-out-95 focus:outline-none">
          <div className="space-y-2 text-left">
            <AlertDialog.Title className="text-lg font-semibold text-brand-dark">
              {title}
            </AlertDialog.Title>
            <AlertDialog.Description className="text-sm text-text-muted">
              {description}
            </AlertDialog.Description>
          </div>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel asChild>
              <button
                type="button"
                className={buttonStyles({ variant: "ghost", size: "md" })}
              >
                {cancelLabel}
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                type="button"
                className={buttonStyles({
                  variant: destructive ? "destructive" : "primary",
                  size: "md"
                })}
                onClick={() => {
                  void onConfirm();
                }}
              >
                {confirmLabel}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
