"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthGate } from "@/components/providers/AuthGateProvider";
import { loginHref, rememberReturnTo } from "@/lib/auth-navigation";
import { isAuthApiError, MeydanApiError, meydanApi } from "@/lib/meydan-api";
import { actorKey, actorNumericId, getFollowingStates, setActorFollowing, type ActorType } from "@/lib/meydan-follow";
import { MEDIA_POST_UPDATE, type MediaPostUpdate } from "@/features/media/post-interactions";
import { getFeedPage } from "../services/feed.service";
import { useShare } from "@/features/share/ShareProvider";
import { toSharePost } from "@/features/share/to-share-post";
import type { FeedFilter, FeedPost, FeedTab, FollowSuggestion, MediaReflection } from "../types";

function matchesFilter(post: FeedPost, filter: FeedFilter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "narratives":
      return !post.initiativeId;
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

function isAbortError(reason: unknown): boolean {
  return reason instanceof DOMException && reason.name === "AbortError";
}

type TimelinePaging = {
  key: string;
  cursor: string | null;
  loading: boolean;
  failed: boolean;
};

const EMPTY_PAGING = { cursor: null, loading: false, failed: false } as const;
const MAX_EMPTY_PAGES = 2;

export function useFeed(
  initialPosts: FeedPost[],
  initialSuggestions: FollowSuggestion[],
  initialNextCursor: string | null = null,
  initialPageReady = true,
  /** Filter the server page was read with (the `?filter=` of /home). */
  initialFilter: FeedFilter = "all",
) {
  const { isAuthenticated, requireAuth } = useAuthGate();
  const [activeTab, setActiveTab] = useState<FeedTab>("for-you");
  const [activeFilter, setActiveFilter] = useState<FeedFilter>(initialFilter);
  const [remotePosts, setRemotePosts] = useState(initialPosts);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(() => new Set(initialPosts.filter((post) => post.viewerState?.liked).map((post) => post.id)));
  const [repostedPostIds, setRepostedPostIds] = useState<Set<string>>(() => new Set(initialPosts.filter((post) => post.viewerState?.reposted).map((post) => post.id)));
  const [followedActorKeys, setFollowedActorKeys] = useState<Set<string>>(() => new Set());
  const [pendingFollowKeys, setPendingFollowKeys] = useState<Set<string>>(() => new Set());
  const [followStateReady, setFollowStateReady] = useState(() => !isAuthenticated);
  const [hasAnyFollowing, setHasAnyFollowing] = useState(false);
  const [followingRequiresAuth, setFollowingRequiresAuth] = useState(false);
  const [joinedPostIds, setJoinedPostIds] = useState<Set<string>>(() => new Set(initialPosts.filter((post) => post.viewerState?.joined).map((post) => post.id)));
  const [selectedMedia, setSelectedMedia] = useState<MediaReflection | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const update = (event: Event) => {
      const detail = (event as CustomEvent<MediaPostUpdate>).detail;
      setRemotePosts((posts) => posts.map((post) => post.id === detail.id ? { ...post, stats: detail.stats, viewerState: { joined: Boolean(post.viewerState?.joined), ...post.viewerState, ...detail.viewerState } } : post));
      setLikedPostIds((ids) => { const next = new Set(ids); if (detail.viewerState.liked) next.add(detail.id); else next.delete(detail.id); return next; });
      setRepostedPostIds((ids) => { const next = new Set(ids); if (detail.viewerState.reposted) next.add(detail.id); else next.delete(detail.id); return next; });
    };
    const follow = (event: Event) => {
      const detail = (event as CustomEvent<{ key: string; following: boolean }>).detail;
      setFollowedActorKeys((keys) => { const next = new Set(keys); if (detail.following) next.add(detail.key); else next.delete(detail.key); return next; });
    };
    window.addEventListener(MEDIA_POST_UPDATE, update);
    window.addEventListener("meydan:media-follow-update", follow);
    return () => { window.removeEventListener(MEDIA_POST_UPDATE, update); window.removeEventListener("meydan:media-follow-update", follow); };
  }, []);

  const timelineKey = `${modeFor(activeTab)}:${filterFor(activeTab, activeFilter)}`;
  const [paging, setPaging] = useState<TimelinePaging>(() => ({
    key: timelineKey,
    cursor: initialNextCursor,
    loading: false,
    failed: false,
  }));
  const activePaging = paging.key === timelineKey ? paging : EMPTY_PAGING;
  const nextCursor = activePaging.cursor;
  const isLoadingMore = activePaging.loading;
  const loadMoreFailed = activePaging.failed;

  // First page per timeline, so flipping tabs paints instantly and revalidates
  // in the background instead of falling back to a skeleton every time.
  const timelineCacheRef = useRef(new Map<string, { posts: FeedPost[]; cursor: string | null }>());
  const initialPageConsumedRef = useRef(false);
  const generationRef = useRef(0);
  const knownPostIdsRef = useRef<Set<string>>(new Set(initialPosts.map((post) => post.id)));
  const loadMoreInFlightRef = useRef(false);
  const loadMoreAbortRef = useRef<AbortController | null>(null);

  const replacePosts = useCallback((next: FeedPost[]) => {
    knownPostIdsRef.current = new Set(next.map((post) => post.id));
    setRemotePosts(next);
    setLikedPostIds(new Set(next.filter((post) => post.viewerState?.liked).map((post) => post.id)));
    setRepostedPostIds(new Set(next.filter((post) => post.viewerState?.reposted).map((post) => post.id)));
    setJoinedPostIds(new Set(next.filter((post) => post.viewerState?.joined).map((post) => post.id)));
  }, []);

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

  const appendFreshPosts = useCallback((posts: FeedPost[]): number => {
    const fresh = posts.filter((post) => !knownPostIdsRef.current.has(post.id));
    if (!fresh.length) return 0;

    for (const post of fresh) knownPostIdsRef.current.add(post.id);
    setRemotePosts((current) => [...current, ...fresh]);
    rememberViewerState(fresh);
    return fresh.length;
  }, [rememberViewerState]);

  const applyStats = useCallback((postId: string, stats?: { likes?: number; reposts?: number; quotes?: number; comments?: number; views?: number }) => {
    if (!stats) return;
    setRemotePosts((current) => current.map((post) => post.id === postId ? {
      ...post,
      stats: {
        likes: stats.likes ?? post.stats.likes,
        reposts: stats.reposts ?? post.stats.reposts,
        quotes: stats.quotes ?? post.stats.quotes,
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

  const adjustRepostCount = useCallback((postId: string, delta: number) => {
    setRemotePosts((current) => current.map((post) => post.id === postId ? {
      ...post,
      stats: {
        ...post.stats,
        reposts: Math.max(0, post.stats.reposts + delta),
      },
    } : post));
  }, []);

  const followTargetKey = Array.from(new Set([
    ...remotePosts.map((post) => actorKey(post.author.type, post.author.id)),
    ...initialSuggestions.map((actor) => actorKey(actor.actorType, actor.id)),
  ])).sort().join(",");

  useEffect(() => {
    if (!isAuthenticated) return;

    const actors = followTargetKey.split(",").filter(Boolean).map((key) => {
      const [type, id] = key.split(":");
      return { type: type as ActorType, id: Number(id) };
    });
    let active = true;
    void getFollowingStates(actors)
      .then(({ keys, hasFollowing }) => {
        if (!active) return;
        setFollowedActorKeys(new Set(keys));
        setHasAnyFollowing(hasFollowing);
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
  }, [isAuthenticated, followTargetKey]);

  useEffect(() => {
    const isInitialTimeline = activeTab === "for-you" && activeFilter === initialFilter;
    const canUseServerPage = !initialPageConsumedRef.current && isInitialTimeline && initialPageReady;
    initialPageConsumedRef.current = true;

    if (canUseServerPage) {
      timelineCacheRef.current.set(timelineKey, { posts: initialPosts, cursor: initialNextCursor });
      return;
    }

    const cached = timelineCacheRef.current.get(timelineKey);

    let active = true;
    const controller = new AbortController();
    const generation = ++generationRef.current;

    loadMoreAbortRef.current?.abort();
    loadMoreAbortRef.current = null;
    loadMoreInFlightRef.current = false;

    if (cached) {
      replacePosts(cached.posts);
      setPaging({ key: timelineKey, cursor: cached.cursor, loading: false, failed: false });
    } else {
      queueMicrotask(() => active && setIsLoading(true));
    }

    void getFeedPage(
      { mode: modeFor(activeTab), filter: filterFor(activeTab, activeFilter) },
      { signal: controller.signal },
    )
      .then((page) => {
        if (!active || generationRef.current !== generation) return;
        timelineCacheRef.current.set(timelineKey, { posts: page.posts, cursor: page.nextCursor });
        replacePosts(page.posts);
        setPaging({ key: timelineKey, cursor: page.nextCursor, loading: false, failed: false });
        if (activeTab === "following") setFollowingRequiresAuth(false);
      })
      .catch((reason) => {
        if (isAbortError(reason) || !active || generationRef.current !== generation) return;
        if (activeTab === "following") {
          timelineCacheRef.current.delete(timelineKey);
          replacePosts([]);
          if (isAuthApiError(reason)) setFollowingRequiresAuth(true);
        }
      })
      .finally(() => {
        if (active && generationRef.current === generation) setIsLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [activeFilter, activeTab, initialFilter, initialNextCursor, initialPageReady, initialPosts, replacePosts, timelineKey]);

  const loadMore = useCallback(() => {
    if (isLoading || isLoadingMore || !nextCursor || loadMoreInFlightRef.current) return;

    const generation = generationRef.current;
    const startCursor = nextCursor;
    const mode = modeFor(activeTab);
    const filter = filterFor(activeTab, activeFilter);
    const controller = new AbortController();

    loadMoreAbortRef.current?.abort();
    loadMoreAbortRef.current = controller;
    loadMoreInFlightRef.current = true;
    setPaging({ key: timelineKey, cursor: startCursor, loading: true, failed: false });

    void (async () => {
      let cursor: string | null = startCursor;

      try {
        // Stable backend sessions should never repeat a page. The bounded loop
        // only skips tombstoned/deleted narratives that serialize to an empty page.
        for (let attempt = 0; cursor && attempt <= MAX_EMPTY_PAGES; attempt += 1) {
          const page = await getFeedPage({ mode, filter, cursor }, { signal: controller.signal });
          if (generationRef.current !== generation) return;

          cursor = page.nextCursor;
          if (appendFreshPosts(page.posts) > 0 || !cursor) break;
        }

        if (generationRef.current !== generation) return;
        setPaging({ key: timelineKey, cursor, loading: false, failed: false });
      } catch (caught) {
        if (isAbortError(caught) || generationRef.current !== generation) return;

        let reason: unknown = caught;

        // An inactive tab can sit open long enough for its server-side snapshot
        // to expire. Start a new session without replacing the visible list and
        // append only unseen cards so scroll position is preserved.
        if (reason instanceof MeydanApiError && reason.status === 410) {
          try {
            const freshPage = await getFeedPage({ mode, filter }, { signal: controller.signal });
            if (generationRef.current !== generation) return;
            appendFreshPosts(freshPage.posts);
            setPaging({ key: timelineKey, cursor: freshPage.nextCursor, loading: false, failed: false });
            return;
          } catch (recoveryReason) {
            if (isAbortError(recoveryReason) || generationRef.current !== generation) return;
            reason = recoveryReason;
          }
        }

        setPaging({ key: timelineKey, cursor: startCursor, loading: false, failed: true });
        if (isAuthApiError(reason)) redirectToLogin();
      } finally {
        if (loadMoreAbortRef.current === controller) loadMoreAbortRef.current = null;
        loadMoreInFlightRef.current = false;
      }
    })();
  }, [activeFilter, activeTab, appendFreshPosts, isLoading, isLoadingMore, nextCursor, timelineKey]);

  const posts = useMemo(
    () => (activeTab === "for-you" ? remotePosts.filter((post) => matchesFilter(post, activeFilter)) : remotePosts).map((post) => ({ ...post, viewerState: { joined: Boolean(post.viewerState?.joined), ...post.viewerState, liked: likedPostIds.has(post.id), reposted: repostedPostIds.has(post.id) } })),
    [activeFilter, activeTab, remotePosts, likedPostIds, repostedPostIds],
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
      const result = await meydanApi<{ stats?: { likes?: number; reposts?: number; quotes?: number; comments?: number; views?: number } }>(`/narratives/${postId}/like`, { method: isOn ? "PUT" : "DELETE" });
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
    const delta = isOn ? 1 : -1;
    setRepostedPostIds((current) => {
      const next = new Set(current);
      if (next.has(postId)) next.delete(postId); else next.add(postId);
      return next;
    });
    adjustRepostCount(postId, delta);
    try {
      const result = await meydanApi<{ stats?: { likes?: number; reposts?: number; quotes?: number; comments?: number; views?: number } }>(`/narratives/${postId}/repost`, { method: isOn ? "PUT" : "DELETE" });
      applyStats(postId, result.stats);
    } catch (reason) {
      setRepostedPostIds((current) => { const next = new Set(current); if (isOn) next.delete(postId); else next.add(postId); return next; });
      adjustRepostCount(postId, -delta);
      if (isAuthApiError(reason)) redirectToLogin();
    }
  }, [adjustRepostCount, applyStats, repostedPostIds, requireAuth]);

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
      timelineCacheRef.current.delete("following:all");
      if (activeTab === "following") {
        const page = await getFeedPage({ mode: "following", filter: "all" });
        timelineCacheRef.current.set("following:all", { posts: page.posts, cursor: page.nextCursor });
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

  // The share sheet counts the share itself, once the reader actually shares.
  const { openShare } = useShare();
  const sharePost = useCallback(async (post: FeedPost) => {
    openShare(toSharePost(post));
  }, [openShare]);

  const deletePost = useCallback(async (postId: string) => {
    const post = remotePosts.find((item) => item.id === postId);
    if (!post?.viewerState?.canDelete) return;
    await meydanApi(`/narratives/${postId}`, { method: "DELETE" });
    knownPostIdsRef.current.delete(postId);
    setRemotePosts((items) => items.filter((item) => item.id !== postId));
  }, [remotePosts]);

  return {
    activeTab,
    activeFilter,
    posts,
    loadedCount: remotePosts.length,
    suggestions: initialSuggestions,
    likedPostIds,
    repostedPostIds,
    followedActorKeys,
    pendingFollowKeys,
    hasFollowing: hasAnyFollowing || followedActorKeys.size > 0,
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
    deletePost,
    openMedia: setSelectedMedia,
    closeMedia: () => setSelectedMedia(null),
    isLoading,
    hasMore: nextCursor !== null,
    isLoadingMore,
    loadMoreFailed,
    loadMore,
  };
}
