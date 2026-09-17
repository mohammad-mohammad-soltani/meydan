"use client";

import { ArrowDown, ArrowUp, CalendarDays, Clock, Plus, Trash2 } from "lucide-react";
import { PersianDatePicker } from "@/components/shared/PersianDatePicker";
import { PersianTimePicker } from "@/components/shared/PersianTimePicker";
import { joinAdminDateTime, splitAdminDateTime } from "../lib/datetime";
import type { ProgramScheduleRow } from "../types";
import { fieldClass, labelClass, secondaryButtonClass } from "./styles";

const EMPTY_ROW: ProgramScheduleRow = {
  title: "",
  description: "",
  startsAt: "",
  endsAt: "",
  locationLabel: "",
  status: "published",
};

/**
 * Repeatable schedule rows written to `meydan_schedule`.
 *
 * Dates are chosen on the Jalali calendar and stored as the Gregorian
 * `YYYY-MM-DD`/`HH:mm` the API expects — the project-wide convention. Rows
 * without a title are dropped by `normalizeSchedule` before submit, so an
 * accidentally-added empty row never becomes broken meta.
 */
export function ScheduleRows({
  rows,
  onChange,
  disabled = false,
}: {
  rows: ProgramScheduleRow[];
  onChange: (rows: ProgramScheduleRow[]) => void;
  disabled?: boolean;
}) {
  const update = (index: number, patch: Partial<ProgramScheduleRow>) => {
    onChange(rows.map((row, position) => (position === index ? { ...row, ...patch } : row)));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    const [row] = next.splice(index, 1);
    next.splice(target, 0, row);
    onChange(next);
  };

  return (
    <section aria-label="برنامه اجراها" className="space-y-3">
      {rows.length === 0 ? (
        <p className="rounded-control border border-dashed border-border bg-surface-muted/40 px-3 py-4 text-center text-[11px] text-muted-foreground">
          هنوز اجرایی ثبت نشده است.
        </p>
      ) : null}

      {rows.map((row, index) => {
        const start = splitAdminDateTime(row.startsAt);
        const end = splitAdminDateTime(row.endsAt);
        return (
          <fieldset
            key={index}
            className="rounded-card border border-border bg-surface p-3"
          >
            <legend className="px-1 text-[10px] font-black text-muted-foreground">
              اجرای {index + 1}
            </legend>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className={labelClass}>عنوان اجرا</span>
                <input
                  value={row.title}
                  disabled={disabled}
                  onChange={(event) => update(index, { title: event.target.value })}
                  placeholder="مثال: نشست تخصصی"
                  className={fieldClass}
                />
              </label>

              <div>
                <span className={labelClass}>
                  <CalendarDays aria-hidden="true" className="me-1 inline h-3 w-3 text-icon-muted" />
                  تاریخ شروع
                </span>
                <div className="mt-1.5">
                  <PersianDatePicker
                    value={start.date}
                    onChange={(date) => update(index, { startsAt: joinAdminDateTime(date, start.time || "09:00") })}
                    allow="any"
                    ariaLabel={`تاریخ شروع اجرای ${index + 1}`}
                  />
                </div>
              </div>

              <div>
                <span className={labelClass}>
                  <Clock aria-hidden="true" className="me-1 inline h-3 w-3 text-icon-muted" />
                  ساعت شروع
                </span>
                <div className="mt-1.5">
                  <PersianTimePicker
                    value={start.time}
                    onChange={(time) => update(index, { startsAt: joinAdminDateTime(start.date, time) })}
                    ariaLabel={`ساعت شروع اجرای ${index + 1}`}
                  />
                </div>
              </div>

              <div>
                <span className={labelClass}>تاریخ پایان (اختیاری)</span>
                <div className="mt-1.5">
                  <PersianDatePicker
                    value={end.date}
                    onChange={(date) => update(index, { endsAt: joinAdminDateTime(date, end.time || "23:59") })}
                    allow="any"
                    ariaLabel={`تاریخ پایان اجرای ${index + 1}`}
                  />
                </div>
              </div>

              <div>
                <span className={labelClass}>ساعت پایان (اختیاری)</span>
                <div className="mt-1.5">
                  <PersianTimePicker
                    value={end.time}
                    onChange={(time) => update(index, { endsAt: joinAdminDateTime(end.date, time) })}
                    ariaLabel={`ساعت پایان اجرای ${index + 1}`}
                  />
                </div>
              </div>

              <label className="block sm:col-span-2">
                <span className={labelClass}>محل برگزاری</span>
                <input
                  value={row.locationLabel}
                  disabled={disabled}
                  onChange={(event) => update(index, { locationLabel: event.target.value })}
                  className={fieldClass}
                />
              </label>

              <label className="block sm:col-span-2">
                <span className={labelClass}>توضیح</span>
                <textarea
                  value={row.description}
                  rows={2}
                  disabled={disabled}
                  onChange={(event) => update(index, { description: event.target.value })}
                  className={`${fieldClass} resize-none`}
                />
              </label>
            </div>

            <div className="mt-2.5 flex items-center justify-end gap-1.5">
              <button
                type="button"
                disabled={disabled || index === 0}
                onClick={() => move(index, -1)}
                aria-label={`انتقال اجرای ${index + 1} به بالا`}
                className="grid h-8 w-8 place-items-center rounded-control border border-border text-icon-muted transition-colors hover:bg-hover disabled:opacity-40"
              >
                <ArrowUp aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={disabled || index === rows.length - 1}
                onClick={() => move(index, 1)}
                aria-label={`انتقال اجرای ${index + 1} به پایین`}
                className="grid h-8 w-8 place-items-center rounded-control border border-border text-icon-muted transition-colors hover:bg-hover disabled:opacity-40"
              >
                <ArrowDown aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(rows.filter((_, position) => position !== index))}
                aria-label={`حذف اجرای ${index + 1}`}
                className="grid h-8 w-8 place-items-center rounded-control border border-border text-danger-foreground transition-colors hover:bg-danger-surface disabled:opacity-40"
              >
                <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            </div>
          </fieldset>
        );
      })}

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange([...rows, { ...EMPTY_ROW }])}
        className={`${secondaryButtonClass} min-h-9`}
      >
        <Plus aria-hidden="true" className="h-3.5 w-3.5" />
        افزودن اجرا
      </button>
    </section>
  );
}
