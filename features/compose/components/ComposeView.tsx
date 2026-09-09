"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export function ComposeView() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const fieldClass = "mt-1.5 w-full rounded-control border border-input-border bg-input px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-placeholder hover:border-input-border-hover focus:border-ring focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <section className="space-y-5 bg-background p-4 text-foreground" aria-labelledby="compose-title">
      <header><h1 id="compose-title" className="text-base font-black text-foreground">ثبت روایت میدان</h1><p className="mt-1 text-xs leading-6 text-muted-foreground">روایت، خبر یا فراخوان خود را برای بررسی و انتشار ثبت کنید.</p></header>
      <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); if (title.trim() && body.trim()) setSubmitted(true); }}>
        <label className="block text-xs font-bold text-foreground-secondary">عنوان<input required value={title} onChange={(event) => setTitle(event.target.value)} className={fieldClass} /></label>
        <label className="block text-xs font-bold text-foreground-secondary">متن روایت<textarea required value={body} onChange={(event) => setBody(event.target.value)} rows={7} className={`${fieldClass} resize-y`} /></label>
        <button type="submit" className="inline-flex items-center gap-2 rounded-control bg-brand px-4 py-2.5 text-xs font-bold text-brand-foreground transition-colors hover:bg-brand-hover"><Send className="h-4 w-4" />ارسال برای بررسی</button>
      </form>
      {submitted ? <p role="status" className="rounded-control border border-success-border bg-success-surface p-3 text-xs text-success-foreground">روایت شما آمادهٔ ارسال است. اتصال به سرویس انتشار در گام بعدی فعال می‌شود.</p> : null}
    </section>
  );
}
