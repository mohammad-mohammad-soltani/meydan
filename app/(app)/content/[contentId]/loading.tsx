export default function ContentDetailLoading() {
  return (
    <section aria-busy="true" aria-live="polite" className="min-h-full animate-pulse bg-background">
      <div className="h-14 border-b border-border bg-surface" />
      <div className="aspect-[16/10] bg-skeleton sm:aspect-video" />
      <div className="space-y-4 p-4">
        <div className="rounded-panel border border-border bg-card p-5">
          <div className="h-6 w-24 rounded-full bg-skeleton" />
          <div className="mt-5 h-6 w-5/6 rounded-lg bg-skeleton" />
          <div className="mt-3 h-4 w-full rounded-lg bg-skeleton-highlight" />
          <div className="mt-2 h-4 w-4/5 rounded-lg bg-skeleton-highlight" />
          <div className="mt-6 h-12 rounded-2xl bg-skeleton" />
        </div>
        <div className="h-36 rounded-panel border border-border bg-card" />
        <div className="h-48 rounded-panel border border-border bg-card" />
      </div>
      <span className="sr-only">در حال بارگذاری محتوا</span>
    </section>
  );
}
