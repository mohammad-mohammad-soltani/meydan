"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  Globe2,
  ImagePlus,
  ListChecks,
  MapPin,
  Smile,
  X,
} from "lucide-react";
import type { FeedPost } from "@/features/feed/types";

const MAX_CHARACTERS = 280;
const DRAFT_KEY = "meydan-compose-draft";
const LOCAL_POSTS_KEY = "meydan-local-narratives";

function loadLocalPosts(): FeedPost[] {
  try {
    const stored = window.localStorage.getItem(LOCAL_POSTS_KEY);
    return stored ? (JSON.parse(stored) as FeedPost[]) : [];
  } catch {
    return [];
  }
}

export function ComposeView() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    const draft = window.localStorage.getItem(DRAFT_KEY) ?? "";
    setText(draft);
    const frame = window.requestAnimationFrame(() => textareaRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (text) window.localStorage.setItem(DRAFT_KEY, text);
    else window.localStorage.removeItem(DRAFT_KEY);
  }, [text]);

  const remaining = MAX_CHARACTERS - text.length;
  const canPublish = text.trim().length > 0 && remaining >= 0 && !isPublishing;
  const progress = useMemo(() => Math.min(text.length / MAX_CHARACTERS, 1), [text.length]);
  const circumference = 2 * Math.PI * 9;
  const dashOffset = circumference * (1 - progress);

  const closeComposer = () => {
    if (window.history.length > 1) router.back();
    else router.push("/home");
  };

  const publish = () => {
    if (!canPublish) return;
    setIsPublishing(true);

    const trimmed = text.trim();
    const firstLine = trimmed.split("\n")[0] ?? trimmed;
    const post: FeedPost = {
      id: `local-${Date.now()}`,
      kind: "ideas",
      squareName: "روایت شما",
      handle: "@you",
      timeAgo: "همین حالا",
      city: "ایران",
      badge: "روایت تازه",
      title: firstLine.length > 64 ? `${firstLine.slice(0, 64)}…` : firstLine,
      body: trimmed,
      attachments: attachment
        ? [{
            id: `attachment-${Date.now()}`,
            label: attachment.name,
            detail: attachment.type.startsWith("video/") ? "ویدئوی پیوست" : "تصویر پیوست",
            icon: attachment.type.startsWith("video/") ? "video" : "image",
          }]
        : [],
      stats: { likes: 0, comments: 0, reposts: 0 },
    };

    const existing = loadLocalPosts();
    window.localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify([post, ...existing].slice(0, 20)));
    window.localStorage.removeItem(DRAFT_KEY);
    setText("");
    setAttachment(null);
    router.push("/home");
  };

  return (
    <section className="flex min-h-full flex-1 flex-col bg-background text-foreground" aria-label="نوشتن روایت تازه">
      <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between border-b border-divider bg-surface-glass px-3 backdrop-blur-md">
        <button
          type="button"
          onClick={closeComposer}
          aria-label="بستن و بازگشت"
          className="grid h-10 w-10 place-items-center rounded-full text-icon transition-colors hover:bg-hover hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={publish}
          disabled={!canPublish}
          className="rounded-pill bg-brand px-4 py-2 text-xs font-black text-brand-foreground transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground"
        >
          {isPublishing ? "در حال انتشار…" : "انتشار"}
        </button>
      </header>

      <div className="flex flex-1 flex-col px-4 pb-3 pt-4">
        <div className="mb-3 flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-sm font-black text-brand-foreground">م</span>
          <button type="button" className="inline-flex min-h-8 items-center gap-1.5 rounded-pill border border-brand-border px-3 text-[11px] font-bold text-brand transition-colors hover:bg-brand-muted">
            <Globe2 className="h-3.5 w-3.5" />
            همه
          </button>
        </div>

        <textarea
          ref={textareaRef}
          autoFocus
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={MAX_CHARACTERS + 40}
          placeholder="چه روایتی برای گفتن داری؟"
          aria-label="متن روایت"
          className="min-h-48 w-full flex-1 resize-none bg-transparent text-[19px] leading-8 text-foreground outline-none placeholder:text-placeholder focus-visible:outline-none"
        />

        {attachment ? (
          <div className="ui-enter mt-4 flex items-center justify-between gap-3 rounded-card border border-border bg-surface-muted p-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-foreground">{attachment.name}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{attachment.type.startsWith("video/") ? "ویدئو آماده پیوست است" : "تصویر آماده پیوست است"}</p>
            </div>
            <button type="button" onClick={() => setAttachment(null)} aria-label="حذف فایل پیوست" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-icon-muted hover:bg-hover hover:text-danger"><X className="h-4 w-4" /></button>
          </div>
        ) : null}

        <button type="button" className="mt-4 inline-flex w-fit items-center gap-2 rounded-pill px-2 py-1.5 text-xs font-bold text-brand transition-colors hover:bg-brand-muted">
          <Globe2 className="h-4 w-4" />
          همه می‌توانند پاسخ دهند
        </button>
      </div>

      <div className="sticky bottom-0 z-20 border-t border-divider bg-surface-glass px-3 py-2.5 pb-[max(.75rem,env(safe-area-inset-bottom))] backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-0.5 text-brand">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(event) => setAttachment(event.target.files?.[0] ?? null)}
            />
            <button type="button" onClick={() => fileInputRef.current?.click()} aria-label="افزودن تصویر یا ویدئو" className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-brand-muted"><ImagePlus className="h-[19px] w-[19px]" /></button>
            <button type="button" aria-label="افزودن نظرسنجی" className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-brand-muted"><ListChecks className="h-[19px] w-[19px]" /></button>
            <button type="button" aria-label="افزودن ایموجی" className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-brand-muted"><Smile className="h-[19px] w-[19px]" /></button>
            <button type="button" aria-label="افزودن زمان‌بندی" className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-brand-muted"><CalendarClock className="h-[19px] w-[19px]" /></button>
            <button type="button" aria-label="افزودن موقعیت" className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-brand-muted"><MapPin className="h-[19px] w-[19px]" /></button>
          </div>

          {text.length > 0 ? (
            <div className={`flex items-center gap-2 text-[11px] font-bold ${remaining < 0 ? "text-danger" : remaining <= 20 ? "text-warning" : "text-muted-foreground"}`}>
              {remaining <= 20 ? <span>{remaining}</span> : null}
              <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" className="-rotate-90">
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-20" />
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset} />
              </svg>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
