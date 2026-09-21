"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Headphones } from "lucide-react";
import { MusicVideoCard } from "./MusicVideoCards";
import { getMusicVideoContentPage } from "../services/content.service";
import type { ContentItem } from "../types";

export function MusicVideoArchiveView({ initial }: { initial: { items: ContentItem[]; nextCursor: string | null } }) {
  const [items, setItems] = useState(initial.items);
  const [cursor, setCursor] = useState(initial.nextCursor);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const more = async () => {
    if (!cursor || busy) return;
    setBusy(true);
    setError("");
    try {
      const page = await getMusicVideoContentPage(cursor);
      setItems((current) => {
        const ids = new Set(current.map((item) => item.apiId));
        return [...current, ...page.items.filter((item) => !ids.has(item.apiId))];
      });
      setCursor(page.nextCursor);
    } catch {
      setError("دریافت آثار بیشتر ممکن نشد.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-full bg-background px-3 pb-24 pt-5 text-foreground sm:px-4" dir="rtl">
      <Link href="/content" className="inline-flex items-center gap-1 text-xs text-muted-foreground"><ChevronRight className="h-4 w-4" />صفحه محتوا</Link>
      <div className="mb-5 mt-5 flex items-center gap-2"><Headphones className="h-5 w-5 text-brand" /><h1 className="text-lg font-black">آوا و نوا</h1></div>
      {items.length ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => <MusicVideoCard key={item.apiId} item={item} layout="grid" />)}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-border p-5 text-center text-xs text-muted-foreground">هنوز اثری در آوا و نوا منتشر نشده است.</p>
      )}
      {cursor ? <button type="button" onClick={() => void more()} disabled={busy} className="mt-6 w-full rounded-control border border-border bg-surface px-4 py-3 text-xs font-bold disabled:opacity-50">{busy ? "در حال دریافت…" : "نمایش آثار بیشتر"}</button> : null}
      {error ? <p role="alert" className="mt-3 text-xs text-danger-foreground">{error}</p> : null}
    </main>
  );
}
