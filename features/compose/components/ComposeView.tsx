"use client";

import styles from "../reference.module.css";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type TouchEvent } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Hash, Image as ImageIcon, LoaderCircle, PenLine, Plus, Save, Send, Smile, Sparkles, Trash2, UploadCloud, Video, Volume2, X } from "lucide-react";
import { OptimizedAvatar } from "@/components/shared/OptimizedAvatar";
import { MeydanApiError, meydanApi } from "@/lib/meydan-api";
import { getMe } from "@/lib/me-client";
import { QuotedPostCard } from "@/features/feed/components/QuotedPostCard";
import { mapQuotedNarrative, type ApiQuotedNarrative } from "@/features/feed/services/quote-mapper";
import type { QuotedPost } from "@/features/feed/types";
import { ComposeMediaGrid } from "./ComposeMediaGrid";
import { MAX_COMPOSE_MEDIA, useComposeMedia } from "../hooks/useComposeMedia";
import { getCaretCoordinates } from "../caret";
import { getHashtagSuggestions, type HashtagSuggestion } from "@/features/explore/hashtags";

const MAX_CHARACTERS = 500;
const BASE_DRAFT_KEY = "meydan-compose-draft";
/** One picker for everything; the composer sorts the files by type. */
const MEDIA_ACCEPT = "image/*,video/*,audio/*";

type HashtagToken = { start: number; query: string };

/**
 * The `#` token the caret currently sits inside, if any: a `#` that starts
 * the text or follows whitespace/punctuation, with only tag characters
 * between it and the caret. Mirrors the hashtag pattern posts are linkified
 * with, so what autocompletes here is exactly what turns red later.
 */
