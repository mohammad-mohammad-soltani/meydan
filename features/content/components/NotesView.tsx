"use client";

import "../reference-content.css";
import Link from "next/link";
import type { Route } from "next";
import { Bookmark, Clock, LoaderCircle, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthGate } from "@/components/providers/AuthGateProvider";
import { meydanApi } from "@/lib/meydan-api";
import { hueOf, relativeFa } from "@/lib/relative-fa";
import { getNotesHub, type NotesHub } from "../services/hub.service";
import type { ContentItem } from "../types";

const faNumber = new Intl.NumberFormat("fa-IR");
const cover = (item: ContentItem) =>
  item.coverUrl
    ? `linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.7)), url(${item.coverUrl}) center/cover`
    : `linear-gradient(145deg,hsl(${hueOf(item.title)} 55% 36%),hsl(${(hueOf(item.title) + 50) % 360} 50% 18%))`;

function Initials({ name }: { name?: string }) {
  const words = (name ?? "").split(/\s+/).filter(Boolean);
  return <i className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface-muted text-[9px] font-black not-italic text-foreground">{(words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")}</i>;
}

function Meta({ item }: { item: ContentItem }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
      <Initials name={item.author} />
      <span className="truncate">{item.author}</span>
      <span aria-hidden="true">·</span>
      <span className="shrink-0">{relativeFa(item.publishedAt)}</span>
      {item.readingMinutes ? (
        <>
          <span aria-hidden="true">·</span>
          <span className="inline-flex shrink-0 items-center gap-0.5"><Clock aria-hidden="true" className="h-3 w-3" />{faNumber.format(item.readingMinutes)} دقیقه</span>
        </>
      ) : null}
    </span>
  );
}

function SaveButton({ item }: { item: ContentItem }) {
  const { requireAuth } = useAuthGate();
  const [saved, setSaved] = useState(Boolean(item.bookmarked));
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? "برداشتن از ذخیره‌شده‌ها" : "ذخیره"}
      disabled={pending}
      onClick={async (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!requireAuth("/content?tab=notes")) return;
        const next = !saved;
        setSaved(next);
        setPending(true);
        try {
          await meydanApi(`/content/${item.apiId}/bookmark`, { method: next ? "PUT" : "DELETE" });
        } catch {
          setSaved(!next);
        } finally {
          setPending(false);
        }
      }}
      className={`ms-auto grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors hover:bg-hover ${saved ? "text-brand" : "text-muted-foreground"}`}
    >
      <Bookmark aria-hidden="true" className={`h-[17px] w-[17px] ${saved ? "fill-current" : ""}`} />
    </button>
  );
}

function NoteRow({ item }: { item: ContentItem }) {
  return (
    <article className="relative">
      <Link href={`/content/${item.id}` as Route} className="flex gap-3.5 px-[18px] py-[18px] transition-colors hover:bg-hover">
        <span className="min-w-0 flex-1">
          {item.categoryName ? <span className="inline-block rounded-full bg-surface-muted px-2.5 py-0.5 text-[10px] font-bold text-foreground-secondary">{item.categoryName}</span> : null}
          <h3 className="mt-1.5 line-clamp-2 text-[15.5px] font-black leading-[1.7] text-foreground">{item.title}</h3>
          {item.description ? <p className="mt-1 line-clamp-2 text-[12.5px] leading-[1.9] text-muted-foreground">{item.description}</p> : null}
          <span className="mt-2.5 flex items-center"><Meta item={item} /></span>
        </span>
        <span
          aria-hidden="true"
          className="h-24 w-24 shrink-0 self-center rounded-2xl"
          style={{ background: item.coverUrl ? `url(${item.coverUrl}) center/cover` : `linear-gradient(140deg,hsl(${hueOf(item.title)} 65% 94%),hsl(${(hueOf(item.title) + 50) % 360} 60% 88%))` }}
        />
      </Link>
      <span className="absolute bottom-3 left-3"><SaveButton item={item} /></span>
    </article>
  );
}

