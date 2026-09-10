"use client";

import { useState } from "react";
import { meydanApi } from "@/lib/meydan-api";
import type { FeedPost } from "@/features/feed/types";
import type { ProfileDetails, ProfileSection } from "../types";

export function useProfile(profile: ProfileDetails) {
  const selectedTab = profile.initialTab ?? "square";
  const [expandedSections, setExpandedSections] = useState<Set<ProfileSection>>(() => new Set(["about"]));
  const [isFollowing, setIsFollowing] = useState(false);
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [likedNarrativeIds, setLikedNarrativeIds] = useState<Set<string>>(() => new Set(profile.narrativePosts.filter((post) => post.viewerState?.liked).map((post) => post.id)));
  const [isLoading] = useState(false);
  const [isSavingManagement, setIsSavingManagement] = useState(false);
  const [managementError, setManagementError] = useState<string | null>(null);

  const toggleSection = (section: ProfileSection) => setExpandedSections((current) => {
    const next = new Set(current);
    if (next.has(section)) next.delete(section); else next.add(section);
    return next;
  });

  const toggleFollowing = async () => {
    const next = !isFollowing;
    setIsFollowing(next);
    try { await meydanApi(`/actors/square/${profile.actorId}/follow`, { method: next ? "PUT" : "DELETE" }); } catch { setIsFollowing(!next); }
  };
  const toggleLike = async (narrativeId: string) => {
    const next = !likedNarrativeIds.has(narrativeId);
    setLikedNarrativeIds((current) => { const updated = new Set(current); if (next) updated.add(narrativeId); else updated.delete(narrativeId); return updated; });
    try { await meydanApi(`/narratives/${narrativeId}/like`, { method: next ? "PUT" : "DELETE" }); } catch { setLikedNarrativeIds((current) => { const updated = new Set(current); if (next) updated.delete(narrativeId); else updated.add(narrativeId); return updated; }); }
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
  return { profile, selectedTab, expandedSections, isFollowing, isManagementOpen, likedNarrativeIds, isLoading, isSavingManagement, managementError, toggleSection, toggleFollowing, openManagement: () => setIsManagementOpen(true), closeManagement: () => setIsManagementOpen(false), toggleLike, shareNarrative, saveSquareDetails, saveUserDetails, createSchedule };
}
