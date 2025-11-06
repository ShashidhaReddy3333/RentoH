import { cva } from "class-variance-authority";
import clsx from "clsx";

type ToastTone = "success" | "error" | "info";

const toastVariants = cva(
  "rounded-2xl border px-4 py-3 text-sm font-medium",
  {
    variants: {
      tone: {
        success: "border-brand-success/40 bg-brand-successMuted text-brand-success",
        error: "border-danger/40 bg-danger-muted text-danger",
        info: "border-brand-primary/30 bg-brand-primaryMuted text-brand-primaryStrong"
      }
    },
    defaultVariants: {
      tone: "info"
    }
  }
);

type ToastBannerProps = {
  tone: ToastTone;
  message: string;
  role?: "alert" | "status";
  className?: string;
};

export function ToastBanner({ tone, message, role = "status", className }: ToastBannerProps) {
  if (!message) {
    return null;
  }

  return (
    <div role={role} className={clsx(toastVariants({ tone }), className)}>
      {message}
    </div>
  );
}

type AutoSaveNoticeProps = {
  message: string | null;
  className?: string;
};

export function AutoSaveNotice({ message, className }: AutoSaveNoticeProps) {
  if (!message) {
    return null;
  }

  return (
    <p
      role="status"
      className={clsx(
        "rounded-xl border border-brand-outline/50 bg-brand-primaryMuted/40 px-3 py-2 text-sm text-brand-primary",
        className
      )}
    >
      {message}
    </p>
  );
}

