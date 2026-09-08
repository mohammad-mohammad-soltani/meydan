"use client";

import { useMemo, useState } from "react";
import type { PostComment, PostDetail } from "../types";

export function usePost(post: PostDetail) {
  const [liked, setLiked] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [comments, setComments] = useState<PostComment[]>(post.comments);
  const [commentDraft, setCommentDraft] = useState("");
  const [isLiveJoined, setIsLiveJoined] = useState(false);
  const [isLoading] = useState(false);

  const counts = useMemo(() => ({ likes: post.likes + (liked ? 1 : 0), reposts: post.reposts + (reposted ? 1 : 0), comments: comments.length }), [comments.length, liked, post.likes, post.reposts, reposted]);

  const submitComment = () => {
    const content = commentDraft.trim();
    if (!content) return;
    setComments((current) => [{ id: "comment-" + Date.now(), author: "شما", initials: "ش", timeAgo: "همین حالا", content }, ...current]);
    setCommentDraft("");
  };

  const share = async () => {
    const text = post.author.name + " — " + post.body;
    if (navigator.share) { await navigator.share({ title: "روایت میدان", text }); return; }
    await navigator.clipboard?.writeText(text);
  };

  return { post, comments, commentDraft, counts, liked, reposted, isLiveJoined, isLoading, setCommentDraft, toggleLike: () => setLiked((current) => !current), toggleRepost: () => setReposted((current) => !current), submitComment, share, joinLive: () => setIsLiveJoined(true) };
}
