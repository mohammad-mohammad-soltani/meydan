"use client";

import "./memorial-profile.css";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight, Atom, BookOpenText, Hourglass, IdCard, Infinity as InfinityIcon, Share2 } from "lucide-react";
import { AccountBadges } from "@/components/shared/AccountBadges";
import { OptimizedAvatar } from "@/components/shared/OptimizedAvatar";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { ProfileActivity } from "../components/ProfileActivity";
import { ProfileImageViewer } from "../components/ProfileImageViewer";
import { shareProfile } from "../components/ProfileActionsMenu";
import { DEATH_LABEL, longDate } from "./dates";
import { MemorialTimeline } from "./MemorialTimeline";
import { useProfile } from "../hooks/useProfile";
import type { ProfileDetails } from "../types";

/**
 * The public page of a یادبود (memorial) account. It shares the data and the
 * follow / narrative behaviour of every profile (`useProfile`), but none of
 * the layout or styling: see `memorial-profile.css`.
 */
export function MemorialProfileView({ initialProfile }: { initialProfile: ProfileDetails }) {
  const profile = useProfile(initialProfile, false);
  const router = useRouter();
  const [notice, setNotice] = useState("");
  const [image, setImage] = useState<{ src: string; name: string; round: boolean } | null>(null);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2400);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const details = profile.profile;
  const { identity, memorial } = details;
  if (!memorial) return null;
  const deathDate = memorial.deathDate ? longDate(memorial.deathDate) : "";

  return (
    <section id="view-memorial-profile" className="memorial-profile min-h-dvh pb-24" aria-label={`یادبود ${identity.name}`}>
      <div className="mx-auto w-full max-w-2xl">
        <header className="memorial-hero">
          <div className="memorial-hero-cover" aria-hidden="true">
            {/* Without a cover of their own, everyone gets the app's default one. */}
            <Image src={identity.cover || "/images/header.jpg"} alt="" fill priority sizes="(max-width: 720px) 100vw, 640px" />
          </div>
          <div className="memorial-hero-bar">
            <button type="button" aria-label="بازگشت" onClick={() => history.back()}><ArrowRight className="h-5 w-5" /></button>
            {memorial.office ? <span className="memorial-office-chip"><Atom aria-hidden="true" />{memorial.office}</span> : null}
          </div>

          <div className="memorial-id-row">
            <div className="memorial-portrait">
              {identity.avatar ? (
                <button type="button" aria-label="مشاهده تصویر" onClick={() => setImage({ src: identity.avatar!, name: identity.name, round: false })}>
                  <OptimizedAvatar src={identity.avatar} alt={identity.name} width={96} className="h-full w-full object-cover" />
                </button>
              ) : <span>{identity.name.slice(0, 1)}</span>}
              <i className="memorial-eternal" aria-hidden="true"><InfinityIcon /></i>
            </div>
            <div className="memorial-actions">
            <button type="button" aria-label="اشتراک‌گذاری یادبود" className="memorial-share" onClick={() => void shareProfile(details, setNotice)}><Share2 aria-hidden="true" /></button>
            {/* Opens the «ادای احترام» composer addressed to this memorial; signing in is asked there. */}
            <button type="button" className="memorial-respect" onClick={() => router.push(`/compose?tribute=${details.actorId}` as Route)}>
              ادای احترام
            </button>
            </div>
          </div>

          <div className="memorial-head">
            <h1 className="memorial-name">
              <span>{identity.name}</span>
              <span className="badge"><AccountBadges verified={identity.verified} kind="memorial" size="lg" /></span>
              {identity.handle ? <span className="memorial-handle latin-digits" dir="ltr">@{identity.handle}</span> : null}
            </h1>
            {memorial.tagline ? <p className="memorial-tagline">{memorial.tagline}</p> : null}
            {deathDate || memorial.position ? (
              <p className="memorial-facts">
                {deathDate ? <span><Hourglass aria-hidden="true" />{DEATH_LABEL}: {deathDate}</span> : null}
                {memorial.position ? <span><IdCard aria-hidden="true" />{memorial.position}</span> : null}
              </p>
            ) : null}
          </div>
        </header>

        {memorial.biography ? (
          <section className="memorial-section" aria-labelledby="memorial-bio">
            <h2 id="memorial-bio"><BookOpenText aria-hidden="true" />درباره زندگی و ماموریت علمی</h2>
            <p className="memorial-bio">{memorial.biography}</p>
          </section>
        ) : null}

        <MemorialTimeline events={memorial.timeline} />

        {memorial.frames.length ? (
          <section className="memorial-section" aria-labelledby="memorial-frames">
            <h2 id="memorial-frames">قاب‌های ماندگار</h2>
            <div className="memorial-frames">
              {memorial.frames.map((frame) => (
                <button key={frame.id} type="button" className="memorial-frame" onClick={() => setImage({ src: frame.url, name: frame.caption || identity.name, round: false })}>
                  <Image src={frame.url} alt={frame.caption || frame.label || identity.name} fill sizes="(max-width: 640px) 45vw, 300px" />
                  {frame.caption ? <span>{frame.caption}</span> : null}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <section className="memorial-memories memorial-section" aria-labelledby="memorial-memories">
          <h2 id="memorial-memories">یادها و روایت‌ها</h2>
        </section>
        <ProfileActivity tabIds={["posts", "media"]} emptyPostsLabel="هنوز ادای احترامی ثبت نشده" actorType="memorial" actorId={details.actorId} postCount={details.narrativeCount} pinnedPost={profile.pinnedPost} posts={profile.narrativePosts} latestPageStart={profile.latestNarrativePageStart} replies={details.replies} likedPostIds={profile.likedNarrativeIds} repostedPostIds={profile.repostedNarrativeIds} onLike={(postId) => void profile.toggleLike(postId)} onRepost={(postId) => void profile.toggleRepost(postId)} onShare={(post) => void profile.shareNarrative(post)} onDelete={() => undefined} hasMore={profile.nextNarrativeCursor !== null} isLoadingMore={profile.isLoadingMore} initialLoading={!profile.initialNarrativesLoaded} loadMoreFailed={profile.loadMoreFailed} onLoadMore={() => void profile.loadMore()} />
      </div>

      <p role="status" aria-live="polite" className={`fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 z-[60] -translate-x-1/2 rounded-full bg-solid-dark px-4 py-2.5 text-center text-xs font-bold text-on-solid shadow-dialog transition lg:bottom-5 ${notice ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        {notice || "انجام شد"}
      </p>
      {image ? <ProfileImageViewer src={image.src} name={image.name} round={image.round} onClose={() => setImage(null)} /> : null}
    </section>
  );
}
