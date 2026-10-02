"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ImagePlus, LoaderCircle, Save, Trash2, UploadCloud, X } from "lucide-react";
import { MeydanApiError, meydanApi } from "@/lib/meydan-api";
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
  accountType: "user" | "square" | "speaker" | "";
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
  const [draftLoaded, setDraftLoaded] = useState(false);

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
          if (typeof draft.title === "string") setTitle(draft.title);
          if (typeof draft.text === "string") setText(draft.text);
          if (typeof draft.isEcho === "boolean") setIsEcho(workMode || draft.isEcho);
        } catch {
          setText(stored);
        }
      }
      setDraftLoaded(true);
    });
    const frame = window.requestAnimationFrame(() => (quoteId ? textRef.current : titleRef.current)?.focus());
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
    void meydanApi<{ account_type: "user" | "square" | "speaker" }>("/me")
      .then((me) => {
        setViewer({ accountType: me.account_type });
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

  const openPicker = () => {
    const input = fileInputRef.current;
    if (!input) return;
    input.value = "";
    input.click();
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
        }),
      });
      window.localStorage.removeItem(DRAFT_KEY);
      setTitle("");
      setText("");
      setIsEcho(false);
      reset();
      // «کار جدید» lands in the freshly created work room; everything else keeps its old destination.
      const workId = workMode ? created?.initiative?.work_id : null;
      router.push(workId ? `/works/${workId}` : quoteId && created?.id ? `/posts/${created.id}` : "/home");
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
      <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-divider bg-background/90 px-4 py-3 backdrop-blur">
        <div className="flex min-w-0 items-center gap-2">
          <button type="button" onClick={requestClose} aria-label="بازگشت" className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-icon-muted transition-colors hover:bg-hover hover:text-brand">
            <ChevronRight className="h-5 w-5" />
          </button>
          <h1 className="truncate text-sm font-black text-foreground sm:text-base">{quoteId ? "نقل‌قول روایت" : "ثبت روایت یا ایده جدید"}</h1>
        </div>
        <button
          type="button"
          onClick={() => void publish()}
          disabled={!canPublish}
          className="shrink-0 rounded-full bg-brand px-4 py-2.5 text-xs font-black text-brand-foreground transition-[transform,background-color] hover:bg-brand-hover active:scale-95 disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground sm:px-5"
        >
          {isPublishing ? "در حال انتشار…" : isUploading ? "در حال بارگذاری…" : viewer.accountType === "square" ? "انتشار به نام میدان" : quoteId ? "انتشار نقل‌قول" : "انتشار"}
        </button>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-24 pt-4">
        {!quoteId ? <div role="tablist" aria-label="نوع روایت" className="grid grid-cols-2 gap-1 rounded-2xl bg-surface-muted p-1">
          {([[false, "روایت میدانی"], [true, "پژواک (ایده و کار)"]] as const).map(([echo, label]) => (
            <button key={label} type="button" role="tab" aria-selected={isEcho === echo} onClick={() => setIsEcho(echo)} className={`rounded-xl px-4 py-2.5 text-xs font-black transition-all ${isEcho === echo ? "bg-surface text-brand shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {label}
            </button>
          ))}
        </div> : null}

        <div className="space-y-3 pt-5">
          {!quoteId ? <input ref={titleRef} type="text" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} placeholder="تیتر یا موضوع اصلی روایت..." aria-label="تیتر روایت" className="min-h-14 w-full rounded-2xl border border-input-border bg-input px-4 text-base font-black text-foreground placeholder:font-medium placeholder:text-placeholder" /> : null}
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
            placeholder={quoteId ? "نظر خودت را دربارهٔ این روایت بنویس..." : "شرح ماجرا، حال‌وهوای امشب میدان، نیازها یا دستاوردها..."}
            rows={7}
            aria-label="شرح روایت"
            className="min-h-52 w-full resize-none rounded-2xl border border-input-border bg-input p-4 text-[15px] leading-8 text-foreground placeholder:text-placeholder"
          />
          <div className="flex items-center justify-between px-1 text-[11px] font-bold">
            <span className="text-foreground-subtle">{isEcho ? "ایده یا کار را کوتاه و روشن بنویس" : "از دل میدان بنویس"}</span>
            <span className={`tabular-nums ${text.length > MAX_CHARACTERS - 20 ? "text-danger" : "text-foreground-subtle"}`}>{text.length.toLocaleString("fa-IR")} / {MAX_CHARACTERS.toLocaleString("fa-IR")}</span>
          </div>
        </div>

        {quoteId ? (
          <div className="mt-4">
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
          </div>
        ) : null}

        <div className="mt-4 rounded-3xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-black text-foreground-secondary">پیوست‌های چندرسانه‌ای</span>
            <span className="inline-flex items-center gap-2">
              {isUploading ? (
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-brand">
                  <LoaderCircle aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
                  در حال بارگذاری…
                </span>
              ) : null}
              <span className={`rounded-pill px-2.5 py-1 text-[10px] font-black tabular-nums ${media.length ? "bg-brand-muted text-brand" : "bg-surface-muted text-muted-foreground"}`}>
                {media.length.toLocaleString("fa-IR")} از {MAX_COMPOSE_MEDIA.toLocaleString("fa-IR")}
              </span>
            </span>
          </div>

          {/* One picker for images, video and audio. */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={MEDIA_ACCEPT}
            className="hidden"
            onChange={(event) => {
              if (event.target.files?.length) addFiles(event.target.files);
              event.target.value = "";
            }}
          />

          <button
            type="button"
            disabled={atCapacity}
            onClick={openPicker}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand-border bg-brand-muted/60 px-4 py-3 text-xs font-black text-brand transition-colors hover:border-brand hover:bg-brand-muted disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-muted disabled:text-disabled-foreground"
          >
            <ImagePlus aria-hidden="true" className="h-4 w-4" />
            {media.length ? "افزودن پیوست بیشتر" : "افزودن عکس، ویدیو یا صوت"}
          </button>

          <p className="mt-2 text-center text-[10px] leading-5 text-foreground-subtle">
            تا {MAX_COMPOSE_MEDIA.toLocaleString("fa-IR")} فایل، ترکیبی از عکس، ویدیو و صوت · می‌توانی فایل‌ها را همین‌جا رها کنی یا از کلیپ‌بورد بچسبانی
          </p>

          <ComposeMediaGrid media={media} onRemove={remove} onRetry={retry} />

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
        </div>

        {publishError ? <p role="alert" className="mt-3 text-xs font-bold text-danger">{publishError}</p> : null}
      </div>

      {dragging ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-2 z-30 grid place-items-center rounded-3xl border-2 border-dashed border-brand bg-brand-muted/80 backdrop-blur-sm">
          <span className="flex flex-col items-center gap-2 text-xs font-black text-brand">
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
              <button type="button" onClick={goBack} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-brand px-4 text-xs font-black text-brand-foreground"><Save className="h-4 w-4" />ذخیره و خروج</button>
              <button type="button" onClick={discardAndExit} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-danger-border bg-danger-surface px-4 text-xs font-black text-danger"><Trash2 className="h-4 w-4" />حذف پیش‌نویس</button>
              <button type="button" onClick={() => setExitOpen(false)} className="min-h-11 rounded-control px-4 text-xs font-bold text-foreground-secondary hover:bg-hover">ادامه نوشتن</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
