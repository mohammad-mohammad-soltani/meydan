"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthGate } from "@/components/providers/AuthGateProvider";
import { loginHref, rememberReturnTo } from "@/lib/auth-navigation";
import { compactFa, isAuthApiError, meydanApi, plainText } from "@/lib/meydan-api";
import { invalidateMe } from "@/lib/me-client";
import { getActorFollowing, setActorFollowing, type ActorType } from "@/lib/meydan-follow";
import { actorKindOf, entityApiPath, isEntityKind } from "@/lib/profile-route";
import { createDirectConversation } from "@/features/chat/services/chat.service";
import type { FeedPost } from "@/features/feed/types";
import type { ProfileDetails, ProfileSection } from "../types";

function redirectToLogin() {
  if (typeof window === "undefined") return;
  const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  rememberReturnTo(returnTo);
  window.location.href = loginHref(returnTo);
}

export function useProfile(profile: ProfileDetails, canManage = false) {
  const { isAuthenticated, requireAuth } = useAuthGate();
  const selectedTab = profile.initialTab ?? "square";
  const targetActorType: ActorType = profile.accountType === "square" ? actorKindOf(profile.kind, "square") : "user";
  const [displayProfile, setDisplayProfile] = useState(profile);
  const [expandedSections, setExpandedSections] = useState<Set<ProfileSection>>(() => new Set(["about"]));
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [followStateReady, setFollowStateReady] = useState(canManage);
  const [followRequiresAuth, setFollowRequiresAuth] = useState(false);
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [isChatOpening, setIsChatOpening] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [narrativePosts, setNarrativePosts] = useState<FeedPost[]>(profile.narrativePosts);
  const [pinnedPost, setPinnedPost] = useState<FeedPost | null>(profile.pinnedPost ?? null);
  const [latestNarrativePageStart, setLatestNarrativePageStart] = useState(0);
  const [nextNarrativeCursor, setNextNarrativeCursor] = useState(profile.nextNarrativeCursor ?? null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [initialNarrativesLoaded, setInitialNarrativesLoaded] = useState(!profile.narrativesDeferred);
  const [loadMoreFailed, setLoadMoreFailed] = useState(false);
  const loadingMoreRef = useRef(false);
  const [likedNarrativeIds, setLikedNarrativeIds] = useState<Set<string>>(() => new Set(profile.narrativePosts.filter((post) => post.viewerState?.liked).map((post) => post.id)));
  const [repostedNarrativeIds, setRepostedNarrativeIds] = useState<Set<string>>(() => new Set(profile.narrativePosts.filter((post) => post.viewerState?.reposted).map((post) => post.id)));
  const [isLoading] = useState(false);
  const [isSavingManagement, setIsSavingManagement] = useState(false);
  const [managementError, setManagementError] = useState<string | null>(null);

  useEffect(() => {
    if (canManage) return;
    let active = true;
    const replies = meydanApi<Array<{ id: number; narrative_id: number; body: string; created_at?: string }>>(
      `/actors/${targetActorType}/${profile.actorId}/replies`,
    );
    const reflections = targetActorType === "square"
      ? meydanApi<{ count: number }>(`/squares/${profile.actorId}/media-reflections/count`)
      : Promise.resolve(null);
    void Promise.allSettled([replies, reflections]).then(([replyResult, countResult]) => {
      if (!active) return;
      setDisplayProfile((current) => ({
        ...current,
        replies: replyResult.status === "fulfilled"
          ? replyResult.value.map((item) => ({
              id: String(item.id),
              narrativeId: String(item.narrative_id),
              content: plainText(item.body || ""),
              timeLabel: item.created_at
                ? new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(new Date(item.created_at))
                : "",
            }))
          : current.replies,
        squareStats: countResult.status === "fulfilled" && countResult.value
          ? [...current.squareStats.slice(0, 1), {
              value: `${compactFa(countResult.value.count)} روایت`,
              label: "بازتاب رسانه‌ای",
              tone: "success" as const,
            }]
          : current.squareStats,
      }));
    });
    return () => { active = false; };
  }, [canManage, profile.actorId, targetActorType]);

  useEffect(() => {
    if (canManage || !isAuthenticated) {
      let active = true;
      queueMicrotask(() => { if (active) setFollowStateReady(true); });
      return () => { active = false; };
    }
    let active = true;
    void getActorFollowing(targetActorType, profile.actorId)
      .then((following) => {
        if (!active) return;
        setIsFollowing(following);
        setFollowRequiresAuth(false);
      })
      .catch((reason) => {
        if (!active) return;
        if (isAuthApiError(reason)) setFollowRequiresAuth(true);
      })
      .finally(() => {
        if (active) setFollowStateReady(true);
      });
    return () => { active = false; };
  }, [canManage, isAuthenticated, profile.actorId, targetActorType]);

  const toggleSection = (section: ProfileSection) => setExpandedSections((current) => {
    const next = new Set(current);
    if (next.has(section)) next.delete(section); else next.add(section);
    return next;
  });

  const toggleFollowing = async () => {
    if (canManage || isFollowLoading || !followStateReady) return;
    if (!requireAuth()) return;
    if (followRequiresAuth) {
      redirectToLogin();
      return;
    }
    const next = !isFollowing;
    setIsFollowing(next);
    setIsFollowLoading(true);
    try {
      await setActorFollowing(targetActorType, profile.actorId, next);
    } catch (reason) {
      setIsFollowing(!next);
      if (isAuthApiError(reason)) redirectToLogin();
    } finally {
      setIsFollowLoading(false);
    }
  };

  const openChat = async () => {
    if (canManage || isChatOpening) return;
    if (!requireAuth()) return;
    setIsChatOpening(true);
    setChatError(null);
    try {
      let chatUserId = profile.actorId;
      if (profile.accountType === "square") {
        const square = await meydanApi<{ chat_user_id?: number | null }>(isEntityKind(targetActorType) ? entityApiPath(targetActorType, profile.actorId) : `/squares/${profile.actorId}`);
        chatUserId = Number(square.chat_user_id || 0);
        if (!chatUserId) throw new Error("Square chat target is unavailable");
      }
      const conversation = await createDirectConversation(chatUserId);
      // Preserve the full navigation used to refresh the authenticated shell.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = `/chat/${conversation.id}`;
    } catch (reason) {
      if (isAuthApiError(reason)) {
        redirectToLogin();
        return;
      }
      setChatError("باز کردن گفتگو انجام نشد. دوباره تلاش کنید.");
      setIsChatOpening(false);
    }
  };

  const adjustLikeCount = (narrativeId: string, delta: number) => {
    setNarrativePosts((current) => current.map((post) => post.id === narrativeId ? {
      ...post,
      stats: {
        ...post.stats,
        likes: Math.max(0, post.stats.likes + delta),
      },
    } : post));
  };

  const adjustRepostCount = (narrativeId: string, delta: number) => {
    setNarrativePosts((current) => current.map((post) => post.id === narrativeId ? {
      ...post,
      stats: {
        ...post.stats,
        reposts: Math.max(0, post.stats.reposts + delta),
      },
    } : post));
  };

  const applyStats = (narrativeId: string, stats?: { likes?: number; reposts?: number; quotes?: number; comments?: number; views?: number }) => {
    if (!stats) return;
    setNarrativePosts((current) => current.map((post) => post.id === narrativeId ? {
      ...post,
      stats: {
        likes: stats.likes ?? post.stats.likes,
        reposts: stats.reposts ?? post.stats.reposts,
        quotes: stats.quotes ?? post.stats.quotes,
        comments: stats.comments ?? post.stats.comments,
        views: stats.views ?? post.stats.views,
      },
    } : post));
  };

  const toggleLike = async (narrativeId: string) => {
    if (!requireAuth()) return;
    const next = !likedNarrativeIds.has(narrativeId);
    const delta = next ? 1 : -1;

    setLikedNarrativeIds((current) => {
      const updated = new Set(current);
      if (next) updated.add(narrativeId); else updated.delete(narrativeId);
      return updated;
    });
    adjustLikeCount(narrativeId, delta);

    try {
      const result = await meydanApi<{ stats?: { likes?: number; reposts?: number; quotes?: number; comments?: number; views?: number } }>(`/narratives/${narrativeId}/like`, { method: next ? "PUT" : "DELETE" });
      applyStats(narrativeId, result.stats);
    } catch (reason) {
      setLikedNarrativeIds((current) => {
        const updated = new Set(current);
        if (next) updated.delete(narrativeId); else updated.add(narrativeId);
        return updated;
      });
      adjustLikeCount(narrativeId, -delta);
      if (isAuthApiError(reason)) redirectToLogin();
    }
  };

  const toggleRepost = async (narrativeId: string) => {
    if (!requireAuth()) return;
    const next = !repostedNarrativeIds.has(narrativeId);
    const delta = next ? 1 : -1;

    setRepostedNarrativeIds((current) => {
      const updated = new Set(current);
      if (next) updated.add(narrativeId); else updated.delete(narrativeId);
      return updated;
    });
    adjustRepostCount(narrativeId, delta);

    try {
      const result = await meydanApi<{ stats?: { likes?: number; reposts?: number; quotes?: number; comments?: number; views?: number } }>(`/narratives/${narrativeId}/repost`, { method: next ? "PUT" : "DELETE" });
      applyStats(narrativeId, result.stats);
    } catch (reason) {
      setRepostedNarrativeIds((current) => {
        const updated = new Set(current);
        if (next) updated.delete(narrativeId); else updated.add(narrativeId);
        return updated;
      });
      adjustRepostCount(narrativeId, -delta);
      if (isAuthApiError(reason)) redirectToLogin();
    }
  };

  const shareNarrative = async (post: FeedPost) => {
    await meydanApi(`/narratives/${post.id}/share`, { method: "POST", headers: { "idempotency-key": crypto.randomUUID() } }).catch(() => undefined);
    const text = `${post.title} — ${post.body}`;
    if (navigator.share) { await navigator.share({ title: post.title, text }); return; }
    await navigator.clipboard?.writeText(text);
  };

  const deleteNarrative = async (postId: string) => {
    if (!narrativePosts.some((post) => post.id === postId && post.viewerState?.canDelete)) return false;
    await meydanApi(`/narratives/${postId}`, { method: "DELETE" });
    setNarrativePosts((current) => current.filter((post) => post.id !== postId));
    setLikedNarrativeIds((current) => {
      const next = new Set(current);
      next.delete(postId);
      return next;
    });
    setRepostedNarrativeIds((current) => {
      const next = new Set(current);
      next.delete(postId);
      return next;
    });
    return true;
  };

  const loadMore = useCallback(async () => {
    const firstPage = !initialNarrativesLoaded;
    if ((!firstPage && !nextNarrativeCursor) || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setIsLoadingMore(true);
    setLoadMoreFailed(false);
    try {
      const response = await fetch("/api/profile/narratives", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: targetActorType, id: profile.actorId, identity: profile.identity, cursor: firstPage ? undefined : nextNarrativeCursor, own: canManage }),
      });
      if (!response.ok) throw new Error("Profile narratives request failed");
      const page = await response.json() as { posts: FeedPost[]; nextCursor: string | null; pinned?: FeedPost | null };
      if (firstPage && page.pinned !== undefined) setPinnedPost(page.pinned);
      const knownIds = new Set(narrativePosts.map((post) => post.id));
      const freshPosts = page.posts.filter((post) => !knownIds.has(post.id));
      setLatestNarrativePageStart(narrativePosts.length);
      setNarrativePosts((current) => {
        const seen = new Set(current.map((post) => post.id));
        return [...current, ...freshPosts.filter((post) => !seen.has(post.id))];
      });
      setLikedNarrativeIds((current) => {
        const next = new Set(current);
        for (const post of page.posts) if (post.viewerState?.liked) next.add(post.id);
        return next;
      });
      setRepostedNarrativeIds((current) => {
        const next = new Set(current);
        for (const post of page.posts) if (post.viewerState?.reposted) next.add(post.id);
        return next;
      });
      setNextNarrativeCursor(page.nextCursor);
      if (firstPage) setInitialNarrativesLoaded(true);
    } catch {
      setLoadMoreFailed(true);
    } finally {
      loadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [canManage, initialNarrativesLoaded, narrativePosts, nextNarrativeCursor, profile.actorId, profile.identity, targetActorType]);

  useEffect(() => {
    if (initialNarrativesLoaded || loadMoreFailed) return;
    let active = true;
    queueMicrotask(() => { if (active) void loadMore(); });
    return () => { active = false; };
  }, [initialNarrativesLoaded, loadMoreFailed, loadMore]);

  useEffect(() => {
    if (!profile.narrativesDeferred || !initialNarrativesLoaded) return;
    let active = true;
    void meydanApi<{ stats?: { narratives?: number } }>(isEntityKind(targetActorType) ? entityApiPath(targetActorType, profile.actorId) : `/squares/${profile.actorId}`)
      .then((square) => {
        if (!active || typeof square.stats?.narratives !== "number") return;
        setDisplayProfile((current) => ({
          ...current,
          narrativeCount: square.stats!.narratives!,
          squareStats: current.squareStats.map((stat, index) => index === 0
            ? { ...stat, value: compactFa(square.stats!.narratives!) }
            : stat),
        }));
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [initialNarrativesLoaded, profile.actorId, profile.narrativesDeferred, targetActorType]);

  const saveUserDetails = async (input: { name: string; subtitle: string; about: string; skills: string[] }) => {
    if (!requireAuth("/profile/edit")) return;
    setIsSavingManagement(true);
    setManagementError(null);
    try {
      invalidateMe();
      await meydanApi("/me/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ full_name: input.name, headline: input.subtitle, about: input.about, skills: input.skills }) });
      window.location.reload();
    } catch (reason) {
      if (isAuthApiError(reason)) redirectToLogin();
      else setManagementError("ذخیره‌سازی انجام نشد. دوباره تلاش کنید.");
    } finally { setIsSavingManagement(false); }
  };

  const saveSquareDetails = async (input: { name: string; subtitle: string; about: string; skills: string[] }) => {
    if (!requireAuth("/profile/edit")) return;
    setIsSavingManagement(true);
    setManagementError(null);
    try {
      invalidateMe();
      await meydanApi("/me/square", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: input.name,
          subtitle: input.subtitle,
          profile_about: input.about,
          profile_skills: input.skills,
        }),
      });
      window.location.reload();
    } catch (reason) {
      if (isAuthApiError(reason)) redirectToLogin();
      else setManagementError("ذخیره‌سازی انجام نشد. دوباره تلاش کنید.");
    } finally {
      setIsSavingManagement(false);
    }
  };

  /** Owner only: pins `post` to the profile, or unpins it when it is the pinned one. */
  const togglePin = async (post: FeedPost) => {
    const unpin = pinnedPost?.id === post.id;
    const previous = pinnedPost;
    setPinnedPost(unpin ? null : post);
    try {
      await meydanApi("/me/pinned-narrative", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ narrative_id: unpin ? null : Number(post.id) }),
      });
    } catch {
      setPinnedPost(previous);
    }
  };

  return {
    profile: displayProfile,
    pinnedPost,
    togglePin,
    narrativePosts,
    latestNarrativePageStart,
    nextNarrativeCursor,
    isLoadingMore,
    initialNarrativesLoaded,
    loadMoreFailed,
    loadMore,
    selectedTab,
    expandedSections,
    isFollowing,
    isFollowLoading,
    followStateReady,
    isManagementOpen,
    isChatOpening,
    chatError,
    likedNarrativeIds,
    repostedNarrativeIds,
    isLoading,
    isSavingManagement,
    managementError,
    toggleSection,
    toggleFollowing,
    openChat,
    openManagement: () => setIsManagementOpen(true),
    closeManagement: () => setIsManagementOpen(false),
    toggleLike,
    toggleRepost,
    shareNarrative,
    deleteNarrative,
    saveSquareDetails,
    saveUserDetails,
  };
}
