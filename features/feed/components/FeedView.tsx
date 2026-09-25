"use client";

import { BellRing, LoaderCircle, X } from "lucide-react";
import { useState } from "react";
import { DeletePostDialog } from "./DeletePostDialog";
import { FeedFilters } from "./FeedFilters";
import { FeedSkeleton } from "./FeedSkeleton";
import { FeedTabs } from "./FeedTabs";
import { FollowingEmptyState } from "./FollowingEmptyState";
import { PostCard } from "./PostCard";
import { useFeed } from "../hooks/useFeed";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import type { FeedPost, FollowSuggestion } from "../types";

type FeedViewProps = {
  posts: FeedPost[];
  suggestions: FollowSuggestion[];
  nextCursor?: string | null;
  postsUnavailable?: boolean;
  suggestionsUnavailable?: boolean;
};

export function FeedView({
  posts,
  suggestions,
  nextCursor = null,
  postsUnavailable = false,
  suggestionsUnavailable = false,
}: FeedViewProps) {
  const feed = useFeed(posts, suggestions, nextCursor, !postsUnavailable);
  const [deleteTarget, setDeleteTarget] = useState<FeedPost | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const sentinelRef = useInfiniteScroll({
    enabled: feed.hasMore && !feed.isLoading && !feed.isLoadingMore && !feed.loadMoreFailed,
    onLoadMore: feed.loadMore,
    revision: feed.loadedCount,
  });

  const showForYouSkeleton =
    feed.activeTab === "for-you" && feed.isLoading && feed.posts.length === 0;

  const listFooter = (
    <div ref={sentinelRef} className="min-h-px w-full px-4 py-5" data-feed-sentinel>
      {feed.isLoadingMore ? (
        <p role="status" aria-live="polite" className="flex items-center justify-center gap-2 text-xs font-bold text-foreground-subtle">
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          در حال بارگذاری روایت‌های بیشتر…
        </p>
      ) : feed.loadMoreFailed ? (
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs font-bold text-foreground-subtle">بارگذاری روایت‌های بیشتر ناموفق بود.</p>
          <button type="button" onClick={feed.loadMore} className="rounded-pill border border-border px-4 py-2 text-xs font-black text-foreground transition-colors hover:bg-hover">
            تلاش دوباره
          </button>
        </div>
      ) : !feed.hasMore && feed.posts.length > 0 ? (
        <p className="text-center text-xs font-bold text-foreground-subtle">به پایان روایت‌های میدان رسیدید.</p>
      ) : null}
    </div>
  );

  const postList = showForYouSkeleton ? (
    <FeedSkeleton />
  ) : (
    <div className="w-full">
      <div className="w-full divide-y divide-divider">
        {feed.posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            videoPosts={feed.posts}
            liked={feed.likedPostIds.has(post.id)}
            reposted={feed.repostedPostIds.has(post.id)}
            joined={feed.joinedPostIds.has(post.id)}
            onLike={() => void feed.toggleLike(post.id)}
            onRepost={() => void feed.toggleRepost(post.id)}
            onShare={() => void feed.sharePost(post)}
            onJoin={() => void feed.joinInitiative(post.id)}
            onOpenMedia={() => feed.openMedia(post.mediaReflection ?? null)}
            onDelete={() => {
              setDeleteError(null);
              setDeleteTarget(post);
            }}
          />
        ))}
      </div>
      {listFooter}
    </div>
  );

  return (
    <div id="view-feed" className="relative min-h-full shrink-0 bg-background text-foreground">
      <FeedTabs activeTab={feed.activeTab} onChange={feed.setActiveTab} />

      {feed.activeTab === "for-you" ? (
        <>
          <section className="mt-2 hidden flex w-full items-center justify-between border-y border-warning-border bg-warning-surface px-4 py-3 text-xs font-black text-warning-foreground" aria-label="روایت‌های برگزیده میادین">
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
      {deleteTarget ? (
        <DeletePostDialog
          busy={deleteBusy}
          error={deleteError}
          onCancel={() => { if (!deleteBusy) setDeleteTarget(null); }}
          onConfirm={() => {
            setDeleteBusy(true);
            setDeleteError(null);
            void feed.deletePost(deleteTarget.id)
              .then(() => setDeleteTarget(null))
              .catch(() => setDeleteError("حذف روایت انجام نشد. دوباره تلاش کنید."))
              .finally(() => setDeleteBusy(false));
          }}
        />
      ) : null}
    </div>
  );
}
