"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  BadgeCheck,
  Bolt,
  FileText,
  Image as ImageIcon,
  LoaderCircle,
  Maximize2,
  Mic,
  Pause,
  Play,
  Video,
  Volume2,
  VolumeX,
} from "lucide-react";

import { ConnectedGoodActionCard } from "./ConnectedGoodActionCard";
import { PostActions } from "./PostActions";
import type { FeedAttachment, FeedPost } from "../types";

type PostCardProps = {
  post: FeedPost;
  variant?: "timeline" | "detail";
  liked: boolean;
  reposted: boolean;
  joined: boolean;
  onLike: () => void;
  onRepost: () => void;
  onShare: () => void;
  onJoin: () => void;
  onOpenMedia: () => void;
};

const attachmentIcons = {
  image: ImageIcon,
  video: Video,
  article: FileText,
  microphone: Mic,
  bolt: Bolt,
};

function faDigits(value: string) {
  return value.replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)] ?? digit);
}

function TimelineMediaReflectionText({
  reflection,
}: {
  reflection: NonNullable<FeedPost["mediaReflection"]>;
}) {
  const outlets = reflection.outlets?.filter(Boolean) || (reflection.outlet ? [reflection.outlet] : []);

  if (!outlets.length) {
    return <>{reflection.headline}</>;
  }

  if (outlets.length === 1) {
    return (
      <>
        بازنشر شده در <strong className="font-black text-foreground">{outlets[0]}</strong>
      </>
    );
  }

  if (outlets.length === 2) {
    return (
      <>
        بازنشر شده در <strong className="font-black text-foreground">{outlets[0]}</strong> و{" "}
        <strong className="font-black text-foreground">{outlets[1]}</strong>
      </>
    );
  }

  if (outlets.length === 3) {
    return (
      <>
        بازنشر شده در <strong className="font-black text-foreground">{outlets[0]}</strong>،{" "}
        <strong className="font-black text-foreground">{outlets[1]}</strong> و{" "}
        <strong className="font-black text-foreground">{outlets[2]}</strong>
      </>
    );
  }

  return (
    <>
      بازنشر شده در <strong className="font-black text-foreground">{outlets[0]}</strong>،{" "}
      <strong className="font-black text-foreground">{outlets[1]}</strong>،{" "}
      <strong className="font-black text-foreground">{outlets[2]}</strong> و{" "}
      {(outlets.length - 3).toLocaleString("fa-IR")} رسانه دیگر
    </>
  );
}

function formatMediaTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "۰:۰۰";

  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  const value = hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    : `${minutes}:${String(secs).padStart(2, "0")}`;

  return faDigits(value);
}

function mediaAspectRatio(width?: number, height?: number) {
  if (!width || !height || width <= 0 || height <= 0) return 16 / 9;
  return width / height;
}

function lastRangeEnd(ranges: TimeRanges) {
  if (!ranges.length) return 0;

  try {
    const end = ranges.end(ranges.length - 1);
    return Number.isFinite(end) && end > 0 ? end : 0;
  } catch {
    return 0;
  }
}

function resolveMediaDuration(video: HTMLVideoElement) {
  if (Number.isFinite(video.duration) && video.duration > 0) {
    return video.duration;
  }

  const seekableEnd = lastRangeEnd(video.seekable);
  if (seekableEnd > 0) return seekableEnd;

  const bufferedEnd = lastRangeEnd(video.buffered);
  if (bufferedEnd > 0) return bufferedEnd;

  return 0;
}

