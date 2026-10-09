"use client";

import Link from "next/link";
import type { Route } from "next";
import { FileText, Heart, Image as ImageIcon, MessageCircle, Pin, Repeat2, Sparkles, Star } from "lucide-react";
import { Fragment, useRef, useState, type ReactNode } from "react";
import { FeedSwipePager } from "@/features/feed/components/FeedSwipePager";
import { PostCard } from "@/features/feed/components/PostCard";
import type { FeedPost } from "@/features/feed/types";
import type { ProfileReply } from "../types";
import { useInfiniteScroll } from "@/features/feed/hooks/useInfiniteScroll";
import { profilePrefetchIndex } from "../profile-pagination";
import { getNarrativeList } from "@/features/feed/services/feed.service";
import { ProfileTabBar } from "./ProfileTabBar";
import { FeedSkeleton, PostCardSkeleton } from "@/features/feed/components/FeedSkeleton";

type ProfileActivityProps = { actorType: string; actorId: number; postCount?: number | null; pinnedPost?: FeedPost | null; onTogglePin?: (post: FeedPost) => void; posts: FeedPost[]; latestPageStart: number; replies: ProfileReply[]; likedPostIds: Set<string>; repostedPostIds: Set<string>; onLike: (postId: string) => void; onRepost: (postId: string) => void; onShare: (post: FeedPost) => void; onDelete: (post: FeedPost) => void; hasMore: boolean; isLoadingMore: boolean; initialLoading: boolean; loadMoreFailed: boolean; onLoadMore: () => void; /** Which tabs to offer, in order; every tab when omitted. */ tabIds?: ProfileFeedTab[]; /** Replaces «هنوز روایتی منتشر نشده» for the posts tab. */ emptyPostsLabel?: string };
export type ProfileFeedTab = "posts" | "replies" | "highlights" | "media" | "likes";

const ALL_TABS: Array<{ id: ProfileFeedTab; label: string; icon: typeof FileText }> = [
  { id: "posts", label: "پست‌ها", icon: FileText },
  { id: "replies", label: "پاسخ‌ها", icon: MessageCircle },
  { id: "highlights", label: "برجسته‌ها", icon: Star },
  { id: "media", label: "رسانه‌ها", icon: ImageIcon },
  { id: "likes", label: "پسندها", icon: Heart },
];

type RemoteList = { status: "idle" | "loading" | "ready" | "error"; posts: FeedPost[]; cursor: string | null };
const IDLE: RemoteList = { status: "idle", posts: [], cursor: null };

