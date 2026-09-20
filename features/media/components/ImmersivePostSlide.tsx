/* eslint-disable @next/next/no-img-element -- uploaded media and avatars */
"use client";

import {
  useEffect,
  useRef,
  useState,
  type RefObject,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  MoreVertical,
  Heart,
  MessageCircle,
  Share2,
  ChartNoAxesColumn,
  Send,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { VideoFeedEntry } from "../video-feed-queue";
import { VideoPlayer } from "./VideoPlayer";
import { MediaStage } from "./MediaLightbox";
import { readStoredVideoMuted, setVideoMuted } from "@/lib/video-sound";
import { publicProfileHref } from "@/lib/profile-route";
import { useViewerPost } from "../hooks/useViewerPost";

export function ImmersivePostSlide({
  entry,
  active,
  times,
  selections,
  onMediaChange,
  onClose,
  onEnded,
  onPlaybackStart,
  onFullscreen,
  closeRef,
  footer,
}: {
  entry: VideoFeedEntry;
  active: boolean;
  times: Map<string, number>;
  selections: Map<string, string>;
  onMediaChange: () => void;
  onClose: () => void;
  onEnded: () => void;
  onPlaybackStart: () => void;
  onFullscreen: () => void;
  closeRef?: RefObject<HTMLButtonElement | null>;
  footer?: ReactNode;
}) {
  const media = entry.media?.length ? entry.media : [entry.item];
  const [mediaIndex, setMediaIndex] = useState(
    Math.max(
      0,
      media.findIndex((item) => item.id === (selections.get(entry.postId) ?? entry.item.id)),
    ),
  );
  const item = media[mediaIndex];
  const [visible, setVisible] = useState(true);
  const [menu, setMenu] = useState(false);
  const [replying, setReplying] = useState(false);
  const [ratio, setRatio] = useState(
    item.width && item.height ? item.width / item.height : 9 / 16,
  );
  const [controlsHost, setControlsHost] = useState<HTMLDivElement | null>(null);
  const gesture = useRef<{ x: number; y: number } | null>(null);
  const suppress = useRef(false);
  const slideRef = useRef<HTMLDivElement>(null);
  const replyRef = useRef<HTMLInputElement>(null);
  const state = useViewerPost(entry.post);
  const portrait = ratio < 1;
  const mediaKey = `${entry.postId}:${item.id}`;
  useEffect(() => {
    const timer = setTimeout(() => {
      if (active) setVisible(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [active]);
  const go = (direction: number) => {
    const next = Math.max(
      0,
      Math.min(media.length - 1, mediaIndex + direction),
    );
    if (next === mediaIndex) return;
    selections.set(entry.postId, media[next].id);
    onMediaChange();
    setMediaIndex(next);
    setVisible(true);
    setMenu(false);
    const nextItem = media[next];
    setRatio(
      nextItem.width && nextItem.height
        ? nextItem.width / nextItem.height
        : 9 / 16,
    );
  };
  const toggleChrome = () => {
    setVisible((value) => !value);
    setMenu(false);
  };
  const count = (value: number) =>
    new Intl.NumberFormat("en", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  const chrome = (className: string) =>
    `viewer-chrome ${className} ${visible ? "" : "viewer-chrome-hidden"}`;
  const author = (
    <div className="viewer-author" dir="ltr">
      {entry.post?.author.avatarUrl ? (
        <img
          src={entry.post.author.avatarUrl}
          alt=""
          className="viewer-avatar"
        />
      ) : (
        <span className="viewer-avatar grid place-items-center bg-white/20">
          {entry.author.slice(0, 1)}
        </span>
      )}
      <a
        href={
          entry.post
            ? publicProfileHref(entry.post.author.type, entry.post.author.id)
            : undefined
        }
        className="min-w-0 flex-1"
        onClick={onClose}
      >
        <span className="flex items-center gap-1 truncate font-bold">
          {entry.author}
          {entry.post?.author.verified && (
            <BadgeCheck size={17} className="text-sky-400" />
          )}
        </span>
        <span className="block truncate text-sm text-white/70">
          {entry.post?.handle}
        </span>
      </a>
      {entry.post && (
        <button
          type="button"
          className="viewer-follow"
          disabled={state.busy || !state.followReady}
          onClick={() => void state.follow()}
        >
          {state.following ? "دنبال می‌کنید" : "دنبال کردن"}
        </button>
      )}
    </div>
  );
  return (
    <div
      ref={slideRef}
      className={`immersive-post ${portrait ? "is-portrait" : "is-landscape"}`}
      data-chrome-visible={visible}
      onClickCapture={(event) => {
        if (suppress.current) {
          event.preventDefault();
          event.stopPropagation();
          suppress.current = false;
        }
      }}
      onPointerDown={(event) => {
        suppress.current = false;
        if (!event.isPrimary) {
          gesture.current = null;
          return;
        }
        if (
          item.kind === "image" ||
          (event.target as HTMLElement).closest(
            "button,a,input,textarea,[role=slider]",
          )
        )
          return;
        gesture.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerUp={(event) => {
        const start = gesture.current;
        gesture.current = null;
        if (!start) return;
        const dx = event.clientX - start.x,
          dy = event.clientY - start.y;
        if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.2) {
          suppress.current = true;
          go(dx < 0 ? 1 : -1);
        }
      }}
      onPointerCancel={() => {
        gesture.current = null;
      }}
    >
      <div
        className="viewer-media-stage"
        onClick={(event) => {
          if (event.target === event.currentTarget) toggleChrome();
        }}
      >
        {item.kind === "video" ? (
          <VideoPlayer
            key={mediaKey}
            item={item}
            variant="immersive"
            fillStage
            active={active}
            initialTime={times.get(mediaKey) || 0}
            onPlaybackTime={(time) => times.set(mediaKey, time)}
            chromeVisible={visible}
            onToggleChrome={toggleChrome}
            controlsHost={controlsHost}
            onAspectRatio={setRatio}
            onEnded={onEnded}
            onPlaybackStart={onPlaybackStart}
            onRequestFullscreen={onFullscreen}
          />
        ) : (
          <MediaStage
            key={mediaKey}
            item={item}
            onSwipe={go}
            onBackdropClick={toggleChrome}
            immersive
            chromeVisible={visible}
          />
        )}
      </div>
      {portrait && (
        <div className={chrome("viewer-top-author")} inert={!visible}>
          {author}
        </div>
      )}
      <div className={chrome("viewer-bottom")} inert={!visible}>
        {!portrait && author}
        {!portrait && (
          <p dir="rtl" className="viewer-caption">
            {entry.body}
          </p>
        )}
        <div className="viewer-controls-slot" ref={setControlsHost} />
        {media.length > 1 && (
          <div
            className="viewer-pagination"
            dir="ltr"
            role="group"
            aria-label="انتخاب رسانه"
          >
            {media.map((attachment, i) => (
              <button
                key={attachment.id}
                type="button"
                aria-label={`رسانهٔ ${i + 1}`}
                aria-current={i === mediaIndex ? "true" : undefined}
                onClick={() => go(i - mediaIndex)}
                className={i === mediaIndex ? "is-current" : ""}
              />
            ))}
          </div>
        )}
        {portrait && (
          <p dir="rtl" className="viewer-caption">
            {entry.body}
          </p>
        )}
        {entry.post && (
          <div className="viewer-actions" dir="ltr">
            <button
              type="button"
              aria-label="پاسخ"
              onClick={() => {
                setReplying(true);
                setTimeout(() => replyRef.current?.focus(), 0);
              }}
            >
              <MessageCircle />
              <span>{count(state.stats.comments)}</span>
            </button>
            <button
              type="button"
              aria-label="پسندیدن"
              aria-pressed={state.viewerState.liked}
              disabled={state.busy}
              onClick={() => void state.toggle("like")}
              className={state.viewerState.liked ? "text-pink-500" : ""}
            >
              <Heart fill={state.viewerState.liked ? "currentColor" : "none"} />
              <span>{count(state.stats.likes)}</span>
            </button>
            <span
              aria-label={`${state.stats.views} بازدید`}
              className="viewer-views"
            >
              <ChartNoAxesColumn />
              <span>{count(state.stats.views)}</span>
            </span>
            <button
              type="button"
              aria-label="اشتراک‌گذاری"
              onClick={() => void state.share()}
            >
              <Share2 />
            </button>
          </div>
        )}
        {entry.post && (portrait || replying) && (
          <form
            className="viewer-reply"
            onSubmit={(event) => {
              event.preventDefault();
              void state.reply();
            }}
            dir="rtl"
          >
            <input
              ref={replyRef}
              value={state.draft}
              onChange={(event) => state.setDraft(event.target.value)}
              placeholder="پاسخ خود را بنویسید"
              aria-label="پاسخ به روایت"
            />
            <button
              type="submit"
              aria-label="ارسال پاسخ"
              disabled={state.busy || !state.draft.trim()}
            >
              <Send size={20} />
            </button>
          </form>
        )}
        {state.notice && (
          <p role="status" className="text-center text-xs py-1">
            {state.notice}
          </p>
        )}
        {footer}
      </div>
      {media.length > 1 && (
        <div
          className={chrome("viewer-media-arrows")}
          inert={!visible}
          dir="ltr"
        >
          <button
            aria-label="رسانهٔ بعدی"
            disabled={mediaIndex === media.length - 1}
            onClick={() => go(1)}
          >
            <ChevronLeft />
          </button>
          <button
            aria-label="رسانهٔ قبلی"
            disabled={mediaIndex === 0}
            onClick={() => go(-1)}
          >
            <ChevronRight />
          </button>
        </div>
      )}
    </div>
  );
}
