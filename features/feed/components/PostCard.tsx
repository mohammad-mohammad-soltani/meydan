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
  Mic,
  Pause,
  Play,
  Video,
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

function VideoAttachment({ attachment }: { attachment: FeedAttachment }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [hasError, setHasError] = useState(false);

  const source = attachment.previewSrc;

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

  if (!source) return null;

  return (
    <div
      data-media-interactive
      className="pointer-events-auto relative z-20 aspect-video overflow-hidden rounded-[16px] border border-border bg-black shadow-sm"
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
    >
      <video
        ref={videoRef}
        src={source}
        controls
        playsInline
        preload="metadata"
        aria-label={attachment.label || "پخش ویدیو"}
        className="h-full w-full bg-black object-contain"
        onPlay={() => {
          setIsPlaying(true);
          setIsWaiting(false);
          setHasError(false);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onWaiting={() => setIsWaiting(true)}
        onCanPlay={() => setIsWaiting(false)}
        onPlaying={() => setIsWaiting(false)}
        onError={() => {
          setHasError(true);
          setIsPlaying(false);
          setIsWaiting(false);
        }}
      />

      {!isPlaying && !hasError ? (
        <button
          type="button"
          aria-label="پخش ویدیو"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void togglePlayback();
          }}
          className="absolute inset-0 m-auto grid h-14 w-14 place-items-center rounded-full bg-black/65 text-white shadow-xl backdrop-blur-sm transition hover:bg-black/75 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
        >
          {isWaiting ? (
            <LoaderCircle aria-hidden="true" className="h-6 w-6 animate-spin" />
          ) : (
            <Play aria-hidden="true" className="ml-0.5 h-6 w-6 fill-current" />
          )}
        </button>
      ) : null}

      {isPlaying && isWaiting ? (
        <span className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-black/60 text-white backdrop-blur-sm">
            <LoaderCircle aria-hidden="true" className="h-6 w-6 animate-spin" />
          </span>
        </span>
      ) : null}

      {isPlaying ? (
        <button
          type="button"
          aria-label="توقف موقت ویدیو"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void togglePlayback();
          }}
          className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/55 text-white opacity-0 shadow-md backdrop-blur-sm transition hover:bg-black/70 focus:opacity-100 group-hover/media:opacity-100"
        >
          <Pause aria-hidden="true" className="h-4 w-4 fill-current" />
        </button>
      ) : null}

      {hasError ? (
        <div className="absolute inset-0 grid place-items-center bg-black/80 px-6 text-center text-white">
          <div>
            <Video aria-hidden="true" className="mx-auto h-7 w-7" />
            <p className="mt-2 text-sm font-bold">پخش ویدیو ممکن نشد</p>
            <p className="mt-1 text-xs text-white/70">فایل ویدیو در دسترس نیست یا مرورگر نتوانست آن را پخش کند.</p>
          </div>
        </div>
      ) : null}

      {!hasError && attachment.label ? (
        <span className="pointer-events-none absolute right-2 top-2 max-w-[72%] truncate rounded-md bg-black/55 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
          {attachment.label}
        </span>
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
    <article className="relative border-b border-divider px-3 py-3 transition-colors duration-150 hover:bg-hover sm:px-4">
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
            <div className="relative z-10 mt-2 flex w-full items-center gap-2 rounded-[12px] border border-border px-2.5 py-2 text-right">
              <BadgeCheck
                aria-hidden="true"
                className="h-4 w-4 shrink-0 fill-warning text-warning"
              />

              <span className="truncate text-[11px] text-foreground-secondary">
                {post.mediaReflection.headline}
              </span>
            </div>
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
