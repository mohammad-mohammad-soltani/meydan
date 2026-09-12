"use client";

import { Check, Clock } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const TEHRAN_TIME_ZONE = "Asia/Tehran";
const DEFAULT_TIME = "21:00";
const HOURS = Array.from({ length: 24 }, (_, index) => index);

function toPersianNumber(value: number) {
  return new Intl.NumberFormat("fa-IR", {
    useGrouping: false,
    minimumIntegerDigits: 2,
  }).format(value);
}

/** `"21:00"` -> `"۲۱:۰۰"`; used by callers that render schedule times. */
export function formatPersianTime(value: string) {
  const parsed = parseTime(value);
  return parsed ? `${toPersianNumber(parsed.hour)}:${toPersianNumber(parsed.minute)}` : value;
}

/** `"21:00"` -> `{ hour: 21, minute: 0 }`; `null` for anything malformed. */
function parseTime(value?: string) {
  const match = /^(\d{1,2}):(\d{1,2})$/.exec((value ?? "").trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

function formatTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** Current wall-clock time in Tehran, so the "now" shortcut matches the venue. */
function tehranNow() {
  const parts = new Intl.DateTimeFormat("en-US-u-nu-latn", {
    timeZone: TEHRAN_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return formatTime(read("hour"), read("minute"));
}

/**
 * 24-hour Persian time picker. The value stays a plain `"HH:mm"` string — the
 * shape the API validates — while the digits and shortcuts are Persian.
 */
export function PersianTimePicker({
  value = DEFAULT_TIME,
  onChange,
  ariaLabel = "انتخاب ساعت",
  placeholder = "انتخاب ساعت",
  minuteStep = 5,
  presets = ["10:00", "16:00", "18:00", "20:00", "21:00", "22:00"],
}: {
  value?: string;
  onChange: (value: string) => void;
  /** Accessible name of the picker popover. */
  ariaLabel?: string;
  /** Shown while no time has been chosen yet. */
  placeholder?: string;
  /** Minute granularity of the quick list. */
  minuteStep?: number;
  /** One-tap times; the exact grids below stay available. */
  presets?: string[];
}) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const hasValue = Boolean(parseTime(value));
  const selected = parseTime(value) ?? parseTime(DEFAULT_TIME)!;
  const minutes = useMemo(
    () =>
      Array.from({ length: Math.ceil(60 / minuteStep) }, (_, index) => index * minuteStep),
    [minuteStep],
  );

  useEffect(() => {
    if (!open) return;

    const closeOnOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const pick = (hour: number, minute: number, close = false) => {
    onChange(formatTime(hour, minute));
    if (close) setOpen(false);
  };

  const cellClass = (active: boolean) =>
    `grid h-9 place-items-center rounded-control text-[11px] font-bold tabular-nums transition-colors ${
      active
        ? "bg-brand text-brand-foreground shadow-sm"
        : "text-foreground hover:bg-hover"
    }`;

  return (
    <span ref={rootRef} dir="rtl" className="relative block w-full font-[inherit]">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`flex min-h-12 w-full items-center gap-2 rounded-control border bg-input px-3 text-right text-sm outline-none transition-colors ${
          open ? "border-brand ring-2 ring-brand/10" : "border-input-border hover:border-border"
        }`}
      >
        <Clock aria-hidden="true" className="h-4 w-4 shrink-0 text-brand" />
        <span className={`min-w-0 flex-1 tabular-nums ${hasValue ? "text-foreground" : "text-foreground-subtle"}`}>
          {hasValue ? formatPersianTime(value as string) : placeholder}
        </span>
        {hasValue ? <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-success" /> : null}
      </button>

      {open ? (
        <span
          role="dialog"
          aria-label={ariaLabel}
          className="absolute inset-x-0 top-full z-[9999] mt-2 block rounded-panel border border-border bg-popover p-3 text-popover-foreground shadow-dialog"
        >
          {presets.length ? (
            <span className="flex flex-wrap gap-1.5">
              {presets.map((preset) => {
                const active = preset === value;
                return (
                  <button
                    key={preset}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      onChange(preset);
                      setOpen(false);
                    }}
                    className={`rounded-pill border px-3 py-1.5 text-[11px] font-black tabular-nums transition-colors ${
                      active
                        ? "border-brand bg-brand text-brand-foreground"
                        : "border-border bg-surface text-foreground-secondary hover:border-brand-border hover:bg-hover hover:text-foreground"
                    }`}
                  >
                    {formatPersianTime(preset)}
                  </button>
                );
              })}
            </span>
          ) : null}

          <span className="mt-3 flex gap-3 border-t border-divider pt-3">
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-bold text-muted-foreground">ساعت</span>
              <span className="mt-1.5 grid max-h-40 grid-cols-4 gap-1 overflow-y-auto no-scrollbar">
                {HOURS.map((hour) => (
                  <button
                    key={hour}
                    type="button"
                    aria-pressed={hour === selected.hour}
                    aria-label={`ساعت ${toPersianNumber(hour)}`}
                    onClick={() => pick(hour, selected.minute)}
                    className={cellClass(hour === selected.hour)}
                  >
                    {toPersianNumber(hour)}
                  </button>
                ))}
              </span>
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-bold text-muted-foreground">دقیقه</span>
              <span className="mt-1.5 grid max-h-40 grid-cols-4 gap-1 overflow-y-auto no-scrollbar">
                {minutes.map((minute) => (
                  <button
                    key={minute}
                    type="button"
                    aria-pressed={minute === selected.minute}
                    aria-label={`دقیقه ${toPersianNumber(minute)}`}
                    onClick={() => pick(selected.hour, minute, true)}
                    className={cellClass(minute === selected.minute)}
                  >
                    {toPersianNumber(minute)}
                  </button>
                ))}
              </span>
            </span>
          </span>

          <span className="mt-3 flex items-center justify-between border-t border-divider pt-3">
            <button
              type="button"
              onClick={() => {
                onChange(tehranNow());
                setOpen(false);
              }}
              className="rounded-pill px-3 py-2 text-[11px] font-black text-brand transition-colors hover:bg-brand-muted"
            >
              اکنون
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-pill px-3 py-2 text-[11px] font-bold text-foreground-subtle transition-colors hover:bg-hover hover:text-foreground"
            >
              بستن
            </button>
          </span>
        </span>
      ) : null}
    </span>
  );
}
