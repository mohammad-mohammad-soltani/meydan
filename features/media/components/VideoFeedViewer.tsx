"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowDown, ArrowUp } from "lucide-react";
import { getFeedPage } from "@/features/feed/services/feed.service";
import { setVideoFeedOwner, stopVideoAutoplay } from "@/lib/video-sound";
import {
  nextVideoIndex,
  scanVideoPages,
  videoFeedQuery,
  type VideoFeedEntry,
  type VideoPageState,
} from "../video-feed-queue";
import { MEDIA_POST_UPDATE, type MediaPostUpdate } from "../post-interactions";
import { useDragPager } from "../use-drag-pager";
import { ImmersivePostSlide } from "./ImmersivePostSlide";

type Props = {
  session: {
    queue: VideoFeedEntry[];
    startTime: number;
    source?: HTMLVideoElement;
    returnFocus?: HTMLElement | null;
    focus: HTMLElement | null;
  };
  onClose: () => void;
};
type LoadStatus = "idle" | "loading" | "more" | "error" | "end";

export function VideoFeedViewer({ session, onClose }: Props) {
  const [queue, setQueue] = useState(session.queue);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [ended, setEnded] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const queueRef = useRef(session.queue);
  const indexRef = useRef(0);
  const locked = useRef(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selections] = useState(() => new Map<string, string>());
  const [times] = useState(
    () => new Map([[session.queue[0].key, session.startTime]]),
  );
  const pageState = useRef<VideoPageState>({
    cursor: null,
    exhausted: false,
    recovered: false,
  });
  const request = useRef<AbortController | null>(null);
  const pendingEnd = useRef<string | null>(null);
  const suppressClick = useRef(false);
  const wheel = useRef({ delta: 0, last: 0, consumed: false });

  useEffect(() => {
    const update = (event: Event) => {
      const detail = (event as CustomEvent<MediaPostUpdate>).detail;
      const next = queueRef.current.map((entry) =>
        entry.postId === detail.id && entry.post
          ? {
              ...entry,
              post: {
                ...entry.post,
                stats: detail.stats,
                viewerState: {
                  ...entry.post.viewerState,
                  joined: Boolean(entry.post.viewerState?.joined),
                  ...detail.viewerState,
                },
              },
            }
          : entry,
      );
      queueRef.current = next;
      setQueue(next);
    };
    window.addEventListener(MEDIA_POST_UPDATE, update);
    return () => window.removeEventListener(MEDIA_POST_UPDATE, update);
  }, []);

  const move = useCallback((direction: number, origin?: number) => {
    if (document.hidden) return;
    const current = indexRef.current;
    const next = nextVideoIndex(
      current,
      direction,
      queueRef.current.length,
      locked.current,
      origin ?? current,
    );
    if (next === current) return;
    locked.current = true;
    pendingEnd.current = null;
    root.current?.querySelectorAll("video").forEach((video) => video.pause());
    indexRef.current = next;
    setIndex(next);
    root.current?.focus({ preventScroll: true });
    setEnded(null);
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    transitionTimer.current = setTimeout(() => {
      locked.current = false;
    }, 380);
  }, []);

  // Vertical paging follows the finger: the track carries the whole offset so
  // a drag never re-renders a slide, and `move` only runs once it has settled.
  const { trackRef: feedTrackRef, handlers: feedDrag } = useDragPager({
    axis: "y",
    index,
    count: queue.length,
    transform: (slide, drag) => `translate3d(0, calc(${-slide * 100}% + ${drag}px), 0)`,
    onIndexChange: (next) => move(next - index),
    reservedSelector: "button, input, textarea, [role=slider], a, [data-image-gesturing=true]",
    onDragged: () => { suppressClick.current = true; },
  });

  const load = useCallback(async () => {
    if (request.current || pageState.current.exhausted) return;
    const controller = new AbortController();
    request.current = controller;
    setStatus("loading");
    try {
      const result = await scanVideoPages(
        pageState.current,
        queueRef.current,
        (cursor) =>
          getFeedPage(
            videoFeedQuery(cursor),
            { signal: controller.signal },
          ),
      );
      if (controller.signal.aborted) return;
      const added = result.queue.length > queueRef.current.length;
      pageState.current = result.state;
      queueRef.current = result.queue;
      setQueue(result.queue);
      setStatus(result.state.exhausted ? "end" : added ? "idle" : "more");
    } catch {
      if (!controller.signal.aborted) setStatus("error");
    } finally {
      if (request.current === controller) request.current = null;
    }
  }, []);

  useEffect(() => {
    if (queue.length - index <= 3 && status === "idle") {
      const timer = setTimeout(() => void load(), 0);
      return () => clearTimeout(timer);
    }
  }, [index, queue.length, status, load]);

  useEffect(() => {
    if (!ended || queue[index]?.key !== ended || index + 1 >= queue.length)
      return;
    const timer = setTimeout(() => {
      if (pendingEnd.current === ended) move(1, index);
    }, 400);
    return () => clearTimeout(timer);
  }, [ended, queue, index, move]);

  useEffect(() => {
    setVideoFeedOwner(true);
    const bodyStyle = document.body.style;
    const previous = {
      overflow: bodyStyle.overflow,
      position: bodyStyle.position,
      top: bodyStyle.top,
      width: bodyStyle.width,
    };
    const scrollY = window.scrollY;
    bodyStyle.overflow = "hidden";
    bodyStyle.position = "fixed";
    bodyStyle.top = `-${scrollY}px`;
    bodyStyle.width = "100%";
    const background = Array.from(document.body.children).filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement && element !== root.current,
    );
    const inert = background.map((element) => element.inert);
    background.forEach((element) => {
      element.inert = true;
    });
    (closeButton.current ?? root.current)?.focus({ preventScroll: true });
    const visibility = () => {
      if (document.hidden) {
        pendingEnd.current = null;
        root.current
          ?.querySelectorAll("video")
          .forEach((video) => video.pause());
      }
    };
    let nativeFullscreen = false;
    const fullscreenChanged = () => {
      if (document.fullscreenElement === root.current) nativeFullscreen = true;
      else if (nativeFullscreen) onClose();
    };
    const navigationKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      } else if (
        (event.key === "ArrowDown" || event.key === "ArrowUp") &&
        !(
          event.target instanceof Element &&
          event.target.closest("[role=slider], input, textarea")
        )
      ) {
        event.preventDefault();
        event.stopPropagation();
        move(event.key === "ArrowDown" ? 1 : -1);
      }
    };
    document.addEventListener("keydown", navigationKey, true);
    document.addEventListener("fullscreenchange", fullscreenChanged);
    document.addEventListener("visibilitychange", visibility);
    const originalSource = session.source;
    const originalKey = session.queue[0].key;
    const savedTimes = times;
    const viewer = root.current;
    return () => {
      request.current?.abort();
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
      document.removeEventListener("visibilitychange", visibility);
      document.removeEventListener("fullscreenchange", fullscreenChanged);
      document.removeEventListener("keydown", navigationKey, true);
      if (document.fullscreenElement === viewer)
        void document.exitFullscreen().catch(() => {});
      if (originalSource?.isConnected) {
        originalSource.pause();
        try {
          originalSource.currentTime = savedTimes.get(originalKey) || 0;
        } catch {
          /* Source may have expired. */
        }
      }
      stopVideoAutoplay();
      setVideoFeedOwner(false);
      background.forEach((element, i) => {
        element.inert = inert[i];
      });
      Object.assign(bodyStyle, previous);
      window.scrollTo({ top: scrollY, behavior: "instant" });
      if (session.focus?.isConnected)
        session.focus.focus({ preventScroll: true });
      else if (session.returnFocus?.isConnected)
        session.returnFocus.focus({ preventScroll: true });
    };
  }, [session, onClose, move, times]);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const resize = () => {
      if (root.current) {
        root.current.style.height = `${viewport.height}px`;
        root.current.style.top = `${viewport.offsetTop}px`;
      }
    };
    resize();
    viewport.addEventListener("resize", resize);
    viewport.addEventListener("scroll", resize);
    return () => {
      viewport.removeEventListener("resize", resize);
      viewport.removeEventListener("scroll", resize);
    };
  }, []);

  const active = queue[index];
  const finish = (key: string, slide: number) => {
    if (document.hidden || indexRef.current !== slide) return;
    pendingEnd.current = key;
    setEnded(key);
    move(1, slide);
  };
  const toggleFullscreen = () => {
    if (document.fullscreenElement === root.current)
      void document.exitFullscreen().catch(() => {});
    else void root.current?.requestFullscreen?.().catch(() => {});
  };

  const footer = (
    <div className="viewer-feed-navigation">
      <div className="mt-3 md:flex items-center gap-3 hidden">
        <button
          className="video-feed-button"
          disabled={index === 0}
          onClick={() => move(-1)}
          aria-label="ویدیوی قبلی"
        >
          <ArrowUp />
        </button>
        <button
          className="video-feed-button"
          disabled={index + 1 >= queue.length}
          onClick={() => move(1)}
          aria-label="ویدیوی بعدی"
        >
          <ArrowDown />
        </button>
        {ended === active.key && (
          <button
            className="text-sm underline"
            onClick={() => {
              const video = root.current?.querySelector<HTMLVideoElement>(
                "section:not([inert]) video",
              );
              if (video) {
                video.currentTime = 0;
                void video.play().catch(() => {});
              }
              pendingEnd.current = null;
              setEnded(null);
              root.current?.focus({ preventScroll: true });
            }}
          >
            پخش دوباره
          </button>
        )}
      </div>
      <div role="status" className="text-xs text-white/80">
        {status === "loading" && "در حال دریافت ویدیوهای بیشتر…"}
        {status === "end" &&
          index === queue.length - 1 &&
          "به پایان ویدیوها رسیدید."}
        {(status === "more" || status === "error") && (
          <button className="underline" onClick={() => void load()}>
            {status === "error"
              ? "دریافت ویدیو ناموفق بود؛ تلاش دوباره"
              : "جست‌وجوی بیشتر"}
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(
    <div
      ref={root}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="فید ویدیوها"
      dir="rtl"
      className="video-feed-viewer fixed inset-0 z-[200] overflow-hidden bg-black text-white"
      onClickCapture={(event) => {
        if (suppressClick.current) {
          event.preventDefault();
          event.stopPropagation();
          suppressClick.current = false;
        }
      }}
      onKeyDown={(event) => {
        if (
          event.target === event.currentTarget &&
          (event.key === " " || event.key.toLowerCase() === "k")
        ) {
          event.preventDefault();
          const video = root.current?.querySelector<HTMLVideoElement>(
            "section:not([inert]) video",
          );
          if (video) {
            if (video.paused) void video.play().catch(() => {});
            else video.pause();
          }
        }
        if (event.key === "Tab") {
          const nodes = Array.from(
            root.current?.querySelectorAll<HTMLElement>(
              "button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [tabindex='0'], a[href]",
            ) || [],
          ).filter(
            (element) =>
              !element.closest("[inert]") &&
              element.getClientRects().length > 0,
          );
          const position = nodes.indexOf(document.activeElement as HTMLElement);
          if (event.shiftKey && position <= 0) {
            event.preventDefault();
            nodes.at(-1)?.focus();
          } else if (
            !event.shiftKey &&
            (position === nodes.length - 1 || position === -1)
          ) {
            event.preventDefault();
            nodes[0]?.focus();
          }
        }
      }}
      onWheel={(event) => {
        if (
          (event.target as HTMLElement).closest(
            "[role=slider], input, textarea, [data-image-stage]",
          )
        )
          return;
        const now = performance.now();
        const state = wheel.current;
        if (now - state.last > 180) {
          state.delta = 0;
          state.consumed = false;
        }
        state.last = now;
        if (state.consumed) return;
        state.delta +=
          event.deltaY *
          (event.deltaMode === 1
            ? 16
            : event.deltaMode === 2
              ? window.innerHeight
              : 1);
        if (Math.abs(state.delta) >= 45) {
          state.consumed = true;
          move(state.delta > 0 ? 1 : -1);
        }
      }}
      {...feedDrag}
      onPointerDown={(event) => {
        suppressClick.current = false;
        feedDrag.onPointerDown(event);
      }}
    >
      {/* The clipping box has to stay put: the track inside it is what moves. */}
      <div className="video-feed-viewport relative h-full w-full">
        <div ref={feedTrackRef} className="video-feed-track absolute inset-0">
          {queue.map((entry, slide) => (
            <section
              key={entry.key}
              inert={slide !== index}
              aria-hidden={slide !== index}
              className="video-feed-slide absolute inset-0 h-full w-full"
              style={{ transform: `translateY(${slide * 100}%)` }}
            >
              {Math.abs(slide - index) <= 1 ? (
                <ImmersivePostSlide
                  key={entry.key}
                  entry={entry}
                  active={slide === index}
                  times={times}
                  selections={selections}
                  onMediaChange={() => { pendingEnd.current = null; setEnded(null); }}
                  onClose={onClose}
                  closeRef={slide === index ? closeButton : undefined}
                  onPlaybackStart={() => {
                    if (pendingEnd.current === entry.key) {
                      pendingEnd.current = null;
                      setEnded(null);
                    }
                  }}
                  onEnded={() => finish(entry.key, slide)}
                  onFullscreen={toggleFullscreen}
                  footer={slide === index ? footer : undefined}
                />
              ) : entry.item.poster ? (
                <div
                  className="h-full w-full bg-contain bg-center bg-no-repeat"
                  style={{
                    backgroundImage: `url(${JSON.stringify(entry.item.poster)})`,
                  }}
                />
              ) : null}
            </section>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
