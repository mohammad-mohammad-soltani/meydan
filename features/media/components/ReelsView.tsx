"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Eye,
  Heart,
  LoaderCircle,
  MessageCircle,
  Pause,
  Play,
  Repeat2,
  Send,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { AccountBadges } from "@/components/shared/AccountBadges";
import { OptimizedAvatar } from "@/components/shared/OptimizedAvatar";
import { getFeedPage } from "@/features/feed/services/feed.service";
import { RepostMenu } from "@/features/feed/components/RepostMenu";
import { quoteComposeHref, repostTotal } from "@/features/feed/post-counts";
import { publicProfileHref } from "@/lib/profile-route";
import { hueOf } from "@/lib/relative-fa";
import { setVideoMuted, subscribeToVideoMuted, videoMutedServerSnapshot, videoMutedSnapshot } from "@/lib/video-sound";
import { useViewerPost } from "../hooks/useViewerPost";
import { scanVideoPages, videoFeedQuery, type VideoFeedEntry, type VideoPageState } from "../video-feed-queue";
import { ReelComments } from "./ReelComments";

const fa = new Intl.NumberFormat("fa-IR");
const short = (value: number) => (value >= 1000 ? `${fa.format(Math.round(value / 100) / 10)}k` : fa.format(value));
const DESKTOP = "(min-width: 1024px)";
const subscribeDesktop = (notify: () => void) => {
  const query = window.matchMedia(DESKTOP);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
const useDesktop = () => useSyncExternalStore(subscribeDesktop, () => window.matchMedia(DESKTOP).matches, () => false);

function Avatar({ entry, size }: { entry: VideoFeedEntry; size: number }) {
  const hue = hueOf(entry.author);
  const url = entry.post?.author.avatarUrl;
  return (
    <span
      className="grid shrink-0 place-items-center overflow-hidden rounded-full font-black"
      style={{ width: size, height: size, fontSize: size * 0.4, background: `hsl(${hue} 85% 82%)`, color: `hsl(${hue} 45% 22%)` }}
    >
      {url ? <OptimizedAvatar src={url} alt="" width={size} className="h-full w-full object-cover" /> : entry.author.charAt(0)}
    </span>
  );
}

function AuthorRow({ entry, state }: { entry: VideoFeedEntry; state: ReturnType<typeof useViewerPost> }) {
  const post = entry.post;
  const href = post ? (publicProfileHref(post.author.type, post.author.id, post.handle) as Route) : null;
  const name = (
    <>
      <Avatar entry={entry} size={42} />
      <span className="min-w-0">
        <b className="flex items-center gap-1 text-sm font-extrabold">
          <span className="truncate">{entry.author}</span>
          <AccountBadges verified={post?.author.verified} speaker={post?.author.verifiedSpeaker} official={post?.author.verifiedOfficial} kind={post?.author.type} variant="reel" />
        </b>
        {post?.handle ? <small dir="ltr" className="block truncate text-start text-[11.5px] opacity-70">@{post.handle}</small> : null}
      </span>
    </>
  );
  return (
    <div className="flex items-center gap-2.5">
      {href ? <Link href={href} className="flex min-w-0 items-center gap-2.5">{name}</Link> : <div className="flex min-w-0 items-center gap-2.5">{name}</div>}
      {post ? (
        <button
          type="button"
          disabled={state.busy || !state.followReady}
          onClick={() => void state.follow()}
          className={`h-8 shrink-0 rounded-full px-3.5 text-xs font-extrabold text-white transition-colors ${state.following ? "bg-white/20" : "border border-white/70"}`}
        >
          {state.following ? "دنبال می‌کنید" : "دنبال کردن"}
        </button>
      ) : null}
    </div>
  );
}

/** One full-height reel: video, action rail, author + caption, quick comment, seek bar. */
function ReelItem({
  entry,
  index,
  active,
  near,
  muted,
  desktop,
  commentsOpen,
  onOpenComments,
  onCloseComments,
  slot,
}: {
  entry: VideoFeedEntry;
  index: number;
  active: boolean;
  near: boolean;
  muted: boolean;
  desktop: boolean;
  commentsOpen: boolean;
  onOpenComments: (index: number) => void;
  onCloseComments: () => void;
  /** Desktop: the element beside the player that hosts the comments panel. */
  slot: HTMLElement | null;
}) {
  const router = useRouter();
  const state = useViewerPost(entry.post);
  const video = useRef<HTMLVideoElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLElement>(null);
  const [paused, setPaused] = useState(false);
  const [flash, setFlash] = useState<{ text: string; key: number } | null>(null);
  const [badge, setBadge] = useState("");
  const [seeking, setSeeking] = useState(false);
  const [wide, setWide] = useState(Boolean(entry.item.width && entry.item.height && entry.item.width > entry.item.height * 1.1));
  const [failed, setFailed] = useState(false);
  const held = useRef(0);
  const seek = useRef<{ resume: boolean } | null>(null);

  // Only the reel on screen plays; the others pause and keep their position.
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    if (active) {
      element.muted = muted;
      // Browsers refuse sound before a gesture: start muted rather than not at all.
      void element.play().catch(() => {
        element.muted = true;
        setVideoMuted(true, false);
        return element.play().catch(() => setPaused(true));
      });
    } else {
      element.pause();
    }
  }, [active, muted, near]);

  const toggle = () => {
    const element = video.current;
    if (!element) return;
    if (element.paused) void element.play().catch(() => {});
    else element.pause();
    setFlash({ text: element.paused ? "play" : "pause", key: Date.now() });
  };

  // Hold: right third plays at 2×, left third rewinds, middle holds a pause.
  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, form, [data-reel-ui]")) return;
    const element = video.current;
    if (!element) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const fraction = (event.clientX - rect.left) / rect.width;
    const startX = event.clientX;
    const startY = event.clientY;
    const wasPlaying = !element.paused;
    let mode = 0;
    let rewind = 0;
    const timer = window.setTimeout(() => {
      held.current = Date.now();
      if (fraction > 0.66) {
        mode = 1;
        element.playbackRate = 2;
        if (element.paused) void element.play().catch(() => {});
        setBadge("۲× ▶▶");
      } else if (fraction < 0.34) {
        mode = 2;
        element.pause();
        rewind = window.setInterval(() => { element.currentTime = Math.max(0, element.currentTime - 0.35); }, 90);
        setBadge("◀◀ ۲×");
      } else {
        mode = 3;
        element.pause();
      }
    }, 320);
    const end = () => {
      window.clearTimeout(timer);
      window.clearInterval(rewind);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      window.removeEventListener("pointermove", move);
      if (!mode) return;
      held.current = Date.now();
      element.playbackRate = 1;
      setBadge("");
      if (wasPlaying) void element.play().catch(() => {});
    };
    const move = (next: PointerEvent) => {
      if (!mode && (Math.abs(next.clientX - startX) > 12 || Math.abs(next.clientY - startY) > 12)) window.clearTimeout(timer);
    };
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    window.addEventListener("pointermove", move);
  };

  const seekTo = (event: ReactPointerEvent) => {
    const element = video.current;
    const track = bar.current;
    if (!element || !track || !element.duration) return;
    const rect = track.getBoundingClientRect();
    // RTL: the bar fills from the right edge.
    const fraction = Math.min(1, Math.max(0, (rect.right - event.clientX) / rect.width));
    element.currentTime = fraction * element.duration;
    if (fill.current) fill.current.style.width = `${fraction * 100}%`;
  };

  const liked = state.viewerState.liked;
  const post = entry.post;

  const panel =
    post && desktop && active && slot
      ? createPortal(
          <ReelComments
            key={post.id}
            postId={post.id}
            count={state.stats.comments}
            onClose={onCloseComments}
            onPosted={state.bumpComments}
            panel
            intro={
              <div className="space-y-3 border-b border-white/10 p-4">
                <AuthorRow entry={entry} state={state} />
                {entry.body ? <p className="line-clamp-4 text-[13px] leading-[1.9] text-white/90">{entry.body}</p> : null}
              </div>
            }
          />,
          slot,
        )
      : null;

  return (
    <section
      data-reel={index}
      onPointerDown={onPointerDown}
      onDoubleClick={(event) => {
        if ((event.target as HTMLElement).closest("button, a, input, form, [data-reel-ui]") || Date.now() - held.current < 400) return;
        toggle();
      }}
      className="relative h-full snap-start snap-always select-none overflow-hidden [touch-action:pan-y] lg:overflow-visible"
    >
      {/* the video card: full screen on phones, a rounded 9:16 card on desktop */}
      <div
        className="absolute inset-y-0 left-0 right-0 overflow-hidden lg:left-auto lg:w-[var(--rw)] lg:rounded-[22px]"
        style={{ background: `linear-gradient(160deg, hsl(${hueOf(entry.author)} 55% 22%), #000 75%)` }}
      >
        {entry.item.poster && !active ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote poster of unknown size
          <img src={entry.item.poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        {near && !failed ? (
          <video
            ref={video}
            src={entry.item.src}
            poster={entry.item.poster}
            muted={muted}
            loop
            playsInline
            preload={active ? "auto" : "metadata"}
            onLoadedMetadata={(event) => {
              const { videoWidth, videoHeight } = event.currentTarget;
              if (videoWidth && videoHeight) setWide(videoWidth > videoHeight * 1.1);
            }}
            onTimeUpdate={(event) => {
              const element = event.currentTarget;
              if (fill.current && element.duration && !seeking) fill.current.style.width = `${(element.currentTime / element.duration) * 100}%`;
            }}
            onPause={(event) => setPaused(active && !event.currentTarget.ended)}
            onPlay={() => setPaused(false)}
            onError={() => setFailed(true)}
            className={wide ? "absolute inset-x-0 top-1/2 h-auto w-full -translate-y-1/2 object-contain" : "absolute inset-0 h-full w-full object-cover"}
          />
        ) : null}
        {failed ? (
          <div className="absolute inset-0 grid place-items-center text-center text-sm text-white/70">
            <div>
              <p>پخش ویدیو ممکن نشد.</p>
              <button type="button" onClick={() => setFailed(false)} className="mt-3 rounded-full border border-white/40 px-4 py-1.5 text-xs font-bold text-white">تلاش دوباره</button>
            </div>
          </div>
        ) : null}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,0,0,.34),transparent_64px),linear-gradient(transparent_55%,rgba(0,0,0,.7))] lg:bg-[linear-gradient(rgba(0,0,0,.34),transparent_64px),linear-gradient(transparent_70%,rgba(0,0,0,.6))]" />
        <div aria-hidden="true" className={`pointer-events-none absolute inset-0 grid place-items-center transition-opacity duration-150 ${paused && active ? "opacity-100" : "opacity-0"}`}>
          <Play className="h-[74px] w-[74px] rounded-full bg-black/45 p-5 text-white" fill="currentColor" />
        </div>
        {flash ? (
          <div key={flash.key} aria-hidden="true" className="reel-flash pointer-events-none absolute left-1/2 top-1/2 z-[6] grid h-[74px] w-[74px] place-items-center rounded-full bg-black/55 text-white">
            {flash.text === "play" ? <Play className="h-6 w-6" fill="currentColor" /> : <Pause className="h-6 w-6" fill="currentColor" />}
          </div>
        ) : null}
        {badge ? <div className="pointer-events-none absolute left-1/2 top-[84px] z-[6] -translate-x-1/2 rounded-full bg-black/60 px-3.5 py-1.5 text-[13px] font-extrabold text-white backdrop-blur">{badge}</div> : null}

        {/* seek bar */}
        <div
          ref={bar}
          data-reel-ui
          role="slider"
          aria-label="موقعیت پخش"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={0}
          tabIndex={0}
          onPointerDown={(event) => {
            const element = video.current;
            if (!element) return;
            event.preventDefault();
            event.stopPropagation();
            seek.current = { resume: !element.paused };
            setSeeking(true);
            event.currentTarget.setPointerCapture(event.pointerId);
            element.pause();
            seekTo(event);
          }}
          onPointerMove={(event) => { if (seek.current) seekTo(event); }}
          onPointerUp={() => {
            if (!seek.current) return;
            if (seek.current.resume) void video.current?.play().catch(() => {});
            seek.current = null;
            setSeeking(false);
          }}
          onKeyDown={(event) => {
            const element = video.current;
            if (!element) return;
            if (event.key === "ArrowRight") element.currentTime = Math.max(0, element.currentTime - 5);
            if (event.key === "ArrowLeft") element.currentTime = Math.min(element.duration || 0, element.currentTime + 5);
          }}
          className={`absolute inset-x-0 bottom-0 z-[4] cursor-pointer bg-white/20 transition-[height] before:absolute before:inset-x-0 before:-top-3.5 before:h-3.5 before:content-[''] hover:h-[7px] [touch-action:none] ${seeking ? "h-[7px]" : "h-[3px]"}`}
        >
          <i ref={fill} className="float-right block h-full w-0 bg-white" />
        </div>

        {/* author + caption and the quick comment: on phones only (desktop has the side panel) */}
        <div className="absolute bottom-[72px] left-[76px] right-3.5 z-[3] text-white lg:hidden">
          <AuthorRow entry={entry} state={state} />
          {entry.body ? <p className="mt-2.5 line-clamp-2 text-[13.5px] leading-[1.9]">{entry.body}</p> : null}
        </div>
        <form
          data-reel-ui
          onSubmit={(event) => { event.preventDefault(); void state.reply(); }}
          className={`absolute inset-x-3 bottom-[calc(14px+env(safe-area-inset-bottom))] z-[5] flex items-center gap-2 rounded-full border bg-black/50 py-[5px] pe-1.5 ps-2 backdrop-blur-xl transition-[border-color,box-shadow] focus-within:border-white/50 lg:hidden ${state.notice === "پاسخ ارسال شد." ? "border-green-500 shadow-[0_0_0_3px_rgba(34,197,94,.25)]" : "border-white/20"}`}
        >
          <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full bg-brand text-xs font-extrabold text-white">ش</span>
          <input
            value={state.draft}
            onChange={(event) => state.setDraft(event.target.value)}
            placeholder="نظر بدهید…"
            maxLength={300}
            autoComplete="off"
            aria-label="نظر بدهید"
            className="h-[34px] min-w-0 flex-1 bg-transparent text-[13.5px] text-white outline-none placeholder:text-white/65"
          />
          <button type="submit" disabled={!state.draft.trim() || state.busy} aria-label="ارسال" className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-brand text-white transition-opacity disabled:opacity-35">
            {state.busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-5 w-5 -scale-x-100" />}
          </button>
        </form>
      </div>

      {/* action rail: over the video on phones, beside the card on desktop */}
      <div data-reel-ui className="absolute bottom-[92px] left-2.5 z-[3] flex flex-col items-center gap-4 text-white lg:bottom-6 lg:left-0 lg:w-[60px] lg:text-foreground">
        <RailButton label={short(state.stats.likes)} aria-label={liked ? "برداشتن پسند" : "پسندیدن"} aria-pressed={liked} on={liked} disabled={state.busy} onClick={() => void state.toggle("like")}>
          <Heart className={`h-[26px] w-[26px] ${liked ? "fill-current" : ""}`} />
        </RailButton>
        <RailButton label={fa.format(state.stats.comments)} aria-label="نظرها" on={commentsOpen} className="lg:pointer-events-none" onClick={() => onOpenComments(index)}>
          <MessageCircle className="h-[26px] w-[26px]" />
        </RailButton>
        {post ? (
          <RepostMenu
            reposted={state.viewerState.reposted}
            onRepost={() => void state.toggle("repost")}
            onQuote={() => router.push(quoteComposeHref(post.id) as Route)}
            disabled={state.busy}
            className="flex flex-col items-center gap-1 text-[11.5px] font-bold"
          >
            <span className={`reel-rail grid h-[46px] w-[46px] place-items-center rounded-full ${state.viewerState.reposted ? "!border-transparent !bg-brand !text-white" : ""}`}>
              <Repeat2 className="h-[26px] w-[26px]" />
            </span>
            <i className="not-italic">{repostTotal(state.stats) ? fa.format(repostTotal(state.stats)) : "بازنشر"}</i>
          </RepostMenu>
        ) : null}
        <RailButton label="اشتراک" aria-label="اشتراک‌گذاری" onClick={() => void state.share()}>
          <Send className="h-[26px] w-[26px]" />
        </RailButton>
        <div className="flex flex-col items-center gap-1 text-[11.5px] font-bold opacity-90">
          <Eye className="h-5 w-5" />
          <i className="not-italic">{short(state.stats.views)}</i>
        </div>
      </div>

      {post && !desktop && commentsOpen ? (
        <ReelComments key={post.id} postId={post.id} count={state.stats.comments} onClose={onCloseComments} onPosted={state.bumpComments} />
      ) : null}
      {panel}
    </section>
  );
}

