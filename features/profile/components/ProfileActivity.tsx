"use client";

import Link from "next/link";
import type { Route } from "next";
import { MessageCircle, Sparkles } from "lucide-react";
import { useState } from "react";
import { PostCard } from "@/features/feed/components/PostCard";
import type { FeedPost } from "@/features/feed/types";
import type { ProfileReply } from "../types";

type ProfileActivityProps = { posts: FeedPost[]; replies: ProfileReply[]; likedPostIds: Set<string>; onLike: (postId: string) => void; onShare: (post: FeedPost) => void };
type ProfileFeedTab = "posts" | "replies" | "media";

const tabs: Array<{ id: ProfileFeedTab; label: string }> = [{ id: "posts", label: "روایت‌ها" }, { id: "replies", label: "پاسخ‌ها" }, { id: "media", label: "رسانه" }];

export function ProfileActivity({ posts, replies, likedPostIds, onLike, onShare }: ProfileActivityProps) {
  const [activeTab, setActiveTab] = useState<ProfileFeedTab>("posts");
  const visiblePosts = activeTab === "media" ? posts.filter((post) => post.attachments.some((attachment) => attachment.icon === "image" || attachment.icon === "video")) : posts;
  const emptyLabel = activeTab === "media" ? "هنوز رسانه‌ای منتشر نشده" : "هنوز روایتی منتشر نشده";
  return <section><div role="tablist" aria-label="محتوای پروفایل" className="sticky top-0 z-[999] grid h-14 grid-cols-3 border-b border-divider bg-surface/95 backdrop-blur">{tabs.map((tab) => <button key={tab.id} role="tab" aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} className={`relative text-sm transition-colors hover:bg-hover ${activeTab === tab.id ? "font-black text-foreground after:absolute after:bottom-0 after:right-1/2 after:h-1 after:w-12 after:translate-x-1/2 after:rounded-full after:bg-brand" : "font-bold text-foreground-subtle"}`}>{tab.label}</button>)}</div>{activeTab === "replies" ? <Replies items={replies} /> : visiblePosts.length === 0 ? <EmptyState label={emptyLabel} /> : visiblePosts.map((post) => <PostCard key={post.id} post={post} liked={likedPostIds.has(post.id)} reposted={false} joined={Boolean(post.viewerState?.joined)} onLike={() => onLike(post.id)} onRepost={() => undefined} onShare={() => void onShare(post)} onJoin={() => undefined} onOpenMedia={() => undefined} />)}</section>;
}

function Replies({ items }: { items: ProfileReply[] }) {
  if (items.length === 0) return <EmptyState label="هنوز پاسخی ثبت نشده" />;
  return <div>{items.map((item) => <article key={item.id} className="border-b border-divider px-4 py-4"><p className="flex items-center gap-1.5 text-xs text-foreground-subtle"><MessageCircle aria-hidden="true" className="h-4 w-4" />در پاسخ به <Link href={("/posts/" + item.narrativeId) as Route} className="font-bold text-brand hover:underline">یک روایت</Link><span>·</span><span>{item.timeLabel}</span></p><Link href={("/posts/" + item.narrativeId) as Route} className="mt-2 block whitespace-pre-wrap text-sm leading-7 text-foreground hover:text-brand">{item.content}</Link></article>)}</div>;
}

function EmptyState({ label }: { label: string }) {
  return <div className="border-b border-divider px-6 py-16 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-muted text-brand"><Sparkles aria-hidden="true" className="h-6 w-6" /></div><h3 className="mt-4 text-base font-black text-foreground">{label}</h3><p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-foreground-subtle">محتوای مرتبط در این بخش از تایم‌لاین پروفایل نمایش داده می‌شود.</p></div>;
}
