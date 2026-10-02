"use client";

import { useState, type ReactNode } from "react";
import { Bookmark } from "lucide-react";
import { PostCard } from "@/features/feed/components/PostCard";
import type { FeedPost } from "@/features/feed/types";

/** «روایت‌ها» (saved from the share sheet) and «محتوا» (bookmarked packages). */
export function SavedTabs({ posts, postsFailed, children }: { posts: FeedPost[]; postsFailed: boolean; children: ReactNode }) {
  const [tab, setTab] = useState<"posts" | "content">("posts");
  return (
    <>
      <div role="tablist" aria-label="نوع نشان‌شده‌ها" className="flex border-b border-divider">
        {([["posts", "روایت‌ها"], ["content", "محتوا"]] as const).map(([id, label]) => (
          <button key={id} role="tab" type="button" aria-selected={tab === id} onClick={() => setTab(id)} className={`relative flex-1 py-3 text-xs ${tab === id ? "font-black text-foreground after:absolute after:inset-x-1/4 after:bottom-0 after:h-[3px] after:rounded-t-full after:bg-emphasis" : "font-bold text-muted-foreground"}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === "content" ? children : postsFailed ? (
        <p role="alert" className="p-6 text-center text-xs text-muted-foreground">دریافت روایت‌های ذخیره‌شده ممکن نشد.</p>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 p-10 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl border border-border bg-surface-muted text-icon">
            <Bookmark aria-hidden="true" className="h-5 w-5" />
          </span>
          <p className="text-sm font-black text-foreground">هنوز روایتی ذخیره نکرده‌اید</p>
          <p className="text-xs text-muted-foreground">از دکمه «اشتراک» هر روایت، «ذخیره روایت» را بزنید.</p>
        </div>
      ) : (
        <div>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} liked={Boolean(post.viewerState?.liked)} reposted={Boolean(post.viewerState?.reposted)} joined={Boolean(post.viewerState?.joined)} onLike={() => undefined} onRepost={() => undefined} onShare={() => undefined} onJoin={() => undefined} onOpenMedia={() => undefined} hideActions />
          ))}
        </div>
      )}
    </>
  );
}
