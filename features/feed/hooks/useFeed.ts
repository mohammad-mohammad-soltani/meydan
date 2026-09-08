"use client";

import { useCallback, useMemo, useState } from "react";
import { getFeedPosts, getFollowSuggestions } from "../services/feed.service";
import type { FeedFilter, FeedPost, FeedTab, MediaReflection } from "../types";

const initialPosts = await getFeedPosts();
const initialSuggestions = await getFollowSuggestions();

export function useFeed() {
  const [activeTab, setActiveTab] = useState<FeedTab>("for-you");
  const [activeFilter, setActiveFilter] = useState<FeedFilter>("all");
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(() => new Set());
  const [repostedPostIds, setRepostedPostIds] = useState<Set<string>>(() => new Set());
  const [followedSquareIds, setFollowedSquareIds] = useState<Set<string>>(() => new Set());
  const [joinedPostIds, setJoinedPostIds] = useState<Set<string>>(() => new Set());
  const [selectedMedia, setSelectedMedia] = useState<MediaReflection | null>(null);

  const posts = useMemo(() => {
    if (activeFilter === "all") return initialPosts;
    return initialPosts.filter((post) => post.kind === activeFilter);
  }, [activeFilter]);

  const toggleLike = useCallback((postId: string) => {
    setLikedPostIds((current) => {
      const next = new Set(current);
      if (next.has(postId)) next.delete(postId); else next.add(postId);
      return next;
    });
  }, []);

  const toggleRepost = useCallback((postId: string) => {
    setRepostedPostIds((current) => {
      const next = new Set(current);
      if (next.has(postId)) next.delete(postId); else next.add(postId);
      return next;
    });
  }, []);

  const toggleFollow = useCallback((squareId: string) => {
    setFollowedSquareIds((current) => {
      const next = new Set(current);
      if (next.has(squareId)) next.delete(squareId); else next.add(squareId);
      return next;
    });
  }, []);

  const joinInitiative = useCallback((postId: string) => {
    setJoinedPostIds((current) => new Set(current).add(postId));
  }, []);

  const sharePost = useCallback(async (post: FeedPost) => {
    const text = post.title + " — " + post.body;
    if (navigator.share) {
      await navigator.share({ title: post.title, text });
      return;
    }
    await navigator.clipboard?.writeText(text);
  }, []);

  return {
    activeTab,
    activeFilter,
    posts,
    suggestions: initialSuggestions,
    likedPostIds,
    repostedPostIds,
    followedSquareIds,
    joinedPostIds,
    selectedMedia,
    setActiveTab,
    setActiveFilter,
    toggleLike,
    toggleRepost,
    toggleFollow,
    joinInitiative,
    sharePost,
    openMedia: setSelectedMedia,
    closeMedia: () => setSelectedMedia(null)
  };
}