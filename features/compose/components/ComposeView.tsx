"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Hash, Image as ImageIcon, LoaderCircle, Plus, Save, Send, Smile, Sparkles, Trash2, UploadCloud, Video, Volume2, X } from "lucide-react";
import { OptimizedAvatar } from "@/components/shared/OptimizedAvatar";
import { MeydanApiError, meydanApi } from "@/lib/meydan-api";
import { getMe } from "@/lib/me-client";
import { QuotedPostCard } from "@/features/feed/components/QuotedPostCard";
import { mapQuotedNarrative, type ApiQuotedNarrative } from "@/features/feed/services/quote-mapper";
import type { QuotedPost } from "@/features/feed/types";
import { ComposeMediaGrid } from "./ComposeMediaGrid";
import { MAX_COMPOSE_MEDIA, useComposeMedia } from "../hooks/useComposeMedia";

const MAX_CHARACTERS = 280;
const BASE_DRAFT_KEY = "meydan-compose-draft";
/** One picker for everything; the composer sorts the files by type. */
const MEDIA_ACCEPT = "image/*,video/*,audio/*";

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
export function ComposeView({ quoteId, workMode = false }: { quoteId?: string; workMode?: boolean }) {
  const router = useRouter();
  // A quote keeps its own draft so it never overwrites the plain-narrative one.
  const DRAFT_KEY = quoteId ? `${BASE_DRAFT_KEY}:quote:${quoteId}` : BASE_DRAFT_KEY;
  const [quote, setQuote] = useState<QuoteState>(quoteId ? { status: "loading" } : { status: "none" });
  const titleRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
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
      setDraftLoaded(true);
    });
    const frame = window.requestAnimationFrame(() => textRef.current?.focus());
    return () => { active = false; window.cancelAnimationFrame(frame); };
  }, [workMode, DRAFT_KEY, quoteId]);

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

  const body = quoteId ? text.trim() : [title.trim(), text.trim()].filter(Boolean).join("\n\n");
  const hasContent = body.length > 0 || media.length > 0;
  const atCapacity = media.length >= MAX_COMPOSE_MEDIA;
  const quoteReady = !quoteId || quote.status === "ready";
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
      className="relative flex min-h-full flex-1 flex-col bg-background text-foreground"
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
      <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-divider bg-background/95 px-4 py-2.5 backdrop-blur">
        <button type="button" onClick={requestClose} className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground transition-colors hover:text-foreground-secondary">
          <X aria-hidden="true" className="h-5 w-5" />
          انصراف
        </button>
        <h1 className="sr-only">{quoteId ? "نقل‌قول روایت" : "ثبت روایت یا ایده جدید"}</h1>
        <div className="flex items-center gap-2">
          {/* The draft is saved automatically on this device; this keeps it and leaves. */}
          <button type="button" onClick={goBack} disabled={!hasContent} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-muted px-3.5 py-2 text-xs font-bold text-foreground-secondary transition-colors hover:text-foreground disabled:opacity-50">
            <Bookmark aria-hidden="true" className="h-3.5 w-3.5" />
            پیش‌نویس
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

      <div className="flex flex-1 flex-col px-4 pb-28 pt-4">
        {!quoteId ? <div role="tablist" aria-label="نوع روایت" className="grid grid-cols-4 gap-1 rounded-[18px] border border-border bg-surface-muted p-1">
          {([[false, "روایت", null], [true, "کار", Sparkles]] as const).map(([echo, label, Icon]) => (
            <button key={label} type="button" role="tab" aria-selected={isEcho === echo} onClick={() => setIsEcho(echo)} className={`inline-flex items-center justify-center gap-1.5 rounded-[14px] px-2 py-2.5 text-xs font-bold transition-all ${isEcho === echo ? "bg-emphasis text-emphasis-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {Icon ? <Icon aria-hidden="true" className="h-4 w-4" /> : null}
              {label}
            </button>
          ))}
          {/* In the reference; publishing a پویش from here has no backend yet. */}
          {([["پویش", Send], ["پویش رسانه‌ای", Video]] as const).map(([label, Icon]) => (
            <span key={label} role="tab" aria-selected="false" aria-disabled="true" title="به‌زودی" className="inline-flex cursor-default items-center justify-center gap-1.5 whitespace-nowrap rounded-[14px] px-1 py-2.5 text-xs font-bold text-muted-foreground">
              <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
              {label}
            </span>
          ))}
        </div> : null}

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-[#a9c4f9] text-sm font-extrabold text-[#223967]">
              {viewer.avatarUrl ? <OptimizedAvatar src={viewer.avatarUrl} alt="" width={44} className="h-full w-full object-cover" /> : null}
            </span>
            <span className="min-w-0">
              <strong className="block truncate text-xs font-black text-foreground">{quoteId ? "نقل‌قول روایت" : isEcho ? "ثبت کار یا ایده" : "ارسال مطلب جدید"}</strong>
              <span className="block truncate text-[10px] text-muted-foreground">انتشار در شبکه مردمی</span>
            </span>
          </div>
          {!quoteId && !showTitle ? (
            <button type="button" onClick={() => { setShowTitle(true); window.requestAnimationFrame(() => titleRef.current?.focus()); }} className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-surface-muted px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-hover">
              <Plus aria-hidden="true" className="h-3.5 w-3.5" />
              افزودن عنوان (اختیاری)
            </button>
          ) : null}
        </div>

        <div className="pt-3">
          {!quoteId && showTitle ? <input ref={titleRef} type="text" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} placeholder="عنوان (اختیاری)" aria-label="تیتر روایت" className="w-full border-0 bg-transparent py-2 text-base font-black text-foreground shadow-none outline-none ring-0 placeholder:font-medium placeholder:text-placeholder focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0" /> : null}
          <textarea
            ref={textRef}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onPaste={(event) => {
              const files = Array.from(event.clipboardData?.files ?? []);
              if (!files.length) return;
              event.preventDefault();
              addFiles(files);
            }}
            maxLength={MAX_CHARACTERS}
            placeholder={quoteId ? "نظر خودت را دربارهٔ این روایت بنویس..." : "چه خبر؟ ماجرا یا شرح حال را بنویسید..."}
            rows={8}
            aria-label="شرح روایت"
            className="min-h-56 w-full resize-none border-0 bg-transparent py-2 text-[15px] leading-8 text-foreground shadow-none outline-none ring-0 placeholder:text-placeholder focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
          />
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
      <div className="sticky bottom-0 z-20 mt-auto border-t border-divider bg-background/95 px-4 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        {emojiOpen ? (
          <div className="mb-3 grid grid-cols-8 gap-1 rounded-2xl border border-border bg-surface p-2">
            {["🙂", "😍", "🙏", "👏", "❤️", "🔥", "💪", "🌹", "🇮🇷", "✌️", "🤲", "😢", "😂", "👍", "🎉", "✨"].map((emoji) => (
              <button key={emoji} type="button" onClick={() => insertText(emoji)} className="grid h-9 place-items-center rounded-xl text-lg hover:bg-hover">{emoji}</button>
            ))}
          </div>
        ) : null}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-foreground">
            <button type="button" disabled={atCapacity} onClick={() => openPicker("image/*")} aria-label="افزودن عکس" className="transition-opacity hover:opacity-70 disabled:opacity-30"><ImageIcon className="h-[22px] w-[22px]" /></button>
            <button type="button" disabled={atCapacity} onClick={() => openPicker("video/*")} aria-label="افزودن ویدیو" className="transition-opacity hover:opacity-70 disabled:opacity-30"><Video className="h-[22px] w-[22px]" /></button>
            <button type="button" disabled={atCapacity} onClick={() => openPicker("audio/*")} aria-label="افزودن صوت" className="transition-opacity hover:opacity-70 disabled:opacity-30"><Volume2 className="h-[22px] w-[22px]" /></button>
            <button type="button" onClick={() => insertText("#")} aria-label="افزودن هشتگ" className="transition-opacity hover:opacity-70"><Hash className="h-[22px] w-[22px]" /></button>
            <button type="button" onClick={() => setEmojiOpen((value) => !value)} aria-label="شکلک" aria-expanded={emojiOpen} className="transition-opacity hover:opacity-70"><Smile className="h-[22px] w-[22px]" /></button>
          </div>
          <div className="flex items-center gap-2">
            {isUploading ? <LoaderCircle aria-label="در حال بارگذاری" className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
            {media.length ? <span className="text-[11px] font-bold text-muted-foreground">{media.length.toLocaleString("fa-IR")}/{MAX_COMPOSE_MEDIA.toLocaleString("fa-IR")} پیوست</span> : null}
            <span dir="ltr" className={`latin-digits text-[11px] tabular-nums ${text.length > MAX_CHARACTERS - 20 ? "text-danger" : "text-muted-foreground"}`}>{text.length} / {MAX_CHARACTERS}</span>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 -rotate-90">
              <circle cx="12" cy="12" r="9" fill="none" strokeWidth="2.5" className="stroke-border-strong" />
              <circle cx="12" cy="12" r="9" fill="none" strokeWidth="2.5" strokeLinecap="round" className={text.length > MAX_CHARACTERS - 20 ? "stroke-danger" : "stroke-foreground"} strokeDasharray={`${(Math.min(text.length, MAX_CHARACTERS) / MAX_CHARACTERS) * 56.55} 56.55`} />
            </svg>
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
