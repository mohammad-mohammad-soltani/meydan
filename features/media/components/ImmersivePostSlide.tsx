"use client";

import Link from "next/link";
import { OptimizedAvatar } from "@/components/shared/OptimizedAvatar";
import type { Route } from "next";
import {
  useEffect,
  useRef,
  useState,
  type RefObject,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
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
import { publicProfileHref } from "@/lib/profile-route";
import { useViewerPost } from "../hooks/useViewerPost";
import { useDragPager } from "../use-drag-pager";

/**
 * Stand-in for a neighbouring attachment while it is being dragged in. Mounting
 * a second player or zoomable stage for a pane the viewer may never commit to
 * would cost far more than the still it is about to replace.
 */
function MediaNeighbour({ item }: { item: VideoFeedEntry["item"] }) {
  const src = item.kind === "video" ? item.poster : item.src;
  if (!src) return null;
  return (
    <div
      aria-hidden="true"
      className="viewer-media-preview"
      style={{ backgroundImage: `url(${JSON.stringify(src)})` }}
    />
  );
}

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
  const [ratio, setRatio] = useState(
    item.width && item.height ? item.width / item.height : 9 / 16,
  );
  const [controlsHost, setControlsHost] = useState<HTMLDivElement | null>(null);
  const suppress = useRef(false);
  const slideRef = useRef<HTMLDivElement>(null);
  const replyRef = useRef<HTMLInputElement>(null);
  const state = useViewerPost(entry.post);
  // Images always use the stable landscape viewer layout. Their intrinsic
  // ratio only changes how the image is fitted inside the media stage; it must
  // never move the author/meta/actions between the top and bottom chrome.
  const portrait = item.kind === "video" && ratio < 1;
  const imageViewer = item.kind === "image";
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
    const nextItem = media[next];
    setRatio(
      nextItem.width && nextItem.height
        ? nextItem.width / nextItem.height
        : 9 / 16,
    );
  };
  // Attachments inside one post page horizontally with the same finger-tracked
  // feel as the video feed itself; a zoomed photo keeps its own gestures.
  const { trackRef: mediaTrackRef, handlers: mediaDrag } = useDragPager({
    axis: "x",
    index: mediaIndex,
    count: media.length,
    enabled: media.length > 1,
    transform: (position, drag) => `translate3d(calc(${-position * 100}% + ${drag}px), 0, 0)`,
    onIndexChange: (next) => go(next - mediaIndex),
    reservedSelector: "button, a, input, textarea, [role=slider], [data-image-gesturing=true]",
    onDragged: () => { suppress.current = true; },
  });

  const toggleChrome = () => {
    setVisible((value) => !value);
  };
  const count = (value: number) =>
    new Intl.NumberFormat("en", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  const chrome = (className: string) =>
    `viewer-chrome ${className} ${visible ? "" : "viewer-chrome-hidden"}`;
  const authorIdentity = (
    <>
      {entry.post?.author.avatarUrl ? (
        <OptimizedAvatar
          src={entry.post.author.avatarUrl}
          alt=""
          width={42}
          className="viewer-avatar"
        />
      ) : (
        <span className="viewer-avatar grid place-items-center bg-white/20">
          {entry.author.slice(0, 1)}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1 truncate font-bold">
          {entry.author}
          {entry.post?.author.verified && (
            <BadgeCheck size={17} className="text-sky-400" />
          )}
        </span>
        <span className="block truncate text-sm text-white/70">
          {entry.post?.handle}
        </span>
      </span>
    </>
  );
  const author = (
    <div className="viewer-author" dir="ltr">
      {entry.post ? (
        <Link
          href={
            publicProfileHref(
              entry.post.author.type,
              entry.post.author.id,
            ) as Route
          }
          className="viewer-author-link flex min-w-0 flex-1 items-center gap-3 rounded-lg"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
        >
          {authorIdentity}
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {authorIdentity}
        </div>
      )}
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
      className={`immersive-post ${portrait ? "is-portrait" : "is-landscape"} ${imageViewer ? "is-image-viewer" : ""}`}
      data-chrome-visible={visible}
      onClickCapture={(event) => {
        if (suppress.current) {
          event.preventDefault();
          event.stopPropagation();
          suppress.current = false;
        }
      }}
      {...mediaDrag}
      onPointerDown={(event) => {
        suppress.current = false;
        mediaDrag.onPointerDown(event);
      }}
    >
      <div
        className={chrome("viewer-topbar")}
        inert={!visible}
        dir="ltr"
      >
        <button
          ref={!portrait ? closeRef : undefined}
          type="button"
          className="video-feed-button"
          aria-label="بازگشت"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
        >
          <ArrowLeft aria-hidden="true" />
        </button>
      </div>
      <div className="viewer-media-stage">
        <div
          ref={mediaTrackRef}
          className="viewer-media-track"
          onClick={(event) => {
            // Only a tap on the empty area around the media toggles the chrome.
            const target = event.target as HTMLElement;
            if (target === event.currentTarget || target.classList.contains("viewer-media-slide")) {
              toggleChrome();
            }
          }}
        >
          {media.map((attachment, position) => (
            <div
              key={attachment.id}
              className="viewer-media-slide"
              style={{ transform: `translateX(${position * 100}%)` }}
              inert={position !== mediaIndex}
              aria-hidden={position !== mediaIndex}
            >
              {position === mediaIndex ? (
                item.kind === "video" ? (
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
                    /* Paging is the pager's job now; the stage keeps zoom and pan. */
                    onSwipe={() => {}}
                    onBackdropClick={toggleChrome}
                    immersive
                    chromeVisible={visible}
                  />
                )
              ) : Math.abs(position - mediaIndex) === 1 ? (
                <MediaNeighbour item={attachment} />
              ) : null}
            </div>
          ))}
        </div>
      </div>
      {portrait && (
        <div className={chrome("viewer-top-author")} inert={!visible}>
          <div className="viewer-portrait-author-row" dir="ltr">
            <button
              ref={closeRef}
              type="button"
              className="video-feed-button viewer-portrait-back"
              aria-label="بازگشت"
              onClick={(event) => {
                event.stopPropagation();
                onClose();
              }}
            >
              <ArrowLeft aria-hidden="true" />
            </button>
            {author}
          </div>
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
            <Link
              href={(`/posts/${entry.post.id}#comment-composer`) as Route}
              aria-label="مشاهده نظرها"
              onClick={onClose}
            >
              <MessageCircle />
              <span>{count(state.stats.comments)}</span>
            </Link>
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
        {entry.post && portrait && (
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
