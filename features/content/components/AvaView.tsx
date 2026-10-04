"use client";

import "../reference-content.css";
import "../ava.css";
import Link from "next/link";
import type { Route } from "next";
import { LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useAudio } from "@/features/audio/AudioProvider";
import { probeCors } from "@/features/audio/audio-analysis";
import { NowPlayingSheet } from "@/features/audio/NowPlayingSheet";
import type { AudioTrack } from "@/features/audio/types";
import { OptimizedAvatar } from "@/components/shared/OptimizedAvatar";
import { relativeFa } from "@/lib/relative-fa";
import { getAudioHub, getAudioList, type AudioHub, type HubProducer } from "../services/hub.service";
import type { ContentItem } from "../types";

const faNumber = new Intl.NumberFormat("fa-IR");
/** The reference's five chips; each one scrolls to its shelf. */
const CHIPS = [
  { id: "all", label: "همه", target: null },
  { id: "featured", label: "ویژه‌ها", target: "av-s1" },
  { id: "faces", label: "چهره‌ها", target: "av-s2" },
  { id: "squares", label: "میادین", target: "av-s3" },
  { id: "latest", label: "آخرین صوت‌ها", target: "av-s4" },
] as const;

const initials = (name: string) => {
  const words = name.replace(/[()؛.…]/g, "").trim().split(/\s+/);
  return (words[0] ?? "").charAt(0) + (words[1] ? "\u200c" + words[1].charAt(0) : "");
};
const hueOf = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hash % 360;
};

/** The reference's play and chevron glyphs. */
const PlayGlyph = ({ size, pause = false }: { size: number; pause?: boolean }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {pause ? <path d="M8 5h3v14H8zM13 5h3v14h-3z" fill="currentColor" stroke="none" /> : <path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none" />}
  </svg>
);
const Chevron = ({ size = 13 }: { size?: number }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 6-6 6 6 6" /></svg>
);

function trackOf(item: ContentItem): AudioTrack | null {
  // A music video that has no separate audio plays through its video file, sound only.
  const url = item.media.audioSrc ?? item.media.videoSrc;
  if (!url) return null;
  return { id: `ava:${item.apiId}`, title: item.title, artist: item.author, cover: item.coverUrl ?? item.media.coverImage, url, sourceHref: item.href ?? `/content/${item.id}` };
}

/** One play/pause control shared by every shelf; the bottom player owns playback. */
function PlayButton({ item, queue, size, className = "" }: { item: ContentItem; queue: ContentItem[]; size: number; className?: string }) {
  const { currentTrack, isPlaying, playTrack, toggle } = useAudio();
  const track = trackOf(item);
  if (!track) return null;
  const current = currentTrack?.id === track.id;
  const playing = current && isPlaying;
  return (
    <button
      type="button"
      className={`pl ${className}`}
      aria-label={playing ? `توقف ${item.title}` : `پخش ${item.title}`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (current) void toggle();
        else void playTrack(track, { queue: queue.map(trackOf).filter((value): value is AudioTrack => Boolean(value)) });
      }}
    >
      <PlayGlyph size={size} pause={playing} />
    </button>
  );
}

function usePlayingId() {
  const { currentTrack, isPlaying } = useAudio();
  return isPlaying ? currentTrack?.id : undefined;
}

function SectionHead({ id, title, hint, href }: { id?: string; title: string; hint?: string; href?: string }) {
  return (
    <div className="av-sh" id={id}>
      <b>{title}</b>
      {hint ? <span>{hint}</span> : null}
      {href ? <Link href={href as Route} className="all">مشاهده همه<Chevron /></Link> : null}
    </div>
  );
}

function Face({ person, onOpen }: { person: HubProducer; onOpen: (person: HubProducer) => void }) {
  return (
    <button type="button" className="fc" onClick={() => onOpen(person)} aria-label={`صوت‌های ${person.name}`}>
      <span className="ring">
        <i>{initials(person.name)}</i>
        {person.avatarUrl ? <OptimizedAvatar src={person.avatarUrl} alt="" width={78} className="absolute" /> : null}
      </span>
      <b>{person.name}</b>
      <small>{faNumber.format(person.audios)} صوت</small>
    </button>
  );
}

/**
 * The full-screen player opened on a speaker: their portrait, «صوت‌های X», and every recording
 * with endless scrolling. Nothing plays until a recording is chosen.
 */
