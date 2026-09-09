import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-6 text-center text-foreground">
      <section className="rounded-panel border border-border bg-card p-7 shadow-card">
        <p className="text-5xl font-black text-brand">۴۰۴</p>
        <h1 className="mt-4 text-lg font-black text-foreground">این صفحه پیدا نشد</h1>
        <p className="mt-2 text-sm text-muted-foreground">نشانی را بررسی کنید یا به صفحهٔ اصلی برگردید.</p>
        <Link href="/home" className="mt-6 inline-flex rounded-control bg-brand px-4 py-2.5 text-sm font-bold text-brand-foreground transition-colors hover:bg-brand-hover">بازگشت به خانه</Link>
      </section>
    </main>
  );
}
