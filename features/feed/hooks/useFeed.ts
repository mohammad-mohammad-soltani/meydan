"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { meydanClientApi, requireLogin } from "@/lib/meydan-client-api";
import { buildSquareMap, mapNarrative, type ApiNarrative, type ApiSquare } from "../services/feed.mapper";
import type { FeedFilter, FeedPost, FeedTab, FollowSuggestion, MediaReflection } from "../types";

function matchesFilter(post: FeedPost, filter: FeedFilter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "ideas":
    case "media":
      return post.kind === filter;
    case "visual":
      return post.attachments.some((attachment) => attachment.icon === "image" || attachment.icon === "video");
    case "audio":
      return post.attachments.some((attachment) => attachment.icon === "microphone");
    case "initiatives":
      return Boolean(post.callToAction);
  }
}

function backendFilter(filter: FeedFilter): string {
  if (filter === "visual" || filter === "audio" || filter === "initiatives") return filter;
  if (filter === "media") return "reflected";
  return "all";
}

function initialInteractionIds(posts: FeedPost[], key: "liked" | "reposted"): Set<string> {
  return new Set(posts.filter((post) => Boolean(post.viewerState?.[key])).map((post) => post.id));
}

export function useFeed(initialPosts: FeedPost[], initialSuggestions: FollowSuggestion[]) {
  const [activeTab, setActiveTabState] = useState<FeedTab>("for-you");
  const [activeFilter, setActiveFilterState] = useState<FeedFilter>("all");
  const [remotePosts, setRemotePosts] = useState<FeedPost[]>(initialPosts);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(() => initialInteractionIds(initialPosts, "liked"));
  const [repostedPostIds, setRepostedPostIds] = useState<Set<string>>(() => initialInteractionIds(initialPosts, "reposted"));
  const [followedSquareIds, setFollowedSquareIds] = useState<Set<string>>(() => new Set());
  const [joinedPostIds, setJoinedPostIds] = useState<Set<string>>(() => new Set());
  const [selectedMedia, setSelectedMedia] = useState<MediaReflection | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const posts = useMemo(
    () => remotePosts.filter((post) => matchesFilter(post, activeFilter)),
    [activeFilter, remotePosts],
  );

  const loadTimeline = useCallback(async (tab: FeedTab, filter: FeedFilter) => {
    setIsLoading(true);
    try {
      const mode = tab === "following" ? "following" : "for_you";
      const [narratives, squares] = await Promise.all([
        meydanClientApi<ApiNarrative[]>(`/timeline?mode=${mode}&filter=${backendFilter(filter)}`),
        meydanClientApi<ApiSquare[]>("/squares"),
      ]);
      const mapped = narratives.map((item) => mapNarrative(item, buildSquareMap(squares)));
      setRemotePosts(mapped);
      setLikedPostIds(initialInteractionIds(mapped, "liked"));
      setRepostedPostIds(initialInteractionIds(mapped, "reposted"));
    } catch (error) {
      if (!requireLogin(error) && tab !== "following") console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const following = await meydanClientApi<Array<{ type?: string; id?: string | number }>>("/me/following");
        setFollowedSquareIds(new Set(following.filter((item) => item.type === "square").map((item) => String(item.id).replace(/^sq_/, ""))));
      } catch {
        // Public browsing is valid; auth is requested only when an authenticated action is used.
      }
    })();
  }, []);

  const setActiveTab = useCallback((tab: FeedTab) => {
    setActiveTabState(tab);
    void loadTimeline(tab, activeFilter);
  }, [activeFilter, loadTimeline]);

  const setActiveFilter = useCallback((filter: FeedFilter) => {
    setActiveFilterState(filter);
    void loadTimeline(activeTab, filter);
  }, [activeTab, loadTimeline]);

  const toggleLike = useCallback(async (postId: string) => {
    const wasLiked = likedPostIds.has(postId);
    setLikedPostIds((current) => {
      const next = new Set(current);
      if (wasLiked) next.delete(postId); else next.add(postId);
      return next;
    });
    try {
      const result = await meydanClientApi<{ stats?: { likes?: number; comments?: number; reposts?: number } }>(
        `/narratives/${postId}/like`,
        { method: wasLiked ? "DELETE" : "PUT" },
      );
      if (result.stats) {
        setRemotePosts((current) => current.map((post) => post.id === postId ? {
          ...post,
          stats: {
            likes: result.stats?.likes ?? post.stats.likes,
            comments: result.stats?.comments ?? post.stats.comments,
            reposts: result.stats?.reposts ?? post.stats.reposts,
          },
        } : post));
      }
    } catch (error) {
      setLikedPostIds((current) => {
        const next = new Set(current);
        if (wasLiked) next.add(postId); else next.delete(postId);
        return next;
      });
      requireLogin(error);
    }
  }, [likedPostIds]);

  const toggleRepost = useCallback(async (postId: string) => {
    const wasReposted = repostedPostIds.has(postId);
    setRepostedPostIds((current) => {
      const next = new Set(current);
      if (wasReposted) next.delete(postId); else next.add(postId);
      return next;
    });
    try {
      const result = await meydanClientApi<{ stats?: { likes?: number; comments?: number; reposts?: number } }>(
        `/narratives/${postId}/repost`,
        { method: wasReposted ? "DELETE" : "PUT" },
      );
      if (result.stats) {
        setRemotePosts((current) => current.map((post) => post.id === postId ? {
          ...post,
          stats: {
            likes: result.stats?.likes ?? post.stats.likes,
            comments: result.stats?.comments ?? post.stats.comments,
            reposts: result.stats?.reposts ?? post.stats.reposts,
          },
        } : post));
      }
    } catch (error) {
      setRepostedPostIds((current) => {
        const next = new Set(current);
        if (wasReposted) next.add(postId); else next.delete(postId);
        return next;
      });
      requireLogin(error);
    }
  }, [repostedPostIds]);

  const toggleFollow = useCallback(async (squareId: string) => {
    const wasFollowed = followedSquareIds.has(squareId);
    setFollowedSquareIds((current) => {
      const next = new Set(current);
      if (wasFollowed) next.delete(squareId); else next.add(squareId);
      return next;
    });
    try {
      await meydanClientApi(`/actors/square/${squareId}/follow`, { method: wasFollowed ? "DELETE" : "PUT" });
    } catch (error) {
      setFollowedSquareIds((current) => {
        const next = new Set(current);
        if (wasFollowed) next.add(squareId); else next.delete(squareId);
        return next;
      });
      requireLogin(error);
    }
  }, [followedSquareIds]);

  const joinInitiative = useCallback(async (postId: string) => {
    const post = remotePosts.find((item) => item.id === postId);
    if (!post?.initiativeId) return;
    setJoinedPostIds((current) => new Set(current).add(postId));
    try {
      await meydanClientApi(`/initiatives/${post.initiativeId}/join`, { method: "PUT" });
    } catch (error) {
      setJoinedPostIds((current) => {
        const next = new Set(current);
        next.delete(postId);
        return next;
      });
      requireLogin(error);
    }
  }, [remotePosts]);

  const sharePost = useCallback(async (post: FeedPost) => {
    try {
      await meydanClientApi(`/narratives/${post.id}/share`, { method: "POST", body: "{}" });
    } catch (error) {
      if (!requireLogin(error)) console.error(error);
    }
    const text = `${post.title} — ${post.body}`;
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
    isLoading,
    setActiveTab,
    setActiveFilter,
    toggleLike,
    toggleRepost,
    toggleFollow,
    joinInitiative,
    sharePost,
    openMedia: setSelectedMedia,
    closeMedia: () => setSelectedMedia(null),
  };
}
