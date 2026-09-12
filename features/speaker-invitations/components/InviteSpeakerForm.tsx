"use client";

import Image from "next/image";
import { useState } from "react";
import { LoaderCircle, Search, Send, X } from "lucide-react";
import { SpeakerBadge } from "@/components/shared/SpeakerBadge";
import type { CreateInvitationInput, InvitableSpeaker } from "../types";

const fieldClass =
  "mt-1.5 w-full rounded-control border border-input-border bg-input px-3 py-2 text-xs text-foreground outline-none transition-colors placeholder:text-placeholder hover:border-input-border-hover focus:border-ring focus-visible:ring-2 focus-visible:ring-ring";

/** Today in the `YYYY-MM-DD` shape the API validates against. */
function today(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function InviteSpeakerForm({
  speakers,
  speakersLoading,
  speakersError,
  initiativeId,
  busy,
  onSearch,
  onClose,
  onSubmit,
}: {
  speakers: InvitableSpeaker[];
  speakersLoading: boolean;
  speakersError?: string | null;
  initiativeId?: string;
  busy?: boolean;
  onSearch: (query: string) => void;
  onClose: () => void;
  onSubmit: (input: CreateInvitationInput) => Promise<void> | void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<InvitableSpeaker | null>(null);
  const [location, setLocation] = useState("");
  const [date, setDate] = useState(today());
  const [time, setTime] = useState("21:00");
  const [message, setMessage] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = () => {
    setLocalError(null);
    if (!selected) {
      setLocalError("ابتدا یک سخنران انتخاب کنید.");
      return;
    }
    if (!location.trim()) {
      setLocalError("مکان برگزاری الزامی است.");
      return;
    }
    void onSubmit({
      speakerUserId: selected.userId,
      initiativeId,
      location: location.trim(),
      requestedDate: date,
      requestedTime: time,
      message: message.trim(),
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="دعوت سخنران"
      className="fixed inset-0 z-50 flex items-end justify-center bg-overlay p-4 sm:items-center"
    >
      <section className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-panel border border-border bg-popover p-5 text-popover-foreground shadow-dialog">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-black text-foreground">دعوت سخنران</h2>
            <p className="mt-1 text-xs text-muted-foreground">انتخاب سخنران و ثبت زمان و مکان</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="grid h-10 w-10 place-items-center rounded-control text-icon-muted transition-colors hover:bg-hover hover:text-brand"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Speaker selector — only linked speaker accounts are returned. */}
        <div className="mt-4">
          <label className="block text-xs font-bold text-foreground-secondary">
            سخنران
            <div className="mt-1.5 flex items-center gap-2 rounded-control border border-input-border bg-input px-3">
              <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-icon-muted" />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  onSearch(event.target.value);
                }}
                placeholder="جستجوی نام سخنران"
                aria-label="جستجوی سخنران"
                className="h-9 w-full bg-transparent text-xs text-foreground outline-none placeholder:text-placeholder"
              />
            </div>
          </label>

          <div className="mt-2 max-h-52 overflow-y-auto rounded-control border border-border">
            {speakersLoading ? (
              <p className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                در حال دریافت سخنرانان…
              </p>
            ) : speakersError ? (
              <p className="py-6 text-center text-xs text-danger-foreground">{speakersError}</p>
            ) : speakers.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">سخنرانی با این مشخصات پیدا نشد.</p>
            ) : (
              <ul className="divide-y divide-divider">
                {speakers.map((speaker) => {
                  const active = selected?.userId === speaker.userId;
                  return (
                    <li key={speaker.userId}>
                      <button
                        type="button"
                        onClick={() => setSelected(speaker)}
                        aria-pressed={active}
                        className={`flex w-full items-center gap-3 px-3 py-2.5 text-right transition-colors ${active ? "bg-brand-muted" : "hover:bg-hover"}`}
                      >
                        {speaker.avatarUrl ? (
                          <Image
                            src={speaker.avatarUrl}
                            alt=""
                            width={36}
                            height={36}
                            unoptimized={speaker.avatarUrl.startsWith("http")}
                            className="h-9 w-9 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <span
                            aria-hidden="true"
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-muted text-[11px] font-black text-icon"
                          >
                            {speaker.name.slice(0, 1)}
                          </span>
                        )}
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
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="col-span-2 block text-xs font-bold text-foreground-secondary">
            مکان برگزاری
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="میدان، پایگاه یا نشانی"
              className={fieldClass}
            />
          </label>
          <label className="block text-xs font-bold text-foreground-secondary">
            تاریخ
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className={fieldClass} dir="ltr" />
          </label>
          <label className="block text-xs font-bold text-foreground-secondary">
            ساعت
            <input type="time" value={time} onChange={(event) => setTime(event.target.value)} className={fieldClass} dir="ltr" />
          </label>
          <label className="col-span-2 block text-xs font-bold text-foreground-secondary">
            پیام (اختیاری)
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={3}
              placeholder="توضیح کوتاه برای سخنران"
              className={fieldClass}
            />
          </label>
        </div>

        {localError ? (
          <p className="mt-3 rounded-control bg-danger-surface px-3 py-2 text-xs font-bold text-danger-foreground">{localError}</p>
        ) : null}

        <button
          type="button"
          disabled={busy}
          onClick={submit}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-control bg-brand py-2.5 text-xs font-black text-brand-foreground transition-colors hover:bg-brand-hover disabled:opacity-60"
        >
          {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          ثبت و ارسال دعوت‌نامه
        </button>
      </section>
    </div>
  );
}