/** «یادداشت»: featured notes, category chips, live search and the newest notes. */
export function NotesView({ initial }: { initial: NotesHub }) {
  const [found, setFound] = useState<{ query: string; hub: NotesHub } | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const text = query.trim();
  const searching = text.length > 0;
  const busy = searching && found?.query !== text;
  const hub = !searching ? initial : found?.query === text ? found.hub : { ...initial, featured: [], latest: [] };
  const list = category ? hub.latest.filter((item) => item.categorySlug === category) : hub.latest;

  useEffect(() => {
    if (!text) return;
    let active = true;
    const timer = window.setTimeout(() => {
      void getNotesHub(text)
        .then((next) => { if (active) setFound({ query: text, hub: next }); })
        .catch(() => { if (active) setFound({ query: text, hub: { categories: [], featured: [], latest: [] } }); });
    }, 280);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [text]);

  return (
    <div className="reference-notes pb-24" dir="rtl">
      <div className="px-[18px] pt-4">
        <label className="flex items-center gap-2.5 rounded-full border border-border bg-surface-muted px-[18px] py-3">
          <Search aria-hidden="true" className="h-[18px] w-[18px] shrink-0 text-icon-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="جستجوی زنده در یادداشت‌ها، نویسنده‌ها و دسته‌ها…"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-placeholder"
          />
          {busy ? <LoaderCircle aria-label="در حال جستجو" className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
        </label>
      </div>

      {!searching && hub.featured.length ? (
        <section aria-label="برگزیده‌ها" className="pt-5">
          <h2 className="mb-3 px-[18px] text-base font-black text-foreground">برگزیده‌ها</h2>
          <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-[18px]">
            {hub.featured.map((item) => (
              <Link
                key={item.apiId}
                href={`/content/${item.id}` as Route}
                className="relative flex aspect-[1.5/1] w-[78%] max-w-[340px] shrink-0 snap-start flex-col justify-end overflow-hidden rounded-[22px] p-3.5 text-white"
                style={{ background: cover(item) }}
              >
                {item.categoryName ? <span className="absolute right-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-bold backdrop-blur">{item.categoryName}</span> : null}
                <b className="line-clamp-2 text-base font-black leading-[1.7]">{item.title}</b>
                <small className="mt-1 text-[11px] text-white/80">{[item.author, item.readingMinutes ? `${faNumber.format(item.readingMinutes)} دقیقه` : ""].filter(Boolean).join(" · ")}</small>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {!searching && hub.categories.length ? (
        <div className="sticky top-[50px] z-15 mt-2 no-scrollbar flex gap-2 overflow-x-auto border-b border-divider bg-background px-[18px] py-3" role="tablist" aria-label="دسته‌های یادداشت">
          {[{ slug: "", name: "همه" }, ...hub.categories].map((entry) => (
            <button
              key={entry.slug || "all"}
              type="button"
              role="tab"
              aria-selected={category === entry.slug}
              onClick={() => setCategory(entry.slug)}
              className={`shrink-0 rounded-full px-[18px] py-2 text-xs font-black transition-colors ${category === entry.slug ? "bg-foreground text-background" : "bg-surface-muted text-foreground-secondary hover:bg-hover"}`}
            >
              {entry.name}
            </button>
          ))}
        </div>
      ) : null}

      <section aria-label="تازه‌ترین‌ها" className={searching || !hub.categories.length ? "pt-4" : ""}>
        <h2 className="border-b border-divider px-[18px] pb-3 text-base font-black text-foreground">{searching ? `نتایج «${text}»` : "تازه‌ترین‌ها"}</h2>
        {list.length ? (
          <div className="divide-y divide-divider">{list.map((item) => <NoteRow key={item.apiId} item={item} />)}</div>
        ) : busy ? null : (
          <p className="px-6 py-14 text-center text-sm text-muted-foreground">{searching ? "موردی پیدا نشد." : "یادداشتی در این دسته نیست."}</p>
        )}
      </section>
    </div>
  );
}
