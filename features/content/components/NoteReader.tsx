"use client";

import Link from "next/link";
import { ArrowRight, Bookmark, Check, Clock, Heart, Share2 } from "lucide-react";
import { useState } from "react";
import { useAuthGate } from "@/components/providers/AuthGateProvider";
import { meydanApi } from "@/lib/meydan-api";
import { hueOf } from "@/lib/relative-fa";
import type { ContentDetailItem } from "../types";

const fa = new Intl.NumberFormat("fa-IR");

/** A note (یادداشت) as an article: hero, category, title, byline, lead, body, then like / save. */
export function NoteReader({ item }: { item: ContentDetailItem }) {
  const { requireAuth } = useAuthGate();
  const [liked, setLiked] = useState(Boolean(item.viewerState?.liked));
  const [likes, setLikes] = useState(item.likeCount ?? 0);
  const [saved, setSaved] = useState(Boolean(item.viewerState?.bookmarked));
  const [copied, setCopied] = useState(false);
  const cover = item.media.coverImage;

  async function toggle(kind: "like" | "bookmark") {
    if (!requireAuth(`/content/${item.id}`)) return;
    const turnOn = kind === "like" ? !liked : !saved;
    if (kind === "like") {
      setLiked(turnOn);
      setLikes((value) => Math.max(0, value + (turnOn ? 1 : -1)));
    } else {
      setSaved(turnOn);
    }
    try {
      await meydanApi(`/content/${item.apiId}/${kind}`, { method: turnOn ? "PUT" : "DELETE" });
    } catch {
      if (kind === "like") {
        setLiked(!turnOn);
        setLikes((value) => Math.max(0, value + (turnOn ? -1 : 1)));
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

  return (
    <article className="min-h-full pb-24" dir="rtl">
      <div
        className="relative h-56 w-full"
        style={{ background: cover ? `linear-gradient(180deg,rgba(0,0,0,.25),rgba(0,0,0,.05) 45%,var(--background)), url(${cover}) center/cover` : `linear-gradient(145deg,hsl(${hueOf(item.title)} 55% 36%),hsl(${(hueOf(item.title) + 50) % 360} 50% 18%))` }}
      >
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
          <Link href="/content?tab=notes" aria-label="بازگشت" className="grid h-10 w-10 place-items-center rounded-full bg-black/45 text-white backdrop-blur"><ArrowRight aria-hidden="true" className="h-5 w-5" /></Link>
          <button type="button" onClick={() => void share()} aria-label="اشتراک" className="grid h-10 w-10 place-items-center rounded-full bg-black/45 text-white backdrop-blur">
            {copied ? <Check aria-hidden="true" className="h-[18px] w-[18px]" /> : <Share2 aria-hidden="true" className="h-[18px] w-[18px]" />}
          </button>
        </div>
      </div>

      <div className="-mt-6 px-5">
        {item.categoryName ? <span className="inline-block rounded-full bg-surface-muted px-3 py-1 text-[11px] font-bold text-foreground-secondary">{item.categoryName}</span> : null}
        <h1 className="mt-3 text-2xl font-black leading-[2.4rem] text-foreground">{item.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-bold text-foreground-secondary">{item.creator.name}</span>
          <span aria-hidden="true">·</span>
          <span>{item.publishedAt}</span>
          {item.readingMinutes ? (<><span aria-hidden="true">·</span><span className="inline-flex items-center gap-1"><Clock aria-hidden="true" className="h-3.5 w-3.5" />{fa.format(item.readingMinutes)} دقیقه</span></>) : null}
        </div>
        {item.subtitle || item.description ? <p className="mt-5 text-[15px] font-bold leading-8 text-foreground">{item.subtitle || item.description}</p> : null}
        <div className="mt-4 space-y-4 text-[15px] leading-9 text-foreground-secondary">
          {item.body.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </div>

        <div className="mt-8 flex gap-2.5 border-t border-divider pt-5">
          <button type="button" aria-pressed={liked} onClick={() => void toggle("like")} className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl border text-sm font-black transition-colors ${liked ? "border-brand/40 bg-brand-muted text-brand" : "border-border bg-surface-muted text-foreground"}`}>
            <Heart aria-hidden="true" className={`h-[18px] w-[18px] ${liked ? "fill-current" : ""}`} />{fa.format(likes)}
          </button>
          <button type="button" aria-pressed={saved} onClick={() => void toggle("bookmark")} className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl border text-sm font-black transition-colors ${saved ? "border-brand/40 bg-brand-muted text-brand" : "border-border bg-surface-muted text-foreground"}`}>
            <Bookmark aria-hidden="true" className={`h-[18px] w-[18px] ${saved ? "fill-current" : ""}`} />ذخیره
          </button>
        </div>
      </div>
    </article>
  );
}
