"use client";

import { useEffect, useState } from "react";
import { isAuthApiError, meydanApi } from "@/lib/meydan-api";
import { actorKey, getViewerFollowing, setActorFollowing, type ActorType } from "@/lib/meydan-follow";
import { createDirectConversation } from "@/features/chat/services/chat.service";
import type { FeedPost } from "@/features/feed/types";
import type { ProfileDetails, ProfileSection } from "../types";

export function useProfile(profile: ProfileDetails, canManage = false) {
  const selectedTab = profile.initialTab ?? "square";
  const targetActorType: ActorType = profile.accountType === "square" ? "square" : "user";
  const targetActorKey = actorKey(targetActorType, profile.actorId);
  const [expandedSections, setExpandedSections] = useState<Set<ProfileSection>>(() => new Set(["about"]));
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [followStateReady, setFollowStateReady] = useState(canManage);
  const [followRequiresAuth, setFollowRequiresAuth] = useState(false);
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [isChatOpening, setIsChatOpening] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [narrativePosts, setNarrativePosts] = useState<FeedPost[]>(profile.narrativePosts);
  const [likedNarrativeIds, setLikedNarrativeIds] = useState<Set<string>>(() => new Set(profile.narrativePosts.filter((post) => post.viewerState?.liked).map((post) => post.id)));
  const [isLoading] = useState(false);
  const [isSavingManagement, setIsSavingManagement] = useState(false);
  const [managementError, setManagementError] = useState<string | null>(null);

  useEffect(() => {
    if (canManage) {
      setFollowStateReady(true);
      return;
    }
    let active = true;
    void getViewerFollowing()
      .then((actors) => {
        if (!active) return;
        setIsFollowing(actors.some((actor) => actorKey(actor.type, actor.id) === targetActorKey));
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
  }, [canManage, targetActorKey]);

  const toggleSection = (section: ProfileSection) => setExpandedSections((current) => {
    const next = new Set(current);
    if (next.has(section)) next.delete(section); else next.add(section);
    return next;
  });

  const toggleFollowing = async () => {
    if (canManage || isFollowLoading || !followStateReady) return;
    if (followRequiresAuth) {
      window.location.assign("/auth");
      return;
    }
    const next = !isFollowing;
    setIsFollowing(next);
    setIsFollowLoading(true);
    try {
      await setActorFollowing(targetActorType, profile.actorId, next);
    } catch (reason) {
      setIsFollowing(!next);
      if (isAuthApiError(reason)) window.location.assign("/auth");
    } finally {
      setIsFollowLoading(false);
    }
  };

  const openChat = async () => {
    if (canManage || isChatOpening) return;
    setIsChatOpening(true);
    setChatError(null);
    try {
      let chatUserId = profile.actorId;
      if (profile.accountType === "square") {
        const square = await meydanApi<{ chat_user_id?: number | null }>(`/squares/${profile.actorId}`);
        chatUserId = Number(square.chat_user_id || 0);
        if (!chatUserId) throw new Error("Square chat target is unavailable");
      }
      const conversation = await createDirectConversation(chatUserId);
      window.location.assign(`/chat/${conversation.id}`);
    } catch (reason) {
      if (isAuthApiError(reason)) {
        window.location.assign("/auth");
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

  const applyStats = (narrativeId: string, stats?: { likes?: number; reposts?: number; comments?: number; views?: number }) => {
    if (!stats) return;
    setNarrativePosts((current) => current.map((post) => post.id === narrativeId ? {
      ...post,
      stats: {
        likes: stats.likes ?? post.stats.likes,
        reposts: stats.reposts ?? post.stats.reposts,
        comments: stats.comments ?? post.stats.comments,
        views: stats.views ?? post.stats.views,
      },
    } : post));
  };

  const toggleLike = async (narrativeId: string) => {
    const next = !likedNarrativeIds.has(narrativeId);
    const delta = next ? 1 : -1;

    setLikedNarrativeIds((current) => {
      const updated = new Set(current);
      if (next) updated.add(narrativeId); else updated.delete(narrativeId);
      return updated;
    });
    adjustLikeCount(narrativeId, delta);

    try {
      const result = await meydanApi<{ stats?: { likes?: number; reposts?: number; comments?: number; views?: number } }>(`/narratives/${narrativeId}/like`, { method: next ? "PUT" : "DELETE" });
      applyStats(narrativeId, result.stats);
    } catch (reason) {
      setLikedNarrativeIds((current) => {
        const updated = new Set(current);
        if (next) updated.delete(narrativeId); else updated.add(narrativeId);
        return updated;
      });
      adjustLikeCount(narrativeId, -delta);
      if (isAuthApiError(reason)) window.location.assign("/auth");
    }
  };

  const shareNarrative = async (post: FeedPost) => {
    await meydanApi(`/narratives/${post.id}/share`, { method: "POST", headers: { "idempotency-key": crypto.randomUUID() } }).catch(() => undefined);
    const text = `${post.title} — ${post.body}`;
    if (navigator.share) { await navigator.share({ title: post.title, text }); return; }
    await navigator.clipboard?.writeText(text);
  };

  const saveUserDetails = async (input: { name: string; subtitle: string; about: string; skills: string[] }) => {
    setIsSavingManagement(true);
    setManagementError(null);
    try {
      await meydanApi("/me/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ full_name: input.name, headline: input.subtitle, about: input.about, skills: input.skills }) });
      window.location.reload();
    } catch {
      setManagementError("ذخیره‌سازی انجام نشد. دوباره تلاش کنید.");
    } finally { setIsSavingManagement(false); }
  };

  const saveSquareDetails = async (input: { name: string; subtitle: string; about: string; skills: string[] }) => {
    setIsSavingManagement(true);
    setManagementError(null);
    try {
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
    } catch {
      setManagementError("ذخیره‌سازی انجام نشد. دوباره تلاش کنید.");
    } finally {
      setIsSavingManagement(false);
    }
  };

  const createSchedule = async (input: { title: string; startsAt: string }) => {
    setIsSavingManagement(true);
    setManagementError(null);
    try {
      await meydanApi("/me/square/schedule", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: input.title, starts_at: input.startsAt }),
      });
      window.location.reload();
    } catch {
      setManagementError("ثبت برنامه انجام نشد. دوباره تلاش کنید.");
    } finally {
      setIsSavingManagement(false);
    }
  };

  return {
    profile,
    narrativePosts,
    selectedTab,
    expandedSections,
    isFollowing,
    isFollowLoading,
    followStateReady,
    isManagementOpen,
    isChatOpening,
    chatError,
    likedNarrativeIds,
    isLoading,
    isSavingManagement,
    managementError,
    toggleSection,
    toggleFollowing,
    openChat,
    openManagement: () => setIsManagementOpen(true),
    closeManagement: () => setIsManagementOpen(false),
    toggleLike,
    shareNarrative,
    saveSquareDetails,
    saveUserDetails,
    createSchedule,
  };
}
