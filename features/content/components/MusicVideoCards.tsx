import Link from "next/link";
import type { Route } from "next";
import { Headphones } from "lucide-react";
import type { ContentItem } from "../types";

export function MusicVideoCard({ item, layout = "strip" }: { item: ContentItem; layout?: "strip" | "grid" }) {
  const artwork = item.coverUrl || item.authorAvatar;

  return (
    <Link href={`/content/${item.apiId}` as Route} className={`group block snap-start text-center ${layout === "grid" ? "w-full" : "w-[140px] shrink-0 sm:w-[156px]"}`} aria-label={`مشاهده ${item.title}`}>
      <span className="relative grid aspect-square w-full place-items-center overflow-hidden rounded-xl bg-surface-muted text-icon-muted">
        {artwork ? (
          <img src={artwork} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <Headphones aria-hidden="true" className="h-12 w-12" strokeWidth={1.5} />
        )}
      </span>
      <strong className="mt-2 block truncate text-xs font-black text-foreground">{item.title}</strong>
      <span className="mt-1 block truncate text-[11px] text-muted-foreground">{item.author || "تولیدکننده نامشخص"}</span>
    </Link>
  );
}

export function MusicVideoStrip({ items }: { items: ContentItem[] }) {
  if (!items.length) {
    return <p className="rounded-2xl border border-dashed border-border p-5 text-center text-xs text-muted-foreground">هنوز اثری در آوا و نوا منتشر نشده است.</p>;
  }

  return (
    <div className="-mx-3 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-3 pb-2 sm:-mx-4 sm:px-4" dir="rtl" aria-label="آثار آوا و نوا">
      {items.map((item) => <MusicVideoCard key={item.apiId} item={item} />)}
    </div>
  );
}
