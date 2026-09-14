"use client";

import { BellRing, X } from "lucide-react";
import { FeedFilters } from "./FeedFilters";
import { FeedSkeleton } from "./FeedSkeleton";
import { FeedTabs } from "./FeedTabs";
import { FollowingEmptyState } from "./FollowingEmptyState";
import { PostCard } from "./PostCard";
import { useFeed } from "../hooks/useFeed";
import type { FeedPost, FollowSuggestion } from "../types";

type FeedViewProps = {
  posts: FeedPost[];
  suggestions: FollowSuggestion[];
  postsUnavailable?: boolean;
  suggestionsUnavailable?: boolean;
};

export function FeedView({
  posts,
  suggestions,
  postsUnavailable = false,
  suggestionsUnavailable = false,
}: FeedViewProps) {
  const feed = useFeed(posts, suggestions);
  const showForYouSkeleton =
    feed.activeTab === "for-you" &&
    (feed.isLoading || (postsUnavailable && feed.posts.length === 0));

  const postList = showForYouSkeleton ? (
    <FeedSkeleton />
  ) : (
    <div className="w-full divide-y divide-divider">
      {feed.posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          liked={feed.likedPostIds.has(post.id)}
          reposted={feed.repostedPostIds.has(post.id)}
          joined={feed.joinedPostIds.has(post.id)}
          onLike={() => void feed.toggleLike(post.id)}
          onRepost={() => void feed.toggleRepost(post.id)}
          onShare={() => void feed.sharePost(post)}
          onJoin={() => void feed.joinInitiative(post.id)}
          onOpenMedia={() => feed.openMedia(post.mediaReflection ?? null)}
        />
      ))}
    </div>
  );

  return (
    <div id="view-feed" className="relative min-h-full bg-background text-foreground">
      <FeedTabs activeTab={feed.activeTab} onChange={feed.setActiveTab} />

      {feed.activeTab === "for-you" ? (
        <>
          <section className="mt-2 flex w-full items-center justify-between border-y border-warning-border bg-warning-surface px-4 py-3 text-xs font-black text-warning-foreground" aria-label="روایت‌های برگزیده میادین">
            <span className="inline-flex min-w-0 items-center gap-2"><BellRing className="h-5 w-5 shrink-0" aria-hidden="true" /><span>پژواک‌ها و روایت‌های برگزیده میادین</span></span>
            <span className="shrink-0 rounded-md bg-warning px-2 py-1 text-[10px] text-warning-solid-foreground">زنده</span>
          </section>
          <FeedFilters activeFilter={feed.activeFilter} onChange={feed.setActiveFilter} />
          <div key={feed.activeFilter} className="ui-enter">{postList}</div>
        </>
      ) : (
        <div key={feed.activeTab} className="ui-enter">
          {feed.isLoading ? (
            <FeedSkeleton />
          ) : feed.posts.length ? (
            postList
          ) : (
            <FollowingEmptyState
              isLoading={feed.isFollowingStateLoading || suggestionsUnavailable}
              requiresAuth={feed.followingRequiresAuth}
              hasFollowing={feed.hasFollowing}
              suggestions={feed.suggestions}
              followedActorKeys={feed.followedActorKeys}
              pendingFollowKeys={feed.pendingFollowKeys}
              onToggleFollow={(type, id) => void feed.toggleFollow(type, id)}
            />
          )}
        </div>
      )}

      {feed.selectedMedia ? (
        <div role="dialog" aria-modal="true" aria-label="انعکاس رسانه‌ای" className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-panel border border-border bg-popover p-5 text-popover-foreground shadow-dialog">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black">انعکاس رسانه‌ای</h2>
              <button type="button" onClick={feed.closeMedia} aria-label="بستن" className="grid h-10 w-10 place-items-center rounded-control text-icon-muted transition-colors hover:bg-hover hover:text-brand"><X className="h-5 w-5" /></button>
            </div>
            <p className="mt-4 text-sm font-bold text-foreground-secondary">{feed.selectedMedia.headline}</p>
            <p className="mt-2 text-xs text-muted-foreground">{feed.selectedMedia.outlet}</p>
            {feed.selectedMedia.url ? (
              <a
                href={feed.selectedMedia.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex rounded-control bg-brand px-4 py-2 text-xs font-black text-on-solid transition-opacity hover:opacity-90"
              >
                مطالعه متن کامل خبر
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
