import { AdminTableSkeleton } from "@/features/admin/components/AdminStateViews";

/**
 * Admin pages share one shape — a header, a filter row and a list — so a single
 * skeleton covers every route in the panel.
 */
export default function AdminLoading() {
  return (
    <div className="min-h-full bg-background">
      <div className="border-b border-divider bg-surface px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <span className="block h-4 w-40 animate-pulse rounded bg-skeleton" />
        <span className="mt-2 block h-3 w-64 animate-pulse rounded bg-skeleton-highlight" />
      </div>
      <div className="border-b border-divider bg-surface px-3 py-3 sm:px-4">
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <span key={index} className="block h-9 animate-pulse rounded-control bg-skeleton" />
          ))}
        </div>
      </div>
      <AdminTableSkeleton rows={6} />
    </div>
  );
}
