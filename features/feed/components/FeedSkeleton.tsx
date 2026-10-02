type FeedSkeletonProps = {
  items?: number;
};

/** One pulsing block; every skeleton in the app is built from these. */
export function Bone({ className = "" }: { className?: string }) {
  // A caller's own radius replaces the default; two radii in one class list resolve by stylesheet order, not intent.
  return <span aria-hidden="true" className={`block animate-pulse bg-skeleton ${/\brounded/.test(className) ? "" : "rounded-md"} ${className}`} />;
}

/**
 * A timeline card as it will look once loaded: header with the follow pill and
 * «…», a bold line plus body text, optional media, and the rounded action bar.
 */
export function PostCardSkeleton({ media = false, lines = 3 }: { media?: boolean; lines?: number }) {
  return (
    <article aria-hidden="true" className="px-4 py-4">
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <Bone className="h-10 w-10 shrink-0 rounded-full" />
          <div className="space-y-2">
            <Bone className="h-3.5 w-32" />
            <div className="flex items-center gap-1.5">
              <Bone className="h-[18px] w-14 rounded-full bg-skeleton-highlight" />
              <Bone className="h-2.5 w-16 bg-skeleton-highlight" />
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Bone className="h-7 w-[5.5rem] rounded-full" />
          <Bone className="h-8 w-8 rounded-full bg-skeleton-highlight" />
        </div>
      </div>
      <div className="mt-3 space-y-2.5">
        <Bone className="h-3.5 w-3/5" />
        {Array.from({ length: lines }, (_, index) => (
          <Bone key={index} className={`h-3 bg-skeleton-highlight ${index === lines - 1 ? "w-2/3" : index % 2 ? "w-11/12" : "w-full"}`} />
        ))}
      </div>
      {media ? <Bone className="mt-3 aspect-video w-full rounded-2xl" /> : null}
      <div className="mt-4 flex h-11 items-center justify-between rounded-full border border-border-strong bg-surface-muted px-4">
        {[0, 1, 2, 3, 4].map((index) => (
          <Bone key={index} className={`h-3.5 rounded-full bg-skeleton-highlight ${index === 4 ? "w-14" : "w-8"}`} />
        ))}
      </div>
    </article>
  );
}

export function FeedSkeleton({ items = 3 }: FeedSkeletonProps) {
  return (
    <div className="w-full" role="status" aria-busy="true" aria-label="در حال بارگذاری روایت‌ها">
      {Array.from({ length: items }, (_, index) => (
        <PostCardSkeleton key={index} media={index === 1} />
      ))}
      <span className="sr-only">در حال بارگذاری…</span>
    </div>
  );
}
