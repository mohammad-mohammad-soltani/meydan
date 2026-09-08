"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="grid min-h-[50dvh] place-items-center p-6 text-center"><section><h1 className="text-lg font-black text-slate-900 dark:text-white">مشکلی پیش آمد</h1><p className="mt-2 text-sm text-slate-500">لطفاً دوباره تلاش کنید.</p><button type="button" onClick={reset} className="mt-5 rounded-xl bg-brand-red px-4 py-2.5 text-sm font-bold text-white">تلاش دوباره</button></section></main>;
}