export function ProfileActivity({ actorType, actorId, postCount, pinnedPost, onTogglePin, posts, latestPageStart, replies, likedPostIds, repostedPostIds, onLike, onRepost, onShare, onDelete, hasMore, isLoadingMore, initialLoading, loadMoreFailed, onLoadMore, tabIds, emptyPostsLabel }: ProfileActivityProps) {
  const tabs = tabIds ? ALL_TABS.filter((tab) => tabIds.includes(tab.id)) : ALL_TABS;
  const [activeTab, setActiveTab] = useState<ProfileFeedTab>("posts");
  // «برجسته‌ها» and «پسندها» load on first open only, so the profile itself costs nothing extra.
  const [remote, setRemote] = useState<Record<"highlights" | "likes", RemoteList>>({ highlights: IDLE, likes: IDLE });
  // Tabs sit right to left: a later tab is to the left, so its pane arrives from the left.
  const [direction, setDirection] = useState<"next" | "prev" | null>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);
  const loadRemote = (tab: ProfileFeedTab) => {
    if ((tab !== "highlights" && tab !== "likes") || (remote[tab].status !== "idle" && remote[tab].status !== "error")) return;
    setRemote((current) => ({ ...current, [tab]: { ...current[tab], status: "loading" } }));
    void getNarrativeList(`/actors/${actorType}/${actorId}/${tab}?limit=20`)
      .then((page) => setRemote((current) => ({ ...current, [tab]: { status: "ready", posts: page.posts, cursor: page.nextCursor } })))
      .catch(() => setRemote((current) => ({ ...current, [tab]: { ...current[tab], status: "error" } })));
  };
  /** `slide` is false for a swipe, whose own drag already carried the pane in from the side. */
  const openTab = (tab: ProfileFeedTab, slide = true) => {
    if (tab === activeTab) return;
    setDirection(slide ? (tabs.findIndex((item) => item.id === tab) > tabs.findIndex((item) => item.id === activeTab) ? "next" : "prev") : null);
    setActiveTab(tab);
    // A swipe previews the neighbouring tabs, so the lists behind them are fetched as soon as this one opens.
    const index = tabs.findIndex((item) => item.id === tab);
    for (const id of [tab, tabs[index - 1]?.id, tabs[index + 1]?.id]) if (id) loadRemote(id);
  };
  const counts: Partial<Record<ProfileFeedTab, number>> = { posts: postCount ?? undefined, replies: replies.length || undefined };
  const sentinelRef = useInfiniteScroll({
    enabled: activeTab !== "replies" && hasMore && !isLoadingMore && !loadMoreFailed,
    onLoadMore,
    revision: posts.length,
    rootMargin: "0px",
  });
  const hasMedia = (post: FeedPost) => post.attachments.some((attachment) => attachment.icon === "image" || attachment.icon === "video");
  /**
   * One tab's body. `live` is the pane in the page's flow; neighbours the pager
   * keeps mounted for previewing are not live, so only the live pane owns the
   * infinite-scroll sentinel.
   */
  const renderBody = (tab: ProfileFeedTab, live: boolean): ReactNode => {
    const visiblePosts = tab === "media" ? posts.filter(hasMedia) : posts;
    const previousVisibleCount = tab === "media" ? posts.slice(0, latestPageStart).filter(hasMedia).length : latestPageStart;
    const prefetchIndex = profilePrefetchIndex(visiblePosts.length, previousVisibleCount);
    const emptyLabel = tab === "media" ? "هنوز رسانه‌ای منتشر نشده" : emptyPostsLabel ?? "هنوز روایتی منتشر نشده";
    const remoteList = tab === "highlights" || tab === "likes" ? remote[tab] : null;
    return <>
    {tab === "posts" && pinnedPost ? (
      <div className="border-b border-divider">
        <p className="flex items-center gap-1.5 px-4 pt-3 text-[11px] font-bold text-muted-foreground"><Pin aria-hidden="true" className="h-3.5 w-3.5" />پست سنجاق‌شده در نمایه</p>
        <PostCard post={pinnedPost} liked={likedPostIds.has(pinnedPost.id)} reposted={repostedPostIds.has(pinnedPost.id)} joined={Boolean(pinnedPost.viewerState?.joined)} onLike={() => onLike(pinnedPost.id)} onRepost={() => onRepost(pinnedPost.id)} onShare={() => void onShare(pinnedPost)} onJoin={() => undefined} onOpenMedia={() => undefined} onDelete={() => onDelete(pinnedPost)} pinned onTogglePin={onTogglePin ? () => onTogglePin(pinnedPost) : undefined} />
      </div>
    ) : null}
    {remoteList ? <RemotePosts list={remoteList} label={tab === "likes" ? "هنوز پستی پسندیده نشده" : "هنوز پست برجسته‌ای ندارد"} /> : tab === "replies" ? <Replies items={replies} /> : <>
      {initialLoading && !isLoadingMore && !loadMoreFailed ? <FeedSkeleton items={2} /> : null}
      {visiblePosts.length === 0 && !hasMore && !initialLoading ? <EmptyState label={emptyLabel} /> : visiblePosts.map((post, index) => <Fragment key={post.id}>
        {post.repostedAt ? <p className="flex items-center gap-1.5 px-4 pt-3 -mb-1 text-xs font-bold text-foreground-subtle"><Repeat2 aria-hidden="true" className="h-4 w-4" />بازنشر شده</p> : null}
        <PostCard post={post} liked={likedPostIds.has(post.id)} reposted={repostedPostIds.has(post.id)} joined={Boolean(post.viewerState?.joined)} onLike={() => onLike(post.id)} onRepost={() => onRepost(post.id)} onShare={() => void onShare(post)} onJoin={() => undefined} onOpenMedia={() => undefined} onDelete={() => onDelete(post)} pinned={pinnedPost?.id === post.id} onTogglePin={onTogglePin && !post.repostedAt ? () => onTogglePin(post) : undefined} />
        {live && index + 1 === prefetchIndex && hasMore ? <div ref={sentinelRef} className="h-px" aria-hidden="true" /> : null}
      </Fragment>)}
      {live && visiblePosts.length === 0 && hasMore ? <div ref={sentinelRef} className="h-px" aria-hidden="true" /> : null}
      <div className="min-h-px px-4 py-5">
        {isLoadingMore ? <div role="status" aria-label="در حال بارگذاری روایت‌های بیشتر" className="-mx-4 -my-5"><PostCardSkeleton lines={2} /></div> : loadMoreFailed ? <div className="flex flex-col items-center gap-3 text-xs text-foreground-subtle"><p>بارگذاری روایت‌های بیشتر ناموفق بود.</p><button type="button" onClick={onLoadMore} className="rounded-pill border border-border px-4 py-2 font-black">تلاش دوباره</button></div> : hasMore ? <button type="button" onClick={onLoadMore} className="mx-auto block rounded-pill border border-border px-4 py-2 text-xs font-black">بارگذاری بیشتر</button> : posts.length > 0 ? <p className="text-center text-xs text-foreground-subtle">به پایان روایت‌ها رسیدید.</p> : null}
      </div>
    </>}
    </>;
  };
  const tabIndex = tabs.findIndex((item) => item.id === activeTab);
  return <section>
    <ProfileTabBar label="محتوای پروفایل" barRef={tabBarRef} active={activeTab} onChange={openTab} tabs={tabs.map((tab) => ({ ...tab, count: counts[tab.id] }))} />
    <FeedSwipePager
      index={tabIndex}
      count={tabs.length}
      onIndexChange={(next) => openTab(tabs[next].id, false)}
      renderPane={(paneIndex) => renderBody(tabs[paneIndex].id, false)}
      topBoundaryRef={tabBarRef}
      getLabels={() => tabBarRef.current?.querySelectorAll<HTMLElement>('[role="tab"]') ?? null}
    >
      {/* Keyed by the tab, so a tap on a tab (not a swipe) plays the slide from the side the tab sits on. */}
      <div key={activeTab} className={direction === "next" ? "profile-pane-next" : direction === "prev" ? "profile-pane-prev" : undefined}>
        {renderBody(activeTab, true)}
      </div>
    </FeedSwipePager>
  </section>;
}