function RailButton({ children, label, on, className = "", ...rest }: { children: React.ReactNode; label: string; on?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...rest} className={`group flex flex-col items-center gap-1 text-[11.5px] font-bold ${className}`}>
      <span className={`reel-rail grid h-[46px] w-[46px] place-items-center rounded-full transition-transform group-active:scale-90 ${on ? "!border-transparent !bg-brand !text-white" : ""}`}>{children}</span>
      <i className="not-italic max-lg:[text-shadow:0_1px_4px_rgba(0,0,0,.8)]">{label}</i>
    </button>
  );
}

/**
 * «چندرسانه‌ای»: the reels player. A vertical snap feed of video narratives,
 * one per screen; on desktop the video sits in the centre column with the
 * author, caption and comments in a panel beside it.
 */
export function ReelsView({ initial, onClose }: {
  /** Opened from a video in a list: start on these reels, then continue with the video narratives. */
  initial?: VideoFeedEntry[];
  /** Overlay mode: the reels cover the page and closing returns to it. */
  onClose?: () => void;
} = {}) {
  const overlay = Boolean(onClose);
  const router = useRouter();
  const desktop = useDesktop();
  const muted = useSyncExternalStore(subscribeToVideoMuted, videoMutedSnapshot, videoMutedServerSnapshot);
  const [entries, setEntries] = useState<VideoFeedEntry[] | null>(initial?.length ? initial : null);
  const [error, setError] = useState(false);
  const [active, setActive] = useState(0);
  const [comments, setComments] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const stateRef = useRef<VideoPageState>({ cursor: null, exhausted: false, recovered: false });
  const feed = useRef<HTMLDivElement>(null);
  const loading = useRef(false);

  useEffect(() => {
    // Client-only surface: the portal target and media queries exist after mount.
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const load = useCallback(async (known: VideoFeedEntry[]) => {
    if (loading.current || stateRef.current.exhausted) return;
    loading.current = true;
    try {
      const { state, queue } = await scanVideoPages(stateRef.current, known, (cursor) => getFeedPage(videoFeedQuery(cursor)));
      stateRef.current = state;
      setEntries(queue);
      setError(false);
    } catch {
      setError(true);
      setEntries((current) => current ?? []);
    } finally {
      loading.current = false;
    }
  }, []);

  const seed = useRef(initial ?? []);
  useEffect(() => {
    void load(seed.current);
  }, [load]);

  // The reel that is at least 60% on screen is the active one.
  useEffect(() => {
    const root = feed.current;
    if (!root || !entries?.length) return;
    const observer = new IntersectionObserver(
      (hits) => {
        for (const hit of hits) {
          if (hit.isIntersecting && hit.intersectionRatio > 0.6) setActive(Number((hit.target as HTMLElement).dataset.reel));
        }
      },
      { root, threshold: [0.6, 1] },
    );
    root.querySelectorAll("[data-reel]").forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [entries]);

  // Two reels before the end, fetch the next page.
  useEffect(() => {
    if (entries && active >= entries.length - 2) void load(entries);
  }, [active, entries, load]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable=true]")) return;
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      event.preventDefault();
      const root = feed.current;
      root?.scrollBy({ top: (event.key === "ArrowDown" ? 1 : -1) * root.clientHeight, behavior: "smooth" });
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!onClose) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const back = () => {
    if (onClose) onClose();
    else if (window.history.length > 1) router.back();
    else router.push("/home");
  };

  const content = (
    <div
      dir="rtl"
      style={{ "--rh": "calc(100dvh - 120px)", "--rw": "calc(var(--rh) * 9 / 16)" } as CSSProperties}
      className={overlay
        ? "reels fixed inset-0 z-[200] bg-black text-white lg:flex lg:items-center lg:justify-center lg:gap-[18px] lg:bg-background lg:text-foreground"
        : "reels fixed inset-0 z-[80] bg-black text-white lg:static lg:z-auto lg:flex lg:h-dvh lg:items-center lg:justify-center lg:gap-[18px] lg:bg-transparent lg:text-foreground"}
    >
      <div className="relative h-full w-full lg:h-[var(--rh)] lg:w-[calc(var(--rw)+70px)] lg:shrink-0">
        <div className="absolute inset-x-0 top-0 z-[6] flex items-center justify-between px-3.5 py-2 text-white lg:left-auto lg:w-[var(--rw)] lg:rounded-t-[22px]">
          <button type="button" onClick={back} aria-label="بازگشت" className="reel-glass grid h-10 w-10 place-items-center rounded-full text-white">
            <ChevronRight className="h-[22px] w-[22px]" />
          </button>
          <b className="text-base font-extrabold">ریلز</b>
          <button type="button" onClick={() => setVideoMuted(!muted)} aria-label={muted ? "پخش با صدا" : "بی‌صدا"} className="reel-glass grid h-10 w-10 place-items-center rounded-full text-white">
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        </div>
        <div ref={feed} className="reels-feed h-full snap-y snap-mandatory overflow-y-auto overflow-x-hidden overscroll-contain">
          {entries === null ? (
            <div className="grid h-full place-items-center"><LoaderCircle aria-label="در حال دریافت" className="h-6 w-6 animate-spin text-white/60" /></div>
          ) : entries.length === 0 ? (
            <p className="grid h-full place-items-center px-8 text-center text-sm text-white/70 lg:text-foreground">{error ? "دریافت ویدیوها ممکن نشد. دوباره تلاش کنید." : "هنوز ویدیویی منتشر نشده است."}</p>
          ) : (
            entries.map((entry, index) => (
              <ReelItem
                key={entry.key}
                entry={entry}
                index={index}
                active={index === active}
                near={Math.abs(index - active) <= 1}
                muted={muted}
                desktop={desktop}
                commentsOpen={comments === index}
                onOpenComments={(next) => setComments(comments === next ? null : next)}
                onCloseComments={() => setComments(null)}
                slot={slot}
              />
            ))
          )}
        </div>
      </div>
      <div ref={setSlot} className="hidden h-[var(--rh)] w-[340px] shrink-0 lg:block" />
    </div>
  );

  if (!mounted) return null;
  // On phones the player covers the whole screen, above the bottom navigation.
  return desktop && !overlay ? content : createPortal(content, document.body);
}
