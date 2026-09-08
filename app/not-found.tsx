import Link from "next/link";

export default function NotFound() {
  return <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center dark:bg-[#070a0f]"><section><p className="text-5xl font-black text-brand-red">۴۰۴</p><h1 className="mt-4 text-lg font-black text-slate-900 dark:text-white">این صفحه پیدا نشد</h1><p className="mt-2 text-sm text-slate-500">نشانی را بررسی کنید یا به صفحهٔ اصلی برگردید.</p><Link href="/home" className="mt-6 inline-flex rounded-xl bg-brand-red px-4 py-2.5 text-sm font-bold text-white">بازگشت به خانه</Link></section></main>;
}
