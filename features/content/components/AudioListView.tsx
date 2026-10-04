"use client";

import Link from "next/link";
import type { Route } from "next";
import { ChevronRight, LoaderCircle, Pause, Play } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAudio } from "@/features/audio/AudioProvider";
import type { AudioTrack } from "@/features/audio/types";
import { OptimizedAvatar } from "@/components/shared/OptimizedAvatar";
import { hueOf, relativeFa } from "@/lib/relative-fa";
import { getAudioList, getProducerPage, type AudioListQuery, type HubProducer } from "../services/hub.service";
import type { ContentItem } from "../types";

const fa = new Intl.NumberFormat("fa-IR");

function trackOf(item: ContentItem): AudioTrack | null {
  // A music video that has no separate audio plays through its video file, sound only.
  const url = item.media.audioSrc ?? item.media.videoSrc;
  if (!url) return null;
  return { id: `ava:${item.apiId}`, title: item.title, artist: item.author, cover: item.coverUrl ?? item.media.coverImage, url, sourceHref: item.href ?? `/content/${item.id}` };
}

function Shell({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="min-h-full pb-24" dir="rtl">
      <header className="flex items-center gap-3 px-4 pb-3 pt-5">
        <Link href={"/content?tab=ava" as Route} aria-label="بازگشت" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-surface-muted text-icon hover:bg-hover"><ChevronRight aria-hidden="true" className="h-5 w-5" /></Link>
        <div className="min-w-0 flex-1"><h1 className="truncate text-xl font-black">{title}</h1>{subtitle ? <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{subtitle}</p> : null}</div>
        {action}
      </header>
      {children}
    </section>
  );
}

function Row({ item, queue }: { item: ContentItem; queue: ContentItem[] }) {
  const { currentTrack, isPlaying, playTrack, toggle } = useAudio();
  const track = trackOf(item);
  const current = Boolean(track && currentTrack?.id === track.id);
  return (
    <Link href={(item.href ?? `/content/${item.id}`) as Route} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-hover">
      <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl text-lg font-black text-white" style={{ background: item.coverUrl ? `url(${item.coverUrl}) center/cover` : `linear-gradient(145deg,hsl(${hueOf(item.title)} 55% 46%),hsl(${(hueOf(item.title) + 40) % 360} 50% 20%))` }}>
        {item.coverUrl ? null : (item.author || item.title).charAt(0)}
      </span>
      <span className="min-w-0 flex-1">
        <b className="block truncate text-sm font-black">{item.title}</b>
        <small className="mt-0.5 block truncate text-[11px] text-muted-foreground">{[item.author, item.series, relativeFa(item.publishedAt)].filter(Boolean).join(" · ")}</small>
      </span>
      {item.media.duration ? <span className="text-[11px] text-muted-foreground" dir="ltr">{item.media.duration}</span> : null}
      {track ? (
        <button
          type="button"
          aria-label={current && isPlaying ? "توقف" : "پخش"}
          onClick={(event) => {
            event.preventDefault();
            if (current) void toggle();
            else void playTrack(track, { queue: queue.map(trackOf).filter((value): value is AudioTrack => Boolean(value)) });
          }}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-surface-muted text-foreground"
        >
          {current && isPlaying ? <Pause aria-hidden="true" className="h-4 w-4 fill-current" /> : <Play aria-hidden="true" className="h-4 w-4 translate-x-px fill-current" />}
        </button>
      ) : null}
    </Link>
  );
}

/** A full, pageable list of audio: a shelf, a series or one producer's recordings. */
export function AudioListView({ title, subtitle, query, initialItems, initialCursor, action }: { title: string; subtitle?: string; query: AudioListQuery; initialItems: ContentItem[]; initialCursor: string | null; action?: ReactNode }) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const more = async () => {
    if (!cursor || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const page = await getAudioList(query, cursor);
      setItems((current) => [...current, ...page.items.filter((entry) => !current.some((known) => known.apiId === entry.apiId))]);
      setCursor(page.nextCursor);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell title={title} subtitle={subtitle} action={action}>
      {items.length === 0 ? (
        <p className="px-6 py-20 text-center text-sm text-muted-foreground">هنوز صوتی در این بخش نیست.</p>
      ) : (
        <div className="divide-y divide-divider border-y border-divider">{items.map((item) => <Row key={item.apiId} item={item} queue={items} />)}</div>
      )}
      {cursor ? (
        <button type="button" onClick={() => void more()} disabled={busy} className="mx-auto mt-5 flex min-h-11 items-center gap-2 rounded-pill border border-border bg-surface-muted px-6 text-xs font-black">
          {busy ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
          {failed ? "دوباره تلاش کنید" : "نمایش بیشتر"}
        </button>
      ) : null}
    </Shell>
  );
}

/** The people or squares that publish audio, each linking to their recordings. */
export function ProducerListView({ kind, initialItems, initialOffset }: { kind: "faces" | "squares"; initialItems: HubProducer[]; initialOffset: number | null }) {
  const [items, setItems] = useState(initialItems);
  const [offset, setOffset] = useState(initialOffset);
  const [busy, setBusy] = useState(false);

  const more = async () => {
    if (offset === null || busy) return;
    setBusy(true);
    try {
      const page = await getProducerPage(kind, offset);
      setItems((current) => [...current, ...page.items]);
      setOffset(page.nextOffset);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell title={kind === "faces" ? "سخنرانان و چهره‌ها" : "میادین"} subtitle={kind === "faces" ? "به ترتیب تعداد صوت" : "مربع‌های صوتی هر میدان"}>
      {items.length === 0 ? (
        <p className="px-6 py-20 text-center text-sm text-muted-foreground">هنوز کسی صوتی منتشر نکرده است.</p>
      ) : (
        <ul className="divide-y divide-divider border-y border-divider">
          {items.map((person) => (
            <li key={`${person.type}:${person.id}`}>
              <Link href={`/content/audio/${person.type}/${person.id}` as Route} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-hover">
                <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full text-sm font-black text-white" style={{ background: `hsl(${hueOf(person.name)} 45% 36%)` }}>
                  {person.avatarUrl ? <OptimizedAvatar src={person.avatarUrl} alt="" width={48} className="h-full w-full object-cover" /> : person.name.charAt(0)}
                </span>
                <span className="min-w-0 flex-1"><b className="block truncate text-sm font-black">{person.name}</b><small className="text-[11px] text-muted-foreground">{[person.place, `${fa.format(person.audios)} صوت`].filter(Boolean).join(" · ")}</small></span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {offset !== null ? (
        <button type="button" onClick={() => void more()} disabled={busy} className="mx-auto mt-5 flex min-h-11 items-center gap-2 rounded-pill border border-border bg-surface-muted px-6 text-xs font-black">
          {busy ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
          نمایش بیشتر
        </button>
      ) : null}
    </Shell>
  );
}
