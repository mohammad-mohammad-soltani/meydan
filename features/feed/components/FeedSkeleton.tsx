type FeedSkeletonProps = {
  items?: number;
};

function Block({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-surface-muted ${className}`} aria-hidden="true" />;
}

export function FeedSkeleton({ items = 3 }: FeedSkeletonProps) {
  return (
    <div className="w-full divide-y divide-divider" role="status" aria-busy="true" aria-label="در حال بارگذاری روایت‌ها">
      {Array.from({ length: items }, (_, index) => (
        <article key={index} className="px-4 py-5">
          <div className="flex items-start gap-3">
            <Block className="h-11 w-11 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <Block className="h-4 w-28" />
                <Block className="h-3 w-16" />
              </div>
              <Block className="h-4 w-4/5" />
              <Block className="h-4 w-full" />
              <Block className="h-4 w-3/5" />
              <Block className="mt-4 h-44 w-full rounded-panel" />
              <div className="flex items-center justify-between pt-2">
                <Block className="h-8 w-16 rounded-pill" />
                <Block className="h-8 w-16 rounded-pill" />
                <Block className="h-8 w-16 rounded-pill" />
                <Block className="h-8 w-12 rounded-pill" />
              </div>
            </div>
          </div>
        </article>
      ))}
      <span className="sr-only">در حال بارگذاری…</span>
    </div>
  );
}
