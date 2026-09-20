"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowDown, ArrowUp, Maximize2, X } from "lucide-react";
import { getFeedPage } from "@/features/feed/services/feed.service";
import { setVideoFeedOwner, stopVideoAutoplay } from "@/lib/video-sound";
import {
  nextVideoIndex,
  scanVideoPages,
  type VideoFeedEntry,
  type VideoPageState,
} from "../video-feed-queue";
import { VideoPlayer } from "./VideoPlayer";

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
  const [startTimes, setStartTimes] = useState(
    new Map([[session.queue[0].key, session.startTime]]),
  );
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [ended, setEnded] = useState<string | null>(null);
  const [replay, setReplay] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const queueRef = useRef(session.queue);
  const indexRef = useRef(0);
  const locked = useRef(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const times = useRef(new Map([[session.queue[0].key, session.startTime]]));
  const pageState = useRef<VideoPageState>({
    cursor: null,
    exhausted: false,
    recovered: false,
  });
  const request = useRef<AbortController | null>(null);
  const pendingEnd = useRef<string | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const wheel = useRef({ delta: 0, last: 0, consumed: false });

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
    setStartTimes(new Map(times.current));
    setIndex(next);
    root.current?.focus({ preventScroll: true });
    setEnded(null);
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    transitionTimer.current = setTimeout(() => {
      locked.current = false;
    }, 380);
  }, []);

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
            { mode: "for_you", filter: "all", limit: 12, cursor },
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
    closeButton.current?.focus({ preventScroll: true });
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
          event.target.closest("[role=slider], input")
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
    const savedTimes = times.current;
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
  }, [session, onClose, move]);

  const active = queue[index];
  const finish = (key: string, slide: number) => {
    if (document.hidden || indexRef.current !== slide) return;
    times.current.set(key, 0);
    pendingEnd.current = key;
    setEnded(key);
    move(1, slide);
  };
  const toggleFullscreen = () => {
    if (document.fullscreenElement === root.current)
      void document.exitFullscreen().catch(() => {});
    else void root.current?.requestFullscreen?.().catch(() => {});
  };

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
          root.current
            ?.querySelector<HTMLVideoElement>("section:not([inert]) video")
            ?.click();
        }
        if (event.key === "Tab") {
          const nodes = Array.from(
            root.current?.querySelectorAll<HTMLElement>(
              "button:not(:disabled), [tabindex='0'], a[href]",
            ) || [],
          ).filter((element) => !element.closest("[inert]"));
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
        if ((event.target as HTMLElement).closest("[role=slider], input"))
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
      onPointerDown={(event) => {
        suppressClick.current = false;
        if (
          event.pointerType === "mouse" ||
          (event.target as HTMLElement).closest(
            "button, input, [role=slider], a",
          )
        )
          return;
        touch.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerUp={(event) => {
        const start = touch.current;
        touch.current = null;
        if (!start) return;
        const dy = event.clientY - start.y,
          dx = event.clientX - start.x;
        if (Math.abs(dy) >= 50 && Math.abs(dy) > Math.abs(dx) * 1.2) {
          suppressClick.current = true;
          move(dy < 0 ? 1 : -1);
        }
      }}
      onPointerCancel={() => {
        touch.current = null;
      }}
    >
      <div className="absolute inset-x-0 top-0 z-30 flex justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button
          ref={closeButton}
          onClick={onClose}
          aria-label="بستن فید ویدیوها"
          className="video-feed-button"
        >
          <X />
        </button>
        <button
          onClick={toggleFullscreen}
          aria-label="تمام‌صفحه"
          className="video-feed-button"
        >
          <Maximize2 />
        </button>
      </div>
      <div
        className="video-feed-track h-full w-full"
        style={{ transform: `translateY(-${index * 100}%)` }}
      >
        {queue.map((entry, slide) => (
          <section
            key={entry.key}
            inert={slide !== index}
            aria-hidden={slide !== index}
            className="relative flex h-full w-full shrink-0 items-center justify-center px-0 pb-36 pt-16 sm:px-16 [container-type:size]"
          >
            {Math.abs(slide - index) <= 1 ? (
              <VideoPlayer
                key={`${entry.key}:${slide === index ? replay : 0}`}
                item={entry.item}
                variant="immersive"
                active={slide === index}
                initialTime={startTimes.get(entry.key) || 0}
                preload="metadata"
                onPlaybackTime={(time) => {
                  times.current.set(entry.key, time);
                }}
                onPlaybackStart={() => {
                  if (pendingEnd.current === entry.key) {
                    pendingEnd.current = null;
                    setEnded(null);
                  }
                }}
                onEnded={() => finish(entry.key, slide)}
                onRequestFullscreen={toggleFullscreen}
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
      <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black via-black/90 to-transparent px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-8 sm:px-20">
        <p className="font-bold">{active.author}</p>
        <p className="mt-1 line-clamp-2 text-sm text-white/80">{active.body}</p>
        <div className="mt-3 flex items-center gap-3">
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
          <span className="text-xs text-white/70" aria-live="polite">
            ویدیو {(index + 1).toLocaleString("fa-IR")}
          </span>
          {ended === active.key && (
            <button
              className="text-sm underline"
              onClick={() => {
                times.current.set(active.key, 0);
                setStartTimes(new Map(times.current));
                pendingEnd.current = null;
                setEnded(null);
                setReplay((value) => value + 1);
                root.current?.focus({ preventScroll: true });
              }}
            >
              پخش دوباره
            </button>
          )}
        </div>
        <div role="status" className="mt-2 text-xs text-white/80">
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
    </div>,
    document.body,
  );
}
