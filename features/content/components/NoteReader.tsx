"use client";

import "../reference-notes.css";
import Link from "next/link";
import { Bookmark, Check, Heart, Share2, X } from "lucide-react";
import { useState } from "react";
import { useAuthGate } from "@/components/providers/AuthGateProvider";
import { meydanApi } from "@/lib/meydan-api";
import { VideoPlayer } from "@/features/media/components/VideoPlayer";
import type { ContentDetailItem } from "../types";
import { AudioMediaStage } from "./AudioMediaStage";
import { useViewerStates } from "../hooks/use-viewer-states";
import { NoteMeta, NoteQuote, noteBackground } from "./note-ui";

const fa = new Intl.NumberFormat("fa-IR");

/** A note as the reference's reader: hero, category, title, byline, lead, body, then like / save. */
export function NoteReader({ item }: { item: ContentDetailItem }) {
  const { requireAuth } = useAuthGate();
  const states = useViewerStates([item.apiId]);
  const mine = states[String(item.apiId)];
  const [likedOverride, setLiked] = useState<boolean | null>(null);
  const [savedOverride, setSaved] = useState<boolean | null>(null);
  const [likeDelta, setLikes] = useState(0);
  const liked = likedOverride ?? Boolean(mine?.liked ?? item.viewerState?.liked);
  const saved = savedOverride ?? Boolean(mine?.bookmarked ?? item.viewerState?.bookmarked);
  const likes = Math.max(0, (item.likeCount ?? 0) + likeDelta);
  const [copied, setCopied] = useState(false);
  const [playing, setPlaying] = useState(false);
  const cover = item.media.coverImage;

  async function toggle(kind: "like" | "bookmark") {
    if (!requireAuth(`/content/${item.id}`)) return;
    const turnOn = kind === "like" ? !liked : !saved;
    if (kind === "like") {
      setLiked(turnOn);
      setLikes((value) => value + (turnOn ? 1 : -1));
    } else {
      setSaved(turnOn);
    }
    try {
      await meydanApi(`/content/${item.apiId}/${kind}`, { method: turnOn ? "PUT" : "DELETE" });
    } catch {
      if (kind === "like") {
        setLiked(!turnOn);
        setLikes((value) => value + (turnOn ? -1 : 1));
      } else {
        setSaved(!turnOn);
      }
    }
  }

  async function share() {
    const url = `${window.location.origin}/content/${item.id}`;
    try {
      if (navigator.share) await navigator.share({ title: item.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Cancelled share sheets are not errors.
    }
  }

  const lead = item.subtitle || item.description;

  return (
    <article className="nv-read">
      <div className="nv-rb">
        <Link href="/content?tab=notes" aria-label="بستن"><X aria-hidden="true" width={20} height={20} strokeWidth={2} /></Link>
        <button type="button" onClick={() => void share()} aria-label="اشتراک">
          {copied ? <Check aria-hidden="true" width={18} height={18} /> : <Share2 aria-hidden="true" width={18} height={18} strokeWidth={2} />}
        </button>
      </div>
      {item.media.videoSrc ? (
        <div className="nv-vid">
          <VideoPlayer
            item={{ id: `content:${item.apiId}`, kind: "video", title: item.title, src: item.media.videoSrc, poster: item.media.coverImage, width: item.media.videoWidth, height: item.media.videoHeight }}
            variant="inline"
            className="w-full"
          />
        </div>
      ) : (
        <div className={`nv-hero ${cover ? "" : "ph"}`} style={noteBackground(cover, item.apiId % 8)}>
          {cover ? null : <NoteQuote />}
        </div>
      )}
      <div className="nv-rc">
        {item.categoryName ? <span className="nv-cat">{item.categoryName}</span> : null}
        <h1>{item.title}</h1>
        <NoteMeta author={item.creator.name} avatar={item.creator.avatar} date={item.publishedAt} minutes={item.readingMinutes} />
        {item.media.audioSrc ? <AudioMediaStage item={item} isPlaying={playing} onPlayingChange={setPlaying} /> : null}
        {lead ? <p className="lead">{lead}</p> : null}
        {item.body.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        <div className="nv-act">
          <button type="button" className={liked ? "on" : ""} aria-pressed={liked} onClick={() => void toggle("like")}>
            <Heart aria-hidden="true" width={18} height={18} strokeWidth={2} fill={liked ? "currentColor" : "none"} />
            <span>{fa.format(likes)}</span>
          </button>
          <button type="button" className={saved ? "on" : ""} aria-pressed={saved} onClick={() => void toggle("bookmark")}>
            <Bookmark aria-hidden="true" width={18} height={18} strokeWidth={2} fill={saved ? "currentColor" : "none"} />
            <span>ذخیره</span>
          </button>
        </div>
      </div>
    </article>
  );
}