function VideoAttachment({ attachment }: { attachment: FeedAttachment }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const seekingRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [aspectRatio, setAspectRatio] = useState(() =>
    mediaAspectRatio(attachment.width, attachment.height),
  );

  const source = attachment.previewSrc;
  const progress = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const syncDuration = (video: HTMLVideoElement) => {
    const resolved = resolveMediaDuration(video);
    if (resolved > 0) setDuration(resolved);
    return resolved;
  };

  const syncVideoMetrics = (video: HTMLVideoElement) => {
    syncDuration(video);

    if (video.videoWidth > 0 && video.videoHeight > 0) {
      setAspectRatio(mediaAspectRatio(video.videoWidth, video.videoHeight));
    }

    setCurrentTime(Number.isFinite(video.currentTime) ? video.currentTime : 0);
    setIsMuted(video.muted);
  };

  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video || hasError) return;

    if (video.paused || video.ended) {
      try {
        await video.play();
      } catch {
        setHasError(true);
      }
      return;
    }

    video.pause();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const seekTo = (nextTime: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(nextTime)) return;

    const resolvedDuration = syncDuration(video) || duration;
    if (resolvedDuration <= 0) return;

    const clamped = Math.min(resolvedDuration, Math.max(0, nextTime));

    try {
      video.currentTime = clamped;
      setCurrentTime(clamped);
    } catch {
      // Some browsers can briefly reject seeks before metadata is ready.
    }
  };

  const seekFromClientX = (clientX: number) => {
    const track = progressRef.current;
    const video = videoRef.current;
    if (!track || !video) return;

    const resolvedDuration = syncDuration(video) || duration;
    if (resolvedDuration <= 0) return;

    const rect = track.getBoundingClientRect();
    if (rect.width <= 0) return;

    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    seekTo(ratio * resolvedDuration);
  };

  const finishSeeking = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!seekingRef.current) return;

    seekFromClientX(event.clientX);
    seekingRef.current = false;
    setIsSeeking(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const toggleFullscreen = async () => {
    const wrapper = wrapperRef.current;
    const video = videoRef.current;
    if (!wrapper || !video) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      if (wrapper.requestFullscreen) {
        await wrapper.requestFullscreen();
        return;
      }

      const iosVideo = video as HTMLVideoElement & {
        webkitEnterFullscreen?: () => void;
      };
      iosVideo.webkitEnterFullscreen?.();
    } catch {
      // Fullscreen availability differs between browsers; playback must continue regardless.
    }
  };

  if (!source) return null;

  return (
    <div
      ref={wrapperRef}
      data-media-interactive
      className="group/video pointer-events-auto relative z-20 w-full overflow-hidden rounded-[16px] border border-border bg-black shadow-sm"
      style={{ aspectRatio }}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
    >
      <video
        ref={videoRef}
        src={source}
        playsInline
        preload="metadata"
        aria-label={attachment.label || "پخش ویدیو"}
        className="absolute inset-0 h-full w-full cursor-pointer bg-black object-contain"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void togglePlayback();
        }}
        onLoadedMetadata={(event) => syncVideoMetrics(event.currentTarget)}
        onLoadedData={(event) => syncVideoMetrics(event.currentTarget)}
        onDurationChange={(event) => syncDuration(event.currentTarget)}
        onProgress={(event) => syncDuration(event.currentTarget)}
        onTimeUpdate={(event) => {
          const video = event.currentTarget;
          setCurrentTime(video.currentTime);
          syncDuration(video);
        }}
        onPlay={() => {
          setIsPlaying(true);
          setIsWaiting(false);
          setHasError(false);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={(event) => {
          const video = event.currentTarget;
          const resolvedDuration = syncDuration(video);
          setIsPlaying(false);
          setCurrentTime(resolvedDuration || video.currentTime || 0);
        }}
        onWaiting={() => setIsWaiting(true)}
        onCanPlay={(event) => {
          setIsWaiting(false);
          syncVideoMetrics(event.currentTarget);
        }}
        onPlaying={(event) => {
          setIsWaiting(false);
          syncDuration(event.currentTarget);
        }}
        onVolumeChange={(event) => setIsMuted(event.currentTarget.muted)}
        onError={() => {
          setHasError(true);
          setIsPlaying(false);
          setIsWaiting(false);
        }}
      />

      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-28 bg-gradient-to-t from-black/75 via-black/25 to-transparent"
      />

      {isWaiting && !hasError ? (
        <span className="pointer-events-none absolute inset-0 z-30 grid place-items-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-black/60 text-white shadow-xl backdrop-blur-sm">
            <LoaderCircle aria-hidden="true" className="h-6 w-6 animate-spin" />
          </span>
        </span>
      ) : null}

      {!isPlaying && !isWaiting && !hasError ? (
        <button
          type="button"
          aria-label="پخش ویدیو"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void togglePlayback();
          }}
          className="absolute inset-0 z-30 m-auto grid h-14 w-14 place-items-center rounded-full bg-black/60 text-white shadow-xl backdrop-blur-md transition hover:scale-105 hover:bg-black/70 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90"
        >
          <Play aria-hidden="true" className="ml-0.5 h-6 w-6 fill-current" />
        </button>
      ) : null}

      {!hasError ? (
        <div
          dir="ltr"
          className={`absolute inset-x-0 bottom-0 z-40 px-3 pb-2.5 pt-7 transition-opacity duration-200 ${
            isPlaying && !isSeeking
              ? "opacity-0 group-hover/video:opacity-100 group-focus-within/video:opacity-100"
              : "opacity-100"
          }`}
          onClick={(event) => event.stopPropagation()}
        >
          <div
            ref={progressRef}
            role="slider"
            tabIndex={0}
            aria-label="موقعیت پخش ویدیو"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(currentTime)}
            className="relative mb-2 h-5 w-full cursor-pointer touch-none select-none focus-visible:outline-none"
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();

              seekingRef.current = true;
              setIsSeeking(true);
              event.currentTarget.setPointerCapture(event.pointerId);
              seekFromClientX(event.clientX);
            }}
            onPointerMove={(event) => {
              if (!seekingRef.current) return;
              event.preventDefault();
              event.stopPropagation();
              seekFromClientX(event.clientX);
            }}
            onPointerUp={(event) => {
              event.preventDefault();
              event.stopPropagation();
              finishSeeking(event);
            }}
            onPointerCancel={(event) => {
              event.stopPropagation();
              seekingRef.current = false;
              setIsSeeking(false);

              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
              }
            }}
            onKeyDown={(event) => {
              if (duration <= 0) return;

              if (event.key === "ArrowLeft") {
                event.preventDefault();
                seekTo(currentTime - 5);
              } else if (event.key === "ArrowRight") {
                event.preventDefault();
                seekTo(currentTime + 5);
              } else if (event.key === "Home") {
                event.preventDefault();
                seekTo(0);
              } else if (event.key === "End") {
                event.preventDefault();
                seekTo(duration);
              }
            }}
          >
            <span className="pointer-events-none absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-white/35" />
            <span
              className="pointer-events-none absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-white"
              style={{ width: `${progress}%` }}
            />
            <span
              className={`pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-sm transition-opacity ${
                isSeeking ? "opacity-100" : "opacity-0 group-hover/video:opacity-100"
              }`}
              style={{ left: `${progress}%` }}
            />
          </div>

          <div className="flex h-8 items-center gap-2 text-white">
            <button
              type="button"
              aria-label={isPlaying ? "توقف موقت ویدیو" : "پخش ویدیو"}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void togglePlayback();
              }}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full transition hover:bg-white/15 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            >
              {isPlaying ? (
                <Pause aria-hidden="true" className="h-[18px] w-[18px] fill-current" />
              ) : (
                <Play aria-hidden="true" className="ml-0.5 h-[18px] w-[18px] fill-current" />
              )}
            </button>

            <span className="shrink-0 text-[12px] font-medium tabular-nums text-white/95">
              {formatMediaTime(currentTime)} / {formatMediaTime(duration)}
            </span>

            <span className="min-w-0 flex-1" />

            <button
              type="button"
              aria-label={isMuted ? "فعال کردن صدای ویدیو" : "بی‌صدا کردن ویدیو"}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                toggleMute();
              }}
              className="hidden h-8 w-8 shrink-0 place-items-center rounded-full transition hover:bg-white/15 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:grid"
            >
              {isMuted ? (
                <VolumeX aria-hidden="true" className="h-[18px] w-[18px]" />
              ) : (
                <Volume2 aria-hidden="true" className="h-[18px] w-[18px]" />
              )}
            </button>

            <button
              type="button"
              aria-label="نمایش تمام‌صفحه"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void toggleFullscreen();
              }}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full transition hover:bg-white/15 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            >
              <Maximize2 aria-hidden="true" className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      ) : null}

      {hasError ? (
        <div className="absolute inset-0 z-50 grid place-items-center bg-black px-6 text-center text-white">
          <div>
            <Video aria-hidden="true" className="mx-auto h-7 w-7" />
            <p className="mt-2 text-sm font-bold">پخش ویدیو ممکن نشد</p>
            <p className="mt-1 text-xs text-white/65">
              فایل ویدیو در دسترس نیست یا مرورگر نتوانست آن را پخش کند.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PrimaryAttachment({
  attachment,
  singleImage = false,
}: {
  attachment: FeedAttachment;
  singleImage?: boolean;
}) {
  const Icon = attachmentIcons[attachment.icon];

  const intrinsicRatio =
    attachment.width && attachment.height
      ? Math.min(16 / 9, Math.max(4 / 5, attachment.width / attachment.height))
      : 16 / 9;

  if (attachment.icon === "video" && attachment.previewSrc) {
    return <VideoAttachment attachment={attachment} />;
  }

  if (attachment.previewSrc) {
    return (
      <div
        className={`group/media relative overflow-hidden rounded-[16px] border border-border bg-surface-sunken ${
          singleImage ? "" : "aspect-video"
        }`}
        style={singleImage ? { aspectRatio: intrinsicRatio } : undefined}
      >
        <Image
          src={attachment.previewSrc}
          alt={attachment.previewAlt ?? attachment.label}
          fill
          unoptimized={attachment.previewSrc.startsWith("http")}
          sizes="(max-width: 640px) calc(100vw - 72px), 520px"
          className="object-cover transition-transform duration-300 group-hover/media:scale-[1.01]"
          draggable={false}
        />

        {attachment.icon !== "image" && attachment.label ? (
          <span className="absolute bottom-2 left-2 max-w-[70%] truncate rounded-md bg-black/55 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
            {attachment.label}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex min-h-20 items-center gap-3 rounded-[16px] border border-border bg-surface px-3.5 py-3 transition-colors hover:bg-hover">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-muted text-brand">
        <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
      </span>

      <span className="min-w-0">
        <strong className="block truncate text-[13px] font-bold text-foreground">
          {attachment.label}
        </strong>

        {attachment.detail ? (
          <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
            {attachment.detail}
          </span>
        ) : null}
      </span>
    </div>
  );
}

function DetailMediaScroller({
  attachments,
}: {
  attachments: FeedAttachment[];
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const dragState = useRef({
    active: false,
    moved: false,
    startX: 0,
    scrollLeft: 0,
  });

  const [isDragging, setIsDragging] = useState(false);

  const finishDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragState.current.active) return;

    dragState.current.active = false;
    setIsDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div
      ref={scrollerRef}
      dir="rtl"
      role="region"
      tabIndex={0}
      aria-label="رسانه‌های ضمیمه؛ برای مشاهده موارد بیشتر افقی پیمایش کنید"
      className={`pointer-events-auto mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 no-scrollbar focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
        isDragging
          ? "cursor-grabbing snap-none select-none"
          : "cursor-grab"
      }`}
      onPointerDown={(event) => {
        if (event.pointerType !== "mouse" || event.button !== 0) return;

        if (
          event.target instanceof Element &&
          event.target.closest("[data-media-interactive], video, button, input, a")
        ) {
          return;
        }

        const scroller = scrollerRef.current;
        if (!scroller) return;

        dragState.current = {
          active: true,
          moved: false,
          startX: event.clientX,
          scrollLeft: scroller.scrollLeft,
        };

        event.currentTarget.setPointerCapture(event.pointerId);
        setIsDragging(true);
      }}
      onPointerMove={(event) => {
        const scroller = scrollerRef.current;

        if (!scroller || !dragState.current.active) return;

        const deltaX = event.clientX - dragState.current.startX;

        if (Math.abs(deltaX) > 3) {
          dragState.current.moved = true;
        }

        scroller.scrollLeft = dragState.current.scrollLeft - deltaX;

        event.preventDefault();
      }}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      onClickCapture={(event) => {
        if (!dragState.current.moved) return;

        event.preventDefault();
        event.stopPropagation();

        dragState.current.moved = false;
      }}
      onDragStart={(event) => event.preventDefault()}
    >
      {attachments.map((attachment) => (
        <div
          dir="rtl"
          key={attachment.id}
          className="min-w-[86%] snap-start first:mr-0"
        >
          <PrimaryAttachment
            attachment={attachment}
            singleImage={
              attachments.length === 1 &&
              attachment.icon === "image"
            }
          />
        </div>
      ))}
    </div>
  );
}

export function PostCard({
  post,
  variant = "timeline",
  liked,
  reposted,
  joined,
  onLike,
  onRepost,
  onShare,
  onJoin,
  onOpenMedia,
}: PostCardProps) {
  void reposted;
  void onRepost;
  void onJoin;

  const [primaryAttachment, ...otherAttachments] = post.attachments;

  const isDetail = variant === "detail";

  const profileHref = (
    `/profile/${post.author.type}/${post.author.id}`
  ) as Route;

  const squareHref = (
    `/profile/square/${post.author.id}`
  ) as Route;

  /*
   * Detail
   */
  if (isDetail) {
    return (
      <article className="relative border-b border-divider px-4 pb-3 pt-3">
        {/* Author */}
        <div className="flex items-center gap-2.5" dir="rtl">
          <Link
            href={squareHref}
            aria-label={`مشاهده پروفایل ${post.squareName}`}
            className="pointer-events-auto shrink-0"
          >
            {post.author.avatarUrl ? (
              <Image
                src={post.author.avatarUrl}
                alt=""
                width={44}
                height={44}
                unoptimized={post.author.avatarUrl.startsWith("http")}
                className="h-11 w-11 rounded-full object-cover ring-1 ring-border/70 transition-opacity hover:opacity-90"
              />
            ) : (
              <span
                aria-hidden="true"
                className="grid h-11 w-11 place-items-center rounded-full bg-brand text-xs font-black text-brand-foreground"
              >
                {post.squareName.slice(0, 1)}
              </span>
            )}
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <Link
                href={squareHref}
                className="min-w-0 truncate text-[15px] font-black leading-6 text-foreground hover:underline"
              >
                {post.squareName}
              </Link>

              {post.author.verified ? (
                <BadgeCheck
                  aria-label="حساب تأییدشده"
                  className="h-[18px] w-[18px] shrink-0 fill-verified text-on-solid"
                />
              ) : null}
            </div>

            <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[12px] text-muted-foreground">
              {post.badge ? (
                <span className="min-w-0 truncate">{post.badge}</span>
              ) : null}

              {post.badge ? <span aria-hidden="true">·</span> : null}

              <span className="shrink-0 whitespace-nowrap">
                {post.timeAgo}
              </span>
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="mt-3" dir="rtl">
          {post.title !== post.squareName ? (
            <h1 className="sr-only">{post.title}</h1>
          ) : null}

          <p className="whitespace-pre-wrap break-words text-[16px] leading-8 text-foreground">
            {post.body}
          </p>
        </div>

        {/* Media */}
        {post.attachments.length === 1 && primaryAttachment ? (
          <div className="mt-3">
            <PrimaryAttachment
              attachment={primaryAttachment}
              singleImage={primaryAttachment.icon === "image"}
            />
          </div>
        ) : post.attachments.length > 1 ? (
          <DetailMediaScroller attachments={post.attachments} />
        ) : null}

        {/* Related media */}
        {post.mediaReflection ? (
          post.mediaReflection.url ? (
            <a
              href={post.mediaReflection.url}
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto mt-3 flex w-full items-center justify-between gap-3 rounded-[14px] border border-border bg-surface px-3 py-2.5 text-right transition-colors hover:bg-hover"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-warning-surface">
                  <BadgeCheck
                    aria-hidden="true"
                    className="h-4 w-4 fill-warning text-warning"
                  />
                </span>

                <span className="truncate text-[12px] text-foreground-secondary">
                  {post.mediaReflection.headline}
                </span>
              </span>

              <span className="shrink-0 whitespace-nowrap text-[11px] font-black text-link">
                مشاهده خبر
              </span>
            </a>
          ) : (
            <button
              type="button"
              onClick={onOpenMedia}
              className="pointer-events-auto mt-3 flex w-full items-center justify-between gap-3 rounded-[14px] border border-border bg-surface px-3 py-2.5 text-right transition-colors hover:bg-hover"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-warning-surface">
                  <BadgeCheck
                    aria-hidden="true"
                    className="h-4 w-4 fill-warning text-warning"
                  />
                </span>

                <span className="truncate text-[12px] text-foreground-secondary">
                  {post.mediaReflection.headline}
                </span>
              </span>

              <span className="shrink-0 whitespace-nowrap text-[11px] font-black text-link">
                مشاهده خبر
              </span>
            </button>
          )
        ) : null}

        {post.initiativeId ? (
          <ConnectedGoodActionCard
            initiativeId={post.initiativeId}
            initialJoined={joined}
            initialParticipantCount={post.initiativeParticipantCount}
            label={post.callToAction ?? "پیوستن"}
          />
        ) : null}

        {/* Actions */}
        <PostActions
          postId={post.id}
          likes={post.stats.likes}
          comments={post.stats.comments}
          views={post.stats.views}
          liked={liked}
          onLike={onLike}
          onShare={onShare}
          className="mt-3"
        />
      </article>
    );
  }

  /*
   * Timeline
   */
  return (
    <article className="relative border-b border-divider bg-surface px-3 py-3 transition-colors duration-150 hover:bg-hover/20 sm:px-4">
      <Link
        href={(`/posts/${post.id}`) as Route}
        aria-label={`مشاهده روایت ${post.title}`}
        className="absolute inset-0 z-0"
      />

      <div className="pointer-events-none relative z-10 flex items-start gap-2.5">
        <Link
          href={profileHref}
          aria-label={`مشاهده پروفایل ${post.squareName}`}
          className="pointer-events-auto relative z-10 shrink-0"
        >
          {post.author.avatarUrl ? (
            <Image
              src={post.author.avatarUrl}
              alt=""
              width={40}
              height={40}
              unoptimized={post.author.avatarUrl.startsWith("http")}
              className="h-10 w-10 rounded-full object-cover ring-1 ring-border/70 transition-opacity hover:opacity-90"
            />
          ) : (
            <span
              aria-hidden="true"
              className="grid h-10 w-10 place-items-center rounded-full bg-brand text-xs font-black text-brand-foreground"
            >
              {post.squareName.slice(0, 1)}
            </span>
          )}
        </Link>

        {/* این ستون عرض تصویر، CTA و اکشن‌ها را یکی می‌کند */}
        <div className="min-w-0 flex-1">
          <div
            dir="rtl"
            className="flex min-w-0 items-center gap-1.5 leading-5"
          >
            <Link
              href={profileHref}
              className="pointer-events-auto relative z-10 min-w-0 truncate text-[14px] font-black text-foreground hover:underline"
            >
              {post.squareName}
            </Link>

            {post.author.verified ? (
              <BadgeCheck
                aria-label="حساب تأییدشده"
                className="h-[17px] w-[17px] shrink-0 fill-verified text-on-solid"
              />
            ) : null}

            {post.badge ? (
              <>
                <span
                  aria-hidden="true"
                  className="shrink-0 text-[11px] text-foreground-subtle"
                >
                  ·
                </span>

                <span className="min-w-0 truncate text-[11px] text-muted-foreground">
                  {post.badge}
                </span>
              </>
            ) : null}

            <span
              aria-hidden="true"
              className="shrink-0 text-[11px] text-foreground-subtle"
            >
              ·
            </span>

            <span className="shrink-0 whitespace-nowrap text-[11px] text-muted-foreground">
              {post.timeAgo}
            </span>
          </div>

          <div className="mt-0.5">
            {post.title !== post.squareName ? (
              <h2 className="text-[15px] font-bold leading-6 text-foreground">
                {post.title}
              </h2>
            ) : null}

            <p
              className={`whitespace-pre-wrap break-words text-[14px] leading-[1.75] text-foreground ${
                post.title !== post.squareName ? "mt-0.5" : ""
              }`}
            >
              {post.body}
            </p>
          </div>

          {primaryAttachment ? (
            <div className="mt-2.5">
              <PrimaryAttachment
                attachment={primaryAttachment}
                singleImage={
                  post.attachments.length === 1 &&
                  primaryAttachment.icon === "image"
                }
              />
            </div>
          ) : null}

          {otherAttachments.length > 0 ? (
            <p
              className="mt-1.5 flex min-w-0 items-center gap-1 text-[11px] leading-5 text-muted-foreground"
              aria-label="ضمیمه‌های بیشتر"
            >
              <span className="shrink-0 font-bold text-foreground-secondary">
                +{otherAttachments.length.toLocaleString("fa-IR")}
              </span>

              <span className="truncate">
                {otherAttachments
                  .map((attachment) => attachment.label)
                  .join("، ")}
              </span>
            </p>
          ) : null}

          {post.mediaReflection ? (
            post.mediaReflection.url ? (
              <a
                href={post.mediaReflection.url}
                target="_blank"
                rel="noopener noreferrer"
                className="pointer-events-auto relative z-10 mt-2 block w-full rounded-[12px] border border-border px-2.5 py-2 text-right transition-colors hover:bg-hover"
              >
                <span className="block truncate text-[11px] text-foreground-secondary">
                  <TimelineMediaReflectionText reflection={post.mediaReflection} />
                </span>
              </a>
            ) : (
              <div className="relative z-10 mt-2 block w-full rounded-[12px] border border-border px-2.5 py-2 text-right">
                <span className="block truncate text-[11px] text-foreground-secondary">
                  <TimelineMediaReflectionText reflection={post.mediaReflection} />
                </span>
              </div>
            )
          ) : null}

          {post.initiativeId ? (
            <ConnectedGoodActionCard
              initiativeId={post.initiativeId}
              initialJoined={joined}
              initialParticipantCount={post.initiativeParticipantCount}
              label={post.callToAction ?? "پیوستن"}
            />
          ) : null}

          <PostActions
            postId={post.id}
            likes={post.stats.likes}
            comments={post.stats.comments}
            views={post.stats.views}
            liked={liked}
            onLike={onLike}
            onShare={onShare}
            className="mt-3"
          />
        </div>
      </div>
    </article>
  );
}
