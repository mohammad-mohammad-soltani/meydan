"use client";

import Link from "next/link";
import type { Route } from "next";
import { LoaderCircle, Pause, Play, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useAudio } from "@/features/audio/AudioProvider";
import type { AudioTrack } from "@/features/audio/types";
import { OptimizedAvatar } from "@/components/shared/OptimizedAvatar";
import { hueOf, relativeFa } from "@/lib/relative-fa";
import { getAudioHub, type AudioHub, type HubProducer } from "../services/hub.service";
import type { ContentItem } from "../types";

const faNumber = new Intl.NumberFormat("fa-IR");
const CHIPS = [
  { id: "all", label: "همه" },
  { id: "featured", label: "ویژه‌ها" },
  { id: "series", label: "سلسله‌ها" },
  { id: "faces", label: "چهره‌ها" },
  { id: "squares", label: "میادین" },
  { id: "latest", label: "آخرین صوت‌ها" },
] as const;
type Chip = (typeof CHIPS)[number]["id"];

const tint = (seed: string, from = 52, to = 22) => `linear-gradient(145deg,hsl(${hueOf(seed)} 60% ${from}%),hsl(${(hueOf(seed) + 40) % 360} 55% ${to}%))`;

/** The reference's monochrome cards: three greys, picked per title. */
const GREYS = ["linear-gradient(135deg,#484848,#0e0e0e)", "linear-gradient(135deg,#242424,#050505)", "linear-gradient(135deg,#6a6a72,#2b2b2b)"];

function trackOf(item: ContentItem): AudioTrack | null {
  if (!item.media.audioSrc) return null;
  return { id: `ava:${item.apiId}`, title: item.title, artist: item.author, cover: item.coverUrl, url: item.media.audioSrc, sourceHref: `/content/${item.id}` };
}

/** One play/pause control shared by every shelf; the bottom player owns playback. */
function PlayButton({ item, queue, className = "" }: { item: ContentItem; queue: ContentItem[]; className?: string }) {
  const { currentTrack, isPlaying, playTrack, toggle } = useAudio();
  const track = trackOf(item);
  if (!track) return null;
  const current = currentTrack?.id === track.id;
  const playing = current && isPlaying;
  return (
    <button
      type="button"
      aria-label={playing ? `توقف ${item.title}` : `پخش ${item.title}`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (current) void toggle();
        else void playTrack(track, { queue: queue.map(trackOf).filter((value): value is AudioTrack => Boolean(value)) });
      }}
      className={`grid place-items-center rounded-full bg-white text-black shadow-md transition-transform active:scale-90 ${className}`}
    >
      {playing ? <Pause aria-hidden="true" className="h-4 w-4 fill-current" /> : <Play aria-hidden="true" className="h-4 w-4 translate-x-px fill-current" />}
    </button>
  );
}

