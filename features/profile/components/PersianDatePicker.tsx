"use client";

import { CalendarDays, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const TEHRAN_TIME_ZONE = "Asia/Tehran";
const DAY_MS = 86_400_000;
const MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;
const WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"] as const;

const persianPartsFormatter = new Intl.DateTimeFormat(
  "en-US-u-ca-persian-nu-latn",
  {
    timeZone: TEHRAN_TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  },
);

const gregorianPartsFormatter = new Intl.DateTimeFormat(
  "en-US-u-ca-gregory-nu-latn",
  {
    timeZone: TEHRAN_TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  },
);

function parts(formatter: Intl.DateTimeFormat, date: Date) {
  const values = formatter.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(values.find((part) => part.type === type)?.value ?? 0);

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
  };
}

function persianDate(date: Date) {
  return parts(persianPartsFormatter, date);
}

function isoDateInTehran(date: Date) {
  const value = parts(gregorianPartsFormatter, date);
  return `${value.year.toString().padStart(4, "0")}-${value.month
    .toString()
    .padStart(2, "0")}-${value.day.toString().padStart(2, "0")}`;
}

function isoToDate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toPersianNumber(value: number) {
  return new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(value);
}

function gregorianFromPersian(year: number, month: number, day: number) {
  // Intl در مرورگر تبدیل میلادی -> شمسی را با دقت انجام می‌دهد. برای تبدیل معکوس
  // در بازه همان سال میلادی جست‌وجو می‌کنیم تا وابستگی جدیدی به پروژه اضافه نشود.
  const start = Date.UTC(year + 621, 2, 1);

  for (let offset = 0; offset < 400; offset += 1) {
    const candidate = new Date(start + offset * DAY_MS);
    const value = persianDate(candidate);
    if (value.year === year && value.month === month && value.day === day) {
      return candidate;
    }
  }

  return null;
}

function monthLength(year: number, month: number) {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  return gregorianFromPersian(year, 12, 30) ? 30 : 29;
}

function shiftMonth(year: number, month: number, delta: number) {
  const index = year * 12 + (month - 1) + delta;
  return {
    year: Math.floor(index / 12),
    month: ((index % 12) + 12) % 12 + 1,
  };
}

function formattedPersianDate(value?: string) {
  const date = isoToDate(value);
  if (!date) return "انتخاب تاریخ شمسی";
  const selected = persianDate(date);
  return `${toPersianNumber(selected.day)} ${MONTHS[selected.month - 1]} ${toPersianNumber(selected.year)}`;
}

