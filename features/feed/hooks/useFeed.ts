"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { isAuthApiError, meydanApi } from "@/lib/meydan-api";
import { actorKey, actorNumericId, getViewerFollowing, setActorFollowing, type ActorType } from "@/lib/meydan-follow";
import { getFeedPosts } from "../services/feed.service";
import type { FeedFilter, FeedPost, FeedTab, FollowSuggestion, MediaReflection } from "../types";

function matchesFilter(post: FeedPost, filter: FeedFilter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "initiatives":
      return Boolean(post.initiativeId);
    case "reflected":
      return Boolean(post.mediaReflection);
  }
}

function redirectToLogin() {
  if (typeof window !== "undefined") window.location.assign("/auth");
}

export function useFeed(initialPosts: FeedPost[], initialSuggestions: FollowSuggestion[]) {
  const [activeTab, setActiveTab] = useState<FeedTab>("for-you");
  const [activeFilter, setActiveFilter] = useState<FeedFilter>("all");
  const [remotePosts, setRemotePosts] = useState(initialPosts);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(() => new Set(initialPosts.filter((post) => post.viewerState?.liked).map((post) => post.id)));
  const [repostedPostIds, setRepostedPostIds] = useState<Set<string>>(() => new Set(initialPosts.filter((post) => post.viewerState?.reposted).map((post) => post.id)));
  const [followedActorKeys, setFollowedActorKeys] = useState<Set<string>>(() => new Set());
  const [pendingFollowKeys, setPendingFollowKeys] = useState<Set<string>>(() => new Set());
  const [followStateReady, setFollowStateReady] = useState(false);
  const [followingRequiresAuth, setFollowingRequiresAuth] = useState(false);
  const [joinedPostIds, setJoinedPostIds] = useState<Set<string>>(() => new Set(initialPosts.filter((post) => post.viewerState?.joined).map((post) => post.id)));
  const [selectedMedia, setSelectedMedia] = useState<MediaReflection | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const replacePosts = useCallback((next: FeedPost[]) => {
    setRemotePosts(next);
    setLikedPostIds(new Set(next.filter((post) => post.viewerState?.liked).map((post) => post.id)));
    setRepostedPostIds(new Set(next.filter((post) => post.viewerState?.reposted).map((post) => post.id)));
    setJoinedPostIds(new Set(next.filter((post) => post.viewerState?.joined).map((post) => post.id)));
  }, []);

  const applyStats = useCallback((postId: string, stats?: { likes?: number; reposts?: number; comments?: number; views?: number }) => {
    if (!stats) return;
    setRemotePosts((current) => current.map((post) => post.id === postId ? {
      ...post,
      stats: {
        likes: stats.likes ?? post.stats.likes,
        reposts: stats.reposts ?? post.stats.reposts,
        comments: stats.comments ?? post.stats.comments,
        views: stats.views ?? post.stats.views,
      },
    } : post));
  }, []);

  useEffect(() => {
    let active = true;
    void getViewerFollowing()
      .then((actors) => {
        if (!active) return;
        setFollowedActorKeys(new Set(actors.map((actor) => actorKey(actor.type, actor.id))));
        setFollowingRequiresAuth(false);
      })
      .catch((reason) => {
        if (!active) return;
        if (isAuthApiError(reason)) {
          setFollowedActorKeys(new Set());
          setFollowingRequiresAuth(true);
        }
      })
      .finally(() => {
        if (active) setFollowStateReady(true);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => active && setIsLoading(true));
    if (activeTab === "following") setRemotePosts([]);
    void getFeedPosts({
      mode: activeTab === "for-you" ? "for_you" : "following",
      filter: activeTab === "for-you" ? activeFilter : "all",
    })
      .then((next) => {
        if (!active) return;
        replacePosts(next);
        if (activeTab === "following") setFollowingRequiresAuth(false);
      })
      .catch((reason) => {
        if (!active) return;
        if (activeTab === "following") {
          replacePosts([]);
          if (isAuthApiError(reason)) setFollowingRequiresAuth(true);
        }
      })
      .finally(() => active && setIsLoading(false));
    return () => { active = false; };
  }, [activeFilter, activeTab, replacePosts]);

  const posts = useMemo(
    () => activeTab === "for-you" ? remotePosts.filter((post) => matchesFilter(post, activeFilter)) : remotePosts,
    [activeFilter, activeTab, remotePosts],
  );

  const toggleLike = useCallback(async (postId: string) => {
    const isOn = !likedPostIds.has(postId);
    setLikedPostIds((current) => {
      const next = new Set(current);
      if (next.has(postId)) next.delete(postId); else next.add(postId);
      return next;
    });
    try {
      const result = await meydanApi<{ stats?: { likes?: number; reposts?: number; comments?: number; views?: number } }>(`/narratives/${postId}/like`, { method: isOn ? "PUT" : "DELETE" });
      applyStats(postId, result.stats);
    } catch (reason) {
      setLikedPostIds((current) => { const next = new Set(current); if (isOn) next.delete(postId); else next.add(postId); return next; });
      if (isAuthApiError(reason)) redirectToLogin();
    }
  }, [applyStats, likedPostIds]);

  const toggleRepost = useCallback(async (postId: string) => {
    const isOn = !repostedPostIds.has(postId);
    setRepostedPostIds((current) => {
      const next = new Set(current);
      if (next.has(postId)) next.delete(postId); else next.add(postId);
      return next;
    });
    try {
      const result = await meydanApi<{ stats?: { likes?: number; reposts?: number; comments?: number; views?: number } }>(`/narratives/${postId}/repost`, { method: isOn ? "PUT" : "DELETE" });
      applyStats(postId, result.stats);
    } catch (reason) {
      setRepostedPostIds((current) => { const next = new Set(current); if (isOn) next.delete(postId); else next.add(postId); return next; });
      if (isAuthApiError(reason)) redirectToLogin();
    }
  }, [applyStats, repostedPostIds]);

  const toggleFollow = useCallback(async (actorType: ActorType, actorId: string | number) => {
    const id = actorNumericId(actorId);
    if (!id) return;
    const key = actorKey(actorType, id);
    if (pendingFollowKeys.has(key)) return;
    const isOn = !followedActorKeys.has(key);

    setPendingFollowKeys((current) => new Set(current).add(key));
    setFollowedActorKeys((current) => {
      const next = new Set(current);
      if (isOn) next.add(key); else next.delete(key);
      return next;
    });

    try {
      await setActorFollowing(actorType, id, isOn);
      setFollowingRequiresAuth(false);
      if (activeTab === "following") {
        const next = await getFeedPosts({ mode: "following", filter: "all" });
        replacePosts(next);
      }
    } catch (reason) {
      setFollowedActorKeys((current) => {
        const next = new Set(current);
        if (isOn) next.delete(key); else next.add(key);
        return next;
      });
      if (isAuthApiError(reason)) redirectToLogin();
    } finally {
      setPendingFollowKeys((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
    }
  }, [activeTab, followedActorKeys, pendingFollowKeys, replacePosts]);

  const joinInitiative = useCallback(async (postId: string) => {
    const post = remotePosts.find((item) => item.id === postId);
    if (!post?.initiativeId) return;
    setJoinedPostIds((current) => new Set(current).add(postId));
    try {
      await meydanApi(`/initiatives/${post.initiativeId}/join`, { method: "PUT" });
    } catch (reason) {
      setJoinedPostIds((current) => { const next = new Set(current); next.delete(postId); return next; });
      if (isAuthApiError(reason)) redirectToLogin();
    }
  }, [remotePosts]);

  const sharePost = useCallback(async (post: FeedPost) => {
    const text = post.title + " — " + post.body;
    await meydanApi(`/narratives/${post.id}/share`, { method: "POST", headers: { "idempotency-key": crypto.randomUUID() } }).catch(() => undefined);
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
    followedActorKeys,
    pendingFollowKeys,
    hasFollowing: followedActorKeys.size > 0,
    isFollowingStateLoading: !followStateReady,
    followingRequiresAuth,
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
    closeMedia: () => setSelectedMedia(null),
    isLoading,
  };
}
