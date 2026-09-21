"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SpeechRows } from "./ContentView";
import { getSpeechContentPage } from "../services/content.service";
import type { ContentItem } from "../types";

export function SpeechArchiveView({ initial }: { initial: { items: ContentItem[]; nextCursor: string | null } }) {
  const [items, setItems] = useState(initial.items);
  const [cursor, setCursor] = useState(initial.nextCursor);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const more = async () => {
    if (!cursor || busy) return;
    setBusy(true); setError("");
    try {
      const page = await getSpeechContentPage(cursor);
      setItems((current) => {
        const ids = new Set(current.map((item) => item.apiId));
        return [...current, ...page.items.filter((item) => !ids.has(item.apiId))];
      });
      setCursor(page.nextCursor);
    } catch {
      setError("دریافت موارد بیشتر ممکن نشد.");
    } finally { setBusy(false); }
  };
  return <main className="min-h-full bg-background px-3 pb-24 pt-5 text-foreground sm:px-4" dir="rtl"><Link href="/content" className="inline-flex items-center gap-1 text-xs text-muted-foreground"><ChevronRight className="h-4 w-4" />صفحه محتوا</Link><h1 className="mb-1 mt-5 text-lg font-black">سخنرانی‌ها و یادداشت‌ها</h1><p className="mb-5 text-xs text-muted-foreground">همهٔ محتواهای نوع سخنرانی</p><SpeechRows items={items} />{cursor ? <button type="button" onClick={() => void more()} disabled={busy} className="mt-4 w-full rounded-control border border-border bg-surface px-4 py-3 text-xs font-bold disabled:opacity-50">{busy ? "در حال دریافت…" : "نمایش موارد بیشتر"}</button> : null}{error ? <p role="alert" className="mt-3 text-xs text-danger-foreground">{error}</p> : null}</main>;
}
