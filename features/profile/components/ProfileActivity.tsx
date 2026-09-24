"use client";

import Link from "next/link";
import type { Route } from "next";
import { LoaderCircle, MessageCircle, Sparkles } from "lucide-react";
import { Fragment, useState } from "react";
import { PostCard } from "@/features/feed/components/PostCard";
import type { FeedPost } from "@/features/feed/types";
import type { ProfileReply } from "../types";
import { useInfiniteScroll } from "@/features/feed/hooks/useInfiniteScroll";
import { profilePrefetchIndex } from "../profile-pagination";

type ProfileActivityProps = { posts: FeedPost[]; latestPageStart: number; replies: ProfileReply[]; likedPostIds: Set<string>; onLike: (postId: string) => void; onShare: (post: FeedPost) => void; onDelete: (post: FeedPost) => void; hasMore: boolean; isLoadingMore: boolean; initialLoading: boolean; loadMoreFailed: boolean; onLoadMore: () => void };
type ProfileFeedTab = "posts" | "replies" | "media";

const tabs: Array<{ id: ProfileFeedTab; label: string }> = [{ id: "posts", label: "روایت‌ها" }, { id: "replies", label: "پاسخ‌ها" }, { id: "media", label: "رسانه" }];

export function ProfileActivity({ posts, latestPageStart, replies, likedPostIds, onLike, onShare, onDelete, hasMore, isLoadingMore, initialLoading, loadMoreFailed, onLoadMore }: ProfileActivityProps) {
  const [activeTab, setActiveTab] = useState<ProfileFeedTab>("posts");
  const sentinelRef = useInfiniteScroll({
    enabled: activeTab !== "replies" && hasMore && !isLoadingMore && !loadMoreFailed,
    onLoadMore,
    revision: posts.length,
    rootMargin: "0px",
  });
  const hasMedia = (post: FeedPost) => post.attachments.some((attachment) => attachment.icon === "image" || attachment.icon === "video");
  const visiblePosts = activeTab === "media" ? posts.filter(hasMedia) : posts;
  const previousVisibleCount = activeTab === "media" ? posts.slice(0, latestPageStart).filter(hasMedia).length : latestPageStart;
  const prefetchIndex = profilePrefetchIndex(visiblePosts.length, previousVisibleCount);
  const emptyLabel = activeTab === "media" ? "هنوز رسانه‌ای منتشر نشده" : "هنوز روایتی منتشر نشده";
  return <section>
    <div role="tablist" aria-label="محتوای پروفایل" className="sticky top-14 z-20 grid h-14 grid-cols-3 border-b border-divider bg-surface/95 backdrop-blur">
      {tabs.map((tab) => <button key={tab.id} role="tab" aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} className={`relative text-sm transition-colors hover:bg-hover ${activeTab === tab.id ? "font-black text-foreground after:absolute after:bottom-0 after:right-1/2 after:h-1 after:w-12 after:translate-x-1/2 after:rounded-full after:bg-brand" : "font-bold text-foreground-subtle"}`}>{tab.label}</button>)}
    </div>
    {activeTab === "replies" ? <Replies items={replies} /> : <>
      {initialLoading && !isLoadingMore && !loadMoreFailed ? <p role="status" className="px-4 py-10 text-center text-xs text-foreground-subtle">در حال بارگذاری روایت‌ها…</p> : null}
      {visiblePosts.length === 0 && !hasMore && !initialLoading ? <EmptyState label={emptyLabel} /> : visiblePosts.map((post, index) => <Fragment key={post.id}>
        <PostCard post={post} liked={likedPostIds.has(post.id)} reposted={false} joined={Boolean(post.viewerState?.joined)} onLike={() => onLike(post.id)} onRepost={() => undefined} onShare={() => void onShare(post)} onJoin={() => undefined} onOpenMedia={() => undefined} onDelete={() => onDelete(post)} />
        {index + 1 === prefetchIndex && hasMore ? <div ref={sentinelRef} className="h-px" aria-hidden="true" /> : null}
      </Fragment>)}
      {visiblePosts.length === 0 && hasMore ? <div ref={sentinelRef} className="h-px" aria-hidden="true" /> : null}
      <div className="min-h-px px-4 py-5">
        {isLoadingMore ? <p role="status" className="flex items-center justify-center gap-2 text-xs text-foreground-subtle"><LoaderCircle className="h-4 w-4 animate-spin" />در حال بارگذاری روایت‌های بیشتر…</p> : loadMoreFailed ? <div className="flex flex-col items-center gap-3 text-xs text-foreground-subtle"><p>بارگذاری روایت‌های بیشتر ناموفق بود.</p><button type="button" onClick={onLoadMore} className="rounded-pill border border-border px-4 py-2 font-black">تلاش دوباره</button></div> : hasMore ? <button type="button" onClick={onLoadMore} className="mx-auto block rounded-pill border border-border px-4 py-2 text-xs font-black">بارگذاری بیشتر</button> : posts.length > 0 ? <p className="text-center text-xs text-foreground-subtle">به پایان روایت‌ها رسیدید.</p> : null}
      </div>
    </>}
  </section>;
}

function Replies({ items }: { items: ProfileReply[] }) {
  if (items.length === 0) return <EmptyState label="هنوز پاسخی ثبت نشده" />;
  return <div>{items.map((item) => <article key={item.id} className="border-b border-divider px-4 py-4"><p className="flex items-center gap-1.5 text-xs text-foreground-subtle"><MessageCircle aria-hidden="true" className="h-4 w-4" />در پاسخ به <Link href={("/posts/" + item.narrativeId) as Route} className="font-bold text-brand hover:underline">یک روایت</Link><span>·</span><span>{item.timeLabel}</span></p><Link href={("/posts/" + item.narrativeId) as Route} className="mt-2 block whitespace-pre-wrap text-sm leading-7 text-foreground hover:text-brand">{item.content}</Link></article>)}</div>;
}

function EmptyState({ label }: { label: string }) {
  return <div className="border-b border-divider px-6 py-16 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-muted text-brand"><Sparkles aria-hidden="true" className="h-6 w-6" /></div><h3 className="mt-4 text-base font-black text-foreground">{label}</h3><p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-foreground-subtle">محتوای مرتبط در این بخش از تایم‌لاین پروفایل نمایش داده می‌شود.</p></div>;
}
