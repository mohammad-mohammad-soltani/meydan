"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  ImagePlus,
  ListChecks,
  MapPin,
  Plus,
  Save,
  Smile,
  Trash2,
  X,
} from "lucide-react";
import { generatedMedia } from "@/components/shared/generated-media";
import { requireLogin } from "@/lib/meydan-client-api";
import { publishNarrative } from "../services/compose.service";

const MAX_CHARACTERS = 280;
const DRAFT_KEY = "meydan-compose-draft";

type PollOption = { id: number; value: string };

export function ComposeView() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pollOptions, setPollOptions] = useState<PollOption[] | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
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

  useEffect(() => {
    if (!attachment) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(attachment);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [attachment]);

  const remaining = MAX_CHARACTERS - text.length;
  const hasPollContent = pollOptions?.some((option) => option.value.trim()) ?? false;
  const hasContent = text.trim().length > 0 || Boolean(attachment) || hasPollContent;
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
    setPollOptions(null);
    goBack();
  };

  const insertEmoji = () => {
    const textarea = textareaRef.current;
    const emoji = "✨";
    if (!textarea) {
      setText((value) => `${value}${emoji}`);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    setText((value) => `${value.slice(0, start)}${emoji}${value.slice(end)}`);
    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  };

  const startPoll = () => {
    setPollOptions((current) => current ?? [
      { id: Date.now(), value: "" },
      { id: Date.now() + 1, value: "" },
    ]);
  };

  const updatePollOption = (id: number, value: string) => {
    setPollOptions((current) => current?.map((option) => option.id === id ? { ...option, value } : option) ?? null);
  };

  const addPollOption = () => {
    setPollOptions((current) => current && current.length < 4 ? [...current, { id: Date.now(), value: "" }] : current);
  };

  const publish = async () => {
    if (!canPublish) return;
    setIsPublishing(true);
    try {
      await publishNarrative({
        body: text,
        attachment,
        scheduledAt: scheduledAt || undefined,
        pollOptions: pollOptions?.map((option) => option.value),
      });
      window.localStorage.removeItem(DRAFT_KEY);
      setText("");
      setAttachment(null);
      setPollOptions(null);
      router.push("/home");
      router.refresh();
    } catch (error) {
      if (!requireLogin(error)) {
        window.alert(error instanceof Error ? error.message : "انتشار روایت ناموفق بود.");
      }
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <section className="flex min-h-full flex-1 flex-col bg-background text-foreground" aria-label="نوشتن روایت تازه">
      <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between border-b border-divider bg-surface-glass px-3 backdrop-blur-md">
        <button type="button" onClick={requestClose} aria-label="بستن و بازگشت" className="grid h-10 w-10 place-items-center rounded-full text-icon transition-colors hover:bg-hover hover:text-foreground"><X className="h-5 w-5" /></button>
        <span className="text-sm font-black">روایت جدید</span>
        <button type="button" onClick={() => void publish()} disabled={!canPublish} className="rounded-pill bg-brand px-4 py-2 text-xs font-black text-brand-foreground transition-[transform,background-color] hover:bg-brand-hover active:scale-95 disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground">{isPublishing ? "در حال انتشار…" : "انتشار"}</button>
      </header>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-4">
        <div className="flex items-start gap-3">
          <img src={generatedMedia.avatarJournalist} alt="آواتار کاربر" className="h-12 w-12 shrink-0 rounded-full border border-border object-cover shadow-xs" />
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2"><span className="text-sm font-black text-foreground">روایتگر میدان</span><span className="text-[11px] text-muted-foreground">@you</span></div>
            <textarea ref={textareaRef} autoFocus value={text} onChange={(event) => { setText(event.target.value); event.currentTarget.style.height = "auto"; event.currentTarget.style.height = `${Math.max(180, event.currentTarget.scrollHeight)}px`; }} maxLength={MAX_CHARACTERS + 40} placeholder="چه روایتی برای گفتن داری؟" aria-label="متن روایت" className="min-h-48 w-full resize-none overflow-hidden bg-transparent text-[19px] leading-8 text-foreground outline-none placeholder:text-placeholder focus-visible:outline-none" />
          </div>
        </div>

        {previewUrl && attachment ? (
          <div className="ui-enter relative mt-3 overflow-hidden rounded-panel border border-border bg-surface-muted">
            {attachment.type.startsWith("video/") ? <video src={previewUrl} controls className="max-h-80 w-full bg-surface-sunken object-contain" /> : <img src={previewUrl} alt="پیش‌نمایش تصویر انتخاب‌شده" className="max-h-80 w-full object-cover" />}
            <button type="button" onClick={() => setAttachment(null)} aria-label="حذف فایل پیوست" className="absolute left-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-scrim text-on-solid shadow-sm backdrop-blur"><X className="h-4 w-4" /></button>
            <div className="border-t border-divider px-3 py-2 text-[10px] text-muted-foreground">{attachment.name}</div>
          </div>
        ) : null}

        {pollOptions ? (
          <div className="ui-enter mt-3 space-y-2 rounded-card border border-border bg-surface p-3 shadow-xs">
            <div className="flex items-center justify-between"><span className="text-xs font-black">نظرسنجی</span><button type="button" onClick={() => setPollOptions(null)} aria-label="حذف نظرسنجی" className="grid h-8 w-8 place-items-center rounded-full text-icon-muted hover:bg-hover hover:text-danger"><X className="h-4 w-4" /></button></div>
            {pollOptions.map((option, index) => <input key={option.id} value={option.value} onChange={(event) => updatePollOption(option.id, event.target.value)} placeholder={`گزینه ${index + 1}`} className="min-h-11 w-full rounded-control border border-input-border bg-input px-3 text-sm text-foreground outline-none placeholder:text-placeholder focus:border-brand" />)}
            {pollOptions.length < 4 ? <button type="button" onClick={addPollOption} className="inline-flex items-center gap-1.5 rounded-control px-2 py-2 text-xs font-bold text-brand hover:bg-brand-muted"><Plus className="h-4 w-4" />افزودن گزینه</button> : null}
          </div>
        ) : null}

        {scheduleOpen ? (
          <div className="ui-enter mt-3 rounded-card border border-border bg-surface p-3 shadow-xs">
            <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black">زمان‌بندی انتشار</p><p className="mt-1 text-[10px] text-muted-foreground">زمان دلخواه را انتخاب کن.</p></div><button type="button" onClick={() => { setScheduleOpen(false); setScheduledAt(""); }} className="grid h-8 w-8 place-items-center rounded-full text-icon-muted hover:bg-hover" aria-label="بستن زمان‌بندی"><X className="h-4 w-4" /></button></div>
            <input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} className="mt-3 min-h-11 w-full rounded-control border border-input-border bg-input px-3 text-xs text-foreground outline-none focus:border-brand" />
          </div>
        ) : null}

        {locationEnabled ? <button type="button" onClick={() => setLocationEnabled(false)} className="ui-enter mt-3 inline-flex w-fit items-center gap-1.5 rounded-pill bg-brand-muted px-3 py-1.5 text-xs font-bold text-brand"><MapPin className="h-3.5 w-3.5" />موقعیت فعلی<X className="h-3.5 w-3.5" /></button> : null}
      </div>

      <div className="sticky bottom-0 z-20 border-t border-divider bg-surface-glass px-3 py-2.5 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-0.5 text-brand">
            <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={(event) => setAttachment(event.target.files?.[0] ?? null)} />
            <button type="button" onClick={() => fileInputRef.current?.click()} aria-label="افزودن تصویر یا ویدئو" className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-brand-muted"><ImagePlus className="h-[19px] w-[19px]" /></button>
            <button type="button" onClick={startPoll} aria-label="افزودن نظرسنجی" className={`grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-brand-muted ${pollOptions ? "bg-brand-muted" : ""}`}><ListChecks className="h-[19px] w-[19px]" /></button>
            <button type="button" onClick={insertEmoji} aria-label="افزودن ایموجی" className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-brand-muted"><Smile className="h-[19px] w-[19px]" /></button>
            <button type="button" onClick={() => setScheduleOpen((open) => !open)} aria-label="افزودن زمان‌بندی" className={`grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-brand-muted ${scheduleOpen ? "bg-brand-muted" : ""}`}><CalendarClock className="h-[19px] w-[19px]" /></button>
            <button type="button" onClick={() => setLocationEnabled((enabled) => !enabled)} aria-label="افزودن موقعیت" className={`grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-brand-muted ${locationEnabled ? "bg-brand-muted" : ""}`}><MapPin className="h-[19px] w-[19px]" /></button>
          </div>

          {text.length > 0 ? (
            <div className={`flex items-center gap-2 text-[11px] font-bold ${remaining < 0 ? "text-danger" : remaining <= 20 ? "text-warning" : "text-muted-foreground"}`}>
              {remaining <= 20 ? <span>{remaining}</span> : null}
              <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" className="-rotate-90"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-20" /><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset} /></svg>
            </div>
          ) : null}
        </div>
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
