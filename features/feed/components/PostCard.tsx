"use client";

import Link from "next/link";
import type { Route } from "next";
import { publicProfileHref } from "@/lib/profile-route";
import { BadgeCheck, Trash2 } from "lucide-react";
import { OptimizedAvatar } from "@/components/shared/OptimizedAvatar";

import { ConnectedGoodActionCard } from "./ConnectedGoodActionCard";
import { PostActions } from "./PostActions";
import { FollowPill } from "./FollowPill";
import { PostMoreMenu } from "./PostMoreMenu";
import { PostShareButton } from "./PostShareButton";
import { QuotedPostCard } from "./QuotedPostCard";
import { repostTotal } from "../post-counts";
import { ReadMoreText } from "./ReadMoreText";
import { MarkdownText } from "@/components/shared/MarkdownText";
import { MediaGallery } from "@/features/media/components/MediaGallery";
import { mediaItemsFromAttachments } from "@/features/media/media-utils";
import type { FeedPost } from "../types";
import { splitPostTitle } from "../post-title";
import { AccountBadges } from "@/components/shared/AccountBadges";

type PostCardProps = {
  post: FeedPost;
  videoPosts?: FeedPost[];
  variant?: "timeline" | "detail";
  liked: boolean;
  reposted: boolean;
  joined: boolean;
  onLike: () => void;
  onRepost: () => void;
  onShare: () => void;
  onJoin: () => void;
  onOpenMedia: () => void;
  onDelete?: () => void;
  /** Report-day pages reuse the exact card without interactive action controls. */
  hideActions?: boolean;
  /** Whether the viewer follows the author; the «دنبال کردن» pill shows when `onFollow` is set. */
  following?: boolean;
  onFollow?: () => void;
  /** Own profile: pin/unpin from the «…» menu. */
  pinned?: boolean;
  onTogglePin?: () => void;
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
  videoPosts,
  variant = "timeline",
  liked,
  reposted,
  joined,
  onLike,
  onRepost,
  onShare,
  onJoin,
  onOpenMedia,
  onDelete,
  hideActions = false,
  following = false,
  onFollow,
  pinned = false,
  onTogglePin,
}: PostCardProps) {
  void onJoin;

  const isDetail = variant === "detail";

  const mediaItems = mediaItemsFromAttachments(post.attachments);

  const profileHref = publicProfileHref(
    post.author.type,
    post.author.id,
    post.author.handle,
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
            href={profileHref}
            aria-label={`مشاهده پروفایل ${post.squareName}`}
            className="pointer-events-auto shrink-0"
          >
            {post.author.avatarUrl ? (
              <OptimizedAvatar
                src={post.author.avatarUrl}
                alt=""
                width={44}
                height={44}
                className="h-11 w-11 rounded-full object-cover ring-1 ring-border/70 transition-opacity hover:opacity-90"
              />
            ) : (
              <span
                aria-hidden="true"
                className="grid h-11 w-11 place-items-center rounded-full border border-border-strong bg-surface-elevated text-xs font-black text-foreground"
              >
                {post.squareName.slice(0, 1)}
              </span>
            )}
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <Link
                href={profileHref}
                className="min-w-0 truncate text-[15px] font-black leading-6 text-foreground hover:underline"
              >
                {post.squareName}
              </Link>

              <AccountBadges verified={post.author.verified} speaker={post.author.verifiedSpeaker} official={post.author.verifiedOfficial} kind={post.author.type} size="md" />
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
          {/* In RTL the last item sits in the top-left corner, so share ends up there. */}
          <div className="flex shrink-0 items-center gap-0.5">
            {post.viewerState?.canDelete ? <button type="button" onClick={onDelete} className="pointer-events-auto grid h-9 w-9 place-items-center rounded-full text-danger-foreground hover:bg-danger-surface" aria-label="حذف روایت"><Trash2 className="h-4 w-4" /></button> : null}
            {!hideActions ? <PostShareButton onShare={onShare} size="md" /> : null}
          </div>
        </div>

        {/* Text */}
        <div className="mt-3" dir="rtl">
          {post.title !== post.squareName ? (
            <h1 className="sr-only">{post.title}</h1>
          ) : null}

          {/* The post page is where the reader came to read it all: never fold. */}
          <div className="relative z-10">
            <MarkdownText
              body={post.body}
              className="whitespace-pre-wrap text-[16px] leading-8 text-foreground"
            />
          </div>
        </div>
        {/* Media */}
        {post.attachments.length > 0 ? (
          <MediaGallery
            items={mediaItems}
            videoPost={post}
            videoPosts={videoPosts}
            scope={`post:${post.id}`}
            artist={post.squareName}
            cover={post.author.avatarUrl}
            className="mt-3"
          />
        ) : null}

        {post.quote ? <QuotedPostCard quote={post.quote} className="mt-3" /> : null}

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
            initialWorkId={post.initiativeWorkId}
            initialClosed={post.initiativeClosed}
            initialJoined={joined}
            initialParticipantCount={post.initiativeParticipantCount}
            label={post.callToAction ?? "پیوستن"}
          />
        ) : null}

        {/* Actions */}
        {!hideActions ? <PostActions
          postId={post.id}
          likes={post.stats.likes}
          reposts={repostTotal(post.stats)}
          comments={post.stats.comments}
          views={post.stats.views}
          liked={liked}
          reposted={reposted}
          onLike={onLike}
          onRepost={onRepost}
          bookmarked={Boolean(post.viewerState?.bookmarked)}
          className="mt-3"
        /> : null}
      </article>
    );
  }

  /*
   * Timeline (reference design): one header row, then full-width text, media
   * and the rounded action bar.
   */
  const { title: bodyTitle, rest: bodyRest } = splitPostTitle(post.body);
  return (
    <article className="relative border-b border-transparent px-4 py-4 transition-colors duration-150 hover:bg-surface/50">
      <Link
        href={(`/posts/${post.id}`) as Route}
        aria-label={`مشاهده روایت ${post.title}`}
        className="absolute inset-0 z-0"
      />

      <div className="pointer-events-none relative z-10">
        <div dir="rtl" className="flex w-full min-w-0 items-center justify-between gap-2.5">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden">
            <Link
              href={profileHref}
              aria-label={`مشاهده پروفایل ${post.squareName}`}
              className="pointer-events-auto relative z-10 shrink-0"
            >
              {post.author.avatarUrl ? (
                <OptimizedAvatar
                  src={post.author.avatarUrl}
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full border border-border-strong object-cover transition-opacity hover:opacity-90"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="grid h-10 w-10 place-items-center rounded-full border border-border-strong bg-surface-elevated text-xs font-black text-foreground"
                >
                  {post.squareName.slice(0, 1)}
                </span>
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-1.5">
                <Link
                  href={profileHref}
                  className="pointer-events-auto relative z-10 min-w-0 truncate text-sm font-bold text-foreground hover:underline"
                >
                  {post.squareName}
                </Link>
                <AccountBadges verified={post.author.verified} speaker={post.author.verifiedSpeaker} official={post.author.verifiedOfficial} kind={post.author.type} size="md" />
              </div>
              <div className="mt-0.5 flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap text-[11px] font-medium text-muted-foreground">
                {post.badge ? (
                  <span className="shrink-0 rounded-full border border-border bg-surface-muted px-2 py-0.5 text-[10px] font-bold text-foreground">
                    {post.badge}
                  </span>
                ) : null}
                <span aria-hidden="true">·</span>
                <span className="truncate">{post.timeAgo}</span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {onFollow ? <FollowPill following={following} onToggle={onFollow} /> : null}
            {!hideActions ? (
              <PostMoreMenu postId={post.id} onDelete={post.viewerState?.canDelete ? onDelete : undefined} pinned={pinned} onTogglePin={onTogglePin} />
            ) : null}
          </div>
        </div>

        <div dir="rtl" className="mt-2.5 text-[13.5px] leading-relaxed">
          {bodyTitle ? <p className="mb-1 font-bold text-foreground">{bodyTitle}</p> : null}
          <ReadMoreText
            body={bodyRest}
            className="text-foreground-secondary"
            contentClassName="relative z-10"
          />
        </div>

        {post.attachments.length > 0 ? (
          <MediaGallery
            items={mediaItems}
            videoPost={post}
            videoPosts={videoPosts}
            scope={`post:${post.id}`}
            artist={post.squareName}
            cover={post.author.avatarUrl}
            className="mt-3"
          />
        ) : null}

        {post.quote ? <QuotedPostCard quote={post.quote} className="mt-3" /> : null}

        {post.mediaReflection ? (
          post.mediaReflection.url ? (
            <a
              href={post.mediaReflection.url}
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto relative z-10 mt-3 block w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-right transition-colors hover:bg-hover"
            >
              <span className="block truncate text-[11px] text-foreground-secondary">
                <TimelineMediaReflectionText reflection={post.mediaReflection} />
              </span>
            </a>
          ) : (
            <div className="relative z-10 mt-3 block w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-right">
              <span className="block truncate text-[11px] text-foreground-secondary">
                <TimelineMediaReflectionText reflection={post.mediaReflection} />
              </span>
            </div>
          )
        ) : null}

        {post.initiativeId ? (
          <ConnectedGoodActionCard
            initiativeId={post.initiativeId}
            initialWorkId={post.initiativeWorkId}
            initialClosed={post.initiativeClosed}
            initialJoined={joined}
            initialParticipantCount={post.initiativeParticipantCount}
            label={post.callToAction ?? "پیوستن"}
          />
        ) : null}

        {!hideActions ? <PostActions
          postId={post.id}
          likes={post.stats.likes}
          reposts={repostTotal(post.stats)}
          comments={post.stats.comments}
          views={post.stats.views}
          liked={liked}
          reposted={reposted}
          onLike={onLike}
          onRepost={onRepost}
          onShare={onShare}
          bookmarked={Boolean(post.viewerState?.bookmarked)}
        /> : null}
      </div>
    </article>
  );
}
