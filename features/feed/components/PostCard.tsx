"use client";

import { generatedMedia } from "@/components/shared/generated-media";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { BadgeCheck, BellRing, Bolt, Camera, FileText, Image as ImageIcon, Mic, Play, Video } from "lucide-react";
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
  bolt: Bolt
};

function PrimaryAttachment({ attachment }: { attachment: FeedAttachment }) {
  const Icon = attachmentIcons[attachment.icon];

  if (attachment.previewSrc) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
        <Image
          src={attachment.previewSrc}
          alt={attachment.previewAlt ?? attachment.label}
          fill
          sizes="(max-width: 640px) calc(100vw - 76px), 520px"
          className="object-cover"
          draggable={false}
        />
        {attachment.icon === "video" ? <><span className="absolute inset-0 grid place-items-center bg-black/10"><span className="grid h-12 w-12 place-items-center rounded-full bg-white/90 text-brand-red shadow-lg"><Play aria-hidden="true" className="ml-0.5 h-5 w-5 fill-current" /></span></span><span className="absolute bottom-2 left-2 right-2 h-1 rounded-full bg-white/40"><span className="block h-1 w-1/3 rounded-full bg-white" /></span></> : null}
        <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-1 text-[11px] font-bold text-white backdrop-blur-sm">{attachment.label}</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-24 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/80">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-red/10 text-brand-red"><Icon aria-hidden="true" className="h-5 w-5" /></span>
      <span className="min-w-0"><strong className="block text-sm text-slate-900 dark:text-white">{attachment.label}</strong><span className="mt-1 block text-xs text-slate-500">{attachment.detail}</span></span>
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
      className={"pointer-events-auto mt-3 flex snap-x snap-mandatory overflow-x-auto pb-1 no-scrollbar focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 " + (isDragging ? "cursor-grabbing snap-none select-none" : "cursor-grab")}
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
      {attachments.map((attachment, index) => <div dir="rtl" key={attachment.id} className={"ml-4 min-w-[78%] snap-start " + (index === 0 ? "pr-4" : "")}><PrimaryAttachment attachment={attachment} /></div>)}
    </div>
  );
}

export function PostCard({ post, variant = "timeline", liked, reposted, joined, onLike, onRepost, onShare, onJoin, onOpenMedia }: PostCardProps) {
  const [primaryAttachment, ...otherAttachments] = post.attachments;
  const isDetail = variant === "detail";

  return (
    <article className={"feed-item relative py-3 " + (isDetail ? "px-0" : "px-3 transition-colors hover:bg-slate-50/70 dark:hover:bg-white/[0.025] sm:px-4")}>
      {!isDetail ? <Link href={("/posts/" + post.id) as Route} aria-label={`مشاهده روایت ${post.title}`} className="absolute inset-0 z-0" /> : null}
      <div className={"relative z-10 pointer-events-none " + (isDetail ? "block" : "flex items-start gap-3")}>
        <Image src={post.city === "یزد" ? generatedMedia.avatarSpeaker : generatedMedia.avatarCoordinator} alt="" width={44} height={44} className={isDetail ? "absolute right-3 top-0 h-11 w-11 rounded-full object-cover" : "h-11 w-11 shrink-0 rounded-full object-cover"} />
        <div className={"min-w-0 " + (isDetail ? "w-full" : "flex-1")}>
          <div dir="rtl" className={"flex min-w-0 items-center gap-2 text-sm leading-5 " + (isDetail ? "justify-start pr-[4.5rem]" : "")}>
            <span className={"font-black text-slate-950 dark:text-white " + (isDetail ? "whitespace-nowrap" : "truncate")}>{post.squareName}</span>
            <BadgeCheck aria-label="حساب تأییدشده" className="h-4 w-4 shrink-0 fill-blue-500 text-white" />
            {!isDetail ? <><span className="inline-flex shrink-0 rounded-md bg-brand-red/10 px-2 py-1 text-[10px] font-bold text-brand-red">{post.badge}</span><span className="shrink-0 text-xs text-slate-400">· {post.timeAgo}</span></> : null}
          </div>
          {isDetail ? <div dir="rtl" className="mt-1 flex items-center justify-start gap-2 pr-[4.5rem] text-xs"><span className="inline-flex rounded-md bg-brand-red/10 px-2 py-1 text-[10px] font-bold text-brand-red">{post.badge}</span><span className="text-slate-400">· {post.timeAgo}</span></div> : null}

          <div className="mt-2 px-3 sm:px-0">{post.title !== post.squareName ? <h2 className={"text-[15px] font-black leading-7 text-slate-950 dark:text-white " + (isDetail ? "sr-only" : "")}>{post.title}</h2> : null}<p className={(post.title !== post.squareName ? "mt-0.5 " : "") + "text-[14px] leading-7 text-slate-700 dark:text-slate-300"}>{post.body}</p></div>

          {isDetail ? <DetailMediaScroller attachments={post.attachments} /> : primaryAttachment ? <div className="mt-3"><PrimaryAttachment attachment={primaryAttachment} /></div> : null}

          {!isDetail && otherAttachments.length > 0 ? (
            <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-xs leading-6 text-slate-500" aria-label="ضمیمه‌های بیشتر">
              <span className="font-bold text-slate-700 dark:text-slate-300">{otherAttachments.length.toLocaleString("fa-IR")} ضمیمه دیگر:</span>
              {otherAttachments.map((attachment, index) => <span key={attachment.id}>{attachment.label}{index < otherAttachments.length - 1 ? "،" : ""}</span>)}
            </p>
          ) : null}

          {post.mediaReflection ? <button type="button" onClick={onOpenMedia} className="pointer-events-auto relative z-10 mt-2 flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-right transition-colors hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-900"><span className="flex min-w-0 items-center gap-2"><Camera aria-hidden="true" className="h-4 w-4 shrink-0 text-brand-red" /><span className="truncate text-xs text-slate-600 dark:text-slate-300">{post.mediaReflection.headline}</span></span><span className="shrink-0 whitespace-nowrap text-xs font-black text-blue-500">مشاهده خبر</span></button> : null}

          {post.callToAction ? <button type="button" onClick={onJoin} className={"pointer-events-auto relative z-10 mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-4 py-2 text-xs font-black transition-colors " + (joined ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600" : "border-amber-400/30 bg-amber-400/10 text-amber-600")}><BellRing aria-hidden="true" className="h-4 w-4" />{joined ? "به این ابتکار پیوستید" : post.callToAction}</button> : null}

          <PostActions postId={post.id} likes={post.stats.likes} comments={post.stats.comments} reposts={post.stats.reposts} liked={liked} reposted={reposted} onLike={onLike} onRepost={onRepost} onShare={onShare} className={isDetail ? "mx-3 mt-4" : ""} />
        </div>
      </div>
    </article>
  );
}
