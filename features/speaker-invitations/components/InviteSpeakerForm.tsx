"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, Check, Clock, LoaderCircle, MapPin, Search, Send, X } from "lucide-react";
import { PersianDatePicker, tehranTodayIso } from "@/components/shared/PersianDatePicker";
import { PersianTimePicker } from "@/components/shared/PersianTimePicker";
import { SpeakerBadge } from "@/components/shared/SpeakerBadge";
import { OptimizedAvatar } from "@/components/shared/OptimizedAvatar";
import type { CreateInvitationInput, InvitableSpeaker, SpeakerCategory } from "../types";

const fieldClass =
  "mt-[7px] min-h-[46px] w-full rounded-2xl border border-input-border bg-input px-4 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-placeholder hover:border-input-border-hover focus:border-ring focus-visible:ring-2 focus-visible:ring-ring";

function SpeakerAvatar({ speaker, className = "h-9 w-9" }: { speaker: InvitableSpeaker; className?: string }) {
  if (speaker.avatarUrl) {
    return (
      <OptimizedAvatar
        src={speaker.avatarUrl}
        alt=""
        width={44}
        height={44}
        className={`${className} shrink-0 rounded-full object-cover ring-1 ring-border/70`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${className} grid shrink-0 place-items-center rounded-full bg-brand-muted text-[11px] font-black text-brand`}
    >
      {speaker.name.trim().slice(0, 1) || "؟"}
    </span>
  );
}

export function InviteSpeakerForm({
  speakers = [],
  speakersLoading = false,
  speakersError,
  submitError = null,
  categories = [],
  venue,
  initiativeId,
  busy = false,
  presetSpeaker = null,
  onSearch,
  onClose,
  onSubmit,
}: {
  speakers?: InvitableSpeaker[];
  speakersLoading?: boolean;
  speakersError?: string | null;
  /** Server-side rejection from the parent submit handler. */
  submitError?: string | null;
  categories?: SpeakerCategory[];
  /** The square's own registered address, shown read-only; the API sends it. */
  venue: string;
  initiativeId?: string;
  busy?: boolean;
  /** When set, the speaker is already chosen and the picker becomes a summary. */
  presetSpeaker?: InvitableSpeaker | null;
  onSearch?: (query: string) => void;
  onClose: () => void;
  onSubmit: (input: CreateInvitationInput) => Promise<void> | void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<InvitableSpeaker | null>(presetSpeaker);
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(() => tehranTodayIso());
  const [time, setTime] = useState("21:00");
  const [message, setMessage] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const locked = Boolean(presetSpeaker);
  const visibleSpeakers = category
    ? speakers.filter((speaker) => speaker.categories.some((item) => item.slug === category))
    : speakers;

  // Escape closes the dialog; the backdrop click below does the same.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const submit = () => {
    setLocalError(null);
    if (!selected) {
      setLocalError("ابتدا یک سخنران انتخاب کنید.");
      return;
    }
    void onSubmit({
      speakerUserId: selected.userId,
      initiativeId,
      requestedDate: date,
      requestedTime: time,
      message: message.trim(),
    });
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="دعوت سخنران"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-end justify-center bg-overlay p-4 sm:items-center"
    >
      <section
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-panel border border-border bg-popover text-popover-foreground shadow-dialog"
      >
        <header className="flex items-start gap-3 border-b border-divider bg-surface-muted/60 px-5 py-4">
          <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground">
            <Send className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-black text-foreground">دعوت سخنران</h2>
            <p className="mt-1 text-[11px] text-muted-foreground">سخنران را انتخاب و زمان برگزاری را ثبت کنید.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-icon-muted transition-colors hover:bg-hover hover:text-brand"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 no-scrollbar">
          {locked && selected ? (
            <section aria-label="سخنران انتخاب‌شده" className="rounded-card border border-brand-border bg-brand-muted/70 p-3">
              <div className="flex items-center gap-3">
                <SpeakerAvatar speaker={selected} className="h-11 w-11" />
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <strong className="truncate text-xs font-black text-foreground">{selected.name}</strong>
                    <SpeakerBadge verified={selected.verifiedSpeaker} />
                  </div>
                  {selected.expertise ? (
                    <p className="mt-0.5 truncate text-[10px] text-foreground-subtle">{selected.expertise}</p>
                  ) : null}
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-pill bg-surface px-2 py-1 text-[10px] font-black text-brand">
                  <Check aria-hidden="true" className="h-3 w-3" />
                  انتخاب‌شده
                </span>
              </div>
            </section>
          ) : (
            <section>
              <label className="block text-xs font-bold text-foreground-secondary">
                سخنران
                <span className="mt-1.5 flex items-center gap-2 rounded-control border border-input-border bg-input px-3">
                  <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-icon-muted" />
                  <input
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      onSearch?.(event.target.value);
                    }}
                    placeholder="جستجوی نام سخنران"
                    aria-label="جستجوی سخنران"
                    className="h-9 w-full bg-transparent text-xs text-foreground outline-none placeholder:text-placeholder"
                  />
                </span>
              </label>

              {categories.length ? (
                <div className="mt-2 flex gap-1.5 overflow-x-auto no-scrollbar" role="group" aria-label="فیلتر دسته‌بندی">
                  {[{ slug: "", name: "همه" }, ...categories].map((option) => {
                    const active = category === option.slug;
                    return (
                      <button
                        key={option.slug || "all"}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setCategory(option.slug)}
                        className={`inline-flex min-h-8 shrink-0 items-center rounded-pill border px-2.5 text-[10px] font-black transition-colors ${
                          active
                            ? "border-brand-border bg-selected text-selected-foreground"
                            : "border-border bg-surface text-muted-foreground hover:bg-hover hover:text-foreground"
                        }`}
                      >
                        {option.name}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              <div className="mt-2 max-h-52 overflow-y-auto rounded-control border border-border">
                {speakersLoading ? (
                  <p className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
                    <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                    در حال دریافت سخنرانان…
                  </p>
                ) : speakersError ? (
                  <p role="alert" className="py-6 text-center text-xs text-danger-foreground">{speakersError}</p>
                ) : visibleSpeakers.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">سخنرانی با این مشخصات پیدا نشد.</p>
                ) : (
                  <ul className="divide-y divide-divider">
                    {visibleSpeakers.map((speaker) => {
                      const active = selected?.userId === speaker.userId;
                      return (
                        <li key={speaker.userId}>
                          <button
                            type="button"
                            onClick={() => setSelected(speaker)}
                            aria-pressed={active}
                            className={`flex w-full items-center gap-3 px-3 py-2.5 text-right transition-colors ${active ? "bg-brand-muted" : "hover:bg-hover"}`}
                          >
                            <SpeakerAvatar speaker={speaker} />
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-1">
                                <strong className="truncate text-xs font-black text-foreground">{speaker.name}</strong>
                                <SpeakerBadge verified={speaker.verifiedSpeaker} />
                              </span>
                              {speaker.expertise ? (
                                <span className="mt-0.5 block truncate text-[10px] text-foreground-subtle">
                                  {speaker.expertise}
                                </span>
                              ) : null}
                            </span>
                            {active ? <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-brand" /> : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>
          )}

          <div className="mt-4 space-y-3">
            {/* Derived from the square's own profile and sent by the API — shown
                read-only so the inviter can confirm what the speaker will see. */}
            <div className="rounded-card border border-border bg-surface-muted p-3">
              <span className="flex items-center gap-1.5 text-[11px] font-black text-foreground-secondary">
                <MapPin aria-hidden="true" className="h-3.5 w-3.5 text-brand" />
                مکان برگزاری
              </span>
              <p className="mt-1.5 text-xs leading-6 text-foreground">{venue || "نشانی میدان شما ثبت نشده است."}</p>
              <p className="mt-1 text-[10px] text-foreground-subtle">این نشانی از پروفایل میدان شما برداشته می‌شود.</p>
            </div>

            {/* Persian pickers: the value stays an ISO date / 24h time for the API,
                but the inviter chooses it on the Jalali calendar. */}
            <div className="text-xs font-bold text-foreground-secondary">
              <span className="flex items-center gap-1.5">
                <CalendarDays aria-hidden="true" className="h-3.5 w-3.5 text-icon-muted" />
                تاریخ برگزاری
              </span>
              <div className="mt-1.5">
                <PersianDatePicker
                  value={date}
                  onChange={setDate}
                  allow="future"
                  ariaLabel="انتخاب تاریخ برگزاری"
                  placeholder="انتخاب تاریخ برگزاری"
                />
              </div>
            </div>

            <div className="text-xs font-bold text-foreground-secondary">
              <span className="flex items-center gap-1.5">
                <Clock aria-hidden="true" className="h-3.5 w-3.5 text-icon-muted" />
                ساعت برگزاری
              </span>
              <div className="mt-1.5">
                <PersianTimePicker value={time} onChange={setTime} ariaLabel="انتخاب ساعت برگزاری" />
              </div>
            </div>

            <label className="block text-xs font-bold text-foreground-secondary">
              پیام (اختیاری)
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={3}
                placeholder="توضیح کوتاه برای سخنران"
                className={`${fieldClass} resize-none`}
              />
            </label>
          </div>

          {localError || submitError ? (
            <p role="alert" className="mt-3 rounded-control bg-danger-surface px-4 py-2 text-sm font-bold text-danger-foreground">
              {localError || submitError}
            </p>
          ) : null}
        </div>

        <footer className="border-t border-divider bg-surface-muted/60 px-5 py-3.5">
          <button
            type="button"
            disabled={busy}
            onClick={submit}
            className="flex w-full items-center justify-center gap-2 rounded-control bg-brand py-2.5 text-xs font-black text-brand-foreground transition-colors hover:bg-brand-hover disabled:opacity-60"
          >
            {busy ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Send aria-hidden="true" className="h-4 w-4" />}
            {busy ? "در حال ارسال…" : "ثبت و ارسال دعوت‌نامه"}
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
