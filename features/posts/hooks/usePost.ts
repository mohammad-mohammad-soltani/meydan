"use client";

import { useState } from "react";
import { meydanApi } from "@/lib/meydan-api";
import type { PostComment, PostDetail } from "../types";

export function usePost(post: PostDetail) {
  const [liked, setLiked] = useState(Boolean(post.viewerState?.liked));
  const [reposted, setReposted] = useState(Boolean(post.viewerState?.reposted));
  const [comments, setComments] = useState<PostComment[]>(post.comments);
  const [commentDraft, setCommentDraft] = useState("");
  const [isLiveJoined, setIsLiveJoined] = useState(false);
  const [isLoading] = useState(false);
  const [counts, setCounts] = useState({ likes: post.likes, reposts: post.reposts, comments: post.commentsCount });

  const submitComment = async () => {
    const content = commentDraft.trim();
    if (!content) return;
    setCommentDraft("");
    try {
      const comment = await meydanApi<{ id: number; author?: { display_name?: string } | null; body: string; created_at?: string }>(`/narratives/${post.id}/comments`, { method: "POST", headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() }, body: JSON.stringify({ body: content }) });
      setComments((current) => [{ id: String(comment.id), author: comment.author?.display_name || "شما", initials: "ش", timeAgo: "همین حالا", content: comment.body }, ...current]);
      setCounts((current) => ({ ...current, comments: current.comments + 1 }));
    } catch {
      setCommentDraft(content);
    }
  };

  const share = async () => {
    const text = post.author.name + " — " + post.body;
    await meydanApi(`/narratives/${post.id}/share`, { method: "POST", headers: { "idempotency-key": crypto.randomUUID() } }).catch(() => undefined);
    if (navigator.share) { await navigator.share({ title: "روایت میدان", text }); return; }
    await navigator.clipboard?.writeText(text);
  };

  const toggleLike = async () => {
    const next = !liked;
    setLiked(next);
    try {
      const result = await meydanApi<{ stats?: { likes?: number; reposts?: number; comments?: number } }>(`/narratives/${post.id}/like`, { method: next ? "PUT" : "DELETE" });
      if (result.stats) setCounts((current) => ({ likes: result.stats?.likes ?? current.likes, reposts: result.stats?.reposts ?? current.reposts, comments: result.stats?.comments ?? current.comments }));
    } catch { setLiked(!next); }
  };
  const toggleRepost = async () => {
    const next = !reposted;
    setReposted(next);
    try {
      const result = await meydanApi<{ stats?: { likes?: number; reposts?: number; comments?: number } }>(`/narratives/${post.id}/repost`, { method: next ? "PUT" : "DELETE" });
      if (result.stats) setCounts((current) => ({ likes: result.stats?.likes ?? current.likes, reposts: result.stats?.reposts ?? current.reposts, comments: result.stats?.comments ?? current.comments }));
    } catch { setReposted(!next); }
  };

  return { post, comments, commentDraft, counts, liked, reposted, isLiveJoined, isLoading, setCommentDraft, toggleLike, toggleRepost, submitComment, share, joinLive: () => setIsLiveJoined(true) };
}
