"use client";

import { useEffect, useState } from "react";
import { useAuthGate } from "@/components/providers/AuthGateProvider";
import { loginHref, rememberReturnTo } from "@/lib/auth-navigation";
import { isAuthApiError, meydanApi } from "@/lib/meydan-api";
import { MEDIA_POST_UPDATE, type MediaPostUpdate } from "@/features/media/post-interactions";
import type { PostComment, PostDetail } from "../types";

function redirectToLogin() {
  if (typeof window === "undefined") return;
  const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  rememberReturnTo(returnTo);
  window.location.assign(loginHref(returnTo));
}

export function usePost(post: PostDetail) {
  const { requireAuth } = useAuthGate();
  const [liked, setLiked] = useState(Boolean(post.viewerState?.liked));
  const [reposted, setReposted] = useState(Boolean(post.viewerState?.reposted));
  const [comments, setComments] = useState<PostComment[]>(post.comments);
  const [commentDraft, setCommentDraft] = useState("");
  const [isLiveJoined, setIsLiveJoined] = useState(false);
  const [isLoading] = useState(false);
  const [counts, setCounts] = useState({ likes: post.likes, reposts: post.reposts, quotes: post.quotes, comments: post.commentsCount });

  useEffect(() => {
    const update = (event: Event) => {
      const detail = (event as CustomEvent<MediaPostUpdate>).detail;
      if (detail.id !== post.id) return;
      setLiked(detail.viewerState.liked); setReposted(detail.viewerState.reposted);
      setCounts((current) => ({ likes: detail.stats.likes, reposts: detail.stats.reposts, quotes: detail.stats.quotes ?? current.quotes, comments: detail.stats.comments }));
    };
    window.addEventListener(MEDIA_POST_UPDATE, update);
    return () => window.removeEventListener(MEDIA_POST_UPDATE, update);
  }, [post.id]);

  useEffect(() => {
    let active = true;

    meydanApi<{ viewer_state?: { liked?: boolean; reposted?: boolean } }>(`/narratives/${post.id}`)
      .then((result) => {
        if (!active) return;
        setLiked(Boolean(result.viewer_state?.liked));
        setReposted(Boolean(result.viewer_state?.reposted));
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [post.id]);

  const submitComment = async () => {
    if (!requireAuth(`/posts/${post.id}#comment-composer`)) return;
    const content = commentDraft.trim();
    if (!content) return;
    setCommentDraft("");
    try {
      const comment = await meydanApi<{ id: number; author?: { display_name?: string } | null; body: string }>(`/narratives/${post.id}/comments`, { method: "POST", headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() }, body: JSON.stringify({ body: content }) });
      setComments((current) => [{ id: String(comment.id), author: comment.author?.display_name || "شما", initials: "ش", timeAgo: "همین حالا", content: comment.body }, ...current]);
      setCounts((current) => ({ ...current, comments: current.comments + 1 }));
    } catch (reason) {
      setCommentDraft(content);
      if (isAuthApiError(reason)) redirectToLogin();
    }
  };

  const share = async () => {
    const text = post.author.name + " — " + post.body;
    await meydanApi(`/narratives/${post.id}/share`, { method: "POST", headers: { "idempotency-key": crypto.randomUUID() } }).catch(() => undefined);
    if (navigator.share) { await navigator.share({ title: "روایت میدان", text }); return; }
    await navigator.clipboard?.writeText(text);
  };

  const toggleLike = async () => {
    if (!requireAuth(`/posts/${post.id}`)) return;
    const next = !liked;
    const delta = next ? 1 : -1;

    setLiked(next);
    setCounts((current) => ({ ...current, likes: Math.max(0, current.likes + delta) }));

    try {
      const result = await meydanApi<{ stats?: { likes?: number; reposts?: number; quotes?: number; comments?: number } }>(`/narratives/${post.id}/like`, { method: next ? "PUT" : "DELETE" });
      if (result.stats) setCounts((current) => ({ likes: result.stats?.likes ?? current.likes, reposts: result.stats?.reposts ?? current.reposts, quotes: result.stats?.quotes ?? current.quotes, comments: result.stats?.comments ?? current.comments }));
    } catch (reason) {
      setLiked(!next);
      setCounts((current) => ({ ...current, likes: Math.max(0, current.likes - delta) }));
      if (isAuthApiError(reason)) redirectToLogin();
    }
  };

  const toggleRepost = async () => {
    if (!requireAuth(`/posts/${post.id}`)) return;
    const next = !reposted;
    const delta = next ? 1 : -1;
    setReposted(next);
    setCounts((current) => ({ ...current, reposts: Math.max(0, current.reposts + delta) }));
    try {
      const result = await meydanApi<{ stats?: { likes?: number; reposts?: number; quotes?: number; comments?: number } }>(`/narratives/${post.id}/repost`, { method: next ? "PUT" : "DELETE" });
      if (result.stats) setCounts((current) => ({ likes: result.stats?.likes ?? current.likes, reposts: result.stats?.reposts ?? current.reposts, quotes: result.stats?.quotes ?? current.quotes, comments: result.stats?.comments ?? current.comments }));
    } catch (reason) {
      setReposted(!next);
      setCounts((current) => ({ ...current, reposts: Math.max(0, current.reposts - delta) }));
      if (isAuthApiError(reason)) redirectToLogin();
    }
  };

  const deletePost = async (): Promise<boolean> => {
    if (!post.viewerState?.canDelete) return false;
    try {
      await meydanApi(`/narratives/${post.id}`, { method: "DELETE" });
      return true;
    } catch (reason) {
      if (isAuthApiError(reason)) redirectToLogin();
      throw reason;
    }
  };

  const joinLive = () => {
    if (requireAuth(`/posts/${post.id}`)) setIsLiveJoined(true);
  };

  return { post, comments, commentDraft, counts, liked, reposted, isLiveJoined, isLoading, setCommentDraft, toggleLike, toggleRepost, submitComment, share, joinLive, deletePost };
}
