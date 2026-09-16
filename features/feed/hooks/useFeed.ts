"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthGate } from "@/components/providers/AuthGateProvider";
import { loginHref, rememberReturnTo } from "@/lib/auth-navigation";
import { isAuthApiError, meydanApi } from "@/lib/meydan-api";
import { actorKey, actorNumericId, getViewerFollowing, setActorFollowing, type ActorType } from "@/lib/meydan-follow";
import { getFeedPage } from "../services/feed.service";
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
  if (typeof window === "undefined") return;
  const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  rememberReturnTo(returnTo);
  window.location.assign(loginHref(returnTo));
}

function modeFor(tab: FeedTab): "for_you" | "following" {
  return tab === "for-you" ? "for_you" : "following";
}

function filterFor(tab: FeedTab, filter: FeedFilter): string {
  return tab === "for-you" ? filter : "all";
}

type TimelinePaging = {
  /** The timeline this paging state belongs to. */
  key: string;
  cursor: string | null;
  loading: boolean;
  failed: boolean;
};

const EMPTY_PAGING = { cursor: null, loading: false, failed: false } as const;

/** How many already-seen pages a single "load more" may walk past. */
const MAX_SKIPPED_PAGES = 2;

export function useFeed(
  initialPosts: FeedPost[],
  initialSuggestions: FollowSuggestion[],
  initialNextCursor: string | null = null,
) {
  const { requireAuth } = useAuthGate();
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
  /**
   * Paging state belongs to one timeline (tab + filter). Keying it means a
   * switch back to a fresh list reads as "no cursor yet, nothing loading"
   * without resetting state from inside an effect.
   */
  const timelineKey = `${modeFor(activeTab)}:${filterFor(activeTab, activeFilter)}`;
  const [paging, setPaging] = useState<TimelinePaging>(() => ({
    key: timelineKey,
    cursor: initialNextCursor,
    loading: false,
    failed: false,
  }));
  const activePaging = paging.key === timelineKey
    ? paging
    : EMPTY_PAGING;
  const nextCursor = activePaging.cursor;
  const isLoadingMore = activePaging.loading;
  const loadMoreFailed = activePaging.failed;
  /** Bumped on every tab/filter load so a late page from the old list is dropped. */
  const generationRef = useRef(0);
  /** Ids already rendered, so an appended page never repeats a card. */
  const knownPostIdsRef = useRef<Set<string>>(new Set(initialPosts.map((post) => post.id)));

  const replacePosts = useCallback((next: FeedPost[]) => {
    knownPostIdsRef.current = new Set(next.map((post) => post.id));
    setRemotePosts(next);
    setLikedPostIds(new Set(next.filter((post) => post.viewerState?.liked).map((post) => post.id)));
    setRepostedPostIds(new Set(next.filter((post) => post.viewerState?.reposted).map((post) => post.id)));
    setJoinedPostIds(new Set(next.filter((post) => post.viewerState?.joined).map((post) => post.id)));
  }, []);

  /** Appended pages carry their own viewer state; never clear what is already known. */
  const rememberViewerState = useCallback((posts: FeedPost[]) => {
    setLikedPostIds((current) => {
      const next = new Set(current);
      for (const post of posts) if (post.viewerState?.liked) next.add(post.id);
      return next;
    });
    setRepostedPostIds((current) => {
      const next = new Set(current);
      for (const post of posts) if (post.viewerState?.reposted) next.add(post.id);
      return next;
    });
    setJoinedPostIds((current) => {
      const next = new Set(current);
      for (const post of posts) if (post.viewerState?.joined) next.add(post.id);
      return next;
    });
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

  const adjustLikeCount = useCallback((postId: string, delta: number) => {
    setRemotePosts((current) => current.map((post) => post.id === postId ? {
      ...post,
      stats: {
        ...post.stats,
        likes: Math.max(0, post.stats.likes + delta),
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
    const generation = ++generationRef.current;
    queueMicrotask(() => active && setIsLoading(true));
    // A page that lands after a tab or filter change is dropped by the
    // generation check, so a fresh list never needs its state reset here.
    void getFeedPage({ mode: modeFor(activeTab), filter: filterFor(activeTab, activeFilter) })
      .then((page) => {
        if (!active || generationRef.current !== generation) return;
        replacePosts(page.posts);
        setPaging({ key: timelineKey, cursor: page.nextCursor, loading: false, failed: false });
        if (activeTab === "following") setFollowingRequiresAuth(false);
      })
      .catch((reason) => {
        if (!active || generationRef.current !== generation) return;
        if (activeTab === "following") {
          replacePosts([]);
          if (isAuthApiError(reason)) setFollowingRequiresAuth(true);
        }
      })
      .finally(() => {
        if (active && generationRef.current === generation) setIsLoading(false);
      });
    return () => { active = false; };
  }, [activeFilter, activeTab, replacePosts, timelineKey]);

  const loadMore = useCallback(() => {
    if (isLoading || isLoadingMore || !nextCursor) return;
    const generation = generationRef.current;
    const startCursor = nextCursor;
    setPaging({ key: timelineKey, cursor: startCursor, loading: true, failed: false });

    const mode = modeFor(activeTab);
    const filter = filterFor(activeTab, activeFilter);

    void (async () => {
      let cursor: string | null = startCursor;
      try {
        // The for-you timeline is ordered per request, so an offset cursor can
        // hand back a page that only repeats what is already on screen. Skip a
        // bounded number of those instead of stopping at the first one.
        for (let skipped = 0; cursor && skipped <= MAX_SKIPPED_PAGES; skipped += 1) {
          const page = await getFeedPage({ mode, filter, cursor });
          if (generationRef.current !== generation) return;
          cursor = page.nextCursor;
          const freshPosts = page.posts.filter((post) => !knownPostIdsRef.current.has(post.id));
          if (!freshPosts.length) continue;
          for (const post of freshPosts) knownPostIdsRef.current.add(post.id);
          setRemotePosts((current) => [...current, ...freshPosts]);
          rememberViewerState(freshPosts);
          break;
        }
        setPaging({ key: timelineKey, cursor, loading: false, failed: false });
      } catch (reason) {
        if (generationRef.current !== generation) return;
        setPaging({ key: timelineKey, cursor: startCursor, loading: false, failed: true });
        if (isAuthApiError(reason)) redirectToLogin();
      }
    })();
  }, [activeFilter, activeTab, isLoading, isLoadingMore, nextCursor, rememberViewerState, timelineKey]);

  const posts = useMemo(
    () => activeTab === "for-you" ? remotePosts.filter((post) => matchesFilter(post, activeFilter)) : remotePosts,
    [activeFilter, activeTab, remotePosts],
  );

  const toggleLike = useCallback(async (postId: string) => {
    if (!requireAuth()) return;
    const isOn = !likedPostIds.has(postId);
    const delta = isOn ? 1 : -1;

    setLikedPostIds((current) => {
      const next = new Set(current);
      if (next.has(postId)) next.delete(postId); else next.add(postId);
      return next;
    });
    adjustLikeCount(postId, delta);

    try {
      const result = await meydanApi<{ stats?: { likes?: number; reposts?: number; comments?: number; views?: number } }>(`/narratives/${postId}/like`, { method: isOn ? "PUT" : "DELETE" });
      applyStats(postId, result.stats);
    } catch (reason) {
      setLikedPostIds((current) => { const next = new Set(current); if (isOn) next.delete(postId); else next.add(postId); return next; });
      adjustLikeCount(postId, -delta);
      if (isAuthApiError(reason)) redirectToLogin();
    }
  }, [adjustLikeCount, applyStats, likedPostIds, requireAuth]);

  const toggleRepost = useCallback(async (postId: string) => {
    if (!requireAuth()) return;
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
  }, [applyStats, repostedPostIds, requireAuth]);

  const toggleFollow = useCallback(async (actorType: ActorType, actorId: string | number) => {
    if (!requireAuth()) return;
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
        const page = await getFeedPage({ mode: "following", filter: "all" });
        replacePosts(page.posts);
        setPaging({ key: timelineKey, cursor: page.nextCursor, loading: false, failed: false });
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
  }, [activeTab, followedActorKeys, pendingFollowKeys, replacePosts, requireAuth, timelineKey]);

  const joinInitiative = useCallback(async (postId: string) => {
    if (!requireAuth()) return;
    const post = remotePosts.find((item) => item.id === postId);
    if (!post?.initiativeId) return;
    setJoinedPostIds((current) => new Set(current).add(postId));
    try {
      await meydanApi(`/initiatives/${post.initiativeId}/join`, { method: "PUT" });
    } catch (reason) {
      setJoinedPostIds((current) => { const next = new Set(current); next.delete(postId); return next; });
      if (isAuthApiError(reason)) redirectToLogin();
    }
  }, [remotePosts, requireAuth]);

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
    /** Size of the loaded timeline before the tab's client-side filter. */
    loadedCount: remotePosts.length,
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
    hasMore: nextCursor !== null,
    isLoadingMore,
    loadMoreFailed,
    loadMore,
  };
}
