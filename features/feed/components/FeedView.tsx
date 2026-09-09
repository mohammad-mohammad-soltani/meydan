"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BellRing, PenLine, X } from "lucide-react";
import { FeedFilters } from "./FeedFilters";
import { FeedTabs } from "./FeedTabs";
import { FollowSuggestions } from "./FollowSuggestions";
import { PostCard } from "./PostCard";
import { useFeed } from "../hooks/useFeed";
import type { FeedPost, FollowSuggestion } from "../types";

const LOCAL_POSTS_KEY = "meydan-local-narratives";

function readLocalPosts(): FeedPost[] {
  try {
    const stored = window.localStorage.getItem(LOCAL_POSTS_KEY);
    return stored ? (JSON.parse(stored) as FeedPost[]) : [];
  } catch {
    return [];
  }
}

export function FeedView({ posts, suggestions }: { posts: FeedPost[]; suggestions: FollowSuggestion[] }) {
  const feed = useFeed(posts, suggestions);
  const [localPosts, setLocalPosts] = useState<FeedPost[]>([]);

  useEffect(() => {
    setLocalPosts(readLocalPosts());
  }, []);

  const showLocalPosts = feed.activeFilter === "all" || feed.activeFilter === "ideas";

  return (
    <div id="view-feed" className="relative min-h-full bg-background text-foreground">
      <FeedTabs activeTab={feed.activeTab} onChange={feed.setActiveTab} />

      {feed.activeTab === "for-you" ? (
        <>
          <section className="mt-2 flex w-full items-center justify-between border-y border-warning-border bg-warning-surface px-4 py-3 text-xs font-black text-warning-foreground" aria-label="روایت‌های برگزیده میادین">
            <span className="inline-flex min-w-0 items-center gap-2"><BellRing className="h-5 w-5 shrink-0" aria-hidden="true" /><span>پژواک‌ها و روایت‌های برگزیده میادین</span></span>
            <span className="shrink-0 rounded-md bg-warning px-2 py-1 text-[10px] text-on-solid">زنده</span>
          </section>
          <FeedFilters activeFilter={feed.activeFilter} onChange={feed.setActiveFilter} />
          <div key={feed.activeFilter} className="ui-enter">
            <div className="w-full divide-y divide-divider">
              {showLocalPosts ? localPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  liked={feed.likedPostIds.has(post.id)}
                  reposted={feed.repostedPostIds.has(post.id)}
                  joined={false}
                  onLike={() => feed.toggleLike(post.id)}
                  onRepost={() => feed.toggleRepost(post.id)}
                  onShare={() => void feed.sharePost(post)}
                  onJoin={() => undefined}
                  onOpenMedia={() => undefined}
                />
              )) : null}

              {feed.posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  liked={feed.likedPostIds.has(post.id)}
                  reposted={feed.repostedPostIds.has(post.id)}
                  joined={feed.joinedPostIds.has(post.id)}
                  onLike={() => feed.toggleLike(post.id)}
                  onRepost={() => feed.toggleRepost(post.id)}
                  onShare={() => void feed.sharePost(post)}
                  onJoin={() => feed.joinInitiative(post.id)}
                  onOpenMedia={() => feed.openMedia(post.mediaReflection ?? null)}
                />
              ))}
            </div>
          </div>
        </>
      ) : (
        <div key={feed.activeTab} className="ui-enter">
          <FollowSuggestions suggestions={feed.suggestions} followedIds={feed.followedSquareIds} onToggleFollow={feed.toggleFollow} />
        </div>
      )}

      <Link
        href="/compose"
        aria-label="نوشتن روایت تازه"
        title="نوشتن روایت"
        className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] left-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-brand text-brand-foreground shadow-floating transition-[transform,background-color,box-shadow] hover:bg-brand-hover hover:shadow-dialog active:scale-90 lg:hidden"
      >
        <PenLine className="h-6 w-6" strokeWidth={2.2} />
      </Link>

      {feed.selectedMedia ? (
        <div role="dialog" aria-modal="true" aria-label="انعکاس رسانه‌ای" className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-panel border border-border bg-popover p-5 text-popover-foreground shadow-dialog">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black">انعکاس رسانه‌ای</h2>
              <button type="button" onClick={feed.closeMedia} aria-label="بستن" className="grid h-10 w-10 place-items-center rounded-control text-icon-muted transition-colors hover:bg-hover hover:text-brand"><X className="h-5 w-5" /></button>
            </div>
            <p className="mt-4 text-sm font-bold text-foreground-secondary">{feed.selectedMedia.headline}</p>
            <p className="mt-2 text-xs text-muted-foreground">{feed.selectedMedia.outlet}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
