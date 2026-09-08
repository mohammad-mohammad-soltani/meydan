"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export function ComposeView() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <section className="space-y-5 bg-white p-4 dark:bg-[#070a0f]" aria-labelledby="compose-title">
      <header><h1 id="compose-title" className="text-base font-black text-slate-950 dark:text-white">ثبت روایت میدان</h1><p className="mt-1 text-xs leading-6 text-slate-500">روایت، خبر یا فراخوان خود را برای بررسی و انتشار ثبت کنید.</p></header>
      <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); if (title.trim() && body.trim()) setSubmitted(true); }}>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">عنوان<input required value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand-red dark:border-slate-800 dark:bg-slate-900" /></label>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">متن روایت<textarea required value={body} onChange={(event) => setBody(event.target.value)} rows={7} className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand-red dark:border-slate-800 dark:bg-slate-900" /></label>
        <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-brand-red px-4 py-2.5 text-xs font-bold text-white transition hover:bg-red-700"><Send className="h-4 w-4" />ارسال برای بررسی</button>
      </form>
      {submitted ? <p role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">روایت شما آمادهٔ ارسال است. اتصال به سرویس انتشار در گام بعدی فعال می‌شود.</p> : null}
    </section>
  );
}
