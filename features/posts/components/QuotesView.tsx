"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle, Pencil } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useAuthGate } from "@/components/providers/AuthGateProvider";
import { loginHref, rememberReturnTo } from "@/lib/auth-navigation";
import { isAuthApiError, meydanApi } from "@/lib/meydan-api";
import { DeletePostDialog } from "@/features/feed/components/DeletePostDialog";
import { PostCard } from "@/features/feed/components/PostCard";
import { useInfiniteScroll } from "@/features/feed/hooks/useInfiniteScroll";
import { quoteComposeHref } from "@/features/feed/post-counts";
import { getQuotesPage } from "@/features/feed/services/feed.service";
import type { FeedPost } from "@/features/feed/types";
import { useShare } from "@/features/share/ShareProvider";
import { toSharePost } from "@/features/share/to-share-post";

type StatsPayload = { likes?: number; reposts?: number; quotes?: number; comments?: number; views?: number };

function redirectToLogin() {
  const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  rememberReturnTo(returnTo);
  window.location.assign(loginHref(returnTo));
}

/** Every narrative that quotes `postId`, as full timeline cards. */
export function QuotesView({ postId, initialPosts, initialNextCursor }: { postId: string; initialPosts: FeedPost[]; initialNextCursor: string | null }) {
  const router = useRouter();
  const { requireAuth } = useAuthGate();
  const [posts, setPosts] = useState(initialPosts);
  const [cursor, setCursor] = useState(initialNextCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const loadingRef = useRef(false);
  const [deleteTarget, setDeleteTarget] = useState<FeedPost | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const update = useCallback((id: string, change: (post: FeedPost) => FeedPost) => {
    setPosts((current) => current.map((post) => (post.id === id ? change(post) : post)));
  }, []);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingRef.current) return;
    loadingRef.current = true;
    setLoadingMore(true);
    setLoadFailed(false);
    try {
      const page = await getQuotesPage(postId, cursor);
      setPosts((current) => {
        const seen = new Set(current.map((post) => post.id));
        return [...current, ...page.posts.filter((post) => !seen.has(post.id))];
      });
      setCursor(page.nextCursor);
    } catch {
      setLoadFailed(true);
    } finally {
      loadingRef.current = false;
      setLoadingMore(false);
    }
  }, [cursor, postId]);

  const sentinelRef = useInfiniteScroll({
    enabled: Boolean(cursor) && !loadingMore && !loadFailed,
    onLoadMore: () => void loadMore(),
    revision: posts.length,
  });

  /** Optimistic like/repost: flip the state and count, then settle on the server's stats. */
  const toggle = async (post: FeedPost, action: "like" | "repost") => {
    if (!requireAuth()) return;
    const field = action === "like" ? "liked" : "reposted";
    const count = action === "like" ? "likes" : "reposts";
    const on = !post.viewerState?.[field];
    update(post.id, (current) => ({
      ...current,
      viewerState: { liked: false, reposted: false, joined: false, ...current.viewerState, [field]: on },
      stats: { ...current.stats, [count]: Math.max(0, current.stats[count] + (on ? 1 : -1)) },
    }));
    try {
      const result = await meydanApi<{ stats?: StatsPayload }>(`/narratives/${post.id}/${action}`, { method: on ? "PUT" : "DELETE" });
      if (result.stats) update(post.id, (current) => ({ ...current, stats: { ...current.stats, ...result.stats } }));
    } catch (reason) {
      update(post.id, () => post);
      if (isAuthApiError(reason)) redirectToLogin();
    }
  };

  const { openShare } = useShare();
  const share = async (post: FeedPost) => {
    openShare(toSharePost(post));
  };

  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.push(`/posts/${postId}` as Route);
  };

  return (
    <section className="ui-enter flex min-h-full flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 flex min-h-12 items-center gap-2 border-b border-border bg-surface-glass px-4 py-2 shadow-xs backdrop-blur-xl">
        <button type="button" onClick={goBack} aria-label="بازگشت" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-icon-muted transition-colors hover:bg-hover hover:text-brand">
          <ArrowRight className="h-5 w-5" />
        </button>
        <h1 className="truncate text-sm font-bold text-foreground">نقل‌قول‌ها</h1>
      </header>

      {posts.length === 0 && !cursor ? (
        <div className="px-6 py-16 text-center">
          <p className="text-base font-black text-foreground">هنوز نقل‌قولی ثبت نشده</p>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-foreground-subtle">وقتی کسی این روایت را با نوشتهٔ خودش بازنشر کند، اینجا نمایش داده می‌شود.</p>
          <Link href={quoteComposeHref(postId) as Route} className="mt-5 inline-flex items-center gap-2 rounded-pill bg-brand px-4 py-2.5 text-xs font-black text-brand-foreground">
            <Pencil aria-hidden="true" className="h-4 w-4" />
            اولین نقل‌قول را بنویس
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-divider">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              videoPosts={posts}
              liked={Boolean(post.viewerState?.liked)}
              reposted={Boolean(post.viewerState?.reposted)}
              joined={Boolean(post.viewerState?.joined)}
              onLike={() => void toggle(post, "like")}
              onRepost={() => void toggle(post, "repost")}
              onShare={() => void share(post)}
              onJoin={() => undefined}
              onOpenMedia={() => undefined}
              onDelete={() => {
                setDeleteError(null);
                setDeleteTarget(post);
              }}
            />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-px" aria-hidden="true" />
      <div className="px-4 py-5">
        {loadingMore ? (
          <p role="status" className="flex items-center justify-center gap-2 text-xs text-foreground-subtle">
            <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
            در حال بارگذاری نقل‌قول‌های بیشتر…
          </p>
        ) : loadFailed ? (
          <button type="button" onClick={() => void loadMore()} className="mx-auto block rounded-pill border border-border px-4 py-2 text-xs font-black">
            تلاش دوباره
          </button>
        ) : null}
      </div>

      {deleteTarget ? (
        <DeletePostDialog
          busy={deleteBusy}
          error={deleteError}
          onCancel={() => { if (!deleteBusy) setDeleteTarget(null); }}
          onConfirm={() => {
            setDeleteBusy(true);
            setDeleteError(null);
            void meydanApi(`/narratives/${deleteTarget.id}`, { method: "DELETE" })
              .then(() => {
                setPosts((current) => current.filter((post) => post.id !== deleteTarget.id));
                setDeleteTarget(null);
              })
              .catch(() => setDeleteError("حذف روایت انجام نشد. دوباره تلاش کنید."))
              .finally(() => setDeleteBusy(false));
          }}
        />
      ) : null}
    </section>
  );
}
