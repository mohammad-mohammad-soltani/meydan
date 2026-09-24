"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthGate } from "@/components/providers/AuthGateProvider";
import { meydanApi } from "@/lib/meydan-api";
import {
  actorKey,
  getActorFollowing,
  setActorFollowing,
} from "@/lib/meydan-follow";
import type { FeedPost } from "@/features/feed/types";
import { publishMediaPost } from "../post-interactions";

export function useViewerPost(post: FeedPost | undefined) {
  const { isAuthenticated, requireAuth } = useAuthGate();
  const [stats, setStats] = useState(
    post?.stats ?? { likes: 0, comments: 0, reposts: 0, views: 0 },
  );
  const [viewerState, setViewerState] = useState({
    liked: Boolean(post?.viewerState?.liked),
    reposted: Boolean(post?.viewerState?.reposted),
  });
  const [following, setFollowing] = useState(false);
  const [followReady, setFollowReady] = useState(!isAuthenticated);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [notice, setNotice] = useState("");
  const [draft, setDraft] = useState("");
  const authorType = post?.author.type;
  const authorId = post?.author.id;
  useEffect(() => {
    if (!isAuthenticated || !authorType || !authorId) return;
    let live = true;
    void getActorFollowing(authorType, authorId)
      .then((isFollowing) => {
        if (live) {
          setFollowing(isFollowing);
          setFollowReady(true);
        }
      })
      .catch(() => {
        if (live) setNotice("وضعیت دنبال‌کردن دریافت نشد.");
      });
    return () => {
      live = false;
    };
  }, [isAuthenticated, authorType, authorId]);

  const toggle = async (action: "like" | "repost") => {
    if (!post || lock.current || !requireAuth(`/posts/${post.id}`)) return;
    lock.current = true;
    setBusy(true);
    setNotice("");
    const field = action === "like" ? "liked" : "reposted";
    const count = action === "like" ? "likes" : "reposts";
    const nextState = { ...viewerState, [field]: !viewerState[field] };
    const nextStats = {
      ...stats,
      [count]: Math.max(0, stats[count] + (nextState[field] ? 1 : -1)),
    };
    setViewerState(nextState);
    setStats(nextStats);
    publishMediaPost({ id: post.id, stats: nextStats, viewerState: nextState });
    try {
      const result = await meydanApi<{ stats?: Partial<FeedPost["stats"]> }>(
        `/narratives/${post.id}/${action}`,
        { method: nextState[field] ? "PUT" : "DELETE" },
      );
      const confirmed = { ...nextStats, ...result.stats };
      setStats(confirmed);
      publishMediaPost({
        id: post.id,
        stats: confirmed,
        viewerState: nextState,
      });
    } catch {
      setStats(stats);
      setViewerState(viewerState);
      publishMediaPost({ id: post.id, stats, viewerState });
      setNotice("تغییر ثبت نشد؛ دوباره تلاش کنید.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const follow = async () => {
    if (!post || lock.current || !requireAuth()) return;
    lock.current = true;
    setBusy(true);
    setNotice("");
    setFollowing(!following);
    try {
      await setActorFollowing(post.author.type, post.author.id, !following);
      window.dispatchEvent(
        new CustomEvent("meydan:media-follow-update", {
          detail: {
            key: actorKey(post.author.type, post.author.id),
            following: !following,
          },
        }),
      );
    } catch {
      setFollowing(following);
      setNotice("دنبال‌کردن ثبت نشد؛ دوباره تلاش کنید.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const reply = async () => {
    if (
      !post ||
      lock.current ||
      !draft.trim() ||
      !requireAuth(`/posts/${post.id}`)
    )
      return;
    lock.current = true;
    setBusy(true);
    setNotice("");
    try {
      await meydanApi(`/narratives/${post.id}/comments`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": crypto.randomUUID(),
        },
        body: JSON.stringify({ body: draft.trim() }),
      });
      const next = { ...stats, comments: stats.comments + 1 };
      setStats(next);
      setDraft("");
      setNotice("پاسخ ارسال شد.");
      publishMediaPost({ id: post.id, stats: next, viewerState });
    } catch {
      setNotice("پاسخ ارسال نشد؛ متن حفظ شده است.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const share = async () => {
    if (!post) return;
    const url = `${location.origin}/posts/${post.id}`;
    try {
      if (navigator.share)
        await navigator.share({ title: post.squareName, text: post.body, url });
      else {
        await navigator.clipboard.writeText(url);
        setNotice("پیوند کپی شد.");
      }
      void meydanApi(`/narratives/${post.id}/share`, {
        method: "POST",
        headers: { "idempotency-key": crypto.randomUUID() },
      }).catch(() => {});
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        setNotice("اشتراک‌گذاری انجام نشد.");
    }
  };
  return {
    stats,
    viewerState,
    following,
    followReady,
    busy,
    notice,
    draft,
    setDraft,
    toggle,
    follow,
    reply,
    share,
  };
}
