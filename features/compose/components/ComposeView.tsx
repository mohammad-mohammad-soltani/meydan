"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Save, Trash2, X } from "lucide-react";
import { meydanApi } from "@/lib/meydan-api";
import { uploadNarrativeFile } from "@/lib/meydan-upload";

const MAX_CHARACTERS = 280;
const DRAFT_KEY = "meydan-compose-draft";


export function ComposeView() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isInitiative, setIsInitiative] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [viewer, setViewer] = useState({ name: "", handle: "", avatarUrl: "" });

  useEffect(() => {
    const draft = window.localStorage.getItem(DRAFT_KEY) ?? "";
    queueMicrotask(() => setText(draft));
    const frame = window.requestAnimationFrame(() => textareaRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    void meydanApi<{
      account_type: "user" | "square";
      profile?: { full_name?: string; avatar_url?: string };
      square?: { name?: string; avatar_url?: string; handle?: string };
    }>("/me")
      .then((me) => {
        setViewer({
          name: me.account_type === "square" ? me.square?.name || "" : me.profile?.full_name || "",
          handle: me.account_type === "square" ? me.square?.handle || "" : "",
          avatarUrl: me.account_type === "square" ? me.square?.avatar_url || "" : me.profile?.avatar_url || "",
        });
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (text) window.localStorage.setItem(DRAFT_KEY, text);
    else window.localStorage.removeItem(DRAFT_KEY);
  }, [text]);

  useEffect(() => {
    if (!attachment) {
      queueMicrotask(() => setPreviewUrl(null));
      return;
    }

    const url = URL.createObjectURL(attachment);
    queueMicrotask(() => setPreviewUrl(url));
    return () => URL.revokeObjectURL(url);
  }, [attachment]);

  const remaining = MAX_CHARACTERS - text.length;
  const hasContent = text.trim().length > 0 || Boolean(attachment);
  const canPublish = text.trim().length > 0 && remaining >= 0 && !isPublishing;
  const progress = useMemo(() => Math.min(text.length / MAX_CHARACTERS, 1), [text.length]);
  const circumference = 2 * Math.PI * 9;
  const dashOffset = circumference * (1 - progress);

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
    setText("");
    setAttachment(null);
    setIsInitiative(false);
    goBack();
  };

  const publish = async () => {
    if (!canPublish) return;
    setIsPublishing(true);
    try {
      const mediaId = attachment ? await uploadNarrativeFile(attachment) : undefined;
      await meydanApi("/narratives", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
        body: JSON.stringify({
          body: text.trim(),
          attachments: mediaId ? [{ media_id: mediaId, label: attachment?.name }] : [],
        }),
      });
      window.localStorage.removeItem(DRAFT_KEY);
      setText(""); setAttachment(null); setIsInitiative(false);
      router.push("/home");
    } finally { setIsPublishing(false); }
  };

  return (
    <section className="flex min-h-full flex-1 flex-col bg-background text-foreground" aria-label="نوشتن روایت تازه">
      <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between border-b border-divider bg-surface-glass px-3 backdrop-blur-md">
        <button
          type="button"
          onClick={requestClose}
          aria-label="بستن و بازگشت"
          className="grid h-10 w-10 place-items-center rounded-full text-icon transition-colors hover:bg-hover hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <span className="text-sm font-black">روایت جدید</span>

        <button
          type="button"
          onClick={() => void publish()}
          disabled={!canPublish}
          className="rounded-pill bg-brand px-4 py-2 text-xs font-black text-brand-foreground transition-[transform,background-color] hover:bg-brand-hover active:scale-95 disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground"
        >
          {isPublishing ? "در حال انتشار…" : "انتشار"}
        </button>
      </header>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-4">
        <div className="flex items-start gap-3">
          {viewer.avatarUrl ? <img src={viewer.avatarUrl} alt="آواتار کاربر" className="h-12 w-12 shrink-0 rounded-full border border-border object-cover shadow-xs" /> : <span aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-border bg-surface-muted text-sm font-black text-icon shadow-xs">{viewer.name.slice(0, 1) || "م"}</span>}

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm font-black text-foreground">{viewer.name || "روایتگر میدان"}</span>
              <span className="text-[11px] text-muted-foreground">{viewer.handle ? `@${viewer.handle}` : ""}</span>
            </div>

            <textarea
              ref={textareaRef}
              autoFocus
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                event.currentTarget.style.height = "auto";
                event.currentTarget.style.height = `${Math.max(180, event.currentTarget.scrollHeight)}px`;
              }}
              maxLength={MAX_CHARACTERS + 40}
              placeholder="چه روایتی برای گفتن داری؟"
              aria-label="متن روایت"
              className="min-h-48 w-full resize-none overflow-hidden bg-transparent text-[19px] leading-8 text-foreground outline-none placeholder:text-placeholder focus-visible:outline-none"
            />
          </div>
        </div>

        {previewUrl && attachment ? (
          <div className="ui-enter relative mt-3 overflow-hidden rounded-panel border border-border bg-surface-muted">
            {attachment.type.startsWith("video/") ? (
              <video src={previewUrl} controls className="max-h-80 w-full bg-surface-sunken object-contain" />
            ) : (
              <img src={previewUrl} alt="پیش‌نمایش تصویر انتخاب‌شده" className="max-h-80 w-full object-cover" />
            )}
            <button
              type="button"
              onClick={() => setAttachment(null)}
              aria-label="حذف فایل پیوست"
              className="absolute left-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-scrim text-on-solid shadow-sm backdrop-blur"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="border-t border-divider px-3 py-2 text-[10px] text-muted-foreground">{attachment.name}</div>
          </div>
        ) : null}

      </div>

      <div className="sticky bottom-0 z-20 border-t border-divider bg-surface-glass px-3 py-2.5 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center text-brand">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(event) => setAttachment(event.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="افزودن تصویر یا ویدئو"
              className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-brand-muted"
            >
              <ImagePlus className="h-[19px] w-[19px]" />
            </button>
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

        <button
          type="button"
          role="switch"
          aria-checked={isInitiative}
          onClick={() => setIsInitiative((enabled) => !enabled)}
          className="mt-2.5 flex w-full items-center justify-between gap-3 rounded-control border border-border bg-surface px-3 py-2.5 text-right transition-colors hover:bg-hover"
        >
          <span className="min-w-0">
            <span className="block text-xs font-black text-foreground">این کار ابتکار است</span>
            <span className="mt-0.5 block text-[10px] text-muted-foreground">
              اگر کار شما ابتکاری جدید است این گزینه را بزنید. سایرین می‌توانند به ابتکار شما بپیوندند.
            </span>
          </span>

          <span
            aria-hidden="true"
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              isInitiative ? "bg-brand" : "bg-surface-muted"
            }`}
          >
            <span
              className={`absolute right-0.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-surface shadow-sm transition-transform ${
                isInitiative ? "-translate-x-5" : "translate-x-0"
              }`}
            />
          </span>
        </button>
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
