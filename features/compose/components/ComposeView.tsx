"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ImageIcon, Mic, Save, Trash2, Video, X } from "lucide-react";
import { meydanApi } from "@/lib/meydan-api";
import { uploadNarrativeFile } from "@/lib/meydan-upload";

const MAX_CHARACTERS = 280;
const DRAFT_KEY = "meydan-compose-draft";

type ViewerState = {
  accountType: "user" | "square" | "";
};

type ComposeDraft = {
  title: string;
  text: string;
  isEcho: boolean;
};

export function ComposeView() {
  const router = useRouter();
  const titleRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isEcho, setIsEcho] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [viewer, setViewer] = useState<ViewerState>({ accountType: "" });

  useEffect(() => {
    const stored = window.localStorage.getItem(DRAFT_KEY);
    if (stored) {
      try {
        const draft = JSON.parse(stored) as Partial<ComposeDraft>;
        if (typeof draft.title === "string") setTitle(draft.title);
        if (typeof draft.text === "string") setText(draft.text);
        if (typeof draft.isEcho === "boolean") setIsEcho(draft.isEcho);
      } catch {
        setText(stored);
      }
    }
    const frame = window.requestAnimationFrame(() => titleRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const hasDraft = title.trim().length > 0 || text.trim().length > 0 || isEcho;
    if (hasDraft) {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, text, isEcho } satisfies ComposeDraft));
    } else {
      window.localStorage.removeItem(DRAFT_KEY);
    }
  }, [title, text, isEcho]);

  useEffect(() => {
    void meydanApi<{ account_type: "user" | "square" }>("/me")
      .then((me) => {
        setViewer({ accountType: me.account_type });
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!attachment) {
      queueMicrotask(() => setPreviewUrl(null));
      return;
    }
    const url = URL.createObjectURL(attachment);
    queueMicrotask(() => setPreviewUrl(url));
    return () => URL.revokeObjectURL(url);
  }, [attachment]);

  const body = [title.trim(), text.trim()].filter(Boolean).join("\n\n");
  const hasContent = body.length > 0 || Boolean(attachment);
  const canPublish = hasContent && text.length <= MAX_CHARACTERS && !isPublishing;

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
    setAttachment(null);
    setIsEcho(false);
    goBack();
  };

  const chooseFile = (accept: string) => {
    const input = fileInputRef.current;
    if (!input) return;
    input.accept = accept;
    input.value = "";
    input.click();
  };

  const publish = async () => {
    if (!canPublish) return;
    setIsPublishing(true);
    setPublishError("");
    try {
      const mediaId = attachment ? await uploadNarrativeFile(attachment) : undefined;
      await meydanApi("/narratives", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
        body: JSON.stringify({
          body,
          is_echo: isEcho,
          attachments: mediaId ? [{ media_id: mediaId, label: attachment?.name }] : [],
        }),
      });
      window.localStorage.removeItem(DRAFT_KEY);
      setTitle("");
      setText("");
      setAttachment(null);
      setIsEcho(false);
      router.push("/home");
      router.refresh();
    } catch {
      setPublishError("انتشار روایت انجام نشد. دوباره تلاش کنید.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <section dir="rtl" className="flex min-h-full flex-1 flex-col bg-background text-foreground" aria-label="ثبت روایت یا ایده جدید">
      <div className="flex items-center justify-between gap-3 border-b border-divider px-4 py-4">
        <div className="flex min-w-0 items-center gap-2">
          <button type="button" onClick={requestClose} aria-label="بازگشت" className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-icon-muted transition-colors hover:bg-hover hover:text-brand">
            <ChevronRight className="h-5 w-5" />
          </button>
          <h1 className="truncate text-sm font-black text-foreground sm:text-base">ثبت روایت یا ایده جدید</h1>
        </div>
        <button type="button" onClick={() => void publish()} disabled={!canPublish} className="shrink-0 rounded-full bg-brand px-4 py-2.5 text-xs font-black text-brand-foreground transition-[transform,background-color] hover:bg-brand-hover active:scale-95 disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground sm:px-5">
          {isPublishing ? "در حال انتشار…" : viewer.accountType === "square" ? "انتشار به نام میدان" : "انتشار"}
        </button>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-24 pt-4">
        <div className="flex gap-2 border-b border-divider pb-4">
          <button type="button" onClick={() => setIsEcho(false)} className={`rounded-xl px-4 py-2 text-xs font-black transition-colors ${!isEcho ? "bg-brand text-brand-foreground" : "bg-surface-muted text-muted-foreground hover:bg-hover hover:text-foreground"}`}>
            روایت میدانی
          </button>
          <button type="button" onClick={() => setIsEcho(true)} className={`rounded-xl px-4 py-2 text-xs font-black transition-colors ${isEcho ? "bg-brand text-brand-foreground" : "bg-surface-muted text-muted-foreground hover:bg-hover hover:text-foreground"}`}>
            پژواک (ایده و کار خوب)
          </button>
        </div>

        <div className="space-y-3 pt-5">
          <input ref={titleRef} type="text" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} placeholder="تیتر یا موضوع اصلی روایت..." aria-label="تیتر روایت" className="min-h-14 w-full rounded-2xl border border-input-border bg-input px-4 text-sm font-bold text-foreground outline-none transition-colors placeholder:text-placeholder focus:border-brand" />
          <textarea value={text} onChange={(event) => setText(event.target.value)} maxLength={MAX_CHARACTERS} placeholder="شرح ماجرا، حال‌وهوای امشب میدان، نیازها یا دستاوردها..." rows={7} aria-label="شرح روایت" className="min-h-44 w-full resize-none rounded-2xl border border-input-border bg-input p-4 text-sm leading-7 text-foreground outline-none transition-colors placeholder:text-placeholder focus:border-brand" />
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-surface px-3 py-3.5">
          <span className="block text-[11px] font-black text-foreground-secondary">پیوست‌های چندرسانه‌ای:</span>
          <input ref={fileInputRef} type="file" className="hidden" onChange={(event) => setAttachment(event.target.files?.[0] ?? null)} />
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <button type="button" onClick={() => chooseFile("image/*")} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-surface-muted px-3 text-foreground-secondary transition-colors hover:bg-hover hover:text-brand">
              <ImageIcon className="h-4 w-4" />عکس
            </button>
            <button type="button" onClick={() => chooseFile("video/*")} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-surface-muted px-3 text-foreground-secondary transition-colors hover:bg-hover hover:text-brand">
              <Video className="h-4 w-4" />ویدیو
            </button>
            <button type="button" onClick={() => chooseFile("audio/*")} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-surface-muted px-3 text-foreground-secondary transition-colors hover:bg-hover hover:text-brand">
              <Mic className="h-4 w-4" />صوت
            </button>
          </div>

          {previewUrl && attachment ? (
            <div className="ui-enter relative mt-3 overflow-hidden rounded-xl border border-border bg-surface-muted">
              {attachment.type.startsWith("video/") ? (
                <video src={previewUrl} controls className="max-h-72 w-full bg-surface-sunken object-contain" />
              ) : attachment.type.startsWith("audio/") ? (
                <div className="p-3"><audio src={previewUrl} controls className="w-full" /></div>
              ) : (
                <img src={previewUrl} alt="پیش‌نمایش فایل انتخاب‌شده" className="max-h-72 w-full object-cover" />
              )}
              <button type="button" onClick={() => setAttachment(null)} aria-label="حذف فایل پیوست" className="absolute left-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-scrim text-on-solid shadow-sm backdrop-blur">
                <X className="h-4 w-4" />
              </button>
              <div className="border-t border-divider px-3 py-2 text-[10px] text-muted-foreground">{attachment.name}</div>
            </div>
          ) : null}
        </div>

        {publishError ? <p role="alert" className="mt-3 text-xs font-bold text-danger">{publishError}</p> : null}
      </div>

      {exitOpen ? (
        <div role="dialog" aria-modal="true" aria-label="ذخیره پیش‌نویس" className="fixed inset-0 z-[70] flex items-end justify-center bg-overlay p-3 sm:items-center">
          <div className="w-full max-w-sm rounded-panel border border-border bg-popover p-4 text-popover-foreground shadow-dialog">
            <h2 className="text-sm font-black">پیش‌نویس ذخیره شود؟</h2>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">متن روایت به‌صورت خودکار روی این دستگاه ذخیره شده و می‌توانی بعداً ادامه بدهی.</p>
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
