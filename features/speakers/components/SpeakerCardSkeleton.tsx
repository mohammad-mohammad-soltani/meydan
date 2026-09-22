export function SpeakerCardSkeleton() {
  return (
    <div className="flex w-full items-center justify-between gap-4 px-4 py-3" aria-hidden="true">
      <div className="flex min-w-0 items-center gap-3">
        <span className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-skeleton" />
        <span className="h-4 w-32 animate-pulse rounded-full bg-skeleton" />
      </div>
      <span className="h-9 w-20 shrink-0 animate-pulse rounded-pill bg-skeleton-highlight" />
    </div>
  );
}
