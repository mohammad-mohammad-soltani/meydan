"use client";

import { BellRing, X } from "lucide-react";
import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useAuthGate } from "@/components/providers/AuthGateProvider";
import { actorKey } from "@/lib/meydan-follow";
import { useOwnActorKey } from "@/lib/me-client";
import { DeletePostDialog } from "./DeletePostDialog";
import { FeedFilters } from "./FeedFilters";
import { FeedSkeleton, PostCardSkeleton } from "./FeedSkeleton";
import { FeedSwipePager } from "./FeedSwipePager";
import { FeedTabs } from "./FeedTabs";
import { FollowSuggestions } from "./FollowSuggestions";
import { FollowingEmptyState } from "./FollowingEmptyState";
import { PostCard } from "./PostCard";
import { useFeed } from "../hooks/useFeed";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import type { FeedFilter, FeedPost, FeedTab, FollowSuggestion } from "../types";

/** Right-to-left pane order: "برای شما" sits to the right of "دنبال‌شده‌ها". */
const TAB_ORDER: FeedTab[] = ["for-you", "following"];

type FeedViewProps = {
  posts: FeedPost[];
  suggestions: FollowSuggestion[];
  nextCursor?: string | null;
  postsUnavailable?: boolean;
  suggestionsUnavailable?: boolean;
  initialFilter?: FeedFilter;
};

export function FeedView({
  posts,
  suggestions,
  nextCursor = null,
  postsUnavailable = false,
  suggestionsUnavailable = false,
  initialFilter = "all",
}: FeedViewProps) {
  const feed = useFeed(posts, suggestions, nextCursor, !postsUnavailable, initialFilter);
  const { requireAuth, isAuthenticated } = useAuthGate();
  const ownActorKey = useOwnActorKey(isAuthenticated);
  const [deleteTarget, setDeleteTarget] = useState<FeedPost | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  // Last rendered pane per tab, so a swipe drags in something real instead of
  // an empty page while the committed tab refetches.
  const paneCacheRef = useRef<Partial<Record<FeedTab, ReactNode>>>({});
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
        <div role="status" aria-live="polite" aria-label="در حال بارگذاری روایت‌های بیشتر" className="-mx-4 -my-5">
          <PostCardSkeleton lines={2} />
        </div>
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
      <div className="w-full">
        {feed.posts.map((post, index) => (
          <Fragment key={post.id}>
          {/* Reference design: the suggestion strip sits after the second post of «برای شما». */}
          {index === 2 && feed.activeTab === "for-you" ? (
            <FollowSuggestions
              variant="strip"
              suggestions={feed.suggestions}
              followedActorKeys={feed.followedActorKeys}
              pendingFollowKeys={feed.pendingFollowKeys}
              onToggleFollow={(type, id) => void feed.toggleFollow(type, id)}
            />
          ) : null}
          <PostCard
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
            following={feed.followedActorKeys.has(actorKey(post.author.type, post.author.id))}
            onFollow={ownActorKey === actorKey(post.author.type, post.author.id) ? undefined : () => void feed.toggleFollow(post.author.type, post.author.id)}
          />
          </Fragment>
        ))}
      </div>
      {listFooter}
    </div>
  );

  const forYouPane = (
    <>
      <section className="mt-2 hidden flex w-full items-center justify-between border-y border-warning-border bg-warning-surface px-4 py-3 text-xs font-black text-warning-foreground" aria-label="روایت‌های برگزیده میادین">
        <span className="inline-flex min-w-0 items-center gap-2"><BellRing className="h-5 w-5 shrink-0" aria-hidden="true" /><span>پژواک‌ها و روایت‌های برگزیده میادین</span></span>
        <span className="shrink-0 rounded-md bg-warning px-2 py-1 text-[10px] text-warning-solid-foreground">زنده</span>
      </section>
      <FeedFilters activeFilter={feed.activeFilter} onChange={feed.setActiveFilter} />
      <div key={feed.activeFilter} className="ui-enter">{postList}</div>
    </>
  );

  const followingPane = feed.isLoading ? (
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
  );

  const activePane = feed.activeTab === "for-you" ? forYouPane : followingPane;
  const activeTab = feed.activeTab;
  useEffect(() => {
    paneCacheRef.current[activeTab] = activePane;
  }, [activePane, activeTab]);

  const renderPane = useCallback((paneIndex: number) => {
    const tab = TAB_ORDER[paneIndex];
    return paneCacheRef.current[tab] ?? <FeedSkeleton />;
  }, []);

  return (
    <div id="view-feed" className="relative min-h-full shrink-0 bg-background text-foreground">
      <FeedTabs
        ref={tabsRef}
        indicatorRef={indicatorRef}
        activeTab={feed.activeTab}
        onChange={feed.setActiveTab}
        activeFilter={feed.activeFilter}
        onPinnedSelect={(filter) => {
          feed.setActiveTab("for-you");
          feed.setActiveFilter(filter);
        }}
      />

      <FeedSwipePager
        index={TAB_ORDER.indexOf(feed.activeTab)}
        count={TAB_ORDER.length}
        onIndexChange={(next) => {
          const tab = TAB_ORDER[next];
          // The followed timeline is gated exactly like its tab button.
          if (tab === "following" && !requireAuth("/home")) return;
          feed.setActiveTab(tab);
        }}
        renderPane={renderPane}
        topBoundaryRef={tabsRef}
        getIndicator={() => indicatorRef.current}
      >
        {activePane}
      </FeedSwipePager>

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