function SectionHead({ title, hint, href }: { title: string; hint?: string; href?: string }) {
  return (
    <div className="mb-3 flex items-baseline gap-2 px-4">
      <h2 className="text-base font-black text-foreground">{title}</h2>
      {hint ? <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">{hint}</span> : <span className="flex-1" />}
      {href ? (
        <Link href={href as Route} className="shrink-0 text-xs font-bold text-muted-foreground hover:text-foreground">مشاهده همه ‹</Link>
      ) : null}
    </div>
  );
}

function Face({ person }: { person: HubProducer }) {
  const href = `/content/audio/${person.type}/${person.id}`;
  return (
    <Link href={href as Route} className="flex w-[84px] shrink-0 flex-col items-center gap-2 text-center">
      <span className="grid h-[72px] w-[72px] place-items-center overflow-hidden rounded-full border-2 border-foreground/80 bg-surface-muted text-sm font-black text-foreground">
        {person.avatarUrl ? <OptimizedAvatar src={person.avatarUrl} alt="" width={72} className="h-full w-full object-cover" /> : person.name.slice(0, 2)}
      </span>
      <b className="w-full truncate text-xs font-black text-foreground">{person.name}</b>
      <small className="text-[10px] text-muted-foreground">{faNumber.format(person.audios)} صوت</small>
    </Link>
  );
}

function SquareTile({ place }: { place: HubProducer }) {
  const href = `/content/audio/${place.type}/${place.id}`;
  return (
    <Link href={href as Route} className="group w-[172px] shrink-0">
      <span className="relative block aspect-square overflow-hidden rounded-3xl" style={{ background: tint(place.name, 50, 24) }}>
        <i className="absolute right-3.5 top-2 text-[44px] font-black not-italic leading-none text-white/90">{place.name.replace(/^میدان\s*/, "").charAt(0)}</i>
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 flex h-1/3 items-end justify-around gap-1 px-3 pb-3 opacity-40">
          {[40, 70, 35, 85, 55, 75, 45].map((height, index) => <u key={index} className="w-1 rounded-full bg-white no-underline" style={{ height: `${height}%` }} />)}
        </span>
      </span>
      <b className="mt-2 block truncate text-xs font-black text-foreground">{place.name}</b>
      <small className="block truncate text-[10px] text-muted-foreground">{place.place || "میدان"} · {faNumber.format(place.audios)} صوت</small>
    </Link>
  );
}

function FeaturedCard({ item, queue, badge }: { item: ContentItem; queue: ContentItem[]; badge: string }) {
  return (
    <Link
      href={`/content/${item.id}` as Route}
      className="relative flex aspect-[1.45/1] w-[78%] max-w-[300px] shrink-0 flex-col justify-end overflow-hidden rounded-[26px] p-3.5 text-white"
      style={{ background: item.coverUrl ? `linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.78)), url(${item.coverUrl}) center/cover` : GREYS[hueOf(item.title) % GREYS.length] }}
    >
      <span className="absolute right-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-bold backdrop-blur">{badge}</span>
      {item.media.duration ? <span className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-bold backdrop-blur" dir="ltr">{item.media.duration}</span> : null}
      <b className="line-clamp-2 text-base font-black leading-7">{item.title}</b>
      <small className="mt-0.5 text-[11px] text-white/80">{item.author}</small>
      <PlayButton item={item} queue={queue} className="absolute bottom-3.5 left-3.5 h-10 w-10" />
    </Link>
  );
}

function LatestRow({ item, queue }: { item: ContentItem; queue: ContentItem[] }) {
  return (
    <Link href={`/content/${item.id}` as Route} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-hover">
      <span className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl text-lg font-black text-white" style={{ background: item.coverUrl ? `url(${item.coverUrl}) center/cover` : tint(item.title, 46, 20) }}>
        {item.coverUrl ? null : (item.author || item.title).charAt(0)}
      </span>
      <span className="min-w-0 flex-1">
        <b className="block truncate text-sm font-black text-foreground">{item.title}</b>
        <small className="mt-0.5 block truncate text-[11px] text-muted-foreground">{[item.author, relativeFa(item.publishedAt)].filter(Boolean).join(" · ")}</small>
      </span>
      {item.media.duration ? <span className="text-[11px] text-muted-foreground" dir="ltr">{item.media.duration}</span> : null}
      <PlayButton item={item} queue={queue} className="h-9 w-9 border border-border !bg-surface-muted !text-foreground" />
    </Link>
  );
}

/** «آوا»: featured series, speakers, squares and the newest audio, with live search. */
export function AvaView({ initial }: { initial: AudioHub }) {
  const [found, setFound] = useState<{ query: string; hub: AudioHub } | null>(null);
  const [query, setQuery] = useState("");
  const [chip, setChip] = useState<Chip>("all");
  const text = query.trim();
  const searching = text.length > 0;
  // Search results belong to the text they were fetched for; anything else is "still loading".
  const busy = searching && found?.query !== text;
  const empty: AudioHub = { featured: [], series: [], faces: [], squares: [], latest: [] };
  const hub = !searching ? initial : found?.query === text ? found.hub : empty;

  useEffect(() => {
    if (!text) return;
    let active = true;
    const timer = window.setTimeout(() => {
      void getAudioHub(text)
        .then((next) => { if (active) setFound({ query: text, hub: next }); })
        .catch(() => { if (active) setFound({ query: text, hub: empty }); });
    }, 280);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `empty` is a constant shape
  }, [text]);

  const show = (id: Chip) => !searching && (chip === "all" || chip === id);
  const featuredQueue = hub.featured;
  const seriesBadge = (item: ContentItem) => {
    const series = hub.series.find((entry) => entry.title === item.series);
    return series ? `سلسله سخنرانی · ${faNumber.format(series.sessions)} جلسه` : "ویژه هفته";
  };

  return (
    <div className="pb-24" dir="rtl">
      <div className="px-4 pt-4">
        <label className="flex items-center gap-2.5 rounded-2xl border border-border bg-surface-muted px-4 py-3">
          <Search aria-hidden="true" className="h-[18px] w-[18px] shrink-0 text-icon-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="جستجوی زنده در صوت‌ها، چهره‌ها و میادین…"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-placeholder"
          />
          {busy ? <LoaderCircle aria-label="در حال جستجو" className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
        </label>
      </div>

      {!searching ? (
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3.5" role="tablist" aria-label="دسته‌های آوا">
          {CHIPS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={chip === entry.id}
              onClick={() => setChip(entry.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition-colors ${chip === entry.id ? "bg-brand text-brand-foreground" : "bg-surface-muted text-foreground-secondary hover:bg-hover"}`}
            >
              {entry.label}
            </button>
          ))}
        </div>
      ) : (
        <p className="px-4 py-3 text-xs text-muted-foreground">نتایج «{query.trim()}»</p>
      )}

      <div className="space-y-7">
        {show("featured") && hub.featured.length ? (
          <section aria-label="ویژه‌ها">
            <SectionHead title="ویژه‌ها" hint="منتخب سردبیران این هفته" href="/content/audio?shelf=featured" />
            <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto px-4">
              {hub.featured.map((item) => <FeaturedCard key={item.apiId} item={item} queue={featuredQueue} badge={seriesBadge(item)} />)}
            </div>
          </section>
        ) : null}

        {show("series") && hub.series.length ? (
          <section aria-label="سلسله‌ها">
            <SectionHead title="سلسله‌ها" hint="سخنرانی‌های چندجلسه‌ای" />
            <div className="no-scrollbar flex gap-3 overflow-x-auto px-4">
              {hub.series.map((entry) => (
                <Link key={entry.title} href={`/content/audio?series=${encodeURIComponent(entry.title)}` as Route} className="w-[150px] shrink-0">
                  <span className="relative block aspect-square overflow-hidden rounded-3xl" style={{ background: entry.coverUrl ? `url(${entry.coverUrl}) center/cover` : tint(entry.title, 48, 18) }}>
                    <span className="absolute inset-x-2.5 bottom-2.5 rounded-full bg-black/50 px-2.5 py-1 text-center text-[10px] font-bold text-white backdrop-blur">{faNumber.format(entry.sessions)} جلسه</span>
                  </span>
                  <b className="mt-2 line-clamp-2 block text-xs font-black text-foreground">{entry.title}</b>
                  {entry.author ? <small className="block truncate text-[10px] text-muted-foreground">{entry.author}</small> : null}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {show("faces") && hub.faces.length ? (
          <section aria-label="سخنرانان و چهره‌ها">
            <SectionHead title="سخنرانان و چهره‌ها" href="/content/audio?shelf=faces" />
            <div className="no-scrollbar flex gap-4 overflow-x-auto px-4">{hub.faces.map((person) => <Face key={`${person.type}:${person.id}`} person={person} />)}</div>
          </section>
        ) : null}

        {show("squares") && hub.squares.length ? (
          <section aria-label="میادین">
            <SectionHead title="میادین" hint="مربع‌های صوتی هر میدان" href="/content/audio?shelf=squares" />
            <div className="no-scrollbar flex gap-3.5 overflow-x-auto px-4">{hub.squares.map((place) => <SquareTile key={`${place.type}:${place.id}`} place={place} />)}</div>
          </section>
        ) : null}

        {(show("latest") || searching) && hub.latest.length ? (
          <section aria-label="آخرین صوت‌ها">
            {searching ? null : <SectionHead title="آخرین صوت‌ها" href="/content/audio?shelf=latest" />}
            <div className="divide-y divide-divider">{hub.latest.map((item) => <LatestRow key={item.apiId} item={item} queue={hub.latest} />)}</div>
          </section>
        ) : null}

        {!hub.latest.length && !hub.featured.length && !hub.faces.length && !hub.squares.length && !busy ? (
          <p className="px-6 py-14 text-center text-sm text-muted-foreground">{searching ? "موردی پیدا نشد." : "هنوز صوتی منتشر نشده است."}</p>
        ) : null}
      </div>
    </div>
  );
}
