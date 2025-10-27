import { Skeleton } from '@/components/ui/skeleton';

export default function MessagesLoading() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-96" />
      </header>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Chat list skeleton */}
        <div className="space-y-4 rounded-3xl border border-black/5 bg-white p-6 shadow-soft">
          <Skeleton className="h-6 w-32" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        </div>

        {/* Chat thread skeleton */}
        <div className="flex h-full flex-col rounded-3xl border border-black/5 bg-white shadow-soft">
          <header className="border-b border-black/5 px-6 py-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-3 w-56 mt-2" />
          </header>
          <div className="flex-1 space-y-4 px-6 py-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}
              >
                <Skeleton
                  className={`h-16 ${i % 2 === 0 ? 'w-3/4' : 'w-2/3'} rounded-3xl`}
                />
              </div>
            ))}
          </div>
          <div className="border-t border-black/5 p-4">
            <Skeleton className="h-12 w-full rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