export function PersianDatePicker({
  value,
  onChange,
}: {
  value?: string;
  onChange: (value: string) => void;
}) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const selectedDate = useMemo(() => isoToDate(value), [value]);
  const selectedPersian = useMemo(
    () => (selectedDate ? persianDate(selectedDate) : null),
    [selectedDate],
  );
  const today = useMemo(() => new Date(), []);
  const todayPersian = useMemo(() => persianDate(today), [today]);
  const todayIso = useMemo(() => isoDateInTehran(today), [today]);
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(
    selectedPersian?.year ?? todayPersian.year,
  );
  const [viewMonth, setViewMonth] = useState(
    selectedPersian?.month ?? todayPersian.month,
  );

  useEffect(() => {
    if (!open) return;
    const target = selectedPersian ?? todayPersian;
    setViewYear(target.year);
    setViewMonth(target.month);
  }, [open, selectedPersian, todayPersian]);

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

  const firstGregorian = useMemo(
    () => gregorianFromPersian(viewYear, viewMonth, 1),
    [viewYear, viewMonth],
  );
  const length = useMemo(
    () => monthLength(viewYear, viewMonth),
    [viewYear, viewMonth],
  );
  const firstWeekday = firstGregorian
    ? (firstGregorian.getUTCDay() + 1) % 7
    : 0;

  const move = (delta: number) => {
    const next = shiftMonth(viewYear, viewMonth, delta);
    setViewYear(next.year);
    setViewMonth(next.month);
  };

  const chooseDay = (day: number) => {
    if (!firstGregorian) return;
    const date = new Date(firstGregorian.getTime() + (day - 1) * DAY_MS);
    const iso = date.toISOString().slice(0, 10);
    if (iso > todayIso) return;
    onChange(iso);
    setOpen(false);
  };

  const chooseToday = () => {
    onChange(todayIso);
    setOpen(false);
  };

  return (
    <span ref={rootRef} dir="rtl" className="relative block w-full font-[inherit]">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`flex min-h-12 w-full items-center gap-2 rounded-control border bg-input px-3 text-right text-sm outline-none transition-colors ${
          open
            ? "border-brand ring-2 ring-brand/10"
            : "border-input-border hover:border-border"
        }`}
      >
        <CalendarDays aria-hidden="true" className="h-4 w-4 shrink-0 text-brand" />
        <span className={`min-w-0 flex-1 ${value ? "text-foreground" : "text-foreground-subtle"}`}>
          {formattedPersianDate(value)}
        </span>
        {value ? (
          <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-success" />
        ) : null}
      </button>

      {open ? (
        <span
          role="dialog"
          aria-label="انتخاب تاریخ شروع فعالیت میدان"
          className="absolute inset-x-0 top-full z-50 mt-2 block rounded-panel border border-border bg-popover p-3 text-popover-foreground shadow-dialog"
        >
          <span className="flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="ماه قبل"
              onClick={() => move(-1)}
              className="grid h-10 w-10 place-items-center rounded-full text-icon transition-colors hover:bg-hover"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <span className="min-w-0 text-center">
              <strong className="block text-sm font-black text-foreground">
                {MONTHS[viewMonth - 1]}
              </strong>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">
                {toPersianNumber(viewYear)}
              </span>
            </span>

            <button
              type="button"
              aria-label="ماه بعد"
              onClick={() => move(1)}
              className="grid h-10 w-10 place-items-center rounded-full text-icon transition-colors hover:bg-hover"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </span>

          <span className="mt-2 grid grid-cols-7 gap-1 border-t border-divider pt-3">
            {WEEKDAYS.map((weekday, index) => (
              <span
                key={`${weekday}-${index}`}
                className={`grid h-8 place-items-center text-[10px] font-bold ${
                  index === 6 ? "text-danger" : "text-muted-foreground"
                }`}
              >
                {weekday}
              </span>
            ))}

            {Array.from({ length: firstWeekday }).map((_, index) => (
              <span key={`empty-${index}`} aria-hidden="true" className="h-9" />
            ))}

            {Array.from({ length }, (_, index) => index + 1).map((day) => {
              if (!firstGregorian) return null;
              const date = new Date(firstGregorian.getTime() + (day - 1) * DAY_MS);
              const iso = date.toISOString().slice(0, 10);
              const selected = iso === value;
              const isToday = iso === todayIso;
              const disabled = iso > todayIso;
              const weekday = (date.getUTCDay() + 1) % 7;

              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  aria-label={`${toPersianNumber(day)} ${MONTHS[viewMonth - 1]} ${toPersianNumber(viewYear)}`}
                  aria-pressed={selected}
                  onClick={() => chooseDay(day)}
                  className={`grid h-9 place-items-center rounded-full text-xs font-bold transition-colors ${
                    selected
                      ? "bg-brand text-brand-foreground shadow-sm"
                      : disabled
                        ? "cursor-not-allowed text-disabled-foreground opacity-40"
                        : isToday
                          ? "border border-brand-border bg-brand-muted text-brand"
                          : weekday === 6
                            ? "text-danger hover:bg-hover"
                            : "text-foreground hover:bg-hover"
                  }`}
                >
                  {toPersianNumber(day)}
                </button>
              );
            })}
          </span>

          <span className="mt-3 flex items-center justify-between border-t border-divider pt-3">
            <button
              type="button"
              onClick={chooseToday}
              className="rounded-pill px-3 py-2 text-[11px] font-black text-brand transition-colors hover:bg-brand-muted"
            >
              امروز
            </button>
            {value ? (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="rounded-pill px-3 py-2 text-[11px] font-bold text-foreground-subtle transition-colors hover:bg-hover hover:text-foreground"
              >
                پاک کردن تاریخ
              </button>
            ) : (
              <span className="text-[10px] text-muted-foreground">تقویم هجری شمسی</span>
            )}
          </span>
        </span>
      ) : null}
    </span>
  );
}
