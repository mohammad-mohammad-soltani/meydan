"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { BadgeCheck } from "lucide-react";

import { ConnectedGoodActionCard } from "./ConnectedGoodActionCard";
import { PostActions } from "./PostActions";
import { MediaGallery } from "@/features/media/components/MediaGallery";
import { mediaItemsFromAttachments } from "@/features/media/media-utils";
import type { FeedPost } from "../types";

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

  const isDetail = variant === "detail";

  const mediaItems = mediaItemsFromAttachments(post.attachments);

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
        {post.attachments.length > 0 ? (
          <MediaGallery
            items={mediaItems}
            scope={`post:${post.id}`}
            artist={post.squareName}
            cover={post.author.avatarUrl}
            className="mt-3"
          />
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

          {post.attachments.length > 0 ? (
            <MediaGallery
              items={mediaItems}
              scope={`post:${post.id}`}
              artist={post.squareName}
              cover={post.author.avatarUrl}
              className="mt-2.5"
            />
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