function ProducerSheet({ person, onClose }: { person: HubProducer; onClose: () => void }) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const busy = useRef(false);
  const alive = useRef(true);

  const load = useCallback(async (next: string | null) => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setFailed(false);
    try {
      const page = await getAudioList({ producer: { type: person.type, id: Number(person.id) } }, next);
      if (!alive.current) return;
      setItems((current) => [...current, ...page.items.filter((entry) => !current.some((known) => known.apiId === entry.apiId))]);
      setCursor(page.nextCursor);
      setStarted(true);
    } catch {
      if (alive.current) setFailed(true);
    } finally {
      busy.current = false;
      if (alive.current) setLoading(false);
    }
  }, [person.type, person.id]);

  useEffect(() => {
    alive.current = true;
    void load(null);
    return () => { alive.current = false; };
  }, [load]);

  const tracks = items.map(trackOf).filter((value): value is AudioTrack => Boolean(value));
  return (
    <NowPlayingSheet
      onClose={onClose}
      collection={{
        title: `صوت‌های ${person.name}`,
        cover: person.avatarUrl,
        initial: person.name.trim().charAt(0),
        tracks,
        loading,
        hasMore: !started ? false : cursor !== null,
        failed,
        onLoadMore: () => void load(cursor),
      }}
    />
  );
}

function SquareTile({ place, index, onOpen }: { place: HubProducer; index: number; onOpen: (place: HubProducer) => void }) {
  const picture = place.avatarUrl ? `url("${place.avatarUrl.replace(/"/g, "%22")}")` : undefined;
  return (
    <button type="button" className="sqm" onClick={() => onOpen(place)} aria-label={`صوت‌های ${place.name}`}>
      <div className={`art${picture ? " with-portrait" : ""}`} style={{ "--h": (index * 67 + 12) % 360 } as CSSProperties}>
        {picture ? <span aria-hidden="true" className="art-blur" style={{ backgroundImage: picture }} /> : null}
        {/* The square's picture sits in the middle of widening rings, like sound spreading from it. */}
        <span aria-hidden="true" className="art-disc" style={picture ? { backgroundImage: picture } : undefined}>
          {picture ? null : initials(place.name.replace(/^(میدان|محله)\s*/, ""))}
        </span>
        <span className="art-count">{faNumber.format(place.audios)} صوت</span>
        <u />
        <span className="pl" aria-hidden="true"><PlayGlyph size={16} /></span>
      </div>
      <b>{place.name}</b>
      <small>{place.place || "میدان"}</small>
    </button>
  );
}

function FeaturedCard({ item, queue, badge, index }: { item: ContentItem; queue: ContentItem[]; badge: string; index: number }) {
  // The post's own picture wins; without one, the publisher's portrait; without that, the plain grey card.
  const picture = item.coverUrl ?? item.media.coverImage;
  const portrait = !picture ? item.authorAvatar : undefined;
  const cssUrl = (url: string) => `url("${url.replace(/"/g, "%22")}")`;
  return (
    <Link
      href={`/content/${item.id}` as Route}
      className={`ft f${index % 3}${portrait ? " with-portrait" : ""}`}
      style={picture ? { backgroundImage: `linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.78)), ${cssUrl(picture)}` } : undefined}
    >
      {portrait ? (
        <>
          {/* A soft blur of the publisher's portrait fills the card; the sharp one sits beside their name. */}
          <span aria-hidden="true" className="ft-blur" style={{ backgroundImage: cssUrl(portrait) }} />
        </>
      ) : null}
      <span className="bd">{badge}</span>
      {item.media.duration ? <span className="du">{item.media.duration}</span> : null}
      <PlayButton item={item} queue={queue} size={18} />
      <div className="tx">
        <b>{item.title}</b>
        <small>{portrait ? <i aria-hidden="true" className="ft-by" style={{ backgroundImage: cssUrl(portrait) }} /> : null}{item.author}</small>
      </div>
    </Link>
  );
}

function LatestRow({ item, queue, playing }: { item: ContentItem; queue: ContentItem[]; playing: boolean }) {
  return (
    <Link href={(item.href ?? `/content/${item.id}`) as Route} className={`ls${playing ? " on" : ""}`}>
      <PlayButton item={item} queue={queue} size={14} />
      <span className="asq">{initials(item.author || item.title)}</span>
      <div className="tx">
        <b>{item.title}</b>
        <small>{[item.author, item.series].filter(Boolean).join(" · ")}</small>
      </div>
      <span className="tm">{relativeFa(item.publishedAt)}</span>
      {item.media.duration ? <span className="dur">{item.media.duration}</span> : null}
    </Link>
  );
}

