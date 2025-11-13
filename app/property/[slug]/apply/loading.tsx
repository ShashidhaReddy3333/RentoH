import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingApplicationForm() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8" role="status" aria-live="polite">
      <span className="sr-only">Loading application form…</span>
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="mt-6 space-y-6 rounded-3xl border border-brand-outline/60 bg-white/80 p-6 shadow-sm">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
        <div className="flex flex-col gap-3 border-t border-brand-outline/40 pt-4 sm:flex-row sm:justify-end">
          <Skeleton className="h-11 w-full rounded-full sm:w-32" />
          <Skeleton className="h-11 w-full rounded-full sm:w-40" />
        </div>
      </div>
    </div>
  );
}
