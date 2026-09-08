"use client";

import { BellRing, X } from "lucide-react";
import { FeedFilters } from "./FeedFilters";
import { FeedTabs } from "./FeedTabs";
import { FollowSuggestions } from "./FollowSuggestions";
import { PostCard } from "./PostCard";
import { useFeed } from "../hooks/useFeed";
import type { FeedPost, FollowSuggestion } from "../types";

export function FeedView({ posts, suggestions }: { posts: FeedPost[]; suggestions: FollowSuggestion[] }) {
  const feed = useFeed(posts, suggestions);

  return (
    <div id="view-feed" className="app-view min-h-full bg-white dark:bg-[#070a0f]">
      <FeedTabs activeTab={feed.activeTab} onChange={feed.setActiveTab} />

      {feed.activeTab === "for-you" ? (
        <>
          <FeedFilters activeFilter={feed.activeFilter} onChange={feed.setActiveFilter} />
          <section className="feed-live-banner flex w-full items-center justify-between border-y px-4 py-3 text-xs font-black" aria-label="روایت‌های برگزیده میادین">
            <span className="inline-flex min-w-0 items-center gap-2"><BellRing className="h-5 w-5 shrink-0" aria-hidden="true" /><span>پژواک‌ها و روایت‌های برگزیده میادین</span></span>
            <span className="feed-live-badge shrink-0 rounded-md px-2 py-1 text-[10px]">زنده</span>
          </section>
          <div className="w-full divide-y divide-slate-100 dark:divide-slate-800">
            {feed.posts.map((post) => <PostCard key={post.id} post={post} liked={feed.likedPostIds.has(post.id)} reposted={feed.repostedPostIds.has(post.id)} joined={feed.joinedPostIds.has(post.id)} onLike={() => feed.toggleLike(post.id)} onRepost={() => feed.toggleRepost(post.id)} onShare={() => void feed.sharePost(post)} onJoin={() => feed.joinInitiative(post.id)} onOpenMedia={() => feed.openMedia(post.mediaReflection ?? null)} />)}
          </div>
        </>
      ) : <FollowSuggestions suggestions={feed.suggestions} followedIds={feed.followedSquareIds} onToggleFollow={feed.toggleFollow} />}

      {feed.selectedMedia ? <div role="dialog" aria-modal="true" aria-label="انعکاس رسانه‌ای" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"><div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-[#0b0f17]"><div className="flex items-center justify-between"><h2 className="text-sm font-black text-slate-950 dark:text-white">انعکاس رسانه‌ای</h2><button type="button" onClick={feed.closeMedia} aria-label="بستن" className="rounded-lg p-1 text-slate-400 hover:text-brand-red"><X className="h-5 w-5" /></button></div><p className="mt-4 text-sm font-bold text-slate-700 dark:text-slate-200">{feed.selectedMedia.headline}</p><p className="mt-2 text-xs text-slate-500">{feed.selectedMedia.outlet}</p></div></div> : null}
    </div>
  );
}
