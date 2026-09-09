"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-[50dvh] place-items-center bg-background p-6 text-center text-foreground">
      <section className="rounded-panel border border-border bg-card p-6 shadow-card">
        <h1 className="text-lg font-black text-foreground">مشکلی پیش آمد</h1>
        <p className="mt-2 text-sm text-muted-foreground">لطفاً دوباره تلاش کنید.</p>
        <button type="button" onClick={reset} className="mt-5 rounded-control bg-brand px-4 py-2.5 text-sm font-bold text-brand-foreground transition-colors hover:bg-brand-hover">تلاش دوباره</button>
      </section>
    </main>
  );
}