function activeHashtagToken(text: string, caret: number): HashtagToken | null {
  const before = text.slice(0, caret);
  const match = before.match(/(?:^|[\s،؛.,!?؟()[\]{}])#([\p{L}\p{N}_]{0,64})$/u);
  if (!match) return null;
  const query = match[1];
  return { start: caret - query.length - 1, query };
}

const HASHTAG_PATTERN = /(^|[\s،؛.,!?؟()[\]{}])(#[\p{L}\p{N}_]{0,64})/gu;

/** The textarea's text with every `#tag` (even a bare `#` just typed) in red; mirrored under the transparent textarea. */
function renderHighlighted(text: string) {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(HASHTAG_PATTERN)) {
    const tagStart = (match.index ?? 0) + match[1].length;
    if (tagStart > last) nodes.push(text.slice(last, tagStart));
    nodes.push(<span key={tagStart} className="text-danger">{match[2]}</span>);
    last = tagStart + match[2].length;
  }
  nodes.push(text.slice(last));
  // A trailing newline would otherwise collapse and misalign the last line.
  return [...nodes, "\u200b"];
}

type ViewerState = {
  /** `speaker` publishes as the user account behind it. */
  accountType: "user" | "square" | "media" | "collective" | "organization" | "speaker" | "official" | "";
  /** Set for an approved media account (رسانه), which can file quotes as media reflections. */
  mediaOutletId?: number | null;
  avatarUrl?: string;
};

type ComposeDraft = {
  title: string;
  text: string;
  isEcho: boolean;
};

type QuoteState =
  | { status: "none" }
  | { status: "loading" }
  | { status: "ready"; post: QuotedPost }
  | { status: "failed" };

/** `quoteId` is the narrative being quoted (`/compose?quote=ID`). */
export function ComposeView({ quoteId, workMode = false, initialTag }: { quoteId?: string; workMode?: boolean; initialTag?: string }) {
  const router = useRouter();
  // A quote keeps its own draft so it never overwrites the plain-narrative one.
  const DRAFT_KEY = quoteId ? `${BASE_DRAFT_KEY}:quote:${quoteId}` : BASE_DRAFT_KEY;
  const [quote, setQuote] = useState<QuoteState>(quoteId ? { status: "loading" } : { status: "none" });
  const titleRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [isEcho, setIsEcho] = useState(workMode);
  const [exitOpen, setExitOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [viewer, setViewer] = useState<ViewerState>({ accountType: "" });
  const [fileAsReflection, setFileAsReflection] = useState(true);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [pickerAccept, setPickerAccept] = useState(MEDIA_ACCEPT);
  const [hashtagToken, setHashtagToken] = useState<HashtagToken | null>(null);
  const [hashtagSuggestions, setHashtagSuggestions] = useState<HashtagSuggestion[]>([]);
  const [hashtagActive, setHashtagActive] = useState(0);
  const [hashtagPos, setHashtagPos] = useState<{ top: number; left: number } | null>(null);

  const { media, notice, addFiles, remove, retry, reset, isUploading, hasUploadError, readyAttachments, isReady } =
    useComposeMedia();

  useEffect(() => {
    let active = true;
    const stored = window.localStorage.getItem(DRAFT_KEY);
    queueMicrotask(() => {
      if (!active) return;
      if (stored) {
        try {
          const draft = JSON.parse(stored) as Partial<ComposeDraft>;
          if (typeof draft.title === "string") {
            setTitle(draft.title);
            if (draft.title) setShowTitle(true);
          }
          if (typeof draft.text === "string") setText(draft.text);
          if (typeof draft.isEcho === "boolean") setIsEcho(workMode || draft.isEcho);
        } catch {
          setText(stored);
        }
      }
      if (initialTag && !quoteId) {
        // Arrived from a tag page: make sure «#tag » is in the text, after any saved draft.
        const hashtag = `#${initialTag}`;
        setText((current) =>
          new RegExp(`${hashtag}(?![\\p{L}\\p{N}_])`, "u").test(current)
            ? current
            : `${current}${current && !/\s$/.test(current) ? " " : ""}${hashtag} `,
        );
      }
      setDraftLoaded(true);
    });
    const frame = window.requestAnimationFrame(() => {
      const area = textRef.current;
      if (!area) return;
      area.focus();
      area.setSelectionRange(area.value.length, area.value.length);
    });
    return () => { active = false; window.cancelAnimationFrame(frame); };
  }, [workMode, DRAFT_KEY, quoteId, initialTag]);

  useEffect(() => {
    if (!draftLoaded) return;
    const hasDraft = (!quoteId && title.trim().length > 0) || text.trim().length > 0 || isEcho;
    if (hasDraft) {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, text, isEcho } satisfies ComposeDraft));
    } else {
      window.localStorage.removeItem(DRAFT_KEY);
    }
  }, [DRAFT_KEY, draftLoaded, quoteId, title, text, isEcho]);

  useEffect(() => {
    if (!quoteId) return;
    let active = true;
    void meydanApi<ApiQuotedNarrative>(`/narratives/${quoteId}`)
      .then((item) => {
        const post = mapQuotedNarrative(item);
        if (active) setQuote(post && !post.unavailable ? { status: "ready", post } : { status: "failed" });
      })
      .catch(() => {
        if (active) setQuote({ status: "failed" });
      });
    return () => { active = false; };
  }, [quoteId]);

  useEffect(() => {
    void getMe<{ account_type: "user" | "square" | "media" | "collective" | "organization" | "speaker" | "official"; media_outlet_id?: number | null; profile?: { avatar_url?: string }; entity?: { avatar_url?: string } | null }>()
      .then((me) => {
        setViewer({ accountType: me.account_type, mediaOutletId: me.media_outlet_id ?? null, avatarUrl: (me.entity ?? me.profile)?.avatar_url || undefined });
      })
      .catch(() => undefined);
  }, []);

  // Debounced «#» autocomplete: refetches as the token under the caret changes.
  const hashtagQuery = hashtagToken?.query;
  useEffect(() => {
    if (hashtagQuery === undefined) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void getHashtagSuggestions(hashtagQuery, controller.signal)
        .then(setHashtagSuggestions)
        .catch(() => undefined);
    }, 200);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [hashtagQuery]);

  // What the popover shows: the last answer narrowed to the current query right
  // away (so it tracks every keystroke instead of lagging a request behind),
  // best match first — exact, then shortest, then busiest.
  const hashtagOptions = useMemo(() => {
    if (!hashtagToken) return [];
    const query = hashtagToken.query;
    return hashtagSuggestions
      .filter((item) => item.tag.startsWith(query) && item.tag !== query)
      .sort((a, b) => a.tag.length - b.tag.length || b.count - a.count)
      .slice(0, 5);
  }, [hashtagToken, hashtagSuggestions]);

  // Keep the popover glued to the caret, like X's mention picker.
  useLayoutEffect(() => {
    const area = textRef.current;
    if (!hashtagToken || !area || !hashtagOptions.length) {
      setHashtagPos(null);
      return;
    }
    const caret = getCaretCoordinates(area, hashtagToken.start + hashtagToken.query.length + 1);
    const maxLeft = Math.max(0, area.offsetWidth - 240);
    setHashtagPos({
      top: area.offsetTop + caret.top + caret.height + 4,
      left: Math.min(Math.max(0, area.offsetLeft + caret.left - 8), maxLeft),
    });
  }, [hashtagToken, hashtagOptions.length, text]);

  useEffect(() => setHashtagActive(0), [hashtagQuery]);

  const body = quoteId ? text.trim() : [title.trim(), text.trim()].filter(Boolean).join("\n\n");
  const hasContent = body.length > 0 || media.length > 0;
  const atCapacity = media.length >= MAX_COMPOSE_MEDIA;
  const quoteReady = !quoteId || quote.status === "ready";
  // Swiping the page pulls the روایت / کار indicator along with the finger and switches on release.
  const typesRef = useRef<HTMLDivElement>(null);
  const swipe = useRef<{ x: number; y: number; t: number; lastX: number; lastT: number; v: number; axis: "?" | "x" | "y"; width: number } | null>(null);
  const indicatorShift = (index: number) => `translateX(calc(${index} * (-100% - var(--gap))))`;
  const onSwipeStart = (event: TouchEvent) => {
    const { clientX: x, clientY: y } = event.touches[0];
    const box = event.currentTarget.getBoundingClientRect();
    swipe.current = { x, y, t: Date.now(), lastX: x, lastT: Date.now(), v: 0, axis: "?", width: box.width };
  };
  const onSwipeMove = (event: TouchEvent) => {
    const g = swipe.current;
    const indicator = typesRef.current?.querySelector<HTMLElement>("[data-indicator]");
    if (!g || g.axis === "y" || quoteId) return;
    const { clientX, clientY } = event.touches[0];
    const dx = clientX - g.x;
    const dy = clientY - g.y;
    if (g.axis === "?") {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      g.axis = Math.abs(dx) > Math.abs(dy) * 1.2 ? "x" : "y";
      if (g.axis === "y") return;
      if (indicator) indicator.style.transition = "none";
    }
    const now = Date.now();
    if (now - g.lastT >= 8) {
      g.v = (clientX - g.lastX) / (now - g.lastT);
      g.lastX = clientX;
      g.lastT = now;
    }
    // The finger moves the content right to reach کار (the tab on the left), so progress follows dx.
    const index = isEcho ? 1 : 0;
    const progress = Math.min(1, Math.max(0, index + dx / g.width));
    if (indicator) indicator.style.transform = `translateX(calc(${progress} * (-100% - var(--gap))))`;
  };
  const onSwipeEnd = (event: TouchEvent) => {
    const g = swipe.current;
    swipe.current = null;
    const indicator = typesRef.current?.querySelector<HTMLElement>("[data-indicator]");
    if (!g || g.axis !== "x" || quoteId) return;
    const dx = event.changedTouches[0].clientX - g.x;
    if (indicator) {
      indicator.style.transition = "";
      indicator.style.transform = "";
    }
    const wantsEcho = dx > 0;
    if (wantsEcho === isEcho) return;
    if (Math.abs(dx) > g.width * 0.22 || Math.abs(g.v) > 0.45) setIsEcho(wantsEcho);
  };

  // Regular accounts only file a روایت or a کار; the campaign tabs belong to institutional accounts.
  const showCampaignTabs = !["user", "speaker", "official", ""].includes(viewer.accountType);
  const canPublish =
    quoteReady && hasContent && text.length <= MAX_CHARACTERS && !isPublishing && !isUploading && !hasUploadError && isReady;

  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.push("/home");
  };

  const requestClose = () => {
    if (hasContent) setExitOpen(true);
    else goBack();
  };

  const discardAndExit = () => {
    window.localStorage.removeItem(DRAFT_KEY);
    setTitle("");
    setText("");
    setIsEcho(false);
    reset();
    goBack();
  };

  const openPicker = (accept = MEDIA_ACCEPT) => {
    const input = fileInputRef.current;
    if (!input) return;
    setPickerAccept(accept);
    input.accept = accept;
    input.value = "";
    input.click();
  };

  /** Inserts at the caret, so hashtag and emoji buttons write where the user is typing. */
  const insertText = (value: string) => {
    const area = textRef.current;
    const start = area?.selectionStart ?? text.length;
    const end = area?.selectionEnd ?? text.length;
    const next = (text.slice(0, start) + value + text.slice(end)).slice(0, MAX_CHARACTERS);
    setText(next);
    window.requestAnimationFrame(() => {
      area?.focus();
      area?.setSelectionRange(start + value.length, start + value.length);
    });
  };

  /** Re-reads the `#` token under the caret after every keystroke or click. */
  const syncHashtagToken = () => {
    const area = textRef.current;
    if (!area) return;
    updateHashtagToken(activeHashtagToken(area.value, area.selectionStart ?? area.value.length));
  };

  /** Keeps the same object when nothing changed, so a bare arrow-key keyup doesn't restart the fetch. */
  const updateHashtagToken = (next: HashtagToken | null) =>
    setHashtagToken((prev) => (prev && next && prev.start === next.start && prev.query === next.query ? prev : next));

  /** Replaces the active `#` token with the picked tag and a trailing space. */
  const applyHashtagSuggestion = (tag: string) => {
    const area = textRef.current;
    if (!hashtagToken || !area) return;
    const end = area.selectionStart ?? hashtagToken.start + hashtagToken.query.length + 1;
    const insertion = `#${tag.replace(/\s+/g, "_")} `;
    const next = (text.slice(0, hashtagToken.start) + insertion + text.slice(end)).slice(0, MAX_CHARACTERS);
    setText(next);
    setHashtagToken(null);
    const caret = hashtagToken.start + insertion.length;
    window.requestAnimationFrame(() => {
      area.focus();
      area.setSelectionRange(caret, caret);
    });
  };

  const publish = async () => {
    if (!canPublish) return;
    setIsPublishing(true);
    setPublishError("");
    try {
      const created = await meydanApi<{ id?: number; initiative?: { work_id?: string | null } | null }>("/narratives", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
        body: JSON.stringify({
          body,
          is_echo: isEcho,
          attachments: readyAttachments,
          ...(quoteId ? { quoted_narrative_id: Number(quoteId) } : {}),
          ...(quoteId && viewer.mediaOutletId ? { media_reflection: fileAsReflection } : {}),
        }),
      });
      window.localStorage.removeItem(DRAFT_KEY);
      setTitle("");
      setText("");
      setIsEcho(false);
      reset();
      // «کار جدید» lands in the freshly created work room; everything else keeps its old destination.
      const workId = workMode ? created?.initiative?.work_id : null;
      router.push(workId ? `/chat/work/${workId}` : quoteId && created?.id ? `/posts/${created.id}` : "/home");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof MeydanApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "خطای ناشناخته در انتشار روایت.";
      setPublishError(`انتشار انجام نشد: ${message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <section
      dir="rtl"
      aria-label={quoteId ? "نقل‌قول روایت" : "ثبت روایت یا ایده جدید"}
      className={`${styles.composer} relative flex flex-1 flex-col text-foreground`}
      onDragEnter={(event) => {
        if (event.dataTransfer?.types?.includes("Files")) setDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (event.dataTransfer?.files?.length) addFiles(event.dataTransfer.files);
      }}
    >
      <div className={`${styles.header} z-20 flex items-center justify-between gap-3 border-b`}>
        <button type="button" onClick={requestClose} className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground transition-colors hover:text-foreground-secondary">
          <X aria-hidden="true" className="h-5 w-5" />
          انصراف
        </button>
        <h1 className="sr-only">{quoteId ? "نقل‌قول روایت" : "ثبت روایت یا ایده جدید"}</h1>
        <div className="flex items-center gap-2">
          {/* The draft is saved automatically on this device; this keeps it and leaves. */}
          <button type="button" onClick={goBack} disabled={!hasContent} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-muted px-3.5 py-2 text-xs font-bold text-foreground-secondary transition-colors hover:text-foreground disabled:opacity-50">
            <Bookmark aria-hidden="true" className="h-3.5 w-3.5" />
            <span className={styles.draftLabel}>پیش‌نویس</span>
          </button>
          <button
            type="button"
            onClick={() => void publish()}
            disabled={!canPublish}
            aria-label={viewer.accountType === "square" ? "انتشار به نام میدان" : viewer.accountType === "media" ? "انتشار به نام رسانه" : viewer.accountType === "collective" ? "انتشار به نام مجموعه" : viewer.accountType === "organization" ? "انتشار به نام سازمان" : quoteId ? "انتشار نقل‌قول" : "انتشار"}
            className="rounded-full bg-emphasis px-5 py-2 text-xs font-black text-emphasis-foreground transition-[transform,opacity] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPublishing ? "در حال انتشار…" : isUploading ? "در حال بارگذاری…" : "انتشار"}
          </button>
        </div>
      </div>

      <div className={`${styles.body} flex flex-col`} onTouchStart={onSwipeStart} onTouchMove={onSwipeMove} onTouchEnd={onSwipeEnd} onTouchCancel={onSwipeEnd}>
        {!quoteId ? <div ref={typesRef} role="tablist" aria-label="نوع روایت" style={{ "--n": showCampaignTabs ? 4 : 2 } as React.CSSProperties} className={`${styles.types} ${showCampaignTabs ? "" : styles.typesTwo} grid gap-1 border`}>
          <i data-indicator aria-hidden="true" className={styles.indicator} style={{ transform: indicatorShift(isEcho ? 1 : 0) }} />
          {([[false, "روایت", PenLine], [true, "کار", Sparkles]] as const).map(([echo, label, Icon]) => (
            <button key={label} type="button" role="tab" aria-selected={isEcho === echo} onClick={() => setIsEcho(echo)} className={`inline-flex items-center justify-center gap-1.5 rounded-[14px] px-2 py-2.5 text-xs font-bold transition-colors ${isEcho === echo ? "text-emphasis-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {Icon ? <Icon aria-hidden="true" className="h-4 w-4" /> : null}
              {label}
            </button>
          ))}
          {/* In the reference; publishing a پویش from here has no backend yet. */}
          {(showCampaignTabs ? [["پویش", Send], ["پوشش رسانه‌ای", Video]] as const : []).map(([label, Icon]) => (
            <span key={label} role="tab" aria-selected="false" aria-disabled="true" title="به‌زودی" className="inline-flex cursor-default items-center justify-center gap-1.5 whitespace-nowrap rounded-[14px] px-1 py-2.5 text-xs font-bold text-muted-foreground">
              <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
              {label}
            </span>
          ))}
        </div> : null}

        <div className={`${styles.author} mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2`}>
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <span className={`${styles.avatar} grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full text-sm font-extrabold`}>
              {viewer.avatarUrl ? <OptimizedAvatar src={viewer.avatarUrl} alt="" width={44} className="h-full w-full object-cover" /> : "من"}
            </span>
            <span className="min-w-0">
              <strong className="block truncate text-xs font-black text-foreground">{quoteId ? "نقل‌قول روایت" : isEcho ? "ثبت کار یا ایده" : "ارسال مطلب جدید"}</strong>
              <span className="block truncate text-[10px] text-muted-foreground">انتشار در شبکه مردمی</span>
            </span>
          </div>
          {!quoteId && !showTitle ? (
            <button type="button" onClick={() => { setShowTitle(true); window.setTimeout(() => titleRef.current?.focus({ preventScroll: true }), 120); }} className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-surface-muted px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-hover">
              <Plus aria-hidden="true" className="h-3.5 w-3.5" />
              افزودن عنوان (اختیاری)
            </button>
          ) : null}
        </div>

        <div className="relative pt-3">
          {!quoteId ? (
            <div className={`${styles.titleWrap} ${showTitle ? styles.titleOpen : ""}`} aria-hidden={!showTitle}>
              <div className={styles.titleInner}>
                <input ref={titleRef} type="text" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} placeholder="عنوان (اختیاری)" aria-label="تیتر روایت" tabIndex={showTitle ? 0 : -1} className={`${styles.title} w-full text-foreground shadow-none outline-none ring-0 placeholder:text-placeholder focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0`} />
              </div>
            </div>
          ) : null}
          <div className="relative">
          <div
            aria-hidden="true"
            className={`${styles.textarea} pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words text-foreground`}
          >
            <div ref={highlightRef}>{renderHighlighted(text)}</div>
          </div>
          <textarea
            ref={textRef}
            onScroll={(event) => {
              if (highlightRef.current) highlightRef.current.style.transform = `translateY(${-event.currentTarget.scrollTop}px)`;
            }}
            style={{ color: "transparent", caretColor: "var(--m-tx, currentColor)", scrollbarWidth: "none" }}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              updateHashtagToken(activeHashtagToken(event.target.value, event.target.selectionStart ?? event.target.value.length));
            }}
            onKeyDown={(event) => {
              if (!hashtagToken || !hashtagOptions.length || event.nativeEvent.isComposing) return;
              const count = hashtagOptions.length;
              if (event.key === "ArrowDown") { event.preventDefault(); setHashtagActive((i) => (i + 1) % count); }
              else if (event.key === "ArrowUp") { event.preventDefault(); setHashtagActive((i) => (i - 1 + count) % count); }
              else if (event.key === "Tab" || event.key === "Enter") { event.preventDefault(); applyHashtagSuggestion(hashtagOptions[hashtagActive]?.tag ?? hashtagOptions[0].tag); }
              else if (event.key === "Escape") { event.preventDefault(); setHashtagToken(null); }
            }}
            onClick={syncHashtagToken}
            onKeyUp={(event) => {
              if (event.key === "Escape" || event.key === "Tab" || event.key === "Enter") return;
              syncHashtagToken();
            }}
            onBlur={() => window.setTimeout(() => setHashtagToken(null), 120)}
            onPaste={(event) => {
              const files = Array.from(event.clipboardData?.files ?? []);
              if (!files.length) return;
              event.preventDefault();
              addFiles(files);
            }}
            maxLength={MAX_CHARACTERS}
            placeholder={quoteId ? "نظر خودت را دربارهٔ این روایت بنویس..." : "چه خبر؟ ماجرا یا شرح حال را بنویسید..."}
            rows={7}
            aria-label="شرح روایت"
            className={`${styles.textarea} relative w-full resize-none border-0 bg-transparent text-foreground shadow-none outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0`}
          />
          {hashtagToken && hashtagOptions.length && hashtagPos ? (
            <div
              role="listbox"
              aria-label="پیشنهاد هشتگ"
              style={{ top: hashtagPos.top, left: hashtagPos.left }}
              className="absolute z-30 w-60 max-w-full overflow-hidden rounded-2xl border border-border bg-surface py-1 shadow-dialog"
            >
              {hashtagOptions.map((suggestion, index) => {
                const typed = hashtagToken.query.length;
                const active = index === hashtagActive;
                return (
                  <button
                    key={suggestion.tag}
                    type="button"
                    role="option"
                    aria-selected={active}
                    // A blur beats a click: fire before the textarea's onBlur closes the dropdown.
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setHashtagActive(index)}
                    onClick={() => applyHashtagSuggestion(suggestion.tag)}
                    className={`flex w-full items-center justify-between gap-2 px-3.5 py-2 text-right text-sm transition-colors ${active ? "bg-hover" : ""}`}
                  >
                    <span dir="auto" className="min-w-0 truncate">
                      <span className="text-muted-foreground">#{suggestion.tag.slice(0, typed)}</span>
                      <span className="font-bold text-foreground">{suggestion.tag.slice(typed)}</span>
                    </span>
                    {active ? (
                      <kbd className="shrink-0 rounded-md border border-border px-1.5 text-[10px] text-muted-foreground">Tab</kbd>
                    ) : (
                      <span className="shrink-0 text-[11px] text-muted-foreground">{suggestion.count.toLocaleString("fa-IR")}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : null}
          </div>
        </div>

        {quoteId ? (
          <div className="mt-2">
            {quote.status === "loading" ? (
              <div role="status" className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface p-4 text-xs text-muted-foreground">
                <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                در حال دریافت روایت…
              </div>
            ) : quote.status === "ready" ? (
              <div className="relative">
                <QuotedPostCard quote={quote.post} preview />
                <button
                  type="button"
                  onClick={() => router.replace("/compose")}
                  aria-label="حذف نقل‌قول"
                  className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-surface-muted text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            ) : quote.status === "failed" ? (
              <p role="alert" className="rounded-2xl border border-danger-border bg-danger-surface p-4 text-xs font-bold leading-6 text-danger">
                روایت موردنظر در دسترس نیست و نقل‌قول آن ممکن نیست.
              </p>
            ) : null}
            {quote.status === "ready" && viewer.mediaOutletId ? (
              <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-surface p-3.5 text-xs font-black text-foreground">
                <input type="checkbox" checked={fileAsReflection} onChange={(event) => setFileAsReflection(event.target.checked)} />
                این نقل‌قول به‌عنوان بازنشر رسانه‌ای ثبت شود
              </label>
            ) : null}
          </div>
        ) : null}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={pickerAccept}
          className="hidden"
          onChange={(event) => {
            if (event.target.files?.length) addFiles(event.target.files);
            event.target.value = "";
          }}
        />

        {media.length ? <ComposeMediaGrid media={media} onRemove={remove} onRetry={retry} /> : null}

        {notice ? (
          <p role="status" aria-live="polite" className="mt-2 text-center text-[11px] font-bold text-warning-foreground">
            {notice}
          </p>
        ) : null}

        {hasUploadError ? (
          <p role="alert" className="mt-2 text-center text-[11px] font-bold text-danger">
            یکی از فایل‌ها بارگذاری نشد؛ «تلاش دوباره» را بزن یا حذفش کن.
          </p>
        ) : null}

        {publishError ? <p role="alert" className="mt-3 text-xs font-bold text-danger">{publishError}</p> : null}
      </div>

      {/* Bottom toolbar of the reference: media pickers, hashtag, emoji and the character ring. */}
      <div className={`${styles.toolbar} z-20 mt-auto border-t`}>
        {emojiOpen ? (
          <div className="mb-3 grid grid-cols-8 gap-1 rounded-2xl border border-border bg-surface p-2">
            {["🙂", "😍", "🙏", "👏", "❤️", "🔥", "💪", "🌹", "🇮🇷", "✌️", "🤲", "😢", "😂", "👍", "🎉", "✨"].map((emoji) => (
              <button key={emoji} type="button" onClick={() => insertText(emoji)} className="grid h-9 place-items-center rounded-xl text-lg hover:bg-hover">{emoji}</button>
            ))}
          </div>
        ) : null}
        <div className="flex items-center justify-between">
          <div className={`${styles.tools} flex items-center`}>
            <button type="button" disabled={atCapacity} onClick={() => openPicker("image/*")} aria-label="افزودن عکس" className="transition-opacity hover:opacity-70 disabled:opacity-30"><ImageIcon className="h-[22px] w-[22px]" /></button>
            <button type="button" disabled={atCapacity} onClick={() => openPicker("video/*")} aria-label="افزودن ویدیو" className="transition-opacity hover:opacity-70 disabled:opacity-30"><Video className="h-[22px] w-[22px]" /></button>
            <button type="button" disabled={atCapacity} onClick={() => openPicker("audio/*")} aria-label="افزودن صوت" className="transition-opacity hover:opacity-70 disabled:opacity-30"><Volume2 className="h-[22px] w-[22px]" /></button>
            <button
              type="button"
              onClick={() => {
                insertText("#");
                window.requestAnimationFrame(syncHashtagToken);
              }}
              aria-label="افزودن هشتگ"
              className="transition-opacity hover:opacity-70"
            >
              <Hash className="h-[22px] w-[22px]" />
            </button>
            <button type="button" onClick={() => setEmojiOpen((value) => !value)} aria-label="شکلک" aria-expanded={emojiOpen} className="transition-opacity hover:opacity-70"><Smile className="h-[22px] w-[22px]" /></button>
          </div>
          <div className={`${styles.meter} flex items-center gap-2`}>
            {isUploading ? <LoaderCircle aria-label="در حال بارگذاری" className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
            {media.length ? <span className="text-[11px] font-bold text-muted-foreground">{media.length.toLocaleString("fa-IR")}/{MAX_COMPOSE_MEDIA.toLocaleString("fa-IR")} پیوست</span> : null}
            <span dir="ltr" className={`latin-digits text-[11px] tabular-nums ${text.length > MAX_CHARACTERS - 20 ? "text-danger" : "text-muted-foreground"}`}>{text.length} / {MAX_CHARACTERS}</span>
            <span aria-hidden="true" className={styles.ring}><span style={{ transform: `scale(${Math.min(1.2, text.length / MAX_CHARACTERS)})` }} /></span>
          </div>
        </div>
      </div>

      {dragging ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-2 z-30 grid place-items-center rounded-3xl border-2 border-dashed border-border-strong bg-surface/90 backdrop-blur-sm">
          <span className="flex flex-col items-center gap-2 text-xs font-black text-foreground">
            <UploadCloud className="h-7 w-7" />
            برای پیوست رها کن
          </span>
        </div>
      ) : null}

      {exitOpen ? (
        <div role="dialog" aria-modal="true" aria-label="ذخیره پیش‌نویس" className="fixed inset-0 z-[70] flex items-end justify-center bg-overlay p-3 sm:items-center">
          <div className="w-full max-w-sm rounded-panel border border-border bg-popover p-4 text-popover-foreground shadow-dialog">
            <h2 className="text-sm font-black">پیش‌نویس ذخیره شود؟</h2>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">متن روایت به‌صورت خودکار روی این دستگاه ذخیره شده و می‌توانی بعداً ادامه بدهی. فایل‌های پیوست ذخیره نمی‌شوند.</p>
            <div className="mt-4 grid gap-2">
              <button type="button" onClick={goBack} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-emphasis px-4 text-xs font-black text-emphasis-foreground"><Save className="h-4 w-4" />ذخیره و خروج</button>
              <button type="button" onClick={discardAndExit} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-danger-border bg-danger-surface px-4 text-xs font-black text-danger"><Trash2 className="h-4 w-4" />حذف پیش‌نویس</button>
              <button type="button" onClick={() => setExitOpen(false)} className="min-h-11 rounded-control px-4 text-xs font-bold text-foreground-secondary hover:bg-hover">ادامه نوشتن</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
