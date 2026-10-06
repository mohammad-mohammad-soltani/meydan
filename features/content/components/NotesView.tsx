"use client";

import "../reference-notes.css";
import Link from "next/link";
import type { Route } from "next";
import { Bookmark, LoaderCircle, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthGate } from "@/components/providers/AuthGateProvider";
import { meydanApi } from "@/lib/meydan-api";
import { getNotesHub, type NotesHub } from "../services/hub.service";
import { useViewerStates } from "../hooks/use-viewer-states";
import type { ContentItem } from "../types";
import { NoteMeta, NoteQuote, noteBackground, shortJalali } from "./note-ui";

function SaveButton({ item, bookmarked }: { item: ContentItem; bookmarked?: boolean }) {
  const { requireAuth } = useAuthGate();
  const [override, setSaved] = useState<boolean | null>(null);
  const saved = override ?? Boolean(bookmarked ?? item.bookmarked);
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      className={`nv-bm ${saved ? "on" : ""}`}
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
    >
      <Bookmark aria-hidden="true" width={17} height={17} strokeWidth={2} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}

function NoteRow({ item, index, bookmarked }: { item: ContentItem; index: number; bookmarked?: boolean }) {
  return (
    <article className="nv-row">
      <div className="nv-tx">
        {item.categoryName ? <span className="nv-cat">{item.categoryName}</span> : null}
        <h3>
          <Link href={`/content/${item.id}` as Route} className="nv-lnk">{item.title}</Link>
        </h3>
        {item.description ? <p>{item.description}</p> : null}
        <NoteMeta author={{ name: item.author, avatar: item.authorAvatar, href: item.authorHref, verified: item.authorVerified, speaker: item.authorSpeaker, official: item.authorOfficial, kind: item.authorKind }} date={shortJalali(item.publishedAt)} minutes={item.readingMinutes}>
          <SaveButton item={item} bookmarked={bookmarked} />
        </NoteMeta>
      </div>
      <div className={`nv-th ${item.coverUrl ? "" : "ph"}`} style={noteBackground(item.coverUrl, index)} aria-hidden="true">
        {item.coverUrl ? null : <NoteQuote />}
      </div>
    </article>
  );
}

/** «یادداشت»: search, «برگزیده‌ها», category chips and the newest notes. */
export function NotesView({ initial }: { initial: NotesHub }) {
  const [found, setFound] = useState<{ query: string; hub: NotesHub } | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const text = query.trim();
  const searching = text.length > 0;
  const busy = searching && found?.query !== text;
  const hub = !searching ? initial : found?.query === text ? found.hub : { ...initial, featured: [], latest: [] };
  const states = useViewerStates(hub.latest.map((item) => item.apiId));
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
    <div className="nv">
      <div className="nv-sq">
        <label className="av-s">
          <Search aria-hidden="true" width={19} height={19} strokeWidth={2} />
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جستجوی زنده در یادداشت‌ها، نویسنده‌ها و دسته‌ها…" autoComplete="off" />
          {busy ? <LoaderCircle aria-label="در حال جستجو" className="animate-spin" width={16} height={16} /> : null}
        </label>
      </div>

      {!searching && hub.featured.length ? (
        <>
          <div className="nv-sh">برگزیده‌ها</div>
          <div className="nv-feat">
            {hub.featured.map((item, index) => (
              <Link key={item.apiId} href={`/content/${item.id}` as Route} className={`nv-fc ${item.coverUrl ? "" : "noimg"}`} style={noteBackground(item.coverUrl, index)}>
                {item.categoryName ? <span className="nv-cat">{item.categoryName}</span> : <span />}
                {item.coverUrl ? null : <NoteQuote />}
                <div>
                  <h3>{item.title}</h3>
                  <small>{[item.author, item.readingMinutes ? `${item.readingMinutes.toLocaleString("fa-IR")} دقیقه` : ""].filter(Boolean).join(" · ")}</small>
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : null}

      {!searching && hub.categories.length ? (
        <div className="nv-chips" role="tablist" aria-label="دسته‌های یادداشت">
          {[{ slug: "", name: "همه" }, ...hub.categories].map((entry) => (
            <button key={entry.slug || "all"} type="button" role="tab" aria-selected={category === entry.slug} className={category === entry.slug ? "on" : ""} onClick={() => setCategory(entry.slug)}>
              {entry.name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="nv-sh">{searching ? `نتایج «${text}»` : "تازه‌ترین‌ها"}</div>
      <div className="nv-list">
        {list.length ? list.map((item, index) => <NoteRow key={item.apiId} item={item} index={index} bookmarked={states[String(item.apiId)]?.bookmarked} />) : busy ? null : <div className="nv-empty">{searching ? "موردی پیدا نشد." : "یادداشتی در این دسته نیست."}</div>}
      </div>
    </div>
  );
}