/** Scrolls the page's own scroller (the app shell, not the window) so a shelf lands below the sticky bars. */
function scrollToShelf(root: HTMLElement | null, target: string | null) {
  if (!root) return;
  let scroller: HTMLElement | null = root.parentElement;
  while (scroller && !/(auto|scroll)/.test(getComputedStyle(scroller).overflowY)) scroller = scroller.parentElement;
  if (!scroller) return;
  const node = target ? root.querySelector<HTMLElement>(`#${target}`) : null;
  const top = node ? node.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 120 : 0;
  scroller.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

/** «آوا»: featured series, speakers, squares and the newest audio, with live search. */
export function AvaView({ initial }: { initial: AudioHub }) {
  const [found, setFound] = useState<{ query: string; hub: AudioHub } | null>(null);
  const [query, setQuery] = useState("");
  const [chip, setChip] = useState<(typeof CHIPS)[number]["id"]>("all");
  const rootRef = useRef<HTMLDivElement>(null);
  const playingId = usePlayingId();
  const [sheetFor, setSheetFor] = useState<HubProducer | null>(null);

  // Ask the media host about CORS up front, so the very first play already drives a live equalizer.
  useEffect(() => {
    const sample = [...initial.latest, ...initial.featured].map(trackOf).find(Boolean);
    if (sample) void probeCors(sample.url);
  }, [initial]);
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

  const seriesBadge = (item: ContentItem) => {
    const series = hub.series.find((entry) => entry.title === item.series);
    return series ? "سلسله سخنرانی" : "ویژه هفته";
  };
  const sessions = (item: ContentItem) => {
    const series = hub.series.find((entry) => entry.title === item.series);
    return series ? faNumber.format(series.sessions) + " جلسه" : item.media.duration;
  };

  const nothing = !hub.latest.length && !hub.featured.length && !hub.faces.length && !hub.squares.length && !busy;
  const body: ReactNode[] = [];
  if (hub.featured.length) {
    body.push(
      <section key="featured" aria-label="ویژه‌ها">
        <SectionHead id="av-s1" title="ویژه‌ها" hint="منتخب سردبیران این هفته" href="/content/audio?shelf=featured" />
        <div className="av-feat">
          {hub.featured.map((item, index) => (
            <FeaturedCard key={item.apiId} item={{ ...item, media: { ...item.media, duration: sessions(item) } }} queue={hub.featured} badge={seriesBadge(item)} index={index} />
          ))}
        </div>
      </section>,
    );
  }
  if (hub.faces.length) {
    body.push(
      <section key="faces" aria-label="سخنرانان و چهره‌ها">
        <SectionHead id="av-s2" title="سخنرانان و چهره‌ها" href="/content/audio?shelf=faces" />
        <div className="av-faces">{hub.faces.map((person) => <Face key={`${person.type}:${person.id}`} person={person} onOpen={setSheetFor} />)}</div>
      </section>,
    );
  }
  if (hub.squares.length) {
    body.push(
      <section key="squares" aria-label="میادین">
        <SectionHead id="av-s3" title="میادین" hint="مربع‌های صوتی هر میدان" href="/content/audio?shelf=squares" />
        <div className="av-places">{hub.squares.map((place, index) => <SquareTile key={`${place.type}:${place.id}`} place={place} index={index} onOpen={setSheetFor} />)}</div>
      </section>,
    );
  }
  if (hub.latest.length) {
    body.push(
      <section key="latest" aria-label="آخرین صوت‌ها">
        <SectionHead id="av-s4" title="آخرین صوت‌ها" href="/content/audio?shelf=latest" />
        <div className="av-last">{hub.latest.map((item) => <LatestRow key={item.apiId} item={item} queue={hub.latest} playing={playingId === `ava:${item.apiId}`} />)}</div>
      </section>,
    );
  }

  return (
    <div ref={rootRef} className="ava-ref" dir="rtl">
      <header className="av-h1 av-sq">
        <label className="av-s">
          <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="جستجوی زنده در صوت‌ها، چهره‌ها و میادین…"
            autoComplete="off"
          />
          {busy ? <LoaderCircle aria-label="در حال جستجو" className="h-4 w-4 animate-spin" /> : null}
        </label>
      </header>

      <div className="av-h2">
        <div className="av-chips" role="tablist" aria-label="دسته‌های آوا">
          {CHIPS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={chip === entry.id}
              className={chip === entry.id ? "on" : undefined}
              onClick={() => {
                setChip(entry.id);
                scrollToShelf(rootRef.current, entry.target);
              }}
            >
              {entry.label}
            </button>
          ))}
        </div>
      </div>

      {sheetFor ? <ProducerSheet person={sheetFor} onClose={() => setSheetFor(null)} /> : null}

      <div className="av-body">
        {body}
        {nothing ? <p className="px-6 py-14 text-center text-sm text-muted-foreground">{searching ? "موردی پیدا نشد." : "هنوز صوتی منتشر نشده است."}</p> : null}
      </div>
    </div>
  );
}
