import type { HTMLAttributes } from "react";

type NavigationSkeletonProps = HTMLAttributes<HTMLDivElement>;

/** Immediate visual feedback while an App Router navigation resolves. */
export function NavigationSkeleton({ className = "", ...props }: NavigationSkeletonProps) {
  return (
    <div className={`overflow-hidden bg-white px-4 py-5 dark:bg-[#070a0f] ${className}`} aria-busy="true" aria-live="polite" {...props}>
      <div className="mx-auto max-w-xl animate-pulse space-y-4">
        <div className="h-7 w-36 rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-2.5 w-20 rounded bg-slate-100 dark:bg-slate-900" />
            </div>
          </div>
          <div className="mt-5 space-y-2.5">
            <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-900" />
            <div className="h-3 w-11/12 rounded bg-slate-100 dark:bg-slate-900" />
            <div className="h-3 w-3/4 rounded bg-slate-100 dark:bg-slate-900" />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
          <div className="h-3 w-2/5 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="mt-4 h-20 rounded-xl bg-slate-100 dark:bg-slate-900" />
        </div>
      </div>
      <span className="sr-only">در حال باز کردن صفحه</span>
    </div>
  );
}
