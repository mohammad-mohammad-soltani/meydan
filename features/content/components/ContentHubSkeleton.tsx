/** Placeholder shown for a split second while a neighbouring hub tab is being fetched mid-swipe. */
export function ContentHubSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-5 px-4 py-5" aria-hidden="true">
      <div className="h-40 w-full rounded-2xl bg-skeleton" />
      <div className="flex gap-2">
        <span className="h-8 w-20 rounded-full bg-skeleton" />
        <span className="h-8 w-16 rounded-full bg-skeleton-highlight" />
        <span className="h-8 w-24 rounded-full bg-skeleton" />
      </div>
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex items-center gap-3">
          <span className="h-12 w-12 shrink-0 rounded-full bg-skeleton" />
          <div className="flex-1 space-y-2">
            <span className="block h-3 w-10/12 rounded-full bg-skeleton" />
            <span className="block h-2.5 w-1/2 rounded-full bg-skeleton-highlight" />
          </div>
        </div>
      ))}
    </div>
  );
}
