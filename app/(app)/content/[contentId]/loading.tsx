export default function ContentDetailLoading() {
  return (
    <section
      aria-busy="true"
      aria-live="polite"
      className="min-h-full animate-pulse bg-slate-50 dark:bg-[#070a0f]"
    >
      <div className="h-14 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40" />
      <div className="aspect-[16/10] bg-slate-200 dark:bg-slate-800 sm:aspect-video" />
      <div className="space-y-4 p-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/45">
          <div className="h-6 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="mt-5 h-6 w-5/6 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="mt-3 h-4 w-full rounded-lg bg-slate-100 dark:bg-slate-900" />
          <div className="mt-2 h-4 w-4/5 rounded-lg bg-slate-100 dark:bg-slate-900" />
          <div className="mt-6 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="h-36 rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/45" />
        <div className="h-48 rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/45" />
      </div>
      <span className="sr-only">در حال بارگذاری محتوا</span>
    </section>
  );
}
