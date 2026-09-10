"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { BadgeCheck, BellRing, Bolt, FileText, Image as ImageIcon, Mic, Play, Video } from "lucide-react";
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

const attachmentIcons = { image: ImageIcon, video: Video, article: FileText, microphone: Mic, bolt: Bolt };

function PrimaryAttachment({ attachment, singleImage = false }: { attachment: FeedAttachment; singleImage?: boolean }) {
  const Icon = attachmentIcons[attachment.icon];
  const intrinsicRatio = attachment.width && attachment.height
    ? Math.min(16 / 9, Math.max(4 / 5, attachment.width / attachment.height))
    : 16 / 9;

  if (attachment.previewSrc) {
    return (
      <div className={`relative overflow-hidden rounded-2xl border border-border bg-surface-muted ${singleImage ? "" : "aspect-video"}`} style={singleImage ? { aspectRatio: intrinsicRatio } : undefined}>
        <Image src={attachment.previewSrc} alt={attachment.previewAlt ?? attachment.label} fill unoptimized={attachment.previewSrc.startsWith("http")} sizes="(max-width: 640px) calc(100vw - 76px), 520px" className="object-cover" draggable={false} />
        {attachment.icon === "video" ? (
          <>
            <span className="absolute inset-0 grid place-items-center bg-active">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-glass text-brand shadow-card"><Play aria-hidden="true" className="ml-0.5 h-5 w-5 fill-current" /></span>
            </span>
            <span className="absolute bottom-2 left-2 right-2 h-1 rounded-full bg-surface-glass"><span className="block h-1 w-1/3 rounded-full bg-brand" /></span>
          </>
        ) : null}
        <span className="absolute bottom-2 right-2 rounded-md bg-scrim px-2 py-1 text-[11px] font-bold text-on-solid backdrop-blur-sm">{attachment.label}</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-24 items-center gap-3 rounded-2xl border border-border bg-surface-muted px-4 py-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-muted text-brand"><Icon aria-hidden="true" className="h-5 w-5" /></span>
      <span className="min-w-0"><strong className="block text-sm text-foreground">{attachment.label}</strong><span className="mt-1 block text-xs text-muted-foreground">{attachment.detail}</span></span>
    </div>
  );
}

function DetailMediaScroller({ attachments }: { attachments: FeedAttachment[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ active: false, moved: false, startX: 0, scrollLeft: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const finishDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragState.current.active) return;
    dragState.current.active = false;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div
      ref={scrollerRef}
      dir="rtl"
      role="region"
      tabIndex={0}
      aria-label="رسانه‌های ضمیمه؛ برای مشاهده موارد بیشتر افقی پیمایش کنید"
      className={`pointer-events-auto mt-3 flex snap-x snap-mandatory overflow-x-auto pb-1 no-scrollbar focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${isDragging ? "cursor-grabbing snap-none select-none" : "cursor-grab"}`}
      onPointerDown={(event) => {
        if (event.pointerType !== "mouse" || event.button !== 0) return;
        const scroller = scrollerRef.current;
        if (!scroller) return;
        dragState.current = { active: true, moved: false, startX: event.clientX, scrollLeft: scroller.scrollLeft };
        event.currentTarget.setPointerCapture(event.pointerId);
        setIsDragging(true);
      }}
      onPointerMove={(event) => {
        const scroller = scrollerRef.current;
        if (!scroller || !dragState.current.active) return;
        const deltaX = event.clientX - dragState.current.startX;
        if (Math.abs(deltaX) > 3) dragState.current.moved = true;
        scroller.scrollLeft = dragState.current.scrollLeft - deltaX;
        event.preventDefault();
      }}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      onClickCapture={(event) => {
        if (dragState.current.moved) {
          event.preventDefault();
          event.stopPropagation();
          dragState.current.moved = false;
        }
      }}
      onDragStart={(event) => event.preventDefault()}
    >
      {attachments.map((attachment, index) => <div dir="rtl" key={attachment.id} className={`ml-4 min-w-[78%] snap-start ${index === 0 ? "pr-4" : ""}`}><PrimaryAttachment attachment={attachment} singleImage={attachments.length === 1 && attachment.icon === "image"} /></div>)}
    </div>
  );
}

export function PostCard({ post, variant = "timeline", liked, reposted, joined, onLike, onRepost, onShare, onJoin, onOpenMedia }: PostCardProps) {
  // Kept in the card contract while repost interactions are not exposed in this UI.
  void reposted;
  void onRepost;
  const [primaryAttachment, ...otherAttachments] = post.attachments;
  const isDetail = variant === "detail";
  const profileHref = (`/profile/${post.author.type}/${post.author.id}`) as Route;

  return (
    <article className={`relative py-3 ${isDetail ? "px-0" : "border-b border-divider px-3 transition-colors hover:bg-hover sm:px-4"}`}>
      {!isDetail ? <Link href={("/posts/" + post.id) as Route} aria-label={`مشاهده روایت ${post.title}`} className="absolute inset-0 z-0" /> : null}
      <div className={`pointer-events-none relative z-10 ${isDetail ? "block" : "flex items-start gap-3"}`}>
        <Link href={profileHref} aria-label={`مشاهده پروفایل ${post.squareName}`} className={`pointer-events-auto relative z-10 ${isDetail ? "absolute right-3 top-0" : "shrink-0"}`}>{post.author.avatarUrl ? <Image src={post.author.avatarUrl} alt="" width={44} height={44} unoptimized={post.author.avatarUrl.startsWith("http")} className="h-11 w-11 rounded-full object-cover" /> : <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-full bg-brand text-xs font-black text-brand-foreground">{post.squareName.slice(0, 1)}</span>}</Link>
        <div className={`min-w-0 ${isDetail ? "w-full" : "flex-1"}`}>
          <div dir="rtl" className={`flex min-w-0 items-center gap-2 text-sm leading-5 ${isDetail ? "justify-start pr-[4.5rem]" : ""}`}>
            <Link href={profileHref} className={`pointer-events-auto relative z-10 font-black text-foreground hover:underline ${isDetail ? "whitespace-nowrap" : "truncate"}`}>{post.squareName}</Link>
            {post.author.verified ? <BadgeCheck aria-label="حساب تأییدشده" className="h-4 w-4 shrink-0 fill-verified text-on-solid" /> : null}
          </div>
          <div dir="rtl" className={`flex items-center gap-2 text-xs ${isDetail ? "mt-1 justify-start pr-[4.5rem]" : "mt-1"}`}>
            <span className="inline-flex rounded-md bg-brand-muted px-2 py-1 text-[10px] font-bold text-brand">{post.badge}</span>
            <span className="text-foreground-subtle">· {post.timeAgo}</span>
          </div>

          <div className="mt-2 px-3 sm:px-0">
            {post.title !== post.squareName ? <h2 className={`text-[15px] font-black leading-7 text-foreground ${isDetail ? "sr-only" : ""}`}>{post.title}</h2> : null}
            <p className={`${post.title !== post.squareName ? "mt-0.5 " : ""}text-[14px] leading-7 text-foreground-secondary`}>{post.body}</p>
          </div>

          {isDetail ? <DetailMediaScroller attachments={post.attachments} /> : primaryAttachment ? <div className="mt-3"><PrimaryAttachment attachment={primaryAttachment} singleImage={post.attachments.length === 1 && primaryAttachment.icon === "image"} /></div> : null}

          {!isDetail && otherAttachments.length > 0 ? (
            <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-xs leading-6 text-muted-foreground" aria-label="ضمیمه‌های بیشتر">
              <span className="font-bold text-foreground-secondary">{otherAttachments.length.toLocaleString("fa-IR")} ضمیمه دیگر:</span>
              {otherAttachments.map((attachment, index) => <span key={attachment.id}>{attachment.label}{index < otherAttachments.length - 1 ? "،" : ""}</span>)}
            </p>
          ) : null}

          {post.mediaReflection ? isDetail ? (
            <button type="button" onClick={onOpenMedia} className="pointer-events-auto relative z-10 mt-2 flex w-full items-center justify-between rounded-control border border-border px-3 py-2 text-right transition-colors hover:bg-hover">
              <span className="flex min-w-0 items-center gap-2"><BadgeCheck aria-hidden="true" className="h-4 w-4 shrink-0 fill-warning text-warning" /><span className="truncate text-xs text-foreground-secondary">{post.mediaReflection.headline}</span></span>
              <span className="shrink-0 whitespace-nowrap text-xs font-black text-link">مشاهده خبر</span>
            </button>
          ) : (
            <div className="relative z-10 mt-2 flex w-full items-center gap-2 rounded-control border border-border px-3 py-2 text-right"><BadgeCheck aria-hidden="true" className="h-4 w-4 shrink-0 fill-warning text-warning" /><span className="truncate text-xs text-foreground-secondary">{post.mediaReflection.headline}</span></div>
          ) : null}

          {post.callToAction ? (
            <button type="button" onClick={onJoin} className={`pointer-events-auto relative z-10 mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-control border px-4 py-2 text-xs font-black transition-colors ${joined ? "border-success-border bg-success-surface text-success" : "border-warning-border bg-warning-surface text-warning"}`}>
              <BellRing aria-hidden="true" className="h-4 w-4" />{joined ? "به این ابتکار پیوستید" : post.callToAction}
            </button>
          ) : null}

          <PostActions postId={post.id} likes={post.stats.likes} comments={post.stats.comments} views={post.stats.views} liked={liked} onLike={onLike} onShare={onShare} className={isDetail ? "mx-3 mt-4" : ""} />
        </div>
      </div>
    </article>
  );
}
