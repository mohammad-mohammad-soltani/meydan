"use client";

import { useEffect, useMemo, useState } from "react";
import { meydanClientApi, requireLogin } from "@/lib/meydan-client-api";
import { mapApiComment, type ApiPostComment, type ApiPostNarrative } from "../services/posts.service";
import type { PostComment, PostDetail } from "../types";

export function usePost(post: PostDetail) {
  const [liked, setLiked] = useState(Boolean(post.viewerState?.liked));
  const [reposted, setReposted] = useState(Boolean(post.viewerState?.reposted));
  const [likes, setLikes] = useState(post.likes);
  const [reposts, setReposts] = useState(post.reposts);
  const [comments, setComments] = useState<PostComment[]>(post.comments);
  const [commentDraft, setCommentDraft] = useState("");
  const [isLiveJoined, setIsLiveJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [freshPost, freshComments] = await Promise.all([
          meydanClientApi<ApiPostNarrative>(`/narratives/${post.id}`),
          meydanClientApi<ApiPostComment[]>(`/narratives/${post.id}/comments`),
        ]);
        if (!active) return;
        setLiked(Boolean(freshPost.viewer_state?.liked));
        setReposted(Boolean(freshPost.viewer_state?.reposted));
        setLikes(freshPost.stats?.likes ?? post.likes);
        setReposts(freshPost.stats?.reposts ?? post.reposts);
        setComments(freshComments.map((item) => mapApiComment(item, freshPost.author?.id)));
      } catch {
        // Public detail remains usable; authenticated state is hydrated when a session exists.
      }
    })();
    return () => { active = false; };
  }, [post.id, post.likes, post.reposts]);

  const counts = useMemo(() => ({ likes, reposts, comments: comments.length }), [comments.length, likes, reposts]);

  const toggleLike = async () => {
    const before = liked;
    setLiked(!before);
    setLikes((value) => Math.max(0, value + (before ? -1 : 1)));
    try {
      const result = await meydanClientApi<{ stats?: { likes?: number } }>(`/narratives/${post.id}/like`, {
        method: before ? "DELETE" : "PUT",
      });
      if (typeof result.stats?.likes === "number") setLikes(result.stats.likes);
    } catch (error) {
      setLiked(before);
      setLikes((value) => Math.max(0, value + (before ? 1 : -1)));
      requireLogin(error);
    }
  };

  const toggleRepost = async () => {
    const before = reposted;
    setReposted(!before);
    setReposts((value) => Math.max(0, value + (before ? -1 : 1)));
    try {
      const result = await meydanClientApi<{ stats?: { reposts?: number } }>(`/narratives/${post.id}/repost`, {
        method: before ? "DELETE" : "PUT",
      });
      if (typeof result.stats?.reposts === "number") setReposts(result.stats.reposts);
    } catch (error) {
      setReposted(before);
      setReposts((value) => Math.max(0, value + (before ? 1 : -1)));
      requireLogin(error);
    }
  };

  const submitComment = async () => {
    const content = commentDraft.trim();
    if (!content || isLoading) return;
    setIsLoading(true);
    try {
      const created = await meydanClientApi<ApiPostComment>(`/narratives/${post.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: content }),
      });
      setComments((current) => [mapApiComment(created, post.author.handle), ...current]);
      setCommentDraft("");
    } catch (error) {
      requireLogin(error);
    } finally {
      setIsLoading(false);
    }
  };

  const share = async () => {
    try {
      await meydanClientApi(`/narratives/${post.id}/share`, { method: "POST", body: "{}" });
    } catch (error) {
      if (!requireLogin(error)) console.error(error);
    }
    const text = `${post.author.name} — ${post.body}`;
    if (navigator.share) { await navigator.share({ title: "روایت میدان", text }); return; }
    await navigator.clipboard?.writeText(text);
  };

  return {
    post,
    comments,
    commentDraft,
    counts,
    liked,
    reposted,
    isLiveJoined,
    isLoading,
    setCommentDraft,
    toggleLike,
    toggleRepost,
    submitComment,
    share,
    joinLive: () => setIsLiveJoined(true),
  };
}
