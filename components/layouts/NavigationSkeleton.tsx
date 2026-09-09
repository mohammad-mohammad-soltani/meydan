import type { HTMLAttributes } from "react";

type NavigationSkeletonProps = HTMLAttributes<HTMLDivElement>;

/** Immediate visual feedback while an App Router navigation resolves. */
export function NavigationSkeleton({ className = "", ...props }: NavigationSkeletonProps) {
  return (
    <div className={`overflow-hidden bg-background px-4 py-5 ${className}`} aria-busy="true" aria-live="polite" {...props}>
      <div className="mx-auto max-w-xl animate-pulse space-y-4">
        <div className="h-7 w-36 rounded-lg bg-skeleton" />
        <div className="rounded-card border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-skeleton" />
            <div className="min-w-0 flex-1 space-y-2"><div className="h-3 w-32 rounded bg-skeleton" /><div className="h-2.5 w-20 rounded bg-skeleton-highlight" /></div>
          </div>
          <div className="mt-5 space-y-2.5"><div className="h-3 w-full rounded bg-skeleton-highlight" /><div className="h-3 w-11/12 rounded bg-skeleton-highlight" /><div className="h-3 w-3/4 rounded bg-skeleton-highlight" /></div>
        </div>
        <div className="rounded-card border border-border p-4"><div className="h-3 w-2/5 rounded bg-skeleton" /><div className="mt-4 h-20 rounded-xl bg-skeleton-highlight" /></div>
      </div>
      <span className="sr-only">در حال باز کردن صفحه</span>
    </div>
  );
}