/** «برجسته‌ها» / «پسندها»: read-only cards (actions live on the post page). */
function RemotePosts({ list, label }: { list: RemoteList; label: string }) {
  if (list.status === "loading" || list.status === "idle") return <FeedSkeleton items={2} />;
  if (list.status === "error") return <p role="alert" className="px-4 py-10 text-center text-xs text-foreground-subtle">دریافت این بخش ممکن نشد.</p>;
  if (list.posts.length === 0) return <EmptyState label={label} />;
  return <div>{list.posts.map((post) => <PostCard key={post.id} post={post} liked={Boolean(post.viewerState?.liked)} reposted={Boolean(post.viewerState?.reposted)} joined={Boolean(post.viewerState?.joined)} onLike={() => undefined} onRepost={() => undefined} onShare={() => undefined} onJoin={() => undefined} onOpenMedia={() => undefined} hideActions />)}</div>;
}

function Replies({ items }: { items: ProfileReply[] }) {
  if (items.length === 0) return <EmptyState label="هنوز پاسخی ثبت نشده" />;
  return <div>{items.map((item) => <article key={item.id} className="border-b border-divider px-4 py-4"><p className="flex items-center gap-1.5 text-xs text-foreground-subtle"><MessageCircle aria-hidden="true" className="h-4 w-4" />در پاسخ به <Link href={("/posts/" + item.narrativeId) as Route} className="font-bold text-foreground hover:underline">یک روایت</Link><span>·</span><span>{item.timeLabel}</span></p><Link href={("/posts/" + item.narrativeId) as Route} className="mt-2 block whitespace-pre-wrap text-sm leading-7 text-foreground hover:text-foreground-secondary">{item.content}</Link></article>)}</div>;
}

function EmptyState({ label }: { label: string }) {
  return <div className="border-b border-divider px-6 py-16 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-border bg-surface-muted text-foreground"><Sparkles aria-hidden="true" className="h-6 w-6" /></div><h3 className="mt-4 text-base font-black text-foreground">{label}</h3><p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-foreground-subtle">محتوای مرتبط در این بخش از تایم‌لاین پروفایل نمایش داده می‌شود.</p></div>;
}
